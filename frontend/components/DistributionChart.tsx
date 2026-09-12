"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function buildHistogram(values: number[] = [], nBins = 12) {
  if (!values || values.length === 0) {
    return Array.from({ length: nBins }, (_, i) => ({
      binStart: i,
      count: 0,
    }));
  }

  let min = values[0];
  let max = values[0];
  for (let i = 1; i < values.length; i++) {
    if (values[i] < min) min = values[i];
    if (values[i] > max) max = values[i];
  }

  const width = (max - min) / nBins || 1;
  const bins = Array.from({ length: nBins }, (_, i) => ({
    binStart: min + i * width,
    count: 0,
  }));

  values.forEach((v) => {
    let idx = Math.floor((v - min) / width);
    if (idx >= nBins) idx = nBins - 1;
    if (idx < 0) idx = 0;
    bins[idx].count += 1;
  });
  return bins;
}

export function DistributionChart({
  baseline = [],
  current = [],
}: {
  baseline?: number[];
  current?: number[];
}) {
  const baseLen = baseline.length || 1;
  const curLen = current.length || 1;
  const baseBins = buildHistogram(baseline);
  const curBins = buildHistogram(current, baseBins.length);

  const data = baseBins.map((b, i) => ({
    bin: b.binStart.toFixed(0),
    baseline: Number(((b.count / baseLen) * 100).toFixed(1)),
    current: Number(((curBins[i].count / curLen) * 100).toFixed(1)),
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
        <CartesianGrid stroke="rgba(66,74,65,0.25)" strokeDasharray="3 3" />
        <XAxis dataKey="bin" stroke="#70786e" tick={{ fill: "#a5ada3", fontSize: 10 }} />
        <YAxis stroke="#70786e" tick={{ fill: "#a5ada3", fontSize: 10 }} unit="%" />
        <Tooltip
          contentStyle={{
            background: "#151b15",
            border: "1px solid #424a41",
            borderRadius: "6px",
            fontSize: 12,
            color: "#e0e8dc",
          }}
          labelStyle={{ color: "#4ae176", fontWeight: 600 }}
        />
        <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-sans)", paddingTop: 8 }} />
        <Bar dataKey="baseline" name="Baseline Distribution" fill="#22c55e" radius={[3, 3, 0, 0]} />
        <Bar dataKey="current" name="Current Batch" fill="#f59e0b" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
