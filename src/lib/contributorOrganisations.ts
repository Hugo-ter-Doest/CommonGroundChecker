/**
 * Tells the organisations of commit authors apart: by the domain of their
 * email address, and for a personal or hidden address by the "company" of
 * their public profile. Addresses, logins and company strings are read while
 * counting only; callers keep counts, and name an organisation only when at
 * least two authors share it.
 */

/** Mail providers whose addresses say nothing about an organisation. */
export const PERSONAL_MAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "live.nl",
  "hotmail.nl",
  "msn.com",
  "yahoo.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "gmx.com",
  "gmx.de",
  "gmx.net",
  "web.de",
  "posteo.de",
  "mailbox.org",
  "fastmail.com",
  "ziggo.nl",
  "kpnmail.nl",
  "planet.nl",
  "xs4all.nl",
  "home.nl",
  "telfort.nl",
]);

/** Profiles looked up per scan unless CGC_PROFILE_LOOKUP_LIMIT says otherwise. */
export const DEFAULT_PROFILE_LOOKUP_LIMIT = 200;

const LOOKUP_CONCURRENCY = 8;

/** The number of profiles a scan may look up. */
export function profileLookupLimit(env: Record<string, string | undefined> = process.env): number {
  const value = Number(env.CGC_PROFILE_LOOKUP_LIMIT);
  return Number.isInteger(value) && value >= 0 ? value : DEFAULT_PROFILE_LOOKUP_LIMIT;
}

/** The domain of an email address or the host of a URL, in lower case without "www.", or null. */
export function domainOf(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const text = value.trim().toLowerCase();
  if (text.includes("@") && !text.includes("/")) return text.slice(text.lastIndexOf("@") + 1) || null;
  try {
    return new URL(/^[a-z]+:\/\//.test(text) ? text : `https://${text}`).hostname.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

/** True for a domain that names no organisation: personal mail, hidden addresses, local hosts. */
export function isUnknownDomain(domain: string): boolean {
  return (
    !domain.includes(".") ||
    PERSONAL_MAIL_DOMAINS.has(domain) ||
    /(^|\.)noreply\.|^noreply\b|(^|\.)local$|(^|\.)localdomain$/.test(domain)
  );
}

/** The organisation domain of an address, or null for a personal, hidden or noreply address. */
export function organisationDomain(email: string): string | null {
  const address = email.trim().toLowerCase();
  if (/^no-?reply@/.test(address)) return null;
  const domain = domainOf(address);
  return domain && !isUnknownDomain(domain) ? domain : null;
}

/**
 * The address mapping of a .mailmap file: each commit address to its proper
 * address, in lower case. Lines that only correct a name map nothing.
 */
export function parseMailmap(content: string | null | undefined): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of (content ?? "").split(/\r?\n/)) {
    const text = line.replace(/#.*$/, "");
    const emails = [...text.matchAll(/<([^<>\s]+)>/g)].map((match) => match[1].trim().toLowerCase());
    if (emails.length >= 2 && emails[0] !== emails[1]) map.set(emails[1], emails[0]);
  }
  return map;
}

/** The address an author is counted by: lower case, after the .mailmap. */
export function canonicalEmail(email: unknown, mailmap: Map<string, string>): string | null {
  if (typeof email !== "string" || !email.trim()) return null;
  const address = email.trim().toLowerCase();
  return mailmap.get(address) ?? address;
}

/** A profile's company without a leading "@", in lower case; null when empty. */
export function normaliseCompany(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const company = value.trim().replace(/^@+/, "").trim().toLowerCase();
  return company || null;
}

function loose(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** True when the names are the same apart from punctuation, or one contains the other (at least 4 characters). */
function sameName(a: string, b: string): boolean {
  const [x, y] = [loose(a), loose(b)];
  if (!x || !y) return false;
  if (x === y) return true;
  const [shorter, longer] = x.length <= y.length ? [x, y] : [y, x];
  return shorter.length >= 4 && longer.includes(shorter);
}

/** True when a company names one of the owner's names; a company may list several "@" handles. */
export function matchesOwner(company: string, ownerNames: string[]): boolean {
  const parts = company.split(/[,;|/]|\s+(?=@)/).map((part) => part.trim().replace(/^@+/, "")).filter(Boolean);
  return parts.some((part) => ownerNames.some((name) => sameName(part, name)));
}

export interface ContributorIdentity {
  /** The address the author is counted by */
  email: string;
  /** The forge account of the author, when the forge names it */
  login: string | null;
}

/** Reads the "company" of a public profile; throws or gives null when there is none. */
export type CompanyLookup = (login: string) => Promise<string | null>;

export interface ResolveOptions {
  /** Domains that belong to the owner, from publiccode.yml */
  ownerDomains?: string[];
  /** Names of the owner: its account, its display name and the organisations in publiccode.yml */
  ownerNames?: string[];
  lookupCompany?: CompanyLookup;
  /** Profiles to look up at most; defaults to profileLookupLimit() */
  lookupLimit?: number;
}

export interface ResolvedContributor {
  /** A domain, "company:<name>", or null when the organisation is unknown */
  organisation: string | null;
  /** True when the organisation is the owner's */
  inside: boolean;
}

export interface OrganisationResolution {
  /** One entry per author, in the order given */
  contributors: ResolvedContributor[];
  /** Authors with an unknown address whose profile was not looked up because of the limit */
  notLookedUp: number;
  /** False when profiles cannot be looked up on this forge */
  lookupAvailable: boolean;
}

/**
 * The organisation of each author. Inside are the owner's domains (with their
 * subdomains), the organisation domain with the most authors, and a profile
 * company that names the owner. A company that names a domain's organisation
 * counts as that domain.
 */
export async function resolveOrganisations(
  authors: ContributorIdentity[],
  options: ResolveOptions = {}
): Promise<OrganisationResolution> {
  const domains = authors.map((author) => organisationDomain(author.email));
  const authorsPerDomain = new Map<string, number>();
  for (const domain of domains) if (domain) authorsPerDomain.set(domain, (authorsPerDomain.get(domain) ?? 0) + 1);
  const dominant = [...authorsPerDomain.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const ownerDomains = [...new Set([...(options.ownerDomains ?? []), ...(dominant ? [dominant] : [])])];
  const isInsideDomain = (domain: string) =>
    ownerDomains.some((owner) => domain === owner || domain.endsWith(`.${owner}`));

  const contributors: ResolvedContributor[] = domains.map((domain) => ({
    organisation: domain,
    inside: domain !== null && isInsideDomain(domain),
  }));

  const unknown = authors.flatMap((author, index) => (domains[index] === null ? [index] : []));
  const lookup = options.lookupCompany;
  const limit = options.lookupLimit ?? profileLookupLimit();
  const withLogin = unknown.filter((index) => authors[index].login);
  const toLookUp = lookup ? withLogin.slice(0, limit) : [];
  const notLookedUp = lookup ? withLogin.length - toLookUp.length : 0;

  const ownerNames = options.ownerNames ?? [];
  const knownDomains = [...authorsPerDomain.keys()];
  const companyOrganisation = (company: string): ResolvedContributor => {
    if (matchesOwner(company, ownerNames)) {
      return { organisation: ownerDomains[0] ?? `company:${loose(company)}`, inside: true };
    }
    const domain = knownDomains.find((candidate) => sameName(company, candidate.split(".").slice(0, -1).join(".")));
    if (domain) return { organisation: domain, inside: isInsideDomain(domain) };
    return { organisation: `company:${loose(company)}`, inside: false };
  };

  for (let start = 0; start < toLookUp.length; start += LOOKUP_CONCURRENCY) {
    await Promise.all(
      toLookUp.slice(start, start + LOOKUP_CONCURRENCY).map(async (index) => {
        try {
          const company = normaliseCompany(await (lookup as CompanyLookup)(authors[index].login as string));
          if (company) contributors[index] = companyOrganisation(company);
        } catch {
          // A profile that cannot be read leaves the author unknown.
        }
      })
    );
  }

  return { contributors, notLookedUp, lookupAvailable: !!lookup };
}

/** True when the organisation of more than half of the authors is unknown. */
export function mostlyUnknown(resolution: OrganisationResolution): boolean {
  const unknown = resolution.contributors.filter((contributor) => contributor.organisation === null).length;
  return unknown * 2 > resolution.contributors.length;
}
