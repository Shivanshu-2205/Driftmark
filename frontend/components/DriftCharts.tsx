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
      <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
        <CartesianGrid stroke="rgba(66,74,65,0.3)" strokeDasharray="3 3" />
        <XAxis dataKey="batch" stroke="#70786e" tick={{ fill: "#a5ada3", fontSize: 11 }} />
        <YAxis stroke="#70786e" tick={{ fill: "#a5ada3", fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            background: "#151b15",
            border: "1px solid #424a41",
            borderRadius: "6px",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "#e0e8dc",
          }}
          labelStyle={{ color: "#4ae176", fontWeight: 600 }}
        />
        <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-sans)", paddingTop: 10 }} />
        <ReferenceLine
          y={thresholdSevere}
          stroke="#ef4444"
          strokeDasharray="4 4"
          label={{ value: "CRITICAL (0.25)", fill: "#ef4444", fontSize: 10, position: "top" }}
        />
        <Line
          type="monotone"
          dataKey="feature_psi"
          name="Feature PSI"
          stroke="#22c55e"
          strokeWidth={2}
          dot={{ r: 3, fill: "#22c55e" }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="prediction_psi"
          name="Prediction PSI"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={{ r: 3, fill: "#f59e0b" }}
          activeDot={{ r: 5 }}
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
      <LineChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
        <CartesianGrid stroke="rgba(66,74,65,0.3)" strokeDasharray="3 3" />
        <XAxis dataKey="batch" stroke="#70786e" tick={{ fill: "#a5ada3", fontSize: 11 }} />
        <YAxis domain={[60, 100]} stroke="#70786e" tick={{ fill: "#a5ada3", fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            background: "#151b15",
            border: "1px solid #424a41",
            borderRadius: "6px",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "#e0e8dc",
          }}
          labelStyle={{ color: "#4ae176", fontWeight: 600 }}
        />
        <ReferenceLine
          y={85}
          stroke="#ef4444"
          strokeDasharray="4 4"
          label={{ value: "SLA FLOOR (85%)", fill: "#ef4444", fontSize: 10, position: "insideBottomRight" }}
        />
        <Line
          type="monotone"
          dataKey="accuracy"
          name="Model Accuracy %"
          stroke="#4ae176"
          strokeWidth={2}
          dot={{ r: 3, fill: "#4ae176" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
