import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Compass, Crosshair } from 'lucide-react';

export default function GisMap({ mission, droneProgress, onAssetClick }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const droneMarkerRef = useRef(null);
  const footprintPolygonRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current || !mission) return;

    // Center coordinates
    const lat = mission.coordinates?.lat || 34.15243;
    const lon = mission.coordinates?.lon || 77.57721;

    // Create Leaflet Map
    const map = L.map(mapContainerRef.current, {
      center: [lat, lon],
      zoom: 17,
      zoomControl: false,
      attributionControl: false
    });
    mapInstanceRef.current = map;

    // High-resolution Dark Tactical / Satellite Tiles (CartoDB Dark Matter / Esri World Imagery fallback)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: 'abcd'
    }).addTo(map);

    // Zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Calculate flight path line: 100 meters single-pass corridor
    // 0.00001 deg lat ~ 1.11 meters
    const flightLatSpan = 0.0012; // ~130 meters
    const startLat = lat - flightLatSpan / 2;
    const endLat = lat + flightLatSpan / 2;
    const flightPathCoords = [
      [startLat, lon - 0.0001],
      [lat, lon],
      [endLat, lon + 0.0001]
    ];

    // Flight Path Polyline
    L.polyline(flightPathCoords, {
      color: '#00f0ff',
      weight: 3,
      dashArray: '6, 8',
      opacity: 0.9
    }).addTo(map);

    // Reconstructed 3D Footprint Bounding Polygon
    const footprintBounds = [
      [startLat - 0.0002, lon - 0.0007],
      [startLat - 0.0002, lon + 0.0007],
      [endLat + 0.0002, lon + 0.0007],
      [endLat + 0.0002, lon - 0.0007]
    ];
    L.polygon(footprintBounds, {
      color: '#38bdf8',
      fillColor: '#0284c7',
      fillOpacity: 0.15,
      weight: 1.5
    }).addTo(map);

    // Add Tactical Asset Pins
    if (mission.tacticalAssets) {
      mission.tacticalAssets.forEach(asset => {
        // Map local metric (x, y) to small lat/lon delta
        const assetLat = lat + (asset.y / 111320);
        const assetLon = lon + (asset.x / (111320 * Math.cos(lat * Math.PI / 180)));

        const customIcon = L.divIcon({
          className: 'custom-tactical-pin',
          html: `<div class="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-950 border border-cyan-400 text-[10px] font-bold text-cyan-300 shadow-[0_0_8px_#00f0ff]">${asset.id}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const marker = L.marker([assetLat, assetLon], { icon: customIcon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: monospace; font-size: 11px; padding: 2px;">
            <strong style="color: #0284c7;">${asset.name}</strong><br/>
            <span>Type: ${asset.type}</span><br/>
            <span>Status: <strong style="color: #10b981;">${asset.status}</strong></span>
          </div>
        `);
      });
    }

    // Dynamic Drone Marker
    const droneIcon = L.divIcon({
      className: 'drone-uav-marker',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <div class="absolute w-8 h-8 rounded-full bg-cyan-400/20 animate-ping"></div>
          <div class="w-6 h-6 rounded-full bg-cyan-500 border-2 border-white flex items-center justify-center shadow-lg">
            <svg class="w-3.5 h-3.5 text-black transform rotate-45" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 19 21 12 17 5 21 12 2"/>
            </svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const droneMarker = L.marker([startLat, lon], { icon: droneIcon }).addTo(map);
    droneMarkerRef.current = droneMarker;

    return () => {
      map.remove();
    };
  }, [mission]);

  // Update Drone Marker Position on scrub
  useEffect(() => {
    if (!droneMarkerRef.current || !mission) return;
    const lat = mission.coordinates?.lat || 34.15243;
    const lon = mission.coordinates?.lon || 77.57721;
    const flightLatSpan = 0.0012;
    const startLat = lat - flightLatSpan / 2;
    const progress = droneProgress !== undefined ? droneProgress : 0;

    const currentLat = startLat + progress * flightLatSpan;
    const currentLon = lon + Math.sin(progress * Math.PI) * 0.0001;

    droneMarkerRef.current.setLatLng([currentLat, currentLon]);
  }, [droneProgress, mission]);

  return (
    <div className="relative isolate z-0 w-full h-full bg-zinc-950 overflow-hidden select-none">
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Banner: 21st.dev Glass Pill */}
      <div className="absolute top-3 left-3 bg-zinc-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg text-xs font-sans z-[500] flex items-center gap-2">
        <Navigation className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-zinc-400">Corridor:</span>
        <span className="text-white font-medium">{mission?.locationName}</span>
      </div>

      {/* Bottom Coordinates & GSD HUD: 21st.dev Glass Pill */}
      <div className="absolute bottom-3 left-3 bg-zinc-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg text-[10px] font-mono z-[500] flex items-center gap-3 text-zinc-300">
        <div>LAT: <span className="text-white font-semibold">{(mission?.coordinates?.lat || 0).toFixed(5)}&deg; N</span></div>
        <div className="text-zinc-600">|</div>
        <div>LON: <span className="text-white font-semibold">{(mission?.coordinates?.lon || 0).toFixed(5)}&deg; E</span></div>
        <div className="text-zinc-600">|</div>
        <div>GSD: <span className="text-emerald-400 font-semibold">{mission?.flightProfile?.groundSampleDistanceCm} cm/px</span></div>
        <div className="text-zinc-600">|</div>
        <div><span className="text-cyan-400 font-semibold">WGS84 / UTM</span></div>
      </div>
    </div>
  );
}

