"use client";
import { ClassStat } from "@/types";

interface Props {
  classStats: ClassStat[];
}

export default function ClassLegend({ classStats }: Props) {
  return (
    <div className="glass animate-in" style={{ padding: "18px 20px" }}>
      <h3
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#f0f6ff",
          marginBottom: 14,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        Class Distribution
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {classStats.map((cls) => (
          <div
            key={cls.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {/* Color swatch */}
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: cls.hex,
                flexShrink: 0,
                boxShadow: `0 0 6px ${cls.hex}55`,
              }}
            />
            {/* Class name */}
            <span
              style={{
                fontSize: 12,
                color: "#d0dff0",
                flex: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {cls.name}
            </span>
            {/* Bar */}
            <div
              style={{
                flex: 2,
                height: 6,
                borderRadius: 3,
                background: "rgba(255,255,255,0.06)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(cls.pixel_pct, 100)}%`,
                  background: cls.hex,
                  borderRadius: 3,
                  transition: "width 0.8s ease",
                  minWidth: cls.pixel_pct > 0 ? 2 : 0,
                }}
              />
            </div>
            {/* Percentage */}
            <span
              style={{
                fontSize: 11,
                color: "#8ea0bb",
                minWidth: 40,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {cls.pixel_pct.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
