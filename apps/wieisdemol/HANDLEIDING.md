# Molproef: handleiding

Molproef is een kleine Python-server met twee pagina's:

| Pagina | Voor wie | Adres |
|---|---|---|
| **Beheer** | Spelleiding (met wachtwoord) | `http://<laptop>:8080/beheer` |
| **Invullen** | Kandidaten, op elk apparaat | `http://<laptop>:8080/invul` |

Alle gegevens staan centraal op de server (in `app/data/`). De invulpagina krijgt nooit de juiste antwoorden of de namen van de mollen te zien.

Iedereen krijgt **één persoonlijke link** (`/invul?code=...`), te vinden bij **Kandidaten** (kopieerknop per persoon). Met die link vult iemand alle tests in; zelf een naam kiezen kan niet. Stuur iedereen één keer de eigen link, bijvoorbeeld in een privébericht. Is een link bij de verkeerde persoon beland, maak dan een nieuwe; de oude werkt dan niet meer.

Er zijn **twee mollen**. Zij gebruiken dezelfde soort persoonlijke link. Opent een mol die link, dan vult die automatisch de test over zichzelf in; die antwoorden zijn de juiste antwoorden. Kandidaten beantwoorden elke vraag voor *Mol A* en *Mol B*. Ze weten niet wie wie is, dus bij het nakijken telt per test de koppeling (A = mol 1 of A = mol 2) die de kandidaat de meeste punten geeft. Per vraag is er één punt per mol; bij de slotvraag *Wie zijn de mollen?* kiest de kandidaat twee namen en krijgt één punt per goed geraden mol.

## Starten
Met Python 3.10 of nieuwer, in deze map:

```
python app/server.py
```

Stoppen doe je met Ctrl+C. De gegevens blijven bewaard.

**Andere apparaten** (telefoons, tablets, een tweede laptop) moeten op hetzelfde wifi-netwerk zitten en het IP-adres van de laptop gebruiken, bijvoorbeeld `http://192.168.1.20:8080/invul`. Het IP-adres vind je met `ipconfig` (IPv4-adres). Start de server met `MOLPROEF_URL` ingesteld (in PowerShell: `$env:MOLPROEF_URL="http://192.168.1.20:8080"; python app/server.py`), dan toont de beheerpagina het juiste adres om te delen. Staat Windows Firewall in de weg, sta poort 8080 dan toe.

## Vooraf
1. Open **/beheer** en maak het spel aan: kampnaam en wachtwoord (minimaal 12 tekens, met letters en cijfers).
2. **Kandidaten**: plak de 40 namen (één per regel) en kies *Vervang de lijst*. Stuur daarna iedereen de eigen link (kopieerknop).
3. **De mollen**: kies Mol 1 en Mol 2. Zij krijgen gewoon hun eigen persoonlijke link. Alles blijft verborgen tot je op *Toon* klikt.

Op **Overzicht** zie je altijd wat de volgende stap is.

## Per test: vier stappen
Elke test heeft bovenaan vier stappen.

1. **Vragen en antwoorden**: controleer de vragen. Vragen kun je bewerken (potlood), verwijderen of toevoegen, het liefst voordat de mollen invullen. Hier zie je ook wat de mollen hebben geantwoord.
2. **Afnemen**: *Test openzetten*. Kandidaten openen hun persoonlijke link en maken de test. De mollen doen hetzelfde en vullen zo de juiste antwoorden in. Je ziet live wie klaar is, wie bezig is en of beide mollen hebben ingevuld. Daarna kies je *Test sluiten*.
3. **Uitslag**: geef eventueel jokers (+1 punt) of vrijstellingen en kies *Uitslag vastzetten*. De laagste scores vallen af, en bij een gelijke score de langzaamste. De mollen vallen nooit af. De uitslag kan pas vast als beide mollen hebben ingevuld; is een mol vergeten, zet de test dan opnieuw open.
4. **Onthulling**: zet het scherm op de beamer. Kandidaten klikken op hun naam: groen is door, rood is af. Het scherm sluiten kan alleen met het wachtwoord.

Na 8 tests met 4 afvallers zijn er 8 finalisten (de twee mollen tellen mee). In de finale maak je eerst de winnaar bekend en ontmasker je daarna de mollen.

## Back-up
Kies na elke test **Instellingen en back-up → Downloaden** en zet het bestand op een USB-stick. Met *Back-up terugzetten* zet je het spel terug, ook op een andere laptop.

## Aanpassen
- Standaardvragen en proeven voor een nieuw spel: `app/static/assets/standaard.json`
- Server: `app/server.py` (alleen de Python-standaardbibliotheek)
- Pagina's: `app/static/` (`beheer.html`, `invul.html`, `assets/`)

Na een wijziging: herstart de server.
