// Roteamento por hash (#/ordens/OS-58231) integrado ao histórico do navegador:
// o botão "voltar" do celular e do navegador volta uma tela dentro do protótipo.
//
// Cada entrada do histórico guarda { depth, scrollY }. `depth` diz quantas telas do app existem
// antes da atual; com ele o botão voltar da interface sabe se pode usar history.back() ou se
// precisa substituir a tela atual pela tela-pai (quando o usuário abriu um link direto).

let routes = [];
let onChange = () => {};
let current = null;
let depth = 0;

// Caminho de cada profundidade do histórico. Fica na sessionStorage para sobreviver a um
// recarregamento no meio de um fluxo (a aba mantém o histórico; a memória da página, não).
const STACK_KEY = `router:stack:${window.location.pathname}`;
const stack = (() => {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(STACK_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
})();

function saveStack() {
  try { window.sessionStorage.setItem(STACK_KEY, JSON.stringify(stack)); } catch { /* sem sessionStorage: só em memória */ }
}

function splitHash(hash) {
  const raw = String(hash || '').replace(/^#\/?/, '');
  const [pathPart, queryPart = ''] = raw.split('?');
  let path;
  try {
    path = decodeURIComponent(pathPart).replace(/\/+$/, '');
  } catch {
    path = null;
  }
  return { path, query: Object.fromEntries(new URLSearchParams(queryPart)) };
}

function match(path) {
  if (path === null) return null;
  const segments = path ? path.split('/') : [];
  for (const route of routes) {
    const parts = route.path ? route.path.split('/') : [];
    if (parts.length !== segments.length) continue;
    const params = {};
    const ok = parts.every((part, i) => {
      if (part.startsWith(':')) {
        params[part.slice(1)] = segments[i];
        return true;
      }
      return part === segments[i];
    });
    if (ok) return { name: route.name, params };
  }
  return null;
}

export function resolve(hash = window.location.hash) {
  const { path, query } = splitHash(hash);
  const found = match(path);
  return found
    ? { name: found.name, params: found.params, query, path }
    : { name: 'notFound', params: {}, query, path: path || '' };
}

export const currentRoute = () => current;

function saveScroll() {
  const entry = window.history.state || {};
  window.history.replaceState({ ...entry, depth, scrollY: window.scrollY }, '');
}

function emit(type, scrollY = 0) {
  const previous = current;
  current = resolve();
  stack[depth] = current.path;
  saveStack();
  onChange(current, { type, previous, scrollY });
}

function handlePop() {
  const next = resolve();
  if (current && next.path === current.path && JSON.stringify(next.query) === JSON.stringify(current.query)) return;
  const entry = window.history.state;
  if (entry && Number.isInteger(entry.depth)) {
    depth = entry.depth;
  } else {
    // Hash alterado à mão (barra de endereço ou link comum): conta como uma tela nova.
    depth += 1;
    window.history.replaceState({ depth }, '');
  }
  emit('pop', entry && entry.scrollY ? entry.scrollY : 0);
}

export function startRouter(routeTable, listener) {
  routes = routeTable;
  onChange = listener;
  if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  const entry = window.history.state;
  depth = entry && Number.isInteger(entry.depth) ? entry.depth : 0;
  if (!entry) {
    window.history.replaceState({ depth }, '');
    stack.length = 0; // aba nova (ou link aberto do zero): histórico anterior não é do app
  }
  window.addEventListener('popstate', handlePop);
  window.addEventListener('hashchange', handlePop); // navegadores que não disparam popstate em hash
  emit('init', entry && entry.scrollY ? entry.scrollY : 0);
}

export function hrefFor(path) {
  return `#/${path}`;
}

export function navigate(path, { replace = false } = {}) {
  if (!replace && window.location.hash === hrefFor(path)) {
    window.scrollTo(0, 0); // já está nesta tela
    return;
  }
  saveScroll();
  if (replace) {
    window.history.replaceState({ depth }, '', hrefFor(path));
  } else {
    depth += 1;
    window.history.pushState({ depth }, '', hrefFor(path));
  }
  stack.length = depth + 1;
  emit(replace ? 'replace' : 'push');
}

// Volta uma tela; se a atual foi aberta por link direto, substitui pela tela-pai.
export function back(fallbackPath = '') {
  if (depth > 0) window.history.back();
  else navigate(fallbackPath, { replace: true });
}

// Volta até uma tela específica do histórico (ex.: depois de salvar um formulário de várias etapas).
export function backTo(path) {
  for (let i = depth - 1; i >= 0; i -= 1) {
    if (stack[i] === undefined) break;
    if (stack[i] === path) {
      window.history.go(i - depth);
      return;
    }
  }
  navigate(path, { replace: true });
}
