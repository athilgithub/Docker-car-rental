
import React, { useState } from 'react';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://192.168.37.130:3001/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setForm({ name: '', email: '', message: '' });
        setTimeout(() => setSubmitted(false), 5000);
      } else {
        alert(data.error || 'Failed to send message.');
      }
    } catch (err) {
      alert('Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh logic (preserves user input)
  React.useEffect(() => {
    const fetchContactInfo = () => {
      // TODO: Add API call here to fetch latest contact info if needed
      // Example: fetch('/api/contact-info').then(...)
    };
    const interval = setInterval(fetchContactInfo, 10000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="modern-contact-page">
      {/* Hero Section */}
      <div className="contact-hero">
        <div className="hero-content">
          <h1>Get In Touch</h1>
          <p>We're here to help you with all your car rental needs</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="contact-main-content">
        {/* Contact Information Cards */}
        <div className="contact-info-section">
          <div className="contact-info-grid">
            {/* <div className="info-card">
              <div className="info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <h3>Visit Us</h3>
              <p>Kongu Engineering College<br />Perundurai, Tamil Nadu<br />India</p>
            </div> */}

            <div className="info-card">
              <div className="info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <h3>Call Us</h3>
              <p>+91 6381014350<br />Available 24/7<br />Emergency Support</p>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <h3>Email Us</h3>
              <p>athils.23cse@kongu.edu<br />Response within 2 hours<br />Business Inquiries Welcome</p>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h3>WhatsApp</h3>
              <p>+91 6381014350<br />Quick Responses<br />Media Sharing Supported</p>
            </div>
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="contact-form-section">
          <div className="form-container">
            <div className="form-header">
              <h2>Send us a Message</h2>
              <p>Have a question or need assistance? We'd love to hear from you.</p>
            </div>

            <form className="modern-contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows="6"
                  required
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us how we can help you..."
                ></textarea>
              </div>

              <button type="submit" className="submit-btn" disabled={loading || submitted}>
                {loading ? (
                  <span className="loading-spinner">
                    <svg className="spinner" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="4"></circle>
                      <path d="M4,12a8,8 0 1,1 16,0" fill="none" stroke="currentColor" strokeWidth="4"></path>
                    </svg>
                    Sending...
                  </span>
                ) : submitted ? (
                  <span>✓ Message Sent!</span>
                ) : (
                  <span>Send Message</span>
                )}
              </button>

              {submitted && (
                <div className="success-message">
                  <div className="success-icon">✓</div>
                  <div>
                    <h4>Message Sent Successfully!</h4>
                    <p>Thank you for contacting us. We'll get back to you within 24 hours.</p>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="faq-section-modern">
          <div className="faq-container">
            <div className="faq-header">
              <h2>Frequently Asked Questions</h2>
              <p>Quick answers to common questions about our car rental services</p>
            </div>

            <div className="faq-grid">
              <div className="faq-card">
                <div className="faq-icon">🚗</div>
                <h3>How to Book a Car?</h3>
                <p>Select your preferred vehicle, choose your dates, and complete the secure checkout process. It's that simple!</p>
              </div>

              <div className="faq-card">
                <div className="faq-icon">💳</div>
                <h3>Payment Methods</h3>
                <p>We accept credit/debit cards, UPI, net banking, and digital wallets for your convenience.</p>
              </div>

              <div className="faq-card">
                <div className="faq-icon">🧑‍✈️</div>
                <h3>Driver Services</h3>
                <p>Choose self-drive or hire our professional drivers. All drivers are experienced and background-verified.</p>
              </div>

              <div className="faq-card">
                <div className="faq-icon">🛡️</div>
                <h3>Insurance Coverage</h3>
                <p>All rentals include comprehensive insurance. Additional coverage options available for extra peace of mind.</p>
              </div>

              <div className="faq-card">
                <div className="faq-icon">📄</div>
                <h3>Required Documents</h3>
                <p>Valid driving license, government ID, and payment method. Digital copies accepted for faster processing.</p>
              </div>

              <div className="faq-card">
                <div className="faq-icon">🛠️</div>
                <h3>24/7 Support</h3>
                <p>Round-the-clock roadside assistance and customer support for any issues during your rental period.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;