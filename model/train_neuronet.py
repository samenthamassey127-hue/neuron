"""
NEURON - Deep Artificial Neural Network (ANN) Training Pipeline
Trains a 4-layer Deep Multi-Layer Perceptron (ANN) on clinical keystroke biometrics.
Supports training on custom user datasets or benchmark cohorts.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix, precision_recall_fscore_support

from dataset_loader import load_dataset, LABEL_MAPPING, DEFAULT_DATASET_PATH

MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
ANN_MODEL_PATH = os.path.join(MODEL_DIR, "neuron_ann_model.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "neuron_scaler.pkl")
METRICS_PATH = os.path.join(MODEL_DIR, "metrics.json")

def train_neuronet(custom_dataset_path: str = None) -> dict:
    print("=" * 65)
    print("Initializing NEURON Deep Artificial Neural Network (ANN) Training")
    print("=" * 65)

    df, feature_cols, target_col = load_dataset(custom_dataset_path)
    print(f"Loaded dataset: {len(df)} records with {len(feature_cols)} features.")

    X = df[feature_cols].values
    y = df[target_col].values

    # Train/test split with stratification
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    # Standard feature scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # 1. Primary Model: Deep Multi-Layer Perceptron (ANN)
    # Architecture: 14 -> 128 -> 64 -> 32 -> 3
    ann = MLPClassifier(
        hidden_layer_sizes=(128, 64, 32),
        activation="relu",
        solver="adam",
        alpha=0.001,
        learning_rate_init=0.003,
        max_iter=800,
        early_stopping=True,
        validation_fraction=0.15,
        n_iter_no_change=25,
        random_state=42
    )

    print("Fitting Deep ANN Architecture...")
    ann.fit(X_train_scaled, y_train)

    y_pred_ann = ann.predict(X_test_scaled)
    acc_ann = float(accuracy_score(y_test, y_pred_ann))
    p_ann, r_ann, f1_ann, _ = precision_recall_fscore_support(y_test, y_pred_ann, average="weighted", zero_division=0)
    cm_ann = confusion_matrix(y_test, y_pred_ann).tolist()

    # 2. Benchmark Comparison Ensembles
    rf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    rf.fit(X_train_scaled, y_train)
    acc_rf = float(accuracy_score(y_test, rf.predict(X_test_scaled)))

    gb = GradientBoostingClassifier(n_estimators=100, max_depth=4, random_state=42)
    gb.fit(X_train_scaled, y_train)
    acc_gb = float(accuracy_score(y_test, gb.predict(X_test_scaled)))

    feature_importances = dict(zip(feature_cols, [round(float(v), 4) for v in rf.feature_importances_]))
    sorted_features = sorted(feature_importances.items(), key=lambda x: x[1], reverse=True)

    print(f"\nModel Performance Benchmarks:")
    print(f"-> Deep ANN (Selected Model): Accuracy = {acc_ann * 100:.2f}% | F1-Score = {f1_ann:.4f}")
    print(f"-> Random Forest Benchmark:    Accuracy = {acc_rf * 100:.2f}%")
    print(f"-> Gradient Boosting Benchmark: Accuracy = {acc_gb * 100:.2f}%\n")

    # Serialize weights
    joblib.dump(ann, ANN_MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)

    metrics_payload = {
        "model_name": "NEURON-DeepANN-v1",
        "architecture": "Deep Multi-Layer Perceptron (14-128-64-32-3)",
        "accuracy": round(acc_ann, 4),
        "precision": round(float(p_ann), 4),
        "recall": round(float(r_ann), 4),
        "f1_score": round(float(f1_ann), 4),
        "total_training_samples": len(df),
        "feature_count": len(feature_cols),
        "feature_names": feature_cols,
        "classes": LABEL_MAPPING,
        "confusion_matrix": cm_ann,
        "benchmark_comparison": {
            "Deep_ANN": round(acc_ann, 4),
            "Random_Forest": round(acc_rf, 4),
            "Gradient_Boosting": round(acc_gb, 4)
        },
        "top_biomarkers": sorted_features[:6],
        "training_loss_history": [round(float(l), 4) for l in ann.loss_curve_[:30]]
    }

    with open(METRICS_PATH, "w") as f:
        json.dump(metrics_payload, f, indent=2)

    print(f"Saved artifacts successfully to: {MODEL_DIR}")
    return metrics_payload

if __name__ == "__main__":
    train_neuronet()
