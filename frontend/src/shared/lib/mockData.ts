export const MOCK_EVENTS = [
    {
        id: 1,
        name: 'Borrel: Back to School',
        event_date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
        description: 'Kom gezellig borrelen om het nieuwe jaar in te luiden!',
        price_members: 0,
        price_non_members: 0,
        committee_name: 'Feestcommissie',
        image: undefined
    },
    {
        id: 2,
        name: 'Workshop: React Basics',
        event_date: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
        description: 'Leer de basis van React in deze hands-on workshop.',
        price_members: 2.50,
        price_non_members: 5.00,
        committee_name: 'Studiecommissie',
        image: undefined
    },
    {
        id: 3,
        name: 'LAN Party',
        event_date: new Date(Date.now() + 86400000 * 10).toISOString(), // 10 days from now
        description: 'Een hele nacht gamen met je medestudenten.',
        price_members: 5.00,
        price_non_members: 7.50,
        committee_name: 'LAN Commissie',
        image: undefined
    }
];

export const MOCK_COMMITTEES = [
    {
        id: 1,
        name: 'Bestuur',
        short_description: 'Het bestuur van Salve Mundi.',
        is_visible: true,
        committee_members: []
    },
    {
        id: 2,
        name: 'Feestcommissie',
        short_description: 'Organiseert de vetste feesten.',
        is_visible: true,
        committee_members: []
    },
    {
        id: 3,
        name: 'Studiecommissie',
        short_description: 'Ondersteunt studenten met workshops en bijles.',
        is_visible: true,
        committee_members: []
    }
];

export const MOCK_CLUBS = [
    {
        id: 1,
        name: 'D&D Club',
        description: 'Wekelijkse Dungeons & Dragons sessies.',
        whatsapp_link: 'https://wa.me/',
        discord_link: 'https://discord.gg/'
    },
    {
        id: 2,
        name: 'Coding Club',
        description: 'Samen werken aan hobbyprojecten.',
        github_link: 'https://github.com/'
    }
];
