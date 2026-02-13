import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Service.css';

// CarRental.js
const CarRental = () => {
  const navigate = useNavigate();
  const carCategories = [
    {
      id: 1,
      name: 'Economy',
      price: '₹800/day',
      features: ['Fuel Efficient', 'Easy Parking', 'Perfect for City'],
      image: 'https://via.placeholder.com/300x200',
      cars: ['Toyota Yaris', 'Nissan Versa', 'Hyundai Accent']
    },
    {
      id: 2,
      name: 'Compact',
      price: '₹1200/day',
      features: ['More Space', 'Comfortable', 'Good Mileage'],
      image: 'https://via.placeholder.com/300x200',
      cars: ['Honda Civic', 'Toyota Corolla', 'Nissan Sentra']
    },
    {
      id: 3,
      name: 'SUV',
      price: '₹1800/day',
      features: ['7 Seats', 'All Terrain', 'Family Friendly'],
      image: 'https://via.placeholder.com/300x200',
      cars: ['Honda CR-V', 'Toyota RAV4', 'Mazda CX-5']
    },
    {
      id: 4,
      name: 'Luxury',
      price: '₹3500/day',
      features: ['Premium Interior', 'Latest Tech', 'Comfort Plus'],
      image: 'https://via.placeholder.com/300x200',
      cars: ['BMW 3 Series', 'Mercedes C-Class', 'Audi A4']
    }
  ];

  // Navigate to cars page with category filter
  const handleCategoryClick = (categoryName) => {
    navigate(`/cars?category=${encodeURIComponent(categoryName)}`);
  };

  return (
  <div className="car-rental-page">
  <section className="car-rental-hero">
        <div className="container">
          <h1>Car Rental Services</h1>
          <p>Choose from our wide range of vehicles for every occasion</p>
        </div>
      </section>

      <section className="car-categories">
        <div className="container">
          <h2>Our Vehicle Categories</h2>
          <div className="categories-grid">
            {carCategories.map(category => (
              <div key={category.id} className="category-card">
                <img src={category.image} alt={category.name} />
                <div className="category-info">
                  <h3>{category.name}</h3>
                  <div className="price">{category.price}</div>
                  <ul className="features">
                    {category.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                  <div className="available-cars">
                    <strong>Available Models:</strong>
                    <p>{category.cars.join(', ')}</p>
                  </div>
                  <button
                    className="rent-button"
                    onClick={() => handleCategoryClick(category.name)}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rental-process">
        <div className="container">
          <h2>Simple Rental Process</h2>
          <div className="process-steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Choose Your Car</h3>
              <p>Select from our diverse fleet</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Book Online</h3>
              <p>Quick and secure booking</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Pick Up</h3>
              <p>Collect your car at the location</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Drive & Enjoy</h3>
              <p>Hit the road with confidence</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// ChauffeurService.js
const ChauffeurService = () => {
  const navigate = useNavigate();
  const serviceTypes = [
    {
      id: 1,
      name: 'Airport Transfer',
      price: 'From ₹1500',
      description: 'Comfortable and timely airport transfers',
      features: ['Flight Tracking', 'Meet & Greet', 'Luggage Assistance']
    },
    {
      id: 2,
      name: 'Business Travel',
      price: 'From ₹2000/hour',
      description: 'Professional chauffeur for business needs',
      features: ['Executive Vehicles', 'WiFi Available', 'Professional Drivers']
    },
    {
      id: 3,
      name: 'City Tours',
      price: 'From ₹2500/hour',
      description: 'Explore the city with a knowledgeable driver',
      features: ['Local Knowledge', 'Flexible Routes', 'Photo Stops']
    },
    {
      id: 4,
      name: 'Special Events',
      price: 'From ₹5000',
      description: 'Luxury transport for weddings and events',
      features: ['Premium Vehicles', 'Decorated Cars', 'Special Packages']
    }
  ];

  return (
  <div className="chauffeur-page">
  <section className="chauffeur-hero">
        <div className="container">
          <h1>Chauffeur Services</h1>
          <p>Professional drivers for a premium travel experience</p>
        </div>
      </section>

  <section className="chauffeur-services-section">
        <div className="container">
          <h2>Our Chauffeur Services</h2>
          <div className="chauffeur-services-grid">
            {serviceTypes.map(service => (
              <div key={service.id} className="chauffeur-card">
                <h3>{service.name}</h3>
                <div className="chauffeur-price">{service.price}</div>
                <p>{service.description}</p>
                <ul className="chauffeur-features">
                  {service.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
                <button className="book-button" onClick={() => navigate('/contact')}>Book Service</button>
              </div>
            ))}
          </div>
        </div>
      </section>

  <section className="chauffeur-benefits-section">
        <div className="container">
          <h2>Why Choose Our Chauffeurs?</h2>
          <div className="chauffeur-benefits-grid">
            <div className="chauffeur-benefit">
              <div className="chauffeur-benefit-icon">👨‍💼</div>
              <h3>Professional Drivers</h3>
              <p>Experienced, licensed, and courteous</p>
            </div>
            <div className="benefit">
              <div className="benefit-icon">🚗</div>
              <h3>Luxury Vehicles</h3>
              <p>Premium cars for ultimate comfort</p>
            </div>
            <div className="benefit">
              <div className="benefit-icon">⏰</div>
              <h3>Punctual Service</h3>
              <p>Always on time, every time</p>
            </div>
            <div className="benefit">
              <div className="benefit-icon">🛡️</div>
              <h3>Safe & Secure</h3>
              <p>Background checked drivers</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Corporate.js
const Corporate = () => {
  const navigate = useNavigate();
  const corporatePackages = [
    {
      id: 1,
      name: 'Startup Package',
      price: '₹15,000/month',
      features: ['5 Cars Available', 'Basic Support', 'Monthly Billing', 'City Coverage']
    },
    {
      id: 2,
      name: 'Business Package',
      price: '₹35,000/month',
      features: ['15 Cars Available', 'Priority Support', 'Flexible Billing', 'Multi-City Coverage']
    },
    {
      id: 3,
      name: 'Enterprise Package',
      price: '₹75,000/month',
      features: ['Unlimited Cars', '24/7 Support', 'Custom Billing', 'National Coverage']
    }
  ];

  return (
  <div className="corporate-page">
  <section className="corporate-hero">
        <div className="container">
          <h1>Corporate Solutions</h1>
          <p>Comprehensive fleet management for your business</p>
        </div>
      </section>

  <section className="corporate-packages-section">
        <div className="container">
          <h2>Corporate Packages</h2>
          <div className="corporate-packages-grid">
            {corporatePackages.map(pkg => (
              <div key={pkg.id} className="corporate-package-card">
                <h3>{pkg.name}</h3>
                <div className="corporate-package-price">{pkg.price}</div>
                <ul className="corporate-package-features">
                  {pkg.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
                <button className="select-button" onClick={() => navigate('/contact')}>Select Package</button>
              </div>
            ))}
          </div>
        </div>
      </section>

  <section className="corporate-benefits-section">
        <div className="container">
          <h2>Corporate Benefits</h2>
          <div className="corporate-benefits-list">
            <div className="corporate-benefit-item">
              <h3>Cost Savings</h3>
              <p>Reduce your fleet management costs by up to 30%</p>
            </div>
            <div className="benefit-item">
              <h3>Flexibility</h3>
              <p>Scale your fleet up or down based on business needs</p>
            </div>
            <div className="benefit-item">
              <h3>Maintenance Free</h3>
              <p>We handle all maintenance, insurance, and registration</p>
            </div>
            <div className="benefit-item">
              <h3>24/7 Support</h3>
              <p>Dedicated account manager and round-the-clock support</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Subscription.js
const Subscription = () => {
  const navigate = useNavigate();
  const subscriptionPlans = [
    {
      id: 1,
      name: 'Weekend Warrior',
      price: '₹4,999/month',
      usage: '8 days per month',
      features: ['Economy & Compact cars', 'Weekend priority', 'Basic insurance']
    },
    {
      id: 2,
      name: 'City Explorer',
      price: '₹9,999/month',
      usage: '15 days per month',
      features: ['All car categories', 'Anytime booking', 'Premium insurance', 'Free fuel']
    },
    {
      id: 3,
      name: 'Road Master',
      price: '₹17,999/month',
      usage: 'Unlimited',
      features: ['Premium & Luxury cars', 'Priority booking', 'Full coverage', 'Concierge service']
    }
  ];

  return (
  <div className="subscription-page">
  <section className="subscription-hero">
        <div className="container">
          <h1>Car Subscription</h1>
          <p>Monthly plans for regular car users</p>
        </div>
      </section>

  <section className="subscription-plans-section">
        <div className="container">
          <h2>Choose Your Plan</h2>
          <div className="subscription-plans-grid">
            {subscriptionPlans.map(plan => (
              <div key={plan.id} className="subscription-plan-card">
                <h3>{plan.name}</h3>
                <div className="subscription-plan-price">{plan.price}</div>
                <div className="subscription-plan-usage">{plan.usage}</div>
                <ul className="subscription-plan-features">
                  {plan.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
                <button className="subscribe-button" onClick={() => navigate('/contact')}>Subscribe Now</button>
              </div>
            ))}
          </div>
        </div>
      </section>

  <section className="subscription-benefits-section">
        <div className="container">
          <h2>Subscription Benefits</h2>
          <div className="subscription-benefits-grid">
            <div className="subscription-benefit">
              <div className="subscription-benefit-icon">💰</div>
              <h3>Save Money</h3>
              <p>Up to 40% savings compared to daily rentals</p>
            </div>
            <div className="benefit">
              <div className="benefit-icon">🔄</div>
              <h3>Flexibility</h3>
              <p>Change or cancel your plan anytime</p>
            </div>
            <div className="benefit">
              <div className="benefit-icon">🚗</div>
              <h3>No Commitment</h3>
              <p>Month-to-month plans with no long-term contracts</p>
            </div>
            <div className="benefit">
              <div className="benefit-icon">⭐</div>
              <h3>Priority Access</h3>
              <p>Skip the line with priority booking</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export { CarRental, ChauffeurService, Corporate, Subscription };