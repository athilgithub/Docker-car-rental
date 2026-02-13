import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Default location (Delhi)
const DEFAULT_LOCATION = { lat: 28.6139, lng: 77.2090 };

const CarMap = ({ location }) => {
  const initialLocation = location && location.lat && location.lng ? location : DEFAULT_LOCATION;
  const [liveLocation, setLiveLocation] = useState(initialLocation);

  // Simulate car movement for demo
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveLocation(prev => ({
        lat: prev.lat + (Math.random() - 0.5) * 0.001,
        lng: prev.lng + (Math.random() - 0.5) * 0.001
      }));
    }, 2000); // update every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <MapContainer center={[liveLocation.lat, liveLocation.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[liveLocation.lat, liveLocation.lng]}>
          <Popup>
            Car Live Location<br />Lat: {liveLocation.lat.toFixed(5)}, Lng: {liveLocation.lng.toFixed(5)}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default CarMap;