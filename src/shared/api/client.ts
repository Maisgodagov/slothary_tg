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

export async function apiFetch<TResponse, TBody = unknown>(
  endpoint: string,
  { method = 'GET', body, token, headers = {}, signal }: RequestConfig<TBody> = {},
): Promise<TResponse> {
  const fullUrl = `${API_URL}/${endpoint.replace(/^\//, '')}`;

  const requestHeaders = new Headers({
    'Content-Type': 'application/json',
    ...headers,
  });

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(fullUrl, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
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
