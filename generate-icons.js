import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dir = join(__dirname, 'public', 'icons');

if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#1e3a5f"/>
  <text x="256" y="340" font-family="Arial,sans-serif" font-size="300" font-weight="700" fill="white" text-anchor="middle">S</text>
</svg>`);

await sharp(svg).resize(192).png().toFile(join(dir, 'icon-192.png'));
console.log('icon-192.png done');
await sharp(svg).resize(512).png().toFile(join(dir, 'icon-512.png'));
console.log('icon-512.png done');
