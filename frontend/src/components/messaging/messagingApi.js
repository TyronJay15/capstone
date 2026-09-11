/**
 * messagingApi — conversation/notification threads for all stakeholders.
 *
 * Returns demo conversation threads keyed by role. Each thread is a messaging
 * style conversation that can later be backed by a real endpoint. All mutations
 * are kept in-memory per session (frontend-only).
 */

let _store = null;

function seed() {
  return {
    student: [
      {
        id: 'th-1',
        subject: 'Missing Research output',
        with: 'Mr. Jose Rizal',
        withRole: 'Subject Teacher',
        folder: 'inbox',
        unread: true,
        messages: [
          { id: 'm1', author: 'Mr. Jose Rizal', mine: false, text: 'Hi Juan, you have a missing Research output for the 2nd grading. Please submit by Friday.', time: '9:14 AM' }
        ]
      },
      {
        id: 'th-2',
        subject: 'Advisory reminder: Card distribution',
        with: 'Mrs. Maria Santos',
        withRole: 'Adviser',
        folder: 'inbox',
        unread: false,
        messages: [
          { id: 'm1', author: 'Mrs. Maria Santos', mine: false, text: 'Report cards will be released this Friday. Please remind your parent to attend.', time: 'Yesterday' },
          { id: 'm2', author: 'You', mine: true, text: 'Noted, thank you po!', time: 'Yesterday' }
        ]
      }
    ],
    adviser: [
      {
        id: 'th-a1',
        subject: 'Re: Card distribution',
        with: 'Juan Dela Cruz',
        withRole: 'Student',
        folder: 'replies',
        unread: true,
        messages: [
          { id: 'm1', author: 'You', mine: true, text: 'Report cards will be released this Friday.', time: 'Yesterday' },
          { id: 'm2', author: 'Juan Dela Cruz', mine: false, text: 'Noted, thank you po!', time: 'Yesterday' }
        ]
      },
      {
        id: 'th-a2',
        subject: 'Incomplete students in Filipino',
        with: 'Mr. Jose Rizal',
        withRole: 'Subject Teacher',
        folder: 'inbox',
        unread: false,
        messages: [
          { id: 'm1', author: 'Mr. Jose Rizal', mine: false, text: '3 students in your advisory are incomplete in Filipino.', time: '2 days ago' }
        ]
      }
    ],
    teacher: [
      {
        id: 'th-t1',
        subject: 'Incomplete students notice',
        with: 'Mrs. Maria Santos',
        withRole: 'Adviser',
        folder: 'sent',
        unread: false,
        messages: [
          { id: 'm1', author: 'You', mine: true, text: '3 students in advisory 12-STEM-A are incomplete in Filipino.', time: '2 days ago' }
        ]
      },
      {
        id: 'th-t2',
        subject: 'Submit missing activity',
        with: 'Bianca Cruz',
        withRole: 'Student',
        folder: 'sent',
        unread: false,
        messages: [
          { id: 'm1', author: 'You', mine: true, text: 'Please submit your missing activity for Research.', time: 'Today' }
        ]
      }
    ],
    parent: [
      {
        id: 'th-p1',
        subject: 'Academic warning: Mathematics',
        with: 'Mrs. Maria Santos',
        withRole: 'Adviser',
        folder: 'inbox',
        unread: true,
        messages: [
          { id: 'm1', author: 'Mrs. Maria Santos', mine: false, text: 'Good day! Juan needs to improve in Mathematics this quarter.', time: '10:02 AM' }
        ]
      }
    ],
    head_teacher: [],
    admin: []
  };
}

function ensure() {
  if (!_store) _store = seed();
  return _store;
}

export function getThreads(role = 'student') {
  return ensure()[role] || [];
}

export function sendReply(role, threadId, text) {
  const threads = getThreads(role);
  const thread = threads.find((t) => t.id === threadId);
  if (!thread) return null;
  thread.messages.push({
    id: `m-${Date.now()}`,
    author: 'You',
    mine: true,
    text,
    time: 'Now'
  });
  thread.unread = false;
  return { ...thread };
}

export function markThreadRead(role, threadId) {
  const thread = getThreads(role).find((t) => t.id === threadId);
  if (thread) thread.unread = false;
}

export function startThread(role, { subject, to, toRole, text }) {
  const threads = getThreads(role);
  const thread = {
    id: `th-${Date.now()}`,
    subject: subject || '(No subject)',
    with: to || 'Recipient',
    withRole: toRole || '',
    folder: 'sent',
    unread: false,
    messages: [{ id: `m-${Date.now()}`, author: 'You', mine: true, text, time: 'Now' }]
  };
  threads.unshift(thread);
  return thread;
}
