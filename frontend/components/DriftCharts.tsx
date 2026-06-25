"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { DriftRun } from "@/lib/api";

export function DriftTrendChart({ runs, thresholdSevere = 0.25 }: { runs: DriftRun[]; thresholdSevere?: number }) {
  const data = runs.map((r) => ({
    batch: r.batch_name.replace("batch_", "B"),
    feature_psi: r.overall_psi,
    prediction_psi: r.prediction_psi,
    accuracy: r.accuracy ? r.accuracy * 100 : null,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(57,255,106,0.1)" />
        <XAxis dataKey="batch" stroke="#39ff6a" tick={{ fill: "#39ff6a", fontSize: 11 }} />
        <YAxis stroke="#39ff6a" tick={{ fill: "#39ff6a", fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            background: "#0a100a",
            border: "1px solid rgba(57,255,106,0.3)",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 12,
          }}
          labelStyle={{ color: "#7fffa0" }}
        />
        <Legend wrapperStyle={{ fontSize: 11, fontFamily: "JetBrains Mono" }} />
        <ReferenceLine
          y={thresholdSevere}
          stroke="#ff4136"
          strokeDasharray="4 4"
          label={{ value: "SEVERE", fill: "#ff4136", fontSize: 10 }}
        />
        <Line
          type="monotone"
          dataKey="feature_psi"
          name="Feature PSI"
          stroke="#39ff6a"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="prediction_psi"
          name="Prediction PSI"
          stroke="#ffb627"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function AccuracyTrendChart({ runs }: { runs: DriftRun[] }) {
  const data = runs.map((r) => ({
    batch: r.batch_name.replace("batch_", "B"),
    accuracy: r.accuracy ? Number((r.accuracy * 100).toFixed(2)) : null,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(57,255,106,0.1)" />
        <XAxis dataKey="batch" stroke="#39ff6a" tick={{ fill: "#39ff6a", fontSize: 11 }} />
        <YAxis domain={[60, 100]} stroke="#39ff6a" tick={{ fill: "#39ff6a", fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            background: "#0a100a",
            border: "1px solid rgba(57,255,106,0.3)",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 12,
          }}
        />
        <Line
          type="monotone"
          dataKey="accuracy"
          name="Model Accuracy %"
          stroke="#7fffa0"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
