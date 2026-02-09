const API_BASE = '';

async function http(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
      if (j?.details) msg += `\n${j.details.join('\n')}`;
    } catch {
      // ignore
    }
    throw new Error(msg);
  }

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
