# Whitepaper
## Een gemeentelijk SaaS-platform voor herbruikbare componenten

**Versie:** 1.0  
**Datum:** 2026-04-12  
**Doelgroep:** gemeentelijke digitale teams, CIO-kantoren, architecten, security/compliance teams, inkoop en producteigenaren

---

## Samenvatting

Gemeenten staan onder druk om betrouwbare digitale diensten sneller, goedkoper en met betere beveiliging, transparantie en interoperabiliteit te leveren. Een Software-as-a-Service (SaaS)-model dat is opgebouwd rond herbruikbare, standaarden-gerichte componenten biedt een praktische weg vooruit.

Dit whitepaper introduceert een gemeentelijk SaaS-concept dat zich richt op hergebruik van componenten en gestuurd onboarden. Het stelt een criteriaramenwerk voor dat gemeenten kunnen gebruiken om te beslissen welke componenten in de dienst kunnen worden opgenomen. Ten slotte introduceert het de Common Ground Checker-applicatie in deze repository als een concreet volgende stap om het raamwerk te operationaliseren.

---

## 1) Waarom een gemeentelijk SaaS-model

### 1.1 Huidige gemeentelijke uitdagingen

Gemeentelijke organisaties hebben vaak te maken met:
- versnipperde leverancierslandschappen en overlappende tooling
- lange doorlooptijden voor inkoop en implementatie
- inconsistente kwaliteit en documentatie in software-assets
- beperkte draagkracht tussen gemeenten
- toenemende druk op beveiligings- en compliancecapaciteit

### 1.2 Wat een SaaS-service verandert

Een gemeentelijk SaaS-platform verlegt de focus van projectmatige levering naar continu beheerde capaciteit. In plaats van dat elke gemeente componenten opnieuw beoordeelt, centraliseert het platform onboardingbeslissingen en verspreidt het vertrouwde componenten als herbruikbare bouwblokken.

### 1.3 Strategische uitkomsten

Een goed bestuurd SaaS-model maakt mogelijk:
- **Snellere levering:** minder herhaalde due diligence per gemeente
- **Lagere totale kosten:** gedeeld onderhoud en governance
- **Hogere kwaliteit:** gestandaardiseerde kwaliteitspoorten en zichtbare metrics
- **Grotere interoperabiliteit:** componentcontracten en API-first integratie
- **Verbeterd vertrouwen:** transparante criteria en controleerbare onboardingbeslissingen

Gerelateerde achtergrond:
- EU-beleid voor interoperabiliteit en grensoverschrijdende digitale publieke diensten: https://interoperable-europe.ec.europa.eu/
- NORA (Nederlandse Overheidsreferentiearchitectuur): https://www.noraonline.nl/

---

## 2) Conceptueel servicemodel

### 2.1 Reikwijdte van de service

De SaaS-service fungeert als een beheerde catalogus en runtime-ecosysteem voor gemeentelijke componenten:
- API-componenten
- proces- en domeindiensten
- deployment-artifacts (containerimages/charts)
- governance-metadata (licentie, beleid, bijdragepraktijk)

### 2.2 Operationele principes

1. **Hergebruik eerst, niet opnieuw bouwen**
2. **Open by default waar juridisch mogelijk**
3. **API- en standaardengestuurde interoperabiliteit**
4. **Beveiliging en operatie vanaf dag één ingebouwd**
5. **Transparante acceptatiecriteria**

### 2.3 Governancepatroon

Een lichte governanceboard (architectuur + security + product + operatie) is eigenaar van:
- onboardingbeleid
- criteriadrempels
- uitzonderingsproces
- periodieke herbeoordelingscyclus

---

## 3) Raamwerk voor componentacceptatie

Onderstaand raamwerk structureert de beoordeling van componenten in vier categorieën. Elk criterium wordt geclassificeerd als **verplicht** of **aanbevolen**, gescoord en in de tijd gevolgd.

## 3.1 Governance

Doel: juridische duidelijkheid, verantwoord samenwerken en onderhoudbaarheid waarborgen.

Voorbeeldcriteria:
- **OSI-goedgekeurde licentie** (Verplicht) — https://opensource.org/licenses
- **Copyright/IP-eigenaarschap bekendmaken** (Aanbevolen)
- **publiccode.yml metadata** (Verplicht) — https://standard.publiccode.net/
- **Contributing-guide** (Aanbevolen)
- **Code of Conduct** (Aanbevolen) — https://opensource.guide/code-of-conduct/
- **Securitybeleid / kwetsbaarheidsmelding** (Aanbevolen) — https://docs.github.com/en/code-security/getting-started/adding-a-security-policy-to-your-repository

Beoordelingsvragen:
- Kan dit component legaal en veilig door gemeenten worden hergebruikt?
- Is eigenaarschap en beheer expliciet vastgelegd?
- Zijn bijdrage- en meldingsroutes helder?

## 3.2 Architectuur

Doel: zorgen dat componenten passen binnen gemeentelijke referentiearchitecturen en integratiepatronen.

Voorbeeldcriteria:
- **OpenAPI/API-first specificatie** (Verplicht voor registerachtige componenten) — https://spec.openapis.org/oas/latest.html
- **Common Ground 5-laags architectuurfit** (Aanbevolen) — https://commonground.nl/

Beoordelingsvragen:
- Is het integratiecontract machineleesbaar en testbaar?
- Sluit het component aan op de bedoelde architectuurgrenzen?

## 3.3 Deployment & Operations

Doel: inzetbaarheid, herhaalbaarheid en operationele gereedheid zekerstellen.

Voorbeeldcriteria:
- **Docker-ondersteuning** (Verplicht) — https://docs.docker.com/
- **Beschikbaarheid van een gepubliceerd containerimage** (Verplicht) — https://github.com/opencontainers/distribution-spec
- **Helm-chart / Kubernetes inzetbaarheid** (Verplicht) — https://helm.sh/docs/ en https://kubernetes.io/docs/

Beoordelingsvragen:
- Kan het component consistent worden uitgerold in gemeentelijke omgevingen?
- Zijn standaard operationele en platformvereisten vervuld?

## 3.4 Softwarekwaliteit

Doel: technische degelijkheid en onderhoudbaarheid in de tijd waarborgen.

Voorbeeldcriteria:
- **Werkelijke broncode aanwezig** (Verplicht)
- **Documentatiekwaliteit / aanwezigheid** (Verplicht)
- **Aanwezigheid van een testset** (Aanbevolen)
- **Cyclomatische complexiteitsdrempels** (Aanbevolen) — https://github.com/terryyin/lizard
- **Semantische versievoering** (Aanbevolen) — https://semver.org/
- **SBOM-beschikbaarheid** (Aanbevolen) — https://www.cisa.gov/sbom en https://cyclonedx.org/ en https://spdx.dev/

Beoordelingsvragen:
- Is het component begrijpelijk, testbaar en onderhoudbaar?
- Kan risico en verandering in de tijd beheerd worden?

---

## 4) Beslissingsmodel en levenscyclus

### 4.1 Voorgestelde besluitstatussen

- **Geaccepteerd:** voldoet aan alle verplichte criteria; aanbevolen criteria op of boven de drempel
- **Voorwaardelijk geaccepteerd:** verplichte criteria slagen; specifieke remediaties vereist
- **Afgewezen:** een of meer verplichte criteria falen
- **Uitgefaseerd:** eerder geaccepteerd maar niet langer compliant of onderhoudbaar

### 4.2 Voorgesteld werkproces

1. Intake en metadata-verzameling
2. Geautomatiseerde criteria-scan
3. Gerichte handmatige beoordeling van onduidelijke criteria
4. Acceptatiebeslissing met remedianotities
5. Publicatie in de gemeentelijke componentcatalogus
6. Periodieke hervalidatie (bijv. maandelijks/kwartaal)

### 4.3 Richtlijnen voor scoring

- Gebruik gewogen scores om verschillende volwassenheidsdimensies te balanceren
- Houd verplichte criteria als harde poorten
- Maak drempels configureerbaar per componenttype/risicoklasse

Gerelateerde richtlijnen:
- OWASP Software Assurance Maturity Model (SAMM): https://owaspsamm.org/
- NIST Secure Software Development Framework (SSDF): https://csrc.nist.gov/Projects/ssdf

---

## 5) Implementatieoverwegingen

### 5.1 Organisatorisch

- Definieer eigenaarschap van het onboarding-raamwerk
- Stem architectuur, juridische zaken, inkoop en operatie af op het gatingbeleid
- Begin met een minimaal criteriapakket en itereren

### 5.2 Technisch

- Automatiseer bewijsgaring via repository- en artifactanalyse
- Sla scoringconfiguratie en resultaten op voor audittrail en reproduceerbaarheid
- Bied historische trendinzichten en per-component diepgaande overzichten

### 5.3 Verandermanagement

- Publiceer duidelijke richtlijnen voor leveranciers en interne teams
- Bied remedialijsten voor niet-geslaagde criteria
- Behandel onboarding als een gezamenlijke kwaliteitsverbeteringscyclus

---

## 6) Volgende stap: de Common Ground Checker-app introduceren

Om dit raamwerk te operationaliseren, biedt de app in deze repository een praktisch startpunt.

### 6.1 Wat de app doet

De Common Ground Checker:
- analyseert een GitHub-repository
- voert criteria-controles uit over Governance, Architectuur, Deployment & Operations en Softwarekwaliteit
- genereert een gewogen compliance-score
- slaat historische analyseruns en scoringconfiguraties op
- biedt beheercontrols voor criteriagewichten en complexiteitsdrempels

### 6.2 Waarom het belangrijk is voor een gemeentelijke SaaS-rollout

De app kan dienen als de onboardingpoort voor kandidaatcomponenten voordat ze gepubliceerd worden in een gemeentelijke SaaS-catalogus. Het biedt:
- **Consistentie:** dezelfde controles voor elk kandidaatcomponent
- **Transparantie:** expliciet bewijs en berichten per criterium
- **Traceerbaarheid:** historische runs en score-evolutie in de tijd
- **Actiegerichtheid:** concrete remediatiedoelen voor teams

### 6.3 Voorgesteld adoptiepad

1. **Pilotfase:** evalueer een kleine set kandidaatcomponenten
2. **Kalibratiefase:** stem criteriagewichten en drempels af met governance-stakeholders
3. **Operationele fase:** veranker checker-uitkomsten in onboardingprocessen en releasepoorten
4. **Schaalfase:** integreer met inkoop en portfoliogovernance

---

## 7) Conclusie

Een gemeentelijk SaaS-model dat is opgebouwd rond herbruikbare componenten kan de snelheid van levering, kwaliteit en interoperabiliteit aanzienlijk verbeteren. Succes hangt af van een helder, transparant en afdwingbaar onboarding-raamwerk.

De Common Ground Checker-app biedt een concreet middel om dit raamwerk vandaag in de praktijk te brengen: automatiseer wat kan, baseer beslissingen op bewijs en handhaaf menselijke governance waar beoordeling nog nodig is.

---

## 8) Referenties

1. Common Ground (NL): https://commonground.nl/  
2. API Design Rules (NL): https://commonground.nl/cms/view/54476259/api-designrules  
3. Standard for Public Code: https://standard.publiccode.net/  
4. Open Source Initiative Licenses: https://opensource.org/licenses  
5. OpenAPI Specification: https://spec.openapis.org/oas/latest.html  
6. Semantic Versioning: https://semver.org/  
7. CISA SBOM Overview: https://www.cisa.gov/sbom  
8. SPDX: https://spdx.dev/  
9. CycloneDX: https://cyclonedx.org/  
10. Docker Docs: https://docs.docker.com/  
11. Kubernetes Docs: https://kubernetes.io/docs/  
12. Helm Docs: https://helm.sh/docs/  
13. GitHub Security Policy Docs: https://docs.github.com/en/code-security/getting-started/adding-a-security-policy-to-your-repository  
14. Open Source Guides — Code of Conduct: https://opensource.guide/code-of-conduct/  
15. OWASP SAMM: https://owaspsamm.org/  
16. NIST SSDF: https://csrc.nist.gov/Projects/ssdf  
17. Interoperable Europe Portal: https://interoperable-europe.ec.europa.eu/  
18. NORA (Dutch Government Reference Architecture): https://www.noraonline.nl/

---

## Appendix A — Voorbeeldcriteria-matrix (Starter)

| Categorie | Criterium | Niveau | Geautomatiseerd? |
|---|---|---|---|
| Governance | OSI-licentie | Verplicht | Ja |
| Governance | Copyright/IP-eigenaarschapsvermelding | Aanbevolen | Ja (heuristisch) |
| Governance | publiccode.yml | Verplicht | Ja |
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
