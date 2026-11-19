import Link from "next/link";
import LifecycleDiagram, { NARROW_LAYOUT, WIDE_LAYOUT } from "@/components/LifecycleDiagram";
import StatusBadge from "@/components/StatusBadge";
import {
  CG_STATES,
  CG_TRANSITIONS,
  COMPONENT_STATES,
  LEAVING_STABLE,
  LIFECYCLE_RELATION,
  PLAN_POINTS,
  stateName,
} from "@/lib/aboutDocs";
import { PATH_DOC_HREF } from "@/lib/pathDocs";

const CARD = "bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 space-y-4 scroll-mt-6";
const H2 = "text-2xl font-bold text-cg-blue";
const LINK = "text-cg-lightblue hover:underline";

function PlanLink({ href, text }: { href: string; text: string }) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={LINK}>
        {text}
      </Link>
    );
  }
  return (
    <a href={href} className={LINK} rel="noopener noreferrer">
      {text}
    </a>
  );
}

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-cg-blue">About Common Ground</h2>
        <p className="text-gray-700">
          Common Ground is a Dutch government initiative that promotes modern,
          interoperable, and reusable digital public services. Instead of isolated
          monolithic systems, municipalities are encouraged to use open standards,
          modular components, and well-defined APIs so solutions can be shared and
          improved across organizations.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-cg-blue">Component Checker</h2>
        <p className="text-gray-700">
          The Common Ground Component Checker helps teams quickly assess whether a
          public GitHub repository aligns with key Common Ground practices. It runs
          automated checks (such as open standards, governance files, deployability,
          documentation, and versioning) and produces a transparent score with
          evidence per criterion.
        </p>
        <p className="text-gray-700">
          The goal is to support better decision-making, highlight improvement areas,
          and make reusable public-sector software easier to evaluate over time.
        </p>
      </section>

      <section id="plan" aria-labelledby="plan-heading" className={CARD}>
        <h2 id="plan-heading" className={H2}>
          The plan
        </h2>
        <p className="text-gray-700">
          This is a short overview of the plan behind the checker. Parts marked in review are built but not merged
          yet. Parts marked in development are being built. Parts marked proposed wait for a decision by the
          community.{" "}
          <Link href={PATH_DOC_HREF} className={LINK}>
            The path to Common Ground
          </Link>{" "}
          gives the detail.
        </p>
        {PLAN_POINTS.map((point) => (
          <div key={point.id} id={`plan-${point.id}`} className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">
              {point.title}
              <StatusBadge status={point.status} />
            </h3>
            {point.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-gray-700">
                {paragraph}
              </p>
            ))}
            {point.items && (
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                {point.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            <p className="text-sm">
              <PlanLink {...point.link} />
            </p>
          </div>
        ))}
      </section>

      <section id="common-ground-lifecycle" aria-labelledby="common-ground-lifecycle-heading" className={CARD}>
        <h2 id="common-ground-lifecycle-heading" className={H2}>
          The Common Ground lifecycle
        </h2>
        <p className="text-gray-700">
          A component has its own lifecycle in the Common Ground programme. It is separate from the lifecycle of the
          software. A component can move into the support of the programme and out of it again. A dashed state with
          a label is not shown by the checker yet.
        </p>
        <LifecycleDiagram layout={WIDE_LAYOUT} className="hidden lg:block w-full h-auto" />
        <LifecycleDiagram layout={NARROW_LAYOUT} className="lg:hidden block w-full max-w-sm h-auto mx-auto" />

        <h3 id="common-ground-states-heading" className="text-lg font-semibold text-gray-800">
          The states
        </h3>
        <ol aria-labelledby="common-ground-states-heading" className="list-decimal pl-6 space-y-2 text-gray-700">
          {CG_STATES.map((state) => (
            <li key={state.id}>
              <span className="font-semibold text-gray-800">{state.name}.</span> {state.text}
              <StatusBadge status={state.status} />
            </li>
          ))}
        </ol>

        <h3 id="common-ground-transitions-heading" className="text-lg font-semibold text-gray-800">
          The transitions
        </h3>
        <div className="overflow-x-auto">
          <table aria-labelledby="common-ground-transitions-heading" className="w-full text-sm text-left text-gray-700">
            <thead className="border-b border-gray-200 text-gray-800">
              <tr>
                <th scope="col" className="py-2 pr-3">From</th>
                <th scope="col" className="py-2 pr-3">To</th>
                <th scope="col" className="py-2">When</th>
              </tr>
            </thead>
            <tbody>
              {CG_TRANSITIONS.map((transition) => (
                <tr key={`${transition.from}>${transition.to}`} className="border-b border-gray-100 align-top">
                  <td className="py-2 pr-3">{stateName(transition.from)}</td>
                  <td className="py-2 pr-3">{stateName(transition.to)}</td>
                  <td className="py-2">{transition.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="component-lifecycle" aria-labelledby="component-lifecycle-heading" className={CARD}>
        <h2 id="component-lifecycle-heading" className={H2}>
          The component lifecycle
        </h2>
        <p className="text-gray-700">
          The software itself follows developmentStatus in publiccode.yml. The maintainer sets it. It moves in one
          direction, from concept to obsolete.
        </p>
        <ol
          aria-label="developmentStatus in publiccode.yml, in order"
          className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:items-stretch"
        >
          {COMPONENT_STATES.map((state, index) => (
            <li key={state.id} className="flex flex-col sm:flex-row items-center sm:flex-1">
              {index > 0 && (
                <span aria-hidden="true" className="text-gray-500 px-1">
                  <span className="sm:hidden">↓</span>
                  <span className="hidden sm:inline">→</span>
                </span>
              )}
              <div className="w-full rounded-lg border border-cg-blue bg-white p-2 text-center">
                <span className="block font-mono font-semibold text-gray-900">{state.name}</span>
                <span className="block text-xs text-gray-700">{state.text}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="lifecycles-relation" aria-labelledby="lifecycles-relation-heading" className={CARD}>
        <h2 id="lifecycles-relation-heading" className={H2}>
          How the two relate
        </h2>
        <p className="text-gray-700">
          The two lifecycles are separate. The maintainer decides the developmentStatus. The programme decides the
          status in Common Ground. They meet at one rule: only a stable component can be approved. A stable component
          can still be out of support. An obsolete component leads to retired.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="border-b border-gray-200 text-gray-800">
              <tr>
                <th scope="col" className="py-2 pr-3">developmentStatus</th>
                <th scope="col" className="py-2">In the Common Ground lifecycle</th>
              </tr>
            </thead>
            <tbody>
              {LIFECYCLE_RELATION.map((row) => (
                <tr key={row.statuses.join()} className="border-b border-gray-100 align-top">
                  <td className="py-2 pr-3 font-mono">{row.statuses.join(", ")}</td>
                  <td className="py-2">{row.effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 id="leaving-stable-heading" className="text-lg font-semibold text-gray-800">
          When an approved component leaves stable
        </h3>
        <p className="text-gray-700">
          A component that leaves stable leaves approved. Which state it moves to depends on the new developmentStatus.
        </p>
        <div className="overflow-x-auto">
          <table aria-labelledby="leaving-stable-heading" className="w-full text-sm text-left text-gray-700">
            <thead className="border-b border-gray-200 text-gray-800">
              <tr>
                <th scope="col" className="py-2 pr-3">New developmentStatus</th>
                <th scope="col" className="py-2">New state</th>
              </tr>
            </thead>
            <tbody>
              {LEAVING_STABLE.map((row) => (
                <tr key={row.state} className="border-b border-gray-100 align-top">
                  <td className="py-2 pr-3 font-mono">{row.to.join(", ")}</td>
                  <td className="py-2">{stateName(row.state)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="text-sm text-gray-500 border-t border-gray-200 pt-4 space-y-1">
        <p>© 2026 VNG Realisatie</p>
        <p>Author: Hugo W.L. ter Doest</p>
        <p>
          <a
            href="https://github.com/Hugo-ter-Doest/CommonGroundChecker"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cg-lightblue hover:underline"
          >
            View source on GitHub
          </a>
        </p>
      </section>
    </div>
  );
}
