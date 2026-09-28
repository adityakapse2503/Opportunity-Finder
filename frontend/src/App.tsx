import { useEffect, useState } from "react";
import {
  Search,
  Database,
  Users,
  TrendingUp,
  Radar,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { api } from "./api";

const cards = [
  {
    key: "relevant_results",
    label: "Relevant results",
    icon: Database,
  },
  {
    key: "high_intent_signals",
    label: "High-intent signals",
    icon: Radar,
  },
  {
    key: "potential_leads",
    label: "Potential leads",
    icon: Users,
  },
  {
    key: "emerging_topics",
    label: "Emerging topics",
    icon: TrendingUp,
  },
];

type Project = {
  id: string;
  name: string;
  business_type: string;
  target_customer: string;
  location: string;
  created_at?: string;
};

type Metrics = {
  sources_scanned: number;
  relevant_results: number;
  high_intent_signals: number;
  potential_leads: number;
  emerging_topics: number;
  communities: number;
};

type Result = {
  id: string;
  source: string;
  title: string;
  excerpt: string;
  source_url: string;
  published_at?: string | null;
  author?: string;
  intent_type: string;
  intent_score: number;
  relevance_score: number;
  engagement?: Record<string, unknown>;
};

type Source = {
  name: string;
  signal_type: string;
  status: string;
};

export default function App() {
  const [project, setProject] = useState<Project | null>(null);

  const [metrics, setMetrics] = useState<Metrics>({
    sources_scanned: 0,
    relevant_results: 0,
    high_intent_signals: 0,
    potential_leads: 0,
    emerging_topics: 0,
    communities: 0,
  });

  const [results, setResults] = useState<Result[]>([]);
  const [sources, setSources] = useState<Source[]>([]);

  const [form, setForm] = useState({
    name: "My Opportunity Research",
    business_type: "Shopify agency",
    target_customer:
      "Ecommerce businesses needing Shopify development",
    location: "India",
  });

  const [query, setQuery] = useState(
    "Shopify development"
  );

  const [loading, setLoading] = useState(false);
  const [loadingSources, setLoadingSources] = useState(true);
  const [error, setError] = useState("");
  const [lastSearchStatus, setLastSearchStatus] =
    useState("");

  /*
   * Load available source connectors when the page opens.
   */
  useEffect(() => {
    loadSources();
  }, []);

  async function loadSources() {
    try {
      setLoadingSources(true);
      setError("");

      const data = await api.sources();

      setSources(data);
    } catch (error) {
      console.error("Failed to load sources:", error);

      setError(
        "Could not load source connectors. Make sure the backend is running on port 8000."
      );
    } finally {
      setLoadingSources(false);
    }
  }

  /*
   * Load metrics and results for a project.
   */
  async function loadProjectData(projectId: string) {
    try {
      const [metricsData, resultsData] =
        await Promise.all([
          api.metrics(projectId),
          api.results(projectId),
        ]);

      console.log("Metrics:", metricsData);
      console.log("Results:", resultsData);

      setMetrics(metricsData);
      setResults(resultsData);

      return {
        metrics: metricsData,
        results: resultsData,
      };
    } catch (error) {
      console.error(
        "Failed to load project data:",
        error
      );

      throw error;
    }
  }

  /*
   * Create project and start research.
   */
  async function createAndSearch() {
    if (!query.trim()) {
      setError("Please enter a research query.");
      return;
    }

    setLoading(true);
    setError("");
    setLastSearchStatus("");

    try {
      /*
       * Reuse the current project if one already exists.
       * Otherwise create a new project.
       */
      const p =
        project ||
        (await api.createProject({
          ...form,
          name:
            form.name.trim() ||
            "My Opportunity Research",
        }));

      setProject(p);

      /*
       * Start the Celery research task.
       */
      const search = await api.search(p.id, {
        query: query.trim(),
        depth: "standard",
      });

      console.log("Search created:", search);

      setLastSearchStatus(
        "Research started. Waiting for results..."
      );

      /*
       * Give Celery a moment to process the job.
       */
      await new Promise((resolve) =>
        setTimeout(resolve, 1000)
      );

      /*
       * Poll the backend instead of waiting for a fixed
       * amount of time.
       */
      for (let attempt = 0; attempt < 10; attempt++) {
        const data = await loadProjectData(p.id);

        if (data.results.length > 0) {
          setLastSearchStatus(
            `Research completed. Found ${data.results.length} result${
              data.results.length === 1 ? "" : "s"
            }.`
          );

          break;
        }

        setLastSearchStatus(
          `Researching... attempt ${attempt + 1}/10`
        );

        await new Promise((resolve) =>
          setTimeout(resolve, 1500)
        );
      }

      /*
       * One final refresh after polling.
       */
      await loadProjectData(p.id);

      setLastSearchStatus(
        "Research finished."
      );
    } catch (error) {
      console.error(
        "Could not start research:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Could not start research. Check the API and worker."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * Allow the user to manually refresh the dashboard.
   */
  async function refreshDashboard() {
    if (!project) {
      await loadSources();
      return;
    }

    try {
      setError("");

      await Promise.all([
        loadSources(),
        loadProjectData(project.id),
      ]);
    } catch (error) {
      console.error(
        "Refresh failed:",
        error
      );

      setError(
        "Could not refresh the dashboard."
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-xl font-bold">
              Opportunity Finder
            </div>

            <div className="text-xs text-slate-400">
              Internet Opportunity Intelligence
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-xs text-slate-400 sm:block">
              Evidence-first research
            </div>

            <button
              onClick={refreshDashboard}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-slate-600 hover:bg-slate-900"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {/* ERROR */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div>
              <div className="font-medium">
                Something went wrong
              </div>

              <div className="mt-1 text-red-400">
                {error}
              </div>
            </div>
          </div>
        )}

        {/* SEARCH FORM */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <div>
            <h1 className="text-2xl font-semibold">
              What are you trying to discover?
            </h1>

            <p className="mt-1 text-slate-400">
              Search public signals across independent
              sources.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {/* BUSINESS TYPE */}
            <label className="space-y-2">
              <span className="text-sm text-slate-300">
                Business
              </span>

              <input
                value={form.business_type}
                placeholder="e.g. Shopify agency"
                onChange={(e) =>
                  setForm({
                    ...form,
                    business_type:
                      e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-indigo-500"
              />
            </label>

            {/* TARGET CUSTOMER */}
            <label className="space-y-2">
              <span className="text-sm text-slate-300">
                Target customer
              </span>

              <input
                value={form.target_customer}
                placeholder="e.g. DTC brands"
                onChange={(e) =>
                  setForm({
                    ...form,
                    target_customer:
                      e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-indigo-500"
              />
            </label>

            {/* LOCATION */}
            <label className="space-y-2">
              <span className="text-sm text-slate-300">
                Location
              </span>

              <input
                value={form.location}
                placeholder="e.g. India"
                onChange={(e) =>
                  setForm({
                    ...form,
                    location: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-indigo-500"
              />
            </label>

            {/* QUERY */}
            <label className="space-y-2">
              <span className="text-sm text-slate-300">
                Research query
              </span>

              <input
                value={query}
                placeholder="e.g. Shopify development"
                onChange={(e) =>
                  setQuery(e.target.value)
                }
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !loading
                  ) {
                    createAndSearch();
                  }
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-indigo-500"
              />
            </label>
          </div>

          {/* PROJECT NAME */}
          <label className="mt-4 block space-y-2">
            <span className="text-sm text-slate-300">
              Research project name
            </span>

            <input
              value={form.name}
              placeholder="My Opportunity Research"
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-indigo-500"
            />
          </label>

          {/* BUTTON */}
          <button
            onClick={createAndSearch}
            disabled={loading}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 font-medium transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw
                  size={18}
                  className="animate-spin"
                />

                Researching...
              </>
            ) : (
              <>
                <Search size={18} />

                Run Research
              </>
            )}
          </button>

          {/* STATUS */}
          {lastSearchStatus && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
              <CheckCircle2
                size={16}
                className="text-emerald-400"
              />

              {lastSearchStatus}
            </div>
          )}
        </section>

        {/* METRICS */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {cards.map(
            ({
              key,
              label,
              icon: Icon,
            }) => (
              <div
                key={key}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg"
              >
                <Icon
                  size={18}
                  className="text-indigo-400"
                />

                <div className="mt-4 text-2xl font-bold">
                  {metrics[key as keyof Metrics] ??
                    0}
                </div>

                <div className="text-sm text-slate-400">
                  {label}
                </div>
              </div>
            )
          )}
        </section>

        {/* CURRENT PROJECT */}
        {project && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Current project
            </div>

            <div className="mt-2 text-lg font-semibold">
              {project.name}
            </div>

            <div className="mt-2 grid gap-2 text-sm text-slate-400 md:grid-cols-3">
              <div>
                <span className="text-slate-500">
                  Business:
                </span>{" "}
                {project.business_type}
              </div>

              <div>
                <span className="text-slate-500">
                  Customer:
                </span>{" "}
                {project.target_customer}
              </div>

              <div>
                <span className="text-slate-500">
                  Location:
                </span>{" "}
                {project.location}
              </div>
            </div>
          </section>
        )}

        {/* SOURCES */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Source connectors
              </h2>

              <p className="text-sm text-slate-400">
                Unavailable sources are never silently
                replaced.
              </p>
            </div>

            <div className="text-xs text-slate-500">
              {sources.length} source
              {sources.length === 1 ? "" : "s"}
            </div>
          </div>

          {loadingSources ? (
            <div className="mt-5 text-sm text-slate-500">
              Loading source connectors...
            </div>
          ) : sources.length === 0 ? (
            <div className="mt-5 text-sm text-slate-500">
              No source connectors available.
            </div>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {sources.map((source) => (
                <div
                  key={source.name}
                  className="rounded-xl border border-slate-800 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">
                      {source.name}
                    </div>

                    <span className="rounded-full bg-slate-800 px-2 py-1 text-xs">
                      {source.status}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-slate-400">
                    {source.signal_type}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* EVIDENCE */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
          <div>
            <h2 className="text-lg font-semibold">
              Evidence
            </h2>

            <p className="mb-4 text-sm text-slate-400">
              Every result keeps its source URL and
              classification.
            </p>
          </div>

          <div className="space-y-3">
            {results.map((result) => (
              <article
                key={result.id}
                className="rounded-xl border border-slate-800 p-4 transition hover:border-slate-700"
              >
                <div className="flex justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs text-indigo-400">
                      {result.source} ·{" "}
                      {result.intent_type}
                    </div>

                    <h3 className="mt-1 font-medium">
                      {result.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {result.excerpt}
                    </p>
                  </div>

                  {result.source_url && (
                    <a
                      href={result.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-slate-400 transition hover:text-white"
                      title="Open source"
                    >
                      <ExternalLink size={18} />
                    </a>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                  <span>
                    Relevance{" "}
                    <strong className="text-slate-300">
                      {result.relevance_score}
                    </strong>
                    /100
                  </span>

                  <span>
                    Intent{" "}
                    <strong className="text-slate-300">
                      {result.intent_score}
                    </strong>
                    /100
                  </span>

                  {result.author && (
                    <span>
                      Author: {result.author}
                    </span>
                  )}
                </div>
              </article>
            ))}

            {!results.length && (
              <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
                <Database
                  size={24}
                  className="mx-auto text-slate-600"
                />

                <div className="mt-3 text-sm text-slate-500">
                  Run research to populate evidence.
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}