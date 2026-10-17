"""
Train the multi-disease classifier.

Input : data/Training.csv  (binary symptom columns + 'prognosis')
        data/Testing.csv   (optional, same format)
Output: model/model.joblib, model/symptoms.json, model/metrics.json
"""
import json
import os
import sys

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import ExtraTreesClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, recall_score
from sklearn.model_selection import train_test_split

from common import clean_column, clean_label

RNG = np.random.default_rng(42)
TRAIN_PATH, TEST_PATH, OUT = "data/Training.csv", "data/Testing.csv", "model"


def load(path):
    df = pd.read_csv(path)
    df = df.loc[:, ~df.columns.str.startswith("Unnamed")]
    df.columns = [clean_column(c) for c in df.columns]
    df["prognosis"] = df["prognosis"].map(clean_label)
    return df


def drop_symptoms(X, frac_range=(0.0, 0.6), copies=6):
    """Augment: randomly hide symptoms so the model copes with partial user input."""
    out = [X]
    for _ in range(copies):
        keep = RNG.random(X.shape) > RNG.uniform(*frac_range, size=(X.shape[0], 1))
        out.append(X * keep)
    return np.vstack(out)


def partial(X, frac=0.4):
    keep = RNG.random(X.shape) > frac
    return X * keep


def main():
    if not os.path.exists(TRAIN_PATH):
        sys.exit("data/Training.csv not found. Download the Kaggle dataset (see README) "
                 "or run: python make_demo_data.py")

    df = load(TRAIN_PATH)
    before = len(df)
    df = df.drop_duplicates().reset_index(drop=True)  # the Kaggle file repeats each row ~120x
    symptoms = [c for c in df.columns if c != "prognosis"]
    X, y = df[symptoms].values.astype(np.float32), df["prognosis"].values
    print(f"{before} rows -> {len(df)} unique | {len(symptoms)} symptoms | {len(set(y))} diseases")

    stratify = y if pd.Series(y).value_counts().min() >= 2 else None
    Xtr, Xval, ytr, yval = train_test_split(X, y, test_size=0.2, random_state=42, stratify=stratify)
    Xtr_aug = drop_symptoms(Xtr)
    ytr_aug = np.tile(ytr, Xtr_aug.shape[0] // len(ytr))
    Xval_partial = partial(Xval)

    candidates = {
        "RandomForest": RandomForestClassifier(n_estimators=400, random_state=42, n_jobs=-1),
        "ExtraTrees": ExtraTreesClassifier(n_estimators=400, random_state=42, n_jobs=-1),
        "LogisticRegression": LogisticRegression(max_iter=2000, C=5.0),
    }

    scores = {}
    for name, model in candidates.items():
        model.fit(Xtr_aug, ytr_aug)
        scores[name] = {
            "accuracy_full_symptoms": round(accuracy_score(yval, model.predict(Xval)), 4),
            "accuracy_40pct_hidden": round(accuracy_score(yval, model.predict(Xval_partial)), 4),
            "macro_f1_full": round(f1_score(yval, model.predict(Xval), average="macro"), 4),
        }
        print(f"{name:20s} {scores[name]}")

    best = max(scores, key=lambda n: (scores[n]["accuracy_40pct_hidden"], scores[n]["accuracy_full_symptoms"]))
    print("Best model:", best)
    labels = sorted(set(yval))
    rec = recall_score(yval, candidates[best].predict(Xval_partial), labels=labels, average=None, zero_division=0)
    per_disease = {l: round(float(r), 3) for l, r in zip(labels, rec)}

    # Optional: the official Testing.csv
    external = None
    if os.path.exists(TEST_PATH):
        te = load(TEST_PATH)
        te = te.reindex(columns=symptoms + ["prognosis"], fill_value=0)
        external = round(accuracy_score(te["prognosis"], candidates[best].predict(te[symptoms].values)), 4)
        print("Testing.csv accuracy:", external)

    # Refit the winner on ALL unique data (+ augmentation) for deployment
    final = type(candidates[best])(**candidates[best].get_params())
    X_all_aug = drop_symptoms(X)
    final.fit(X_all_aug, np.tile(y, X_all_aug.shape[0] // len(y)))

    os.makedirs(OUT, exist_ok=True)
    joblib.dump(final, f"{OUT}/model.joblib")
    json.dump(symptoms, open(f"{OUT}/symptoms.json", "w"))
    json.dump({
        "best_model": best,
        "n_unique_rows": int(len(df)),
        "n_symptoms": len(symptoms),
        "n_diseases": int(len(set(y))),
        "validation": scores,
        "testing_csv_accuracy": external,
        "per_disease_recall_40pct_hidden": per_disease,
        "note": "Scores come from a symptom-checklist dataset, not clinical data.",
    }, open(f"{OUT}/metrics.json", "w"), indent=2)
    print("Saved model to", OUT)


if __name__ == "__main__":
    main()
