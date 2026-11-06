# Molproef: handleiding

Molproef is een kleine Python-server met twee pagina's:

| Pagina | Voor wie | Adres |
|---|---|---|
| **Beheer** | Spelleiding (met pincode) | `http://<laptop>:8080/beheer` |
| **Invullen** | Kandidaten, op elk apparaat | `http://<laptop>:8080/invul` |

Alle gegevens staan centraal op de server (in `app/data/`). De invulpagina krijgt nooit de juiste antwoorden of de naam van de mol te zien.

## Starten
Met Python 3.10 of nieuwer, in deze map:

```
python app/server.py
```

Stoppen doe je met Ctrl+C. De gegevens blijven bewaard.

**Andere apparaten** (telefoons, tablets, een tweede laptop) moeten op hetzelfde wifi-netwerk zitten en het IP-adres van de laptop gebruiken, bijvoorbeeld `http://192.168.1.20:8080/invul`. Het IP-adres vind je met `ipconfig` (IPv4-adres). Start de server met `MOLPROEF_URL` ingesteld (in PowerShell: `$env:MOLPROEF_URL="http://192.168.1.20:8080"; python app/server.py`), dan toont de beheerpagina het juiste adres om te delen. Staat Windows Firewall in de weg, sta poort 8080 dan toe.

## Vooraf
1. Open **/beheer** en maak het spel aan: kampnaam en pincode.
2. **Kandidaten**: plak de 40 namen (één per regel) en kies *Vervang de lijst*.
3. **De mol**: kies de mol en klik in het mol-profiel de juiste kenmerken aan. Alles blijft verborgen tot je op *Toon* klikt.

Op **Overzicht** zie je altijd wat de volgende stap is.

## Per test: vier stappen
Elke test heeft bovenaan vier stappen.

1. **Vragen en antwoorden**: klik bij elke proefvraag op het juiste antwoord. Vragen kun je bewerken (potlood), verwijderen of toevoegen.
2. **Afnemen**: *Test openzetten*. Kandidaten openen /invul, kiezen hun naam en maken de test. Je ziet live wie klaar is en wie bezig is. Daarna kies je *Test sluiten*.
3. **Uitslag**: geef eventueel jokers (+1 punt) of vrijstellingen en kies *Uitslag vastzetten*. De laagste scores vallen af, en bij een gelijke score de langzaamste. De mol valt nooit af.
4. **Onthulling**: zet het scherm op de beamer. Kandidaten klikken op hun naam: groen is door, rood is af. Het scherm sluiten kan alleen met de pincode.

Na 8 tests met 4 afvallers zijn er 8 finalisten (de mol telt mee). In de finale maak je eerst de winnaar bekend en ontmasker je daarna de mol.

## Back-up
Kies na elke test **Instellingen en back-up → Downloaden** en zet het bestand op een USB-stick. Met *Back-up terugzetten* zet je het spel terug, ook op een andere laptop.

## Aanpassen
- Standaardvragen en proeven voor een nieuw spel: `app/static/assets/standaard.json`
- Server: `app/server.py` (alleen de Python-standaardbibliotheek)
- Pagina's: `app/static/` (`beheer.html`, `invul.html`, `assets/`)

Na een wijziging: herstart de server.
