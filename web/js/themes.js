// Shell colours. Each one is a full palette for the pixel-art console.
// hi/lo are the lit and shaded rims of a surface, edge is its outline.

const base = {
  bezel: '#3a3553', bezelHi: '#4b4568', bezelLo: '#28243b', bezelEdge: '#16131f', screenEdge: '#07060c',
  bezelText: '#a39cc8', stripes: ['#8e6cf0', '#e0629f'],
  dpad: '#2f2a40', dpadHi: '#4a4462', dpadLo: '#1b1826', dpadEdge: '#0f0d16',
  small: '#5d5677', smallHi: '#7a7398', smallLo: '#433d59', smallEdge: '#1e1a2b', smallIcon: '#d9d3f2',
  cart: '#4b4a5a', cartHi: '#6a6980', cartLo: '#33323f', cartLabel: '#efe4c4', cartText: '#3b2b22',
  led: '#ff3d5e', ledGlow: '#ff9aa9', ledOff: '#4a1f2a',
};

export const THEMES = {
  moonlight: {
    title: 'Moonlight',
    ...base,
    body: '#b6aedb', hi: '#d6d0f0', lo: '#8b82b8', edge: '#2b2445', recess: '#9b92c6',
    btn: '#c23b7e', btnHi: '#ec6eaa', btnLo: '#8a2457', btnEdge: '#3a0f26',
    label: '#4c4475', logo: '#2e2a72', logoHi: '#e2ddf6', speaker: '#6f66a0',
  },
  classic: {
    title: 'Classic grey',
    ...base,
    body: '#c9c5bb', hi: '#e4e1d9', lo: '#a19d94', edge: '#3d3a36', recess: '#b3afa5',
    bezel: '#5a5a6e', bezelHi: '#6c6c82', bezelLo: '#45455a', bezelText: '#c3c3d6', stripes: ['#7b1e4f', '#2c2a7a'],
    btn: '#9b2257', btnHi: '#c44a7c', btnLo: '#6a1239', btnEdge: '#2e0718',
    small: '#7d7a86', smallHi: '#9a97a3', smallLo: '#5f5c68', smallIcon: '#e9e6ee',
    label: '#45437a', logo: '#262a7c', logoHi: '#f1efe9', speaker: '#8b877e',
  },
  midnight: {
    title: 'Midnight',
    ...base,
    body: '#2a2740', hi: '#3d3959', lo: '#1b1929', edge: '#07060c', recess: '#221f35',
    bezel: '#141220', bezelHi: '#221f33', bezelLo: '#0c0b14', bezelText: '#6f689a', stripes: ['#ffb040', '#b78cff'],
    dpad: '#16141f', dpadHi: '#2b2840', dpadLo: '#0b0a10',
    btn: '#f0a33a', btnHi: '#ffd27f', btnLo: '#b56f17', btnEdge: '#3d2104',
    small: '#3b3754', smallHi: '#54507a', smallLo: '#24213a', smallIcon: '#c8bfff',
    label: '#9c94c8', logo: '#c8bfff', logoHi: '#0e0c18', speaker: '#14121f',
  },
  witch: {
    title: 'Witch',
    ...base,
    body: '#4a2a63', hi: '#673d87', lo: '#311b44', edge: '#12081b', recess: '#3d2253',
    bezel: '#1d1029', bezelHi: '#2c1a3d', bezelLo: '#12091b', bezelText: '#a27fc4', stripes: ['#ff8a3d', '#7cff9b'],
    dpad: '#1f1229', dpadHi: '#3a2650', dpadLo: '#110919',
    btn: '#ff8a3d', btnHi: '#ffbd85', btnLo: '#c25a17', btnEdge: '#3f1604',
    small: '#5c3a7a', smallHi: '#7a539c', smallLo: '#3f2556', smallIcon: '#ffd9b0',
    label: '#c9a6e8', logo: '#ffcf8a', logoHi: '#1f0f2b', speaker: '#2c1740',
  },
  pumpkin: {
    title: 'Pumpkin',
    ...base,
    body: '#e07b33', hi: '#f6a062', lo: '#b25a1d', edge: '#3a1b08', recess: '#c96a27',
    btn: '#3b2147', btnHi: '#5d3a6e', btnLo: '#241329', btnEdge: '#120814',
    small: '#8a4a1f', smallHi: '#a8622f', smallLo: '#6b3714', smallIcon: '#ffe2c4',
    label: '#5a2c12', logo: '#3b2147', logoHi: '#ffc999', speaker: '#a24f17',
  },
  fen: {
    title: 'Fen green',
    ...base,
    body: '#6e8b5a', hi: '#8eab78', lo: '#526b42', edge: '#1d2a16', recess: '#5f7a4d',
    bezel: '#2c3527', bezelHi: '#3b4734', bezelLo: '#1f261b', bezelText: '#9fb48d', stripes: ['#e2b04a', '#c96fa3'],
    btn: '#e2b04a', btnHi: '#f6d68a', btnLo: '#a97c22', btnEdge: '#3a2806',
    small: '#4b5f3e', smallHi: '#62794f', smallLo: '#36452c', smallIcon: '#e8f0d9',
    label: '#22331a', logo: '#22331a', logoHi: '#b9d1a3', speaker: '#4b6339',
  },
  glacier: {
    title: 'Glacier',
    ...base,
    body: '#e3e9f3', hi: '#ffffff', lo: '#b7c2d6', edge: '#48536b', recess: '#cdd6e5',
    bezel: '#3b4560', bezelHi: '#4d5877', bezelLo: '#2b3349', bezelText: '#a9b6d6', stripes: ['#4a7bd8', '#d85a7b'],
    btn: '#4a7bd8', btnHi: '#86a9ee', btnLo: '#2e56a3', btnEdge: '#0f1f42',
    small: '#9aa6bf', smallHi: '#b9c3d8', smallLo: '#7c88a2', smallIcon: '#ffffff',
    label: '#5b6787', logo: '#2b3f7a', logoHi: '#ffffff', speaker: '#a7b2c8',
  },
};

export const THEME_NAMES = Object.keys(THEMES);

export function theme(name) {
  return THEMES[name] || THEMES.moonlight;
}
