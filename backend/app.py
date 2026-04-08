"""
app.py  –  FastAPI backend for flood segmentation inference
Run:  uvicorn app:app --reload --port 8000
"""

import os
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from PIL import Image
import io
import json

from inference import engine

# ─── Setup ─────────────────────────────────────────────────────────────────────
BASE_DIR    = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
IMAGES_DIR  = PROJECT_ROOT / "assets" / "images"
CONFIG_PATH = BASE_DIR / "config.json"
CONFIG      = json.loads(CONFIG_PATH.read_text())

app = FastAPI(
    title="Flood Segmentation API",
    description="ConvNeXt-Tiny ViT-UNet inference for flood scene segmentation",
    version="1.0.0",
)

# Allow Next.js dev server (port 3000) and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Models ────────────────────────────────────────────────────────────────────
class SampleRequest(BaseModel):
    filename: str
    model_id: str = "best_model_iou"


# ─── Routes ────────────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def health():
    return {"status": "ok", "model": CONFIG["model_name"]}


@app.get("/config", tags=["Config"])
def get_config():
    """Return class info and model metrics for the frontend legend."""
    return CONFIG


@app.get("/samples", tags=["Samples"])
def list_samples():
    """List sample image filenames available in the images directory."""
    if not IMAGES_DIR.exists():
        return {"samples": []}
    files = [
        f.name
        for f in sorted(IMAGES_DIR.iterdir())
        if f.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}
    ]
    return {"samples": files}


@app.get("/samples/{filename}", tags=["Samples"])
def get_sample_image(filename: str):
    """Serve a raw sample image (for thumbnail display)."""
    path = IMAGES_DIR / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Sample not found")
    return FileResponse(str(path), media_type="image/png")


@app.post("/predict", tags=["Inference"])
async def predict_upload(file: UploadFile = File(...), model_id: str = "best_model_iou"):
    """Run inference on an uploaded image."""
    contents = await file.read()
    try:
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    result = engine.predict(pil_image, model_id=model_id)
    return JSONResponse(content=result)


@app.post("/predict_sample", tags=["Inference"])
def predict_sample(req: SampleRequest):
    """Run inference on one of the built-in sample images."""
    path = IMAGES_DIR / req.filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Sample not found")
    try:
        pil_image = Image.open(str(path)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Cannot open sample image")

    result = engine.predict(pil_image, model_id=req.model_id)
    return JSONResponse(content=result)
