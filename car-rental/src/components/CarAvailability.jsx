import React, { useState, useEffect } from 'react';
import './CarAvailability.css';

const CarAvailability = ({ carId, startDate, endDate, onAvailabilityChange }) => {
  const [availabilityStatus, setAvailabilityStatus] = useState({
    isAvailable: true,
    availableUnits: 1,
    totalUnits: 1,
    conflictingBookings: [],
    loading: true
  });

  useEffect(() => {
    checkAvailability();
  }, [carId, startDate, endDate]);

  const checkAvailability = async () => {
    if (!carId || !startDate || !endDate) {
      setAvailabilityStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      setAvailabilityStatus(prev => ({ ...prev, loading: true }));

      const response = await fetch(`http://192.168.37.130:3001/api/check-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carId,
          startDate,
          endDate
        })
      });

      if (!response.ok) {
        throw new Error('Failed to check availability');
      }

      const data = await response.json();
      setAvailabilityStatus({
        ...data,
        loading: false
      });

      // Notify parent component
      if (onAvailabilityChange) {
        onAvailabilityChange(data.isAvailable);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      setAvailabilityStatus({
        isAvailable: true, // Fail open to allow booking
        availableUnits: 1,
        totalUnits: 1,
        conflictingBookings: [],
        loading: false,
        error: error.message
      });
      
      // Notify parent that car is available (on error, we allow booking)
      if (onAvailabilityChange) {
        onAvailabilityChange(true);
      }
    }
  };

  if (availabilityStatus.loading) {
    return (
      <div className="availability-check loading">
        <div className="availability-spinner"></div>
        <span>Checking availability...</span>
      </div>
    );
  }

  const getAvailabilityBadge = () => {
    if (availabilityStatus.availableUnits === 0) {
      return {
        className: 'availability-badge unavailable',
        icon: '❌',
        text: 'Not Available',
        description: 'This car is fully booked for the selected dates'
      };
    } else if (availabilityStatus.availableUnits <= 2) {
      return {
        className: 'availability-badge limited',
        icon: '⚠️',
        text: `Only ${availabilityStatus.availableUnits} Left`,
        description: 'Limited availability - book soon!'
      };
    } else {
      return {
        className: 'availability-badge available',
        icon: '✅',
        text: 'Available',
        description: `${availabilityStatus.availableUnits} units available`
      };
    }
  };

  const badge = getAvailabilityBadge();

  return (
    <div className="availability-check">
      {availabilityStatus.error && (
        <div className="availability-warning">
          <span className="warning-icon">⚠️</span>
          <div className="warning-content">
            <strong>Unable to verify availability</strong>
            <p>You can still proceed with booking. The system will check availability when processing your request.</p>
          </div>
        </div>
      )}
      
      {!availabilityStatus.error && (
        <div className={badge.className}>
          <span className="badge-icon">{badge.icon}</span>
          <div className="badge-content">
            <span className="badge-text">{badge.text}</span>
            <span className="badge-description">{badge.description}</span>
          </div>
        </div>
      )}

      {availabilityStatus.conflictingBookings.length > 0 && (
        <div className="conflicting-bookings">
          <h4>🗓️ Booked Dates:</h4>
          <ul>
            {availabilityStatus.conflictingBookings.map((booking, index) => (
              <li key={index}>
                {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      {availabilityStatus.availableUnits === 0 && (
        <div className="alternative-options">
          <p>💡 This car is unavailable for your selected dates.</p>
          <button className="btn-alternative" onClick={() => window.location.href = '/cars'}>
            View Similar Cars
          </button>
        </div>
      )}
    </div>
  );
};

export default CarAvailability;
