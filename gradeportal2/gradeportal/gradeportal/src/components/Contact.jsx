import React from 'react';
import { useCmsContent } from '../hooks/useCmsContent';
import PublicNavbar from './ui/PublicNavbar';
import './Contact.css';

const Contact = () => {
  const content = useCmsContent();
  const { header, contactInfo, departments } = content.contact;

  return (
    <div className="contact-page">
      <PublicNavbar />

      <main className="contact-main">
        <div className="contact-container">
          <div className="contact-header">
            <h1>{header.title}</h1>
            <p className="contact-subtitle">{header.subtitle}</p>
            <p className="contact-description">{header.description}</p>
          </div>

          <div className="contact-content">
            <div className="contact-info-section">
              <div className="contact-card">
                <h2>General Information</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-icon">
                      <i className="fas fa-map-marker-alt"></i>
                    </div>
                    <div className="info-content">
                      <h3>Address</h3>
                      <p>{contactInfo.address}</p>
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-icon">
                      <i className="fas fa-phone"></i>
                    </div>
                    <div className="info-content">
                      <h3>Phone</h3>
                      <p>{contactInfo.phone}</p>
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-icon">
                      <i className="fas fa-envelope"></i>
                    </div>
                    <div className="info-content">
                      <h3>Email</h3>
                      <p>{contactInfo.email}</p>
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-icon">
                      <i className="fas fa-clock"></i>
                    </div>
                    <div className="info-content">
                      <h3>Office Hours</h3>
                      <p>{contactInfo.hours}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="departments-section">
                <h2>Department Contacts</h2>
                <div className="departments-grid">
                  {departments.map((dept) => (
                    <div key={dept.id} className="department-card">
                      <h3>{dept.name}</h3>
                      <div className="dept-contact">
                        <p><i className="fas fa-phone"></i> {dept.phone}</p>
                        <p><i className="fas fa-envelope"></i> {dept.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="contact-form-section">
              <div className="contact-form-card">
                <h2>Send us a Message</h2>
                <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="firstName">First Name</label>
                      <input type="text" id="firstName" name="firstName" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="lastName">Last Name</label>
                      <input type="text" id="lastName" name="lastName" required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input type="email" id="email" name="email" required />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input type="tel" id="phone" name="phone" />
                  </div>

                  <div className="form-group">
                    <label htmlFor="subject">Subject</label>
                    <select id="subject" name="subject" required>
                      <option value="">Select a subject</option>
                      <option value="admission">Admission Inquiry</option>
                      <option value="programs">Program Information</option>
                      <option value="general">General Information</option>
                      <option value="complaint">Complaint</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Message</label>
                    <textarea id="message" name="message" rows="5" required></textarea>
                  </div>

                  <button type="submit" className="btn btn-primary">Send Message</button>
                </form>
              </div>
            </div>
          </div>

          <div className="social-section">
            <h2>Follow Us</h2>
            <div className="social-links">
              <a
                href={contactInfo.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="social-link facebook"
              >
                <i className="fab fa-facebook"></i>
                <span>Facebook</span>
              </a>
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
              <a href={contactInfo.facebook} target="_blank" rel="noopener noreferrer" className="social-link">
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

export default Contact;
