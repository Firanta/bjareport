'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { Input } from './input';
import {
  AtSignIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2,
} from 'lucide-react';
import Cookies from 'js-cookie';
import { loginWithEmail } from '@/lib/firebase/auth';
import { toast } from 'sonner';

export function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      const cred = await loginWithEmail(email, password, rememberMe);
      const token = await cred.user.getIdToken();
      Cookies.set('firebase-auth-token', token, {
        expires: rememberMe ? 30 : undefined,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });
      toast.success('Login berhasil!');
      window.location.href = '/';
    } catch (err: any) {
      console.error(err);
      const msg =
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
          ? 'Email atau password salah.'
          : err.code === 'auth/too-many-requests'
          ? 'Terlalu banyak percobaan. Coba lagi nanti.'
          : 'Login gagal. Coba lagi.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2 bg-black text-white">
      {/* Left panel (visual brand showcase) with rounded border on the right */}
      <div className="bg-gradient-to-br from-[#120024] to-[#04000c] relative hidden h-full flex-col border-r border-white/5 p-10 lg:flex rounded-r-[32px] overflow-hidden z-10">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        
        {/* Brand Logo and Name */}
        <div className="z-20 flex items-center gap-3">
          <img
            src="https://i.ibb.co.com/bGPrxV1/logov3.png"
            alt="BJA Logo"
            className="w-10 h-10 rounded-xl object-cover border border-white/10 shadow-lg"
          />
          <div>
            <p className="text-lg font-bold tracking-tight text-white">BJA Report</p>
            <p className="text-[10px] text-purple-400 font-semibold tracking-wider uppercase">PT Wanna Mulia Sejahtera</p>
          </div>
        </div>

        {/* Dynamic quote */}
        <div className="z-20 mt-auto max-w-md">
          <blockquote className="space-y-3">
            <p className="text-lg text-zinc-100 font-medium leading-relaxed">
              &ldquo;Sistem ini membantu kami merekap tagihan dan mengelola surat jalan lebih cepat dan efisien daripada sebelumnya.&rdquo;
            </p>
            <footer className="text-xs font-mono font-semibold text-purple-400">
              ~ H. SUPANDI
            </footer>
          </blockquote>
        </div>

        {/* Animated paths in background */}
        <div className="absolute inset-0 z-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>

      {/* Right panel (login form) */}
      <div className="relative flex min-h-screen flex-col justify-center p-6 md:p-10 z-20">
        {/* Ambient background glows */}
        <div aria-hidden className="absolute inset-0 isolate -z-10 opacity-30 pointer-events-none">
          <div className="bg-[radial-gradient(50%_50%_at_50%_50%,rgba(168,85,247,0.15)_0,transparent_100%)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full blur-[80px]" />
        </div>

        <div className="mx-auto w-full max-w-sm space-y-6">
          {/* Logo on mobile only */}
          <div className="flex items-center gap-3 lg:hidden justify-center mb-4">
            <img
              src="https://i.ibb.co.com/bGPrxV1/logov3.png"
              alt="BJA Logo"
              className="w-10 h-10 rounded-xl object-cover border border-white/10 shadow-lg"
            />
            <div className="text-left">
              <p className="text-base font-bold tracking-tight text-white">BJA Report</p>
              <p className="text-[9px] text-purple-400 font-semibold uppercase">PT Wanna Mulia Sejahtera</p>
            </div>
          </div>

          <div className="flex flex-col space-y-1.5 text-center lg:text-left">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
              Masuk ke Dashboard
            </h1>
            <p className="text-zinc-400 text-sm">
              Silakan masukkan akun email dan password admin BJA.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 block">Email</label>
              <div className="relative">
                <Input
                  placeholder="admin@bja.com"
                  className="ps-9 bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-purple-500 focus-visible:border-purple-500"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div className="text-zinc-500 absolute inset-y-0 start-0 flex items-center justify-center ps-3">
                  <AtSignIcon className="size-4" aria-hidden="true" />
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 block">Password</label>
              <div className="relative">
                <Input
                  placeholder="••••••••"
                  className="ps-9 pe-9 bg-zinc-950/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-purple-500 focus-visible:border-purple-500"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <div className="text-zinc-500 absolute inset-y-0 start-0 flex items-center justify-center ps-3">
                  <LockIcon className="size-4" aria-hidden="true" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-zinc-500 hover:text-zinc-300 absolute inset-y-0 end-0 flex items-center justify-center pe-3"
                >
                  {showPassword ? (
                    <EyeOffIcon className="size-4" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-zinc-800 bg-zinc-950 text-purple-600 focus:ring-purple-500 size-4 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-xs text-zinc-400 cursor-pointer select-none">
                Ingat saya selama 30 hari
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-purple-900/20 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin me-2" />
                  Masuk...
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>

          {/* Footer Copyright */}
          <p className="text-center text-[11px] text-zinc-600 pt-4">
            © 2026 PT Wanna Mulia Sejahtera. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}

const FloatingPaths = React.memo(function FloatingPaths({ position }: { position: number }) {
  const paths = useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => ({
      id: i,
      d: `M-${380 - i * 10 * position} -${189 + i * 12}C-${
        380 - i * 10 * position
      } -${189 + i * 12} -${312 - i * 10 * position} ${216 - i * 12} ${
        152 - i * 10 * position
      } ${343 - i * 12}C${616 - i * 10 * position} ${470 - i * 12} ${
        684 - i * 10 * position
      } ${875 - i * 12} ${684 - i * 10 * position} ${875 - i * 12}`,
      color: `rgba(168,85,247,${0.03 + i * 0.01})`,
      width: 0.5 + i * 0.04,
      duration: 20 + Math.random() * 15,
    }));
  }, [position]);

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg
        className="h-full w-full text-purple-950/20"
        viewBox="0 0 696 316"
        fill="none"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke={path.color}
            strokeWidth={path.width}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={{
              pathLength: 1,
              opacity: [0.3, 0.6, 0.3],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: path.duration,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </div>
  );
});
