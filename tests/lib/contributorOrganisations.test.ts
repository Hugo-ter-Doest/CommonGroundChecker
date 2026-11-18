import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_PROFILE_LOOKUP_LIMIT,
  canonicalEmail,
  matchesOwner,
  mostlyUnknown,
  normaliseCompany,
  organisationDomain,
  parseMailmap,
  profileLookupLimit,
  resolveOrganisations,
} from "@/lib/contributorOrganisations";

describe("parseMailmap", () => {
  it("maps commit addresses to proper addresses and ignores name-only lines and comments", () => {
    const map = parseMailmap(
      [
        "<proper@x.nl> <Old@X.nl>",
        "Jane Doe <jane@x.nl> Jane <jane@gmail.com>  # personal",
        "Joe <joe@x.nl>",
        "# <a@b.nl> <c@d.nl>",
      ].join("\n")
    );

    expect([...map.entries()]).toEqual([
      ["old@x.nl", "proper@x.nl"],
      ["jane@gmail.com", "jane@x.nl"],
    ]);
    expect(canonicalEmail(" JANE@gmail.com ", map)).toBe("jane@x.nl");
    expect(canonicalEmail("", map)).toBeNull();
    expect(parseMailmap(null).size).toBe(0);
  });
});

describe("organisationDomain", () => {
  it.each([
    ["a@conduction.nl", "conduction.nl"],
    ["a@gmail.com", null],
    ["1+a@users.noreply.github.com", null],
    ["a@noreply.codeberg.org", null],
    ["noreply@anthropic.com", null],
    ["root@localhost", null],
    ["root@t", null],
  ])("%s is %s", (email, expected) => {
    expect(organisationDomain(email)).toBe(expected);
  });
});

describe("normaliseCompany and matchesOwner", () => {
  it("strips the @ and lower-cases", () => {
    expect(normaliseCompany("  @ConductionNL ")).toBe("conductionnl");
    expect(normaliseCompany("   ")).toBeNull();
    expect(normaliseCompany(null)).toBeNull();
  });

  it("matches the owner's names apart from punctuation, in any of several handles", () => {
    expect(matchesOwner("conduction b.v.", ["Conduction"])).toBe(true);
    expect(matchesOwner("@nextcloud @conductionnl", ["ConductionNL"])).toBe(true);
    expect(matchesOwner("maykin media", ["open-zaak"])).toBe(false);
    expect(matchesOwner("abc", ["abcdef"])).toBe(false);
  });
});

describe("profileLookupLimit", () => {
  it("reads CGC_PROFILE_LOOKUP_LIMIT and falls back to the default", () => {
    expect(profileLookupLimit({ CGC_PROFILE_LOOKUP_LIMIT: "25" })).toBe(25);
    expect(profileLookupLimit({ CGC_PROFILE_LOOKUP_LIMIT: "0" })).toBe(0);
    expect(profileLookupLimit({ CGC_PROFILE_LOOKUP_LIMIT: "many" })).toBe(DEFAULT_PROFILE_LOOKUP_LIMIT);
    expect(profileLookupLimit({})).toBe(200);
  });
});

describe("resolveOrganisations", () => {
  it("counts a company that names a domain's organisation as that domain", async () => {
    const resolution = await resolveOrganisations(
      [
        { email: "a@conduction.nl", login: "a" },
        { email: "b@maykinmedia.nl", login: "b" },
        { email: "c@gmail.com", login: "c" },
        { email: "d@gmail.com", login: "d" },
      ],
      { lookupCompany: async (login) => (login === "c" ? "Maykin Media" : "Studio X"), lookupLimit: 10 }
    );

    expect(resolution.contributors.map((contributor) => contributor.organisation)).toEqual([
      "conduction.nl",
      "maykinmedia.nl",
      "maykinmedia.nl",
      "company:studiox",
    ]);
    expect(resolution.notLookedUp).toBe(0);
  });

  it("looks up nothing without a lookup, and leaves those authors unknown", async () => {
    const lookupCompany = vi.fn();
    const resolution = await resolveOrganisations([{ email: "c@gmail.com", login: "c" }], { lookupLimit: 0, lookupCompany });

    expect(lookupCompany).not.toHaveBeenCalled();
    expect(resolution).toMatchObject({ notLookedUp: 1, lookupAvailable: true });
    expect(mostlyUnknown(resolution)).toBe(true);
    expect((await resolveOrganisations([{ email: "c@gmail.com", login: "c" }])).lookupAvailable).toBe(false);
  });
});
