'use client';
import { calculateDistance, calculateETA } from '@/utils/geoHelper';

export default function PokemonModal({ pokemon, userLoc, onClose, onRoute, onCatch, isCaught }: any) {
  if (!pokemon) return null;

  // Logic ETA (Hanya hitung jika userLoc ada dan BELUM ditangkap)
  let distanceInfo = "???";
  let etaInfo = "???";

  if (userLoc && !isCaught) {
    const dist = calculateDistance(userLoc[0], userLoc[1], pokemon.lat, pokemon.lng);
    distanceInfo = dist > 1000 ? `${(dist / 1000).toFixed(1)} km` : `${Math.floor(dist)} m`;
    etaInfo = calculateETA(dist);
  }

  const typeColors: any = {
    Angin: 'from-teal-400 to-emerald-600',
    Api: 'from-orange-500 to-red-600',
    Bumi: 'from-amber-700 to-yellow-600',
    Air: 'from-blue-500 to-cyan-500',
    Petir: 'from-yellow-400 to-amber-500',
    Cahaya: 'from-yellow-200 to-orange-300',
    Bulan: 'from-indigo-500 to-purple-600',
    Spirit: 'from-violet-500 to-fuchsia-600',
    Default: 'from-slate-400 to-slate-600'
  };
  const activeGradient = typeColors[pokemon.pokedex.type] || typeColors.Default;

  const rarityColors: any = {
    Common: 'bg-slate-500',
    Rare: 'bg-blue-600 border-blue-400',
    Legendary: 'bg-purple-600 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.6)]'
  };
  const rarityBg = rarityColors[pokemon.pokedex.rarity] || 'bg-slate-500';

  // Format Tanggal Tangkap (Jika ada)
  const caughtDate = pokemon.caught_at 
    ? new Date(pokemon.caught_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-end md:justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      
      {/* Container Modal */}
      <div className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl animate-slide-up flex flex-col max-h-[85vh]">
        
        {/* HEADER */}
        <div className={`relative h-48 bg-gradient-to-br ${activeGradient} flex items-center justify-center p-4 shrink-0 overflow-hidden`}>
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
          
          <button 
            onClick={onClose} 
            className="absolute top-3 right-3 btn btn-sm btn-circle bg-black/20 backdrop-blur-md border-none text-white hover:bg-black/40 shadow-lg z-20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className={`absolute top-3 left-3 z-10 px-2 py-0.5 rounded-full text-[9px] font-black text-white uppercase tracking-widest border ${rarityBg} shadow-md`}>
             {pokemon.pokedex.rarity || 'Common'}
          </div>

          <img 
            src={pokemon.pokedex.image_url} 
            alt={pokemon.pokedex.name}
            className={`relative z-10 h-40 w-40 object-contain drop-shadow-2xl transition-transform duration-500 filter ${!isCaught ? 'brightness-0 contrast-125 opacity-70' : 'hover:scale-110'}`} 
          />

          {/* STATUS BAR: TAMPILKAN JARAK (DI MAP) ATAU TANGGAL (DI KOLEKSI) */}
          {isCaught ? (
             <div className="absolute bottom-3 left-3 bg-emerald-500 text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 border border-white/20 z-10 animate-in bounce-in">
                ✅ DITANGKAP: {caughtDate}
             </div>
          ) : (
             userLoc && (
                <div className="absolute bottom-3 left-3 right-3 flex justify-between z-10">
                   <div className="bg-black/30 backdrop-blur-md px-2 py-1 rounded-full border border-white/20 shadow-lg flex items-center gap-1">
                      <span className="text-xs">📍</span><span className="text-[10px] text-white font-bold">{distanceInfo}</span>
                   </div>
                   <div className="bg-black/30 backdrop-blur-md px-2 py-1 rounded-full border border-white/20 shadow-lg flex items-center gap-1">
                      <span className="text-xs">⏱️</span><span className="text-[10px] text-white font-bold">{etaInfo}</span>
                   </div>
                </div>
             )
          )}
        </div>

        {/* BODY (Fixed Height Container) */}
        <div className="flex-1 bg-white px-5 py-5 flex flex-col overflow-hidden">
          
          {/* Title Area (Fixed) */}
          <div className="flex justify-between items-start mb-2 shrink-0">
            <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">{pokemon.pokedex.name}</h2>
              {!isCaught && (
                <div className="flex items-center gap-1 mt-1 text-amber-600 font-bold text-[10px]">
                   <span>✨ Reward:</span><span className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-700">+{pokemon.pokedex.xp_reward || 100} XP</span>
                </div>
              )}
            </div>
            <div className={`px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase shadow-md bg-gradient-to-r ${activeGradient}`}>{pokemon.pokedex.type}</div>
          </div>

          <hr className="border-slate-100 my-3 shrink-0" />
          
          {/* Deskripsi Singkat (Fixed) */}
          <p className="text-slate-500 text-xs italic border-l-4 border-slate-300 pl-3 py-1 mb-4 leading-relaxed bg-slate-50 rounded-r-lg shrink-0">
            "{pokemon.pokedex.description}"
          </p>

          {/* BOX FILOSOFI (SCROLLABLE AREA) */}
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-xs text-amber-900 leading-relaxed flex gap-3 shadow-sm relative overflow-hidden flex-1 min-h-0">
            <span className="text-xl mt-0.5 shrink-0">💡</span>
            <div className="w-full flex flex-col h-full">
               <strong className="block mb-2 text-amber-950 font-bold uppercase tracking-wide border-b border-amber-200 pb-1 shrink-0">Filosofi Budaya</strong>
               
               {/* Area Scrollable Teks */}
               <div className="overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-200 scrollbar-track-transparent flex-1">
                 {isCaught ? (
                   <div className="text-justify whitespace-pre-line pb-2">
                     {pokemon.pokedex.education || "Informasi belum tersedia."}
                   </div>
                 ) : (
                   <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                      <span className="text-2xl mb-1 grayscale">🔒</span>
                      <span className="font-bold italic text-amber-800 text-[10px]">Tangkap untuk membuka rahasia!</span>
                   </div>
                 )}
               </div>
            </div>
          </div>

          {/* TOMBOL AKSI (Hanya muncul jika BELUM ditangkap) */}
          {!isCaught && (
            <div className="grid grid-cols-2 gap-3 mt-4 pt-2 border-t border-slate-100 shrink-0">
                <button onClick={() => onRoute(pokemon)} className="btn h-12 min-h-0 bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 rounded-xl flex flex-col gap-0 normal-case transition-all shadow-sm">
                <span className="text-lg mb-0.5">🗺️</span><span className="text-[10px] font-bold">Rute</span>
                </button>
                <button onClick={() => onCatch(pokemon)} className={`btn h-12 min-h-0 border-none text-white rounded-xl shadow-lg shadow-indigo-200 bg-gradient-to-r ${activeGradient} hover:brightness-110 hover:scale-[1.02] flex flex-col gap-0 normal-case transition-all`}>
                <span className="text-lg mb-0.5">🕸️</span><span className="text-[10px] font-bold">Tangkap!</span>
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}