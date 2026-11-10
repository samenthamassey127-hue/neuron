"""
Vercel Serverless Function Entrypoint for FastAPI
"""

import sys
import os

# Resolve paths for serverless environment
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
MODEL_DIR = os.path.join(ROOT_DIR, "model")

sys.path.insert(0, BACKEND_DIR)
sys.path.insert(0, MODEL_DIR)

from main import app
