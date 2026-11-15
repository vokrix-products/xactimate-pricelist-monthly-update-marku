import os, requests, time, json, traceback, datetime
from datetime import datetime as dt_cls
import processor

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_SERVICE_KEY = os.environ['SUPABASE_SERVICE_KEY']
PRODUCT_ID = os.environ['PRODUCT_ID']
HEADERS = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
    'Content-Type': 'application/json'
}
# Upsert: same (product_id, customer_id, item_code) overwrites instead of duplicating.
# Requires the unique index records_product_customer_item_uniq (applied 2026-11-15).
UPSERT_HEADERS = dict(HEADERS)
UPSERT_HEADERS['Prefer'] = 'resolution=merge-duplicates,return=minimal'


def write_records(customer_id, records, file_path):
    """Upsert records. Returns (ok_count, error_messages)."""
    ok, errs = 0, []
    for r in records:
        payload = {
            "product_id": PRODUCT_ID,
            "customer_id": customer_id,
            "title": r.get("title", "Unknown"),
            "status": r.get("status", "current:good"),
            "details": r.get("details", {}),
            "source_file_path": file_path,
            "due_date": r.get("due_date"),
        }
        try:
            resp = requests.post(
                f"{SUPABASE_URL}/rest/v1/records",
                headers=UPSERT_HEADERS,
                params={"on_conflict": "product_id,customer_id,item_code"},
                json=payload,
                timeout=30,
            )
            if resp.status_code in (200, 201, 204):
                ok += 1
            else:
                errs.append(f"{resp.status_code}: {resp.text[:300]}")
        except Exception as e:
            errs.append(str(e))
    return ok, errs


def monthly_refresh():
    """
    Re-evaluate every pricelist item against the current month.
    Items whose details.last_updated is not in the current month become
    outdated:critical with a due_date of today; current items become current:good.
    Runs at most once per calendar month per product.
    """
    ym = dt_cls.utcnow().strftime('%Y-%m')
    already = requests.get(
        f"{SUPABASE_URL}/rest/v1/records",
        headers=HEADERS,
        params={"product_id": f"eq.{PRODUCT_ID}",
                "details->>last_checked": f"eq.{ym}",
                "select": "id", "limit": 1},
        timeout=30,
    )
    if already.status_code == 200 and already.json():
        return

    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/records",
        headers=HEADERS,
        params={"product_id": f"eq.{PRODUCT_ID}", "select": "id,details,status"},
        timeout=30,
    )
    if resp.status_code != 200:
        print(f"monthly_refresh: fetch failed {resp.status_code}: {resp.text[:300]}")
        return

    today = datetime.date.today()
    updated = 0
    for row in resp.json():
        details = row.get("details") or {}
        last_updated = (details.get("last_updated") or "").strip()
        status = "outdated:critical"
        due_date = today.isoformat()
        if last_updated:
            try:
                lu = dt_cls.strptime(last_updated, '%Y-%m-%d').date()
                if lu.month == today.month and lu.year == today.year:
                    status = "current:good"
                    due_date = None
            except (ValueError, TypeError):
                status = "outdated:critical"
        details["last_checked"] = ym
        r = requests.patch(
            f"{SUPABASE_URL}/rest/v1/records?id=eq.{row['id']}",
            headers=UPSERT_HEADERS,
            json={"status": status, "due_date": due_date, "details": details},
            timeout=30,
        )
        if r.status_code in (200, 204):
            updated += 1
        else:
            print(f"monthly_refresh: patch {row['id']} failed {r.status_code}: {r.text[:200]}")
    print(f"monthly_refresh {ym}: {updated} records re-evaluated")


def poll():
    print(f"Polling jobs for product {PRODUCT_ID}...")
    resp = requests.get(f"{SUPABASE_URL}/rest/v1/jobs", headers=HEADERS, params={
        'status': 'eq.pending', 'job_type': 'eq.process_upload',
        'product_id': f'eq.{PRODUCT_ID}', 'order': 'created_at.asc', 'limit': 1
    })
    jobs = resp.json() if resp.status_code == 200 else []
    for job in jobs:
        job_id = job['id']
        customer_id = job['customer_id']
        print(f"Processing job {job_id}")
        # Mark as processing immediately to prevent reprocessing
        requests.patch(f"{SUPABASE_URL}/rest/v1/jobs?id=eq.{job_id}", headers=HEADERS, json={"status": "processing"})
        try:
            file_path = job.get('input_file_path')
            if not file_path:
                raise ValueError("No input_file_path in job")
            file_url = f"{SUPABASE_URL}/storage/v1/object/uploads/{file_path}"
            file_resp = requests.get(file_url, headers=HEADERS)
            if file_resp.status_code != 200:
                raise Exception(f"Failed to download file: {file_resp.status_code}")
            records = processor.process_file(file_resp.content)
            written, errs = write_records(customer_id, records, file_path)
            if errs and written == 0:
                raise Exception(f"All {len(errs)} record writes failed: {errs[0]}")
            summary = f"Processed {len(records)} records ({written} upserted)."
            if errs:
                summary += f" {len(errs)} failed: {errs[0]}"
            requests.patch(f"{SUPABASE_URL}/rest/v1/jobs?id=eq.{job_id}", headers=HEADERS, json={
                "status": "completed", "result_summary": summary,
                "completed_at": dt_cls.utcnow().isoformat()
            })
            print(f"Job {job_id} complete: {written}/{len(records)} upserted")
        except Exception as e:
            traceback.print_exc()
            requests.patch(f"{SUPABASE_URL}/rest/v1/jobs?id=eq.{job_id}", headers=HEADERS, json={
                "status": "failed", "result_summary": str(e),
                "completed_at": dt_cls.utcnow().isoformat()
            })


if __name__ == '__main__':
    while True:
        try:
            monthly_refresh()
        except Exception:
            traceback.print_exc()
        poll()
        time.sleep(60)
