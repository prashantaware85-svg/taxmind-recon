from itertools import combinations

def partial_match(target, candidates):
    for r in range(2, 4):
        for combo in combinations(candidates, r):
            if sum(t.get("amount", 0) for t in combo) == target.get("amount", 0):
                return combo
    return []
