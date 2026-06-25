"""
Generates a synthetic credit-default dataset.
- baseline.csv: training distribution
- batch_001.csv ... batch_010.csv: simulated production batches over time,
  with progressively injected drift (feature shift + concept drift) starting mid-way.
"""
import numpy as np
import pandas as pd
import os

np.random.seed(42)
OUT_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(OUT_DIR, exist_ok=True)

FEATURES = ["age", "income", "credit_score", "loan_amount", "debt_to_income", "employment_years"]

def gen_batch(n, drift_level=0.0, concept_drift=False, seed=0):
    rng = np.random.RandomState(seed)
    age = rng.normal(40 + drift_level * 5, 10, n).clip(18, 75)
    income = rng.normal(60000 - drift_level * 8000, 15000, n).clip(15000, None)
    credit_score = rng.normal(680 - drift_level * 40, 60, n).clip(300, 850)
    loan_amount = rng.normal(20000 + drift_level * 6000, 8000, n).clip(1000, None)
    debt_to_income = rng.normal(0.35 + drift_level * 0.15, 0.1, n).clip(0, 1)
    employment_years = rng.normal(8 - drift_level * 2, 5, n).clip(0, None)

    df = pd.DataFrame({
        "age": age, "income": income, "credit_score": credit_score,
        "loan_amount": loan_amount, "debt_to_income": debt_to_income,
        "employment_years": employment_years
    })

    # true default probability (label generation logic)
    logit = (
        -4.0
        + 0.04 * (700 - df.credit_score) / 10
        + 3.0 * df.debt_to_income
        - 0.00002 * df.income
        + 0.00003 * df.loan_amount
        - 0.05 * df.employment_years
    )
    if concept_drift:
        # relationship between features and outcome changes (concept drift)
        logit += 1.5 * df.debt_to_income  # debt_to_income becomes more predictive/risky
        logit -= 0.0008 * df.age * drift_level

    prob = 1 / (1 + np.exp(-logit))
    default = rng.binomial(1, prob.clip(0.01, 0.99))
    df["default"] = default
    return df

# Baseline (training) data - no drift
baseline = gen_batch(5000, drift_level=0.0, concept_drift=False, seed=1)
baseline.to_csv(os.path.join(OUT_DIR, "baseline.csv"), index=False)

# 10 production batches simulating time progression
# batches 1-4: no drift (normal operation)
# batches 5-7: gradual feature drift creeping in
# batches 8-10: feature drift + concept drift (severe)
for i in range(1, 11):
    if i <= 4:
        d, cd = 0.0, False
    elif i <= 7:
        d, cd = (i - 4) * 0.3, False
    else:
        d, cd = (i - 4) * 0.3, True
    batch = gen_batch(800, drift_level=d, concept_drift=cd, seed=100 + i)
    batch.to_csv(os.path.join(OUT_DIR, f"batch_{i:03d}.csv"), index=False)

print("Generated baseline.csv and batch_001.csv..batch_010.csv in", OUT_DIR)
