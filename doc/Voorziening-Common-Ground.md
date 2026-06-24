# Voorziening Common Ground

# Inleiding
Voorziening Common Ground (VCG) is een SaaS-voorziening die gemeentelijke digitale diensten ondersteunt met herbruikbare componenten. Deze componenten zijn open source en worden gezamenlijk ontwikkeld en beheerd door communities van gemeenten.

De VCG volgt de vijflaagarchitectuur van Common Ground en start met componenten uit lagen 1, 2 en 3. In een volgende fase worden ook componenten uit lagen 4 en 5 toegevoegd om de omvang en de functionaliteit geleidelijk te vergroten.

De hosting en deployment van de voorziening worden gerealiseerd op basis van Haven en Haven+, zodat de oplossing zo veel mogelijk cloudonafhankelijk, schaalbaar en compatibel blijft.

# Componenten voor de voorziening
In een eerste fase wordt de selectie van componenten bepaald door de behoefte van koplopergemeenten: gemeenten die vooroplopen in de Common Ground beweging en ervaring hebben met de eerste inrichting van CG-componenten. Deze groep helpt de startselectie samen te stellen, die we de Basisset noemen.

De Basisset is een dynamische collectie componenten, en niet statisch. Componenten kunnen worden toegevoegd, verwijderd of vervangen naar gelang de behoefte verandert, standaarden wijzigen of anderszins iets in de de omgeving wijzigt. De voortgang en wijzigingen in de Basisset worden beheerd m.b.v. Portfolio Management, waarbij de belangen van stakeholders (met name deelnemende gemeenten) centraal staan. Versiebeheer en uitrol worden m.b.v. Release Management beheerd.

Op termijn verschuift de selectie op basis van behoeften van gemeenten naar een meer formele criteria-gedreven selectie. Dat betekent dat componenten in een later stadium niet alleen op basis van vroege adoptie worden opgenomen, maar vooral op basis van geformaliseerde *opnamecriteria*.

# Opnamecriteria
Voor opname in de Basisset moeten componenten niet alleen een functionele behoefte van gemeenten invullen, maar ook voldoen een een aantal niet-functionele criteria die onderverdeeld zijn in een aantal categorieën.

Om subjectiviteit te voorkomen moeten deze criteria zoveel mogelijk mechanisch kunnen worden getoetst: denk bijvoorbeeld aan het herkennen van documentatie en changelogbestanden, het detecteren en analyseren van broncodebestanden, het analyseren van testconfiguratie en het meten van complexe codepaden.

Automatische detectie maakt het mogelijk om snel te bepalen of een component voldoende basiskwaliteit heeft, zonder dat elke beoordeling volledig handmatig hoeft te worden uitgevoerd.

Niet alle criteria kunnen automatisch worden getoetst, handmatige analyse blijft nodig voor een aantal criteria.

## Governance
De Governance-categorie richt zich op de organisatorische en juridische randvoorwaarden die nodig zijn om een component veilig en betrouwbaar in een collectieve voorziening op te nemen. Dit betekent o.a. dat een component een open source licentie moet hebben die voldoet aan de OSI-criteria, zodat hergebruik door gemeenten mogelijk is. Daarnaast moet eigenaarschap en beheer expliciet zijn vastgelegd: wie is verantwoordelijk voor onderhoud, wie accepteert wijzigingen, en hoe worden bijdragen van derden behandeld. Een helder governance- en bijdrageproces voorkomt onduidelijkheid bij de samenwerking en ondersteunt transparante besluitvorming.

Tot slot hoort bij governance ook een duidelijke security-policy en verantwoordelijkheidsketen, zodat signalen over kwetsbaarheden, risico’s en operationele incidenten eenduidig kunnen worden opgevolgd.

## Architectuur
De Architectuur-categorie bouwt voort op de Common Ground architectuurprincipes en de vijflaagarchitectuur. Componenten moeten ontwerpkeuzes laten zien die aansluiten bij deze principes: een duidelijke scheiding van verantwoordelijkheden, herbruikbaarheid, interoperabiliteit en eenvoudige vervangbaarheid. Dat betekent dat er concrete integratiecontracten nodig zijn, zoals API-specificaties, en dat de component past binnen de laagstructuur van Common Ground. Deze aanpak helpt om technische koppelingen te vermijden die later onderhoud, schaalbaarheid of integratie met andere componenten bemoeilijken.

## Softwarekwaliteit
De Softwarekwaliteit-categorie beoordeelt of een component op structurele en onderhoudbare wijze is opgebouwd. Dit omvat aantoonbare broncodekwaliteit, actuele documentatie, een changelog of release notes, een beschrijving van *test coverage*, inzicht in *cyclomatic complexity* en een beheersbare codebasis. 

## Security
De Security-categorie toetst of een component voldoet aan de relevante gemeentelijke en Europese compliancekaders, zoals NIS2 en de Baseline Informatiebeveiliging Overheid (BIO). Dit betekent dat een component niet alleen technisch veilig moet zijn, maar ook binnen de organisatorische en procesmatige normen voor het publieke domein moet passen.

Essentieel is het *shift-left* principe: beveiliging en risicobeheersing moeten zo vroeg mogelijk in de ontwikkelketen worden geadresseerd. Dit omvat bijvoorbeeld het toepassen van OWASP-richtlijnen, het analyseren van broncode op veelvoorkomende kwetsbaarheden, en het voorkomen van credentials in code of configuratiebestanden. Daarmee worden risico’s tijdig herkend en kan een component al in de ontwikkelfase aan de juiste beveiligingscriteria voldoen.

Daarnaast moet er duidelijkheid zijn over kwetsbaarheidsmanagement: hoe worden beveiligingslekken ontdekt, gerapporteerd en opgelost, welke dependency security-praktijken zijn aanwezig en welke maatregelen zijn genomen tegen risico’s zoals onveilige authenticatie, onvoldoende autorisatie en onveilige communicatie. Security is daarmee maar een randvoorwaarde voor opname in de Basisset.

## DevOps
Binnen Common Ground wordt ervan uitgegaan dat componenten als Docker containers beschikbaar zijn en kunnen worden uitgerold op een Haven-compliant infrastructuur. Hiervoor moeten, naast de container images zelf, ook Helm-charts beschikbaar zijn voor de uitrol.

Een DevOps-geschikte component heeft een deploymentmodel conform Haven/Haven+. Daarbij gaat het ook om beheerbaarheid: duidelijke deploymentdocumentatie, configuratie-informatie, monitoring- en loggingmogelijkheden en een duidelijke release- en rollbackstrategie.

Als een component geschikt is voor DevOps, kan het sneller, veiliger en met minder handmatige inzet in de gezamenlijke voorziening worden opgenomen. Dit voorkomt dat alleen functionele geschiktheid leidt tot opname, zonder voldoende aandacht voor beheersbaarheid, continuïteit en operationele stabiliteit.

# Automatische beoordeling van componenten
Automatische beoordeling van componenten is efficiënt omdat het herhaalde controles over veel repositories kan schalen en eventuele subjectiviteit uit de de beoordeling haalt. Door structurele kenmerken zoals bestandsnamen, licenties, documentatie, API-specificaties en container-artefacten automatisch te herkennen, ontstaat een objectief startpunt voor de beoordeling. Dit versnelt de doorlooptijd en maakt het eenvoudiger om componenten te vergelijken en selecteren.

In deze aanpak worden automatisch af te leiden kenmerken en metrieken gecombineerd met de opbouw van de repository: de repositorystructuur wordt geanalyseerd, specifieke bestanden en metadata worden herkend, en waar nodig worden externe tools ingezet voor diepere analyses. Voor softwarekwaliteit kan dit bijvoorbeeld betekenen dat de complexiteit van de code wordt geanalyseerd of dat de aanwezigheid van een changelog wordt gecontroleerd. Voor security betekent het dat OWASP-gerelateerde patronen, credentials in code en bekende configuratierisico’s automatisch worden doorzocht. Voor DevOps betekent het dat deploymentinformatie en container/Helm-artefacten worden gevalideerd.

Tenslotte, als de beoordeling van componenten grotendeels automatisch is, kan het ook onderdeel worden gemaakt van de CI/CD pipelines van leveranciers. Op deze manier voldoen componenten al vanaf de ontwikkeling aan de opnamecriteria.


# Bronnen

1. Common Ground (NL): https://commonground.nl/
2. Common Ground 5-laags model: https://www.gemmaonline.nl/wiki/Common_Ground_vijflaagsmodel_opbouw_en_gebruik
3. Haven: https://haven.commonground.nl/
4. Haven+: https://gitlab.com/commonground/haven/havenplus
5. OSI-approved licenses: https://opensource.org/licenses
5. NIS2 (EU): https://cybersecurity-centre.europa.eu/document/download/c3ba7706-2ded-4959-b98e-77c1a63204e0_en?filename=Understanding%20the%20new%20NIS2%20Directive%20cybersecurity%20requirements%20and%20their%20practical%20applications%20for%20the%20EU%20space%20sector.pdf
6. BIO (Baseline Informatiebeveiliging Overheid): https://www.logius.nl/diensten/informatiebeveiliging/baseline-informatiebeveiliging-overheid
7. OWASP Secure Coding Practices: https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/stable-en/02-checklist/05-checklist
8. OpenAPI Specification: https://spec.openapis.org/oas/latest.html
9. Docker Docs: https://docs.docker.com/
10. Helm Docs: https://helm.sh/docs/

# Bijlage met opnamecriteria
## Governance

| Criterium | Automatisch te checken | Beschrijving | Verwijzing naar achtergrondinformatie |
|-----------|-----------------------|--------------|--------------------------------------|
| **Open source-licentie** | ja | De repository bevat een LICENSE-bestand met een door OSI goedgekeurde licentie | [opensource.org/licenses](https://opensource.org/licenses) |
| **EUPL-licentie** | ja | De repository valt onder de EUPL | [EUPL](https://interoperable-europe.ec.europa.eu/collection/eupl/eupl-text-eupl-12) |
| **Intellectueel Eigendom (IP)** | ja | De eigenaar of auteursrechthebbende is afgeleid uit juridische bestanden en metadata | [opensource.guide/legal](https://opensource.guide/legal/) |
| **publiccode.yml** | ja | De repository bevat een publiccode.yml in de root met relevante overheidsmetadata | [Standard for Public Code](https://standard.publiccode.net) |
| **Contributing-handleiding** | ja | Er is een CONTRIBUTING-bestand aanwezig dat beschrijft hoe bijdragen kunnen worden gedaan | [GitHub docs](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/setting-guidelines-for-repository-contributors) |
| **Gedragscode** | ja | De repository bevat een CODE_OF_CONDUCT-bestand om gedragsregels vast te leggen | [opensource.guide](https://opensource.guide/code-of-conduct/) |

## Architectuur

| Criterium | Automatisch te checken | Beschrijving | Verwijzing naar achtergrondinformatie |
|-----------|-----------------------|--------------|--------------------------------------|
| **Vijflagenmodel** | nee | De component is in te delen in één van de vijf lagen van vijflagenmodel van Common Ground dan wel bestaat de component zelf uit onderdelen die te verdelen zijn over de vijf lagen. | [5-lagen model](https://commonground.nl/cms/view/54476261/5-lagen-model) |
| **OpenAPI-specificatie** | ja | API's die extern worden ontsloten door de component zijn gespecificeerd met Open API Specification (OAS) | [Open API Specification](https://spec.openapis.org/oas/latest.html) |
| **NL API Design Rules (ADR) validatie** | ja | De API-specificatie(s) voldoen aan de NL API Design Rules | [NL API Design Rules](https://developer.overheid.nl/kennisbank/api-ontwikkeling/standaarden/api-design-rules/) |

## Beveiliging

| Criterium | Automatisch te checken | Beschrijving | Verwijzing naar achtergrondinformatie |
|-----------|-----------------------|--------------|--------------------------------------|
| **Securitybeleid** | ja | De repository bevat een SECURITY-bestand met verantwoordingsinformatie en een meldprocedure voor kwetsbaarheden | [GitHub docs](https://docs.github.com/en/code-security/getting-started/adding-a-security-policy-to-your-repository) |
| **OWASP Secure Coding** | ja | De code en configuratie voldoen aan OWASP secure coding-principes en worden gecontroleerd op veelvoorkomende onveilige patronen | [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices/) |

## Deployment & Operations

| Criterium | Automatisch te checken | Beschrijving | Verwijzing naar achtergrondinformatie |
|-----------|-----------------------|--------------|--------------------------------------|
| **Docker-ondersteuning** | ja | De repository bevat een Dockerfile en eventueel docker-compose voor containerisatie | [Docker](https://docs.docker.com) |
| **Beschikbaarheid Docker-image** | ja | Er is een gepubliceerde image met een bruikbaar Docker-image beschikbaar, bijv. op Docker Hub | [Docker](https://docs.docker.com) |
| **CI/CD-configuratie** | ja | De repository bevat een workflow of pipelineconfiguratie voor geautomatiseerde controles, builds en deploys | [CI/CD](https://www.redhat.com/en/topics/devops/what-is-ci-cd) |
| **Helm-chart** | ja | De repository bevat een Helm Chart of Kubernetes-manifesten voor deployment | [Helm](https://helm.sh/docs) |

## Softwarekwaliteit

| Criterium | Automatisch te checken | Beschrijving | Verwijzing naar achtergrondinformatie |
|-----------|-----------------------|--------------|--------------------------------------|
| **Aanwezigheid van broncode** | ja | De repository bevat echte broncodebestanden en niet alleen documentatie- of configuratiebestanden | - |
| **SBOM** | ja | De repository publiceert een Software Bill of Materials in SPDX- of CycloneDX-formaat | [CISA SBOM](https://www.cisa.gov/sbom) |
| **Documentatie** | ja | De repository bevat een README, een docs-map of een link naar externe documentatie | [irealisatie.nl](https://www.irealisatie.nl/kennis/common-ground) |
| **Changelog** | ja | De repository bevat een changelog of release notes met de wijzigingsgeschiedenis | [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) |
| **Testsuite** | ja | De repository bevat geautomatiseerde tests of testconfiguratie | [CI/CD](https://www.redhat.com/en/topics/devops/what-is-ci-cd) |
| **Code coverage > 80%** | ja | Er is een coverage-rapport of badge met ten minste 80% lijncoverage beschikbaar | [CI/CD](https://www.redhat.com/en/topics/devops/what-is-ci-cd) |
| **Cyclomatische complexiteit** | ja | De gemiddelde en maximum cyclomatische complexiteit wordt gemeten en vergeleken met configureerbare drempels | [Cyclomatic complexity](https://en.wikipedia.org/wiki/Cyclomatic_complexity) |
| **Semantic versioning** | ja | Releases of tags volgen het MAJOR.MINOR.PATCH-patroon | [semver.org](https://semver.org/) |

# Bijlage Berekeningswijze score

De score voor opname in de Basisset wordt berekend op basis van de verzamelde criteria in de vier hoofdgebieden: Governance, Architectuur, Beveiliging, Deployment & Operations en Softwarekwaliteit.

## Scoremodel

1. Gewicht per categorie
   - Governance: 20%
   - Architectuur: 20%
   - Beveiliging: 25%
   - Deployment & Operations: 20%
   - Softwarekwaliteit: 15%

2. Criteriumscore
   - Elk criterium wordt beoordeeld met een waarde tussen 0 en 1:
     - 0 = niet voldaan aan het criterium
     - 0,5 = gedeeltelijk voldaan aan het criterium
     - 1 = voldoet aan het criterium

3. Categorieberekening
   - Voor een categorie met n criteria wordt de categorie-score als volgt berekend:

     `Score_categorie_i = Σ_j(Score_ij × Gewicht_ij) / Max_score_categorie_i`

     waarbij:
     - `Score_ij` de score van criterium j uit categorie i is (waarde tussen 0 en 1),
     - `Gewicht_ij` het gewicht van criterium i binnen de categorie j is (waarde tussen 0 en 1).
     - `Max_score_categorie_i = Σ_j Gewicht_ij ` de maximum score voor categorie i

`Score_categorie_i` is dus een waarde tussen 0 en 1.

4. Totale score
   - De totaalscore is de gewogen som van de categorie-scores:

     `Score_totaal = Σ_i(Score_categorie_i × Gewicht_categorie_i) / Σ_i(Max_score_categorie_i)`

     waarbij:
     - `Score_categorie_i` de score van categorie i is (waarde tussen 0 en 1),
     - `Gewicht_categorie_i` het gewicht van categorie i is (waarde tussen 0 en 1).

`Score_totaal` is dus ook een waarde tussen 0 en 1.

   - Voorbeeldberekening:
     - Governance: 0,8 × 0,20 = 0,16
     - Architectuur: 0,7 × 0,20 = 0,14
     - Beveiliging: 0,9 × 0,25 = 0,225
     - Deployment & Operations: 0,75 × 0,20 = 0,15
     - Softwarekwaliteit: 0,85 × 0,15 = 0,1275
     - Totale score = 0,8075 (80,75%)

## Schaal en drempels

- \> 90% = Zeer geschikt voor opname
- 75% – 90% = Geschikt, maar met aandachtspunten
- 60% – 75% = Voorwaardelijk geschikt; verbeteringen nodig
- < 60% = Niet geschikt voor opname

## Automatische beoordeling versus handmatige controle

- Automatisch te controleren criteria kunnen direct in de score meewegen.
- Niet-automatisch te controleren criteria krijgen een voorlopig label en worden later door een handmatige toetsing aangevuld.
- Voor criteria die niet volledig automatisch te checken zijn, wordt een tweede beoordeling uitgevoerd op basis van handmatige review en eventueel extra documentatie.

## Rapportage en toelichting

- Elk criteriumresultaat moet worden vastgelegd met één van de volgende statussen:
  - Voldoet
  - Gedeeltelijk voldoet
  - Voldoet niet
- Bij een gedeeltelijke score moet een korte toelichting worden toegevoegd, zodat een concrete verbetering zichtbaar is.
- De eindscore wordt gepresenteerd met een overzicht van sterkten en zwakten per categorie.

## Toepassing in CI/CD

- De scoreberekening kan als basis worden opgenomen in geautomatiseerde evaluaties binnen een CI/CD-pipeline.
- Bij veranderingen in de repository wordt de score opnieuw berekend om regressies te signaleren en verbeteringen te valideren.
- Dit maakt het mogelijk om een continue feedbackloop te creëren tussen ontwikkelaars, beheer en de governance-organisatie.

## Versiebeheer van opnamecriteria

- De wegingen en criteria blijven flexibel en worden periodiek herzien door de Common Ground community en deelnemende gemeenten.
- Wijzigingen in het scoremodel worden gedocumenteerd met datum, motivaties en impactanalyses.
- Op deze manier blijft de selectie van de Basisset adaptief en in lijn met nieuwe inzichten en operationele ervaring.
