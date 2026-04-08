import { useState } from "react";
import { PredictionResult } from "@/types";

interface Props {
  result: PredictionResult;
}

export default function ResultsPanel({ result }: Props) {
  const [opacity, setOpacity] = useState(0.5);

  return (
    <div className="animate-in">
      {/* 3-Column Grid that handles aspect ratio naturally */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 24,
          alignItems: "start",
        }}
      >
        {/* Panel 1: Input */}
        <div className="glass" style={{ padding: 12 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#8ea0bb",
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Input Image
          </p>
          <img
            src={`data:image/png;base64,${result.input_image}`}
            alt="Input"
            style={{
              width: "100%",
              height: "auto",
              borderRadius: 8,
              display: "block",
            }}
          />
        </div>

        {/* Panel 2: Predicted Mask */}
        <div className="glass" style={{ padding: 12 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#8ea0bb",
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Predicted Mask
          </p>
          <img
            src={`data:image/png;base64,${result.predicted_mask}`}
            alt="Mask"
            style={{
              width: "100%",
              height: "auto",
              borderRadius: 8,
              display: "block",
            }}
          />
        </div>

        {/* Panel 3: Interactive Overlay */}
        <div className="glass" style={{ padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#8ea0bb",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Overlay Visualization
            </p>
            <span style={{ fontSize: 11, color: "#00d4ff", fontWeight: 700 }}>
              {Math.round(opacity * 100)}%
            </span>
          </div>

          {/* Interactive Layered Container */}
          <div style={{ position: "relative", width: "100%", borderRadius: 8, overflow: "hidden", marginBottom: 12 }}>
            {/* Base layer: Original image */}
            <img
              src={`data:image/png;base64,${result.input_image}`}
              alt="Base"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            {/* Top layer: Mask with variable opacity */}
            <img
              src={`data:image/png;base64,${result.predicted_mask}`}
              alt="Overlay mask"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                opacity: opacity,
                transition: "opacity 0.1s ease",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Opacity Slider */}
          <div style={{ padding: "0 4px" }}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              style={{
                width: "100%",
                height: 4,
                borderRadius: 2,
                background: "rgba(255,255,255,0.1)",
                appearance: "none",
                cursor: "pointer",
                outline: "none",
              }}
              className="opacity-slider"
            />
          </div>
        </div>
      </div>
      <style>{`
        .opacity-slider::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #00d4ff;
          box-shadow: 0 0 10px rgba(0,212,255,0.5);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
