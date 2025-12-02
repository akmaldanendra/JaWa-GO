'use client';
import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let error;
    if (isRegister) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      error = signUpError;
      if (!error) alert('Pendaftaran berhasil! Silakan login.');
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      error = signInError;
      if (!error) router.push('/');
    }

    if (error) alert(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      
      {/* Background Decor (Sama kayak Profile) */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Card Container */}
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl relative border-4 border-slate-800 animate-in zoom-in duration-300">
        
        {/* Header Image/Logo Area */}
        <div className="h-44 bg-gradient-to-br from-blue-600 to-indigo-700 relative flex flex-col justify-center items-center p-6">
           <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
           
           {/* Logo App */}
           <div className="w-20 h-20 bg-white rounded-full p-3 shadow-xl mb-3 flex items-center justify-center border-4 border-blue-200/30">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain invert" />
           </div>
           
           <h1 className="text-2xl font-black text-white uppercase tracking-wider drop-shadow-md leading-none mt-1">
             {isRegister ? 'Daftar' : 'Welcome'}
           </h1>
           <p className="text-blue-100 text-xs font-medium mt-1 opacity-90">
             {isRegister ? 'Mulai petualangan budayamu!' : 'Lanjutkan pencarian wayangmu'}
           </p>
        </div>

        {/* Form Section */}
        <div className="p-8 pt-8">
          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            
            {/* Email Input */}
            <div className="form-control">
              <label className="label pt-0">
                <span className="label-text font-bold text-slate-400 text-[10px] uppercase tracking-wider">Email</span>
              </label>
              <input
                type="email"
                placeholder="contoh@email.com"
                className="input input-bordered w-full bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/20 rounded-2xl text-slate-800 font-bold transition-all h-12"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password Input */}
            <div className="form-control">
              <label className="label pt-0">
                <span className="label-text font-bold text-slate-400 text-[10px] uppercase tracking-wider">Password</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="input input-bordered w-full bg-slate-50 border-slate-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/20 rounded-2xl text-slate-800 font-bold transition-all h-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className={`btn h-14 border-none text-white rounded-2xl shadow-lg shadow-blue-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.02] hover:brightness-110 flex items-center justify-center gap-2 mt-4 transition-all ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {!loading && (isRegister ? <span className="text-xl"></span> : <span className="text-xl"></span>)}
              <span className="font-bold tracking-wide">{isRegister ? 'DAFTAR SEKARANG' : 'MASUK'}</span>
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="text-center mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium">
              {isRegister ? 'Sudah punya akun?' : 'Belum jadi Trainer?'}
            </p>
            <button 
              className="text-blue-600 font-black text-sm hover:underline mt-1 transition-colors uppercase tracking-wide"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? 'Login di Sini' : 'Daftar Sekarang'}
            </button>
          </div>

        </div>
      </div>
      
      {/* Footer Info */}
      <div className="absolute bottom-6 text-center w-full opacity-30 text-white text-[10px] font-mono pointer-events-none">
        JaWa GO • GPS Project • aksadidaakmaljepe
      </div>

    </div>
  );
}