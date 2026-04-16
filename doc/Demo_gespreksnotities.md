# Aanleiding

1. Bij de samenstelling van de basisset kijken we vooral naar behoefte van de koplopers en niet of nauwelijks naar criteria. 
2. Tegelijkertijd zien we dat bij de ontwikkeling van de componenten weinig aandacht besteed is aan zgn. nonfunctionals. 
3. Als we een VCG opzetten op basis van deze componenten moeten we weten wat voor vlees we in de kuip hebben, d.w.z. wat de kwaliteit is. We moeten componenten toetsen.

Ik denk dat de meeste criteria automatisch kunnen worden getoetst. Entree mijn idee voor een component checker die iedereen zelf kan gebruiken om componenten te toetsen. Dat helpt zowel gemeenten als leveranciers bij inzicht in kwaliteit en herbruikbaarheid.

# Disclaimer

Criteria zijn niet normatief/representatief.
False positives/negatives mogelijk door de rudiemntaire implementatie van de checks.
Resultaten zijn indicatief, dit is geen officiële toets.

# Criteria (in app)

Overzicht per categorie (Governance, Security, etc.).
Korte uitleg en status per criterium.
Tooltips en code metrics bij “Actual Source Code”.

# Demo repositories

1. Analyse
Voer publiek GitHub-repo in.
Laat analyse en resultaten per criterium zien.
Toon verschil tussen goed scorende en repo met waarschuwingen/fouten.

2. Admin
Admin pagina voor het configureren van de weging

3. Historie
Historie van analyses

# Vooruitblik

Checker als zelfscan beschikbaar maken, en ook als onderdeel van de CI zodat
iedereen zijn componenten zelf kan toetsen en verbeteren.

Bepalen welke criteria we belangrijk vinden.
