// Notificações: tocar expande o texto e marca como lida.

import { esc, icon } from '../utils.js';
import { formatRelative, t } from '../i18n/index.js';
import { state } from '../store.js';
import { sortedNotifications, unreadCount } from '../model.js';
import { emptyHtml, subheaderHtml, viewHtml } from './components.js';

const TYPE_ICON = { info: 'info', aviso: 'warning', sucesso: 'success' };

function notificationHtml(n, expanded) {
  const title = t(`notificationTemplates.${n.template}.title`);
  const desc = t(`notificationTemplates.${n.template}.desc`, n.vars);
  const classes = ['notif', !n.read && 'is-unread', expanded && 'is-expanded'].filter(Boolean).join(' ');
  return `
  <li>
    <button type="button" id="notif-${n.id}" class="${classes}" data-action="toggleNotification" data-id="${n.id}" aria-expanded="${expanded}">
      <span class="notif__icon notif__icon--${esc(n.type)}">${icon(TYPE_ICON[n.type] || 'info')}</span>
      <span class="notif__body">
        <span class="notif__top">
          <span class="notif__title">${esc(title)}</span>
          <span class="notif__meta">
            <span class="notif__time">${esc(formatRelative(n.createdAt))}</span>
            ${icon('chevronDown', { cls: 'notif__chevron' })}
          </span>
        </span>
        <span class="notif__desc">${esc(desc)}</span>
        ${n.read ? '' : `<span class="notif__dot"><span class="sr-only">${esc(t('notifications.unread'))}</span></span>`}
      </span>
    </button>
  </li>`;
}

export function notificationsView() {
  const items = sortedNotifications();
  const expanded = (state.ui.notifications && state.ui.notifications.expanded) || [];
  const unread = unreadCount();
  return viewHtml(`
    ${subheaderHtml(t('notifications.title'))}
    <div class="page">
      ${unread ? `<div class="list-actions"><button type="button" class="link-btn" data-action="markAllRead">${esc(t('notifications.markAll'))}</button></div>` : ''}
      ${items.length
        ? `<ul class="list" role="list">${items.map((n) => notificationHtml(n, expanded.includes(n.id))).join('')}</ul>`
        : emptyHtml(t('notifications.empty'))}
    </div>`);
}
