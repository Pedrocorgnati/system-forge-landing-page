const DEFAULT_CENTRAL_BACKEND_URL = "https://www.corgnati.com";

export type CentralIntegrationContext = {
  tenant: {
    origin: string;
    label: string;
    locale: string;
    currency: string;
    theme: string;
    host: string;
    baseUrl: string;
  };
  backend?: {
    baseUrl: string;
    apiBasePath: string;
    authBasePath: string;
    contractVersion: string;
  };
};

export function centralBackendUrl(path: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_CENTRAL_BACKEND_URL ?? DEFAULT_CENTRAL_BACKEND_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(`/api${normalizedPath}`, baseUrl).toString();
}

export async function fetchCentralBackend<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(centralBackendUrl(path), {
    ...init,
    credentials: init?.credentials ?? "include",
  });

  if (!response.ok) {
    throw new Error(`Central backend request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function fetchCentralIntegrationContext(): Promise<CentralIntegrationContext> {
  return fetchCentralBackend<CentralIntegrationContext>("/integration/context");
}
