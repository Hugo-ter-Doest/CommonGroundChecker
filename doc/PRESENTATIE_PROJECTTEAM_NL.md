---
marp: true
title: Introductie Common Ground SaaS-checker
theme: default
paginate: true
---

# Introductie
## Gemeentelijke SaaS voor herbruikbare componenten

**Voor:** Projectteam  
**Doel:** Begrip, draagvlak en start van pilot  
**Tijd:** 30–40 minuten (incl. demo + vragen)

---

# Agenda

1. Waarom dit nodig is
2. Het concept: gemeentelijke SaaS-aanpak
3. Doel en beoogde resultaten
4. Toetsingskader (criteria-categorieën)
5. De applicatie die we hebben gebouwd
6. Live demo
7. Volgende stappen

---

# Waarom dit nodig is

## Huidige pijnpunten
- Veel dubbele beoordeling van dezelfde componenten
- Wisselende kwaliteit van documentatie en beheer
- Onzekerheid over herbruikbaarheid, compliance en security
- Lange doorlooptijd van intake naar adoptie

## Gevolg
- Vertraging, hogere kosten en minder voorspelbare implementaties

---

# Visie

## Van losse beoordelingen naar een gedeelde SaaS-aanpak

In plaats van per gemeente opnieuw evalueren, gebruiken we één **transparant beoordelingskader** en één **herhaalbaar proces**.

### Kernidee
- Herbruikbare componenten
- Objectieve criteria
- Geautomatiseerde checks + menselijke review waar nodig

---

# Doel van de aanpak

## Wat willen we bereiken?
- Snellere en beter onderbouwde adoptiebesluiten
- Hogere basiskwaliteit van componenten
- Meer hergebruik tussen gemeenten
- Betere audit trail (historie, scores, bewijs)

## Niet het doel
- Volledig vervangen van architectuur/security-judgement

---

# Het toetsingskader (overzicht)

We beoordelen componenten in 4 categorieën:

1. **Governance**
2. **Architectuur**
3. **Deployment & Operations**
4. **Softwarekwaliteit**

Per criterium: status, bewijs, en impact op totaalscore.

---

# 1) Governance

Voorbeelden:
- OSI-licentie
- Copyright / IP-owner detectie
- `publiccode.yml`
- `CONTRIBUTING`
- `CODE_OF_CONDUCT`
- `SECURITY` policy

**Waarom:** juridische duidelijkheid, eigenaarschap en verantwoord beheer.

---

# 2) Architectuur

Voorbeelden:
- OpenAPI / API-first
- 5-lagen fit (Common Ground)

**Waarom:** betere interoperabiliteit en consistentie in het landschap.

---

# 3) Deployment & Operations

Voorbeelden:
- Docker support
- Beschikbare Docker image
- Helm chart / Kubernetes readiness

**Waarom:** voorspelbare uitrol en beheersbaarheid in productie.

---

# 4) Softwarekwaliteit

Voorbeelden:
- Aanwezigheid broncode
- Documentatie
- Test-suite
- Cyclomatische complexiteit (Avg CCN + Max CCN)
- SemVer
- SBOM

**Waarom:** onderhoudbaarheid, technische kwaliteit en lagere risico’s.

---

# Scoring & besluitvorming

## Principes
- Mandatory criteria zijn hard gates
- Recommended criteria wegen mee in score
- Wegingen zijn configureerbaar

## Besluitopties
- Geaccepteerd
- Voorwaardelijk geaccepteerd
- Afgewezen

---

# Wat we hebben gebouwd

## Common Ground Checker (de app)

De app:
- Analyseert GitHub-repositories
- Toont status per criterium met bewijs
- Berekent totaalscore op basis van configureerbare wegingen
- Houdt historie per repo bij
- Ondersteunt admin-configuratie (o.a. complexity thresholds)

---

# Belangrijke features

- Progress bar tijdens analyse (SSE)
- Historie-overzicht + detail per analyse
- Copyright/IP owner checker met confidence
- Dynamische badges (coverage + vulnerabilities)
- Security secret scanning met Gitleaks (lokaal + CI)

---

# Live demo (5–10 min)

## Demo-doel
Laten zien hoe een component van URL naar beoordelingsresultaat gaat.

## Demo-flow
1. Open homepage van de checker
2. Voer repo-URL in
3. Start analyse en toon progress bar
4. Bekijk totaalscore + criteriaresultaten
5. Open historie en detailanalyse
6. Open Admin en wijzig 1 weging + complexity thresholds
7. Heranalyseer en toon effect op score

---

# Demo-script (spreektekst)

- “We starten met één publieke GitHub-repo.”
- “Tijdens analyse zien we realtime stappen.”
- “Hier zien we per criterium status en bewijs.”
- “In de historie kunnen we beslissingen onderbouwen over tijd.”
- “In Admin kunnen we governance-keuzes vertalen naar wegingen.”
- “Na een nieuwe run zien we direct de impact.”

---

# Verwachte vragen (Q&A voorbereiding)

## “Is dit volledig automatisch betrouwbaar?”
Nee. Het versnelt en objectieveert veel checks, maar menselijke beoordeling blijft nodig voor context en uitzonderingen.

## “Kunnen we criteria aanpassen?”
Ja, via Admin (wegingen en complexity-thresholds).

## “Wat met security/credentials?”
Er is audit + secret scanning (Gitleaks), lokaal en in CI.

---

# Implementatievoorstel (kort)

## Fase 1 (2–4 weken)
- Pilot met 5–10 bestaande componenten
- Baseline score en knelpunten in kaart

## Fase 2 (4–8 weken)
- Criteria/wegingen kalibreren
- Procesafspraken maken (acceptatie/afwijzing)

## Fase 3
- Inbedding in reguliere intake en portfolio-overleg

---

# Rollen in het projectteam

- **Product owner:** scope, prioriteiten, acceptatiecriteria
- **Architect:** kader en interpretatie van architectuurchecks
- **Security/compliance:** policies en uitzonderingen
- **Dev/Platform:** operationele haalbaarheid en CI-integratie
- **Beheer:** lifecycle en periodieke herbeoordeling

---

# Risico’s en mitigaties

- **Risico:** te veel vertrouwen op score  
  **Mitigatie:** score + menselijke review verplicht
- **Risico:** te strenge criteria blokkeren adoptie  
  **Mitigatie:** pilot en gefaseerde aanscherping
- **Risico:** false positives in checks  
  **Mitigatie:** iteratief verbeteren op basis van echte cases

---

# Call to action

## Besluit vandaag
1. Akkoord op pilot met projectteam
2. Selectie van eerste componenten
3. Aanwijzen van beoordelaars per rol

## Resultaat na pilot
- Onderbouwd voorstel voor structurele inzet

---

# Bijlage – Demo checklist

- [ ] Dev server draait (`http://localhost:3000`)
- [ ] 2 demo-repositories klaar
- [ ] Admin pagina toegankelijk
- [ ] Historie bevat minimaal 1 eerdere run
- [ ] Back-up plan: screenshots bij netwerkissues

---

# Dank

Vragen en feedback

**Contact:** projectteam Common Ground Checker
