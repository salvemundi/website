# Molproef — product

## Wat het is
Offline testsoftware voor een kampspel in het "mol"-format: 40 kandidaten, 8 proeven en een finale. Na elke proef maakt iedere kandidaat een test over de twee mollen. De laagste scores vallen af.

## Gebruikers en scène
- **Spelleiding** (1–3 mensen): bereidt tests voor, vult de juiste antwoorden in, bepaalt de uitslag. Werkt op een laptop, vaak 's avonds in een donkere kampzaal.
- **Kandidaten** (40, tieners/jongvolwassenen): maken om de beurt een test op dezelfde laptop. Ze mogen niets van de antwoorden of andermans scores zien.
- **Publiek** (alle kandidaten): kijkt mee bij de onthulling (groen/rood scherm), soms via een beamer.

## Beslissingen (interview 2026-11-05)
- Eén laptop, om de beurt. Geen server, geen internet nodig. Opslag lokaal in de browser, met back-up als bestand.
- Aantal afvallers is per test instelbaar (standaard 4: 40 → 8 finalisten).
- Sfeer: donker en spannend, goed leesbaar op een beamer.

## Update (2026-11-05)
- Kleine Python-server (geen Docker). Gescheiden pagina's: /beheer (spelleiding, pincode) en /invul (kandidaten, elk apparaat via wifi).
- De server is de bron van waarheid: ingeleverde tests en starttijden zijn van de server, de beheerpagina kan ze niet overschrijven. De tijd wordt op de server gemeten.
- Beheer is opgebouwd rond "volgende stap" en vier stappen per test: vragen → afnemen → uitslag → onthulling.

## Kernregels
- De mollen vallen nooit af; kandidaten met een vrijstelling ook niet.
- Score = goede antwoorden + jokers. Bij gelijke score valt de langzaamste af.
- Spelleider-schermen zitten achter een wachtwoord (minimaal 12 tekens, letters en cijfers).

## Update (2026-11-13): twee mollen
- Er zijn twee mollen. Elke mol vult via een eigen geheime link de test over zichzelf in; die antwoorden zijn de juiste antwoorden (geen mol-profiel of handmatig aanklikken meer).
- Kandidaten beantwoorden elke vraag voor Mol A en Mol B. Per test telt de koppeling A/B aan mol 1/2 die de kandidaat de meeste punten geeft.
- Score = per vraag 1 punt per goed beantwoorde mol + 1 punt per goed geraden mol bij "Wie zijn de mollen?" + jokers.

## Toon
Nederlands, kort, spannend maar duidelijk. Knoppen benoemen de actie.
