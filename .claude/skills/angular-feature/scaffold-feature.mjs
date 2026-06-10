#!/usr/bin/env node
// Scaffold a standalone Angular component feature. See SKILL.md.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

const toKebab = (s) =>
  s.trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
const toPascal = (kebab) =>
  kebab.split('-').filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join('');

const raw = process.argv[2];
if (!raw) {
  console.error('Usage: node scaffold-feature.mjs "<feature name>"');
  process.exit(1);
}
const kebab = toKebab(raw);
const pascal = toPascal(kebab);
if (!kebab) {
  console.error('Could not derive a valid feature name from:', raw);
  process.exit(1);
}

const findRoot = (start) => {
  let d = start;
  while (d !== dirname(d)) {
    if (existsSync(join(d, 'angular.json'))) return d;
    d = dirname(d);
  }
  return start;
};
const root = findRoot(process.cwd());

const featureDir = join(root, 'src', 'app', 'features', kebab);
if (existsSync(featureDir)) {
  console.error('Feature already exists:', featureDir);
  process.exit(1);
}
mkdirSync(featureDir, { recursive: true });

const replace = (s) => s.replaceAll('__kebab__', kebab).replaceAll('__pascal__', pascal);

const tplDir = join(here, 'templates');
for (const file of readdirSync(tplDir)) {
  const out = join(featureDir, replace(file));
  writeFileSync(out, replace(readFileSync(join(tplDir, file), 'utf8')));
  console.log('  created', join('src/app/features', kebab, replace(file)));
}

// Register a lazy route in app.routes.ts (best-effort).
const routesPath = join(root, 'src', 'app', 'app.routes.ts');
if (existsSync(routesPath)) {
  let routes = readFileSync(routesPath, 'utf8');
  if (!routes.includes(`path: '${kebab}'`)) {
    const entry =
      `  {\n` +
      `    path: '${kebab}',\n` +
      `    loadComponent: () =>\n` +
      `      import('./features/${kebab}/${kebab}').then((m) => m.${pascal}),\n` +
      `  },`;
    routes = routes.replace(/(Routes\s*=\s*\[)/, `$1\n${entry}`);
    writeFileSync(routesPath, routes);
    console.log('  registered route in src/app/app.routes.ts');
  } else {
    console.log('  route already present — skipped');
  }
}

console.log(`\n✓ Feature "${kebab}" scaffolded.`);
console.log('Next: build it out, then `npm run lint` and `ng build`.');
