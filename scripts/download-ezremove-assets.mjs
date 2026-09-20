import { mkdir, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(
  new URL('../public/ezremove-video/', import.meta.url)
);
const urls = [
  'https://ezremove.ai/assets/img/ai-video-generator/seedance_v2.png',
  ...['1', '2', '3', '4'].map(
    (name) => `https://ezremove.ai/seo/ai-video-generator/${name}.webp`
  ),
  ...['1', '2', '3', '4', '5'].map(
    (name) => `https://ezremove.ai/seo/ai-video-generator/feature${name}.jpeg`
  ),
  ...['1', '2', '3'].map(
    (name) => `https://ezremove.ai/seo/ai-video-generator/step${name}.jpeg`
  ),
  ...['1', '2', '3', '4', '5', '6'].map(
    (name) => `https://ezremove.ai/seo/ai-video-generator/effect${name}.jpeg`
  ),
  ...['1', '2', '3'].map(
    (name) => `https://ezremove.ai/seo/ai-video-generator/user${name}.jpeg`
  ),
];

await mkdir(root, { recursive: true });

for (const url of urls) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }
  const filename = basename(new URL(url).pathname);
  const output = join(root, filename);
  await writeFile(output, Buffer.from(await response.arrayBuffer()));
  console.log(
    `${filename} ${extname(filename)} ${response.headers.get('content-length') ?? 'unknown'} bytes`
  );
}
