import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Update user state on route change and custom events
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    setUser(storedUser ? JSON.parse(storedUser) : null);

    // Listen for login/logout changes from other tabs/windows
    const updateUser = () => {
      const updatedUser = localStorage.getItem('user');
      setUser(updatedUser ? JSON.parse(updatedUser) : null);
    };
    window.addEventListener('storage', updateUser);
    window.addEventListener('user-login', updateUser);

    return () => {
      window.removeEventListener('storage', updateUser);
      window.removeEventListener('user-login', updateUser);
    };
  }, [location]);

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const closeMenu = () => {
    setIsOpen(false);
    setDropdownOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    closeMenu();
    navigate("/");
    // Notify other tabs/components
    window.dispatchEvent(new Event('user-login'));
  };

  // Helper to get display name for both Google and form login
  const getDisplayName = (user) => {
    let name = user.name || user.given_name || user.fullName || user.username || user.email;
    
    // If the name looks like an email, extract the part before @
    if (name && name.includes('@')) {
      name = name.split('@')[0];
    }
    
    // Capitalize first letter of each word and limit length
    if (name) {
      name = name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      // Truncate if too long
      if (name.length > 20) {
        name = name.substring(0, 17) + '...';
      }
    }
    
    return name || 'User';
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <NavLink to="/" className="logo-text" onClick={closeMenu}>
            RentAuto
          </NavLink>
        </div>

        {/* Mobile Menu Icon */}
        <div className="navbar-toggle" onClick={toggleMenu}>
          <span className={`bar ${isOpen ? "active" : ""}`}></span>
        </div>

        {/* Navigation Menu */}
        <ul className={`navbar-menu ${isOpen ? "active" : ""}`}>
          <li className="navbar-item">
            <NavLink to="/" className="navbar-link" onClick={closeMenu}>
              Home
            </NavLink>
          </li>
          <li className="navbar-item">
            <NavLink to="/cars" className="navbar-link" onClick={closeMenu}>
              Cars
            </NavLink>
          </li>
          <li className="navbar-item">
            <NavLink to="/about" className="navbar-link" onClick={closeMenu}>
              About
            </NavLink>
          </li>
          {/* Dropdown Menu */}
          <li className="navbar-item dropdown">
            <button
              type="button"
              className="navbar-link dropdown-toggle"
              onClick={toggleDropdown}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
            >
              Services
              <span className={`dropdown-arrow ${dropdownOpen ? "active" : ""}`}>▼</span>
            </button>
            <ul className={`dropdown-menu ${dropdownOpen ? "active" : ""}`}>
              <li>
                <NavLink to="/rental" onClick={closeMenu}>Car Rental</NavLink>
              </li>
              <li>
                <NavLink to="/chauffeur" onClick={closeMenu}>Chauffeur Service</NavLink>
              </li>
              <li>
                <NavLink to="/corporate" onClick={closeMenu}>Corporate</NavLink>
              </li>
              <li>
                <NavLink to="/subscription" onClick={closeMenu}>Subscription</NavLink>
              </li>
            </ul>
          </li>
          <li className="navbar-item">
            <NavLink to="/contact" className="navbar-link" onClick={closeMenu}>
              Contact
            </NavLink>
          </li>
          {user && (
            <li className="navbar-item">
              <NavLink to="/analytics" className="navbar-link" onClick={closeMenu}>
                Analytics
              </NavLink>
            </li>
          )}
        </ul>

        {/* Right Side Actions */}
        <div className={`navbar-actions ${isOpen ? "active" : ""}`}>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              {user.picture && (
                <img
                  src={user.picture}
                  alt=""
                  style={{ width: "32px", height: "32px", borderRadius: "50%" }}
                />
              )}
              <span className="welcome-text">Welcome, {getDisplayName(user)}</span>
              <button className="navbar-btn btn-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <>
              <NavLink to="/login" className="navbar-btn btn-logout" onClick={closeMenu}>
                Login
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;