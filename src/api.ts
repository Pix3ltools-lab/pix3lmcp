import { getAuthHeader } from './auth';

export async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const baseUrl = process.env.PIX3LBOARD_URL;
  if (!baseUrl) throw new Error('PIX3LBOARD_URL is not set');

  const authHeader = await getAuthHeader();

  const headers: Record<string, string> = {
    Authorization: authHeader,
    'Content-Type': 'application/json',
  };

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorMessage: string;
    let errorBody: { error?: string } | null = null;

    try {
      errorBody = (await response.json()) as { error?: string };
    } catch {
      // ignore parse error
    }

    const detail = errorBody?.error ? `: ${errorBody.error}` : '';

    switch (response.status) {
      case 401:
        errorMessage = `Unauthorized: check your API key or credentials${detail}`;
        break;
      case 403:
        errorMessage = `Access denied: you don't have permission to perform this action${detail}`;
        break;
      case 404:
        errorMessage = `Not found: the requested resource does not exist${detail}`;
        break;
      case 429:
        errorMessage = `Too many requests: rate limit exceeded${detail}`;
        break;
      default:
        if (response.status >= 500) {
          errorMessage = `Server error: pix3lboard returned an error${detail}`;
        } else {
          errorMessage = `Request failed with status ${response.status}${detail}`;
        }
    }

    throw new Error(errorMessage);
  }

  const json = (await response.json()) as { data?: T };
  return (json.data !== undefined ? json.data : json) as T;
}
