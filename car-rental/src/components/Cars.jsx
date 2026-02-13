import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Cars = () => {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    category: '',
    fuel: '',
    transmission: '',
    priceRange: [0, 15000], // INR
    sortBy: 'price'
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch cars from database
  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://192.168.37.130:3001/api/cars');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched cars from database:', data);
        setCars(data);
        setError(null);
      } else {
        // If API fails, fall back to static data
        console.warn('API not available, using static data');
        setCars(getStaticCars());
        setError('Using offline data - backend server not connected');
      }
    } catch (err) {
      console.warn('Failed to fetch cars from API, using static data:', err);
      setCars(getStaticCars());
      setError('Using offline data - backend server not connected');
    } finally {
      setLoading(false);
    }
  };

  // Static fallback data
  const getStaticCars = () => [
    {
      id: 1,
      name: 'Maruti Suzuki Dzire',
      category: 'Sedan',
      fuel: 'Hybrid',
      transmission: 'Automatic',
      price: 3750,
      rating: 4.5,
      reviews: 127,
      image: 'swift.jpeg',
      features: ['AC', 'GPS', 'Bluetooth', 'USB'],
      seats: 5,
      doors: 4,
      available: true
    },
    {
      id: 2,
      name: 'Mahindra XUV700',
      category: 'SUV',
      fuel: 'Petrol',
      transmission: 'Automatic',
      price: 7400,
      rating: 4.8,
      reviews: 89,
      image: 'xuv.avif',
      features: ['AC', 'GPS', 'Leather Seats', 'Sunroof'],
      seats: 7,
      doors: 5,
      available: true
    },
    {
      id: 3,
      name: 'Tata Nexon EV',
      category: 'Electric',
      fuel: 'Electric',
      transmission: 'Automatic',
      price: 6200,
      rating: 4.9,
      reviews: 203,
      image: 'tata.jpg',
      features: ['Autopilot', 'Premium Audio', 'Supercharging'],
      seats: 5,
      doors: 4,
      available: true
    },
    {
      id: 4,
      name: 'Hyundai Verna',
      category: 'Sedan',
      fuel: 'Petrol',
      transmission: 'Manual',
      price: 2900,
      rating: 4.3,
      reviews: 156,
      image: 'verna.webp',
      features: ['AC', 'GPS', 'Bluetooth'],
      seats: 5,
      doors: 4,
      available: true
    },  
    {
      id: 5,
      name: 'Toyota Innova-Crysta',
      category: 'SUV',
      fuel: 'Hybrid',
      transmission: 'Automatic',
      price: 3750,
      rating: 4.7,
      reviews: 78,
      image: 'crys.jpg',
      features: ['Premium Audio', 'Leather Seats', 'Panoramic Roof'],
      seats: 7,
      doors: 5,
      available: true
    },
    {
      id: 6,
      name: 'Mahendra BE 6E',
      category: 'Electric',
      fuel: 'Electric',
      transmission: 'Automatic',
      price: 3200,
      rating: 4.6,
      reviews: 65,
      image: 'be.jpg',
      features: ['Fast Charging', 'Eco Mode', 'Smart Key'],
      seats: 5,
      doors: 5,
      available: true
    },
    {
      id: 7,
      name: 'Thar',
      category: 'Petrol',
      fuel: 'Petrol',
      transmission: 'Manual',
      price: 3200,
      rating: 4.4,
      reviews: 92,
      image: 'thar.jpg',
      features: ['Fast Charging', 'Eco Mode', 'Smart Key'],
      seats: 4,
      doors: 3,
      available: true
    },
    {
      id: 8,
      name: 'BMW X5',
      category: 'SUV',
      fuel: 'Petrol',
      transmission: 'Automatic',
      price: 7400,
      rating: 4.9,
      reviews: 120,
      image: 'bmw.webp',
      features: ['AC', 'GPS', 'Leather Seats', 'Sunroof'],
      seats: 7,
      doors: 5,
      available: true
    },
    {
      id: 9,
      name: 'Hyundai Creta',
      category: 'SUV',
      fuel: 'Diesel',
      transmission: 'Manual',
      price: 5000,
      rating: 4.6,
      reviews: 110,
      image: 'cre.avif',
      features: ['AC', 'GPS', 'Bluetooth', 'Rear Camera'],
      seats: 5,
      doors: 5,
      available: true
    },
    {
      id: 10,
      name: 'Renault Kwid',
      category: 'Hatchback',
      fuel: 'Petrol',
      transmission: 'Manual',
      price: 2500,
      rating: 4.2,
      reviews: 75,
      image: 'kv.jpg',
      features: ['AC', 'Bluetooth', 'USB'],
      seats: 5,
      doors: 5,
      available: true
    },
    {
      id: 11,
      name: 'Honda City',
      category: 'Sedan',
      fuel: 'Petrol',
      transmission: 'Automatic',
      price: 4400,
      rating: 4.7,
      reviews: 140,
      image: 'hon.jpg',
      features: ['AC', 'GPS', 'Sunroof', 'Bluetooth'],
      seats: 5,
      doors: 4,
      available: true
    },
    {
      id: 12,
      name: 'Ford EcoSport',
      category: 'SUV',
      fuel: 'Diesel',
      transmission: 'Manual',
      price: 4000,
      rating: 4.5,
      reviews: 90,
      image: 'ec.webp',
      features: ['AC', 'GPS', 'Bluetooth', 'USB'],
      seats: 5,
      doors: 5,
      available: true
    },
    {
      id: 13,
      name: 'Tata Tiago',
      category: 'Hatchback',
      fuel: 'Petrol',
      transmission: 'Manual',
      price: 2200,
      rating: 4.3,
      reviews: 60,
      image: 'tiago.jpg',
      features: ['AC', 'Bluetooth', 'USB'],
      seats: 5,
      doors: 5,
      available: true
    },
    {
      id: 14,
      name: 'Toyota Fortuner',
      category: 'SUV',
      fuel: 'Diesel',
      transmission: 'Automatic',
      price: 11500,
      rating: 4.8,
      reviews: 55,
      image: 'for.png',
      features: ['AC', 'GPS', 'Leather Seats', 'Sunroof'],
      seats: 7,
      doors: 5,
      available: true
    }
  ];

  // Helper function to get proper image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder-car.svg';
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) return imagePath;
    
    // If it's a backend upload path, prepend server URL
    if (imagePath.startsWith('/uploads/')) {
      return `http://192.168.37.130:3001${imagePath}`;
    }
    
    // If it's a static image name, use public folder
    return `/${imagePath}`;
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading cars...
      </div>
    );
  }

  // Show error message if using offline data
  const ErrorMessage = () => {
    if (!error) return null;
    
    return (
      <div style={{
        background: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '8px',
        padding: '12px 16px',
        margin: '20px auto',
        maxWidth: '1200px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#856404'
      }}>
        <span>⚠️ {error}</span>
        <button 
          onClick={fetchCars}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Retry Connection
        </button>
      </div>
    );
  };

  const filteredCars = cars.filter(car => {
    return (
      car.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filters.category === '' || car.category === filters.category) &&
      (filters.fuel === '' || car.fuel === filters.fuel) &&
      (filters.transmission === '' || car.transmission === filters.transmission) &&
      car.price >= filters.priceRange[0] && car.price <= filters.priceRange[1]
    );
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'price':
        return a.price - b.price;
      case 'rating':
        return b.rating - a.rating;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Navigate to booking page for selected car
  const handleBookCar = (carName) => {
    navigate(`/booking?car=${encodeURIComponent(carName)}`);
  };

  

  return (
    <div className="cars-page">
      <ErrorMessage />
      <div className="cars-hero">
        <div className="container">
          <h1>Our Car Collection</h1>
          <p>Choose from our premium selection of vehicles</p>
        </div>
      </div>

      <div className="cars-content">
        <div className="container">
          <div className="cars-layout">
            {/* Filters Sidebar */}
            <aside className="filters-sidebar">
              <h3>Filter Cars</h3>
              <div className="filter-group">
                <label>Search Cars</label>
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="filter-group">
                <label>Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">All Categories</option>
                  <option value="Sedan">Sedan</option>
                  <option value="SUV">SUV</option>
                  <option value="Electric">Electric</option>
                  <option value="Luxury">Luxury</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Petrol">Petrol</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Fuel Type</label>
                <select
                  value={filters.fuel}
                  onChange={(e) => handleFilterChange('fuel', e.target.value)}
                >
                  <option value="">All Fuel Types</option>
                  <option value="Petrol">Petrol</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Transmission</label>
                <select
                  value={filters.transmission}
                  onChange={(e) => handleFilterChange('transmission', e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="Manual">Manual</option>
                  <option value="Automatic">Automatic</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Price Range (per day)</label>
                <div className="price-range">
                  <input
                    type="range"
                    min="0"
                    max="15000"
                    value={filters.priceRange[1]}
                    onChange={(e) => handleFilterChange('priceRange', [0, parseInt(e.target.value)])}
                    className="range-slider"
                  />
                  <div className="price-display">
                    ₹0 - ₹{filters.priceRange[1]}
                  </div>
                </div>
              </div>
              <button
                className="clear-filters"
                onClick={() => setFilters({
                  category: '',
                  fuel: '',
                  transmission: '',
                  priceRange: [0, 15000],
                  sortBy: 'price'
                })}
              >
                Clear All Filters
              </button>
            </aside>

            {/* Cars Grid */}
            <main className="cars-main">
              <div className="cars-header">
                <div className="results-info">
                  <span>{filteredCars.length} cars found</span>
                </div>
                <div className="sort-options">
                  <label>Sort by:</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  >
                    <option value="price">Price (Low to High)</option>
                    <option value="rating">Rating (High to Low)</option>
                    <option value="name">Name (A to Z)</option>
                  </select>
                </div>
              </div>

              <div className="cars-grid">
                {filteredCars.map(car => (
                  <div key={car.id} className={`car-card ${!car.available ? 'unavailable' : ''}`}>
                    <div className="car-image-container">
                      <img 
                        src={getImageUrl(car.image)} 
                        alt={car.name} 
                        className="car-image" 
                        onError={(e) => {
                          e.target.src = '/placeholder-car.svg';
                        }}
                      />
                      {!car.available && <div className="unavailable-overlay">Unavailable</div>}
                      <div className="car-rating">
                        <span className="rating-star">★</span>
                        <span className="rating-number">{car.rating}</span>
                      </div>
                    </div>

                    <div className="car-details">
                      <h3 className="car-name">{car.name}</h3>
                      <p className="car-category">{car.category}</p>

                      <div className="car-specs">
                        <div className="spec">
                          <span className="spec-icon">👥</span>
                          <span>{car.seats} Seats</span>
                        </div>
                        <div className="spec">
                          <span className="spec-icon">🚪</span>
                          <span>{car.doors} Doors</span>
                        </div>
                        <div className="spec">
                          <span className="spec-icon">⛽</span>
                          <span>{car.fuel}</span>
                        </div>
                        <div className="spec">
                          <span className="spec-icon">⚙️</span>
                          <span>{car.transmission}</span>
                        </div>
                      </div>

                      <div className="car-features">
                        {car.features.slice(0, 3).map((feature, index) => (
                          <span key={index} className="feature-tag">{feature}</span>
                        ))}
                        {car.features.length > 3 && (
                          <span className="feature-tag">+{car.features.length - 3} more</span>
                        )}
                      </div>

                      <div className="car-footer">
                        <div className="car-price">
                          <span className="price-amount">₹{car.price}</span>
                          <span className="price-period">/day</span>
                        </div>
                        <button
                          className="book-btn"
                          disabled={!car.available}
                          onClick={() => {
                            if (!car.available) return;
                            const user = JSON.parse(localStorage.getItem('user'));
                            const carId = car._id || car.id; // Handle both MongoDB _id and regular id
                            if (!user) {
                              // Redirect to login, preserve intended booking
                              navigate(`/login?redirect=/cars/${carId}/booking`);
                            } else {
                              navigate(`/cars/${carId}/booking`);
                            }
                          }}
                        >
                          {car.available ? 'Book Now' : 'Unavailable'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredCars.length === 0 && (
                <div className="no-results">
                  <h3>No cars found</h3>
                  <p>Try adjusting your filters or search terms</p>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cars;