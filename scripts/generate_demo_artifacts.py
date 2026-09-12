"""
Generates demo model, scaler, baseline CSV, and 10 production batch CSVs for DriftWatch.
Run: python scripts/generate_demo_artifacts.py
"""

import os
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "demo_data")
os.makedirs(OUT_DIR, exist_ok=True)

np.random.seed(42)
N_SAMPLES = 2000

# Feature generation
age = np.random.normal(38, 10, N_SAMPLES).clip(18, 75)
income = np.random.normal(65000, 18000, N_SAMPLES).clip(15000, 200000)
credit_score = np.random.normal(680, 50, N_SAMPLES).clip(300, 850)
debt_to_income = np.random.normal(0.28, 0.08, N_SAMPLES).clip(0.01, 0.85)
loan_amount = np.random.normal(18000, 7000, N_SAMPLES).clip(1000, 50000)
revolving_utilization = np.random.normal(0.35, 0.15, N_SAMPLES).clip(0.0, 1.0)
num_open_lines = np.random.poisson(7, N_SAMPLES).clip(1, 25)
delinquency_2yr = np.random.poisson(0.3, N_SAMPLES).clip(0, 5)

# Target log-odds
z = (
    -0.03 * (age - 38)
    - 0.00004 * (income - 65000)
    - 0.035 * (credit_score - 680)
    + 6.5 * (debt_to_income - 0.28)
    + 0.00006 * (loan_amount - 18000)
    + 3.2 * (revolving_utilization - 0.35)
    + 0.8 * delinquency_2yr
    - 2.2
)
p_default = 1 / (1 + np.exp(-z))
default = (np.random.rand(N_SAMPLES) < p_default).astype(int)

df = pd.DataFrame({
    "age": np.round(age, 1),
    "income": np.round(income, 2),
    "credit_score": np.round(credit_score, 1),
    "debt_to_income": np.round(debt_to_income, 4),
    "loan_amount": np.round(loan_amount, 2),
    "revolving_utilization": np.round(revolving_utilization, 4),
    "num_open_lines": num_open_lines,
    "delinquency_2yr": delinquency_2yr,
    "default": default,
})

features = ["age", "income", "credit_score", "debt_to_income", "loan_amount", "revolving_utilization", "num_open_lines", "delinquency_2yr"]

# Save baseline
df.to_csv(os.path.join(OUT_DIR, "demo_baseline.csv"), index=False)

# Train model
X = df[features]
y = df["default"]
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)

clf = GradientBoostingClassifier(n_estimators=100, max_depth=4, random_state=42)
clf.fit(X_train_s, y_train)

with open(os.path.join(OUT_DIR, "demo_model.pkl"), "wb") as f:
    pickle.dump(clf, f)

with open(os.path.join(OUT_DIR, "demo_scaler.pkl"), "wb") as f:
    pickle.dump(scaler, f)

# Generate 10 production batches (200 records each)
BATCH_SIZE = 200
for b in range(1, 11):
    drift_factor = 0.0 if b <= 4 else (0.15 * (b - 4))
    b_income = np.random.normal(65000 - drift_factor * 12000, 18000, BATCH_SIZE).clip(10000, 200000)
    b_dti = np.random.normal(0.28 + drift_factor * 0.12, 0.08, BATCH_SIZE).clip(0.01, 0.95)
    b_credit = np.random.normal(680 - drift_factor * 25, 50, BATCH_SIZE).clip(300, 850)
    b_age = np.random.normal(38, 10, BATCH_SIZE).clip(18, 75)
    b_loan = np.random.normal(18000 + drift_factor * 3000, 7000, BATCH_SIZE).clip(1000, 50000)
    b_util = np.random.normal(0.35 + drift_factor * 0.1, 0.15, BATCH_SIZE).clip(0.0, 1.0)
    b_open = np.random.poisson(7, BATCH_SIZE).clip(1, 25)
    b_delinq = np.random.poisson(0.3 + drift_factor * 0.4, BATCH_SIZE).clip(0, 5)

    bz = (
        -0.03 * (b_age - 38)
        - 0.00004 * (b_income - 65000)
        - 0.035 * (b_credit - 680)
        + 6.5 * (b_dti - 0.28)
        + 0.00006 * (b_loan - 18000)
        + 3.2 * (b_util - 0.35)
        + 0.8 * b_delinq
        - 2.2
    )
    b_p = 1 / (1 + np.exp(-bz))
    b_def = (np.random.rand(BATCH_SIZE) < b_p).astype(int)

    b_df = pd.DataFrame({
        "age": np.round(b_age, 1),
        "income": np.round(b_income, 2),
        "credit_score": np.round(b_credit, 1),
        "debt_to_income": np.round(b_dti, 4),
        "loan_amount": np.round(b_loan, 2),
        "revolving_utilization": np.round(b_util, 4),
        "num_open_lines": b_open,
        "delinquency_2yr": b_delinq,
        "default": b_def,
    })
    b_df.to_csv(os.path.join(OUT_DIR, f"batch_{b:02d}.csv"), index=False)

print(f"Demo artifacts generated in {os.path.abspath(OUT_DIR)}")
