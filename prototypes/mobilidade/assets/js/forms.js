// Estados iniciais de formulários, filtros de lista e do seletor de local.

import { EMERGENCY_ORDER, NOTE_DEFAULTS } from './config.js';
import { nowForInput } from './utils.js';
import { isLeaf, locationAncestors, locationByCode, locationChildren } from './model.js';

const firstId = (db, table) => (db[table][0] ? db[table][0].id : '');

export const emptyBatch = () => ({ active: false, selected: [] });

export function defaultUi() {
  return {
    notifications: { expanded: [] },
    orders: { tab: 'todas', search: '', batch: emptyBatch() },
    // collapsed: operações recolhidas · panels: painel aberto por operação (relogio | anexos | notas | lupa)
    // closedConfirmations: confirmações recolhidas ('0040:0') · slides: slide atual do carrossel por operação
    orderDetail: { tab: 'operacoes', collapsed: [], panels: {}, closedConfirmations: [], slides: {} },
    myRequests: { tab: 'todas', search: '' },
    notes: { search: '' },
    events: { search: '' },
    eventsGroup: { tab: 'todos', search: '' },
  };
}

export const loginForm = () => ({ username: '', password: '', showPassword: false, errors: {} });

export const requestForm = () => ({ orderCode: '', errors: {} });

export const registrationForm = () => ({ value: '', errors: {} });

// Seleção de pessoas para a operação. `start`: depois de incluir, inicia a operação (fluxo do Play).
export const peopleForm = ({ orderCode, operation, start = false }) => ({ orderCode, operation, start, selected: [], search: '' });

export function emergencyForm(db) {
  const location = locationByCode(EMERGENCY_ORDER.defaultLocationCode);
  return {
    locationCode: location ? location.code : '',
    description: '',
    longText: '',
    startAt: nowForInput(),
    endAt: '',
    planningGroupId: firstId(db, 'planningGroups'),
    workCenterId: firstId(db, 'workCenters'),
    priority: EMERGENCY_ORDER.defaultPriority,
    plantId: firstId(db, 'plants'),
    activityTypeId: firstId(db, 'activityTypes'),
    operations: [],
    errors: {},
  };
}

// A operação herda centro e centro de trabalho escolhidos na ordem.
export function operationForm(emergency) {
  return {
    description: '',
    longText: '',
    plantId: emergency.plantId,
    workCenterId: emergency.workCenterId,
    people: '1',
    errors: {},
  };
}

const toInput = (iso) => (iso ? iso.slice(0, 16) : '');

// Formulário de nota. `note`: edição de nota existente (tipo e número da ordem ficam travados).
// `link`: nota criada a partir de uma operação ({ orderCode, operation, point, locationCode }).
export function noteForm(db, { note = null, link = null } = {}) {
  const base = {
    draftId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    editCode: note ? note.code : null,
    link,
    photoProcessing: false,
    errors: {},
  };
  if (note) {
    return {
      ...base,
      type: note.type,
      orderNumber: note.orderNumber,
      locationCode: note.locationCode,
      description: note.description,
      longText: note.longText,
      startAt: toInput(note.startAt),
      endAt: toInput(note.endAt),
      planningGroupId: note.planningGroupId,
      workCenterId: note.workCenterId,
      failureProbability: note.failureProbability,
      maintenanceImpact: note.maintenanceImpact,
      priority: note.priority,
      photos: (note.photos || []).slice(),
    };
  }
  return {
    ...base,
    type: '',
    orderNumber: '',
    locationCode: link && link.locationCode ? link.locationCode : '',
    description: '',
    longText: '',
    startAt: nowForInput(),
    endAt: '',
    planningGroupId: firstId(db, 'planningGroups'),
    workCenterId: firstId(db, 'workCenters'),
    failureProbability: NOTE_DEFAULTS.failureProbability,
    maintenanceImpact: NOTE_DEFAULTS.maintenanceImpact,
    priority: NOTE_DEFAULTS.priority,
    photos: [],
  };
}

// Níveis com um único filho (ex.: CSA → CSA-ACI1 → CSA-ACI1-SAMA) já abrem expandidos,
// para a árvore começar onde existe escolha a fazer.
function singleChildChain() {
  const chain = [];
  let level = locationChildren(null);
  while (level.length === 1 && !isLeaf(level[0].code)) {
    chain.push(level[0].code);
    level = locationChildren(level[0].code);
  }
  return chain;
}

// Abre a árvore no local já escolhido ou, sem escolha, no primeiro nível com opções.
export function pickerState({ target, selected, returnTo }) {
  const valid = selected && isLeaf(selected) ? selected : '';
  const expanded = valid ? locationAncestors(valid) : singleChildChain();
  return { target, returnTo, selected: valid, expanded, search: '' };
}
