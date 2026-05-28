import React from 'react';
import { Link } from 'react-router-dom';
import { useCmsContent } from '../hooks/useCmsContent';
import PublicNavbar from './ui/PublicNavbar';
import './About.css';

const About = () => {
  const content = useCmsContent();
  const { header, schoolInfo, history, achievements, features, cta } = content.about;

  return (
    <div className="about-page">
      <PublicNavbar />

      <main className="about-main">
        <div className="about-container">
          <div className="about-header">
            <h1>{header.title}</h1>
            <p className="about-subtitle">
              {header.subtitlePrefix} {schoolInfo.established}
            </p>
            <p className="about-description">{header.description}</p>
          </div>

          <div className="school-info-section">
            <div className="info-grid">
              <div className="info-card">
                <div className="info-icon">
                  <i className="fas fa-graduation-cap"></i>
                </div>
                <h3>Established</h3>
                <p>{schoolInfo.established}</p>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <i className="fas fa-quote-left"></i>
                </div>
                <h3>Motto</h3>
                <p>&quot;{schoolInfo.motto}&quot;</p>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <i className="fas fa-eye"></i>
                </div>
                <h3>Vision</h3>
                <p>{schoolInfo.vision}</p>
              </div>

              <div className="info-card">
                <div className="info-icon">
                  <i className="fas fa-bullseye"></i>
                </div>
                <h3>Mission</h3>
                <p>{schoolInfo.mission}</p>
              </div>
            </div>
          </div>

          <div className="content-sections">
            <div className="section-card">
              <h2>Our History</h2>
              <div className="timeline">
                {history.map((item) => (
                  <div key={item.id} className="timeline-item">
                    <div className="timeline-year">{item.year}</div>
                    <div className="timeline-content">
                      <p>{item.event}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="section-card">
              <h2>Our Achievements</h2>
              <div className="achievements-grid">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="achievement-item">
                    <div className="achievement-icon">
                      <i className="fas fa-trophy"></i>
                    </div>
                    <p>{achievement.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="section-card">
              <h2>Why Choose Dampol 1st?</h2>
              <div className="features-grid">
                {features.map((feature) => (
                  <div key={feature.id} className="feature-item">
                    <div className="feature-icon">
                      <i className={feature.icon}></i>
                    </div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="cta-section">
            <h2>{cta.title}</h2>
            <p>{cta.body}</p>
            <div className="cta-buttons">
              <Link to="/signup" className="btn btn-primary">Apply Now</Link>
              <Link to="/contact" className="btn btn-secondary">Contact Us</Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <div className="footer-container">
          <div className="footer-left">
            <div className="footer-logo-container">
              <img src="/logo/logodampol.jpg" alt="Dampol 1st National Highschool Logo" className="footer-logo" />
              <div className="footer-logo-text">
                <span className="footer-school-name">Dampol 1st National Highschool</span>
              </div>
            </div>
          </div>
          <div className="footer-right">
            <div className="deped-logo-container">
              <img src="/department.jpg" alt="Department of Education Logo" className="deped-logo-image" />
              <span className="deped-name">Department of Education</span>
            </div>
            <div className="social-links">
              <a
                href={content.contact.contactInfo.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
              >
                <i className="fab fa-facebook"></i>
                <span>Follow us on Facebook</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
