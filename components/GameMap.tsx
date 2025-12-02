'use client';

import { MapContainer, TileLayer, Marker, useMap, useMapEvents, Polyline, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { useState, useEffect } from 'react';
import L from 'leaflet';

// --- ICON SETUP (CUSTOM IMAGE) ---

// 1. Icon User (Titik Biru GPS - Tetap CSS biar ringan)
const userIcon = new L.DivIcon({
  className: 'bg-transparent',
  html: '<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>',
});

// 2. Icon Wayang (Ganti Pokeball jadi Logo Kamu)
const wayangIcon = new L.Icon({
  iconUrl: '/wayang-marker.png', // <--- PASTIIN FILE INI ADA DI FOLDER PUBLIC
  iconSize: [35, 35],    // Ukuran gambar (lebar, tinggi)
  iconAnchor: [22, 45],  // Titik tumpu (tengah bawah)
  popupAnchor: [0, -50], // Posisi popup kalo ada
  className: 'drop-shadow-lg' // Efek bayangan & animasi
});

// 3. Icon Landmark (Ganti Belah Ketupat jadi Logo Kamu)
const landmarkIcon = new L.Icon({
  iconUrl: '/landmark-marker.png', // <--- PASTIIN FILE INI ADA DI FOLDER PUBLIC
  iconSize: [50, 50],
  iconAnchor: [25, 50],
  popupAnchor: [0, -45],
  className: 'drop-shadow-lg'
});

// 4. Icon Landmark Visited (Ganti Centang Hijau jadi Logo Kamu)
const visitedIcon = new L.DivIcon({
  className: 'bg-transparent',
  html: `<div style="
    background: #10b981;
    width: 32px; height: 32px; 
    border-radius: 50%; 
    border: 3px solid white; 
    box-shadow: 0 4px 10px rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center;
    color: white; font-size: 18px; font-weight: bold;
  ">✓</div>`
});


// --- SUB-COMPONENT: GPS TRACKER ---
function UserLocationHandler({ setUserLoc }: { setUserLoc: (loc: [number, number]) => void }) {
  const map = useMap();
  const [position, setPosition] = useState<L.LatLng | null>(null);

  useMapEvents({
    locationfound(e) {
      setPosition(e.latlng);
      setUserLoc([e.latlng.lat, e.latlng.lng]);
    },
  });

  useEffect(() => {
    map.locate({ watch: true, enableHighAccuracy: true }); 
  }, [map]);

  return position === null ? null : (
    <>
      <Marker position={position} icon={userIcon} />
      <Circle center={position} radius={50} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.1, weight: 1, dashArray: '5,5' }} />
    </>
  );
}

// --- SUB-COMPONENT: RUTE & NAVIGASI ---
function RouteLayer({ userLoc, targetLoc, onClear }: { userLoc: [number, number] | null, targetLoc: [number, number] | null, onClear: () => void }) {
  const [routes, setRoutes] = useState<any[]>([]);
  const [activeRouteIdx, setActiveRouteIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const map = useMap();

  useEffect(() => {
    if (!userLoc || !targetLoc) {
      setRoutes([]);
      return;
    }

    const fetchRoute = async () => {
      setLoading(true);
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${userLoc[1]},${userLoc[0]};${targetLoc[1]},${targetLoc[0]}?overview=full&geometries=geojson&alternatives=true`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes && data.routes.length > 0) {
          const uniqueRoutes = data.routes.filter((route: any, index: number, self: any[]) =>
            index === self.findIndex((r: any) => (
              Math.abs(r.distance - route.distance) < 50
            ))
          );

          setRoutes(uniqueRoutes);
          setActiveRouteIdx(0);
          
          const allCoords: any[] = [];
          uniqueRoutes.forEach((r: any) => {
             r.geometry.coordinates.forEach((c: number[]) => allCoords.push([c[1], c[0]]));
          });
          
          if(allCoords.length > 0) {
             map.fitBounds(L.latLngBounds(allCoords), { padding: [50, 150] }); 
          }
        }
      } catch (err) {
        console.error("Gagal ambil rute:", err);
      }
      setLoading(false);
    };

    fetchRoute();
  }, [userLoc, targetLoc, map]);

  if (routes.length === 0) return null;

  return (
    <>
      {routes.map((route, idx) => {
        if (idx === activeRouteIdx) return null;
        const coords = route.geometry.coordinates.map((c: number[]) => [c[1], c[0]]);
        return (
          <Polyline 
            key={`inactive-${idx}`}
            positions={coords}
            color="#94a3b8" 
            weight={6}
            opacity={0.6}
            eventHandlers={{ click: () => setActiveRouteIdx(idx) }}
          />
        );
      })}

      {routes[activeRouteIdx] && (
        <Polyline
          key={`active-${activeRouteIdx}`}
          positions={routes[activeRouteIdx].geometry.coordinates.map((c: number[]) => [c[1], c[0]])}
          color="#3b82f6"
          weight={8}
          opacity={1}
        />
      )}

      {/* PANEL NAVIGASI */}
      <div className="leaflet-top leaflet-right" style={{ marginTop: '80px', marginRight: '10px', pointerEvents: 'auto' }}>
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden min-w-[240px] animate-in slide-in-from-right border border-gray-200">
          
          <div className="bg-blue-600 p-3 flex justify-between items-center text-white">
            <div className="flex flex-col">
               <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Navigasi Aktif</span>
               <span className="font-bold text-sm">Pilih Jalur</span>
            </div>
            <button 
              onClick={onClear}
              className="btn btn-xs btn-circle bg-white/20 border-none text-white hover:bg-white/40"
              title="Keluar Navigasi"
            >✕</button>
          </div>

          <div className="flex flex-col max-h-60 overflow-y-auto bg-gray-50">
            {loading ? (
              <div className="p-4 text-center text-gray-400 text-xs">Menghitung rute...</div>
            ) : (
              routes.map((route, idx) => {
                const isActive = idx === activeRouteIdx;
                const durationMins = Math.ceil(route.duration / 60);
                const distKm = (route.distance / 1000).toFixed(1);
                const arrivalTime = new Date(Date.now() + route.duration * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                return (
                  <div 
                    key={idx}
                    onClick={() => setActiveRouteIdx(idx)}
                    className={`
                      relative p-3 cursor-pointer transition-all border-b border-gray-100 last:border-0
                      ${isActive ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}
                    `}
                  >
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>}

                    <div className="flex justify-between items-start mb-1">
                      <div className="flex flex-col">
                         <span className={`font-bold text-sm ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                           {idx === 0 ? `Rute Tercepat (${durationMins} mnt)` : `Alternatif ${idx} (${durationMins} mnt)`}
                         </span>
                         <span className="text-[10px] text-gray-500">
                           {distKm} km • Tiba pukul {arrivalTime}
                         </span>
                      </div>
                      
                      {idx === 0 && <span className="badge badge-xs badge-success text-white">Best</span>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// --- MAIN COMPONENT ---
interface GameMapProps {
  spawns: any[];
  landmarks: any[];
  visitedLandmarks: number[];
  userLoc: [number, number] | null;
  setUserLoc: (loc: [number, number]) => void;
  onMarkerClick: (spawn: any) => void;
  onLandmarkClick: (landmark: any) => void;
  routeTarget: [number, number] | null;
  onClearRoute: () => void;
}

export default function GameMap({ spawns, landmarks, visitedLandmarks, userLoc, setUserLoc, onMarkerClick, onLandmarkClick, routeTarget, onClearRoute }: GameMapProps) {
  const defaultCenter: [number, number] = [-7.7829, 110.3670];

  return (
    <MapContainer 
      center={defaultCenter} 
      zoom={14} 
      style={{ height: '100%', width: '100%' }} 
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <UserLocationHandler setUserLoc={setUserLoc} />
      
      <RouteLayer 
        userLoc={userLoc} 
        targetLoc={routeTarget} 
        onClear={onClearRoute} 
      />

      {/* Render Wayang (Semua pakai Icon yang sama: wayang-marker.png) */}
      {spawns.map((spawn) => (
        <Marker 
          key={`spawn-${spawn.id}`} 
          position={[spawn.lat, spawn.lng]} 
          icon={wayangIcon} 
          eventHandlers={{
            click: () => onMarkerClick(spawn),
          }}
        />
      ))}

      {/* Render Landmark */}
      {landmarks.map((lm) => {
        const isVisited = visitedLandmarks.includes(lm.id);
        return (
          <Marker 
            key={`landmark-${lm.id}`} 
            position={[lm.lat, lm.lng]} 
            icon={isVisited ? visitedIcon : landmarkIcon} 
            eventHandlers={{
              click: () => onLandmarkClick(lm),
            }}
          />
        )
      })}
    </MapContainer>
  );
}