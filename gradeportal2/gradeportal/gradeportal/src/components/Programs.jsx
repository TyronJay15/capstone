import React from 'react';
import { Link } from 'react-router-dom';
import { useCmsContent } from '../hooks/useCmsContent';
import PublicNavbar from './ui/PublicNavbar';
import './Programs.css';

const Programs = () => {
  const content = useCmsContent();
  const { header, tracks, cta } = content.programs;

  return (
    <div className="programs-page">
      <PublicNavbar />

      <main className="programs-main">
        <div className="programs-container">
          <div className="programs-header">
            <h1>{header.title}</h1>
            <p className="programs-subtitle">{header.subtitle}</p>
            <p className="programs-description">{header.description}</p>
          </div>

          <div className="programs-grid">
            {tracks.map((program) => (
              <div key={program.id} className="program-card">
                <div className="program-header">
                  <h2>{program.title}</h2>
                  <p className="program-description">{program.description}</p>
                </div>

                <div className="strands-container">
                  <h3>Available Strands:</h3>
                  <div className="strands-grid">
                    {program.strands.map((strand) => (
                      <div key={strand.id} className="strand-card">
                        <h4>{strand.name}</h4>
                        <p>{strand.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="programs-cta">
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

export default Programs;
