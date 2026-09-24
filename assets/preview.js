// Moldura de celular: carrega um protótipo mobile num iframe com o tamanho de um aparelho real
// e reduz a moldura para caber na janela. Aparelho e orientação ficam na URL (?p=&device=&rotate=1).

const DEVICES = [
  { id: 'compacto', name: 'Compacto · 320 × 640', width: 320, height: 640 },
  { id: 'iphone-se', name: 'iPhone SE · 375 × 667', width: 375, height: 667 },
  { id: 'galaxy-s', name: 'Galaxy S · 360 × 800', width: 360, height: 800 },
  { id: 'iphone-15', name: 'iPhone 15 · 393 × 852', width: 393, height: 852 },
  { id: 'pixel-8', name: 'Pixel 8 · 412 × 915', width: 412, height: 915 },
  { id: 'iphone-pro-max', name: 'iPhone Pro Max · 430 × 932', width: 430, height: 932 },
  { id: 'ipad-mini', name: 'iPad mini · 768 × 1024', width: 768, height: 1024 },
];
const DEFAULT_DEVICE = 'iphone-15';
const FRAME_PADDING = 14;

const params = new URLSearchParams(window.location.search);
const titleEl = document.getElementById('preview-title');
const selectEl = document.getElementById('preview-device');
const rotateEl = document.getElementById('preview-rotate');
const reloadEl = document.getElementById('preview-reload');
const openEl = document.getElementById('preview-open');
const stageEl = document.getElementById('preview-stage');
const frameWrap = document.getElementById('preview-device-frame');
const iframe = document.getElementById('preview-frame');

let state = {
  device: DEVICES.some((d) => d.id === params.get('device')) ? params.get('device') : DEFAULT_DEVICE,
  rotated: params.get('rotate') === '1',
};

selectEl.innerHTML = DEVICES.map((d) => `<option value="${d.id}">${d.name}</option>`).join('');

function syncUrl() {
  const next = new URLSearchParams(window.location.search);
  next.set('device', state.device);
  if (state.rotated) next.set('rotate', '1');
  else next.delete('rotate');
  window.history.replaceState(null, '', `?${next.toString()}`);
}

function layout() {
  const device = DEVICES.find((d) => d.id === state.device);
  const width = state.rotated ? device.height : device.width;
  const height = state.rotated ? device.width : device.height;
  iframe.width = width;
  iframe.height = height;
  const available = stageEl.getBoundingClientRect();
  const scale = Math.min(1, (available.width - 48) / (width + FRAME_PADDING * 2), (available.height - 48) / (height + FRAME_PADDING * 2));
  frameWrap.style.transform = `scale(${Math.max(0.2, scale)})`;
  selectEl.value = state.device;
  rotateEl.setAttribute('aria-pressed', String(state.rotated));
}

function update(patch) {
  state = { ...state, ...patch };
  syncUrl();
  layout();
}

async function init() {
  const id = params.get('p');
  let entry = null;
  try {
    const response = await fetch('prototypes/registry.json', { cache: 'no-cache' });
    const data = await response.json();
    entry = (data.prototypes || []).find((p) => p.id === id) || null;
  } catch (err) {
    console.error('[preview]', err);
  }
  if (!entry) {
    titleEl.textContent = 'Protótipo não encontrado';
    document.title = 'Protótipo não encontrado – Protótipos';
    frameWrap.hidden = true;
    return;
  }
  titleEl.textContent = entry.name;
  document.title = `${entry.name} (moldura de celular) – Protótipos`;
  iframe.title = `Protótipo ${entry.name}`;
  iframe.src = entry.path;
  openEl.href = entry.path;
  layout();
}

selectEl.addEventListener('change', () => update({ device: selectEl.value }));
rotateEl.addEventListener('click', () => update({ rotated: !state.rotated }));
reloadEl.addEventListener('click', () => { if (iframe.contentWindow) iframe.contentWindow.location.reload(); });
window.addEventListener('resize', layout);

init();
