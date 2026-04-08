"use client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
  samples: string[];
  onSelect: (filename: string) => void;
  selected: string | null;
}

export default function SampleGallery({ samples, onSelect, selected }: Props) {
  if (samples.length === 0) return null;

  return (
    <div>
      <p style={{ color: "#8ea0bb", fontSize: 13, marginBottom: 10, fontWeight: 500 }}>
        Or pick a sample image:
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
        }}
      >
        {samples.map((name) => (
          <button
            key={name}
            onClick={() => onSelect(name)}
            style={{
              padding: 0,
              border: `2px solid ${selected === name ? "#00d4ff" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 10,
              overflow: "hidden",
              cursor: "pointer",
              background: "none",
              transition: "border-color 0.2s, transform 0.2s, box-shadow 0.2s",
              transform: selected === name ? "scale(1.04)" : "scale(1)",
              boxShadow:
                selected === name ? "0 0 14px rgba(0,212,255,0.4)" : "none",
            }}
            title={name}
            onMouseEnter={(e) => {
              if (selected !== name)
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "rgba(0,212,255,0.4)";
            }}
            onMouseLeave={(e) => {
              if (selected !== name)
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  "rgba(255,255,255,0.1)";
            }}
          >
            <img
              src={`${API}/samples/${encodeURIComponent(name)}`}
              alt={name}
              style={{
                width: "100%",
                aspectRatio: "1",
                objectFit: "cover",
                display: "block",
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
