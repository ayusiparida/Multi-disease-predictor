"""
One-command dataset download (run this on your own machine, it needs internet).

    pip install kagglehub
    python fetch_dataset.py

Downloads Kaggle "Disease Prediction Using Machine Learning" (41 diseases, 132 symptoms)
and copies Training.csv / Testing.csv into data/. Then run: python train.py

kagglehub may ask for a Kaggle login/token the first time (kaggle.com > Settings > API).
"""
import os
import shutil

import kagglehub

SLUG = "kaushil268/disease-prediction-using-machine-learning"

path = kagglehub.dataset_download(SLUG)
os.makedirs("data", exist_ok=True)
found = 0
for root, _, files in os.walk(path):
    for f in files:
        if f.lower() in ("training.csv", "testing.csv"):
            shutil.copy(os.path.join(root, f), os.path.join("data", f))
            found += 1
            print("copied", f)
if found < 1:
    raise SystemExit(f"Training.csv not found in {path}. Download it manually from Kaggle.")
print("Done. Now run: python train.py")
