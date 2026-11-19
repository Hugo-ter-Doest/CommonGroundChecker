import { pathStatusLabel } from "@/lib/pathDocs";
import { CG_STATES, CG_TRANSITIONS, stateName, type LifecycleTransition } from "@/lib/aboutDocs";

interface Box {
  x: number;
  y: number;
}

interface Edge {
  /** SVG path data; the arrow head sits on its last point */
  d: string;
  label: { x: number; y: number; anchor: "start" | "middle" | "end"; rotate?: boolean };
}

export interface DiagramLayout {
  id: string;
  width: number;
  height: number;
  boxWidth: number;
  boxes: Record<string, Box>;
  /** Keyed by transitionKey() */
  edges: Record<string, Edge>;
}

const BOX_HEIGHT = 64;
const LINE_HEIGHT = 15;

export function transitionKey(transition: Pick<LifecycleTransition, "from" | "to">): string {
  return `${transition.from}>${transition.to}`;
}

/** Wide screens: the states in a row, out of support and retired below. */
export const WIDE_LAYOUT: DiagramLayout = {
  id: "wide",
  width: 1040,
  height: 372,
  boxWidth: 140,
  boxes: {
    listed: { x: 10, y: 50 },
    measured: { x: 225, y: 50 },
    suitable: { x: 440, y: 50 },
    approved: { x: 655, y: 50 },
    "in-remedy": { x: 870, y: 50 },
    "out-of-support": { x: 760, y: 190 },
    retired: { x: 440, y: 296 },
  },
  edges: {
    "listed>measured": { d: "M150 82 H225", label: { x: 187, y: 40, anchor: "middle" } },
    "measured>suitable": { d: "M365 70 H440", label: { x: 402, y: 40, anchor: "middle" } },
    "suitable>measured": { d: "M440 96 H365", label: { x: 402, y: 132, anchor: "middle" } },
    "suitable>approved": { d: "M580 82 H655", label: { x: 617, y: 40, anchor: "middle" } },
    "approved>in-remedy": { d: "M795 70 H870", label: { x: 832, y: 40, anchor: "middle" } },
    "in-remedy>approved": { d: "M870 96 H795", label: { x: 832, y: 132, anchor: "middle" } },
    "in-remedy>out-of-support": { d: "M960 114 V222 H900", label: { x: 966, y: 165, anchor: "start" } },
    "approved>out-of-support": { d: "M700 114 V222 H760", label: { x: 693, y: 165, anchor: "end" } },
    "out-of-support>approved": { d: "M775 190 V114", label: { x: 782, y: 165, anchor: "start" } },
    "any>retired": { d: "M10 278 H1030 M510 278 V296", label: { x: 510, y: 270, anchor: "middle" } },
  },
};

/** Narrow screens: the states in a column, the long way back along the sides. */
export const NARROW_LAYOUT: DiagramLayout = {
  id: "narrow",
  width: 320,
  height: 710,
  boxWidth: 140,
  boxes: {
    listed: { x: 100, y: 10 },
    measured: { x: 100, y: 110 },
    suitable: { x: 100, y: 210 },
    approved: { x: 100, y: 310 },
    "in-remedy": { x: 100, y: 410 },
    "out-of-support": { x: 100, y: 510 },
    retired: { x: 100, y: 640 },
  },
  edges: {
    "listed>measured": { d: "M170 74 V110", label: { x: 177, y: 96, anchor: "start" } },
    "measured>suitable": { d: "M155 174 V210", label: { x: 148, y: 196, anchor: "end" } },
    "suitable>measured": { d: "M185 210 V174", label: { x: 192, y: 196, anchor: "start" } },
    "suitable>approved": { d: "M170 274 V310", label: { x: 177, y: 296, anchor: "start" } },
    "approved>in-remedy": { d: "M155 374 V410", label: { x: 148, y: 396, anchor: "end" } },
    "in-remedy>approved": { d: "M185 410 V374", label: { x: 192, y: 396, anchor: "start" } },
    "in-remedy>out-of-support": { d: "M170 474 V510", label: { x: 177, y: 496, anchor: "start" } },
    "approved>out-of-support": { d: "M100 342 H40 V542 H100", label: { x: 32, y: 442, anchor: "middle", rotate: true } },
    "out-of-support>approved": { d: "M240 542 H290 V342 H240", label: { x: 306, y: 442, anchor: "middle", rotate: true } },
    "any>retired": { d: "M10 600 H310 M170 600 V640", label: { x: 170, y: 592, anchor: "middle" } },
  },
};

/** Splits a long state name over two lines. */
export function nameLines(name: string): string[] {
  if (name.length <= 16) return [name];
  const words = name.split(" ");
  const half = Math.ceil(words.length / 2);
  return [words.slice(0, half).join(" "), words.slice(half).join(" ")];
}

function edgeLabel(transition: LifecycleTransition): string {
  return transition.from === "any" ? `${stateName("any")}: ${transition.label}` : transition.label;
}

export default function LifecycleDiagram({ layout, className }: { layout: DiagramLayout; className?: string }) {
  const arrowId = `cg-lifecycle-arrow-${layout.id}`;
  const titleId = `cg-lifecycle-title-${layout.id}`;
  const descId = `cg-lifecycle-desc-${layout.id}`;

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      role="img"
      aria-labelledby={`${titleId} ${descId}`}
      className={className}
      data-layout={layout.id}
    >
      <title id={titleId}>The Common Ground lifecycle</title>
      <desc id={descId}>
        Seven states from listed to retired, with the transitions between them. The list and the table below the
        diagram give the same states and transitions as text.
      </desc>
      <defs>
        <marker id={arrowId} viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" className="fill-gray-500" />
        </marker>
      </defs>

      {CG_TRANSITIONS.map((transition) => {
        const key = transitionKey(transition);
        const edge = layout.edges[key];
        const { x, y, anchor, rotate } = edge.label;
        return (
          <g key={key} data-transition={key}>
            <path
              d={edge.d}
              fill="none"
              strokeWidth={1.5}
              strokeDasharray={transition.from === "any" ? "5 4" : undefined}
              markerEnd={`url(#${arrowId})`}
              className="stroke-gray-500"
            />
            <text
              x={x}
              y={y}
              textAnchor={anchor}
              transform={rotate ? `rotate(-90 ${x} ${y})` : undefined}
              fontSize={11}
              className="fill-gray-700"
            >
              {edgeLabel(transition)}
            </text>
          </g>
        );
      })}

      {CG_STATES.map((state) => {
        const box = layout.boxes[state.id];
        const lines = nameLines(state.name);
        const rows = lines.length + (state.status ? 1 : 0);
        const centerX = box.x + layout.boxWidth / 2;
        const firstBaseline = box.y + BOX_HEIGHT / 2 - ((rows - 1) * LINE_HEIGHT) / 2 + 4;
        return (
          <g key={state.id} data-state={state.id}>
            <rect
              x={box.x}
              y={box.y}
              width={layout.boxWidth}
              height={BOX_HEIGHT}
              rx={10}
              strokeWidth={1.5}
              strokeDasharray={state.status ? "5 3" : undefined}
              className={state.status ? "fill-amber-50 stroke-amber-700" : "fill-white stroke-cg-blue"}
            />
            {lines.map((line, index) => (
              <text
                key={line}
                x={centerX}
                y={firstBaseline + index * LINE_HEIGHT}
                textAnchor="middle"
                fontSize={13}
                fontWeight={600}
                className="fill-gray-900"
              >
                {line}
              </text>
            ))}
            {state.status && (
              <text
                x={centerX}
                y={firstBaseline + lines.length * LINE_HEIGHT}
                textAnchor="middle"
                fontSize={11}
                className="fill-amber-800"
              >
                {pathStatusLabel(state.status)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
