// Little pixel-art icons, drawn as SVG squares and installed as CSS classes (.ico-name).

const ICONS = {
  cart: {
    pal: { o: '#1a1530', b: '#8f8aa8', l: '#f0e6c8', p: '#9b7cf0', y: '#ffb040', h: '#6a6585' },
    rows: ['..oooooooo..', '.obbbbbbbbo.', '.obllllllbo.', '.oblpppplbo.', '.oblpyyplbo.', '.oblpppplbo.', '.obllllllbo.', '.obbbbbbbbo.', '.obhbhbhbbo.', '.obbbbbbbbo.', '.oooooooooo.', '............'],
  },
  folder: {
    pal: { o: '#5a3a10', y: '#f6cf7a', Y: '#e3a73f' },
    rows: ['............', '.oooo.......', 'oyyyyo......', 'oyyyyyooooo.', 'oyyyyyyyyyyo', 'oYYYYYYYYYYo', 'oYYYYYYYYYYo', 'oYYYYYYYYYYo', 'oYYYYYYYYYYo', 'oYYYYYYYYYYo', '.oooooooooo.', '............'],
  },
  up: {
    pal: { o: '#1a1530', a: '#cfc7f2' },
    rows: ['............', '.....oo.....', '....oaao....', '...oaaaao...', '..oaaaaaao..', '.oooaaaaooo.', '...oaaaao...', '...oaaaao...', '...oaaaao...', '...oaaaao...', '...oooooo...', '............'],
  },
  home: {
    pal: { o: '#1a1530', w: '#e9e2ff', d: '#7a52e0' },
    rows: ['.....oo.....', '....owwo....', '...owwwwo...', '..owwwwwwo..', '.owwwwwwwwo.', 'oooowwwwoooo', '...owwwwo...', '...owddwo...', '...owddwo...', '...owddwo...', '...oooooo...', '............'],
  },
  moon: {
    pal: { o: '#3b2f14', y: '#f4e6b8', s: '#fff6d6' },
    rows: ['...oooo.....', '.ooyyyyo..s.', '.oyyyyo..sss', 'oyyyyo....s.', 'oyyyo.......', 'oyyyo.......', 'oyyyo.......', 'oyyyyo......', '.oyyyyo.....', '.ooyyyyo....', '...oooo.....', '............'],
  },
  add: {
    pal: { o: '#1d4a2a', g: '#7cff9b' },
    rows: ['............', '....oooo....', '....oggo....', '....oggo....', '.ooooggoooo.', '.oggggggggo.', '.oggggggggo.', '.ooooggoooo.', '....oggo....', '....oggo....', '....oooo....', '............'],
  },
  newfolder: {
    pal: { o: '#5a3a10', y: '#f6cf7a', Y: '#e3a73f', g: '#2fd06a' },
    rows: ['............', '.oooo.......', 'oyyyyo......', 'oyyyyyooooo.', 'oyyyyyyyyyyo', 'oYYYYYYYgYYo', 'oYYYYYYYgYYo', 'oYYYYYgggggo', 'oYYYYYYYgYYo', 'oYYYYYYYgYYo', '.oooooooooo.', '............'],
  },
  play: {
    pal: { o: '#1d4a2a', g: '#7cff9b' },
    rows: ['............', '..oo........', '..ogoo......', '..ogggoo....', '..ogggggoo..', '..oggggggggo', '..oggggggggo', '..ogggggoo..', '..ogggoo....', '..ogoo......', '..oo........', '............'],
  },
  rename: {
    pal: { o: '#1a1530', y: '#ffb040', r: '#ff5d7a', b: '#f0e6c8' },
    rows: ['..........o.', '.........oro', '........oyyo', '.......oyyo.', '......oyyo..', '.....oyyo...', '....oyyo....', '...oyyo.....', '..obyo......', '..obbo......', '..ooo.......', '............'],
  },
  move: {
    pal: { o: '#1a1530', a: '#b78cff' },
    rows: ['............', '......oo....', '......oao...', '......oaao..', '.ooooooaaao.', '.oaaaaaaaaao', '.oaaaaaaaaao', '.ooooooaaao.', '......oaao..', '......oao...', '......oo....', '............'],
  },
  trash: {
    pal: { o: '#1a1530', d: '#a8a2c4', e: '#6f6893' },
    rows: ['....oooo....', '.oooooooooo.', '.oddddddddo.', '.oooooooooo.', '..odeddedo..', '..odeddedo..', '..odeddedo..', '..odeddedo..', '..odeddedo..', '..oddddddo..', '..oooooooo..', '............'],
  },
  info: {
    pal: { o: '#1a2b5a', b: '#5b8cff', w: '#ffffff' },
    rows: ['...oooooo...', '..obbbbbbo..', '.obbbwwbbbo.', '.obbbbbbbbo.', '.obbwwwbbbo.', '.obbbwwbbbo.', '.obbbwwbbbo.', '.obbbwwbbbo.', '.obbwwwwbbo.', '..obbbbbbo..', '...oooooo...', '............'],
  },
  console: {
    pal: { o: '#1a1530', b: '#b6aedb', s: '#3a3553', g: '#6ec6ff', d: '#2f2a40', r: '#c23b7e' },
    rows: ['..oooooooo..', '.obbbbbbbbo.', '.obssssssbo.', '.obsggggsbo.', '.obsggggsbo.', '.obssssssbo.', '.obbbbbbbbo.', '.obdbbbbrbo.', '.odddbbrbbo.', '.obdbbbbbbo.', '.obbbbbbbbo.', '..oooooooo..'],
  },
};

function svg({ pal, rows }) {
  const h = rows.length, w = Math.max(...rows.map((r) => r.length));
  let rects = '';
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = pal[row[x]];
      if (c) rects += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${c}"/>`;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects}</svg>`;
}

export function installIcons() {
  const url = (name) => `url("data:image/svg+xml,${encodeURIComponent(svg(ICONS[name]))}")`;
  let css = '';
  for (const name of Object.keys(ICONS)) css += `.ico-${name}{background-image:${url(name)}}\n`;
  css += `.ico-game{background-image:${url('cart')}}\n.ico-up{background-image:${url('up')}}\n`;
  css += `.sel-empty-cart,.load-cart{background:${url('cart')} center/contain no-repeat;image-rendering:pixelated}\n`;
  css += `.card-folder{background:${url('folder')} center/contain no-repeat;image-rendering:pixelated}\n.card-folder.up{background-image:${url('up')}}\n`;
  css += `.gitem.folder .gart{background-image:${url('folder')}}\n`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
}
