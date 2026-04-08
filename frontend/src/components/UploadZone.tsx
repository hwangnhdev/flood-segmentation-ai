"use client";
import { useCallback, useState } from "react";

interface Props {
  onImageSelected: (file: File) => void;
  previewUrl: string | null;
}

export default function UploadZone({ onImageSelected, previewUrl }: Props) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) onImageSelected(file);
    },
    [onImageSelected]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImageSelected(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${dragging ? "#00d4ff" : "rgba(255,255,255,0.15)"}`,
        borderRadius: 16,
        padding: previewUrl ? 0 : "2.5rem 1.5rem",
        background: dragging
          ? "rgba(0,212,255,0.06)"
          : "rgba(255,255,255,0.02)",
        transition: "all 0.25s ease",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        minHeight: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 12,
      }}
      onClick={() => document.getElementById("fileInput")?.click()}
    >
      <input
        id="fileInput"
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleChange}
      />

      {previewUrl ? (
        // Preview
        <>
          <img
            src={previewUrl}
            alt="Preview"
            style={{
              width: "100%",
              height: "auto",
              maxHeight: 500,
              objectFit: "contain",
              borderRadius: 14,
              display: "block",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 14,
              opacity: 0,
              transition: "opacity 0.2s",
            }}
            className="upload-hover-overlay"
          >
            <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>
              Change Image
            </span>
          </div>
          <style>{`.upload-hover-overlay:hover { opacity: 1 !important; }`}</style>
        </>
      ) : (
        // Drop zone placeholder
        <>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#f0f6ff", fontWeight: 600, marginBottom: 4 }}>
              Upload Image
            </p>
            <p style={{ color: "#8ea0bb", fontSize: 13 }}>
              Drag and drop or click to browse
            </p>
          </div>
        </>
      )}
    </div>
  );
}
