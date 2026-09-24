#!/usr/bin/env node
// Verificações do repositório (rodam no CI e com `npm run check`):
//   1. prototypes/registry.json: campos obrigatórios, ids únicos, pastas existentes;
//   2. cada protótipo: index.html, README.md, data/db.json válido e arquivos referenciados no HTML;
//   3. sintaxe de todos os .js/.mjs (node --check);
//   4. i18n (quando existir assets/js/i18n/): mesmas chaves em todos os idiomas e
//      chaves usadas com t('...') presentes no idioma padrão.

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const REQUIRED_FIELDS = ['id', 'name', 'client', 'project', 'description', 'platform', 'version', 'path', 'icon'];
const PLATFORMS = ['mobile', 'web'];
const IGNORED_DIRS = new Set(['node_modules', '.git', '.vercel', '.claude']);

const errors = [];
const warnings = [];
const rel = (path) => relative(ROOT, path).replaceAll('\\', '/');

async function walk(dir, filter) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full, filter));
    else if (filter(entry.name)) out.push(full);
  }
  return out;
}

async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (err) {
    errors.push(`${rel(path)}: JSON inválido (${err.message})`);
    return null;
  }
}

/* ---------- 1. registro ---------- */

async function checkRegistry() {
  const registryPath = join(ROOT, 'prototypes', 'registry.json');
  const registry = await readJson(registryPath);
  if (!registry) return [];
  if (!Array.isArray(registry.prototypes)) {
    errors.push('prototypes/registry.json: esperado { "prototypes": [...] }');
    return [];
  }
  const ids = new Set();
  for (const [i, p] of registry.prototypes.entries()) {
    const label = `registry.json → prototypes[${i}]${p.id ? ` (${p.id})` : ''}`;
    REQUIRED_FIELDS.filter((field) => !p[field]).forEach((field) => errors.push(`${label}: campo obrigatório ausente: ${field}`));
    if (p.id && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.id)) errors.push(`${label}: id deve ser kebab-case (ex.: meu-prototipo)`);
    if (p.id && ids.has(p.id)) errors.push(`${label}: id duplicado`);
    ids.add(p.id);
    if (p.platform && !PLATFORMS.includes(p.platform)) errors.push(`${label}: platform deve ser ${PLATFORMS.join(' ou ')}`);
    if (p.path && p.path !== `prototypes/${p.id}/`) errors.push(`${label}: path deve ser "prototypes/${p.id}/"`);
    if (p.icon && !existsSync(join(ROOT, p.icon))) errors.push(`${label}: ícone não encontrado: ${p.icon}`);
    if (p.accent && !/^#[0-9a-f]{3,8}$/i.test(p.accent)) errors.push(`${label}: accent deve ser uma cor hexadecimal`);
    if (p.updatedAt && !/^\d{4}-\d{2}-\d{2}$/.test(p.updatedAt)) errors.push(`${label}: updatedAt deve estar no formato AAAA-MM-DD`);
  }

  const folders = (await readdir(join(ROOT, 'prototypes'), { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  folders.filter((name) => !ids.has(name)).forEach((name) => warnings.push(`prototypes/${name}/ não está em registry.json (não aparece no catálogo)`));
  return registry.prototypes.filter((p) => p.id && folders.includes(p.id));
}

/* ---------- 2. estrutura de cada protótipo ---------- */

const LOCAL_REF = /\b(?:src|href)="(?!https?:|data:|mailto:|#|\/\/)([^"]+)"/g;

async function checkPrototype(p) {
  const dir = join(ROOT, 'prototypes', p.id);
  const indexPath = join(dir, 'index.html');
  if (!existsSync(indexPath)) {
    errors.push(`prototypes/${p.id}/index.html não existe`);
    return;
  }
  if (!existsSync(join(dir, 'README.md'))) warnings.push(`prototypes/${p.id}/README.md não existe (documente telas, dados e regras)`);
  if (existsSync(join(dir, 'data', 'db.json'))) {
    const db = await readJson(join(dir, 'data', 'db.json'));
    if (db && (!db._meta || !Number.isInteger(db._meta.schemaVersion))) warnings.push(`prototypes/${p.id}/data/db.json: _meta.schemaVersion ausente`);
  }
  const html = await readFile(indexPath, 'utf8');
  for (const [, ref] of html.matchAll(LOCAL_REF)) {
    const clean = ref.split(/[?#]/)[0];
    if (clean && !existsSync(join(dir, clean))) errors.push(`prototypes/${p.id}/index.html referencia arquivo inexistente: ${ref}`);
  }
}

/* ---------- 3. sintaxe ---------- */

async function checkSyntax() {
  const files = await walk(ROOT, (name) => /\.(m?js)$/.test(name));
  for (const file of files) {
    try {
      execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    } catch (err) {
      errors.push(`${rel(file)}: erro de sintaxe\n${String(err.stderr).trim()}`);
    }
  }
  return files.length;
}

/* ---------- 4. i18n ---------- */

function flatten(obj, prefix = '') {
  return Object.entries(obj).flatMap(([key, value]) => (value && typeof value === 'object'
    ? flatten(value, `${prefix}${key}.`)
    : [`${prefix}${key}`]));
}

async function checkI18n(p) {
  const i18nDir = join(ROOT, 'prototypes', p.id, 'assets', 'js', 'i18n');
  if (!existsSync(i18nDir)) return;
  const localeFiles = (await readdir(i18nDir)).filter((f) => /^[a-z]{2}(-[A-Z]{2})?\.js$/.test(f));
  const locales = {};
  for (const file of localeFiles) {
    const mod = await import(pathToFileURL(join(i18nDir, file)).href);
    locales[file.replace('.js', '')] = new Set(flatten(mod.default));
  }
  const [base, ...others] = Object.keys(locales);
  const reference = locales.pt ? 'pt' : base;
  for (const locale of [base, ...others].filter((l) => l !== reference)) {
    const missing = [...locales[reference]].filter((k) => !locales[locale].has(k));
    const extra = [...locales[locale]].filter((k) => !locales[reference].has(k));
    if (missing.length) errors.push(`${p.id}/i18n/${locale}.js: faltam ${missing.length} chave(s): ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? '…' : ''}`);
    if (extra.length) warnings.push(`${p.id}/i18n/${locale}.js: chaves que não existem em ${reference}.js: ${extra.slice(0, 8).join(', ')}`);
  }

  // Toda string literal no formato 'grupo.chave' (grupo = primeiro nível do dicionário) é tratada
  // como chave de tradução: t('orders.title'), msg('validation.required'), ApiError('errors.x')…
  const namespaces = new Set([...locales[reference]].map((k) => k.split('.')[0]));
  const jsFiles = await walk(join(ROOT, 'prototypes', p.id, 'assets', 'js'), (name) => name.endsWith('.js'));
  const used = new Map();
  for (const file of jsFiles.filter((f) => !f.startsWith(i18nDir))) {
    const source = await readFile(file, 'utf8');
    for (const [, key] of source.matchAll(/'([a-z][A-Za-z]*\.[A-Za-z0-9_.]*[A-Za-z0-9_])'/g)) {
      if (namespaces.has(key.split('.')[0])) used.set(key, rel(file));
    }
  }
  for (const [key, file] of used) {
    if (!locales[reference].has(key)) errors.push(`${file}: chave de tradução inexistente em ${reference}.js: ${key}`);
  }
}

/* ---------- execução ---------- */

const prototypes = await checkRegistry();
for (const p of prototypes) {
  await checkPrototype(p);
  await checkI18n(p);
}
const jsCount = await checkSyntax();
if (!existsSync(join(ROOT, 'index.html'))) errors.push('index.html (catálogo) não existe na raiz');
if ((await stat(join(ROOT, 'vercel.json')).catch(() => null)) === null) warnings.push('vercel.json não encontrado');

warnings.forEach((w) => console.warn(`⚠  ${w}`));
if (errors.length) {
  errors.forEach((e) => console.error(`✖  ${e}`));
  console.error(`\n${errors.length} problema(s) encontrado(s).`);
  process.exit(1);
}
console.log(`✔  ${prototypes.length} protótipo(s) no catálogo, ${jsCount} arquivo(s) JavaScript verificados.`);
