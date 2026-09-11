/**
 * sectionMessagingStore — frontend-only conversation store for the
 * section-based messenger (Adviser / Subject Teacher).
 *
 * Conversations are kept in memory keyed by contact id. This is a placeholder
 * for a future messaging API; the component shape won't need to change once a
 * real backend is wired in.
 */

const _convos = {};

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function getConversation(contact) {
  if (!contact) return null;
  if (!_convos[contact.id]) {
    _convos[contact.id] = {
      contact,
      messages: [
        {
          id: `seed-${contact.id}`,
          text: `Hello, this is ${contact.name}. You can reach me here anytime.`,
          mine: false,
          author: contact.name,
          time: '9:00 AM'
        }
      ]
    };
  }
  return _convos[contact.id];
}

export function sendMessage(contact, text) {
  if (!contact || !text || !text.trim()) return;
  const convo = getConversation(contact);
  convo.messages.push({
    id: `m-${Date.now()}`,
    text: text.trim(),
    mine: true,
    author: 'You',
    time: nowTime()
  });
}

export function hasUnreadSeed(contactId) {
  const c = _convos[contactId];
  return c ? c.messages.length === 1 : false;
}
