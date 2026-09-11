import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { getProfile, saveProfile, changePassword, getCurrentRole } from './profileApi';
import '../common/common.css';
import './ProfilePanel.css';

function humanize(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\bLrn\b/i, 'LRN')
    .replace(/\bId\b/, 'ID')
    .trim();
}

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

const GROUP_META = {
  personal: { icon: '🪪', title: 'Personal Information' },
  contact: { icon: '📞', title: 'Contact Information' },
  academic: { icon: '🎓' }
};

const GROUP_ORDER = ['personal', 'contact', 'academic'];

// Students/parents see "Academic Information"; staff see "Employment Information".
function academicTitle(role) {
  return role === 'student' || role === 'parent' ? 'Academic Information' : 'Employment Information';
}

function groupTitle(role, key) {
  if (key === 'academic') return academicTitle(role);
  return GROUP_META[key].title;
}

// Which groups a role may edit. Parents are read-only; students cannot edit
// their academic fields (section/adviser are assigned, not self-edited).
function editableGroupsFor(role) {
  if (role === 'parent') return [];
  if (role === 'student') return ['personal', 'contact'];
  return ['personal', 'contact', 'academic'];
}

const EMPTY_PW = { current: '', next: '', confirm: '' };

const ProfilePanel = ({ role }) => {
  const effectiveRole = role || getCurrentRole();
  const [profile, setProfile] = useState(() => getProfile(role));
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(null);

  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState(EMPTY_PW);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  const editableGroups = editableGroupsFor(effectiveRole);
  const canEdit = editableGroups.length > 0;

  const openEditor = () => {
    setDraft(JSON.parse(JSON.stringify(profile)));
    setEditOpen(true);
  };

  const openPassword = () => {
    setPwForm(EMPTY_PW);
    setPwError('');
    setPwSuccess('');
    setPwOpen(true);
  };

  const handleChangePassword = async () => {
    setPwError('');
    setPwSuccess('');
    setPwSaving(true);
    const result = await changePassword({
      currentPassword: pwForm.current,
      newPassword: pwForm.next,
      confirmPassword: pwForm.confirm
    });
    setPwSaving(false);
    if (!result.ok) {
      setPwError(result.error);
      return;
    }
    setPwSuccess(result.message);
    setPwForm(EMPTY_PW);
  };

  const updateDraftField = (group, key, value) => {
    setDraft((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }));
  };

  const handleSave = async () => {
    setProfile(draft);
    setEditOpen(false);
    await saveProfile(effectiveRole, draft);
  };

  return (
    <div className="profile-panel">
      <div className={`profile-cover cover-${profile.cover || 'green'}`} />
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.photoUrl ? (
            <img src={profile.photoUrl} alt={profile.name} />
          ) : (
            <span>{initials(profile.name)}</span>
          )}
        </div>
        <div className="profile-header-row">
          <div className="profile-headline">
            <h2 className="profile-name">{profile.name}</h2>
            <span className="gp-badge is-success">{profile.role}</span>
          </div>
          <div className="profile-actions">
            {canEdit ? (
              <button type="button" className="btn btn-primary profile-edit-btn" onClick={openEditor}>
                Edit Profile
              </button>
            ) : null}
            <button type="button" className="btn btn-secondary profile-edit-btn" onClick={openPassword}>
              Change Password
            </button>
          </div>
        </div>
      </div>

      <div className="profile-groups">
        {GROUP_ORDER.map((key) => {
          const data = profile[key];
          if (!data) return null;
          return (
            <div key={key} className="gp-card profile-group">
              <div className="gp-card-title">
                <span className="gp-card-icon" aria-hidden="true">{GROUP_META[key].icon}</span>
                {groupTitle(effectiveRole, key)}
              </div>
              <dl className="profile-fields">
                {Object.entries(data).map(([k, v]) => (
                  <div key={k} className="profile-field">
                    <dt>{humanize(k)}</dt>
                    <dd>{v || '—'}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>

      <Modal
        open={editOpen}
        title="Edit Profile"
        onClose={() => setEditOpen(false)}
        footer={
          <div className="gp-row" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        }
      >
        {draft ? (
          <div className="profile-edit-sections">
            {editableGroups.map((key, idx) => (
              <fieldset key={key} className="profile-edit-section">
                <legend className="profile-edit-legend">{groupTitle(effectiveRole, key)}</legend>
                <div className="profile-edit-form">
                  {idx === 0 ? (
                    <label className="profile-edit-field">
                      <span>Full Name</span>
                      <input
                        className="form-input"
                        value={draft.name}
                        onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                      />
                    </label>
                  ) : null}
                  {Object.keys(draft[key] || {}).map((fieldKey) => (
                    <label key={fieldKey} className="profile-edit-field">
                      <span>{humanize(fieldKey)}</span>
                      <input
                        className="form-input"
                        value={draft[key][fieldKey] || ''}
                        onChange={(e) => updateDraftField(key, fieldKey, e.target.value)}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={pwOpen}
        title="Change Password"
        onClose={() => setPwOpen(false)}
        footer={
          <div className="gp-row" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setPwOpen(false)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleChangePassword} disabled={pwSaving}>
              {pwSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        }
      >
        <div className="profile-edit-form is-single">
          {pwError ? <div className="profile-pw-error">{pwError}</div> : null}
          {pwSuccess ? <div className="profile-pw-success">{pwSuccess}</div> : null}
          <label className="profile-edit-field">
            <span>Current Password</span>
            <input
              className="form-input"
              type="password"
              value={pwForm.current}
              onChange={(e) => setPwForm((p) => ({ ...p, current: e.target.value }))}
            />
          </label>
          <label className="profile-edit-field">
            <span>New Password</span>
            <input
              className="form-input"
              type="password"
              value={pwForm.next}
              onChange={(e) => setPwForm((p) => ({ ...p, next: e.target.value }))}
            />
          </label>
          <label className="profile-edit-field">
            <span>Confirm New Password</span>
            <input
              className="form-input"
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
            />
          </label>
          <p className="profile-pw-hint">Use at least 8 characters. (Demo current password: password123)</p>
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePanel;
