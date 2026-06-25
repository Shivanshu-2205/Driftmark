"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function AddModel() {
  const router = useRouter();

  // Form fields
  const [name, setName] = useState("");
  const [category, setCategory] = useState("binary_classification_tabular");
  const [thresholdModerate, setThresholdModerate] = useState(0.1);
  const [thresholdSevere, setThresholdSevere] = useState(0.25);
  const [targetColumn, setTargetColumn] = useState("default");

  // File states
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [scalerFile, setScalerFile] = useState<File | null>(null);
  const [baselineFile, setBaselineFile] = useState<File | null>(null);

  // Status states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelFile || !baselineFile || !name) {
      setErrorMessage("Please fill out all required fields and upload the model and baseline files.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", category);
      formData.append("threshold_moderate", thresholdModerate.toString());
      formData.append("threshold_severe", thresholdSevere.toString());
      formData.append("target_column", targetColumn);
      formData.append("model_file", modelFile);
      if (scalerFile) {
        formData.append("scaler_file", scalerFile);
      }
      formData.append("baseline_file", baselineFile);

      const newModel = await api.createModel(formData);
      router.push(`/models/${newModel.id}`);
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to register model.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen p-6 max-w-2xl mx-auto flex flex-col justify-center">
      <div className="mb-4">
        <Link href="/models" className="text-xs hover:underline text-[var(--phosphor)]">
          ← BACK TO REGISTRY
        </Link>
      </div>

      <div className="panel p-6 scanner-sweep">
        <header className="mb-6 border-b border-[var(--border-dim)] pb-3">
          <h1 className="text-xl font-bold glow-text tracking-tight uppercase">
            REGISTRATION PORTAL // NEW_MODEL
          </h1>
          <p className="text-[10px] opacity-50 mt-0.5">REGISTER PRE-TRAINED MODELS, BASELINES &amp; THRESHOLDS</p>
        </header>

        {errorMessage && (
          <div className="panel border-red-500 p-3 mb-6 text-xs text-red-400 bg-black/40">
            <span className="font-bold">REGISTRY REJECTION:</span> {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block mb-1 opacity-70 font-bold uppercase tracking-wider">Model Name *</label>
            <input
              type="text"
              placeholder="e.g. Credit Default Predictor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={submitting}
              className="w-full bg-black border border-[var(--border-dim)] p-2 text-white font-mono"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 opacity-70 font-bold uppercase tracking-wider">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={submitting}
                className="w-full bg-black border border-[var(--border-dim)] p-2 text-[var(--phosphor)] font-mono"
              >
                <option value="binary_classification_tabular">Binary Classification (Tabular)</option>
                <option value="regression_tabular">Regression (Tabular)</option>
                <option value="multiclass_tabular">Multiclass (Tabular)</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 opacity-70 font-bold uppercase tracking-wider">Target Label Column Name *</label>
              <input
                type="text"
                placeholder="e.g. default"
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                required
                disabled={submitting}
                className="w-full bg-black border border-[var(--border-dim)] p-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 opacity-70 font-bold uppercase tracking-wider">Moderate Drift Threshold (PSI) *</label>
              <input
                type="number"
                step="0.01"
                min="0.0"
                max="1.0"
                value={thresholdModerate}
                onChange={(e) => setThresholdModerate(Number(e.target.value))}
                required
                disabled={submitting}
                className="w-full bg-black border border-[var(--border-dim)] p-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="block mb-1 opacity-70 font-bold uppercase tracking-wider">Severe Drift Threshold (PSI) *</label>
              <input
                type="number"
                step="0.01"
                min="0.0"
                max="1.0"
                value={thresholdSevere}
                onChange={(e) => setThresholdSevere(Number(e.target.value))}
                required
                disabled={submitting}
                className="w-full bg-black border border-[var(--border-dim)] p-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="border-t border-[var(--border-dim)] pt-4 space-y-3">
            <h3 className="font-bold opacity-60 uppercase mb-2">▼ FILE ATTACHMENTS</h3>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block mb-1 opacity-70">Pre-trained Model File (.pkl) *</label>
                <input
                  type="file"
                  accept=".pkl"
                  onChange={(e) => setModelFile(e.target.files?.[0] || null)}
                  required
                  disabled={submitting}
                  className="w-full bg-black border border-[var(--border-dim)] p-1.5"
                  style={{ color: "var(--phosphor)" }}
                />
              </div>

              <div>
                <label className="block mb-1 opacity-70">Scaler Model File (.pkl, optional)</label>
                <input
                  type="file"
                  accept=".pkl"
                  onChange={(e) => setScalerFile(e.target.files?.[0] || null)}
                  disabled={submitting}
                  className="w-full bg-black border border-[var(--border-dim)] p-1.5"
                  style={{ color: "var(--phosphor)" }}
                />
              </div>

              <div>
                <label className="block mb-1 opacity-70">Baseline Dataset (.csv) *</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setBaselineFile(e.target.files?.[0] || null)}
                  required
                  disabled={submitting}
                  className="w-full bg-black border border-[var(--border-dim)] p-1.5"
                  style={{ color: "var(--phosphor)" }}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-between gap-4">
            <Link
              href="/models"
              className="px-4 py-2 font-bold border border-red-950 text-red-500 hover:bg-[rgba(239,68,68,0.06)] text-center w-1/3 transition"
            >
              CANCEL
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 font-bold border border-[var(--phosphor)] glow-border hover:bg-[rgba(57,255,106,0.08)] disabled:opacity-30 text-center w-2/3 transition"
            >
              {submitting ? "UPLOADING SYSTEM ASSETS..." : "SUBMIT REGISTRY RECORD"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
