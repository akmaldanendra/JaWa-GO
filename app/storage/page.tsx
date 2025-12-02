'use client';
import { supabase } from '@/utils/supabase';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import PokemonModal from '@/components/PokemonModal'; 
import LandmarkModal from '@/components/LandmarkModal'; 

export default function StoragePage() {
  const [myPokemons, setMyPokemons] = useState<any[]>([]);
  const [myLandmarks, setMyLandmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'wayang' | 'landmark'>('wayang');
  
  // --- SORTING STATES ---
  const [wayangSortBy, setWayangSortBy] = useState<'date' | 'rarity' | 'name'>('date');
  const [wayangSortOrder, setWayangSortOrder] = useState<'asc' | 'desc'>('desc'); // Default terbaru
  const [landmarkSortOrder, setLandmarkSortOrder] = useState<'asc' | 'desc'>('desc'); // Default terbaru

  // State untuk Popup Detail
  const [selectedWayang, setSelectedWayang] = useState<any>(null);
  const [selectedLandmark, setSelectedLandmark] = useState<any>(null);

  useEffect(() => {
    async function getStorage() {
      const { data: { user } } = await supabase.auth.getUser();
      if(!user) return;

      // 1. Get Wayang
      const { data: wayangData } = await supabase
        .from('user_storage')
        .select(`
          id, 
          caught_at, 
          pokedex ( id, name, type, image_url, description, education, rarity, xp_reward )
        `)
        .eq('user_id', user.id); // Sorting default di client aja biar dinamis

      // 2. Get Landmarks
      const { data: lmData } = await supabase
        .from('user_landmarks')
        .select(`
          id, 
          visited_at, 
          landmarks ( id, name, image_url, description, philosophy, lat, lng )
        `)
        .eq('user_id', user.id);

      if (wayangData) setMyPokemons(wayangData);
      if (lmData) setMyLandmarks(lmData);
      setLoading(false);
    }

    getStorage();
  }, []);

  // --- SORTING LOGIC ---
  const rarityValue = (rarity: string) => {
    switch(rarity) {
      case 'Legendary': return 3;
      case 'Rare': return 2;
      default: return 1;
    }
  };

  const sortedWayang = useMemo(() => {
    return [...myPokemons].sort((a, b) => {
      let comparison = 0;
      if (wayangSortBy === 'date') {
        comparison = new Date(a.caught_at).getTime() - new Date(b.caught_at).getTime();
      } else if (wayangSortBy === 'rarity') {
        comparison = rarityValue(a.pokedex.rarity) - rarityValue(b.pokedex.rarity);
      } else if (wayangSortBy === 'name') {
        comparison = a.pokedex.name.localeCompare(b.pokedex.name);
      }
      return wayangSortOrder === 'asc' ? comparison : -comparison;
    });
  }, [myPokemons, wayangSortBy, wayangSortOrder]);

  const sortedLandmarks = useMemo(() => {
    return [...myLandmarks].sort((a, b) => {
      const comparison = new Date(a.visited_at).getTime() - new Date(b.visited_at).getTime();
      return landmarkSortOrder === 'asc' ? comparison : -comparison;
    });
  }, [myLandmarks, landmarkSortOrder]);

  const closeModals = () => {
    setSelectedWayang(null);
    setSelectedLandmark(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans relative">
      {/* Header Fixed */}
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10 border-b border-slate-200">
        <div className="flex justify-between items-center mb-4 max-w-2xl mx-auto">
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            Inventory
          </h1>
          <Link href="/" className="btn btn-sm btn-circle btn-ghost text-slate-500 bg-slate-100 hover:bg-slate-200">✕</Link>
        </div>

        {/* Tabs Switcher */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-xl max-w-2xl mx-auto mb-3">
          <button 
            onClick={() => setActiveTab('wayang')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'wayang' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Wayang ({myPokemons.length})
          </button>
          <button 
            onClick={() => setActiveTab('landmark')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'landmark' ? 'bg-white shadow text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Landmarks ({myLandmarks.length})
          </button>
        </div>

        {/* FILTER & SORT BAR */}
        <div className="max-w-2xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {activeTab === 'wayang' ? (
            <>
              {/* Sort Criteria Dropdown */}
              <select 
                className="select select-bordered select-xs w-full max-w-[140px] bg-white text-slate-600 focus:outline-none"
                value={wayangSortBy}
                onChange={(e: any) => setWayangSortBy(e.target.value)}
              >
                <option value="date">Tanggal</option>
                <option value="rarity">Kelangkaan</option>
                <option value="name">Nama (A-Z)</option>
              </select>

              {/* Order Toggle */}
              <button 
                onClick={() => setWayangSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="btn btn-xs btn-outline border-slate-300 text-slate-500"
              >
                {wayangSortOrder === 'asc' ? 'Naik' : 'Turun'}
              </button>
            </>
          ) : (
            // Sort Landmark (Cuma Tanggal)
            <button 
                onClick={() => setLandmarkSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="btn btn-xs btn-outline border-slate-300 text-slate-500 w-full"
              >
                Urutkan: {landmarkSortOrder === 'asc' ? 'Terlama' : 'Terbaru'}
              </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 pb-20 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center mt-20 text-slate-400 gap-2">
             <span className="loading loading-dots loading-md"></span>
             <span className="text-xs">Membuka tas...</span>
          </div>
        ) : (
          <>
            {/* === TAB WAYANG === */}
            {activeTab === 'wayang' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sortedWayang.length === 0 ? (
                  <p className="col-span-full text-center text-slate-400 text-sm mt-10 italic">Belum ada wayang yang ditangkap.</p>
                ) : (
                  sortedWayang.map((item) => {
                    // Visual Rarity
                    const isLegend = item.pokedex.rarity === 'Legendary';
                    const isRare = item.pokedex.rarity === 'Rare';
                    const borderColor = isLegend ? 'border-purple-300' : isRare ? 'border-blue-300' : 'border-slate-200';
                    const bgColor = isLegend ? 'bg-purple-50' : isRare ? 'bg-blue-50' : 'bg-white';

                    return (
                      <div 
                        key={item.id} 
                        onClick={() => setSelectedWayang(item)} 
                        className={`flex items-center gap-4 p-3 rounded-2xl shadow-sm border ${borderColor} ${bgColor} hover:shadow-md transition-all cursor-pointer active:scale-95`}
                      >
                        <div className="w-20 h-20 bg-white rounded-xl flex-shrink-0 flex items-center justify-center border border-slate-100 relative overflow-hidden">
                           <img src={item.pokedex.image_url} alt="" className="w-16 h-16 object-contain" />
                           <span className={`absolute bottom-0 right-0 text-[8px] px-1.5 py-0.5 rounded-tl-lg font-bold text-white uppercase ${isLegend ? 'bg-purple-500' : isRare ? 'bg-blue-500' : 'bg-slate-400'}`}>
                             {item.pokedex.rarity}
                           </span>
                        </div>

                        <div className="flex-1 min-w-0">
                           <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">{item.pokedex.name}</h3>
                           <span className="text-[10px] inline-block bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-500 font-bold mb-1 mt-1">
                             {item.pokedex.type}
                           </span>
                           <p className="text-[9px] text-slate-400 mt-1">
                             Ditangkap: {new Date(item.caught_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                           </p>
                        </div>
                        <span className="text-slate-300">➔</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* === TAB LANDMARK === */}
            {activeTab === 'landmark' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sortedLandmarks.length === 0 ? (
                  <p className="col-span-full text-center text-slate-400 text-sm mt-10 italic">Belum pernah check-in kemana-mana.</p>
                ) : (
                  sortedLandmarks.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => setSelectedLandmark(item.landmarks)}
                      className="flex items-center gap-4 p-3 bg-white rounded-2xl shadow-sm border border-blue-100 hover:shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      <img src={item.landmarks.image_url} alt="" className="w-20 h-20 object-cover rounded-xl bg-gray-200 border border-slate-100" />
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-black text-blue-900 truncate">{item.landmarks.name}</h3>
                        <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight my-1">{item.landmarks.description}</p>
                        <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                          ✓ {new Date(item.visited_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                        </span>
                      </div>
                      <span className="text-slate-300">➔</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* --- MODAL DETAILS --- */}
      {selectedWayang && (
        <PokemonModal 
          pokemon={selectedWayang} 
          userLoc={null} 
          isCaught={true} 
          onClose={closeModals}
          onRoute={() => {}} 
          onCatch={() => {}} 
        />
      )}

      {selectedLandmark && (
        <LandmarkModal 
          landmark={selectedLandmark}
          userLoc={null}
          isVisited={true} 
          onClose={closeModals}
          onCollect={() => {}}
          onRoute={() => {}}
        />
      )}

      {/* Style Override */}
      {(selectedWayang || selectedLandmark) && (
        <style jsx global>{`
          .btn-primary, .btn-outline { display: none !important; }
          .grid-cols-2 { display: none !important; }
        `}</style>
      )}

    </div>
  );
}