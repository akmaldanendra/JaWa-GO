'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/utils/supabase';
import { addExperience } from '@/utils/gameLogic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PokemonModal from '@/components/PokemonModal';
import LandmarkModal from '@/components/LandmarkModal';
import PokemonList from '@/components/PokemonList';
import { calculateDistance, calculateETA } from '@/utils/geoHelper';

// Setup Map
const GameMap = dynamic(() => import('@/components/GameMap'), { 
  ssr: false, 
  loading: () => (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-emerald-400 font-mono">
      <span className="loading loading-ring loading-lg mb-4"></span>
      <span className="tracking-[0.5em] animate-pulse">CONNECTING SATELLITE...</span>
    </div>
  )
});

export default function Home() {
  const router = useRouter();

  const [spawns, setSpawns] = useState<any[]>([]);
  const [landmarks, setLandmarks] = useState<any[]>([]); 
  const [visitedLandmarks, setVisitedLandmarks] = useState<number[]>([]); 
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ wayang: 0, landmark: 0 }); 
  
  const [selectedPokemon, setSelectedPokemon] = useState<any>(null);
  const [selectedLandmark, setSelectedLandmark] = useState<any>(null);
  const [routeTarget, setRouteTarget] = useState<[number, number] | null>(null);
  const [showRadar, setShowRadar] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [levelUpModal, setLevelUpModal] = useState<any>(null);
  
  const [showAbout, setShowAbout] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('all'); 
  const [searchElement, setSearchElement] = useState('all');
  const [isSearchActive, setIsSearchActive] = useState(false);

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUser(user);

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (profileData) {
        setProfile(profileData);
        setNewName(profileData.display_name || 'Trainer');
      }

      const { data: lmData } = await supabase.from('landmarks').select('*');
      if (lmData) setLandmarks(lmData);

      const { data: visitData, count: lmCount } = await supabase
        .from('user_landmarks')
        .select('landmark_id', { count: 'exact' })
        .eq('user_id', user.id);
      
      if (visitData) setVisitedLandmarks(visitData.map(v => v.landmark_id));

      const { count: wayangCount } = await supabase
        .from('user_storage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      setStats({
        wayang: wayangCount || 0,
        landmark: lmCount || 0
      });
    };

    initData();
  }, [router]);

  const fetchSpawns = async () => {
    const { data } = await supabase.from('view_active_spawns').select('*');
    if (data) {
      const formatted = data.map((item: any) => ({
        ...item,
        pokedex: {
          id: item.pokedex_id,
          name: item.name,
          type: item.type,
          description: item.description,
          image_url: item.image_url,
          education: item.education,
          rarity: item.rarity,
          xp_reward: item.xp_reward
        }
      }));
      setSpawns(formatted);
    }
  };

  useEffect(() => {
    fetchSpawns();
    const interval = setInterval(fetchSpawns, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    const confirm = window.confirm("Yakin mau logout dari game?");
    if (confirm) {
        await supabase.auth.signOut();
        router.push('/login');
    }
  };

  const handleSaveName = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: newName })
      .eq('id', user.id);
    
    if (!error) {
      setProfile({ ...profile, display_name: newName });
      setIsEditingName(false);
    }
  };

  const handleMarkerClick = (spawn: any) => {
    const modalData = {
      ...spawn,
      pokedex: spawn.pokedex || { 
        id: spawn.pokedex_id, name: spawn.name, type: spawn.type, 
        description: "Deskripsi tidak tersedia", image_url: spawn.image_url, 
        education: "Info edukasi tidak tersedia", rarity: "Common", xp_reward: 100
      }
    };
    setSelectedPokemon(modalData);
    setSelectedLandmark(null);
    setIsSearchActive(false);
  };

  const handleLandmarkClick = (lm: any) => {
    setSelectedLandmark(lm);
    setSelectedPokemon(null);
    setIsSearchActive(false);
  }

  const handleResultClick = (item: any) => {
    if (item.category === 'wayang') handleMarkerClick(item);
    else handleLandmarkClick(item);
  };

  const handleCatch = async (pokemon: any) => {
    if (!userLoc) return alert('GPS belum ke-detect!');
    const dist = calculateDistance(userLoc[0], userLoc[1], pokemon.lat, pokemon.lng);
    const MAX_RADIUS = 30;

    if (profile?.role !== 'admin' && dist > MAX_RADIUS) return alert(`KEJAUHAN! (${Math.floor(dist)}m)`);

    const { error } = await supabase.from('user_storage').insert({ user_id: user.id, pokedex_id: pokemon.pokedex_id });
    if (!error) {
      await supabase.from('active_spawns').delete().eq('id', pokemon.id);
      const xpReward = pokemon.pokedex.xp_reward || 100;
      const result = await addExperience(user.id, xpReward);

      if (result) {
        setProfile((prev: any) => ({ ...prev, level: result.newLevel, current_xp: prev.current_xp + result.xpGained }));
        if (result.isLevelUp) setLevelUpModal(result.newLevel);
        else alert(`Gotcha! ${pokemon.name} tertangkap.\n+${xpReward} XP`);
      }
      
      setStats(prev => ({ ...prev, wayang: prev.wayang + 1 }));
      setSelectedPokemon(null);
      setRouteTarget(null);
      fetch('/api/spawn');
      fetchSpawns();
    } else {
        alert('Gagal simpan: ' + error.message);
    }
  };

  const handleCollectLandmark = async (lm: any) => {
    if (!userLoc) return alert('GPS belum ke-detect!');
    const dist = calculateDistance(userLoc[0], userLoc[1], lm.lat, lm.lng);
    const MAX_RADIUS = 50; 
    if (profile?.role !== 'admin' && dist > MAX_RADIUS) return alert(`KEJAUHAN! (${Math.floor(dist)}m). Deketin landmarknya bang.`);

    const { error } = await supabase.from('user_landmarks').insert({ user_id: user.id, landmark_id: lm.id });
    if (!error) {
      const xpReward = lm.xp_reward || 500;
      const result = await addExperience(user.id, xpReward);
      if (result) {
        setProfile((prev: any) => ({ ...prev, level: result.newLevel, current_xp: prev.current_xp + xpReward }));
        if (result.isLevelUp) setLevelUpModal(result.newLevel);
        else alert(`Check-in Sukses!\n+${xpReward} XP`);
      }
      
      setVisitedLandmarks([...visitedLandmarks, lm.id]); 
      setStats(prev => ({ ...prev, landmark: prev.landmark + 1 }));

      setSelectedLandmark(null);
      setRouteTarget(null);
    } else {
        alert('Gagal check-in atau udah pernah.');
    }
  };

  const searchResults = useMemo(() => {
    if (!searchQuery && searchCategory === 'all' && searchElement === 'all') return [];
    let results: any[] = [];
    if (searchCategory === 'all' || searchCategory === 'wayang') {
      const matchedWayang = spawns.filter(s => {
        const nameMatch = s.name?.toLowerCase().includes(searchQuery.toLowerCase());
        const typeMatch = searchElement === 'all' || s.type === searchElement;
        return nameMatch && typeMatch;
      });
      results = [...results, ...matchedWayang.map(w => ({ ...w, category: 'wayang' }))];
    }
    if ((searchCategory === 'all' || searchCategory === 'landmark') && searchElement === 'all') {
      const matchedLandmarks = landmarks.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()));
      results = [...results, ...matchedLandmarks.map(l => ({ ...l, category: 'landmark' }))];
    }
    return results.slice(0, 10);
  }, [searchQuery, searchCategory, searchElement, spawns, landmarks]);


  const joinDate = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '2025';

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-slate-900 font-sans">
      
      <div className="absolute inset-0 z-0 map-container-3d">
        <GameMap 
          spawns={spawns} 
          landmarks={landmarks} 
          visitedLandmarks={visitedLandmarks} 
          userLoc={userLoc}
          setUserLoc={setUserLoc}
          onMarkerClick={handleMarkerClick} 
          onLandmarkClick={handleLandmarkClick} 
          routeTarget={routeTarget}
          onClearRoute={() => setRouteTarget(null)}
        />
      </div>

      <div className={`absolute top-0 left-0 right-0 z-40 p-4 pt-6 transition-all duration-300 ${showMenu ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="w-full max-w-xl mx-auto flex gap-2">
           <div className="flex-1 flex gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-white/40 items-center animate-in slide-in-from-top duration-500">
              <span className="text-slate-400 ml-3">🔍</span>
              <input 
                type="text" 
                placeholder="Cari Wayang / Landmark..." 
                className="bg-transparent w-full text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setIsSearchActive(true); }}
                onFocus={() => setIsSearchActive(true)}
              />
              <div className="w-[1px] h-6 bg-slate-200"></div>
              <select className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none cursor-pointer hover:text-blue-600 px-2 max-w-[100px]" value={searchCategory} onChange={(e) => { setSearchCategory(e.target.value); if(e.target.value === 'landmark') setSearchElement('all'); setIsSearchActive(true); }}>
                  <option value="all">Semua</option><option value="wayang">Wayang</option><option value="landmark">Landmark</option>
              </select>
              {searchCategory !== 'landmark' && (
                <select className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none cursor-pointer hover:text-blue-600 px-2 max-w-[80px]" value={searchElement} onChange={(e) => { setSearchElement(e.target.value); setIsSearchActive(true); }}>
                  <option value="all">Elemen</option><option value="Angin">Angin</option><option value="Api">Api</option><option value="Bumi">Bumi</option><option value="Cahaya">Cahaya</option><option value="Petir">Petir</option><option value="Bulan">Bulan</option><option value="Spirit">Spirit</option>
                </select>
              )}
           </div>
          
        </div>

        {isSearchActive && (searchResults.length > 0 || searchQuery || searchElement !== 'all') && (
          <div className="mt-2 w-full max-w-xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-100 animate-in slide-in-from-top-2 fade-in duration-200 max-h-[50vh] overflow-y-auto">
              <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Hasil ({searchResults.length})</span>
                <button onClick={() => setIsSearchActive(false)} className="text-xs text-blue-500 font-bold">Tutup</button>
              </div>
              {searchResults.length > 0 ? searchResults.map((item: any) => {
                 let distText = "", etaText = "";
                 if(userLoc) {
                    const d = calculateDistance(userLoc[0], userLoc[1], item.lat, item.lng);
                    distText = d > 1000 ? `${(d/1000).toFixed(1)} km` : `${Math.floor(d)} m`;
                    etaText = calculateETA(d);
                 }
                 return (
                  <div key={`${item.category}-${item.id}`} onClick={() => handleResultClick(item)} className="p-3 border-b border-slate-50 flex items-center gap-3 hover:bg-blue-50 cursor-pointer transition-colors group">
                    <div className={`w-8 h-8 rounded flex items-center justify-center text-sm ${item.category === 'wayang' ? 'bg-amber-100' : 'bg-blue-100'}`}>{item.category === 'wayang' ? '👾' : '🏛️'}</div>
                    <div className="flex-1"><h4 className="font-bold text-slate-700 text-sm">{item.name}</h4><span className="text-[10px] text-slate-400 uppercase">{item.category}</span></div>
                    {userLoc && (<div className="text-right"><div className="text-xs font-bold text-slate-600">{distText}</div><div className="text-[9px] text-slate-400">🚗 {etaText}</div></div>)}
                  </div>
                 )
              }) : <div className="p-4 text-center text-xs text-slate-400">Tidak ditemukan.</div>}
          </div>
        )}
      </div>

      {showMenu && (
        <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-end pb-32 animate-in fade-in duration-300" onClick={() => setShowMenu(false)}>
           <div className="grid grid-cols-2 gap-x-24 gap-y-10 mb-10 pointer-events-auto">
              <Link href="/storage" className="flex flex-col items-center gap-2 group transform hover:scale-110 transition-transform animate-in zoom-in slide-in-from-bottom-10 duration-300 delay-75">
                 <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center shadow-lg border-2 border-white"><span className="text-3xl">🎒</span></div>
                 <span className="text-white font-bold text-sm tracking-wide shadow-black drop-shadow-md">KOLEKSI</span>
              </Link>
              <button onClick={(e) => { e.stopPropagation(); setShowProfile(true); }} className="flex flex-col items-center gap-2 group transform hover:scale-110 transition-transform animate-in zoom-in slide-in-from-bottom-10 duration-300 delay-100">
                 <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center shadow-lg border-2 border-white"><span className="text-3xl">👤</span></div>
                 <span className="text-white font-bold text-sm tracking-wide shadow-black drop-shadow-md">PROFIL</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); setShowAbout(true); }} className="flex flex-col items-center gap-2 group transform hover:scale-110 transition-transform animate-in zoom-in slide-in-from-bottom-10 duration-300 delay-150">
                 <div className="w-16 h-16 rounded-full bg-blue-400 flex items-center justify-center shadow-lg border-2 border-white"><span className="text-3xl">ℹ️</span></div>
                 <span className="text-white font-bold text-sm tracking-wide shadow-black drop-shadow-md">TENTANG</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); setShowTips(true); }} className="flex flex-col items-center gap-2 group transform hover:scale-110 transition-transform animate-in zoom-in slide-in-from-bottom-10 duration-300 delay-200">
                 <div className="w-16 h-16 rounded-full bg-green-400 flex items-center justify-center shadow-lg border-2 border-white"><span className="text-3xl">💡</span></div>
                 <span className="text-white font-bold text-sm tracking-wide shadow-black drop-shadow-md">TIPS</span>
              </button>
           </div>
        </div>
      )}


      {showProfile && profile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-80 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-300 border-t-4 border-indigo-500 text-center">
             <button onClick={() => setShowProfile(false)} className="absolute top-3 right-3 btn btn-sm btn-circle btn-ghost text-slate-400 hover:bg-slate-100">✕</button>
             
             <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-3 flex items-center justify-center border-4 border-indigo-100 shadow-inner">
                <span className="text-4xl">👤</span>
             </div>

             <div className="flex justify-center items-center gap-2 mb-1 h-8">
               {isEditingName ? (
                 <div className="flex gap-1 items-center justify-center animate-in fade-in">
                   <input 
                     type="text" 
                     className="input input-sm input-bordered w-32 text-center text-slate-800 font-bold bg-slate-50 focus:border-indigo-500 focus:outline-none"
                     value={newName}
                     onChange={(e) => setNewName(e.target.value)}
                     onKeyDown={(e) => { if(e.key === 'Enter') handleSaveName(); }} // Enter to Save
                     autoFocus
                   />
                   <button onClick={handleSaveName} className="btn btn-sm btn-circle btn-success text-white" title="Simpan">✓</button>
                   <button onClick={() => setIsEditingName(false)} className="btn btn-sm btn-ghost btn-circle text-slate-400">✕</button>
                 </div>
               ) : (
                 <>
                   <h2 className="text-xl font-black text-slate-800 uppercase leading-none">{profile.display_name || 'Trainer'}</h2>
                   <button onClick={() => setIsEditingName(true)} className="text-slate-300 hover:text-blue-500">✎</button>
                 </>
               )}
             </div>

             <p className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full inline-block mb-4">
               {profile.role} • Since {joinDate}
             </p>

             <div className="flex flex-col items-center mb-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Level Saat Ini</span>
                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-purple-600 leading-tight">{profile.level}</span>
             </div>

             <div className="w-full bg-slate-100 rounded-full h-2.5 mb-1 overflow-hidden relative">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-400 to-purple-500" 
                  style={{ width: `${Math.min((profile.current_xp / profile.next_level_xp) * 100, 100)}%` }}
                ></div>
             </div>
             <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-6 px-1">
                <span>{profile.current_xp} XP</span>
                <span>{profile.next_level_xp} XP</span>
             </div>

             <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                   <div className="text-xl">👾</div>
                   <div className="text-[10px] text-slate-400 font-bold uppercase">Wayang</div>
                   <div className="text-lg font-black text-slate-700">{stats.wayang}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                   <div className="text-xl">🏛️</div>
                   <div className="text-[10px] text-slate-400 font-bold uppercase">Landmark</div>
                   <div className="text-lg font-black text-slate-700">{stats.landmark}</div>
                </div>
             </div>

             <button onClick={handleLogout} className="btn btn-outline btn-error btn-sm w-full rounded-xl flex items-center gap-2 hover:bg-red-50"><span className="text-lg">🚪</span> Logout</button>
          </div>
        </div>
      )}

      {showAbout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-80 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-300 border-t-4 border-blue-500 text-center">
             <button onClick={() => setShowAbout(false)} className="absolute top-3 right-3 btn btn-sm btn-circle btn-ghost text-slate-400">✕</button>
             <div className="text-5xl mb-3">ℹ️</div>
             <h2 className="text-xl font-black text-slate-800 uppercase mb-1">JaWa GO</h2>
             <p className="text-xs font-bold text-blue-500 mb-4">v1.0.0</p>
             <div className="text-slate-600 text-sm leading-relaxed mb-6 space-y-2">
                <p>Jelajahi keindahan budaya Yogyakarta dengan cara baru!</p>
                <p>Temukan wayang tersembunyi dan kunjungi landmark bersejarah.</p>
             </div>
             
          </div>
        </div>
      )}

      {showTips && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-80 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-300 border-t-4 border-green-500 text-center">
             <button onClick={() => setShowTips(false)} className="absolute top-3 right-3 btn btn-sm btn-circle btn-ghost text-slate-400">✕</button>
             <div className="text-5xl mb-3">💡</div>
             <h2 className="text-xl font-black text-slate-800 uppercase mb-4">Tips Bermain</h2>
             <div className="text-left text-sm text-slate-600 space-y-3 bg-green-50 p-4 rounded-xl border border-green-100 mb-4">
                <div className="flex gap-2"><span className="text-green-600 font-bold">1.</span><p>Nyalakan GPS untuk melihat wayang.</p></div>
                <div className="flex gap-2"><span className="text-green-600 font-bold">2.</span><p>Mendekatlah <strong>&lt; 30m</strong> untuk menangkap.</p></div>
                <div className="flex gap-2"><span className="text-green-600 font-bold">3.</span><p>Cari Landmark untuk XP besar!</p></div>
             </div>
             <button onClick={() => setShowTips(false)} className="btn btn-block btn-success text-white rounded-xl">Siap, Mengerti!</button>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 z-[60] pb-6 pt-12 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none">
        <div className="px-4 flex items-end justify-between pointer-events-auto">
          <button onClick={() => setShowProfile(true)} className="flex items-center gap-[-10px] group cursor-pointer hover:scale-105 transition-transform">
             <div className="w-16 h-16 rounded-full border-4 border-white bg-slate-700 overflow-hidden relative z-10 shadow-xl">
               <div className="absolute inset-0 bg-gradient-to-b from-blue-400 to-blue-600 flex items-center justify-center"><span className="text-3xl">👤</span></div>
             </div>
             <div className="bg-white pl-8 pr-4 py-1 rounded-r-full -ml-6 border-2 border-slate-200 shadow-md flex flex-col justify-center h-10 min-w-[120px]">
                <span className="text-xs font-black text-slate-800 uppercase leading-none">{profile?.display_name || 'TRAINER'}</span>
                <span className="text-[9px] font-bold text-slate-400 mt-0.5">Lv. {profile?.level || 1}</span>
             </div>
          </button>

          <div className="absolute left-1/2 -translate-x-1/2 bottom-6">
             <button onClick={() => setShowMenu(!showMenu)} className={`w-16 h-16 rounded-full shadow-2xl border-4 border-white flex items-center justify-center transition-all duration-300 ease-in-out z-50 ${showMenu ? 'rotate-45 bg-slate-700 scale-90' : 'bg-gradient-to-b from-amber-500 to-orange-600 hover:scale-110 active:scale-95'}`}>
                {showMenu ? <span className="text-3xl text-white">✕</span> : <img src="/logo.png" className="w-10 h-10 opacity-80 invert" alt="Menu" />}
             </button>
          </div>

          <div className="flex flex-col items-center gap-1 group cursor-pointer hover:scale-105 transition-transform" onClick={() => setShowRadar(true)}>
            <div className="w-14 h-14 bg-white rounded-full border-2 border-slate-200 shadow-xl flex items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 bg-slate-50 opacity-50"></div>
               <span className="text-2xl relative z-10">📡</span>
               
            </div>
            
          </div>
        </div>
      </div>

      {showRadar && (
        <div className="absolute inset-0 z-[100] flex flex-col justify-end bg-black/60 backdrop-blur-sm transition-all" onClick={() => setShowRadar(false)}>
          <div className="bg-slate-50 rounded-t-3xl h-[60vh] p-4 animate-slide-up flex flex-col shadow-2xl overflow-hidden border-t-4 border-blue-400" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-4"/>
            <h3 className="text-center font-black text-slate-600 uppercase tracking-widest text-xs mb-4">Radar Terdekat</h3>
            <div className="flex-1 overflow-y-auto pb-10">
               <PokemonList spawns={spawns} userLoc={userLoc} onItemClick={(s: any) => { handleMarkerClick(s); setShowRadar(false); }} />
            </div>
          </div>
        </div>
      )}

      {selectedPokemon && (
        <PokemonModal 
          pokemon={selectedPokemon} 
          userLoc={userLoc} 
          isCaught={false} // Wild = false
          onClose={() => setSelectedPokemon(null)} 
          onCatch={handleCatch} 
          onRoute={(p: any) => { setRouteTarget([p.lat, p.lng]); setSelectedPokemon(null); }} 
        />
      )}

      {selectedLandmark && (
        <LandmarkModal 
          landmark={selectedLandmark} 
          userLoc={userLoc} 
          isVisited={visitedLandmarks.includes(selectedLandmark.id)}
          onClose={() => setSelectedLandmark(null)} 
          onCollect={handleCollectLandmark}
          onRoute={(lm: any) => { setRouteTarget([lm.lat, lm.lng]); setSelectedLandmark(null); }} 
        />
      )}

      {levelUpModal && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl animate-in zoom-in duration-500">
           <div className="text-7xl mb-4 animate-bounce">🎊</div>
           <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 mb-2 drop-shadow-lg">LEVEL UP!</h1>
           <p className="text-white text-xl font-bold mb-8 opacity-90">Kamu sekarang Level {levelUpModal}</p>
           <button onClick={() => setLevelUpModal(null)} className="btn btn-wide btn-warning text-white font-bold rounded-full shadow-[0_0_30px_rgba(251,191,36,0.6)] animate-pulse">MANTAP!</button>
        </div>
      )}

    </div>
  );
}