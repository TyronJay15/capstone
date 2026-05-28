import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCmsContent } from '../hooks/useCmsContent';
import { POST_TYPES, getBulletinPosts, getPostsByType } from '../services/cmsStore';
import PublicNavbar from './ui/PublicNavbar';
import './LandingPage.css';

const LandingPage = () => {
  const content = useCmsContent();
  const { landing } = content;

  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [bulletinTab, setBulletinTab] = useState('Announcements');

  const slides = landing.slides || [];
  const bulletinTabs = useMemo(() => ['Announcements', 'Students', 'Community'], []);

  const filteredBulletins = useMemo(() => {
    const posts = getBulletinPosts(bulletinTab);
    return posts.slice(0, 3).map((post) => ({
      tab: bulletinTab,
      tag: bulletinTab,
      title: post.title,
      body: post.body,
      image: post.image,
      cta: post.cta || 'Read more',
      to: post.linkTo || '/programs'
    }));
  }, [bulletinTab, content]);

  const upcomingEvents = useMemo(() => getPostsByType(POST_TYPES.EVENT).slice(0, 3), [content]);
  const newsItems = useMemo(() => getPostsByType(POST_TYPES.NEWS).slice(0, 3), [content]);
  const featuredAchievements = useMemo(
    () => getPostsByType(POST_TYPES.ACHIEVEMENT).slice(0, 3),
    [content]
  );

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!slides.length) return undefined;
    const id = window.setInterval(() => {
      setActiveSlide((s) => (s + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, [slides.length]);

  const goPrevSlide = () => {
    if (!slides.length) return;
    setActiveSlide((s) => (s - 1 + slides.length) % slides.length);
  };

  const goNextSlide = () => {
    if (!slides.length) return;
    setActiveSlide((s) => (s + 1) % slides.length);
  };

  const currentSlide = slides[activeSlide] || slides[0];

  return (
    <div className="landing-page">
      <PublicNavbar variant="landing" isScrolled={isScrolled} />

      <main className="main-content">
        {currentSlide ? (
          <section className="lp-hero" aria-label="Hero">
            <div className="lp-hero-inner">
              <div className="lp-hero-left">
                <div className="lp-hero-kicker">{currentSlide.kicker}</div>
                <h1 className="lp-hero-title">{currentSlide.title}</h1>
                <p className="lp-hero-body">{currentSlide.body}</p>
                <div className="lp-hero-actions">
                  <Link to={currentSlide.ctaPrimary?.to || '/signup'} className="lp-btn lp-btn-primary">
                    {currentSlide.ctaPrimary?.label || 'Enroll'}
                  </Link>
                  <Link to={currentSlide.ctaSecondary?.to || '/about'} className="lp-btn lp-btn-secondary">
                    {currentSlide.ctaSecondary?.label || 'Learn more'}
                  </Link>
                </div>
                <div className="lp-hero-dots" role="tablist" aria-label="Hero slides">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`lp-dot ${idx === activeSlide ? 'active' : ''}`}
                      onClick={() => setActiveSlide(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      aria-selected={idx === activeSlide}
                      role="tab"
                    />
                  ))}
                </div>
              </div>
              <div className="lp-hero-right" aria-label="Slideshow image">
                <div className="lp-slide-frame">
                  <img src={currentSlide.image} alt={currentSlide.title} className="lp-slide-image" />
                  <div className="lp-slide-caption">
                    <div className="lp-slide-caption-title">{currentSlide.kicker}</div>
                    <div className="lp-slide-caption-body">{currentSlide.title}</div>
                  </div>
                  <button type="button" className="lp-slide-arrow lp-slide-arrow-left" onClick={goPrevSlide} aria-label="Previous slide">
                    ‹
                  </button>
                  <button type="button" className="lp-slide-arrow lp-slide-arrow-right" onClick={goNextSlide} aria-label="Next slide">
                    ›
                  </button>
                </div>
                <div className="lp-slide-thumbs" aria-label="Slide thumbnails">
                  {slides.slice(0, 3).map((s, idx) => (
                    <button
                      key={s.id || s.image}
                      type="button"
                      className={`lp-thumb ${idx === activeSlide ? 'active' : ''}`}
                      onClick={() => setActiveSlide(idx)}
                      aria-label={`Show slide ${idx + 1}`}
                    >
                      <img src={s.image} alt="" className="lp-thumb-img" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="lp-section" aria-label="About">
          <div className="lp-container">
            <div className="lp-section-head">
              <h2 className="lp-section-title">{landing.aboutSection?.title}</h2>
              <p className="lp-section-subtitle">{landing.aboutSection?.subtitle}</p>
            </div>

            <div className="lp-card-grid">
              {(landing.aboutCards || []).map((card) => (
                <Link key={card.id} to={card.linkTo || '/about'} className="lp-card lp-card-with-photo lp-card-clickable">
                  <div className="lp-card-content">
                    <div className="lp-card-icon">{card.icon}</div>
                    <h3 className="lp-card-title">{card.title}</h3>
                    <p className="lp-card-body">{card.body}</p>
                    <div className="lp-card-cta">{card.cta}</div>
                  </div>
                  <div className="lp-card-photo">
                    <img src={card.image} alt={card.title} className="lp-card-photo-img" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {upcomingEvents.length > 0 ? (
          <section className="lp-section lp-section-events" aria-label="Upcoming events">
            <div className="lp-container">
              <div className="lp-section-head">
                <h2 className="lp-section-title">Upcoming Events</h2>
                <p className="lp-section-subtitle">School activities and important dates.</p>
              </div>
              <div className="lp-bulletin-grid">
                {upcomingEvents.map((event) => (
                  <Link key={event.id} to={event.linkTo || '/programs'} className="lp-media-card">
                    <div
                      className="lp-media-thumb"
                      style={event.image ? { '--lp-bulletin-image': `url(${event.image})` } : undefined}
                    />
                    <div className="lp-media-overlay">
                      <div className="lp-media-tag">Event {event.eventDate ? `· ${event.eventDate}` : ''}</div>
                      <div className="lp-media-title">{event.title}</div>
                      <div className="lp-media-body">{event.body}</div>
                      <div className="lp-media-btn">{event.cta || 'View event'}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="lp-section lp-section-green" aria-label="Campus Bulletin">
          <div className="lp-container">
            <div className="lp-bulletin-head">
              <div>
                <h2 className="lp-section-title lp-section-title-invert">{landing.bulletinSection?.title}</h2>
                <p className="lp-section-subtitle lp-section-subtitle-invert">{landing.bulletinSection?.subtitle}</p>
              </div>
              <div className="lp-bulletin-actions">
                <div className="lp-tabs" role="tablist" aria-label="Campus Bulletin categories">
                  {bulletinTabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={`lp-tab ${tab === bulletinTab ? 'active' : ''}`}
                      onClick={() => setBulletinTab(tab)}
                      role="tab"
                      aria-selected={tab === bulletinTab}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <Link to="/programs" className="lp-pill-btn">
                  Explore
                </Link>
              </div>
            </div>

            <div className="lp-bulletin-grid">
              {filteredBulletins.map((item, idx) => (
                <Link key={`${item.tab}-${idx}-${item.title}`} to={item.to} className="lp-media-card">
                  <div
                    className="lp-media-thumb"
                    style={item.image ? { '--lp-bulletin-image': `url(${item.image})` } : undefined}
                  />
                  <div className="lp-media-overlay">
                    <div className="lp-media-tag">{item.tag}</div>
                    <div className="lp-media-title">{item.title}</div>
                    <div className="lp-media-body">{item.body}</div>
                    <div className="lp-media-btn">{item.cta}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {(newsItems.length > 0 || featuredAchievements.length > 0) && (
          <section className="lp-section" aria-label="News and achievements">
            <div className="lp-container">
              {newsItems.length > 0 ? (
                <>
                  <h2 className="lp-section-title">News &amp; Activities</h2>
                  <div className="lp-bulletin-grid lp-news-grid">
                    {newsItems.map((item) => (
                      <Link key={item.id} to={item.linkTo || '/programs'} className="lp-media-card">
                        <div
                          className="lp-media-thumb"
                          style={item.image ? { '--lp-bulletin-image': `url(${item.image})` } : undefined}
                        />
                        <div className="lp-media-overlay">
                          <div className="lp-media-tag">News</div>
                          <div className="lp-media-title">{item.title}</div>
                          <div className="lp-media-body">{item.body}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              ) : null}

              {featuredAchievements.length > 0 ? (
                <>
                  <h2 className="lp-section-title lp-section-title-spaced">Recent Achievements</h2>
                  <div className="lp-bulletin-grid">
                    {featuredAchievements.map((item) => (
                      <Link key={item.id} to={item.linkTo || '/about'} className="lp-media-card">
                        <div
                          className="lp-media-thumb"
                          style={item.image ? { '--lp-bulletin-image': `url(${item.image})` } : undefined}
                        />
                        <div className="lp-media-overlay">
                          <div className="lp-media-tag">Achievement</div>
                          <div className="lp-media-title">{item.title}</div>
                          <div className="lp-media-body">{item.body}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </section>
        )}
      </main>

      <section className="info-banner">
        <div className="banner-container">
          <div className="banner-left">
            <div className="banner-logo-container">
              <img src="/logo/logodampol.jpg" alt="Dampol 1st National Highschool Logo" className="banner-logo" />
            </div>
          </div>
          <div className="banner-right">
            <h1 className="school-title">{landing.banner?.schoolTitle}</h1>
            <p className="admission-text">{landing.banner?.admissionText}</p>
            <p className="description-text">{landing.banner?.description}</p>
            <div className="banner-actions">
              <Link to="/signup" className="btn btn-primary banner-btn">Enroll Now</Link>
              <Link to="/login" className="btn btn-secondary banner-btn">Sign In</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="lp-footer" aria-label="Footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div className="lp-footer-brand">
              <div className="lp-footer-logoRow">
                <img src="/logo/logodampol.jpg" alt="School logo" className="lp-footer-logo" />
                <div>
                  <div className="lp-footer-name">Dampol 1st National High School</div>
                  <div className="lp-footer-sub">Grade Portal</div>
                </div>
              </div>
              <div className="lp-footer-address">
                {landing.footer?.address}
                {landing.footer?.addressNote ? (
                  <>
                    <br />
                    <span className="lp-footer-muted">{landing.footer.addressNote}</span>
                  </>
                ) : null}
              </div>
              <div className="lp-footer-social">
                <a
                  href={landing.footer?.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-footer-link"
                >
                  Facebook Page
                </a>
              </div>
            </div>

            <div className="lp-footer-col">
              <div className="lp-footer-colTitle">Quick Links</div>
              <Link to="/" className="lp-footer-link">Home</Link>
              <Link to="/about" className="lp-footer-link">About</Link>
              <Link to="/programs" className="lp-footer-link">Programs</Link>
              <Link to="/contact" className="lp-footer-link">Contact</Link>
            </div>

            <div className="lp-footer-col">
              <div className="lp-footer-colTitle">For Students</div>
              <Link to="/login" className="lp-footer-link">Sign in</Link>
              <Link to="/signup" className="lp-footer-link">Register</Link>
              <Link to="/programs" className="lp-footer-link">Announcements</Link>
              <Link to="/contact" className="lp-footer-link">Help / Support</Link>
            </div>

            <div className="lp-footer-col">
              <div className="lp-footer-colTitle">Partners</div>
              <a href="https://www.deped.gov.ph/" target="_blank" rel="noopener noreferrer" className="lp-footer-link">
                Department of Education
              </a>
              <div className="lp-footer-partnerRow" aria-label="Partner logos">
                <img src="/logo/deped.png" alt="Department of Education logo" className="lp-partnerLogo" />
              </div>
            </div>
          </div>

          <div className="lp-footer-bottom">
            <div className="lp-footer-muted">© {new Date().getFullYear()} Dampol 1st National High School</div>
            <div className="lp-footer-bottomLinks">
              <Link to="/contact" className="lp-footer-link">Contact</Link>
              <Link to="/about" className="lp-footer-link">About</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
