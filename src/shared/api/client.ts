import { env } from '../config/env';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestConfig<TBody = unknown> {
  method?: HttpMethod;
  body?: TBody;
  token?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

const API_URL = env.apiUrl.replace(/\/$/, '');

const getStoredAccessToken = () => {
  try {
    const raw = localStorage.getItem('persist:root');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, string>;
    const authRaw = parsed?.auth;
    if (!authRaw) return null;
    const auth = JSON.parse(authRaw) as { tokens?: { accessToken?: string } };
    return auth?.tokens?.accessToken ?? null;
  } catch {
    return null;
  }
};

export async function apiFetch<TResponse, TBody = unknown>(
  endpoint: string,
  { method = 'GET', body, token, headers = {}, signal }: RequestConfig<TBody> = {},
): Promise<TResponse> {
  const fullUrl = `${API_URL}/${endpoint.replace(/^\//, '')}`;

  const requestHeaders = new Headers({
    ...headers,
  });
  const isFormData =
    typeof FormData !== 'undefined' && body instanceof FormData;
  if (!isFormData) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const accessToken = token ?? getStoredAccessToken();
  if (accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(fullUrl, {
    method,
    headers: requestHeaders,
    body: body
      ? isFormData
        ? (body as any)
        : JSON.stringify(body)
      : undefined,
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let message = errorText || `Request failed with status ${response.status}`;
    try {
      const parsed = JSON.parse(errorText);
      if (typeof parsed === 'object' && parsed && 'message' in parsed) {
        message = String(parsed.message);
      }
    } catch {
      // ignore JSON parse errors
    }
    console.error('[apiFetch] request failed', { endpoint, status: response.status, message });
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return response.json() as Promise<TResponse>;
}
