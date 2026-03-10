let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function loginWithEmailPassword(): Promise<string> {
  const baseUrl = process.env.PIX3LBOARD_URL;
  if (!baseUrl) throw new Error('PIX3LBOARD_URL is not set');

  const email = process.env.PIX3LBOARD_EMAIL;
  const password = process.env.PIX3LBOARD_PASSWORD;
  if (!email || !password) throw new Error('PIX3LBOARD_EMAIL and PIX3LBOARD_PASSWORD are not set');

  const response = await fetch(`${baseUrl}/api/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { token: string; expires_in: string };
  cachedToken = data.token;
  // 2h in ms minus 10min buffer
  tokenExpiresAt = Date.now() + 2 * 60 * 60 * 1000 - 10 * 60 * 1000;

  return cachedToken;
}

export async function getAuthHeader(): Promise<string> {
  const apiKey = process.env.PIX3LBOARD_API_KEY;

  if (apiKey) {
    return `Bearer ${apiKey}`;
  }

  const email = process.env.PIX3LBOARD_EMAIL;
  const password = process.env.PIX3LBOARD_PASSWORD;

  if (email && password) {
    // Refresh token if expired or not yet obtained
    if (!cachedToken || Date.now() >= tokenExpiresAt) {
      await loginWithEmailPassword();
    }
    return `Bearer ${cachedToken}`;
  }

  throw new Error(
    'No authentication configured. Set PIX3LBOARD_API_KEY or PIX3LBOARD_EMAIL + PIX3LBOARD_PASSWORD.'
  );
}
