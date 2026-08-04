import os, requests, time, json, traceback
from datetime import datetime

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_SERVICE_KEY = os.environ['SUPABASE_SERVICE_KEY']
PRODUCT_ID = os.environ['PRODUCT_ID']
ANTHROPIC_API_KEY = os.environ['ANTHROPIC_API_KEY']
HEADERS = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
    'Content-Type': 'application/json'
}

def poll():
    print(f"Polling jobs for product {PRODUCT_ID}...")
    url = f"{SUPABASE_URL}/rest/v1/jobs"
    params = {
        'status': 'eq.pending',
        'job_type': 'eq.process_upload',
        'product_id': f'eq.{PRODUCT_ID}',
        'order': 'created_at.asc',
        'limit': 1
    }
    resp = requests.get(url, headers=HEADERS, params=params)
    if resp.status_code != 200:
        print(f"Error fetching jobs: {resp.text}")
        return
    jobs = resp.json()
    if not jobs:
        return
    for job in jobs:
        job_id = job['id']
        customer_id = job['customer_id']
        print(f"Processing job {job_id} for customer {customer_id}")
        try:
            # Download file from uploads bucket
            file_path = job.get('source_file_path')
            if not file_path:
                raise ValueError("No source_file_path in job")
            file_url = f"{SUPABASE_URL}/storage/v1/object/authenticated/uploads/{file_path}"
            file_resp = requests.get(file_url, headers=HEADERS)
            if file_resp.status_code != 200:
                raise Exception(f"Failed to download file: {file_resp.status_code} {file_resp.text}")
            file_content = file_resp.content  # binary
            # Import and run processor
            import processor
            result = processor.process(file_content, file_path)  # assume returns dict with title, status, details, etc.
            # Write a record
            record = {
                "product_id": PRODUCT_ID,
                "customer_id": customer_id,
                "title": result.get("title", "Pricelist Update"),
                "status": result.get("status", "current:good"),
                "details": json.dumps(result.get("details", {})),
                "source_file_path": file_path,
                "due_date": result.get("due_date"),
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            rec_resp = requests.post(f"{SUPABASE_URL}/rest/v1/records", headers=HEADERS, json=record)
            if rec_resp.status_code not in [200, 201]:
                print(f"Failed to insert record: {rec_resp.text}")
            # Upload result file (if any)
            result_file_path = None
            if result.get("output_file"):
                output_filename = f"result_{job_id}.txt"
                upload_url = f"{SUPABASE_URL}/storage/v1/object/authenticated/results/{output_filename}"
                up_resp = requests.post(upload_url, headers={**HEADERS, 'Content-Type': 'application/octet-stream'}, data=result["output_file"])
                if up_resp.status_code in [200, 201]:
                    result_file_path = output_filename
                else:
                    print(f"Result upload failed: {up_resp.text}")
            # Update job as completed
            update_payload = {
                "status": "completed",
                "output_file_path": result_file_path,
                "result_summary": "Processing completed successfully.",
                "completed_at": datetime.utcnow().isoformat()
            }
            patch_resp = requests.patch(f"{SUPABASE_URL}/rest/v1/jobs?id=eq.{job_id}", headers=HEADERS, json=update_payload)
            print(f"Job update status: {patch_resp.status_code}")
            # Send notification
            try:
                notif = {
                    "product_id": PRODUCT_ID,
                    "customer_id": customer_id,
                    "title": "Processing complete",
                    "body": "Your upload has been processed successfully.",
                    "type": "success",
                    "read": False
                }
                requests.post(f"{SUPABASE_URL}/rest/v1/notifications", headers=HEADERS, json=notif)
            except Exception as e:
                print(f"Notification failed: {e}")
        except Exception as e:
            traceback.print_exc()
            # Update job as failed
            update_payload = {
                "status": "failed",
                "result_summary": str(e),
                "completed_at": datetime.utcnow().isoformat()
            }
            requests.patch(f"{SUPABASE_URL}/rest/v1/jobs?id=eq.{job_id}", headers=HEADERS, json=update_payload)
            try:
                notif = {
                    "product_id": PRODUCT_ID,
                    "customer_id": customer_id,
                    "title": "Processing failed",
                    "body": "There was an error processing your upload.",
                    "type": "error",
                    "read": False
                }
                requests.post(f"{SUPABASE_URL}/rest/v1/notifications", headers=HEADERS, json=notif)
            except Exception as e2:
                print(f"Notification failed: {e2}")

if __name__ == '__main__':
    while True:
        poll()
        time.sleep(60)
