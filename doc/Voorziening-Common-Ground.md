# Voorziening Common Ground

# Inleiding
Voorziening Common Ground (VCG) is een SaaS-voorziening die gemeentelijke digitale diensten ondersteunt met herbruikbare componenten. Deze componenten zijn open source en worden gezamenlijk ontwikkeld en beheerd door communities van gemeenten.

De VCG volgt de vijflaagarchitectuur van Common Ground en start met componenten uit lagen 1, 2 en 3. In een volgende fase worden ook componenten uit lagen 4 en 5 toegevoegd om de omvang en de functionaliteit geleidelijk te vergroten.

De hosting en deployment van de voorziening zijn gerealiseerd met Haven en Haven+ als uitgangspunt, zodat de oplossing zo veel mogelijk cloudonafhankelijk, schaalbaar en compatibel blijft met gemeenschappelijke overheidsplatformen.

# Componenten voor de voorziening
In een eerste fase wordt de selectie van componenten bepaald door de behoefte van koplopergemeenten: gemeenten die vooroplopen in de Common Ground beweging en ervaring hebben met de eerste inrichting van de voorziening. Deze groep helpt de startselectie samen te stellen, die we de Basisset noemen.

De Basisset is een dynamische collectie componenten, en niet statisch. Componenten kunnen worden toegevoegd, verwijderd of vervangen naar gelang de behoefte verandert, standaarden wijzigen of anderszins iets in de de omgeving wijzigt. De voortgang en wijzigingen in de Basisset worden beheerd m.b.v. Portfolio Management, waarbij de belangen van stakeholders (met name deelnemende gemeenten) centraal staan. Versiebeheer en uitrol worden m.b.v. Release Management beheerd.

Op termijn verschuift de selectie op basis van behoeften van gemeenten naar een meer formele criteria-gedreven selectie. Dat betekent dat componenten in een later stadium niet alleen op basis van vroege adoptie worden opgenomen, maar vooral op basis van geformaliseerde opnamecriteria en governance.

# Opnamecriteria
Voor opname in de Basisset moeten componenten naast functionele relevantie voldoen een een aantal criteria die onderverdeeld zijn in de volgende categorieen.

## Governance
De Governance-categorie richt zich op de organisatorische en juridische randvoorwaarden die nodig zijn om een component veilig en betrouwbaar in een gedeelde voorziening op te nemen. Dit betekent dat een component een open source licentie moet hebben die voldoet aan de OSI-criteria, zodat hergebruik door gemeenten juridisch helder is. Daarnaast moet eigenaarschap en beheer expliciet zijn vastgelegd: wie is verantwoordelijk voor onderhoud, wie accepteert wijzigingen, en hoe worden bijdragen van derden behandeld. Een helder governance- en bijdrageproces voorkomt onduidelijkheid bij samenwerkingsvormen en ondersteunt transparante besluitvorming.

Tot slot hoort bij governance ook een duidelijke security-policy en verantwoordelijkheidsketen, zodat signalen over kwetsbaarheden, risico’s en operationele incidenten eenduidig kunnen worden opgevolgd.

## Architectuur
De Architectuur-categorie bouwt voort op de Common Ground architectuurprincipes en de vijflaagarchitectuur. Componenten moeten ontwerpkeuzes laten zien die aansluiten bij deze principes: een duidelijke scheiding van verantwoordelijkheden, herbruikbaarheid, interoperabiliteit en eenvoudige vervangbaarheid. Dat betekent dat er concrete integratiecontracten nodig zijn, zoals API-specificaties, en dat de component past binnen de laagstructuur van Common Ground. Deze aanpak helpt om technische koppelingen te vermijden die later onderhoud, schaalbaarheid of integratie met andere componenten bemoeilijken.

## Softwarekwaliteit
De Softwarekwaliteit-categorie beoordeelt of een component op structurele en onderhoudbare wijze is opgebouwd. Dit omvat aantoonbare broncodekwaliteit, actuele documentatie, een changelog of release notes, een beschrijving van testdekking, inzicht in cyclomatic complexity en een beheersbare codebasis. Waar mogelijk moeten deze kenmerken automatisch kunnen worden vastgesteld met tooling: bijvoorbeeld het detecteren van broncodebestanden, het herkennen van documentatie en changelogbestanden, het analyseren van testconfiguratie en het meten van complexe codepaden.

Automatische detectie maakt het mogelijk om snel te bepalen of een component voldoende basiskwaliteit heeft, zonder dat elke beoordeling volledig handmatig hoeft te worden uitgevoerd. Het helpt om objectieve signalen te verzamelen over onderhoudbaarheid, testdiscipline en architecturale gezondheid voordat een component onderdeel wordt van de Basisset.

## Security
De Security-categorie toetst of een component voldoet aan de relevante gemeentelijke en Europese compliancekaders, zoals NIS2 en de Baseline Informatiebeveiliging Overheid (BIO). Dit betekent dat een component niet alleen technisch veilig moet zijn, maar ook binnen de organisatorische en procesmatige normen voor het publieke domein moet passen.

Essentieel is het shift-left principe: beveiliging en risicobeheersing moeten zo vroeg mogelijk in de ontwikkelketen worden geadresseerd. Dit omvat bijvoorbeeld het toepassen van OWASP-richtlijnen, het analyseren van broncode op veelvoorkomende kwetsbaarheden, en het voorkomen van credentials in code of configuratiebestanden. Daarmee worden risico’s tijdig herkend en kan een component al in de ontwikkelfase aan de juiste beveiligingscriteria voldoen.

Daarnaast moet er duidelijkheid zijn over kwetsbaarheidsmanagement: hoe worden beveiligingslekken ontdekt, gerapporteerd en opgelost, welke dependency security-praktijken zijn aanwezig en welke maatregelen zijn genomen tegen risico’s zoals onveilige authenticatie, onvoldoende autorisatie en onveilige communicatie. Security is daarmee maar een randvoorwaarde voor opname in de Basisset.

## DevOps
Binnen Common Ground wordt ervan uitgegaan dat componenten als Docker containers beschikbaar zijn en kunnen worden uitgerold op een Haven-compliant infrastructuur. Hiervoor moeten, naast de container images zelf, ook Helm charts beschikbaar zijn voor de uitrol.

Een DevOps-geschikte component heeft een deploymentmodel dat past bij Haven/Haven+ en gemeenschappelijke gemeentelijke platformen, en is zodanig ingericht dat installatie, update en rollback beheersbaar blijven. Daarbij gaat het ook om beheerbaarheid: duidelijke deploymentdocumentatie, configuratie-informatie, monitoring- en loggingmogelijkheden en een duidelijke release- en rollbackstrategie.

Als een component DevOps-mature is, kan het sneller, veiliger en met minder handmatige inzet in de gezamenlijke voorziening worden opgenomen. Dit voorkomt dat alleen functionele geschiktheid leidt tot opname, zonder voldoende aandacht voor beheersbaarheid, continuïteit en operationele stabiliteit.

Een component moet dus niet alleen de vraag van gemeenten bedienen, maar moet ook aantoonbaar betrouwbaar, veilig, interoperabel en beheerbaar zijn in een gedeelde gemeentelijke voorziening. Deze criteria moeten voorkomen dat alleen op basis van populariteit of functionaliteit wordt gekozen zonder voldoende oog voor duurzame exploitatie.

# Automatische beoordeling van componenten
Automatische beoordeling van componenten is efficiënt omdat het herhaalde controles over veel repositories kan schalen en omdat het menselijke bias uit de de beoordeling haalt. Door structurele kenmerken zoals bestandsnamen, licenties, documentatie, API-specificaties en container-artefacten automatisch te herkennen, ontstaat een objectief startpunt voor de beoordeling. Dit versnelt de doorlooptijd en maakt het eenvoudiger om componenten te vergelijken en selecteren.

In deze aanpak worden automatisch af te leiden kenmerken en metrieken gecombineerd met de opbouw van de repository: de repositorystructuur wordt geanalyseerd, specifieke bestanden en metadata worden herkend, en waar nodig worden externe tools ingezet voor diepere analyses. Voor softwarekwaliteit kan dit bijvoorbeeld betekenen dat de complexiteit van de code wordt geanalyseerd of dat de aanwezigheid van een changelog wordt gecontroleerd. Voor security betekent het dat OWASP-gerelateerde patronen, credentials in code en bekende configuratierisico’s automatisch worden doorzocht. Voor DevOps betekent het dat deploymentinformatie en container/Helm-artefacten worden gevalideerd.

Het doel is niet om handmatige beoordeling te vervangen, maar om deze te versterken. Voor bepaalde kenmerken blijft handmatige controle of analyse nodig.

# Bronnen

1. Common Ground (NL): https://commonground.nl/
2. Common Ground 5-laags model: https://commonground.nl/news/view/a777d99c-53be-4988-a3f4-8522ac3603ad/common-ground-in-beeld-wat-is-het-vijflagenmodel
3. Haven: https://haven.commonground.nl/
4. Haven+: https://gitlab.com/commonground/haven/havenplus
5. OSI-approved licenses: https://opensource.org/licenses
5. NIS2 (EU): https://commission.europa.eu/law/law-topic/data-protection/eu-data-protection-rules_en
6. BIO (Baseline Informatiebeveiliging Overheid): https://www.logius.nl/diensten/informatiebeveiliging/baseline-informatiebeveiliging-overheid
7. OWASP Secure Coding Practices: https://owasp.org/www-project-secure-coding-practices/
8. OpenAPI Specification: https://spec.openapis.org/oas/latest.html
9. Docker Docs: https://docs.docker.com/
10. Helm Docs: https://helm.sh/docs/
