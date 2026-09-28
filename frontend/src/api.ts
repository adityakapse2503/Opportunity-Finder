const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_URL = configuredApiUrl
  ? configuredApiUrl.replace(/\/+$/, "")
  : import.meta.env.DEV
    ? "http://localhost:8000"
    : "";

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  if (!API_URL) {
    throw new Error(
      "The backend API URL is not configured. Set VITE_API_URL to your public backend URL in the Vercel project settings, then redeploy."
    );
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
      ...options,
    });
  } catch {
    throw new Error(
      `Could not reach the backend at ${API_URL}. Check that it is publicly available and allows this site's origin in CORS.`
    );
  }

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `API ${response.status}: ${
        errorText || response.statusText
      }`
    );
  }

  return response.json();
}

export const api = {
  /**
   * Get all available source connectors.
   */
  sources() {
    return request<any[]>("/api/sources");
  },

  /**
   * Create a new research project.
   */
  createProject(data: {
    name: string;
    business_type: string;
    target_customer: string;
    location: string;
  }) {
    return request<any>("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Get existing projects.
   */
  projects() {
    return request<any[]>("/api/projects");
  },

  /**
   * Start a research search for a project.
   */
  search(
    projectId: string,
    data: {
      query: string;
      depth: "quick" | "standard" | "deep";
    }
  ) {
    return request<any>(
      `/api/projects/${projectId}/search`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );
  },

  /**
   * Get project metrics.
   */
  metrics(projectId: string) {
    return request<any>(
      `/api/projects/${projectId}/metrics`
    );
  },

  /**
   * Get normalized research results.
   */
  results(projectId: string) {
    return request<any[]>(
      `/api/projects/${projectId}/results`
    );
  },
};