from processor import process_file

def main():
    # Hardcoded CSV test data (two line items)
    csv_bytes = (
        b"ItemName,ItemCode,Category,BasePrice,MarkupPercent,LastUpdated\n"
        b"Water Extraction,W001,Water Damage,150.00,20,2024-01-15\n"
        b"Drywall Repair,D002,Structural,85.50,15,2024-03-27\n"
    )

    records = process_file(csv_bytes)
    print(f"Extracted {len(records)} records:")
    for rec in records:
        print(rec)

    # Validate presence and status values
    assert isinstance(records, list), "Result must be a list"
    assert len(records) == 2, "Expected exactly 2 records"
    for rec in records:
        assert rec["status"] in ["current:good", "outdated:critical"], f"Invalid status: {rec['status']}"
        assert "title" in rec and isinstance(rec["title"], str)
        assert "details" in rec and isinstance(rec["details"], dict)
        assert "due_date" in rec
    print("All demo assertions passed.")

if __name__ == "__main__":
    main()
