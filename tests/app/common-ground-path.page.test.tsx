/* @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({ notFound: vi.fn() }));

import CommonGroundPathPage from "@/app/docs/common-ground-path/page";
import RatingGuidePage from "@/app/docs/page";
import ToolsAndModelsPage from "@/app/docs/tools-and-models/page";
import {
  AUDIENCES,
  PATH_DOC_HREF,
  PATH_DOC_SOURCES,
  PATH_SECTIONS,
  PATH_STEPS,
  THREE_SYSTEMS_HREF,
  pathStatusLabel,
  type PathStatus,
} from "@/lib/pathDocs";

function allText(): string[] {
  return [
    ...AUDIENCES.flatMap((audience) => [audience.title, audience.text]),
    ...PATH_STEPS,
    ...PATH_SECTIONS.flatMap((section) => [
      section.title,
      ...section.paragraphs,
      ...(section.items ?? []),
      ...(section.parts ?? []).flatMap((part) => [part.title, ...part.paragraphs]),
    ]),
  ];
}

function statusOf(title: string): PathStatus | undefined {
  for (const section of PATH_SECTIONS) {
    if (section.title === title) return section.status;
    const part = section.parts?.find((candidate) => candidate.title === title);
    if (part) return part.status;
  }
  throw new Error(`no section or part named ${title}`);
}

describe("path docs data", () => {
  it("labels each status", () => {
    expect(pathStatusLabel({ kind: "in-review", pr: 68 })).toBe("In review (#68)");
    expect(pathStatusLabel({ kind: "in-development" })).toBe("In development");
    expect(pathStatusLabel({ kind: "proposed" })).toBe("Proposed");
  });

  it("marks the parts other lanes are building as in development", () => {
    for (const title of ["Approved", "Nightly measurement and fix terms", "Versions and a transition period", "Counting usage"]) {
      expect(statusOf(title), title).toEqual({ kind: "in-development" });
    }
  });

  it("gives the version choice and the verdict their pull requests", () => {
    expect(statusOf("Which version is measured")).toEqual({ kind: "in-review", pr: 68 });
    expect(statusOf("When a component is suitable")).toEqual({ kind: "in-review", pr: 56 });
    expect(statusOf("A valid maintenance contract")).toEqual({ kind: "in-review", pr: 55 });
  });

  it("measures the declared version first and falls back to the default branch with a warning", () => {
    const version = PATH_SECTIONS.find((section) => section.id === "version")!;
    expect(version.items).toEqual([
      "the tag that matches softwareVersion in publiccode.yml;",
      "the newest stable release;",
      "the newest stable semver tag, such as 1.4.2 or v1.4.2;",
      "the default branch, with a warning that no released version was found.",
    ]);
    expect(version.parts?.[0].paragraphs.join(" ")).toMatch(/scannedRef.*scannedCommit/);
  });

  it("uses every section id once", () => {
    const ids = ["audiences", "steps", ...PATH_SECTIONS.map((section) => section.id), "sources"];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses no em or en dashes", () => {
    for (const text of allText()) expect(text, text).not.toMatch(/[–—]/);
  });

  it("links only to https sources, each once", () => {
    const urls = PATH_DOC_SOURCES.map((source) => source.url);
    expect(new Set(urls).size).toBe(urls.length);
    for (const url of urls) expect(new URL(url).protocol, url).toBe("https:");
  });
});

describe("CommonGroundPathPage", () => {
  afterEach(() => cleanup());

  it("renders the sections in order", () => {
    const { container } = render(<CommonGroundPathPage />);

    expect(screen.getByRole("heading", { level: 1, name: "The path to Common Ground" })).toBeTruthy();
    expect(Array.from(container.querySelectorAll("section[id]"), (section) => section.id)).toEqual([
      "audiences",
      "steps",
      "version",
      "three-systems",
      "verdict",
      "levels",
      "maintenance",
      "usage",
      "checklist",
      "governance",
      "sources",
    ]);
  });

  it("speaks to a buyer, a maintainer and a municipality", () => {
    render(<CommonGroundPathPage />);

    const section = document.getElementById("audiences")!;
    for (const name of ["A buyer", "A maintainer or supplier", "A municipality"]) {
      expect(within(section).getByRole("heading", { level: 3, name })).toBeTruthy();
    }
  });

  it("shows the seven steps in order", () => {
    render(<CommonGroundPathPage />);

    const items = within(document.getElementById("steps")!).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual(PATH_STEPS);
  });

  it("shows a status badge next to each heading that has one", () => {
    render(<CommonGroundPathPage />);

    expect(screen.getByRole("heading", { level: 2, name: "Which version is measured In review (#68)" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: "Approved In development" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: "How the checklist changes Proposed" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Who decides on approval" })).toBeTruthy();
  });

  it("names the four verdict conditions and the two levels", () => {
    render(<CommonGroundPathPage />);

    const verdict = document.getElementById("verdict")!;
    expect(within(verdict).getAllByRole("listitem")).toHaveLength(4);
    expect(within(verdict).getByText(/at least 4 stars, the level of certification by SIG and TÜViT/)).toBeTruthy();
    expect(within(verdict).getByText(/maintenance\.type: contract/)).toBeTruthy();

    const levels = document.getElementById("levels")!;
    expect(within(levels).getByText(/at least two organisations confirm they use it, and VNG has an SLA with a maintainer/)).toBeTruthy();
  });

  it("explains maintenance, usage, the checklist process and that the governance decision is referenced", () => {
    render(<CommonGroundPathPage />);

    expect(within(document.getElementById("maintenance")!).getByText(/New development is not maintenance/)).toBeTruthy();
    expect(within(document.getElementById("maintenance")!).getByText(/first made maintainable/)).toBeTruthy();
    expect(within(document.getElementById("usage")!).getByText(/declared number/)).toBeTruthy();
    const checklist = document.getElementById("checklist")!;
    expect(within(checklist).getByText(/pas toe of leg uit/)).toBeTruthy();
    expect(within(checklist).getByText(/shows it as a warning, not as a fail/)).toBeTruthy();
    expect(within(document.getElementById("governance")!).getByText(/does not make that decision/)).toBeTruthy();
  });

  it("links the tools page and every source", () => {
    render(<CommonGroundPathPage />);

    expect(screen.getByRole("link", { name: "Tools and models" }).getAttribute("href")).toBe(THREE_SYSTEMS_HREF);
    for (const source of PATH_DOC_SOURCES) {
      expect(screen.getByRole("link", { name: source.title }).getAttribute("href")).toBe(source.url);
    }
  });
});

describe("links to the path page", () => {
  afterEach(() => cleanup());

  it("is linked from the rating guide", () => {
    render(<RatingGuidePage />);

    expect(screen.getByRole("link", { name: "The path to Common Ground" }).getAttribute("href")).toBe(PATH_DOC_HREF);
  });

  it("is linked from the tools and models page", () => {
    render(<ToolsAndModelsPage />);

    expect(screen.getByRole("link", { name: "The path to Common Ground" }).getAttribute("href")).toBe(PATH_DOC_HREF);
  });
});
