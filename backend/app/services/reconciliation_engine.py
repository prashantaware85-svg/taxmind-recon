from .partial_matcher import partial_match

def reconcile(yours, party):
    results = []
    unmatched_yours = list(yours)
    unmatched_party = list(party)

    for y in list(unmatched_yours):
        for p in list(unmatched_party):
            if y.get("amount") == p.get("amount") and y.get("date") == p.get("date"):
                results.append({"status": "matched", "amount": y.get("amount")})
                unmatched_yours.remove(y)
                unmatched_party.remove(p)
                break

    for y in list(unmatched_yours):
        results.append({"status": "missing_in_party", "amount": y.get("amount")})

    for p in unmatched_party:
        results.append({"status": "missing_in_books", "amount": p.get("amount")})

    return results
