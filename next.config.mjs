// Generate a random adjective-noun version name on each build
const adjectives = [
  'amber','azure','bold','bright','calm','cedar','coral','crisp','dusk','ember',
  'fern','flint','frost','gentle','golden','haze','iron','ivory','jade','keen',
  'lush','maple','misty','noble','oaken','pearl','pine','quiet','river','rustic',
  'sage','silk','slate','solar','stone','swift','tidal','velvet','vivid','wild',
];
const nouns = [
  'ash','basalt','birch','bloom','breeze','brook','cliff','crest','dale','dawn',
  'dune','field','flame','glade','grove','haven','heath','hill','isle','knoll',
  'lake','leaf','marsh','mesa','moss','oak','peak','pond','ridge','sage',
  'shore','sky','spruce','stone','vale','wave','wren','willow','wind','wood',
];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const versionName = `${pick(adjectives)}-${pick(nouns)}`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_VERSION_NAME: versionName,
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
