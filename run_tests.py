import sys
from processor import process_file

def test_basic_extraction():
    # Minimal CSV with one outdated item and one current item (March 2024)
    # Current month is derived at runtime, so the assertion only checks shape and status set.
    csv_bytes = b"ItemName,ItemCode,Category,BasePrice,MarkupPercent,LastUpdated\nDummy,D001,Test,100,10,2024-03-01\n"
    records = process_file(csv_bytes)
    assert len(records) == 1
    rec = records[0]
    assert rec["title"] == "Dummy"
    assert rec["status"] in ("current:good", "outdated:critical")
    # details should contain computed fields
    assert "final_price" in rec["details"]
    assert rec["details"]["final_price"] == 110.00  # 100 * 1.10
    print("test_basic_extraction PASSED")

def test_missing_date():
    csv_bytes = b"ItemName,ItemCode,Category,BasePrice,MarkupPercent,LastUpdated\nNoDate,N1,Missing,50,0,\n"
    records = process_file(csv_bytes)
    rec = records[0]
    # Missing date => outdated
    assert rec["status"] == "outdated:critical"
    assert rec["due_date"] is not None  # set to today
    print("test_missing_date PASSED")

if __name__ == "__main__":
    test_basic_extraction()
    test_missing_date()
    print("All tests passed.")
