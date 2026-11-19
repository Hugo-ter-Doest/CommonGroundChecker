/* @vitest-environment jsdom */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

import AboutPage from "@/app/about/page";
import { NARROW_LAYOUT, WIDE_LAYOUT, nameLines, transitionKey } from "@/components/LifecycleDiagram";
import {
  CG_STATES,
  CG_TRANSITIONS,
  COMPONENT_STATES,
  LIFECYCLE_RELATION,
  PLAN_ISSUE_URL,
  PLAN_POINTS,
  stateName,
} from "@/lib/aboutDocs";
import { PATH_DOC_HREF, PATH_SECTIONS } from "@/lib/pathDocs";

function allText(): string[] {
  return [
    ...PLAN_POINTS.flatMap((point) => [point.title, ...point.paragraphs, ...(point.items ?? []), point.link.text]),
    ...CG_STATES.flatMap((state) => [state.name, state.text]),
    ...CG_TRANSITIONS.flatMap((transition) => [transition.label, transition.text]),
    ...COMPONENT_STATES.flatMap((state) => [state.name, state.text]),
    ...LIFECYCLE_RELATION.map((row) => row.effect),
  ];
}

describe("about docs data", () => {
  it("names the seven Common Ground states in order", () => {
    expect(CG_STATES.map((state) => state.name)).toEqual([
      "Listed",
      "Measured",
      "Suitable for Common Ground",
      "Approved",
      "In remedy",
      "Out of support",
      "Retired",
    ]);
  });

  it("has exactly the transitions of the plan", () => {
    expect(CG_TRANSITIONS.map(transitionKey)).toEqual([
      "listed>measured",
      "measured>suitable",
      "suitable>measured",
      "suitable>approved",
      "approved>in-remedy",
      "in-remedy>approved",
      "in-remedy>out-of-support",
      "approved>out-of-support",
      "out-of-support>approved",
      "any>retired",
    ]);
    const ids = new Set(CG_STATES.map((state) => state.id));
    for (const transition of CG_TRANSITIONS) {
      expect(transition.from === "any" || ids.has(transition.from), transition.from).toBe(true);
      expect(ids.has(transition.to), transition.to).toBe(true);
    }
  });

  it("marks the states the checker does not show yet", () => {
    const status = Object.fromEntries(CG_STATES.map((state) => [state.id, state.status]));
    expect(status.listed).toBeUndefined();
    expect(status.measured).toBeUndefined();
    expect(status.suitable).toEqual(PATH_SECTIONS.find((section) => section.id === "verdict")!.status);
    expect(status.approved).toEqual({ kind: "in-development" });
    expect(status["in-remedy"]).toEqual({ kind: "in-development" });
    expect(status["out-of-support"]).toEqual({ kind: "proposed" });
    expect(status.retired).toEqual({ kind: "proposed" });
  });

  it("states the suitable verdict and the approval conditions", () => {
    const text = (id: string) => CG_STATES.find((state) => state.id === id)!.text;
    expect(text("suitable")).toMatch(/no mandatory criterion fails.*at least 2\.5.*valid maintenance contract.*at least 4 stars/);
    expect(text("approved")).toMatch(/at least two confirmed users, and an SLA from VNG/);
    expect(text("in-remedy")).toMatch(/stays approved during the term/);
    expect(text("out-of-support")).toMatch(/can come back/);
    expect(text("retired")).toMatch(/history stays visible/);
  });

  it("lists developmentStatus from concept to obsolete and covers each in the relation", () => {
    const names = COMPONENT_STATES.map((state) => state.name);
    expect(names).toEqual(["concept", "development", "beta", "stable", "obsolete"]);
    expect(LIFECYCLE_RELATION.flatMap((row) => row.statuses)).toEqual(names);
  });

  it("names each state, and any state", () => {
    expect(stateName("any")).toBe("Any state");
    expect(stateName("in-remedy")).toBe("In remedy");
    expect(() => stateName("nope")).toThrow();
  });

  it("links the plan points to the path page sections that exist", () => {
    const sectionIds = new Set(PATH_SECTIONS.map((section) => section.id));
    for (const point of PLAN_POINTS) {
      if (!point.link.href.startsWith(PATH_DOC_HREF)) continue;
      expect(sectionIds.has(point.link.href.split("#")[1]), point.link.href).toBe(true);
    }
  });

  it("uses no em or en dashes", () => {
    for (const text of allText()) expect(text, text).not.toMatch(/[–—]/);
  });
});

describe("LifecycleDiagram layouts", () => {
  for (const layout of [WIDE_LAYOUT, NARROW_LAYOUT]) {
    it(`places every state and transition in the ${layout.id} layout`, () => {
      expect(Object.keys(layout.boxes).sort()).toEqual(CG_STATES.map((state) => state.id).sort());
      expect(Object.keys(layout.edges).sort()).toEqual(CG_TRANSITIONS.map(transitionKey).sort());
      for (const box of Object.values(layout.boxes)) {
        expect(box.x + layout.boxWidth).toBeLessThanOrEqual(layout.width);
        expect(box.y + 64).toBeLessThanOrEqual(layout.height);
      }
    });
  }

  it("splits only long names over two lines", () => {
    expect(nameLines("Out of support")).toEqual(["Out of support"]);
    expect(nameLines("Suitable for Common Ground")).toEqual(["Suitable for", "Common Ground"]);
  });
});

describe("AboutPage", () => {
  afterEach(() => cleanup());

  it("keeps the existing content and adds the plan and the lifecycles", () => {
    const { container } = render(<AboutPage />);

    expect(screen.getByRole("heading", { level: 2, name: "About Common Ground" })).toBeTruthy();
    expect(screen.getByText("Author: Hugo W.L. ter Doest")).toBeTruthy();
    expect(screen.getByRole("link", { name: "View source on GitHub" })).toBeTruthy();
    expect(Array.from(container.querySelectorAll("section[id]"), (section) => section.id)).toEqual([
      "plan",
      "common-ground-lifecycle",
      "component-lifecycle",
      "lifecycles-relation",
    ]);
  });

  it("gives a short overview of the plan and links the path page", () => {
    render(<AboutPage />);

    const plan = document.getElementById("plan")!;
    for (const point of PLAN_POINTS) {
      expect(within(plan).getByRole("heading", { level: 3, name: new RegExp(`^${point.title}`) })).toBeTruthy();
    }
    expect(within(plan).getByRole("link", { name: "The path to Common Ground" }).getAttribute("href")).toBe(PATH_DOC_HREF);
    expect(within(plan).getAllByRole("link", { name: "The plan behind the checker (issue #54)" })[0].getAttribute("href")).toBe(
      PLAN_ISSUE_URL,
    );
    expect(within(plan).getByRole("link", { name: "More on the path page: the checklist as a standard" }).getAttribute("href")).toBe(
      `${PATH_DOC_HREF}#checklist`,
    );
    expect(within(plan).getByRole("link", { name: "code.overheid.nl" }).getAttribute("href")).toBe("https://code.overheid.nl");
    expect(within(plan).getByRole("heading", { level: 3, name: "A home at code.overheid.nl Proposed" })).toBeTruthy();
  });

  it("draws the Common Ground lifecycle as two labelled images, wide and narrow", () => {
    render(<AboutPage />);

    const section = document.getElementById("common-ground-lifecycle")!;
    const images = within(section).getAllByRole("img", { name: /The Common Ground lifecycle/ });
    expect(images.map((image) => image.getAttribute("data-layout"))).toEqual(["wide", "narrow"]);
    for (const image of images) {
      expect(image.querySelectorAll("[data-state]")).toHaveLength(CG_STATES.length);
      expect(image.querySelectorAll("[data-transition]")).toHaveLength(CG_TRANSITIONS.length);
      expect(image.querySelector('[data-state="approved"]')!.textContent).toBe("ApprovedIn development");
    }
  });

  it("gives the states and transitions as text", () => {
    render(<AboutPage />);

    const section = document.getElementById("common-ground-lifecycle")!;
    const states = within(section).getByRole("list", { name: "The states" });
    expect(within(states).getAllByRole("listitem")).toHaveLength(CG_STATES.length);
    expect(within(states).getByText("Proposed", { selector: "li:last-child span" })).toBeTruthy();

    const table = within(section).getByRole("table", { name: "The transitions" });
    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(CG_TRANSITIONS.length);
    expect(rows[rows.length - 1].textContent).toBe("Any stateRetiredThe component is obsolete, or the programme retires it.");
  });

  it("shows the component lifecycle and how the two relate, leaving the stable question open", () => {
    render(<AboutPage />);

    const flow = screen.getByRole("list", { name: "developmentStatus in publiccode.yml, in order" });
    expect(within(flow).getAllByRole("listitem")).toHaveLength(COMPONENT_STATES.length);

    const relation = document.getElementById("lifecycles-relation")!;
    expect(within(relation).getByText(/A stable component can be out of support\. An obsolete component leads to retired\./)).toBeTruthy();
    expect(within(relation).getByText(/Whether only stable components can be approved is an open question for the community/)).toBeTruthy();
    expect(within(relation).getAllByRole("row")).toHaveLength(LIFECYCLE_RELATION.length + 1);
  });
});
