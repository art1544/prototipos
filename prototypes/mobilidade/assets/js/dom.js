// Atualização mínima do DOM ("morph"): compara o HTML novo com o que está na tela e altera só o
// que mudou. Assim, redesenhar a tela a cada digitação não recria o <input> em uso — o que no
// celular quebraria a composição do teclado (acentos, sugestões do Android), o foco e a rolagem.
//
// Elementos com o mesmo id são reaproveitados mesmo que mudem de posição.

function sameNode(a, b) {
  if (a.nodeType !== b.nodeType) return false;
  if (a.nodeType !== Node.ELEMENT_NODE) return true;
  if (a.tagName !== b.tagName) return false;
  const idA = a.getAttribute('id');
  const idB = b.getAttribute('id');
  if ((idA || idB) && idA !== idB) return false;
  if (a.tagName === 'INPUT' && a.getAttribute('type') !== b.getAttribute('type')) return false;
  return true;
}

function syncAttributes(from, to) {
  for (const { name } of [...from.attributes]) {
    if (!to.hasAttribute(name)) from.removeAttribute(name);
  }
  for (const { name, value } of [...to.attributes]) {
    if (from.getAttribute(name) !== value) from.setAttribute(name, value);
  }
}

function syncFormState(from, to) {
  const active = from === document.activeElement;
  if (from.tagName === 'INPUT') {
    if (from.type === 'file') return;
    if (from.type === 'checkbox' || from.type === 'radio') {
      from.checked = to.hasAttribute('checked');
      return;
    }
    const value = to.getAttribute('value') || '';
    if (!active && from.value !== value) from.value = value;
  } else if (from.tagName === 'TEXTAREA') {
    const value = to.value;
    if (!active && from.value !== value) from.value = value;
  } else if (from.tagName === 'SELECT') {
    const selected = to.querySelector('option[selected]') || to.querySelector('option');
    const value = selected ? selected.getAttribute('value') || '' : '';
    if (from.value !== value) from.value = value;
  }
}

function morphNode(from, to) {
  if (from.nodeType !== Node.ELEMENT_NODE) {
    if (from.nodeValue !== to.nodeValue) from.nodeValue = to.nodeValue;
    return;
  }
  syncAttributes(from, to);
  if (from.tagName !== 'TEXTAREA') morphChildren(from, to);
  syncFormState(from, to);
}

function findKeyed(parent, reference) {
  const id = reference.nodeType === Node.ELEMENT_NODE && reference.getAttribute('id');
  if (!id) return null;
  for (const child of parent.children) {
    if (child.id === id && child.tagName === reference.tagName) return child;
  }
  return null;
}

function morphChildren(from, to) {
  let current = from.firstChild;
  let next = to.firstChild;
  while (next) {
    const following = next.nextSibling;
    if (current && sameNode(current, next)) {
      morphNode(current, next);
      current = current.nextSibling;
    } else {
      const keyed = findKeyed(from, next);
      if (keyed && keyed === current) {
        // mesmo id, mas incompatível (ex.: input que trocou de type): substitui
        from.replaceChild(next, current);
        current = next.nextSibling;
      } else if (keyed) {
        from.insertBefore(keyed, current);
        morphNode(keyed, next);
      } else {
        from.insertBefore(next, current); // move o nó novo do template para a tela
      }
    }
    next = following;
  }
  while (current) {
    const after = current.nextSibling;
    from.removeChild(current);
    current = after;
  }
}

export function patch(container, html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  morphChildren(container, template.content);
}
