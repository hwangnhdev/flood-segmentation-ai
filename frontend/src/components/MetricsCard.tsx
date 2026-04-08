"use client";
import { ModelMetrics } from "@/types";
import { useEffect, useRef, useState } from "react";

interface Props {
  metrics: ModelMetrics;
}

function AnimatedNumber({ target, decimals = 1 }: { target: number; decimals?: number }) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const duration = 1200;
    const animate = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(eased * target);
      if (t < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target]);

  return <>{value.toFixed(decimals)}</>;
}

const METRIC_CARDS = [
  {
    key: "accuracy" as const,
    label: "Pixel Accuracy",
    color: "#00d4ff",
    desc: "Best validation accuracy",
    unit: "%",
    scale: 100,
  },
  {
    key: "dice" as const,
    label: "Dice Score",
    color: "#3b82f6",
    desc: "Best validation Dice",
    unit: "",
    scale: 1,
  },
  {
    key: "iou" as const,
    label: "Mean IoU",
    color: "#7c3aed",
    desc: "Best validation IoU",
    unit: "",
    scale: 1,
  },
];

export default function MetricsCard({ metrics }: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 14,
        marginBottom: 24,
      }}
      className="animate-in"
    >
      {METRIC_CARDS.map(({ key, label, color, desc, unit, scale }) => {
        const raw = metrics[key] * scale;
        return (
          <div
            key={key}
            className="glass"
            style={{
              padding: "24px 20px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Glow accent */}
            <div
              style={{
                position: "absolute",
                top: -30,
                right: -30,
                width: 90,
                height: 90,
                borderRadius: "50%",
                background: color,
                opacity: 0.08,
                filter: "blur(18px)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                fontSize: 32,
                fontWeight: 800,
                color,
                lineHeight: 1,
                marginBottom: 4,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <AnimatedNumber target={raw} decimals={key === "accuracy" ? 2 : 4} />
              {unit}
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#f0f6ff",
                marginBottom: 2,
              }}
            >
              {label}
            </div>
            <div style={{ fontSize: 11, color: "#8ea0bb" }}>{desc}</div>
          </div>
        );
      })}
    </div>
  );
}
