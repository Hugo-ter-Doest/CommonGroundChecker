"use client";

import { Search } from "lucide-react";
import { useState } from "react";

interface CheckerFormProps {
  onSubmit: (
    url: string,
    helmChartLocations: string[],
    documentationLocations: string[],
    dockerLocations: string[],
    isRegister: boolean
  ) => void;
  loading: boolean;
}

const EXAMPLE_REPOS = [
  "https://github.com/open-zaak/open-zaak",
  "https://github.com/maykinmedia/objects-api",
  "https://github.com/open-formulieren/open-forms",
];

export default function CheckerForm({ onSubmit, loading }: CheckerFormProps) {
  const [value, setValue] = useState("");
  const [helmSomewhereElse, setHelmSomewhereElse] = useState(false);
  const [helmChartUrl, setHelmChartUrl] = useState("");
  const [documentationSomewhereElse, setDocumentationSomewhereElse] =
    useState(false);
  const [documentationUrl, setDocumentationUrl] = useState("");
  const [dockerSomewhereElse, setDockerSomewhereElse] = useState(false);
  const [dockerUrl, setDockerUrl] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    if (helmSomewhereElse && !helmChartUrl.trim()) return;
    if (documentationSomewhereElse && !documentationUrl.trim()) return;
    if (dockerSomewhereElse && !dockerUrl.trim()) return;

    const parsedHelmLocations = helmSomewhereElse && helmChartUrl.trim()
      ? [helmChartUrl.trim()]
      : [];
    const parsedDocumentationLocations =
      documentationSomewhereElse && documentationUrl.trim()
        ? [documentationUrl.trim()]
        : [];
    const parsedDockerLocations = dockerSomewhereElse && dockerUrl.trim()
      ? [dockerUrl.trim()]
      : [];

    onSubmit(
      value.trim(),
      parsedHelmLocations,
      parsedDocumentationLocations,
      parsedDockerLocations,
      isRegister
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="url"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="https://github.com/organisation/repository"
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-cg-lightblue focus:border-transparent disabled:opacity-60"
            disabled={loading}
            required
          />
        </div>
        <button
          type="submit"
          disabled={
            loading ||
            !value.trim() ||
            (helmSomewhereElse && !helmChartUrl.trim()) ||
            (documentationSomewhereElse && !documentationUrl.trim()) ||
            (dockerSomewhereElse && !dockerUrl.trim())
          }
          className="px-6 py-3 bg-cg-blue text-white font-semibold rounded-lg hover:bg-cg-lightblue transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
        >
          {loading ? (
            <>
              <span className="spinner" />
              Checking…
            </>
          ) : (
            "Check compliance"
          )}
        </button>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={isRegister}
            onChange={(e) => setIsRegister(e.target.checked)}
            disabled={loading}
            className="h-4 w-4 rounded border-gray-300 text-cg-lightblue focus:ring-cg-lightblue"
          />
          Component is a register
        </label>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={helmSomewhereElse}
            onChange={(e) => {
              const checked = e.target.checked;
              setHelmSomewhereElse(checked);
              if (!checked) setHelmChartUrl("");
            }}
            disabled={loading}
            className="h-4 w-4 rounded border-gray-300 text-cg-lightblue focus:ring-cg-lightblue"
          />
          Helm chart is somewhere else
        </label>

        {helmSomewhereElse && (
          <div>
            <label htmlFor="helm-chart-url" className="block text-xs text-gray-500 mb-1">
              URL to the Helm chart
            </label>
            <input
              id="helm-chart-url"
              type="url"
              value={helmChartUrl}
              onChange={(e) => setHelmChartUrl(e.target.value)}
              placeholder="https://github.com/org/charts/tree/main/charts/mychart"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-cg-lightblue focus:border-transparent disabled:opacity-60"
              disabled={loading}
              required={helmSomewhereElse}
            />
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={documentationSomewhereElse}
            onChange={(e) => {
              const checked = e.target.checked;
              setDocumentationSomewhereElse(checked);
              if (!checked) setDocumentationUrl("");
            }}
            disabled={loading}
            className="h-4 w-4 rounded border-gray-300 text-cg-lightblue focus:ring-cg-lightblue"
          />
          Documentation is on a separate site
        </label>

        {documentationSomewhereElse && (
          <div>
            <label
              htmlFor="documentation-url"
              className="block text-xs text-gray-500 mb-1"
            >
              URL to documentation site
            </label>
            <input
              id="documentation-url"
              type="url"
              value={documentationUrl}
              onChange={(e) => setDocumentationUrl(e.target.value)}
              placeholder="https://docs.example.com"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-cg-lightblue focus:border-transparent disabled:opacity-60"
              disabled={loading}
              required={documentationSomewhereElse}
            />
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={dockerSomewhereElse}
            onChange={(e) => {
              const checked = e.target.checked;
              setDockerSomewhereElse(checked);
              if (!checked) setDockerUrl("");
            }}
            disabled={loading}
            className="h-4 w-4 rounded border-gray-300 text-cg-lightblue focus:ring-cg-lightblue"
          />
          Docker image available
        </label>

        {dockerSomewhereElse && (
          <div>
            <label htmlFor="docker-url" className="block text-xs text-gray-500 mb-1">
              URL to Docker image
            </label>
            <input
              id="docker-url"
              type="url"
              value={dockerUrl}
              onChange={(e) => setDockerUrl(e.target.value)}
              placeholder="https://ghcr.io/your-org/your-image"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-cg-lightblue focus:border-transparent disabled:opacity-60"
              disabled={loading}
              required={dockerSomewhereElse}
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-gray-400">Try an example:</span>
        {EXAMPLE_REPOS.map((url) => {
          const name = url.replace("https://github.com/", "");
          return (
            <button
              key={url}
              type="button"
              onClick={() => setValue(url)}
              disabled={loading}
              className="text-xs text-cg-lightblue hover:underline disabled:opacity-50"
            >
              {name}
            </button>
          );
        })}
      </div>
    </form>
  );
}
