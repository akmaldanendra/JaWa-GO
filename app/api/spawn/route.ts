import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const JOGJA_BOUNDS = {
  minLat: -7.8300, 
  maxLat: -7.7400, 
  minLng: 110.3200, 
  maxLng: 110.4200, 
};

export async function GET() {
  // 1. Cek jumlah spawn
  const { count, error } = await supabase
    .from('active_spawns')
    .select('*', { count: 'exact', head: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const currentCount = count || 0;
  const MAX_SPAWN = 30; 

  if (currentCount >= MAX_SPAWN) {
    return NextResponse.json({ message: 'Map penuh.' });
  }

  const missingCount = MAX_SPAWN - currentCount;
  const newSpawns = [];

  // 2. Ambil Data Pokedex buat referensi ID & Rarity
  const { data: pokedexData } = await supabase.from('pokedex').select('id, rarity');
  if (!pokedexData) return NextResponse.json({ error: 'Pokedex kosong' }, { status: 500 });

  // Pisahin ID berdasarkan Rarity
  const commonIds = pokedexData.filter(p => p.rarity === 'Common').map(p => p.id);
  const rareIds = pokedexData.filter(p => p.rarity === 'Rare').map(p => p.id);
  const legendaryIds = pokedexData.filter(p => p.rarity === 'Legendary').map(p => p.id);

  // 3. Generate Spawn
  for (let i = 0; i < missingCount; i++) {
    const lat = JOGJA_BOUNDS.minLat + Math.random() * (JOGJA_BOUNDS.maxLat - JOGJA_BOUNDS.minLat);
    const lng = JOGJA_BOUNDS.minLng + Math.random() * (JOGJA_BOUNDS.maxLng - JOGJA_BOUNDS.minLng);
    
    // --- GACHA SYSTEM ---
    const gacha = Math.random();
    let selectedId;

    if (gacha < 0.05 && legendaryIds.length > 0) {
      // 5% Chance Legendary
      selectedId = legendaryIds[Math.floor(Math.random() * legendaryIds.length)];
    } else if (gacha < 0.30 && rareIds.length > 0) {
      // 25% Chance Rare (0.05 sampe 0.30)
      selectedId = rareIds[Math.floor(Math.random() * rareIds.length)];
    } else {
      // 70% Chance Common
      selectedId = commonIds[Math.floor(Math.random() * commonIds.length)];
    }

    if (!selectedId) selectedId = pokedexData[Math.floor(Math.random() * pokedexData.length)].id;

    newSpawns.push({
      pokedex_id: selectedId,
      location: `SRID=4326;POINT(${lng} ${lat})`
    });
  }

  const { data } = await supabase.from('active_spawns').insert(newSpawns).select();

  return NextResponse.json({ 
    message: `Spawned ${missingCount} wayang!`, 
    data 
  });
}