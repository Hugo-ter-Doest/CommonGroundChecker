import type { InformativeMetric } from "@/lib/types";

const LINK_CLASS =
  "text-cg-lightblue underline hover:text-cg-blue rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cg-blue";

interface MetricTableProps {
  caption: string;
  metrics: InformativeMetric[];
}

/** Informative metrics with their value and explanation, without stars. */
export default function MetricTable({ caption, metrics }: MetricTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs text-left border border-gray-200">
        <caption className="text-left text-gray-600 pb-1">{caption}</caption>
        <thead className="bg-cg-gray">
          <tr>
            <th scope="col" className="px-2 py-1">Metric</th>
            <th scope="col" className="px-2 py-1">Value</th>
            <th scope="col" className="px-2 py-1">What it means</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric) => (
            <tr key={metric.id} className="border-t border-gray-100 align-top">
              <th scope="row" className="px-2 py-1 font-normal text-gray-800">
                <a href={metric.referenceUrl} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
                  {metric.name}
                  <span className="sr-only">: definition, opens in a new tab</span>
                </a>
              </th>
              <td className="px-2 py-1 font-semibold text-gray-900 whitespace-nowrap">
                {metric.value ?? <span className="font-normal text-gray-600">not measured</span>}
              </td>
              <td className="px-2 py-1 text-gray-700">{metric.explanation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
