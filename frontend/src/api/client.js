const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function parseResponse(response) {
  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      (typeof data === "string" ? data : null) ||
      `Request failed with HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function buildHeaders(tenantCode) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (tenantCode) {
    headers["X-Mandant-ID"] = tenantCode;
  }

  return headers;
}

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, value);
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function apiGet(path, tenantCode, params) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}${buildQuery(params)}`, {
      method: "GET",
      headers: buildHeaders(tenantCode),
    });
  } catch (err) {
    throw new Error(`Could not reach backend at ${BASE_URL}${path}: ${err.message}`);
  }
  return parseResponse(response);
}

export async function apiPost(path, body, tenantCode) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: buildHeaders(tenantCode),
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(`Could not reach backend at ${BASE_URL}${path}: ${err.message}`);
  }
  return parseResponse(response);
}

export function demoContext({ role = "municipality_admin", municipalityId = null, userId = null } = {}) {
  return {
    current_role: role,
    current_municipality_id: municipalityId,
    current_user_id: userId,
  };
}
