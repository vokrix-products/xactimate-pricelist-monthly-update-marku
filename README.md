# Xactimate Pricelist Monthly Update + Markup Auto-Applier (Restoration / Public Adjuster Tier)

Monthly Xactimate pricelist updates with automatic markup application - so every claim is accurate and every settlement is maximized.

## Links
- Landing page: https://vokrix.co/xactimate-pricelist-monthly-update-marku
- Live dashboard: https://xactimate-pricelist-monthly-update-marku.vokrix.co

## What this tool does
- Automatically updates Xactimate pricelists monthly
- Applies custom markup to every claim
- Flags discrepancies before finalizing
- Color-coded pricelist status: up-to-date, pending, outdated
- Shows upcoming monthly refresh deadline
- Tracks last applied markup percentage and date

## Who the buyer is
Restoration contractors and public adjusters who need to keep Xactimate pricelists current and apply markup automatically.

## What falls through without it
- Missed updates lead to rejected or undervalued claims
- Manual markup mistakes cost thousands in lost revenue
- Last-minute rushes risk compliance and accuracy

## Repository structure
- poller.py - monthly pricelist refresh cycle
- processor.py - markup application and discrepancy flagging
- run_demo.py - local demo run
- run_tests.py - test suite
- backend/ - API service
- dashboard/ - buyer-facing dashboard

## Deployment
- Poller: Railway
- Domain: Cloudflare DNS

