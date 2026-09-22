import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  Gem,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  UserPlus,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { DiamondWorldLogo } from './DiamondWorldLogo';
import { AuthUser } from '../types';
import { authenticateUser, requestPasswordRecovery, requestSignup } from '../utils/authEngine';

interface LoginPortalProps {
  onLoginSuccess: (user: AuthUser) => void;
}

type Mode = 'login' | 'signup' | 'forgot';
type ServerStatus = 'checking' | 'online' | 'offline';

export const LoginPortal: React.FC<LoginPortalProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('checking');

  useEffect(() => {
    let cancelled = false;
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/health', { credentials: 'include' });
        if (!cancelled) setServerStatus(res.ok ? 'online' : 'offline');
      } catch {
        if (!cancelled) setServerStatus('offline');
      }
    };
    checkHealth();
    return () => { cancelled = true; };
  }, []);

  const clearNotice = () => {
    setMessage('');
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearNotice();
    if (!agreedToTerms) {
      setErrorMessage('Please accept the access terms to continue.');
      return;
    }
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const result = await authenticateUser(username, password);
        if (result.success && result.user) {
          onLoginSuccess(result.user);
        } else {
          setErrorMessage(result.error || 'Invalid username or password.');
        }
      } else if (mode === 'signup') {
        const result = await requestSignup({ username, name, password });
        if (result.success) {
          setMessage(result.message || 'Account request submitted.');
          setMode('login');
          setPassword('');
        } else {
          setErrorMessage(result.error || 'Could not create account request.');
        }
      } else {
        const result = await requestPasswordRecovery(username);
        if (result.success) {
          setMessage(result.message || 'Recovery request submitted.');
        } else {
          setErrorMessage(result.error || 'Could not submit recovery request.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setPassword('');
    clearNotice();
  };

  const heading = mode === 'login'
    ? 'Welcome Back'
    : mode === 'signup'
      ? 'Request Access'
      : 'Recover Account';

  const subheading = mode === 'login'
    ? 'Sign in to your Stock Operations ERP dashboard'
    : mode === 'signup'
      ? 'Submit your details for system owner approval'
      : 'Enter your username to request a password reset';

  const submitLabel = mode === 'login'
    ? 'Sign In'
    : mode === 'signup'
      ? 'Submit Request'
      : 'Send Recovery Link';

  return (
    <div className="min-h-screen bg-[#0a0f1a] font-sans text-[#e8eef5] flex flex-col">
      {/* Ambient background layers */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[#17395c]/25 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[600px] rounded-full bg-[#1a3a5c]/15 blur-[100px]" />
        <div className="absolute bottom-20 left-0 h-[300px] w-[400px] rounded-full bg-[#0f2b48]/20 blur-[90px]" />
      </div>

      {/* Top brand bar */}
      <header className="relative z-10 px-5 sm:px-8 lg:px-12">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur border border-white/15">
              <DiamondWorldLogo tone="white" className="h-6 w-6" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-sm font-bold tracking-tight text-white sm:text-base">DIAMOND WORLD</span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider text-sky-200 border border-white/10">LTD</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-colors ${
                serverStatus === 'online'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : serverStatus === 'offline'
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                    : 'border-white/10 bg-white/5 text-slate-400'
              }`}
            >
              {serverStatus === 'checking' && <Loader2 className="h-3 w-3 animate-spin" />}
              {serverStatus === 'online' && <Wifi className="h-3 w-3" />}
              {serverStatus === 'offline' && <WifiOff className="h-3 w-3" />}
              <span className="hidden sm:inline">
                {serverStatus === 'checking' ? 'Connecting…' : serverStatus === 'online' ? 'System Online' : 'System Offline'}
              </span>
            </span>
          </div>
        </div>
      </header>

      {/* Main split layout */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="grid w-full max-w-[1080px] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur-xl lg:grid-cols-[1fr_420px]"
        >
          {/* Left: Brand showcase panel */}
          <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0b1f38] via-[#102d4e] to-[#0a1830] p-10 lg:flex xl:p-14">
            {/* Decorative geometry */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full border border-white/[0.06]" />
            <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full border border-white/[0.04]" />
            <div className="pointer-events-none absolute -bottom-32 -left-16 h-72 w-72 rounded-full border border-[#f4c95d]/[0.08]" />

            {/* Top: badge */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                Stock Operations ERP
              </div>
            </div>

            {/* Center: headline & features */}
            <div className="relative z-10 my-12">
              <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-white xl:text-[2.75rem]">
                Your inventory<br />
                command center.
              </h1>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-300">
                Monitor branch stock, item velocity, movement orders and replenishment — all from one unified workspace.
              </p>

              <div className="mt-9 space-y-3.5">
                {[
                  { icon: Gem, title: 'Smart Allocation', desc: 'Balance demand and stock across branches' },
                  { icon: BarChart3, title: 'Live Intelligence', desc: 'Real-time velocity and turnover insights' },
                  { icon: Zap, title: 'Automated Replenishment', desc: 'AI-driven refill and transfer recommendations' },
                ].map((f) => (
                  <div key={f.title} className="flex items-center gap-3.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 transition-colors hover:bg-white/[0.06]">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                      <f.icon className="h-4 w-4 text-sky-300" />
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-white">{f.title}</div>
                      <div className="mt-0.5 text-[11px] leading-4 text-slate-400">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom: trust footer */}
            <div className="relative z-10 flex items-center gap-2 border-t border-white/[0.08] pt-5 text-[11px] font-medium text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Authorized users only · Server-side session protection
            </div>
          </section>

          {/* Right: Form panel */}
          <section className="bg-[#0d1421] p-7 sm:p-9 lg:rounded-r-2xl">
            {/* Mobile-only brand header */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 border border-white/15">
                <DiamondWorldLogo tone="white" className="h-7 w-7" />
              </div>
              <div>
                <div className="font-mono text-sm font-bold text-white">DIAMOND WORLD LTD</div>
                <div className="text-[10px] text-slate-500">Stock Operations ERP</div>
              </div>
            </div>

            {/* Form header */}
            <div className="mb-7">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-600/10 border border-sky-500/20 text-sky-300 shadow-lg shadow-sky-500/10">
                {mode === 'login' ? <LockKeyhole className="h-5 w-5" /> : mode === 'signup' ? <UserPlus className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-white">{heading}</h2>
              <p className="mt-1.5 text-sm text-slate-400">{subheading}</p>
            </div>

            {/* Notices */}
            <AnimatePresence mode="wait">
              {serverStatus === 'offline' && (
                <motion.div
                  key="offline"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-5 text-amber-300"
                >
                  <WifiOff className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>The server isn't responding right now. If this persists, verify the API deployment is correct.</span>
                </motion.div>
              )}
              {message && (
                <motion.div
                  key="message"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs leading-5 text-emerald-300"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{message}</span>
                </motion.div>
              )}
              {errorMessage && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs leading-5 text-rose-300"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <FieldLabel label="Full Name">
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    className="form-input"
                  />
                </FieldLabel>
              )}

              <FieldLabel label="Username">
                <input
                  required
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  className="form-input"
                />
              </FieldLabel>

              {mode !== 'forgot' && (
                <FieldLabel label={mode === 'signup' ? 'Create Password' : 'Password'}>
                  <div className="relative">
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={mode === 'signup' ? 'At least 4 characters' : 'Enter your password'}
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      className="form-input pr-11"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FieldLabel>
              )}

              {mode === 'login' && (
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="h-3.5 w-3.5 rounded accent-sky-500" />
                    <span className="text-xs text-slate-400">Remember me</span>
                  </label>
                  <button type="button" onClick={() => switchMode('forgot')} className="text-xs font-medium text-sky-400 transition hover:text-sky-300">
                    Forgot password?
                  </button>
                </div>
              )}

              {mode !== 'login' && (
                <label className="flex cursor-pointer items-center gap-2 pt-0.5">
                  <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="h-3.5 w-3.5 rounded accent-sky-500" />
                  <span className="text-xs text-slate-400">I agree to the access terms.</span>
                </label>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-400 hover:to-sky-500 hover:shadow-sky-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{isLoading ? 'Processing…' : submitLabel}</span>
                {!isLoading && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
              </button>
            </form>

            {/* Mode switcher */}
            <div className="mt-6 border-t border-white/[0.06] pt-5">
              {mode === 'login' ? (
                <p className="text-center text-xs text-slate-500">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => switchMode('signup')} className="font-semibold text-sky-400 transition hover:text-sky-300">
                    Request access
                  </button>
                </p>
              ) : (
                <p className="text-center text-xs text-slate-500">
                  <button type="button" onClick={() => switchMode('login')} className="inline-flex items-center gap-1 font-semibold text-sky-400 transition hover:text-sky-300">
                    <ChevronRight className="h-3 w-3 rotate-180" />
                    Back to sign in
                  </button>
                </p>
              )}
            </div>
          </section>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-5 sm:px-8 lg:px-12">
        <div className="flex h-14 items-center justify-between text-[11px] text-slate-600">
          <span>© {new Date().getFullYear()} Diamond World LTD · Stock Operations ERP</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Secure session
          </span>
        </div>
      </footer>
    </div>
  );
};

const FieldLabel: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
    {children}
  </label>
);
