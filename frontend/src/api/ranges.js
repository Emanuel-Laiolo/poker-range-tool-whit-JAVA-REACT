// api/ranges.js
// -----------------------------------------------------------------------------
// Small wrapper around fetch() to call the Spring Boot backend.
//
// IMPORTANT:
// - In dev, Vite proxies /api -> http://localhost:8080
//   so we can call '/api/ranges' from the browser.
//
// Endpoints:
// - GET    /api/ranges
// - GET    /api/ranges/{id}
// - POST   /api/ranges
// - PUT    /api/ranges/{id}
// - DELETE /api/ranges/{id}
// - POST   /api/ranges/validate
// - POST   /api/ranges/stats
// -----------------------------------------------------------------------------

const API_BASE = '';

async function http(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    // backend error format: { error, details? }
    let msg = `${res.status} ${res.statusText}`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
      if (j?.details) msg += `\n${j.details.join('\n')}`;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(msg);
  }

  // DELETE returns 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

export async function listRanges() {
  return http('GET', '/api/ranges');
}

export async function getRange(id) {
  return http('GET', `/api/ranges/${id}`);
}

export async function createRange(payload) {
  return http('POST', '/api/ranges', payload);
}

export async function updateRange(id, payload) {
  return http('PUT', `/api/ranges/${id}`, payload);
}

export async function deleteRange(id) {
  return http('DELETE', `/api/ranges/${id}`);
}

export async function validateRangeServer(payload) {
  return http('POST', '/api/ranges/validate', payload);
}

export async function statsServer(payload) {
  return http('POST', '/api/ranges/stats', payload);
}
