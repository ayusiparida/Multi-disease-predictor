"""
Creates a SMALL SYNTHETIC stand-in dataset (data/Training.csv, data/Testing.csv)
in the same format as the Kaggle "Disease Prediction Using Machine Learning" files,
so the whole app can run before you download the real dataset.

For real use, replace these two files with the Kaggle ones (see README).
"""
import random
import pandas as pd

random.seed(7)

DISEASES = {
    "Common Cold": ["continuous_sneezing", "chills", "cough", "headache", "runny_nose", "throat_irritation", "fatigue"],
    "Pneumonia": ["cough", "high_fever", "chest_pain", "breathlessness", "phlegm", "fast_heart_rate", "sweating"],
    "Malaria": ["chills", "high_fever", "sweating", "headache", "nausea", "vomiting", "muscle_pain"],
    "Dengue": ["high_fever", "headache", "joint_pain", "skin_rash", "nausea", "pain_behind_the_eyes", "muscle_pain"],
    "Typhoid": ["high_fever", "headache", "abdominal_pain", "constipation", "nausea", "fatigue", "toxic_look"],
    "Migraine": ["headache", "blurred_and_distorted_vision", "nausea", "excessive_hunger", "irritability", "depression"],
    "Diabetes": ["fatigue", "weight_loss", "excessive_hunger", "polyuria", "blurred_and_distorted_vision", "irregular_sugar_level"],
    "Hypertension": ["headache", "chest_pain", "dizziness", "loss_of_balance", "lack_of_concentration"],
    "Gastroenteritis": ["vomiting", "diarrhoea", "dehydration", "sunken_eyes", "abdominal_pain", "nausea"],
    "Urinary tract infection": ["burning_micturition", "bladder_discomfort", "foul_smell_of_urine", "continuous_feel_of_urine"],
    "Acne": ["skin_rash", "pus_filled_pimples", "blackheads", "scurring"],
    "Heart attack": ["chest_pain", "vomiting", "breathlessness", "sweating"],
}

SYMPTOMS = sorted({s for v in DISEASES.values() for s in v})


def make_rows(n_per_disease):
    rows = []
    for disease, core in DISEASES.items():
        for _ in range(n_per_disease):
            k = random.randint(max(2, len(core) - 3), len(core))
            chosen = set(random.sample(core, k))
            row = {s: int(s in chosen) for s in SYMPTOMS}
            row["prognosis"] = disease
            rows.append(row)
    return pd.DataFrame(rows)


if __name__ == "__main__":
    make_rows(60).to_csv("data/Training.csv", index=False)
    make_rows(5).to_csv("data/Testing.csv", index=False)
    print(f"Wrote demo data: {len(SYMPTOMS)} symptoms, {len(DISEASES)} diseases")
