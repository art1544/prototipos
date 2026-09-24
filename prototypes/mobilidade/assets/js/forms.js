// Estados iniciais de formulários, filtros de lista e do seletor de local.

import { EMERGENCY_ORDER, NOTE_DEFAULTS } from './config.js';
import { nowForInput } from './utils.js';
import { isLeaf, locationAncestors, locationByCode, locationChildren } from './model.js';

const firstId = (db, table) => (db[table][0] ? db[table][0].id : '');

export function defaultUi() {
  return {
    notifications: { expanded: [] },
    orders: { tab: 'todas', search: '' },
    orderDetail: { tab: 'operacoes' },
    myRequests: { tab: 'todas', search: '' },
    notes: { search: '' },
    events: { search: '' },
    eventsOrder: { tab: 'todos', search: '' },
  };
}

export const requestForm = () => ({ orderCode: '', errors: {} });

export const registrationForm = () => ({ value: '', errors: {} });

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

export function noteForm(db) {
  return {
    draftId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type: '',
    orderNumber: '',
    locationCode: '',
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
    photoProcessing: false,
    errors: {},
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
