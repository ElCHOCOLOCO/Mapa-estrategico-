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

      // --- HIDE ALL BASE LAYERS FOR CLEAN SLATE ---
      const style = map.current.getStyle();
      if (style && style.layers) {
        style.layers.forEach(layer => {
          map.current?.setLayoutProperty(layer.id, 'visibility', 'none');
        });
      }

      // Add Parchment Background
      map.current.addLayer({
        'id': 'parchment-bg',
        'type': 'background',
        'paint': {
          'background-color': '#f4f1ea'
        }
      });

      map.current.addSource('mapbox-dem', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
        'tileSize': 512,
        'maxzoom:': 14
      });
      
      map.current.setTerrain({ source: 'mapbox-dem', exaggeration: 2.5 });

      const ufjfGeoJSON: any = {
        'type': 'Feature',
        'geometry': {
          'type': 'Polygon',
          'coordinates': [[
            [-43.3765, -21.7830],
            [-43.3795, -21.7780],
            [-43.3745, -21.7730],
            [-43.3620, -21.7700],
            [-43.3610, -21.7740],
            [-43.3660, -21.7800],
            [-43.3765, -21.7830]
          ]]
        }
      };

      map.current.addSource('ufjf-perimeter', {
        'type': 'geojson',
        'data': ufjfGeoJSON
      });

      // Show Hillshade
      map.current.addLayer({
        'id': 'ufjf-hillshade',
        'type': 'hillshade',
        'source': 'mapbox-dem',
        'paint': {
          'hillshade-exaggeration': 0.5
        }
      });

      // 3D Buildings - Show everywhere (will be masked outside)
      map.current.addLayer({
        'id': '3d-buildings',
        'source': 'composite',
        'source-layer': 'building',
        'filter': ['==', 'extrude', 'true'],
        'type': 'fill-extrusion',
        'minzoom': 15,
        'paint': {
          'fill-extrusion-color': '#8b7d6b',
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.9
        }
      });

      // Roads
      map.current.addLayer({
        'id': 'ufjf-roads',
        'source': 'composite',
        'source-layer': 'road',
        'type': 'line',
        'paint': {
          'line-color': '#d4c9b0',
          'line-width': 1.5
        }
      });

      // --- EXTREME ISOLATION 3D MASK ---
      // A large polygon covering the world with a hole in UFJF
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
              ufjfGeoJSON.geometry.coordinates[0] // The "hole"
            ]
          }
        }
      });

      // Tall 3D Wall Mask to hide everything outside
      map.current.addLayer({
        'id': 'ufjf-mask-3d',
        'type': 'fill-extrusion',
        'source': 'ufjf-mask',
        'paint': {
          'fill-extrusion-color': '#f4f1ea',
          'fill-extrusion-height': 500, // Very tall to hide buildings
          'fill-extrusion-opacity': 1.0
        }
      });

      map.current.setFog({
          'range': [0.5, 10],
          'color': '#f4f1ea',
          'high-color': '#e5c07b',
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
