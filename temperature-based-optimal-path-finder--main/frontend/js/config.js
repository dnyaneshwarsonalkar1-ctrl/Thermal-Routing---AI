const CONFIG = {
    MAP: {
        CENTER: [14.4644, 75.9218], // Davanagere, Karnataka
        ZOOM: 10
    },
    LOCATIONS: {
        HUB: {
            id: 'hub_davanagere',
            name: 'Davanagere GMU (Central Hub)',
            lat: 14.4644,
            lng: 75.9218,
            type: 'hub'
        },
        FARMS: [
            {
                id: 'farm_1',
                name: 'Farm 1 - Harihar',
                lat: 14.5126,
                lng: 75.8055,
                type: 'farm'
            },
            {
                id: 'farm_2',
                name: 'Farm 2 - Honnali',
                lat: 14.2407,
                lng: 75.6323,
                type: 'farm'
            },
            {
                id: 'farm_3',
                name: 'Farm 3 - Jagalur',
                lat: 14.5292,
                lng: 76.3421,
                type: 'farm'
            }
        ]
    },
    PRODUCE: {
        leafy_greens: { name: 'Leafy greens', T_ref: 10, k: 0.022, rate: 40 },
        tomato: { name: 'Tomato', T_ref: 13, k: 0.012, rate: 35 },
        mango: { name: 'Mango', T_ref: 13, k: 0.009, rate: 90 },
        potato_onion: { name: 'Potato / Onion', T_ref: 15, k: 0.003, rate: 22 },
        custom: { name: 'Custom Crop', T_ref: 12, k: 0.012, rate: 40 }
    },
    SCORING: {
        w1: 0.20,
        w2: 0.05,
        w3: 0.75
    }
};
