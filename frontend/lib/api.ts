const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export interface Model {
  id: number;
  name: string;
  category: string;
  status: "active" | "blocked_pending_retrain";
  threshold_moderate: number;
  threshold_severe: number;
  feature_schema: string[];
  created_at: string;
  last_run: {
    id: number;
    batch_name: string;
    timestamp: string;
    overall_psi: number;
    overall_severity: "none" | "moderate" | "severe";
  } | null;
  active_alerts_count: number;
}

export interface DriftRun {
  id: number;
  model_id: number;
  batch_name: string;
  timestamp: string;
  overall_psi: number;
  overall_severity: "none" | "moderate" | "severe";
  top_drifted_feature: string;
  prediction_psi: number;
  prediction_severity: "none" | "moderate" | "severe";
  target_psi: number | null;
  target_severity: string | null;
  accuracy: number | null;
  model_version: number;
}

export interface FeatureDriftDetail {
  psi: number;
  ks_statistic: number;
  ks_p_value: number;
  js_divergence: number;
  severity: string;
  ref_mean: number;
  cur_mean: number;
  ref_std: number;
  cur_std: number;
}

export interface DriftRunDetail extends DriftRun {
  feature_drift: Record<string, FeatureDriftDetail>;
}

export interface Alert {
  id: number;
  model_id: number;
  drift_run_id: number;
  batch_name: string;
  timestamp: string;
  severity: string;
  drift_type: string;
  feature_name: string | null;
  message: string;
  acknowledged: boolean;
}

export interface ModelVersion {
  id: number;
  model_id: number;
  version: number;
  trained_at: string;
  trigger_reason: string;
  accuracy: number | null;
  auc: number | null;
  is_active: boolean;
}

export interface PendingBatch {
  id: number;
  batch_name: string;
  row_count: number;
  created_at: string;
}

export interface ModelDetailData {
  model: Model;
  runs: DriftRun[];
  alerts: Alert[];
  versions: ModelVersion[];
  pending_batches: PendingBatch[];
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("driftwatch_token");
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const opts: RequestInit = {
    ...options,
    credentials: "include",
    headers: {
      ...(options?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
  const res = await fetch(`${API_BASE}${path}`, opts);
  if (res.status === 401) {
    // Token expired or invalid – redirect to login
    if (typeof window !== "undefined") {
      localStorage.removeItem("driftwatch_token");
      window.location.href = "/auth/login";
    }
  }
  if (!res.ok) {
    let errorDetail = "";
    try {
      const errBody = await res.json();
      errorDetail = errBody.detail?.message || errBody.detail || JSON.stringify(errBody);
    } catch (e) {}
    throw new Error(errorDetail || `API error ${res.status}: ${path}`);
  }
  return res.json();
}

export async function login(email: string, password: string): Promise<{ access_token: string }> {
  const body = new URLSearchParams();
  body.append("username", email);
  body.append("password", password);
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Login failed");
  }
  const data = await res.json();
  if (data.access_token) {
    localStorage.setItem("driftwatch_token", data.access_token);
  }
  return data;
}

export function logout() {
  localStorage.removeItem("driftwatch_token");
  window.location.href = "/auth/login";
}


export const api = {
  health: () => fetchJson<{ status: string }>("/"),
  models: () => fetchJson<Model[]>("/models"),
  modelDetail: (id: number) => fetchJson<ModelDetailData>(`/models/${id}`),
  createModel: (formData: FormData) =>
    fetchJson<Model>("/models", { method: "POST", body: formData }),
  deleteModel: (id: number) =>
    fetchJson<{ status: string }>(`/models/${id}`, { method: "DELETE" }),
  uploadBatch: (id: number, formData: FormData) =>
    fetchJson<{ message: string; batches_created: number }>(`/models/${id}/upload-batch`, {
      method: "POST",
      body: formData,
    }),
  processNextBatch: (id: number, force = false) =>
    fetchJson<any>(`/models/${id}/process-batch?force=${force}`, { method: "POST" }),
  retrainModel: (id: number) =>
    fetchJson<any>(`/models/${id}/retrain`, { method: "POST" }),
  acknowledgeAlert: (id: number) =>
    fetchJson<{ status: string }>(`/alerts/${id}/acknowledge`, { method: "POST" }),
  distribution: (modelId: number, batch: string, feature: string) =>
    fetchJson<{ feature: string; baseline_values: number[]; current_values: number[] }>(
      `/models/${modelId}/distribution/${batch}/${feature}`
    ),
  driftRunDetail: (modelId: number, runId: number) =>
    fetchJson<DriftRunDetail>(`/models/${modelId}/drift-runs/${runId}`),
  getReportUrl: (modelId: number, runId: number) => {
    const token = getToken();
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";
    return `${API_BASE}/models/${modelId}/drift-runs/${runId}/report${tokenParam}`;
  },
};

