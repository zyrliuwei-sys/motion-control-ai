import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const sourceRoot =
  '/Users/wl./Desktop/saas/模版/manuarora700-proactiv-aceternity-c0e9dc32fd207e736e4ceb6c030fd88ac8489d02/public';
const destinationRoot = resolve('public/proactiv');
const assets = [
  'dashboard.png',
  'dashboard-x.png',
  'first.png',
  'second-backup.png',
  'second.png',
  'third.png',
  'fourth-backup.png',
  'avatar.png',
  'avatar.jpeg',
  'logos/netflix.png',
  'logos/google.webp',
  'logos/meta.png',
  'logos/onlyfans.png',
];
const remoteAssets = [
  [
    'trust-1.jpg',
    'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=320&q=80',
  ],
  [
    'trust-2.jpg',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=320&q=80',
  ],
  [
    'trust-3.jpg',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=320&q=80',
  ],
  [
    'trust-4.jpg',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=320&q=80',
  ],
  [
    'trust-5.jpg',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=320&q=80',
  ],
  [
    'trust-6.jpg',
    'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=320&q=80',
  ],
];

await Promise.all(
  assets.map(async (asset) => {
    const destination = resolve(destinationRoot, asset);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(resolve(sourceRoot, asset), destination);
  })
);

for (let start = 0; start < remoteAssets.length; start += 4) {
  await Promise.all(
    remoteAssets.slice(start, start + 4).map(async ([filename, url]) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Unable to download ${url}: ${response.status}`);
      }
      const destination = resolve(destinationRoot, filename);
      await writeFile(destination, Buffer.from(await response.arrayBuffer()));
    })
  );
}

console.log(
  `Copied ${assets.length} local and ${remoteAssets.length} remote reference assets to ${destinationRoot}`
);
