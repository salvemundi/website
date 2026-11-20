// Scraped from salvemundi.nl on 2026-11-20. Image ids are the live Directus asset ids,
// the seed imports them from https://salvemundi.nl/api/assets/<id> with the same id.
// People (members, boards, safe havens) are fictional and have no photo, real members shouldn't end up in git.
// Everything under "Verzonnen" was not publicly reachable (404 or behind login) and is made up.

export const SOURCE_ASSET_URL = 'https://salvemundi.nl/api/assets';

export const people = [
    { name: 'Anouk de Bakker', avatar: null },
    { name: 'Bas Mulder', avatar: null },
    { name: 'Daan Dekker', avatar: null },
    { name: 'Eva van der Linden', avatar: null },
    { name: 'Femke van den Broek', avatar: null },
    { name: 'Floor Postma', avatar: null },
    { name: 'Guus Kramer', avatar: null },
    { name: 'Hidde Timmermans', avatar: null },
    { name: 'Ilse van Vliet', avatar: null },
    { name: 'Jesse Martens', avatar: null },
    { name: 'Julia Wijnen', avatar: null },
    { name: 'Kees Meijer', avatar: null },
    { name: 'Lotte Hendriks', avatar: null },
    { name: 'Lars de Graaf', avatar: null },
    { name: 'Maud van den Heuvel', avatar: null },
    { name: 'Niels Schouten', avatar: null },
    { name: 'Noor Maas', avatar: null },
    { name: 'Olaf Kuiper', avatar: null },
    { name: 'Pien Wouters', avatar: null },
    { name: 'Quinten Bakker', avatar: null },
    { name: 'Roos van Loon', avatar: null },
    { name: 'Sem Visser', avatar: null },
    { name: 'Tess Vos', avatar: null },
    { name: 'Teun Dijkstra', avatar: null },
    { name: 'Vera de Haan', avatar: null },
    { name: 'Wessel van Beek', avatar: null },
    { name: 'Yara Huisman', avatar: null },
    { name: 'Zoë Hoekstra', avatar: null },
    { name: 'Bente Boer', avatar: null },
    { name: 'Cas Lammers', avatar: null },
    { name: 'Demi de Ruiter', avatar: null },
    { name: 'Elin Jansen', avatar: null },
    { name: 'Fenna de Groot', avatar: null },
    { name: 'Gerben Brouwer', avatar: null },
    { name: 'Hanna Kok', avatar: null },
    { name: 'Ivo de Bruijn', avatar: null },
    { name: 'Jelle Prins', avatar: null },
    { name: 'Kiki van Wijk', avatar: null },
    { name: 'Luca Groen', avatar: null },
    { name: 'Merel Peeters', avatar: null },
    { name: 'Nina van Dam', avatar: null },
    { name: 'Otto Franken', avatar: null },
    { name: 'Puck de Boer', avatar: null },
    { name: 'Ruben van Leeuwen', avatar: null },
    { name: 'Sophie van der Meer', avatar: null },
    { name: 'Stan van der Veen', avatar: null },
];

// `leader` and `members` list names from `people`; the board uses `title` for each member's function.
export const committees = [
    {
        name: 'Bestuur',
        token: 'bestuur',
        email: 'bestuur@salvemundi.nl',
        image: 'cf9f5987-82f2-4757-9495-74ec4d0ab6ff',
        short_description: 'Dit is bestuur 11',
        description: 'Dit is het bestuur van Salve Mundi. Interesse? Mail ons!',
        leaders: ['Daan Dekker'],
        members: ['Daan Dekker', 'Niels Schouten', 'Olaf Kuiper', 'Pien Wouters', 'Ilse van Vliet', 'Hidde Timmermans'],
    },
    {
        name: 'Studiecommissie',
        token: 'studie',
        email: 'studie@salvemundi.nl',
        image: 'a6b27c31-6872-4d15-ad7b-f1af2bd99e9b',
        short_description: 'De studiecommissie houdt zich bezig met studiegerelateerde activiteiten.',
        description: 'De studiecommissie organiseert lezingen en workshops. Met EHBS (Eerste Hulp bij Startsemester) geven we wekelijks bijles voor elke studierichting, speciaal voor startende studenten. Samen met Fontys faciliteren we ook de open dagen.',
        leaders: ['Anouk de Bakker'],
        members: ['Anouk de Bakker', 'Bas Mulder', 'Daan Dekker', 'Eva van der Linden'],
    },
    {
        name: 'Mediacommissie',
        token: 'media',
        email: 'media@salvemundi.nl',
        image: '8ed814d9-8a70-4667-a9d0-1da4e88d0152',
        short_description: 'De mediacommissie is het creatieve hart van Salve Mundi.',
        description: 'De mediacommissie ontwerpt introshirts, hoodies en promotiemateriaal en legt feesten en evenementen vast op foto en video. De beelden worden bewerkt en gedeeld op social media. Daarnaast is er een fototeam van leden dat op evenementen fotografeert.',
        leaders: ['Femke van den Broek'],
        members: ['Femke van den Broek', 'Anouk de Bakker', 'Floor Postma', 'Daan Dekker', 'Guus Kramer', 'Hidde Timmermans', 'Ilse van Vliet', 'Jesse Martens'],
    },
    {
        name: 'Feestcommissie',
        token: 'feest',
        email: 'feest@salvemundi.nl',
        image: '23c1b7d7-7f91-439f-8f83-af3813465aed',
        short_description: 'De feestcommissie organiseert jaarlijks verschillende borrels en feesten',
        description: 'De feestcommissie organiseert elk jaar borrels en feesten in onze thuisbar, de BorrelBar. Feesten hebben meestal een thema en de commissie bedenkt het thema en de aankleding. De meeste feesten zijn voor iedereen toegankelijk en leden krijgen vaak net iets extra.',
        leaders: ['Julia Wijnen'],
        members: ['Julia Wijnen', 'Kees Meijer', 'Femke van den Broek', 'Lotte Hendriks', 'Lars de Graaf', 'Maud van den Heuvel', 'Niels Schouten', 'Noor Maas'],
    },
    {
        name: 'Reiscommissie',
        token: 'reis',
        email: 'reis@salvemundi.nl',
        image: '9ada0835-d580-4730-99cd-920ef8de3f4d',
        short_description: 'De reiscommissie organiseert super coole reizen.',
        description: 'De reiscommissie organiseert de jaarlijkse reis van Salve Mundi. We zijn al naar Praag, Boedapest, Barcelona en Lissabon geweest.',
        leaders: ['Quinten Bakker'],
        members: ['Quinten Bakker', 'Eva van der Linden', 'Olaf Kuiper', 'Roos van Loon', 'Sem Visser', 'Tess Vos', 'Teun Dijkstra', 'Vera de Haan'],
    },
    {
        name: 'ICT-commissie',
        token: 'ict',
        email: 'ict@salvemundi.nl',
        image: '98fd7dda-9814-4762-b59e-2824481ff263',
        short_description: 'Ict is leuk',
        description: 'De ICT-commissie zorgt voor de technische gadgets en de techniek van de vereniging, waaronder deze website.',
        leaders: ['Sem Visser'],
        members: ['Sem Visser', 'Daan Dekker', 'Wessel van Beek', 'Yara Huisman', 'Zoë Hoekstra'],
    },
    {
        name: 'Kascommissie',
        token: 'kas',
        email: 'kas@salvemundi.nl',
        image: 'e3a1ac6a-e3cf-4fc9-a9ab-a89a155436c4',
        short_description: 'De kascommissie controleerd de financiën',
        description: 'Een kleine commissie die controleert hoe het bestuur met de financiën van de vereniging omgaat en daar jaarlijks verslag van uitbrengt.',
        leaders: ['Anouk de Bakker'],
        members: ['Anouk de Bakker', 'Bente Boer', 'Cas Lammers', 'Teun Dijkstra'],
    },
    {
        name: 'Marketingcommissie',
        token: 'marketing',
        email: 'marketing@salvemundi.nl',
        image: 'af0a1029-6207-4bb1-8d69-d361e2b3f6b0',
        short_description: 'De marketingcommissie heeft als doel om onze online zichtbaarheid te verbeteren.',
        description: 'De marketingcommissie werkt aan de online zichtbaarheid van de vereniging, onder andere door posts voor social media te maken.',
        leaders: ['Femke van den Broek'],
        members: ['Femke van den Broek', 'Demi de Ruiter', 'Maud van den Heuvel', 'Daan Dekker', 'Niels Schouten', 'Elin Jansen', 'Ilse van Vliet', 'Kees Meijer'],
    },
    {
        name: 'Introcommissie',
        token: 'intro',
        email: 'intro@salvemundi.nl',
        image: '13eb9cf2-f6c1-4f8a-9118-7fff317d503c',
        short_description: 'De introcommissie organiseert elk jaar de vetste intro van Eindhoven',
        description: 'De introcommissie organiseert de jaarlijkse intro in Eindhoven, met teambuilding, een trip naar Purple Festival, de stad verkennen en gezellige activiteiten.',
        leaders: ['Fenna de Groot', 'Roos van Loon'],
        members: ['Fenna de Groot', 'Roos van Loon', 'Gerben Brouwer', 'Hanna Kok', 'Ilse van Vliet', 'Ivo de Bruijn', 'Hidde Timmermans', 'Daan Dekker'],
    },
    {
        name: 'Kampcommissie',
        token: 'kamp',
        email: 'kamp@salvemundi.nl',
        image: '38c22147-3264-4b99-976f-9a90833dacd3',
        short_description: 'De Kampcommissie organiseert elk jaar een kamp voor de leden.',
        description: 'De kampcommissie organiseert elk jaar een driedaags kamp voor leden, met spellen en een sociaal programma.',
        leaders: ['Jelle Prins'],
        members: ['Jelle Prins', 'Kiki van Wijk', 'Luca Groen', 'Merel Peeters', 'Nina van Dam', 'Bente Boer', 'Guus Kramer', 'Fenna de Groot'],
    },
    {
        name: 'Activiteitencommissie',
        token: 'acc',
        email: 'activiteiten@salvemundi.nl',
        image: '19f87f93-c715-42a0-9929-d04ec6d3a07a',
        short_description: 'De activiteitencommissie organiseert buitenschoolse activiteiten.',
        description: 'De activiteitencommissie organiseert buitenschoolse activiteiten zoals karten, paintballen, schaatsen in de winter en zwemmen in de zomer, vaak met een Halloween-, kerst- of valentijnsthema.',
        leaders: ['Teun Dijkstra'],
        members: ['Teun Dijkstra', 'Guus Kramer', 'Niels Schouten', 'Otto Franken', 'Julia Wijnen', 'Lars de Graaf', 'Puck de Boer', 'Ruben van Leeuwen', 'Sophie van der Meer'],
    },
];

export const boardTitles = {
    'Daan Dekker': 'Voorzitter',
    'Niels Schouten': 'Vice-voorzitter',
    'Olaf Kuiper': 'Penningmeester',
    'Pien Wouters': 'Communicatie',
    'Ilse van Vliet': 'Communicatie',
    'Hidde Timmermans': 'Secretaris',
};

export const pastBoards = [
    { naam: '10,8e Bestuur', year: '2026-2026', members: [['Thijs Willems', 'Algemeen bestuurslid'], ['Sem Visser', 'Secretaris'], ['Fenna de Groot', 'Voorzitter'], ['Eva van der Linden', 'Commissaris Communicatie'], ['Olaf Kuiper', 'Penningmeester']] },
    { naam: '10e Bestuur', year: '2025-2026', members: [['Thijs Willems', 'Penningmeester'], ['Fenna de Groot', 'Voorzitter'], ['Sem Visser', 'Secretaris'], ['Eva van der Linden', 'Commissaris Communicatie']] },
    { naam: '9e bestuur', year: '2024 - 2025', members: [['Julia Wijnen', 'Voorzitter'], ['Ties Verbeek', 'Secretaris'], ['Veerle van der Wal', 'Penningmeester'], ['Nina van Dam', 'Commissaris Communicatie Extern'], ['Maud van den Heuvel', 'Commissaris Communicatie Intern']] },
    { naam: '8e bestuur', year: '2023 - 2024', members: [['Nina van Dam', 'Voorzitter'], ['Bente Boer', 'Secretaris'], ['Wout Driessen', 'Penningmeester'], ['Isa Koning', 'Commissaris Communicatie'], ['Job Claassen', 'Commissaris Communicatie']] },
    { naam: '7e bestuur', year: '2022 - 2023', members: [['Lieke Smit', 'Voorzitter'], ['Jelle Prins', 'Secretaris'], ['Roos van Loon', 'Penningmeester'], ['Guus Kramer', 'Commissaris intern'], ['Mats Peters', 'Commissaris extern']] },
    { naam: '6e bestuur', year: '2021 - 2022', members: [['Lieke Smit', 'Voorzitter'], ['Jelle Prins', 'Secretaris'], ['Roos van Loon', 'Penningmeester'], ['Guus Kramer', 'Commissaris intern'], ['Mats Peters', 'Commissaris extern']] },
    { naam: '5e bestuur', year: '2020 - 2021', members: [['Nora Smits', 'Voorzitter'], ['Wout Driessen', 'Secretaris'], ['Pepijn Vermeulen', 'Penningmeester'], ['Rosa Kuipers', 'Commissaris intern'], ['Siem Koster', 'Commissaris extern']] },
    { naam: '4e bestuur', year: '2019 - 2020', members: [['Nora Smits', 'Voorzitter'], ['Tim Molenaar', 'Secretaris'], ['Yfke Mol', 'Penningmeester'], ['Pepijn Vermeulen', 'Commissaris Intern'], ['Quinten Bakker', 'Commissaris Extern']] },
    { naam: '3e bestuur', year: '2018 - 2019', members: [['Bo Sanders', 'Voorzitter'], ['Fleur Hermsen', 'Secretaris'], ['Tim Molenaar', 'Secretaris'], ['Hugo van Dijk', 'Penningmeester'], ['Yfke Mol', 'Penningmeester'], ['Nora Smits', 'Commissaris Extern'], ['Jip Bos', 'Algemeen Bestuurslid'], ['Koen de Wit', 'Algemeen Bestuurslid'], ['Lynn Jacobs', 'Algemeen Bestuurslid'], ['Milou de Jong', 'Algemeen Bestuurslid']] },
    { naam: '2e bestuur', year: '2018 - 2019', members: [['Nick Blom', 'Voorzitter'], ['Romy Bosman', 'Secretaris'], ['Sanne Gerritsen', 'Penningmeester'], ['Tom Verhoeven', 'Algemeen bestuurslid']] },
    { naam: '1e bestuur', year: '2017 - 2018', members: [['Nick Blom', 'Voorzitter'], ['Romy Bosman', 'Secretaris'], ['Sanne Gerritsen', 'Penningmeester'], ['Vos Evers', 'Algemeen bestuurslid']] },
];

// The live site shows one price per event; where the description mentions a member price, that becomes price_members.
export const events = [
    {
        name: 'Weerwolven 2026',
        committee: 'Activiteitencommissie',
        event_date: '2026-11-25', event_time: '18:00', event_time_end: '22:00',
        location: 'Rachelsmolen R5',
        price_members: 0, price_non_members: 0,
        contact: 'activiteiten@salvemundi.nl',
        image: 'bf9dcc98-e1b3-426b-9bca-cb270d23f1cf',
        short_description: 'Een avond weerwolven met drankjes, snacks en pizza zolang de voorraad strekt.',
        description: 'Kom gezellig weerwolven in gebouw R5 (lokaal volgt nog)! Er zijn drankjes en snacks, en pizza zolang de voorraad strekt. Let op: dit is geen volledige maaltijd.\n\nDeelname is gratis. Schrijf je in via salvemundi.nl/activiteiten.\n\nGroetjes,\nActiviteitencommissie\nTeun Dijkstra',
    },
    {
        name: 'SaMu Pubquiz !',
        committee: 'Feestcommissie',
        event_date: '2026-11-26', event_time: '18:00', event_time_end: null,
        location: 'De Borrelbar',
        price_members: 0, price_non_members: 0,
        contact: 'feest@salvemundi.nl',
        image: '4b06754c-e970-4a6a-90eb-d7af1c58e85e',
        short_description: 'Pubquiz met prijzen, in teams van 4 of solo.',
        description: 'Neem je slimste kennis mee naar de SaMu Pubquiz! Speel in een team van 4 of solo, er zijn prijzen te winnen. Te laat komen mag.\n\nTeams schrijven zich in via het formulier: https://forms.cloud.microsoft/e/7P3WFDg8fR\n\nGroetjes,\nFeestcommissie\nJulia Wijnen',
    },
    {
        name: 'Kerst met Salve Mundi',
        committee: 'Activiteitencommissie',
        event_date: '2026-12-08', event_date_end: '2026-12-09', event_time: '17:00', event_time_end: '12:00',
        location: 'Scouting Helmond, Bakelsedijk 208 Helmond',
        price_members: 5, price_non_members: 15,
        contact: 'activiteiten@salvemundi.nl',
        image: '689e3268-afe4-4c97-8198-71200cfc5f95',
        short_description: 'Kerstavond met cadeauspel, gourmetten en een kampvuur. Blijven slapen kan.',
        description: 'Inloop vanaf 17:00, we beginnen om 18:00. We spelen een cadeauspel, gourmetten samen en sluiten af met een kerstfilm of een kampvuur. Blijven slapen kan!\n\nKosten: €5 voor leden. Dieetwensen vul je na het betalen in via een formulier.\n\nGroetjes,\nActiviteitencommissie\nTeun Dijkstra',
    },
    {
        name: '🎁🍻 SINTERKLAAS CANTUS! 🍻🎁',
        committee: 'Feestcommissie',
        event_date: '2026-12-10', event_time: '18:00', event_time_end: null,
        location: 'Borrelbar Eindhoven',
        price_members: 1, price_non_members: 5,
        contact: 'feest@salvemundi.nl',
        image: '3cbd0022-f2a8-43d4-ae06-49be0877b25b',
        short_description: 'Zingen, gezelligheid en bier tijdens de Sinterklaas cantus.',
        description: 'Sinterklaas komt naar de Borrelbar! Een avond vol liedjes, gezelligheid en bier.\n\nKosten: €1,- voor leden. Schrijf je in via salvemundi.nl/activiteiten.',
    },
    {
        name: 'Apenkooien',
        committee: 'Activiteitencommissie',
        event_date: '2026-12-18', event_time: '17:00', event_time_end: null,
        location: 'Don Boscostraat 2',
        price_members: 2, price_non_members: 2,
        contact: 'activiteiten@salvemundi.nl',
        image: '4d5b48a4-c924-482d-b3e5-7058050f568e',
        short_description: 'Lekker ravotten in de gymzaal, apenstijl.',
        description: 'Lekker ravotten in de gymzaal, net als vroeger. Trek sportkleding aan!',
    },
    {
        name: 'Gamestate',
        committee: 'Activiteitencommissie',
        event_date: '2027-01-19', event_time: '18:00', event_time_end: '20:00',
        location: 'Stationsplein 45, Eindhoven',
        price_members: 10, price_non_members: 10,
        contact: 'activiteiten@salvemundi.nl',
        image: '2af1aa1c-c71e-48ce-af0f-27cb3f4bbbf5',
        short_description: 'Twee uur onbeperkt gamen bij Gamestate.',
        description: 'We gaan naar Gamestate met onbeperkt tokens voor 2 uur!',
    },
    {
        name: 'Syntouch bedrijfsbezoek 2027',
        committee: 'Studiecommissie',
        event_date: '2027-02-18', event_time: '20:00', event_time_end: '20:30',
        location: 'Parklaan 60, Eindhoven',
        price_members: 0, price_non_members: 0,
        contact: 'studie@salvemundi.nl',
        image: '88f976f7-b273-454e-8639-1397c1e29eac',
        short_description: 'Bedrijfsbezoek bij SynTouch over IT-integratie en data.',
        description: 'Een interactieve avond bij SynTouch over IT-integratie en data, afgesloten met een pubquiz, prijzen en een borrel.',
    },
];

export const clubs = [
    { name: 'F1 Club', image: 'aef8305a-9737-413a-98f9-a297f9fef6e8', description: 'WhatsApp-groep voor F1-fans om races te bespreken en samen races te kijken.' },
    { name: 'Gaming Club', image: '37b99853-21de-4af3-8b42-3388c03bc459', description: 'Game-avonden, toernooien, gameservers en meer.' },
    { name: 'De Hubble Club', image: '3e3f512f-b197-4691-9875-bd60cc2c67ce', description: 'Andere leden ontmoeten voor een drankje bij Hubble.' },
    { name: 'DnD Club', image: 'fd1e487e-f4ae-4342-ac54-447f0da1e935', description: 'Samen Dungeons & Dragons spelen.', discord_link: 'https://discord.gg/ZUcf3hMbR2' },
    { name: 'Dnb club', image: '8cbd501d-f23e-48e5-8e23-bd71ee013ce8', description: 'Voor liefhebbers van drum-n-bass, dubstep en aanverwante genres.' },
    { name: 'Duolingo club', image: '6116f469-4589-457c-b8c4-a8d2f843b460', description: 'Samen talen leren met Duolingo en elkaar helpen met friend quests.' },
    { name: 'Döner dinsdag Club', image: '1d8980de-9b8b-41ea-bbd2-5f8b84d1472a', description: 'Samen Hizmet eten. Maandag Mahmachun, dinsdag Döner, woensdag Wapsalon, donderdag Dürum, vrijdag Vriet.' },
    { name: 'Film club', image: '30f581c1-8449-4f13-adf4-00fa3b328127', description: 'Samen naar de bioscoop.' },
    { name: 'Hardstyle Club', image: '0ac77dae-8a67-4513-8703-7ee5571f93a2', description: 'Harder styles, samen naar festivals en de nieuwste releases.' },
    { name: 'Het tikkertje club', image: 'be15558b-c4e5-4b58-b645-e92ac0b5224d', description: 'Tikkertje spelen.' },
    { name: 'Irish Tuesday Club', image: '8c599a80-9e36-46ed-a7bf-a5766961e60a', description: "Elke dinsdag naar de O'Sheas." },
    { name: 'ME Tegenspel Club', image: '4a85a696-578e-468d-bb6b-4b9b5ab37c98', description: 'Tegenspeler zijn bij ME-trainingen op de politieacademie. Goed tegen stress.' },
    { name: 'Sport Club', image: 'da0b1ecc-3683-4444-b9b3-676ce4de858d', description: 'Samen sporten, voor leden met een abonnement bij het Studenten Sport Centrum Eindhoven.' },
    { name: 'TableTopClub', image: 'dd684184-76ca-4c4c-aa8c-949bab384501', description: 'Bord- en kaartspellen spelen.' },
];

export const safeHavens = [
    { name: 'Puck de Boer', image: null },
    { name: 'Floor Postma', image: null },
    { name: 'Maud van den Heuvel', image: null },
    { name: 'Stan van der Veen', image: null },
];

export const sponsors = [
    { website_url: 'https://hubble.cafe', image: '8329f772-7210-4cdd-bfbf-59c8ce9c61ad' },
    { website_url: 'https://deborrelbar.com/eindhoven', image: 'fbd0124b-9df1-4dbf-8222-f199f949cb25' },
    { website_url: 'https://fontys.nl', image: '97d293c6-4f04-4c7f-a055-3c86441458eb' },
    { website_url: 'https://meteorcommunity.cafe', image: 'a0703eb0-38a1-4fa7-8e08-f10f03d6bc72' },
];

export const documents = [
    { title: 'Privacyvoorwaarden', category: 'algemeen', file: '4ed214a6-b508-4144-8bc1-ed373dadaeda' },
    { title: 'Statuten', category: 'algemeen', file: '5d4055ee-67c4-40bf-9251-35a213e0c583' },
    { title: 'Huisreglement', category: 'algemeen', file: 'f340f44c-2fa8-43b2-9397-02c96958850a' },
    { title: 'Reisvoorwaarde', category: 'reis', file: '3374f5d2-ed32-4080-ad75-bc28c621043c' },
    { title: 'Chat regels', category: 'algemeen', file: '7f51d165-a317-441c-994b-1e3c22d41bf9' },
];

export const heroBanners = [
    { title: 'Sfeerimpressie 1', image: 'e07cd64c-dd41-4a24-a378-42f9059fd993' },
    { title: 'Sfeerimpressie 2', image: 'c8140c00-db05-4e6a-9342-f6896760b89b' },
    { title: 'Bestuur 11', image: 'cf9f5987-82f2-4757-9495-74ec4d0ab6ff' },
];

export const products = [
    {
        name: 'Muismat', slug: 'muismat', type: 'item', price: 1.5,
        description: 'Overgebleven muismatten van de hackathon. Je betaalt nu de volledige prijs, er is geen bezorging.',
        media: ['a3e9d3fa-52b7-4d75-b95c-f7d20fecc754', 'b6460763-c19f-4ddc-a1e9-8f32d1d9ddae', 'a1ef34f7-7b83-4c88-870e-920abd4d7676', 'de4eca28-01d3-4dad-b8d7-4390dfb0070c', 'b5499e20-dbbd-4c2a-b60d-2d835c991158'],
        variants: [],
    },
    {
        name: 'SaMu sportsokken', slug: 'samu-sportsokken', type: 'clothing', price: 7.33,
        description: 'Sportsokken van hoge kwaliteit die tegen weer en wind kunnen. One size fits all (tot ongeveer maat 45).',
        media: ['c0af7694-5ea1-46fc-9fa3-05e6c6faeffc', 'd752d4b3-b149-4101-a8ef-9fd87cf8e9bf'],
        variants: [{ size: 'One size' }],
    },
    {
        name: 'SaMu Mok', slug: 'samu-mok', type: 'item', price: 6.7, dropWindow: true,
        description: 'Een Salve Mundi mok voor koffie, thee, soep en meer. Te personaliseren met een naam en korte tekst.',
        media: ['2f1b5930-bd8d-43cf-882f-95b8d30b2f30'],
        variants: [],
        custom_fields: [{ label: 'Naam op de mok', max_length: 20 }],
    },
];

// Verzonnen: niet publiek bereikbaar op salvemundi.nl.

export const vacancyDirections = ['Software', 'Infrastructure', 'Business', 'Media', 'AI & Data'];

export const vacancies = [
    {
        title: 'Bierbrouwer met integratie-affiniteit',
        company: 'Brouwerij De Datastroom',
        type: 'bijbaan',
        description: 'Brouw je liever bier dan bugs? Wij zoeken een student die naast het brouwen onze bestel- en voorraadsystemen aan elkaar knoopt.',
        location: 'Eindhoven',
        salary: '€15,- per uur',
        employment_type: 'Parttime',
        working_hours: '8-16 uur per week',
        contact_email: 'vacatures@datastroom.example',
        skills: ['API-koppelingen', 'SQL', 'Bierkennis'],
        directions: ['Software', 'Business'],
    },
    {
        title: 'Afstudeerstage Cloud Engineering',
        company: 'Kempen Cloud Solutions',
        type: 'stage',
        description: 'Onderzoek hoe we onze Kubernetes-clusters kostenefficiënter kunnen schalen. Je krijgt een eigen begeleider en een stagevergoeding.',
        location: 'Veldhoven',
        salary: '€600,- per maand',
        employment_type: 'Fulltime',
        working_hours: '40 uur per week',
        contact_email: 'stage@kempencloud.example',
        skills: ['Kubernetes', 'Terraform', 'Azure'],
        directions: ['Infrastructure'],
    },
    {
        title: 'Junior Data Analist (bijbaan)',
        company: 'Lichtstad Analytics',
        type: 'bijbaan',
        description: 'Help ons klanten inzicht te geven in hun data met dashboards en slimme analyses. Flexibele uren, ook remote.',
        location: 'Eindhoven / remote',
        salary: '€16,50 per uur',
        employment_type: 'Parttime',
        working_hours: '12 uur per week',
        contact_email: 'jobs@lichtstad.example',
        skills: ['Python', 'Power BI'],
        directions: ['AI & Data'],
    },
];

export const trip = {
    name: 'Reis naar Krakau 2027',
    description: 'Dit jaar gaat de reiscommissie naar Krakau! Een week vol cultuur, goed eten en Poolse gezelligheid. We reizen met de bus en verblijven in een hostel in het centrum.',
    start_date: '2027-05-07',
    end_date: '2027-05-14',
    registration_start_date: '2026-11-01T12:00:00+01:00',
    base_price: 399,
    deposit_amount: 100,
    crew_discount: 50,
    max_participants: 50,
    max_crew: 8,
    image: '9ada0835-d580-4730-99cd-920ef8de3f4d',
    activities: [
        { name: 'Zoutmijn Wieliczka', description: 'Rondleiding door de eeuwenoude zoutmijn.', price: 35, max_participants: 40 },
        { name: 'Kroegentocht Kazimierz', description: 'Langs de beste kroegen van de Joodse wijk.', price: 15, max_participants: null },
        {
            name: 'Escape room', description: 'In teams tegen de klok.', price: 20, max_participants: 30,
            options: [{ id: 'horror', name: 'Horror', price: 0 }, { id: 'heist', name: 'Bankoverval', price: 2.5 }],
            max_selections: 1,
        },
    ],
};

export const pubCrawl = {
    name: 'Kroegentocht 2027',
    email: 'feest@salvemundi.nl',
    date: '2027-03-11 19:00:00',
    description: 'De jaarlijkse kroegentocht van Salve Mundi langs de leukste kroegen van Stratumseind. Koop tickets voor jezelf en je vrienden; iedere groep krijgt een begeleider.',
    image: '23c1b7d7-7f91-439f-8f83-af3813465aed',
    groups: [{ name: 'Groep Rood', leaders: [] }, { name: 'Groep Blauw', leaders: [] }, { name: 'Groep Groen', leaders: [] }],
};

const introDays = [
    ['Maandag', '2027-08-23'],
    ['Dinsdag', '2027-08-24'],
    ['Woensdag', '2027-08-25'],
    ['Donderdag', '2027-08-26'],
];

export const introPlanning = [
    [0, '10:00', '12:00', 'Opening introweek', 'Welkom bij Salve Mundi! Kennismaken met je introgroep.', 'Rachelsmolen R10', '#7B2CBF', 'true'],
    [0, '13:00', '17:00', 'Speurtocht door Eindhoven', 'Ontdek de stad met je groep.', 'Stratumseind', '#FF6B00', 'false'],
    [1, '10:00', '16:00', 'Teambuilding', 'Sport en spel met alle introgroepen.', 'Fontys Sportcentrum', '#2D6A4F', 'false'],
    [1, '20:00', '01:00', 'Introfeest', 'Het eerste feest van het jaar in de Borrelbar.', 'Borrelbar Eindhoven', '#E63946', 'false'],
    [2, '12:00', '23:00', 'Purple Festival', 'Samen naar Purple Festival.', 'Eindhoven', '#9D4EDD', 'false'],
    [3, '11:00', '15:00', 'Bedrijvenmarkt', 'Maak kennis met bedrijven en de bijbanenbank.', 'Rachelsmolen R1', '#1D3557', 'false'],
    [3, '18:00', '22:00', 'Afsluitende BBQ', 'Afsluiten van de introweek.', 'Rachelsmolen', '#FF6B00', 'true'],
].map(([day, time_start, time_end, title, description, location, color, is_mandatory], index) => ({
    day: introDays[day][0], date: introDays[day][1], time_start, time_end, title, description, location, color, is_mandatory, sort_order: index,
}));

export const introBlogs = [
    { title: 'De introweek 2027 komt eraan!', slug: 'introweek-2027-komt-eraan', blog_type: 'announcement', excerpt: 'Schrijf je nu in voor de vetste intro van Eindhoven.', content: 'De introcommissie is al maanden bezig met de voorbereidingen. Schrijf je in, dan houden we je op de hoogte via deze blog!', image: '13eb9cf2-f6c1-4f8a-9118-7fff317d503c' },
    { title: 'Dag 1: speurtocht door Eindhoven', slug: 'dag-1-speurtocht', blog_type: 'update', excerpt: 'Een terugblik op de eerste dag.', content: 'Wat een start! Alle groepen hebben de stad verkend en de winnende groep mocht als eerste aan de BBQ.', image: 'e07cd64c-dd41-4a24-a378-42f9059fd993' },
    { title: 'Foto\'s van het introfeest', slug: 'fotos-introfeest', blog_type: 'pictures', excerpt: 'De mediacommissie heeft de foto\'s online gezet.', content: 'Bekijk hier de mooiste foto\'s van het introfeest in de Borrelbar.', image: 'c8140c00-db05-4e6a-9342-f6896760b89b' },
];

export const whatsappGroups = [
    { name: 'Intro 2027', description: 'Groep voor iedereen die meedoet aan de introweek.', invite_link: 'https://chat.whatsapp.com/seed-intro-2027', requires_membership: false },
    { name: 'Salve Mundi leden', description: 'Algemene groep voor leden.', invite_link: 'https://chat.whatsapp.com/seed-leden', requires_membership: true },
    { name: 'Salve Mundi aankondigingen', description: 'Alleen aankondigingen van het bestuur.', invite_link: 'https://chat.whatsapp.com/seed-aankondigingen', requires_membership: true },
];

export const stickers = [
    { location_name: 'Fontys Rachelsmolen', city: 'Eindhoven', country: 'Nederland', latitude: 51.4507, longitude: 5.4806, description: 'Op de lantaarnpaal bij R1.' },
    { location_name: 'Stratumseind', city: 'Eindhoven', country: 'Nederland', latitude: 51.4386, longitude: 5.4826, description: 'Bij de ingang van de Borrelbar.' },
    { location_name: 'Karlsbrücke', city: 'Praag', country: 'Tsjechië', latitude: 50.0865, longitude: 14.4114, description: 'Achtergelaten tijdens de reis naar Praag.' },
    { location_name: 'Praça do Comércio', city: 'Lissabon', country: 'Portugal', latitude: 38.7076, longitude: -9.1365, description: 'Achtergelaten tijdens de reis naar Lissabon.' },
];

export const coupons = [
    { coupon_code: 'SEEDKORTING', discount_type: 'fixed', discount_value: 5, usage_limit: 100 },
    { coupon_code: 'SEEDGRATIS', discount_type: 'percentage', discount_value: 100, usage_limit: 10 },
];

export const featureFlags = [
    { name: 'Intro', route_match: '/intro', is_active: true, message: 'De inschrijvingen voor de introweek zijn momenteel gesloten.' },
    { name: 'Reis', route_match: '/reis', is_active: true, message: 'De reis is momenteel niet beschikbaar.' },
    { name: 'Kroegentocht', route_match: '/kroegentocht', is_active: true, message: 'De kroegentocht is momenteel niet beschikbaar.' },
];
