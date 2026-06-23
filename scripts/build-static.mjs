import { access, cp, mkdir, rm } from 'node:fs/promises';
import { constants } from 'node:fs';

const outputDirectory = new URL('../dist/', import.meta.url);

const requiredAssets = [
  'index.html',
  'styles.css',
  'main.js',
  'chile-locations.js',
  'favicon.svg',
  'aviso-importante.html',
  'politica-de-privacidad.html',
  'terminos-y-condiciones.html',
  'img'
];

const optionalAssets = [
  'robots.txt',
  'sitemap.xml',
  '404.html'
];

async function exists(path) {
  try {
    await access(new URL(`../${path}`, import.meta.url), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

await rm(outputDirectory, {
  recursive: true,
  force: true
});

await mkdir(outputDirectory, {
  recursive: true
});

for (const asset of requiredAssets) {
  await cp(
    new URL(`../${asset}`, import.meta.url),
    new URL(asset, outputDirectory),
    {
      recursive: true
    }
  );
}

for (const asset of optionalAssets) {
  if (await exists(asset)) {
    await cp(
      new URL(`../${asset}`, import.meta.url),
      new URL(asset, outputDirectory),
      {
        recursive: true
      }
    );
  }
}

console.log('Sitio estático generado en dist/');
