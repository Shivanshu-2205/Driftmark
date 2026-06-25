"""
Trains a baseline logistic regression model on baseline.csv and saves it + scaler.
"""
import pandas as pd
import numpy as np
import pickle
import os
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODEL_DIR, exist_ok=True)

FEATURES = ["age", "income", "credit_score", "loan_amount", "debt_to_income", "employment_years"]

df = pd.read_csv(os.path.join(DATA_DIR, "baseline.csv"))
X = df[FEATURES]
y = df["default"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s = scaler.transform(X_test)

model = LogisticRegression(max_iter=1000)
model.fit(X_train_s, y_train)

preds = model.predict(X_test_s)
probs = model.predict_proba(X_test_s)[:, 1]
acc = accuracy_score(y_test, preds)
auc = roc_auc_score(y_test, probs)
print(f"Baseline model — Accuracy: {acc:.4f}, AUC: {auc:.4f}")

with open(os.path.join(MODEL_DIR, "model.pkl"), "wb") as f:
    pickle.dump(model, f)
with open(os.path.join(MODEL_DIR, "scaler.pkl"), "wb") as f:
    pickle.dump(scaler, f)

# Save baseline feature stats (for drift reference) — store raw baseline values too
baseline_stats = {
    "features": FEATURES,
    "baseline_means": X.mean().to_dict(),
    "baseline_stds": X.std().to_dict(),
}
with open(os.path.join(MODEL_DIR, "baseline_stats.pkl"), "wb") as f:
    pickle.dump(baseline_stats, f)

print("Saved model.pkl, scaler.pkl, baseline_stats.pkl to", MODEL_DIR)
