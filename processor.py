import csv
import datetime
import io

def process_file(file_bytes: bytes) -> list[dict]:
    """
    Process an Xactimate pricelist CSV file bytes and extract line-item records
    with status (current:good or outdated:critical) and applied markup.
    """
    # Decode bytes to text; assume UTF-8, fallback to latin-1
    try:
        text = file_bytes.decode('utf-8')
    except UnicodeDecodeError:
        text = file_bytes.decode('latin-1')

    # Parse CSV using DictReader
    reader = csv.DictReader(io.StringIO(text))
    records = []
    today = datetime.date.today()
    current_month = today.month
    current_year = today.year

    for row in reader:
        # Extract fields; use first column as title if no explicit header mapping
        # The CSV must have headers: ItemName, ItemCode, Category, BasePrice, MarkupPercent, LastUpdated
        # If headers missing, fall back to positional guessing (first column = title)
        title = row.get('ItemName') or row.get(list(row.keys())[0] if row else '')
        item_code = row.get('ItemCode', '')
        category = row.get('Category', '')
        base_price_str = row.get('BasePrice', '0')
        markup_str = row.get('MarkupPercent', '0')
        last_updated_str = row.get('LastUpdated', '')

        # Parse numbers
        try:
            base_price = float(base_price_str)
        except (ValueError, TypeError):
            base_price = 0.0
        try:
            markup_percent = float(markup_str)
        except (ValueError, TypeError):
            markup_percent = 0.0

        final_price = round(base_price * (1 + markup_percent / 100), 2)

        # Parse last updated date, default to oldest for status calculation
        status = "outdated:critical"
        due_date = None
        if last_updated_str:
            try:
                last_updated_dt = datetime.datetime.strptime(last_updated_str, '%Y-%m-%d').date()
                # Determine status: good if last updated this month
                if last_updated_dt.month == current_month and last_updated_dt.year == current_year:
                    status = "current:good"
                # Optionally set due_date for outdated items (today)
                if status == "outdated:critical":
                    due_date = today.isoformat()
            except (ValueError, TypeError):
                # Invalid date format, treat as outdated
                status = "outdated:critical"
                due_date = today.isoformat()

        records.append({
            "title": title.strip() if title else "Unknown Item",
            "status": status,
            "details": {
                "item_code": item_code.strip(),
                "category": category.strip(),
                "base_price": base_price,
                "markup_percent": markup_percent,
                "final_price": final_price,
                "last_updated": last_updated_str
            },
            "due_date": due_date
        })

    return records
