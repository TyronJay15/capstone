import React, { useState } from 'react';
import { EmptyState } from '../common/Cards';
import { getThreads, sendReply, markThreadRead } from './messagingApi';
import '../common/common.css';
import './MessagingCenter.css';

const FOLDERS = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'sent', label: 'Sent' },
  { id: 'replies', label: 'Replies' }
];

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

const MessagingCenter = ({ role = 'student', title = 'Notifications', canCompose = false, onCompose }) => {
  // `version` bumps force a re-read of the in-memory thread store after mutations.
  const [, setVersion] = useState(0);
  const [folder, setFolder] = useState('inbox');
  const [activeId, setActiveId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const threads = getThreads(role);
  const visible = threads.filter((t) => t.folder === folder);
  const active = threads.find((t) => t.id === activeId) || null;

  const counts = FOLDERS.reduce((acc, f) => {
    acc[f.id] = threads.filter((t) => t.folder === f.id && t.unread).length;
    return acc;
  }, {});

  const openThread = (thread) => {
    setActiveId(thread.id);
    markThreadRead(role, thread.id);
    setVersion((v) => v + 1);
  };

  const handleReply = () => {
    if (!replyText.trim() || !active) return;
    sendReply(role, active.id, replyText.trim());
    setReplyText('');
    setVersion((v) => v + 1);
  };

  return (
    <div className="msg-center">
      <div className="msg-sidebar">
        <div className="msg-sidebar-head">
          <span className="msg-title">{title}</span>
          {canCompose ? (
            <button type="button" className="gp-btn-sm is-primary" onClick={onCompose}>
              + New
            </button>
          ) : null}
        </div>
        <div className="msg-folders">
          {FOLDERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`msg-folder ${folder === f.id ? 'is-active' : ''}`}
              onClick={() => {
                setFolder(f.id);
                setActiveId(null);
              }}
            >
              {f.label}
              {counts[f.id] ? <span className="gp-badge is-count">{counts[f.id]}</span> : null}
            </button>
          ))}
        </div>
        <div className="msg-thread-list">
          {visible.length === 0 ? (
            <div className="msg-empty">No messages in {folder}.</div>
          ) : (
            visible.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`msg-thread ${activeId === t.id ? 'is-active' : ''} ${t.unread ? 'is-unread' : ''}`}
                onClick={() => openThread(t)}
              >
                <span className="msg-thread-avatar">{initials(t.with)}</span>
                <span className="msg-thread-main">
                  <span className="msg-thread-with">{t.with}</span>
                  <span className="msg-thread-subject">{t.subject}</span>
                </span>
                {t.unread ? <span className="msg-thread-dot" /> : null}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="msg-conversation">
        {!active ? (
          <EmptyState icon="💬" title="Select a conversation" message="Choose a message on the left to read and reply." />
        ) : (
          <>
            <div className="msg-conv-head">
              <div>
                <div className="msg-conv-subject">{active.subject}</div>
                <div className="msg-conv-with">
                  {active.with} · {active.withRole}
                </div>
              </div>
            </div>
            <div className="msg-bubbles">
              {active.messages.map((m) => (
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
                placeholder="Write a reply…"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleReply();
                }}
              />
              <button type="button" className="btn btn-primary" onClick={handleReply} disabled={!replyText.trim()}>
                Reply
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessagingCenter;
