import os, requests, time, json, traceback
from datetime import datetime
import processor

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_SERVICE_KEY = os.environ['SUPABASE_SERVICE_KEY']
PRODUCT_ID = os.environ['PRODUCT_ID']
HEADERS = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
    'Content-Type': 'application/json'
}

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
            for r in records:
                requests.post(f"{SUPABASE_URL}/rest/v1/records", headers=HEADERS, json={
                    "product_id": PRODUCT_ID, "customer_id": customer_id,
                    "title": r.get("title", "Unknown"),
                    "status": r.get("status", "current:good"),
                    "details": r.get("details", {}),
                    "source_file_path": file_path,
                    "due_date": r.get("due_date")
                })
            requests.patch(f"{SUPABASE_URL}/rest/v1/jobs?id=eq.{job_id}", headers=HEADERS, json={
                "status": "completed", "result_summary": f"Processed {len(records)} records.",
                "completed_at": datetime.utcnow().isoformat()
            })
            print(f"Job {job_id} complete: {len(records)} records")
        except Exception as e:
            traceback.print_exc()
            requests.patch(f"{SUPABASE_URL}/rest/v1/jobs?id=eq.{job_id}", headers=HEADERS, json={
                "status": "failed", "result_summary": str(e),
                "completed_at": datetime.utcnow().isoformat()
            })

if __name__ == '__main__':
    while True:
        poll()
        time.sleep(60)
