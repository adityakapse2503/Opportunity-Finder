const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

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