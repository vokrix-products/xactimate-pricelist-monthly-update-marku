# Xactimate Pricelist Monthly Update + Markup Auto-Applier (Restoration / Public Adjuster Tier)

## Product
Automates the monthly Xactimate pricelist update workflow for restoration contractors and public adjusters. Ingests Xactimate pricelist CSV files, evaluates recency of each line item (updated this month = current:good, older = outdated:critical), applies the configured markup percentage, and produces structured records for storage and downstream processing.

## Archetype
Restoration / Public Adjuster Tier — built for restoration companies and public adjusters who need markup-adjusted line items for insurance claims and estimates.

## What the poller expects as input
The poller (deployed on Railway) expects an Xactimate pricelist CSV file (bytes) with headers:
ItemName, ItemCode, Category, BasePrice, MarkupPercent, LastUpdated

- LastUpdated must be ISO format YYYY-MM-DD
- Status logic: last updated in current month → current:good; otherwise → outdated:critical
- due_date is set to today for all outdated items

## Backend module
processor.py exports process_file(file_bytes: bytes) -> list[dict].

Each returned record has the shape:
{
  "title": "Water Extraction",
  "status": "outdated:critical",
  "details": {
    "item_code": "W001",
    "category": "Water Damage",
    "base_price": 150.0,
    "markup_percent": 20.0,
    "final_price": 180.0,
    "last_updated": "2024-01-15"
  },
  "due_date": "2026-08-04"
}
