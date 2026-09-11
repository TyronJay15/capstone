import React, { useMemo, useState } from 'react';
import './NotificationCenter.css';

const DEMO_NOTIFICATIONS = [
  {
    id: 1,
    title: 'New grade posted',
    detail: 'Your Science grade for 1st Semester has been updated.',
    time: 'Just now',
    type: 'grade',
    status: 'unread'
  },
  {
    id: 2,
    title: 'Parent-teacher conference',
    detail: 'Scheduled this Friday at 1:00 PM in the AVR.',
    time: '2h ago',
    type: 'announcement',
    status: 'unread'
  },
  {
    id: 3,
    title: 'Enrollment reminder',
    detail: 'Submit your remaining requirements before the cut-off.',
    time: 'Yesterday',
    type: 'reminder',
    status: 'read'
  },
  {
    id: 4,
    title: 'Academic warning cleared',
    detail: 'Great job! Your Math standing is back on track.',
    time: '3 days ago',
    type: 'warning',
    status: 'archived'
  }
];

const FILTERS = [
  { id: 'unread', label: 'Unread' },
  { id: 'read', label: 'Read' },
  { id: 'archived', label: 'Archive' }
];

const TYPE_ICON = {
  grade: '📊',
  announcement: '📣',
  reminder: '⏰',
  warning: '⚠️',
  default: '🔔'
};

const NotificationCenter = ({ notifications: initial, title = 'Notification Center', compact = false }) => {
  const [items, setItems] = useState(() => initial || DEMO_NOTIFICATIONS);
  const [filter, setFilter] = useState('unread');

  const counts = useMemo(
    () => ({
      unread: items.filter((n) => n.status === 'unread').length,
      read: items.filter((n) => n.status === 'read').length,
      archived: items.filter((n) => n.status === 'archived').length
    }),
    [items]
  );

  const visible = useMemo(() => items.filter((n) => n.status === filter), [items, filter]);

  const markAsRead = (id) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'read' } : n)));

  const archive = (id) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'archived' } : n)));

  const restore = (id) =>
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'read' } : n)));

  const markAllRead = () =>
    setItems((prev) => prev.map((n) => (n.status === 'unread' ? { ...n, status: 'read' } : n)));

  return (
    <div className={`notif-center ${compact ? 'is-compact' : ''}`}>
      <div className="notif-header">
        <div className="notif-title">
          <span aria-hidden="true">🔔</span>
          <span>{title}</span>
          {counts.unread > 0 ? <span className="gp-badge is-count">{counts.unread}</span> : null}
        </div>
        {filter === 'unread' && counts.unread > 0 ? (
          <button type="button" className="gp-btn-sm" onClick={markAllRead}>
            Mark all as read
          </button>
        ) : null}
      </div>

      <div className="notif-filters" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={`notif-filter ${filter === f.id ? 'is-active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
            <span className="notif-filter-count">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      <div className="notif-list">
        {visible.length === 0 ? (
          <div className="gp-empty">
            <div className="gp-empty-icon" aria-hidden="true">✅</div>
            <div>No {filter} notifications.</div>
          </div>
        ) : (
          visible.map((n) => (
            <div key={n.id} className={`notif-item is-${n.type || 'default'}`}>
              <span className="notif-item-icon" aria-hidden="true">
                {TYPE_ICON[n.type] || TYPE_ICON.default}
              </span>
              <div className="notif-item-body">
                <div className="notif-item-title">
                  {n.title}
                  {n.status === 'unread' ? <span className="notif-dot" aria-label="unread" /> : null}
                </div>
                <div className="notif-item-detail">{n.detail}</div>
                <div className="notif-item-time">{n.time}</div>
              </div>
              <div className="notif-item-actions">
                {n.status === 'unread' ? (
                  <button type="button" className="gp-btn-sm" onClick={() => markAsRead(n.id)}>
                    Mark as Read
                  </button>
                ) : null}
                {n.status === 'archived' ? (
                  <button type="button" className="gp-btn-sm" onClick={() => restore(n.id)}>
                    Restore
                  </button>
                ) : (
                  <button type="button" className="gp-btn-sm" onClick={() => archive(n.id)}>
                    Archive
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;
