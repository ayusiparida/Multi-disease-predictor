# Multi-disease prediction system

Flask REST API + scikit-learn model + React (Vite) frontend.

## 1. Get the dataset (recommended)
Download **"Disease Prediction Using Machine Learning"** from Kaggle
(kaushil268/disease-prediction-using-machine-learning): 41 diseases, 132 symptoms.
Fastest way (needs internet): `pip install kagglehub && python fetch_dataset.py` inside `backend/`.
Or put `Training.csv` and `Testing.csv` into `backend/data/` manually.
No dataset yet? `python make_demo_data.py` creates a small synthetic stand-in
(12 diseases) so you can try the app immediately.

## 2. Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python train.py        # trains, compares models, saves model/
python app.py          # http://localhost:5000
```

## 3. Frontend
```bash
cd frontend
npm install
npm run dev            # http://localhost:5173  (proxies /api to Flask)
```

## REST API
| Method | Path | Purpose |
|---|---|---|
| GET | /api/health | status |
| GET | /api/symptoms | list of `{id, label}` |
| GET | /api/metrics | training/validation scores |
| GET | /api/disease/<name> | description, precautions, when to see a doctor |
| POST | /api/predict | body `{"symptoms": ["cough","high_fever"]}` → top 3 diseases with % and specialist |

Production: `VITE_API_URL=https://your-api npm run build`, serve Flask with gunicorn
(`gunicorn app:app`), and set `CORS_ORIGINS` to your frontend URL.

## Frontend features
Symptom picker by body area, ranked results, clickable disease details, saved history (stored in the browser) with downloadable HTML report, and a model dashboard (needs `python train.py` run after the latest update).
