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

function buildHistogram(values: number[], nBins = 12) {
  const min = Math.min(...values);
  const max = Math.max(...values);
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
  baseline,
  current,
}: {
  baseline: number[];
  current: number[];
}) {
  const baseBins = buildHistogram(baseline);
  const curBins = buildHistogram(current, baseBins.length);

  const data = baseBins.map((b, i) => ({
    bin: b.binStart.toFixed(0),
    baseline: (b.count / baseline.length) * 100,
    current: (curBins[i].count / current.length) * 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="rgba(57,255,106,0.08)" />
        <XAxis dataKey="bin" stroke="#39ff6a" tick={{ fill: "#39ff6a", fontSize: 10 }} />
        <YAxis stroke="#39ff6a" tick={{ fill: "#39ff6a", fontSize: 10 }} unit="%" />
        <Tooltip
          contentStyle={{
            background: "#0a100a",
            border: "1px solid rgba(57,255,106,0.3)",
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar dataKey="baseline" name="Baseline" fill="#1f8f3e" />
        <Bar dataKey="current" name="Current Batch" fill="#ffb627" />
      </BarChart>
    </ResponsiveContainer>
  );
}
