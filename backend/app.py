import json
import os
import re

import joblib
import numpy as np
from flask import Flask, jsonify, request

try:
    from flask_cors import CORS
except ImportError:  # minimal fallback so the API still works without flask-cors
    CORS = None

MODEL_DIR = os.path.join(os.path.dirname(__file__), "model")

app = Flask(__name__)
ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "*")
if CORS:
    CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}})
else:
    @app.after_request
    def add_cors(resp):
        resp.headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGINS
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        return resp

model = joblib.load(os.path.join(MODEL_DIR, "model.joblib")) if os.path.exists(os.path.join(MODEL_DIR, "model.joblib")) else None
SYMPTOMS = json.load(open(os.path.join(MODEL_DIR, "symptoms.json"))) if model else []
METRICS = json.load(open(os.path.join(MODEL_DIR, "metrics.json"))) if model else {}
INDEX = {s: i for i, s in enumerate(SYMPTOMS)}


def _norm(x):
    return re.sub(r"[^a-z0-9]", "", x.lower())


_info_path = os.path.join(os.path.dirname(__file__), "disease_info.json")
INFO = {_norm(k): v for k, v in json.load(open(_info_path, encoding="utf-8")).items()} if os.path.exists(_info_path) else {}
GENERIC_DOCTOR = "See a doctor if symptoms last more than a few days, get worse, or come with high fever, severe pain or trouble breathing."
EMERGENCY = "This can be an emergency. Go to the nearest hospital or call your local emergency number now."

# Keyword -> specialist hints (general guidance only)
SPECIALISTS = [
    (("heart", "hypertension", "varicose"), "Cardiologist"),
    (("hepatitis", "jaundice", "cholestasis", "gerd", "ulcer", "gastro", "piles", "hemorrhoid", "hemmorhoid"), "Gastroenterologist"),
    (("migraine", "paralysis", "vertigo", "spondylosis"), "Neurologist"),
    (("diabetes", "thyroid", "hypoglycemia"), "Endocrinologist"),
    (("asthma", "pneumonia", "tuberculosis", "cold"), "Pulmonologist / General physician"),
    (("acne", "psoriasis", "impetigo", "fungal", "chicken pox", "allergy"), "Dermatologist"),
    (("arthritis", "arthristis"), "Rheumatologist / Orthopedist"),
    (("urinary",), "Urologist"),
    (("malaria", "dengue", "typhoid", "aids"), "Infectious disease specialist"),
]
URGENT = ("heart attack", "paralysis", "brain hemorrhage", "hemorrhage")


def specialist_for(disease: str) -> str:
    d = disease.lower()
    for keys, spec in SPECIALISTS:
        if any(k in d for k in keys):
            return spec
    return "General physician"


def pretty(s: str) -> str:
    return s.replace("_", " ")


@app.get("/api/health")
def health():
    return jsonify(status="ok" if model else "model_missing")


@app.get("/api/symptoms")
def symptoms():
    if not model:
        return jsonify(error="Model not trained. Run: python train.py"), 503
    items = sorted(({"id": s, "label": pretty(s)} for s in SYMPTOMS), key=lambda x: x["label"])
    return jsonify(symptoms=items)


@app.get("/api/disease/<path:name>")
def disease(name):
    info = INFO.get(_norm(name), {})
    urgent = any(u in name.lower() for u in URGENT)
    return jsonify(
        name=name,
        description=info.get("d", "No summary is available for this condition yet."),
        precautions=info.get("p", []),
        see_doctor=EMERGENCY if urgent else GENERIC_DOCTOR,
        urgent=urgent,
        specialist=specialist_for(name),
        disclaimer="General information only. It is not a diagnosis or treatment plan.",
    )


@app.get("/api/metrics")
def metrics():
    return jsonify(METRICS)


@app.post("/api/predict")
def predict():
    if not model:
        return jsonify(error="Model not trained. Run: python train.py"), 503

    body = request.get_json(silent=True) or {}
    chosen = body.get("symptoms")
    if not isinstance(chosen, list) or not chosen:
        return jsonify(error="Send JSON like {\"symptoms\": [\"cough\", \"high_fever\"]}."), 400

    unknown = [s for s in chosen if s not in INDEX]
    if unknown:
        return jsonify(error="Unknown symptoms.", unknown=unknown), 400

    x = np.zeros((1, len(SYMPTOMS)), dtype=np.float32)
    for s in set(chosen):
        x[0, INDEX[s]] = 1

    proba = model.predict_proba(x)[0]
    order = np.argsort(proba)[::-1][:3]
    top = [{
        "disease": str(model.classes_[i]),
        "probability": round(float(proba[i]) * 100, 1),
        "specialist": specialist_for(str(model.classes_[i])),
    } for i in order]

    return jsonify(
        predictions=top,
        symptoms_used=len(set(chosen)),
        low_confidence=top[0]["probability"] < 40 or len(set(chosen)) < 3,
        urgent=any(u in top[0]["disease"].lower() for u in URGENT),
        disclaimer="This is a screening aid, not a diagnosis. See a qualified doctor for medical advice.",
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=os.getenv("FLASK_DEBUG") == "1")
