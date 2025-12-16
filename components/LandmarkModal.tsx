'use client';
import { calculateDistance, calculateETA } from '@/utils/geoHelper';

export default function LandmarkModal({ landmark, userLoc, onClose, onRoute, onCollect, isVisited }: any) {
  if (!landmark) return null;

  let distanceInfo = "???";
  let etaInfo = "???";
  if (userLoc && !isVisited) {
    const dist = calculateDistance(userLoc[0], userLoc[1], landmark.lat, landmark.lng);
    distanceInfo = dist > 1000 ? `${(dist / 1000).toFixed(1)} km` : `${Math.floor(dist)} m`;
    etaInfo = calculateETA(dist);
  }

  const activeGradient = 'from-blue-600 to-indigo-700';

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-end md:justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      
      <div className="relative w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl animate-slide-up flex flex-col max-h-[85vh]">
        
        <div className={`relative h-48 bg-gradient-to-br ${activeGradient} flex items-center justify-center overflow-hidden shrink-0`}>
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
          
          <button 
            onClick={onClose} 
            className="absolute top-3 right-3 btn btn-sm btn-circle bg-black/20 backdrop-blur-md border-none text-white hover:bg-black/40 shadow-lg z-20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/30 bg-black/20 shadow-md">
             LANDMARK
          </div>

          <img 
            src={landmark.image_url} 
            alt={landmark.name}
            className={`w-full h-full object-cover transition-transform duration-700 ${!isVisited ? 'grayscale contrast-125' : 'hover:scale-105'}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

          {isVisited ? (
             <div className="absolute bottom-3 left-3 bg-emerald-500 text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 border border-white/20 z-10 animate-in bounce-in">
                ✅ SUDAH DIKUNJUNGI
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

        <div className="flex-1 bg-white px-5 py-5 flex flex-col overflow-hidden">
          
          <div className="flex justify-between items-start mb-2 shrink-0">
            <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter leading-none">{landmark.name}</h2>
              {!isVisited && (
                 <div className="flex items-center gap-1 mt-1 text-blue-600 font-bold text-[10px]">
                    <span>✨ Reward:</span><span className="bg-blue-100 px-1.5 py-0.5 rounded text-blue-700">+500 XP</span>
                 </div>
              )}
            </div>
            <div className={`px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase shadow-md bg-gradient-to-r ${activeGradient}`}>SEJARAH</div>
          </div>

          <hr className="border-slate-100 my-3 shrink-0" />
          
          <p className="text-slate-500 text-xs italic border-l-4 border-blue-300 pl-3 py-1 mb-4 leading-relaxed bg-blue-50 rounded-r-lg shrink-0">
            "{landmark.description}"
          </p>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-xs text-blue-900 leading-relaxed flex gap-3 shadow-sm relative overflow-hidden flex-1 min-h-0">
            <span className="text-xl mt-0.5 shrink-0">🏛️</span>
            <div className="w-full flex flex-col h-full">
               <strong className="block mb-2 text-blue-950 font-bold uppercase tracking-wide border-b border-blue-200 pb-1 shrink-0">Filosofi & Sejarah</strong>
               
               <div className="overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent flex-1">
                 {isVisited ? (
                   <div className="text-justify whitespace-pre-line pb-2">
                     {landmark.philosophy || "Informasi belum tersedia."}
                   </div>
                 ) : (
                   <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                      <span className="text-2xl mb-1 grayscale">🔒</span>
                      <span className="font-bold italic text-blue-800 text-[10px]">Check-in untuk membuka sejarah!</span>
                   </div>
                 )}
               </div>
            </div>
          </div>

          {userLoc && !isVisited && (
            <div className="grid grid-cols-2 gap-3 mt-4 pt-2 border-t border-slate-100 shrink-0">
                <button onClick={() => onRoute(landmark)} className="btn h-12 min-h-0 bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 rounded-xl flex flex-col gap-0 normal-case transition-all shadow-sm">
                <span className="text-lg mb-0.5">🗺️</span><span className="text-[10px] font-bold">Rute</span>
                </button>
                <button onClick={() => onCollect(landmark)} className={`btn h-12 min-h-0 border-none text-white rounded-xl shadow-lg shadow-blue-200 bg-gradient-to-r ${activeGradient} hover:brightness-110 hover:scale-[1.02] flex flex-col gap-0 normal-case transition-all`}>
                <span className="text-lg mb-0.5">🚩</span><span className="text-[10px] font-bold">Check-in</span>
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}