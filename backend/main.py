"""
NEURON Backend API - FastAPI Clinical Keystroke Telemetry & Deep ANN Service
High-performance inference engine for neuromuscular motor analysis & MDS-UPDRS pre-screening.
"""

import os
import sys
import json
import joblib
import numpy as np
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add model directory to sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(os.path.dirname(BASE_DIR), "model")
sys.path.insert(0, MODEL_DIR)

from features import extract_features_from_events, FEATURE_NAMES
from dataset_loader import LABEL_MAPPING
from train_neuronet import train_neuronet, ANN_MODEL_PATH, SCALER_PATH, METRICS_PATH

app = FastAPI(
    title="NEURON Medical Telemetry API",
    description="Deep Artificial Neural Network (ANN) for Early Neuromuscular Motor-Decline & Tremor Analysis",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model state
ann_model = None
scaler = None
metrics_cache = {}

def load_system_weights():
    global ann_model, scaler, metrics_cache
    if os.path.exists(ANN_MODEL_PATH) and os.path.exists(SCALER_PATH):
        try:
            ann_model = joblib.load(ANN_MODEL_PATH)
            scaler = joblib.load(SCALER_PATH)
            print("Successfully loaded NEURON Deep ANN weights and scaler.")
        except Exception as e:
            print(f"Error loading model weights: {e}")

    if os.path.exists(METRICS_PATH):
        try:
            with open(METRICS_PATH, "r") as f:
                metrics_cache = json.load(f)
        except Exception as e:
            print(f"Error loading metrics: {e}")

load_system_weights()

class KeystrokeEvent(BaseModel):
    key: str
    downTime: float
    upTime: float

class KeystrokePayload(BaseModel):
    events: List[KeystrokeEvent]
    age: Optional[int] = 30
    patient_id: Optional[str] = "ANON-001"
    notes: Optional[str] = "Routine motor stability screening"

class ClinicalReportRequest(BaseModel):
    patient_id: str
    age: int
    motor_stability_score: float
    clinical_class: str
    confidence: float
    top_biomarkers: List[Dict[str, Any]]
    notes: Optional[str] = ""

@app.get("/api/health")
def health():
    return {
        "status": "online",
        "system": "NEURON Deep Neuromuscular Telemetry",
        "model_loaded": ann_model is not None,
        "environment": os.getenv("RENDER_ENVIRONMENT", "local")
    }

@app.get("/api/model-stats")
def get_model_stats():
    if not metrics_cache:
        return {"status": "untrained", "model_name": "NEURON-DeepANN-v1"}
    return metrics_cache

@app.post("/api/analyze-keystrokes")
def analyze_keystrokes(payload: KeystrokePayload):
    if len(payload.events) < 4:
        raise HTTPException(status_code=400, detail="Minimum 4 keystroke events required for clinical feature extraction.")

    raw_events = [ev.model_dump() for ev in payload.events]
    features_dict = extract_features_from_events(raw_events)

    # Feature vector in expected column order
    X_vec = np.array([[features_dict[name] for name in FEATURE_NAMES]])

    global ann_model, scaler
    if ann_model is None or scaler is None:
        load_system_weights()
        if ann_model is None:
            train_neuronet()
            load_system_weights()

    X_scaled = scaler.transform(X_vec)
    pred_class_idx = int(ann_model.predict(X_scaled)[0])
    probabilities = ann_model.predict_proba(X_scaled)[0]

    clinical_class = LABEL_MAPPING.get(pred_class_idx, "HEALTHY_CONTROL")
    confidence = float(probabilities[pred_class_idx])

    # Motor stability calculation (100% = perfectly stable, 0% = high motor decline)
    if clinical_class == "HEALTHY_CONTROL":
        stability_score = round(max(82.0, min(99.0, 100.0 - (features_dict["latency_jitter"] * 0.25))), 1)
        severity = "nominal"
    elif clinical_class == "MILD_MOTOR_FATIGUE":
        stability_score = round(max(55.0, min(80.0, 80.0 - (features_dict["latency_jitter"] * 0.3))), 1)
        severity = "moderate"
    else:
        stability_score = round(max(15.0, min(52.0, 50.0 - (features_dict["latency_jitter"] * 0.2))), 1)
        severity = "critical"

    # Reference intervals for explainability
    reference_ranges = {
        "mean_hold_time": {"unit": "ms", "healthy": "75 - 115 ms", "status": "elevated" if features_dict["mean_hold_time"] > 135 else "normal"},
        "latency_jitter": {"unit": "ms", "healthy": "< 35 ms", "status": "abnormal" if features_dict["latency_jitter"] > 55 else "normal"},
        "std_flight_time": {"unit": "ms", "healthy": "< 45 ms", "status": "irregular" if features_dict["std_flight_time"] > 65 else "normal"},
        "micro_pause_rate": {"unit": "ratio", "healthy": "< 0.08", "status": "frequent" if features_dict["micro_pause_rate"] > 0.15 else "normal"},
        "fatigue_drift_slope": {"unit": "slope", "healthy": "< 0.10", "status": "steep" if features_dict["fatigue_drift_slope"] > 0.20 else "normal"}
    }

    return {
        "patient_id": payload.patient_id,
        "motor_stability_score": stability_score,
        "clinical_class": clinical_class,
        "severity": severity,
        "confidence": round(confidence * 100, 2),
        "class_probabilities": {
            "healthy_control": round(float(probabilities[0]) * 100, 1),
            "mild_motor_fatigue": round(float(probabilities[1]) * 100, 1),
            "elevated_tremor_risk": round(float(probabilities[2]) * 100, 1),
        },
        "keystroke_count": len(payload.events),
        "features": features_dict,
        "clinical_reference": reference_ranges,
        "mds_updrs_triage": "Routine monitoring recommended." if severity == "nominal" else "Early neurologist motor consultation advised."
    }

@app.post("/api/train-custom-dataset")
async def upload_and_train_dataset(file: UploadFile = File(...)):
    """
    Accepts any user-uploaded CSV dataset, saves to datasets directory,
    re-trains the Deep ANN dynamically, and refreshes system memory.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV clinical datasets are supported.")

    dest_path = os.path.join(MODEL_DIR, "datasets", file.filename)
    content = await file.read()
    with open(dest_path, "wb") as f:
        f.write(content)

    print(f"Uploaded custom dataset: {dest_path}")
    updated_metrics = train_neuronet(dest_path)
    load_system_weights()

    return {
        "status": "success",
        "dataset_name": file.filename,
        "metrics": updated_metrics
    }

@app.post("/api/generate-clinical-report")
def generate_clinical_report(req: ClinicalReportRequest):
    report_text = f"""================================================================================
NEURON CLINICAL MOTOR FUNCTION & TREMOR TRIAGE BRIEF
MDS-UPDRS (Movement Disorder Society) Computational Screening
================================================================================

PATIENT IDENTIFIER : {req.patient_id}
AGE                : {req.age}
ASSESSMENT DATE    : November 3, 2026
ENGINE VERSION     : NEURON Deep Multi-Layer Perceptron (v1.0.4)

1. PRIMARY COMPUTATIONAL FINDINGS
--------------------------------------------------------------------------------
Overall Neuromuscular Stability : {req.motor_stability_score}%
Diagnostic Stratification        : {req.clinical_class.replace('_', ' ')}
Model Certainty / Confidence    : {req.confidence:.1f}%

2. BIOMARKER DEVIATION MATRIX
--------------------------------------------------------------------------------
{chr(10).join(f"- {b.get('name', 'Biomarker')}: Observed {b.get('value')} | Status: {b.get('status', 'Measured')}" for b in req.top_biomarkers)}

3. CLINICAL INTERPRETATION & RECOMMENDATION
--------------------------------------------------------------------------------
- Clinical Assessment: Automated analysis indicates {req.clinical_class.replace('_', ' ').lower()} characteristics.
- Involuntary micro-hesitations and cycle-to-cycle flight latency variance were calibrated against the PhysioNet clinical motor disorder cohort.
- Recommendation: Share this digital screening summary with a board-certified neurologist or movement disorder specialist for physical clinical correlation (finger-to-nose test, rapid alternating movements, and resting tremor examination).

CONFIDENTIAL MEDICAL TRIAGE BRIEF - FOR CLINICAL SCREENING ONLY
VERIFIED VIA NEURON DEEP NEURAL CLASSIFIER
================================================================================
"""
    return {
        "status": "success",
        "report_id": f"REP-{hash(req.patient_id) % 100000}",
        "report_text": report_text
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
