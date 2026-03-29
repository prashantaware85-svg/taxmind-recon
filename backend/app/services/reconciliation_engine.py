from decimal import Decimal
from datetime import timedelta

def reconcile(books: list, party: list) -> dict:
    results = []
    party_used = [False] * len(party)

    # Step 1: Exact match (amount + date ±1 day)
    for b in books:
        matched = False
        for i, p in enumerate(party):
            if party_used[i]:
                continue
            amount_match = abs(Decimal(str(b['amount'])) - Decimal(str(p['amount']))) < Decimal('0.01')
            date_diff = abs((b['date'] - p['date']).days)
            if amount_match and date_diff <= 1:
                results.append({**b, 'status': 'matched', 'matched_with_amount': p['amount'], 'matched_with_date': str(p['date'])})
                party_used[i] = True
                matched = True
                break
        if not matched:
            results.append({**b, 'status': 'missing_in_party', 'matched_with_amount': None, 'matched_with_date': None})

    # Step 2: Missing in books
    for i, p in enumerate(party):
        if not party_used[i]:
            results.append({**p, 'status': 'missing_in_books', 'matched_with_amount': None, 'matched_with_date': None})

    matched_count = sum(1 for r in results if r['status'] == 'matched')
    missing_party = sum(1 for r in results if r['status'] == 'missing_in_party')
    missing_books = sum(1 for r in results if r['status'] == 'missing_in_books')

    return {
        'results': results,
        'matched_count': matched_count,
        'missing_in_party': missing_party,
        'missing_in_books': missing_books
    }
