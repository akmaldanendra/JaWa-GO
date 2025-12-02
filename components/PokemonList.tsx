'use client';
import { calculateDistance, calculateETA, getMockAddress } from '@/utils/geoHelper';

interface PokemonListProps {
  spawns: any[];
  userLoc: [number, number] | null;
  onItemClick: (spawn: any) => void;
}

export default function PokemonList({ spawns, userLoc, onItemClick }: PokemonListProps) {
  // 1. Loading State kalo GPS belum dapet
  if (!userLoc) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-slate-400">
        <span className="loading loading-dots loading-md mb-2"></span>
        <p className="text-xs font-semibold">Melacak Lokasi...</p>
      </div>
    );
  }

  // 2. Empty State
  if (!spawns || spawns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-slate-400">
        <p className="text-4xl mb-2 grayscale">🍃</p>
        <p className="text-xs">Sepi amat, ga ada wayang.</p>
      </div>
    );
  }

  // 3. LOGIC SAKTI: Hitung Jarak -> Urutkan -> Ambil 5 Terdekat
  const nearSpawns = spawns
    .map((spawn) => {
      const dist = calculateDistance(userLoc[0], userLoc[1], spawn.lat, spawn.lng);
      return { ...spawn, distance: dist }; // Masukin jarak ke object sementara
    })
    .sort((a, b) => a.distance - b.distance) // Urutkan Ascending (Terdekat dulu)
    .slice(0, 5); // Cuma ambil 5 biji

  return (
    <div className="flex flex-col gap-3 pb-24 px-1">
      {nearSpawns.map((spawn) => {
        // Hitung Data Display
        const address = getMockAddress(spawn.lat, spawn.lng);
        const eta = calculateETA(spawn.distance);
        const distDisplay = spawn.distance > 1000 
          ? `${(spawn.distance / 1000).toFixed(1)} km` 
          : `${Math.floor(spawn.distance)} m`;

        return (
          <div 
            key={spawn.id}
            onClick={() => onItemClick(spawn)}
            className="group flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-amber-400 hover:shadow-md active:scale-95 transition-all cursor-pointer"
          >
            {/* KIRI: FOTO WAYANG */}
            <div className="relative w-16 h-16 bg-slate-50 rounded-xl flex-shrink-0 border border-slate-200 p-1 group-hover:bg-amber-50 transition-colors">
               <img 
                src={spawn.image_url || "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"} 
                alt={spawn.name}
                className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform"
              />
            </div>

            {/* TENGAH: INFO UTAMA */}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-800 text-sm truncate group-hover:text-amber-600 transition-colors">
                {spawn.name}
              </h4>
              <p className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                📍 {address}
              </p>
              
              {/* Badge Element */}
              <div className="flex gap-1 mt-1.5">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-md border border-slate-200 uppercase tracking-wider">
                  {spawn.type}
                </span>
              </div>
            </div>

            {/* KANAN: STATISTIK (JARAK & WAKTU) */}
            <div className="flex flex-col items-end gap-1 text-right min-w-[70px]">
              <span className="font-black text-slate-700 text-sm">{distDisplay}</span>
              <div className="badge badge-sm border-none bg-green-100 text-green-700 text-[10px] font-bold gap-1">
                ⏱️ {eta}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}