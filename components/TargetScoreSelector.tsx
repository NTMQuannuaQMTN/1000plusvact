"use client";

import { useState } from "react";

const SCORE_PRESETS = [
  { label: 600, desc: "Trường địa phương" },
  { label: 800, desc: "Trường tốt" },
  { label: 900, desc: "Trường top" },
  { label: 1000, desc: "Mục tiêu VACT" },
  { label: 1100, desc: "Xuất sắc" },
  { label: 1150, desc: "Ưu tú" },
];

type Props = {
  defaultValue: number;
};

export default function TargetScoreSelector({
  defaultValue,
}: Props) {
  const [score, setScore] = useState(defaultValue);

  const updateScore = (value: number) => {
    const safe = Math.min(1200, Math.max(0, value));
    setScore(safe);
  };

  return (
    <>
      {/* Hidden input gửi lên server action */}
      <input
        type="hidden"
        name="target_score"
        value={score}
      />

      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
            alignItems: "center",
          }}
        >
          <label
            style={{
              fontWeight: 600,
              fontSize: 13,
              color: "var(--text)",
            }}
          >
            Mục tiêu của bạn
          </label>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <input
              type="number"
              min={0}
              max={1200}
              value={score}
              onChange={(e) =>
                updateScore(Number(e.target.value))
              }
              style={{
                width: 90,
                padding: "6px 8px",
                border: "1px solid var(--border)",
                borderRadius: 8,
                textAlign: "center",
                fontWeight: 700,
              }}
            />

            <span
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              /1200
            </span>
          </div>
        </div>

        <input
          type="range"
          min={0}
          max={1200}
          step={10}
          value={score}
          onChange={(e) =>
            updateScore(Number(e.target.value))
          }
          style={{
            width: "100%",
            accentColor: "var(--blue)",
            cursor: "pointer",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "var(--text-muted)",
            marginTop: 4,
          }}
        >
          <span>0</span>
          <span>600</span>
          <span>900</span>
          <span>1200</span>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
        }}
      >
        {SCORE_PRESETS.map(({ label, desc }) => (
          <button
            key={label}
            type="button"
            onClick={() => updateScore(label)}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: `1.5px solid ${
                score === label
                  ? "var(--blue)"
                  : "var(--border)"
              }`,
              background:
                score === label
                  ? "var(--blue-light)"
                  : "var(--bg)",
              cursor: "pointer",
              textAlign: "center",
              fontFamily: "inherit",
            }}
          >
            <p
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--navy)",
                marginBottom: 2,
              }}
            >
              {label}
            </p>

            <p
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
              }}
            >
              {desc}
            </p>
          </button>
        ))}
      </div>
    </>
  );
}