#!/usr/bin/env node
// Cria um protótipo novo a partir de templates/prototype e o registra no catálogo.
//
// Uso:
//   npm run new -- <id> "Nome do protótipo" [--mobile] [--cliente "Cliente"] [--projeto "Projeto"]
//
// Exemplo:
//   npm run new -- portal-fornecedores "Portal de Fornecedores" --cliente "Ternium" --projeto "Compras"

import { existsSync } from 'node:fs';
import { cp, readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const TEMPLATE = join(ROOT, 'templates', 'prototype');
const REGISTRY = join(ROOT, 'prototypes', 'registry.json');
const TEXT_FILES = new Set(['.html', '.css', '.js', '.json', '.md', '.svg', '.webmanifest']);

function fail(message) {
  console.error(`✖  ${message}`);
  console.error('   Uso: npm run new -- <id> "Nome do protótipo" [--mobile] [--cliente "Cliente"] [--projeto "Projeto"]');
  process.exit(1);
}

function parseArgs(argv) {
  const positional = [];
  const options = { mobile: false, cliente: '', projeto: '' };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--mobile') options.mobile = true;
    else if (arg === '--cliente' || arg === '--projeto') {
      options[arg.slice(2)] = argv[i + 1] || '';
      i += 1;
    } else positional.push(arg);
  }
  return { id: positional[0], name: positional[1], ...options };
}

async function listFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await listFiles(full));
    else out.push(full);
  }
  return out;
}

const { id, name, mobile, cliente, projeto } = parseArgs(process.argv.slice(2));
if (!id || !name) fail('Informe o id e o nome do protótipo.');
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) fail(`id inválido: "${id}". Use kebab-case: letras minúsculas, números e hífen.`);

const target = join(ROOT, 'prototypes', id);
if (existsSync(target)) fail(`Já existe a pasta prototypes/${id}/.`);

const registry = JSON.parse(await readFile(REGISTRY, 'utf8'));
if (registry.prototypes.some((p) => p.id === id)) fail(`O id "${id}" já está em prototypes/registry.json.`);

const today = new Date().toISOString().slice(0, 10);
const replacements = {
  __ID__: id,
  __NAME__: name,
  __CLIENT__: cliente || 'Cliente',
  __PROJECT__: projeto || name,
  __DATE__: today,
};

await cp(TEMPLATE, target, { recursive: true });
for (const file of await listFiles(target)) {
  if (!TEXT_FILES.has(extname(file))) continue;
  let content = await readFile(file, 'utf8');
  for (const [token, value] of Object.entries(replacements)) content = content.split(token).join(value);
  await writeFile(file, content);
}

registry.prototypes.push({
  id,
  name,
  client: replacements.__CLIENT__,
  project: replacements.__PROJECT__,
  description: 'Descreva em uma ou duas frases o que este protótipo demonstra.',
  platform: mobile ? 'mobile' : 'web',
  version: '0.1.0',
  updatedAt: today,
  path: `prototypes/${id}/`,
  icon: `prototypes/${id}/assets/img/icon.svg`,
  accent: '#2563eb',
  tags: [],
});
await writeFile(REGISTRY, `${JSON.stringify(registry, null, 2)}\n`);

console.log(`✔  Protótipo criado em prototypes/${id}/ e registrado no catálogo.`);
console.log('   Próximos passos:');
console.log(`   1. Ajuste descrição, tags e cor em prototypes/registry.json`);
console.log(`   2. Rode npm run dev e abra http://localhost:3000/prototypes/${id}/`);
console.log(`   3. Documente telas, dados e regras em prototypes/${id}/README.md`);
