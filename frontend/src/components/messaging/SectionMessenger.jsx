import React, { useState } from 'react';
import { EmptyState } from '../common/Cards';
import { getSections, getSectionStudents } from '../sections/sectionsApi';
import { getConversation, sendMessage } from './sectionMessagingStore';
import '../common/common.css';
import './MessagingCenter.css';
import './SectionMessenger.css';

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

/**
 * Section -> Student List -> Conversation messenger.
 *
 * @param {string} role     'adviser' | 'teacher'
 * @param {string} subject  optional subject label (subject teacher)
 * @param {array}  extraContacts  optional extra contacts (e.g. section adviser for a subject teacher)
 */
const SectionMessenger = ({ role = 'adviser', subject, extraContacts = [] }) => {
  const [, setVersion] = useState(0);
  const [sectionId, setSectionId] = useState(null);
  const [contact, setContact] = useState(null);
  const [text, setText] = useState('');

  const sections = getSections();
  const activeSection = sections.find((s) => s.id === sectionId) || null;

  const students = activeSection
    ? getSectionStudents(activeSection.id, { subject }).map((s) => ({
        id: s.id,
        name: s.name,
        role: 'Student'
      }))
    : [];

  const contacts = activeSection
    ? [...extraContacts.filter((c) => c.sectionId === activeSection.id || !c.sectionId), ...students]
    : [];

  const convo = contact ? getConversation(contact) : null;

  const handleSend = () => {
    if (!text.trim() || !contact) return;
    sendMessage(contact, text);
    setText('');
    setVersion((v) => v + 1);
  };

  return (
    <div className="msg-center sec-msg">
      <div className="msg-sidebar">
        <div className="msg-sidebar-head">
          <span className="msg-title">Messages</span>
        </div>

        {!activeSection ? (
          <div className="sec-msg-list">
            <div className="sec-msg-hint">Select a section</div>
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                className="sec-msg-section"
                onClick={() => {
                  setSectionId(s.id);
                  setContact(null);
                }}
              >
                <span className="sec-msg-section-name">{s.name}</span>
                <span className="sec-msg-section-meta">{s.grade} · {s.strand}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="sec-msg-list">
            <button type="button" className="sec-msg-back" onClick={() => { setSectionId(null); setContact(null); }}>
              ← Sections
            </button>
            <div className="sec-msg-hint">{activeSection.name} · {role === 'teacher' ? subject || 'Subject' : 'Advisory'}</div>
            <div className="msg-thread-list">
              {contacts.length === 0 ? (
                <div className="msg-empty">No recipients in this section.</div>
              ) : (
                contacts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`msg-thread ${contact?.id === c.id ? 'is-active' : ''}`}
                    onClick={() => setContact(c)}
                  >
                    <span className="msg-thread-avatar">{initials(c.name)}</span>
                    <span className="msg-thread-main">
                      <span className="msg-thread-with">{c.name}</span>
                      <span className="msg-thread-subject">{c.role}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="msg-conversation">
        {!convo ? (
          <EmptyState
            icon="💬"
            title="Select a recipient"
            message="Choose a section, then a student to start a conversation."
          />
        ) : (
          <>
            <div className="msg-conv-head">
              <div>
                <div className="msg-conv-subject">{contact.name}</div>
                <div className="msg-conv-with">{contact.role}{activeSection ? ` · ${activeSection.name}` : ''}</div>
              </div>
            </div>
            <div className="msg-bubbles">
              {convo.messages.map((m) => (
                <div key={m.id} className={`msg-bubble ${m.mine ? 'is-mine' : ''}`}>
                  {!m.mine ? <div className="msg-bubble-author">{m.author}</div> : null}
                  <div className="msg-bubble-text">{m.text}</div>
                  <div className="msg-bubble-time">{m.time}</div>
                </div>
              ))}
            </div>
            <div className="msg-reply">
              <input
                className="form-input"
                placeholder="Write a message…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              />
              <button type="button" className="btn btn-primary" onClick={handleSend} disabled={!text.trim()}>
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SectionMessenger;
