import { copyFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const workerSource = require.resolve('maplibre-gl/dist/maplibre-gl-worker.mjs');
const workerDestination = fileURLToPath(new URL('../public/maplibre-gl-worker.mjs', import.meta.url));

await copyFile(workerSource, workerDestination);
