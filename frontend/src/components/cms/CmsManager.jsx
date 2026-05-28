import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import FlashBanner from '../ui/FlashBanner';
import Modal from '../ui/Modal';
import {
  POST_TYPES,
  POST_TYPE_LABELS,
  createId,
  deleteMedia,
  deletePost,
  getCmsContent,
  resetCmsToDefaults,
  saveCmsContent,
  subscribeCmsStore,
  uploadMediaFile,
  upsertPost
} from '../../services/cmsStore';
import './CmsManager.css';

const CMS_SECTIONS = [
  { id: 'landing', label: 'Landing Page' },
  { id: 'about', label: 'About Page' },
  { id: 'programs', label: 'Programs Page' },
  { id: 'contact', label: 'Contact Page' },
  { id: POST_TYPES.ANNOUNCEMENT, label: 'Announcements' },
  { id: POST_TYPES.EVENT, label: 'Events' },
  { id: POST_TYPES.ACHIEVEMENT, label: 'Achievements' },
  { id: POST_TYPES.STUDENT, label: 'Student Information' },
  { id: POST_TYPES.COMMUNITY, label: 'Community Updates' },
  { id: POST_TYPES.NEWS, label: 'News & Activities' },
  { id: 'media', label: 'Media Library' }
];

const POST_SECTION_IDS = new Set(Object.values(POST_TYPES));

const emptyPost = (type) => ({
  id: '',
  type,
  title: '',
  body: '',
  image: '',
  linkTo: '/programs',
  cta: 'Read more',
  eventDate: '',
  published: true
});

const CmsManager = () => {
  const [content, setContent] = useState(() => getCmsContent());
  const [activeSection, setActiveSection] = useState('landing');
  const [flash, setFlash] = useState({ kind: 'success', message: '' });
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const fileInputRef = useRef(null);

  const refresh = useCallback(() => setContent(getCmsContent()), []);

  useEffect(() => {
    refresh();
    return subscribeCmsStore(refresh);
  }, [refresh]);

  const showFlash = (kind, message) => {
    setFlash({ kind, message });
    window.setTimeout(() => setFlash({ kind: 'success', message: '' }), 3500);
  };

  const persist = (next) => {
    setContent(next);
    saveCmsContent(next);
    showFlash('success', 'Content saved. Changes are live on the website.');
  };

  const updateLanding = (patch) => persist({ ...content, landing: { ...content.landing, ...patch } });
  const updateAbout = (patch) => persist({ ...content, about: { ...content.about, ...patch } });
  const updatePrograms = (patch) => persist({ ...content, programs: { ...content.programs, ...patch } });
  const updateContact = (patch) => persist({ ...content, contact: { ...content.contact, ...patch } });

  const postsForSection = useMemo(() => {
    if (!POST_SECTION_IDS.has(activeSection)) return [];
    return (content.posts || []).filter((p) => p.type === activeSection);
  }, [content.posts, activeSection]);

  const openNewPost = () => {
    setEditingPost(emptyPost(activeSection));
    setPostModalOpen(true);
  };

  const openEditPost = (post) => {
    setEditingPost({ ...post });
    setPostModalOpen(true);
  };

  const savePost = () => {
    if (!editingPost?.title?.trim()) {
      showFlash('error', 'Title is required.');
      return;
    }
    upsertPost({
      ...editingPost,
      id: editingPost.id || createId('post'),
      type: activeSection
    });
    setPostModalOpen(false);
    setEditingPost(null);
    refresh();
    showFlash('success', 'Post saved.');
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadMediaFile(file);
      refresh();
      showFlash('success', `Uploaded ${file.name}`);
    } catch (err) {
      showFlash('error', err.message || 'Upload failed.');
    }
    e.target.value = '';
  };

  const renderField = (label, children) => (
    <label className="cms-field">
      <span className="cms-field-label">{label}</span>
      {children}
    </label>
  );

  const renderLandingEditor = () => (
    <div className="cms-panel">
      <h2 className="cms-panel-title">Landing Page</h2>
      <p className="cms-panel-desc">Hero slides, banner, and homepage highlights.</p>

      <h3 className="cms-subtitle">Admission banner</h3>
      <div className="cms-grid">
        {renderField(
          'School title',
          <input
            className="cms-input"
            value={content.landing.banner.schoolTitle}
            onChange={(e) =>
              updateLanding({ banner: { ...content.landing.banner, schoolTitle: e.target.value } })
            }
          />
        )}
        {renderField(
          'Admission line',
          <input
            className="cms-input"
            value={content.landing.banner.admissionText}
            onChange={(e) =>
              updateLanding({ banner: { ...content.landing.banner, admissionText: e.target.value } })
            }
          />
        )}
        {renderField(
          'Description',
          <textarea
            className="cms-textarea"
            rows={3}
            value={content.landing.banner.description}
            onChange={(e) =>
              updateLanding({ banner: { ...content.landing.banner, description: e.target.value } })
            }
          />
        )}
      </div>

      <h3 className="cms-subtitle">Hero slides</h3>
      {(content.landing.slides || []).map((slide, index) => (
        <div key={slide.id} className="cms-card">
          <div className="cms-card-head">
            <strong>Slide {index + 1}</strong>
            <button
              type="button"
              className="cms-btn cms-btn-danger cms-btn-sm"
              onClick={() => {
                const slides = content.landing.slides.filter((s) => s.id !== slide.id);
                updateLanding({ slides });
              }}
            >
              Remove
            </button>
          </div>
          <div className="cms-grid">
            {renderField(
              'Kicker',
              <input
                className="cms-input"
                value={slide.kicker}
                onChange={(e) => {
                  const slides = content.landing.slides.map((s) =>
                    s.id === slide.id ? { ...s, kicker: e.target.value } : s
                  );
                  updateLanding({ slides });
                }}
              />
            )}
            {renderField(
              'Title',
              <input
                className="cms-input"
                value={slide.title}
                onChange={(e) => {
                  const slides = content.landing.slides.map((s) =>
                    s.id === slide.id ? { ...s, title: e.target.value } : s
                  );
                  updateLanding({ slides });
                }}
              />
            )}
            {renderField(
              'Body',
              <textarea
                className="cms-textarea"
                rows={2}
                value={slide.body}
                onChange={(e) => {
                  const slides = content.landing.slides.map((s) =>
                    s.id === slide.id ? { ...s, body: e.target.value } : s
                  );
                  updateLanding({ slides });
                }}
              />
            )}
            {renderField(
              'Image URL',
              <input
                className="cms-input"
                value={slide.image}
                onChange={(e) => {
                  const slides = content.landing.slides.map((s) =>
                    s.id === slide.id ? { ...s, image: e.target.value } : s
                  );
                  updateLanding({ slides });
                }}
              />
            )}
          </div>
        </div>
      ))}
      <button
        type="button"
        className="cms-btn cms-btn-secondary"
        onClick={() =>
          updateLanding({
            slides: [
              ...content.landing.slides,
              {
                id: createId('slide'),
                kicker: 'New slide',
                title: 'Title',
                body: 'Description',
                image: '/landingpage/damo.jpg',
                ctaPrimary: { to: '/signup', label: 'Enroll' },
                ctaSecondary: { to: '/about', label: 'Learn more' }
              }
            ]
          })
        }
      >
        Add slide
      </button>

      <h3 className="cms-subtitle">Mission / Vision cards</h3>
      {(content.landing.aboutCards || []).map((card) => (
        <div key={card.id} className="cms-card">
          <div className="cms-grid">
            {renderField(
              'Title',
              <input
                className="cms-input"
                value={card.title}
                onChange={(e) => {
                  const aboutCards = content.landing.aboutCards.map((c) =>
                    c.id === card.id ? { ...c, title: e.target.value } : c
                  );
                  updateLanding({ aboutCards });
                }}
              />
            )}
            {renderField(
              'Body',
              <textarea
                className="cms-textarea"
                rows={2}
                value={card.body}
                onChange={(e) => {
                  const aboutCards = content.landing.aboutCards.map((c) =>
                    c.id === card.id ? { ...c, body: e.target.value } : c
                  );
                  updateLanding({ aboutCards });
                }}
              />
            )}
            {renderField(
              'Image URL',
              <input
                className="cms-input"
                value={card.image}
                onChange={(e) => {
                  const aboutCards = content.landing.aboutCards.map((c) =>
                    c.id === card.id ? { ...c, image: e.target.value } : c
                  );
                  updateLanding({ aboutCards });
                }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderAboutEditor = () => (
    <div className="cms-panel">
      <h2 className="cms-panel-title">About Page</h2>
      <div className="cms-grid">
        {renderField(
          'Page title',
          <input
            className="cms-input"
            value={content.about.header.title}
            onChange={(e) =>
              updateAbout({ header: { ...content.about.header, title: e.target.value } })
            }
          />
        )}
        {renderField(
          'Intro description',
          <textarea
            className="cms-textarea"
            rows={3}
            value={content.about.header.description}
            onChange={(e) =>
              updateAbout({ header: { ...content.about.header, description: e.target.value } })
            }
          />
        )}
        {renderField(
          'Established year',
          <input
            className="cms-input"
            value={content.about.schoolInfo.established}
            onChange={(e) =>
              updateAbout({ schoolInfo: { ...content.about.schoolInfo, established: e.target.value } })
            }
          />
        )}
        {renderField(
          'Motto',
          <input
            className="cms-input"
            value={content.about.schoolInfo.motto}
            onChange={(e) =>
              updateAbout({ schoolInfo: { ...content.about.schoolInfo, motto: e.target.value } })
            }
          />
        )}
        {renderField(
          'Vision',
          <textarea
            className="cms-textarea"
            rows={3}
            value={content.about.schoolInfo.vision}
            onChange={(e) =>
              updateAbout({ schoolInfo: { ...content.about.schoolInfo, vision: e.target.value } })
            }
          />
        )}
        {renderField(
          'Mission',
          <textarea
            className="cms-textarea"
            rows={3}
            value={content.about.schoolInfo.mission}
            onChange={(e) =>
              updateAbout({ schoolInfo: { ...content.about.schoolInfo, mission: e.target.value } })
            }
          />
        )}
      </div>

      <h3 className="cms-subtitle">History timeline</h3>
      {(content.about.history || []).map((item) => (
        <div key={item.id} className="cms-card cms-card-inline">
          <input
            className="cms-input cms-input-sm"
            value={item.year}
            placeholder="Year"
            onChange={(e) => {
              const history = content.about.history.map((h) =>
                h.id === item.id ? { ...h, year: e.target.value } : h
              );
              updateAbout({ history });
            }}
          />
          <input
            className="cms-input"
            value={item.event}
            placeholder="Event"
            onChange={(e) => {
              const history = content.about.history.map((h) =>
                h.id === item.id ? { ...h, event: e.target.value } : h
              );
              updateAbout({ history });
            }}
          />
          <button
            type="button"
            className="cms-btn cms-btn-danger cms-btn-sm"
            onClick={() => updateAbout({ history: content.about.history.filter((h) => h.id !== item.id) })}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className="cms-btn cms-btn-secondary"
        onClick={() =>
          updateAbout({
            history: [...content.about.history, { id: createId('h'), year: '', event: '' }]
          })
        }
      >
        Add history entry
      </button>

      <h3 className="cms-subtitle">Achievement highlights (About page)</h3>
      {(content.about.achievements || []).map((item) => (
        <div key={item.id} className="cms-card cms-card-inline">
          <input
            className="cms-input"
            value={item.text}
            onChange={(e) => {
              const achievements = content.about.achievements.map((a) =>
                a.id === item.id ? { ...a, text: e.target.value } : a
              );
              updateAbout({ achievements });
            }}
          />
          <button
            type="button"
            className="cms-btn cms-btn-danger cms-btn-sm"
            onClick={() =>
              updateAbout({ achievements: content.about.achievements.filter((a) => a.id !== item.id) })
            }
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className="cms-btn cms-btn-secondary"
        onClick={() =>
          updateAbout({
            achievements: [...content.about.achievements, { id: createId('a'), text: '' }]
          })
        }
      >
        Add achievement
      </button>
    </div>
  );

  const renderProgramsEditor = () => (
    <div className="cms-panel">
      <h2 className="cms-panel-title">Programs Page</h2>
      <div className="cms-grid">
        {renderField(
          'Page title',
          <input
            className="cms-input"
            value={content.programs.header.title}
            onChange={(e) =>
              updatePrograms({ header: { ...content.programs.header, title: e.target.value } })
            }
          />
        )}
        {renderField(
          'Subtitle',
          <input
            className="cms-input"
            value={content.programs.header.subtitle}
            onChange={(e) =>
              updatePrograms({ header: { ...content.programs.header, subtitle: e.target.value } })
            }
          />
        )}
        {renderField(
          'Description',
          <textarea
            className="cms-textarea"
            rows={3}
            value={content.programs.header.description}
            onChange={(e) =>
              updatePrograms({ header: { ...content.programs.header, description: e.target.value } })
            }
          />
        )}
      </div>
      {(content.programs.tracks || []).map((track) => (
        <div key={track.id} className="cms-card">
          <h3 className="cms-subtitle">{track.title}</h3>
          {renderField(
            'Track description',
            <textarea
              className="cms-textarea"
              rows={2}
              value={track.description}
              onChange={(e) => {
                const tracks = content.programs.tracks.map((t) =>
                  t.id === track.id ? { ...t, description: e.target.value } : t
                );
                updatePrograms({ tracks });
              }}
            />
          )}
          {(track.strands || []).map((strand) => (
            <div key={strand.id} className="cms-strand">
              <input
                className="cms-input"
                value={strand.name}
                onChange={(e) => {
                  const tracks = content.programs.tracks.map((t) =>
                    t.id === track.id
                      ? {
                          ...t,
                          strands: t.strands.map((s) =>
                            s.id === strand.id ? { ...s, name: e.target.value } : s
                          )
                        }
                      : t
                  );
                  updatePrograms({ tracks });
                }}
              />
              <textarea
                className="cms-textarea"
                rows={2}
                value={strand.description}
                onChange={(e) => {
                  const tracks = content.programs.tracks.map((t) =>
                    t.id === track.id
                      ? {
                          ...t,
                          strands: t.strands.map((s) =>
                            s.id === strand.id ? { ...s, description: e.target.value } : s
                          )
                        }
                      : t
                  );
                  updatePrograms({ tracks });
                }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const renderContactEditor = () => (
    <div className="cms-panel">
      <h2 className="cms-panel-title">Contact Page</h2>
      <div className="cms-grid">
        {Object.entries(content.contact.contactInfo).map(([key, value]) =>
          renderField(
            key.charAt(0).toUpperCase() + key.slice(1),
            <input
              className="cms-input"
              value={value}
              onChange={(e) =>
                updateContact({
                  contactInfo: { ...content.contact.contactInfo, [key]: e.target.value }
                })
              }
            />
          )
        )}
      </div>
      <h3 className="cms-subtitle">Departments</h3>
      {(content.contact.departments || []).map((dept) => (
        <div key={dept.id} className="cms-card">
          <div className="cms-grid">
            {renderField(
              'Name',
              <input
                className="cms-input"
                value={dept.name}
                onChange={(e) => {
                  const departments = content.contact.departments.map((d) =>
                    d.id === dept.id ? { ...d, name: e.target.value } : d
                  );
                  updateContact({ departments });
                }}
              />
            )}
            {renderField(
              'Phone',
              <input
                className="cms-input"
                value={dept.phone}
                onChange={(e) => {
                  const departments = content.contact.departments.map((d) =>
                    d.id === dept.id ? { ...d, phone: e.target.value } : d
                  );
                  updateContact({ departments });
                }}
              />
            )}
            {renderField(
              'Email',
              <input
                className="cms-input"
                value={dept.email}
                onChange={(e) => {
                  const departments = content.contact.departments.map((d) =>
                    d.id === dept.id ? { ...d, email: e.target.value } : d
                  );
                  updateContact({ departments });
                }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderPostsEditor = () => (
    <div className="cms-panel">
      <h2 className="cms-panel-title">{POST_TYPE_LABELS[activeSection]}</h2>
      <p className="cms-panel-desc">Published items appear on the landing page bulletin and related sections.</p>
      <div className="cms-toolbar">
        <button type="button" className="cms-btn cms-btn-primary" onClick={openNewPost}>
          Add new
        </button>
      </div>
      <div className="cms-post-list">
        {postsForSection.length === 0 ? (
          <div className="cms-empty">No items yet. Click &quot;Add new&quot; to create one.</div>
        ) : (
          postsForSection.map((post) => (
            <div key={post.id} className="cms-post-item">
              <div className="cms-post-thumb">
                {post.image ? <img src={post.image} alt="" /> : <span>No image</span>}
              </div>
              <div className="cms-post-body">
                <div className="cms-post-title">{post.title}</div>
                <div className="cms-post-meta">
                  {post.published === false ? 'Draft' : 'Published'}
                  {post.eventDate ? ` · ${post.eventDate}` : ''}
                </div>
                <p className="cms-post-excerpt">{post.body}</p>
              </div>
              <div className="cms-post-actions">
                <button type="button" className="cms-btn cms-btn-secondary cms-btn-sm" onClick={() => openEditPost(post)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="cms-btn cms-btn-danger cms-btn-sm"
                  onClick={() => {
                    deletePost(post.id);
                    refresh();
                    showFlash('success', 'Deleted.');
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderMediaEditor = () => (
    <div className="cms-panel">
      <h2 className="cms-panel-title">Media Library</h2>
      <p className="cms-panel-desc">Upload images (max 2MB). Copy the URL into any content field.</p>
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleMediaUpload} />
      <button type="button" className="cms-btn cms-btn-primary" onClick={() => fileInputRef.current?.click()}>
        Upload image
      </button>
      <div className="cms-media-grid">
        {(content.mediaLibrary || []).map((item) => (
          <div key={item.id} className="cms-media-item">
            <img src={item.url} alt={item.name} />
            <div className="cms-media-name">{item.name}</div>
            <input className="cms-input cms-input-sm" readOnly value={item.url} onFocus={(e) => e.target.select()} />
            <button
              type="button"
              className="cms-btn cms-btn-danger cms-btn-sm"
              onClick={() => {
                deleteMedia(item.id);
                refresh();
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEditor = () => {
    if (activeSection === 'landing') return renderLandingEditor();
    if (activeSection === 'about') return renderAboutEditor();
    if (activeSection === 'programs') return renderProgramsEditor();
    if (activeSection === 'contact') return renderContactEditor();
    if (activeSection === 'media') return renderMediaEditor();
    if (POST_SECTION_IDS.has(activeSection)) return renderPostsEditor();
    return null;
  };

  return (
    <div className="cms-manager">
      <div className="cms-header">
        <div>
          <h1 className="cms-title">Website CMS</h1>
          <p className="cms-subline">Manage all public website content. Changes save instantly.</p>
        </div>
        <div className="cms-header-actions">
          <Link to="/" target="_blank" rel="noreferrer" className="cms-btn cms-btn-secondary">
            View website
          </Link>
          <button
            type="button"
            className="cms-btn cms-btn-danger"
            onClick={() => {
              if (window.confirm('Reset all website content to defaults? This cannot be undone.')) {
                resetCmsToDefaults();
                refresh();
                showFlash('success', 'Content reset to defaults.');
              }
            }}
          >
            Reset defaults
          </button>
        </div>
      </div>

      <FlashBanner kind={flash.kind} message={flash.message} onDismiss={() => setFlash({ kind: 'success', message: '' })} />

      <div className="cms-layout">
        <nav className="cms-nav">
          {CMS_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`cms-nav-item ${activeSection === section.id ? 'is-active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>
        <div className="cms-main">{renderEditor()}</div>
      </div>

      <Modal open={postModalOpen} title={editingPost?.id ? 'Edit item' : 'New item'} onClose={() => setPostModalOpen(false)}>
        {editingPost ? (
          <div className="cms-modal-form">
            {renderField(
              'Title',
              <input
                className="cms-input"
                value={editingPost.title}
                onChange={(e) => setEditingPost((p) => ({ ...p, title: e.target.value }))}
              />
            )}
            {renderField(
              'Body',
              <textarea
                className="cms-textarea"
                rows={4}
                value={editingPost.body}
                onChange={(e) => setEditingPost((p) => ({ ...p, body: e.target.value }))}
              />
            )}
            {activeSection === POST_TYPES.EVENT
              ? renderField(
                  'Event date',
                  <input
                    type="date"
                    className="cms-input"
                    value={editingPost.eventDate || ''}
                    onChange={(e) => setEditingPost((p) => ({ ...p, eventDate: e.target.value }))}
                  />
                )
              : null}
            {renderField(
              'Image URL (or paste from Media Library)',
              <input
                className="cms-input"
                value={editingPost.image}
                onChange={(e) => setEditingPost((p) => ({ ...p, image: e.target.value }))}
              />
            )}
            {renderField(
              'Link path',
              <input
                className="cms-input"
                value={editingPost.linkTo}
                onChange={(e) => setEditingPost((p) => ({ ...p, linkTo: e.target.value }))}
              />
            )}
            {renderField(
              'Button label',
              <input
                className="cms-input"
                value={editingPost.cta}
                onChange={(e) => setEditingPost((p) => ({ ...p, cta: e.target.value }))}
              />
            )}
            <label className="cms-checkbox">
              <input
                type="checkbox"
                checked={editingPost.published !== false}
                onChange={(e) => setEditingPost((p) => ({ ...p, published: e.target.checked }))}
              />
              Published (visible on website)
            </label>
            <div className="cms-modal-actions">
              <button type="button" className="cms-btn cms-btn-primary" onClick={savePost}>
                Save
              </button>
              <button type="button" className="cms-btn cms-btn-secondary" onClick={() => setPostModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default CmsManager;
