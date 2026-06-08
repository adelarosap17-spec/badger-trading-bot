const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export async function apiGet<TResponse>(path: string): Promise<TResponse> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}
