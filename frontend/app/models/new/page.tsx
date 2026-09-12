"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { AppNavbar } from "@/components/Navbar";
import { ErrorBanner } from "@/components/ui";

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
      setErrorMessage("Please fill out all required fields and attach the pre-trained model and baseline dataset.");
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
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <AppNavbar />

      <main style={{ maxWidth: 740, margin: "0 auto", padding: "32px 20px" }}>
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: 20 }}>
          <Link href="/models" style={{ fontSize: 12, color: "var(--green)", textDecoration: "none" }}>
            ← Back to Model Registry
          </Link>
        </div>

        <div className="card" style={{ padding: 32 }}>
          {/* Header */}
          <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 20, marginBottom: 24 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em", marginBottom: 6 }}>
              Register New Model
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
              Register pre-trained model artifacts, statistical reference baselines, and drift sensitivity thresholds.
            </p>
          </div>

          {errorMessage && <ErrorBanner message={errorMessage} />}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Section: General Configuration */}
            <div>
              <label className="label" htmlFor="model-name">
                Model Name <span style={{ color: "var(--red)" }}>*</span>
              </label>
              <input
                id="model-name"
                type="text"
                placeholder="e.g. Credit Default Classifier v3"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={submitting}
                className="input"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label className="label" htmlFor="category">
                  Category <span style={{ color: "var(--red)" }}>*</span>
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={submitting}
                  className="input"
                >
                  <option value="binary_classification_tabular">Binary Classification (Tabular)</option>
                  <option value="regression_tabular">Regression (Tabular)</option>
                  <option value="multiclass_tabular">Multiclass (Tabular)</option>
                </select>
              </div>

              <div>
                <label className="label" htmlFor="target-col">
                  Target Label Column <span style={{ color: "var(--red)" }}>*</span>
                </label>
                <input
                  id="target-col"
                  type="text"
                  placeholder="e.g. default"
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                  required
                  disabled={submitting}
                  className="input"
                />
              </div>
            </div>

            {/* Thresholds */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label className="label" htmlFor="mod-thresh">
                  Moderate Drift Threshold (PSI) <span style={{ color: "var(--red)" }}>*</span>
                </label>
                <input
                  id="mod-thresh"
                  type="number"
                  step="0.01"
                  min="0.0"
                  max="1.0"
                  value={thresholdModerate}
                  onChange={(e) => setThresholdModerate(Number(e.target.value))}
                  required
                  disabled={submitting}
                  className="input"
                />
                <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginTop: 4 }}>
                  Warning triggers when PSI reaches this value (Default: 0.10)
                </span>
              </div>

              <div>
                <label className="label" htmlFor="sev-thresh">
                  Severe Drift Threshold (PSI) <span style={{ color: "var(--red)" }}>*</span>
                </label>
                <input
                  id="sev-thresh"
                  type="number"
                  step="0.01"
                  min="0.0"
                  max="1.0"
                  value={thresholdSevere}
                  onChange={(e) => setThresholdSevere(Number(e.target.value))}
                  required
                  disabled={submitting}
                  className="input"
                />
                <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginTop: 4 }}>
                  Ingestion locks when PSI reaches this value (Default: 0.25)
                </span>
              </div>
            </div>

            {/* Section: File Attachments */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20, marginTop: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 14 }}>
                Artifact Attachments
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label className="label">
                    Pre-trained Model Artifact (.pkl) <span style={{ color: "var(--red)" }}>*</span>
                  </label>
                  <input
                    type="file"
                    accept=".pkl"
                    onChange={(e) => setModelFile(e.target.files?.[0] || null)}
                    required
                    disabled={submitting}
                    className="input"
                    style={{ padding: 6, fontSize: 12 }}
                  />
                </div>

                <div>
                  <label className="label">
                    Scaler Artifact (.pkl, optional)
                  </label>
                  <input
                    type="file"
                    accept=".pkl"
                    onChange={(e) => setScalerFile(e.target.files?.[0] || null)}
                    disabled={submitting}
                    className="input"
                    style={{ padding: 6, fontSize: 12 }}
                  />
                </div>

                <div>
                  <label className="label">
                    Baseline Reference Dataset (.csv) <span style={{ color: "var(--red)" }}>*</span>
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setBaselineFile(e.target.files?.[0] || null)}
                    required
                    disabled={submitting}
                    className="input"
                    style={{ padding: 6, fontSize: 12 }}
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
              <Link
                href="/models"
                className="btn btn-outline"
                style={{ padding: "8px 20px" }}
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ padding: "8px 24px" }}
              >
                {submitting ? "Uploading Artifacts..." : "Register Model"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}