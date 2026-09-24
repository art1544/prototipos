// Estado global da interface. Toda alteração passa por setState (redesenha a tela)
// ou por assignState (só atualiza, sem redesenhar — usado ao digitar em campos).

export let state = {
  status: 'loading', // loading | ready | error
  bootError: null,
  db: null,
  route: null, // { name, path, params, query }
  network: 'boa',
  busy: {}, // operações assíncronas em andamento, por chave (evita envio duplicado)
  ui: {},
  forms: {},
  picker: null,
};

const listeners = new Set();

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function assignState(patch) {
  state = { ...state, ...patch };
}

export function setState(patch) {
  assignState(patch);
  listeners.forEach((listener) => listener(state));
}

// Caminhos em notação de ponto a partir da raiz do estado: 'forms.note.description'.
export function getPath(path) {
  return path.split('.').reduce((node, key) => (node == null ? undefined : node[key]), state);
}

function setIn(target, [key, ...rest], value) {
  const base = target && typeof target === 'object' ? target : {};
  return { ...base, [key]: rest.length ? setIn(base[key], rest, value) : value };
}

export function setPath(path, value, { silent = false } = {}) {
  const next = setIn(state, path.split('.'), value);
  if (silent) assignState(next);
  else setState(next);
}

// Mescla campos num objeto do estado: mergePath('forms.note', { errors: {} }).
export function mergePath(path, patch, options) {
  setPath(path, { ...(getPath(path) || {}), ...patch }, options);
}

export function setBusy(key, value) {
  const busy = { ...state.busy };
  if (value) busy[key] = true;
  else delete busy[key];
  setState({ busy });
}

export const isBusy = (key) => !!state.busy[key];
