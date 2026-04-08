"use client";

import { useEffect, useState, useCallback } from "react";
import UploadZone from "@/components/UploadZone";
import SampleGallery from "@/components/SampleGallery";
import ResultsPanel from "@/components/ResultsPanel";
import MetricsCard from "@/components/MetricsCard";
import ClassLegend from "@/components/ClassLegend";
import type { PredictionResult, AppConfig, ModelInfo } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Mode = "upload" | "sample";

export default function Home() {
  const [samples, setSamples] = useState<string[]>([]);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [mode, setMode] = useState<Mode>("upload");
  const [selectedModelId, setSelectedModelId] = useState<string>("best_model_iou");

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Sample state
  const [selectedSample, setSelectedSample] = useState<string | null>(null);

  // Inference state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch sample list on mount
  useEffect(() => {
    fetch(`${API}/samples`)
      .then((r) => r.json())
      .then((d) => setSamples(d.samples ?? []))
      .catch(() => {});

    fetch(`${API}/config`)
      .then((r) => r.json())
      .then((d) => setConfig(d))
      .catch(() => {});
  }, []);

  const handleFileSelected = useCallback((file: File) => {
    setUploadFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  }, []);

  const handleSampleSelect = useCallback((name: string) => {
    setSelectedSample(name);
    setResult(null);
    setError(null);
  }, []);

  const canAnalyze =
    (mode === "upload" && uploadFile !== null) ||
    (mode === "sample" && selectedSample !== null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (mode === "upload" && uploadFile) {
        const form = new FormData();
        form.append("file", uploadFile);
        form.append("model_id", selectedModelId);
        const res = await fetch(`${API}/predict`, { method: "POST", body: form });
        if (!res.ok) throw new Error(await res.text());
        setResult(await res.json());
      } else if (mode === "sample" && selectedSample) {
        const res = await fetch(`${API}/predict_sample`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            filename: selectedSample,
            model_id: selectedModelId
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        setResult(await res.json());
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError("Inference failed: " + msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="hero-bg"
      style={{ minHeight: "100vh", padding: "0 0 60px" }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "20px 0",
          marginBottom: 40,
          background: "rgba(8,13,26,0.7)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div>
                <h1
                  className="gradient-text"
                  style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}
                >
                  FloodSeg AI
                </h1>
                <p style={{ fontSize: 11, color: "#8ea0bb", marginTop: 2 }}>
                  Flood Scene Segmentation
                </p>
              </div>
            </div>
            {/* Model badge */}
            <div
              style={{
                background: "rgba(0,212,255,0.08)",
                border: "1px solid rgba(0,212,255,0.2)",
                borderRadius: 20,
                padding: "5px 14px",
                fontSize: 12,
                color: "#00d4ff",
                fontWeight: 600,
              }}
            >
              ConvNeXt-Tiny ViT-UNet · 10 classes
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px" }}>
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2
            style={{
              fontSize: "clamp(1.8rem,4vw,2.8rem)",
              fontWeight: 900,
              lineHeight: 1.1,
              marginBottom: 14,
            }}
          >
            <span className="gradient-text">Aerial Flood Segmentation</span>
            <br />
            <span style={{ color: "#f0f6ff" }}>Powered by Hybrid ViT-UNet</span>
          </h2>
          <p style={{ color: "#8ea0bb", fontSize: 16, maxWidth: 560, margin: "0 auto" }}>
            Upload or select a sample aerial image to instantly segment 10 flood-related scene classes with deep learning.
          </p>
        </div>

        {/* ── 2-column layout ─────────────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "320px 1fr",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* LEFT PANEL ───────────────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Model Selection */}
            <div className="glass" style={{ padding: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#8ea0bb", marginBottom: 8, textTransform: "uppercase" }}>
                Select Model Version
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {config?.available_models?.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedModelId(m.id);
                      setResult(null);
                    }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `1px solid ${selectedModelId === m.id ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.06)"}`,
                      background: selectedModelId === m.id ? "rgba(0,212,255,0.08)" : "transparent",
                      color: selectedModelId === m.id ? "#00d4ff" : "#8ea0bb",
                      fontSize: 13,
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{m.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Tabs */}
            <div
              className="glass"
              style={{
                display: "flex",
                padding: 6,
                gap: 4,
                borderRadius: 12,
              }}
            >
              {(["upload", "sample"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setResult(null);
                    setError(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: 8,
                    border: "none",
                    background:
                      mode === m
                        ? "linear-gradient(135deg, #00d4ff22, #3b82f622)"
                        : "transparent",
                    color: mode === m ? "#00d4ff" : "#8ea0bb",
                    fontWeight: mode === m ? 700 : 500,
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    boxShadow:
                      mode === m ? "inset 0 0 0 1px rgba(0,212,255,0.3)" : "none",
                  }}
                >
                  {m === "upload" ? "Upload" : "Samples"}
                </button>
              ))}
            </div>

            {/* Input area */}
            <div className="glass" style={{ padding: 16 }}>
              {mode === "upload" ? (
                <UploadZone
                  onImageSelected={handleFileSelected}
                  previewUrl={previewUrl}
                />
              ) : (
                <SampleGallery
                  samples={samples}
                  onSelect={handleSampleSelect}
                  selected={selectedSample}
                />
              )}
            </div>

            {/* Analyze button */}
            <button
              className="btn-glow"
              onClick={handleAnalyze}
              disabled={!canAnalyze || loading}
              style={{
                width: "100%",
                padding: "14px 0",
                fontSize: 15,
                letterSpacing: "0.04em",
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  Analyzing…
                </span>
              ) : (
                "Run Segmentation"
              )}
            </button>

            {/* Error */}
            {error && (
              <div
                style={{
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#f87171",
                }}
              >
                Error: {error}
              </div>
            )}

            {/* Class Legend (always shown) */}
            {result && <ClassLegend classStats={result.class_stats} />}
          </div>

          {/* RIGHT PANEL ──────────────────────────────────────────────────── */}
          <div>
            {result ? (
              <>
                <MetricsCard metrics={result.model_metrics} />
                <ResultsPanel result={result} />
              </>
            ) : (
              /* Placeholder before first analysis */
              <div
                className="glass"
                style={{
                  height: 420,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 16,
                  color: "#8ea0bb",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontWeight: 600, color: "#d0dff0", marginBottom: 6 }}>
                    Results will appear here
                  </p>
                  <p style={{ fontSize: 13 }}>
                    Select an image and click{" "}
                    <em style={{ color: "#00d4ff" }}>Run Segmentation</em>
                  </p>
                </div>

                {/* Mini metric preview */}
                <div
                  style={{
                    display: "flex",
                    gap: 20,
                    marginTop: 12,
                    padding: "14px 24px",
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {[
                    { label: "Accuracy", val: "87.49%", color: "#00d4ff" },
                    { label: "Dice",     val: "0.7522",  color: "#3b82f6" },
                    { label: "IoU",      val: "0.6825",  color: "#7c3aed" },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color }}>{val}</div>
                      <div style={{ fontSize: 11, marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
