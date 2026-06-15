import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  loading?: boolean;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 transition-colors focus-within:border-purple-400 focus-within:bg-purple-500/5">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial, delay: string }) => (
  <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-zinc-900/50 backdrop-blur-xl border border-white/5 p-5 w-64`}>
    <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-xl border border-white/10" alt="avatar" />
    <div className="text-xs leading-snug">
      <p className="flex items-center gap-1 font-semibold text-zinc-100">{testimonial.name}</p>
      <p className="text-purple-400/80 font-mono text-[10px]">{testimonial.handle}</p>
      <p className="mt-1.5 text-zinc-300 font-medium leading-relaxed">&ldquo;{testimonial.text}&rdquo;</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = "Welcome",
  description = "Access your account and continue your journey with us",
  heroImageSrc,
  testimonials = [],
  onSignIn,
  loading = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row w-[100dvw] bg-black text-white overflow-hidden">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-8 z-20">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            
            {/* Logo and Brand */}
            <div className="animate-element animate-delay-100 flex items-center gap-3">
              <img
                src="https://i.ibb.co.com/bGPrxV1/logov3.png"
                alt="BJA Logo"
                className="w-11 h-11 rounded-xl object-cover border border-white/10 shadow-lg shadow-purple-900/10"
              />
              <div>
                <h2 className="text-base font-bold tracking-tight text-white">BJA Report</h2>
                <p className="text-[10px] text-purple-400 font-semibold tracking-wider uppercase">PT Wanna Mulia Sejahtera</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <h1 className="animate-element animate-delay-200 text-3xl font-bold tracking-tight text-zinc-50">{title}</h1>
              <p className="animate-element animate-delay-300 text-zinc-400 text-sm">{description}</p>
            </div>

            <form className="space-y-4" onSubmit={onSignIn}>
              {/* Email Address */}
              <div className="animate-element animate-delay-400 space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 block">Email Address</label>
                <GlassInputWrapper>
                  <input
                    name="email"
                    type="email"
                    placeholder="admin@bja.com"
                    required
                    disabled={loading}
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-zinc-100 placeholder:text-zinc-600"
                  />
                </GlassInputWrapper>
              </div>

              {/* Password */}
              <div className="animate-element animate-delay-500 space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 block">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      required
                      disabled={loading}
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none text-zinc-100 placeholder:text-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-4 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              {/* Checkbox */}
              <div className="animate-element animate-delay-600 flex items-center justify-between text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" name="rememberMe" defaultChecked className="custom-checkbox" />
                  <span className="text-zinc-400 font-medium">Keep me signed in</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="animate-element animate-delay-700 w-full rounded-2xl bg-purple-600 hover:bg-purple-700 py-3.5 font-bold text-white transition-all active:scale-[0.98] shadow-lg shadow-purple-900/10 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Masuk...
                  </>
                ) : (
                  'Masuk'
                )}
              </button>
            </form>

            <p className="animate-element animate-delay-800 text-center text-[11px] text-zinc-600 pt-4">
              © 2026 PT Wanna Mulia Sejahtera. All rights reserved.
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4 z-10">
          <div
            className="animate-slide-right animate-delay-300 absolute inset-4 rounded-[32px] bg-cover bg-center border border-white/5 overflow-hidden"
            style={{ backgroundImage: `url(${heroImageSrc})` }}
          >
            {/* Ambient overlay gradient to darken bottom slightly */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>
        </section>
      )}
    </div>
  );
};
