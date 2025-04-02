import React, { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import './ProfileMap-style.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const ProfileMap = ({ isFollowing, isOwner }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const updateMapZoomRef = useRef(null);

  useEffect(() => {
    if (!isFollowing && !isOwner) {
      if (mapInstance.current) {
        markersRef.current.forEach(marker => marker.remove());
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      return;
    }

    let L;
    let mapInitialized = false;

    const updateMapZoom = () => {
      if (!mapInstance.current) return;
      const zoom = window.innerWidth <= 768 ? 1 : 2;
      mapInstance.current.setZoom(zoom);
    };

    updateMapZoomRef.current = updateMapZoom;

    const initMap = async () => {
      try {
        L = await import('leaflet');
        
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: markerIcon2x,
          iconUrl: markerIcon,
          shadowUrl: markerShadow,
        });

        const initializeMap = (zoomLevel) => {
          if (mapInstance.current || !mapRef.current) return;

          mapInstance.current = L.map(mapRef.current, {
            minZoom: 2,
            maxZoom: 18,
            maxBounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)),
            maxBoundsViscosity: 1.0
          }).setView([30.0, 10.0], zoomLevel);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
          }).addTo(mapInstance.current);

          const locations = [
            { name: "Токио", lat: 35.6895, lng: 139.6917 },
            { name: "Берлин", lat: 52.5200, lng: 13.4050 },
            { name: "Рио-де-Жанейро", lat: -22.9068, lng: -43.1729 },
            { name: "Москва", lat: 55.7558, lng: 37.6173 }
          ];

          markersRef.current = locations.map(location => 
            L.marker([location.lat, location.lng])
              .addTo(mapInstance.current)
              .bindPopup(`<h3>${location.name}</h3>`)
          );
        };

        const initialZoom = window.innerWidth <= 768 ? 1 : 2;
        initializeMap(initialZoom);
        window.addEventListener('resize', updateMapZoomRef.current);
        mapInitialized = true;

      } catch (error) {
        console.error('Ошибка при загрузке карты:', error);
      }
    };

    initMap();

    return () => {
      if (mapInitialized) {
        window.removeEventListener('resize', updateMapZoomRef.current);
      }
      if (mapInstance.current) {
        markersRef.current.forEach(marker => marker.remove());
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [isFollowing]);

  if (!isFollowing && !isOwner) {
    return <div className="map-section" />;
  }

  return <div ref={mapRef} className="map-section" />;
};

export default ProfileMap;