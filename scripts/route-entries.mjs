import { mkdir, readFile, writeFile } from 'node:fs/promises';
// GitHub Pages has no rewrite rules. Real directory entries serve each React route.
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
for (const route of ['about', 'booking', 'ara', 'bendi', 'anais', 'bliss']) {
  const directory = new URL(`../dist/${route}/`, import.meta.url);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('index.html', directory), html);
}
await writeFile(new URL('../dist/404.html', import.meta.url), html);
