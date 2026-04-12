# Whitepaper
## A Municipal SaaS Platform for Reusable Components

**Version:** 1.0  
**Date:** 2026-04-12  
**Audience:** Municipal digital teams, CIO offices, architects, security/compliance teams, procurement, and product owners

---

## Executive Summary

Municipalities are under pressure to deliver reliable digital services faster, at lower cost, and with stronger security, transparency, and interoperability. A Software-as-a-Service (SaaS) model built around reusable, standards-aligned components offers a practical path forward.

This whitepaper introduces a municipal SaaS concept focused on component reuse and governed onboarding. It proposes a criteria framework that municipalities can use to decide which components can be adopted into the service. Finally, it introduces the Common Ground Checker application built in this repository as a concrete next step for operationalizing the framework.

---

## 1) Why a Municipal SaaS Model

### 1.1 Current municipal challenges

Municipal organizations often face:
- Fragmented vendor landscapes and overlapping tooling
- Long lead times for procurement and implementation
- Inconsistent quality and documentation across software assets
- Limited portability between municipalities
- Growing pressure on security and compliance capacity

### 1.2 What a SaaS service changes

A municipal SaaS platform shifts focus from project-by-project delivery to continuously managed capability. Instead of each municipality evaluating components from scratch, the platform centralizes onboarding decisions and distributes trusted components as reusable building blocks.

### 1.3 Strategic outcomes

A well-governed SaaS model enables:
- **Faster delivery:** less repeated due diligence per municipality
- **Lower total cost:** shared maintenance and governance
- **Higher quality:** standardized quality gates and observable metrics
- **Greater interoperability:** component contracts and API-first integration
- **Improved trust:** transparent criteria and auditable onboarding decisions

---

## 2) Conceptual Service Model

### 2.1 Service scope

The SaaS service acts as a managed catalog and runtime ecosystem for municipal components:
- API components
- process and domain services
- deployment artifacts (container images/charts)
- governance metadata (license, policy, contribution model)

### 2.2 Operating principles

1. **Reuse-first, not rebuild-first**
2. **Open by default where legally possible**
3. **API- and standards-driven interoperability**
4. **Security and operations built in from day one**
5. **Transparent acceptance criteria**

### 2.3 Governance pattern

A lightweight governance board (architecture + security + product + operations) owns:
- onboarding policy
- criteria thresholds
- exceptions process
- periodic re-assessment cadence

---

## 3) Framework for Component Adoption

The framework below structures component evaluation into four categories. Each criterion should be classified as **Mandatory** or **Recommended**, scored, and tracked over time.

## 3.1 Governance

Purpose: Ensure legal clarity, responsible collaboration, and maintainability.

Example criteria:
- **OSI-approved license** (Mandatory)
- **Copyright/IP owner disclosure** (Recommended)
- **publiccode.yml metadata** (Mandatory)
- **Contributing guide** (Recommended)
- **Code of Conduct** (Recommended)
- **Security policy / vulnerability disclosure** (Recommended)

Assessment questions:
- Can this component be reused legally and safely across municipalities?
- Is ownership and stewardship explicit?
- Are contribution and disclosure pathways clear?

## 3.2 Architecture

Purpose: Ensure components fit municipal reference architectures and integration patterns.

Example criteria:
- **OpenAPI/API-first specification** (Mandatory for register-style components)
- **Common Ground 5-layer architecture fit** (Recommended)

Assessment questions:
- Is the integration contract machine-readable and testable?
- Does the component align to intended architectural boundaries?

## 3.3 Deployment & Operations

Purpose: Ensure deployability, repeatability, and operational readiness.

Example criteria:
- **Docker support** (Mandatory)
- **Published container image availability** (Mandatory)
- **Helm chart / Kubernetes deployability** (Mandatory)

Assessment questions:
- Can the component be deployed consistently across municipal environments?
- Are baseline operational and platform requirements met?

## 3.4 Software Quality

Purpose: Ensure technical soundness and maintainability over time.

Example criteria:
- **Actual source code present** (Mandatory)
- **Documentation quality/presence** (Mandatory)
- **Test suite presence** (Recommended)
- **Cyclomatic complexity thresholds** (Recommended)
- **Semantic versioning discipline** (Recommended)
- **SBOM availability** (Recommended)

Assessment questions:
- Is the component understandable, testable, and maintainable?
- Can risk and change be managed over time?

---

## 4) Decision Model and Lifecycle

### 4.1 Suggested decision states

- **Accepted:** Meets all mandatory criteria; recommended criteria at or above threshold
- **Conditionally accepted:** Mandatory criteria pass; specific remediations required
- **Rejected:** One or more mandatory criteria fail
- **Retired:** Previously accepted but no longer compliant/maintainable

### 4.2 Suggested workflow

1. Intake and metadata collection
2. Automated criteria scan
3. Targeted manual review for ambiguous criteria
4. Acceptance decision with remediation notes
5. Publish in municipal component catalog
6. Periodic re-validation (e.g., monthly/quarterly)

### 4.3 Scoring guidance

- Use weighted scores to balance maturity dimensions
- Keep mandatory criteria as hard gates
- Allow configurable thresholds by component type/risk class

---

## 5) Implementation Considerations

### 5.1 Organizational

- Define ownership of the onboarding framework
- Align architecture, legal, procurement, and operations on gating policy
- Start with a minimal criteria set and iterate

### 5.2 Technical

- Automate evidence collection via repository and artifact analysis
- Persist scoring configuration and results for auditability
- Expose historical trend views and per-component drill-downs

### 5.3 Change management

- Publish clear guidance for suppliers and internal teams
- Provide remediation checklists for failed criteria
- Treat onboarding as a collaborative quality improvement cycle

---

## 6) Next Step: Introducing the Common Ground Checker App

To operationalize this framework, the app in this repository provides a practical starting point.

### 6.1 What the app does

The Common Ground Checker:
- Analyzes a GitHub repository
- Runs criteria checks across Governance, Architecture, Deployment & Operations, and Software Quality
- Produces a weighted compliance score
- Stores historical analysis runs and scoring configurations
- Provides admin controls for criterion weights and complexity thresholds

### 6.2 Why it matters for a municipal SaaS rollout

The app can serve as the onboarding gate for candidate components before publication into a municipal SaaS catalog. It creates:
- **Consistency:** same checks for every candidate component
- **Transparency:** explicit evidence and messages per criterion
- **Traceability:** historical runs and score evolution over time
- **Actionability:** concrete remediation targets for teams

### 6.3 Suggested adoption path

1. **Pilot phase:** evaluate a small set of candidate components
2. **Calibration phase:** tune criteria weights and thresholds with governance stakeholders
3. **Operational phase:** embed checker outcomes in onboarding workflow and release gates
4. **Scale phase:** integrate with procurement and portfolio governance

---

## 7) Conclusion

A municipal SaaS model built on reusable components can significantly improve delivery speed, quality, and interoperability. Success depends on a clear, transparent, and enforceable onboarding framework.

The Common Ground Checker app offers a concrete way to put this framework into practice today: automate what can be automated, make decisions evidence-based, and keep human governance where judgment is still required.

---

## Appendix A — Example Criteria Matrix (Starter)

| Category | Criterion | Level | Automated? |
|---|---|---|---|
| Governance | OSI license | Mandatory | Yes |
| Governance | Copyright/IP owner disclosure | Recommended | Yes (heuristic) |
| Governance | publiccode.yml | Mandatory | Yes |
| Governance | Contributing guide | Recommended | Yes |
| Governance | Code of Conduct | Recommended | Yes |
| Governance | Security policy | Recommended | Yes |
| Architecture | OpenAPI spec | Mandatory* | Yes |
| Architecture | 5-layer fit | Recommended | Partial |
| Deployment & Operations | Docker support | Mandatory | Yes |
| Deployment & Operations | Docker image available | Mandatory | Yes |
| Deployment & Operations | Helm chart | Mandatory | Yes |
| Software Quality | Source code present | Mandatory | Yes |
| Software Quality | Documentation | Mandatory | Yes |
| Software Quality | Tests present | Recommended | Yes |
| Software Quality | Cyclomatic complexity | Recommended | Yes |
| Software Quality | Semantic versioning | Recommended | Yes |
| Software Quality | SBOM | Recommended | Yes |

\* For register-oriented/API components.
