"""
inference.py  –  InferenceEngine for ConvNeXt-Tiny ViT-UNet
Loads the trained weights and runs segmentation inference on a PIL Image.
"""

import io
import base64
import json
import os
from pathlib import Path

import cv2
import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image

from model import ViT_UNet

# ─── Setup ─────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
CONFIG   = json.loads((BASE_DIR / "config.json").read_text())
WEIGHTS_DIR = PROJECT_ROOT / "convnext_tiny_v2"
WEIGHTS_MAP = {
    "best_model_iou":   WEIGHTS_DIR / "best_model_iou.pth",
    "best_model_iou_2": WEIGHTS_DIR / "best_model_iou_2.pth",
}
DEVICE   = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ─── ImageNet normalisation constants ──────────────────────────────────────────
MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
STD  = np.array([0.229, 0.224, 0.225], dtype=np.float32)

# Build palette (10 × 3 numpy array)
PALETTE = np.array([cls["color"] for cls in CONFIG["classes"]], dtype=np.uint8)


def _preprocess(img_rgb: np.ndarray) -> torch.Tensor:
    """Resize → normalize → to tensor [1,3,512,512]."""
    img = cv2.resize(img_rgb, (512, 512)).astype(np.float32) / 255.0
    img = (img - MEAN) / STD
    tensor = torch.from_numpy(img.transpose(2, 0, 1)).unsqueeze(0).float()
    return tensor


def _to_base64_png(arr: np.ndarray) -> str:
    """Convert HWC uint8 numpy array → base64 PNG string."""
    img = Image.fromarray(arr.astype(np.uint8))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def _colored_mask(pred_mask: np.ndarray) -> np.ndarray:
    """pred_mask: (H,W) int → (H,W,3) uint8 colored mask."""
    color_mask = PALETTE[pred_mask]          # fancy indexing → H×W×3
    return color_mask


def _overlay(img_rgb_512: np.ndarray, color_mask: np.ndarray, alpha: float = 0.50) -> np.ndarray:
    """Alpha blend original image + coloured mask."""
    blended = (alpha * img_rgb_512 + (1 - alpha) * color_mask).clip(0, 255).astype(np.uint8)
    return blended


def _class_stats(pred_mask: np.ndarray) -> list[dict]:
    """Per-class pixel percentage."""
    total = pred_mask.size
    stats = []
    for cls in CONFIG["classes"]:
        pct = float((pred_mask == cls["id"]).sum()) / total * 100
        stats.append({
            "id":    cls["id"],
            "name":  cls["name"],
            "color": "rgb({},{},{})".format(*cls["color"]),
            "hex":   "#{:02x}{:02x}{:02x}".format(*cls["color"]),
            "pixel_pct": round(pct, 2),
        })
    # Sort by descending coverage
    stats.sort(key=lambda x: x["pixel_pct"], reverse=True)
    return stats


class InferenceEngine:
    """Singleton-style inference engine. Loads weights once on first call."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._models = {}  # Store loaded models: { 'id': model_obj }
        return cls._instance

    def _load_model(self, model_id: str):
        if model_id in self._models:
            return self._models[model_id]

        if model_id not in WEIGHTS_MAP:
            raise ValueError(f"Unknown model ID: {model_id}")

        weights_path = WEIGHTS_MAP[model_id]
        if not weights_path.exists():
            raise FileNotFoundError(f"Weights not found: {weights_path}")

        print(f"[InferenceEngine] Loading {model_id} on {DEVICE}...")
        model = ViT_UNet(num_classes=10, dim=512, backbone_name="convnext_tiny")
        state = torch.load(str(weights_path), map_location=DEVICE, weights_only=False)

        if isinstance(state, dict) and "state_dict" in state:
            state = state["state_dict"]
        elif isinstance(state, dict) and "model_state_dict" in state:
            state = state["model_state_dict"]

        model.load_state_dict(state, strict=False)
        model.eval()
        model.to(DEVICE)
        
        self._models[model_id] = model
        return model

    def predict(self, pil_image: Image.Image, model_id: str = "best_model_iou") -> dict:
        """
        Run segmentation on a PIL Image.

        Returns
        -------
        dict with keys:
            input_image    – base64 PNG (resized to 512)
            predicted_mask – base64 PNG (colored)
            overlay        – base64 PNG (blend)
            class_stats    – list[dict]
            model_metrics  – dict from config (val accuracy/dice/iou)
        """
        model = self._load_model(model_id)

        # ── Pre-process ────────────────────────────────────────────────────────
        img_rgb   = np.array(pil_image.convert("RGB"))
        orig_h, orig_w = img_rgb.shape[:2]
        tensor    = _preprocess(img_rgb).to(DEVICE)

        # ── Inference ──────────────────────────────────────────────────────────
        with torch.no_grad():
            main_out, _, _ = model(tensor)          # (1, C, H, W)
            probs = F.softmax(main_out, dim=1)
            pred  = torch.argmax(probs, dim=1).squeeze(0) # (H, W)
            pred_np = pred.cpu().numpy().astype(np.int32) # (512, 512)

        # ── Visualisations ─────────────────────────────────────────────────────
        color_mask = _colored_mask(pred_np)
        
        # Resize back to original resolution
        color_mask_orig = cv2.resize(color_mask, (orig_w, orig_h), interpolation=cv2.INTER_NEAREST)
        pred_np_orig    = cv2.resize(pred_np.astype(np.uint8), (orig_w, orig_h), interpolation=cv2.INTER_NEAREST)
        
        # Create overlay on original image
        overlay = _overlay(img_rgb, color_mask_orig)

        return {
            "input_image":    _to_base64_png(img_rgb),
            "predicted_mask": _to_base64_png(color_mask_orig),
            "overlay":        _to_base64_png(overlay),
            "class_stats":    _class_stats(pred_np_orig),
            "model_metrics":  CONFIG["val_metrics"],
        }


# ── Singleton engine ────────────────────────────────────────────────────────────
engine = InferenceEngine()
