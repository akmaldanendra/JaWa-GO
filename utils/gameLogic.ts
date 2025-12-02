import { supabase } from './supabase';

export const addExperience = async (userId: string, xpGained: number) => {
  // 1. Ambil data user
  const { data: profile } = await supabase
    .from('profiles')
    .select('level, current_xp, next_level_xp')
    .eq('id', userId)
    .single();

  if (!profile) return null;

  let newXp = profile.current_xp + xpGained;
  let newLevel = profile.level;
  let newNextLevelXp = profile.next_level_xp;
  let isLevelUp = false;

  // 2. Cek Naik Level
  while (newXp >= newNextLevelXp) {
    newXp -= newNextLevelXp; 
    newLevel += 1;
    newNextLevelXp = Math.floor(newNextLevelXp * 1.2); 
    isLevelUp = true;
  }

  // 3. Update DB
  await supabase
    .from('profiles')
    .update({ 
      level: newLevel, 
      current_xp: newXp, 
      next_level_xp: newNextLevelXp 
    })
    .eq('id', userId);

  return { isLevelUp, newLevel, xpGained };
};