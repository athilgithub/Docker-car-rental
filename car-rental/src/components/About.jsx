import React from 'react';

const About = () => {
  const teamMembers = [
    {
      id: 1,
      name: 'Anish Krishna',
      position: 'Project Lead',
      image: 'https://via.placeholder.com/200x200?text=Arun',
      description: 'Coordinates the team and manages project milestones.'
    },
    {
      id: 2,
      name: 'AtHiL ',
      position: 'Frontend Developer',
      image: 'https://via.placeholder.com/200x200?text=Priya',
      description: 'Designs and develops the user interface.'
    },
    {
      id: 3,
      name: 'Deva',
      position: 'Backend Developer',
      image: 'https://via.placeholder.com/200x200?text=Rahul',
      description: 'Builds and maintains the server and APIs.'
    },
  ];

  return (
    <div className="about-page">
      {/* Header Section */}
      {/* <section className="page-header">
        <div className="container">
          <div className="header-content">
            <h1>About Us</h1>
            <p>Learn more about our car rental project and the passionate team behind it</p>
          </div>
        </div>
      </section> */}

      {/* Hero Section */}
      <section className="about-hero">
        <div className="container">
          <div className="hero-content">
            <h1>About Our Car Rental Project</h1>
            <p>
              Welcome! We are a group of students from Tamil Nadu, passionate about technology and innovation.
              This car rental application is our final year project, designed to make booking cars easy and reliable for everyone.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="mission-section">
        <div className="container">
          <div className="mission-grid">
            <div className="mission-card">
              <div className="mission-icon">🎯</div>
              <h3>Our Mission</h3>
              <p>
                To create a simple and effective car rental platform for students and local residents.
              </p>
            </div>
            <div className="mission-card">
              <div className="mission-icon">💡</div>
              <h3>What We Learned</h3>
              <p>
                Teamwork, web development, problem-solving, and project management.
              </p>
            </div>
            <div className="mission-card">
              <div className="mission-icon">🤝</div>
              <h3>Our Values</h3>
              <p>
                Collaboration, learning, and making a positive impact in our community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <div className="container">
          <h2 className="section-title">Meet Our Team</h2>
          <p className="section-description">
            Our dedicated team of students working together to create an innovative car rental solution
          </p>
          <div className="team-grid">
            {teamMembers.map(member => (
              <div key={member.id} className="team-card">
                <div className="team-image">
                  <img src={member.image} alt={member.name} />
                </div>
                <div className="team-info">
                  <h3 className="team-name">{member.name}</h3>
                  <p className="team-position">{member.position}</p>
                  <p className="team-description">{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Stats */}
      <section className="stats-section">
        <div className="container">
          <h2 className="section-title">Project Statistics</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">3</div>
              <div className="stat-label">Team Members</div>
              <div className="stat-description">Dedicated developers working together</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">6</div>
              <div className="stat-label">Months of Work</div>
              <div className="stat-description">Continuous development and testing</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">100+</div>
              <div className="stat-label">Hours Coding</div>
              <div className="stat-description">Time invested in building this app</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">20+</div>
              <div className="stat-label">Car Models</div>
              <div className="stat-description">Variety of vehicles available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="why-choose-us">
        <div className="container">
          <h2 className="section-title">Why Use Our App?</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">🚗</div>
              <h3>Easy Booking</h3>
              <p>Book your car in just a few clicks.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">💰</div>
              <h3>Affordable Prices</h3>
              <p>Great deals for students and families.</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🛡️</div>
              <h3>Safe & Secure</h3>
              <p>Your data and bookings are protected.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Thank You for Visiting!</h2>
            <p>
              We hope you enjoy using our car rental app.  
              If you have feedback or suggestions, please let us know!
            </p>
            <button className="cta-button">Book Your Car Now</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;