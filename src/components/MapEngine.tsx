import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import type { InstituteData } from '../data/institutes';

// TODO: Replace with your actual Mapbox token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''; 

const UFJF_CENTER: [number, number] = [-43.3715, -21.7762];

interface MapEngineProps {
  institutes: InstituteData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const MapEngine: React.FC<MapEngineProps> = ({ institutes, selectedId, onSelect }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: UFJF_CENTER,
      zoom: 15.8,
      pitch: 65,
      bearing: -20,
      antialias: true,
      maxBounds: [
        [-43.395, -21.805], // South-West (expanded slightly to cover FAMED area)
        [-43.355, -21.755]  // North-East (expanded slightly for Portão Norte)
      ],
      minZoom: 15.2,
      maxZoom: 18,
      renderWorldCopies: false
    });

    map.current.on('load', () => {
      if (!map.current) return;

      map.current.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14
      });
      
      map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 2.5 }); // High relief

      map.current.setFog({
          'range': [0.5, 10],
          'color': '#f4f1ea', // Match parchment background
          'high-color': '#e5c07b', // Golden horizon
          'space-color': '#f4f1ea',
          'horizon-blend': 0.1
      });

      map.current.addLayer({
          'id': 'sky',
          'type': 'sky',
          'paint': {
              'sky-type': 'atmosphere',
              'sky-atmosphere-sun': [0.0, 90.0],
              'sky-atmosphere-sun-intensity': 15,
              'sky-atmosphere-color': '#f4f1ea',
              'sky-atmosphere-halo-color': '#e5c07b'
          }
      });

      // 3D Buildings - Filtered for UFJF area locally
      map.current.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['all', ['==', 'extrude', 'true'], ['>', 'height', 0]],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
          'fill-extrusion-color': '#8b7d6b',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.8
        }
      });

      // --- ISOLATION MASK ---
      // A large polygon covering the world with a hole in UFJF
      const UFJF_PERIMETER = [
        [-43.3765, -21.7830], // FAMED / Hospital area
        [-43.3795, -21.7780], // Reitoria / Ring West
        [-43.3745, -21.7730], // Ring North
        [-43.3620, -21.7700], // Portão Norte
        [-43.3610, -21.7740], // ICH area
        [-43.3660, -21.7800], // Law / Ring South
        [-43.3765, -21.7830]  // Back to FAMED
      ];

      map.current.addSource('ufjf-mask', {
        'type': 'geojson',
        'data': {
          'type': 'Feature',
          'geometry': {
            'type': 'Polygon',
            'coordinates': [
              [
                [-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90] // World
              ],
              UFJF_PERIMETER // The "hole"
            ]
          }
        }
      });

      map.current.addLayer({
        'id': 'ufjf-mask-fill',
        'type': 'fill',
        'source': 'ufjf-mask',
        'paint': {
          'fill-color': '#f4f1ea', // Match parchment
          'fill-opacity': 1.0
        }
      });

      // Hide roads and labels outside the perimeter via filters if possible
      // or simply rely on the solid mask covering them.
    });

    return () => map.current?.remove();
  }, []);

  // Sync Markers
  useEffect(() => {
    if (!map.current) return;

    // Remove old markers that aren't in the list anymore
    markers.current.forEach((marker, id) => {
      if (!institutes.find(i => i.id === id)) {
        marker.remove();
        markers.current.delete(id);
      }
    });

    // Add/Update markers
    institutes.forEach(inst => {
      let marker = markers.current.get(inst.id);
      
      if (!marker) {
        const el = document.createElement('div');
        el.className = 'tactical-marker';
        
        marker = new mapboxgl.Marker(el)
          .setLngLat(inst.coordinates)
          .addTo(map.current!);
        
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelect(inst.id);
        });

        markers.current.set(inst.id, marker);
      }

      // Update appearance based on selection
      const el = marker.getElement();
      el.className = `tactical-marker ${inst.id === selectedId ? 'selected' : ''}`;
      el.innerHTML = `
        <div class="marker-flag"></div>
        <div class="marker-label">${inst.name.split(' ')[0]}</div>
      `;
    });
  }, [institutes, selectedId, onSelect]);

  return <div ref={mapContainer} className="map-container" />;
};

export default MapEngine;
