// Seleção do local de instalação: árvore hierárquica (toque para expandir) ou busca direta.
// Só locais "folha" (sem filhos) podem ser selecionados.

import { esc, icon } from '../utils.js';
import { t } from '../i18n/index.js';
import { state } from '../store.js';
import { isLeaf, locationChildren, locationLabel, searchLeafLocations } from '../model.js';
import { emptyHtml, searchToolbarHtml, subheaderHtml, viewHtml } from './components.js';

function leafHtml(node, level, selected) {
  const isSelected = node.code === selected;
  return `
  <li>
    <button type="button" id="loc-${esc(node.code)}" class="tree-leaf${isSelected ? ' is-selected' : ''}" style="--level:${level}" data-action="selectLocation" data-code="${esc(node.code)}" aria-pressed="${isSelected}">
      <span class="tree-text"><strong>${esc(node.code)}</strong><small>${esc(node.description)}</small></span>
      ${isSelected ? icon('check', { cls: 'tree-leaf__check' }) : ''}
    </button>
  </li>`;
}

function nodeHtml(node, level, picker) {
  if (isLeaf(node.code)) return leafHtml(node, level, picker.selected);
  const expanded = picker.expanded.includes(node.code);
  return `
  <li>
    <button type="button" id="loc-${esc(node.code)}" class="tree-node" style="--level:${level}" data-action="toggleLocation" data-code="${esc(node.code)}" aria-expanded="${expanded}">
      ${icon('chevronRight', { cls: `tree-node__chevron${expanded ? ' is-open' : ''}` })}
      <span class="tree-text"><strong>${esc(node.code)}</strong><small>${esc(node.description)}</small></span>
    </button>
    ${expanded ? `<ul class="tree" role="list">${locationChildren(node.code).map((child) => nodeHtml(child, level + 1, picker)).join('')}</ul>` : ''}
  </li>`;
}

export function locationPickerView() {
  const picker = state.picker;
  const search = picker.search.trim();
  let body;
  if (search) {
    const results = searchLeafLocations(search);
    body = results.length
      ? `<ul class="tree" role="list">${results.map((node) => leafHtml(node, 0, picker.selected)).join('')}</ul>`
      : emptyHtml(t('locationPicker.searchEmpty', { term: search }), { clearPath: 'picker.search' });
  } else {
    body = `<ul class="tree" role="list">${locationChildren(null).map((node) => nodeHtml(node, 0, picker)).join('')}</ul>`;
  }

  return viewHtml(`
    ${subheaderHtml(t('locationPicker.title'), { fallback: picker.returnTo })}
    ${searchToolbarHtml({ id: 'loc-search', path: 'picker.search', placeholder: t('locationPicker.search') })}
    <p class="page-hint">${esc(t('locationPicker.hint'))}</p>
    <div class="page page--tree">${body}</div>
    <div class="action-bar action-bar--stacked">
      <p class="selection__label">${esc(t('locationPicker.selectedLabel'))}</p>
      <p class="selection__value${picker.selected ? '' : ' is-empty'}" aria-live="polite">${esc(picker.selected ? locationLabel(picker.selected) : t('locationPicker.none'))}</p>
      <button type="button" class="btn btn--primary btn--block" data-action="confirmLocation"${picker.selected ? '' : ' disabled'}>${esc(t('locationPicker.confirm'))}</button>
    </div>`, { cls: 'view--form' });
}
