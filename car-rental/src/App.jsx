import React from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Cars from './components/Cars';
import BookingPage from './components/BookingPage';
import About from './components/About';
import Contact from './components/Contact';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import DriverDashboard from './pages/DriverDashboard';
import Analytics from './pages/Analytics';

import Navbar from './components/Navbar';
import { CarRental, ChauffeurService, Corporate, Subscription } from './components/Service';
import carsData from './data/cars';

const GOOGLE_CLIENT_ID = "939147918063-qup3da9dohhdf7i2c090skr5quml8q19.apps.googleusercontent.com";

// Wrapper to pass car prop to BookingPage
const BookingPageWrapper = () => {
  const { carId } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchCar = async () => {
      try {
        console.log('Fetching car with ID:', carId);
        // First try to get from database
        const response = await fetch(`http://192.168.37.130:3001/api/cars/${carId}`);
        if (response.ok) {
          const carData = await response.json();
          console.log('Found car from database:', carData);
          setCar(carData);
        } else {
          console.log('Car not found in database, trying static data');
          // Fallback to static data
          const staticCar = carsData.find(c => String(c.id) === String(carId));
          console.log('Found static car:', staticCar);
          setCar(staticCar);
        }
      } catch (error) {
        console.error('Error fetching car:', error);
        // Fallback to static data
        const staticCar = carsData.find(c => String(c.id) === String(carId));
        console.log('Using static car due to error:', staticCar);
        setCar(staticCar);
      } finally {
        setLoading(false);
      }
    };

    fetchCar();
  }, [carId]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        fontSize: '1.2rem'
      }}>
        Loading car details...
      </div>
    );
  }

  return (
    <BookingPage
      car={car}
      onBookingSuccess={() => navigate('/cars')}
      onBackToCars={() => navigate('/cars')}
    />
  );
};

// Component to conditionally render Navbar
const ConditionalNavbar = () => {
  const location = useLocation();
  const dashboardPaths = ['/admin', '/client', '/driver'];
  
  // Don't render navbar on dashboard pages
  if (dashboardPaths.some(path => location.pathname.startsWith(path))) {
    return null;
  }
  
  return <Navbar />;
};

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <ConditionalNavbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/cars" element={<Cars />} />
          <Route path="/cars/:carId/booking" element={<BookingPageWrapper />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/rental" element={<CarRental />} />
          <Route path="/chauffeur" element={<ChauffeurService />} />
          <Route path="/corporate" element={<Corporate />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/analytics" element={<Analytics />} />
          {/* Add more routes as needed */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/client" element={<ClientDashboard />} />
          <Route path="/driver" element={<DriverDashboard />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;