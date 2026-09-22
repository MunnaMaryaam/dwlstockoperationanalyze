import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Check,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Gem,
  KeyRound,
  Loader2,
  LockKeyhole,
  Search,
  ShieldCheck,
  UserPlus,
  Wifi,
  WifiOff
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

  // Quietly verify the API is actually reachable the moment the portal loads.
  // This turns a silent deployment problem (e.g. the API not responding) into
  // a clear, honest signal instead of only surfacing after a failed login.
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
    ? 'Sign in to Stock Operations'
    : mode === 'signup'
      ? 'Request ERP access'
      : 'Recover your access';

  const description = mode === 'login'
    ? 'Use your authorized account to access the operations cockpit.'
    : mode === 'signup'
      ? 'Submit your details for system owner approval before signing in.'
      : 'Enter your username. The system owner will review the recovery request.';

  return (
    <div className="min-h-screen overflow-hidden bg-[#edf2f7] font-sans text-[#1e293b]">
      {/* Same brand/search strip used inside the ERP */}
      <header className="relative z-10 border-b border-white/10 bg-white/95 shadow-sm backdrop-blur">
        <div className="flex min-h-[58px] items-center justify-between gap-4 px-4 py-2.5 sm:px-8">
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white p-2.5 border border-[#d8dee6] shadow-md shadow-[#17395c]/20">
              <DiamondWorldLogo tone="black" className="h-full w-full text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black tracking-tight text-[#0f2b48] sm:text-lg">DIAMOND WORLD LTD</span>
                <span className="rounded bg-[#17395c] px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider text-white shadow-sm">STOCK ERP</span>
              </div>
              <span className="mt-1 text-[11px] font-medium leading-tight text-[#64748b]">Stock Operations, Distribution &amp; Intelligence</span>
            </div>
          </div>

          <div className="hidden max-w-xl flex-1 sm:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
              <div className="rounded border border-[#cbd5e1] bg-[#f1f5f9] py-1.5 pl-8 pr-4 text-xs font-medium text-[#94a3b8]">
                Search Showroom, Item / SKU / Variant, Requisitions...
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-semibold text-[#64748b]">
            <span
              title={serverStatus === 'online' ? 'API reachable' : serverStatus === 'offline' ? 'API not responding' : 'Checking API connection…'}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors ${
                serverStatus === 'online'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : serverStatus === 'offline'
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}
            >
              {serverStatus === 'checking' && <Loader2 className="h-3 w-3 animate-spin" />}
              {serverStatus === 'online' && <Wifi className="h-3 w-3" />}
              {serverStatus === 'offline' && <WifiOff className="h-3 w-3" />}
              <span className="hidden sm:inline">
                {serverStatus === 'checking' ? 'Checking system…' : serverStatus === 'online' ? 'System online' : 'System unreachable'}
              </span>
            </span>
            <span className="hidden items-center gap-2 sm:flex">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span className="hidden sm:inline">Owner-protected access</span>
            </span>
          </div>
        </div>

        {/* Same navy navigation ribbon language as the authenticated ERP */}
        <div className="flex items-center justify-between overflow-hidden bg-[#17395c] px-4 text-[11px] font-semibold text-[#d6e2ec] sm:px-8">
          <div className="flex min-w-max items-center">
            <div className="border-b-2 border-[#38bdf8] bg-[#0f2b48] px-3 py-2 text-white">
              Access Gateway
            </div>
            <div className="hidden px-3 py-2 md:block">Stock Operations</div>
            <div className="hidden px-3 py-2 md:block">Distribution Intelligence</div>
            <div className="hidden px-3 py-2 md:block">Reports &amp; Requisitions</div>
          </div>
          <div className="hidden items-center gap-2 py-1.5 text-[10px] lg:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="font-mono text-emerald-300">ERP READY</span>
          </div>
        </div>
      </header>

      <main className="relative mx-auto flex min-h-[calc(100vh-108px)] w-full max-w-7xl items-center justify-center px-4 py-8 sm:px-8 lg:py-12">
        <div className="pointer-events-none absolute inset-x-0 top-10 mx-auto h-80 max-w-5xl rounded-full bg-[#17395c]/10 blur-3xl" />
        <div className="w-full max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative grid overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_28px_80px_rgba(15,43,72,0.20)] lg:grid-cols-[1.05fr_0.95fr]"
          >
          {/* Dashboard-inspired welcome panel */}
          <section className="relative overflow-hidden bg-gradient-to-br from-[#0b2540] via-[#17395c] to-[#174a68] p-7 text-white sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full border-[18px] border-white/10" />
            <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full border-[22px] border-[#f4c95d]/15" />

            <div className="relative z-10">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-100 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.9)]" />
                Operations cockpit access
              </div>

              <h1 className="max-w-md text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
                Your inventory decisions, in one control room.
              </h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-slate-200">
                Monitor branch stock, item velocity, movement orders and replenishment workflows from the same workspace.
              </p>

              <div className="mt-9 grid max-w-md grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-sm transition-colors hover:bg-white/15">
                  <Gem className="mb-5 h-4 w-4 text-[#f4c95d]" /><div className="text-xs font-extrabold text-white">Item Allocation</div><div className="mt-1 text-[10px] leading-4 text-slate-200">Balance demand and stock</div>
                </div>
                <div className="rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-sm transition-colors hover:bg-white/15">
                  <BarChart3 className="mb-5 h-4 w-4 text-sky-200" /><div className="text-xs font-extrabold text-white">Live Intelligence</div><div className="mt-1 text-[10px] leading-4 text-slate-200">Read velocity clearly</div>
                </div>
                <div className="rounded-xl border border-white/15 bg-white/10 p-3.5 backdrop-blur-sm transition-colors hover:bg-white/15">
                  <FileSpreadsheet className="mb-5 h-4 w-4 text-emerald-200" /><div className="text-xs font-extrabold text-white">Excel Ready</div><div className="mt-1 text-[10px] leading-4 text-slate-200">Export operational reports</div>
                </div>
              </div>

              <div className="mt-10 flex items-center gap-2 border-t border-white/15 pt-5 text-[10px] font-medium text-slate-200">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                Authorized users only • Server-side session protection
              </div>
            </div>
          </section>

          {/* Login form panel */}
          <section className="border-t border-[#e2e8f0] bg-white p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
            <div className="mb-7">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#e8eef5] to-[#dcecff] text-[#17395c] shadow-sm">
                {mode === 'login' ? <LockKeyhole className="h-5 w-5" /> : mode === 'signup' ? <UserPlus className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
              </div>
              <h2 className="text-2xl font-black tracking-tight text-[#0f172a] sm:text-3xl">{heading}</h2>
              <p className="mt-2 max-w-sm text-xs leading-5 text-[#64748b]">{description}</p>
            </div>

            <AnimatePresence mode="wait">
              {serverStatus === 'offline' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 flex items-start gap-2.5 rounded border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800"
                >
                  <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <span>The server isn't responding right now. If this persists on a live deployment, double-check the API/functions were deployed correctly.</span>
                </motion.div>
              )}
              {message && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 flex items-start gap-2.5 rounded border border-emerald-200 bg-emerald-50 p-3 text-xs leading-5 text-emerald-800"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{message}</span>
                </motion.div>
              )}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 flex items-start gap-2.5 rounded border border-rose-200 bg-rose-50 p-3 text-xs leading-5 text-rose-800"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Full name</span>
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" autoComplete="name" className="w-full rounded border border-[#cbd5e1] bg-white px-3.5 py-3 text-xs text-[#1e293b] outline-none transition placeholder:text-[#94a3b8] hover:border-[#94a3b8] focus:border-[#17395c] focus:ring-2 focus:ring-[#17395c]/10" />
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Username</span>
                <input required type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter your username" autoComplete="username" className="w-full rounded border border-[#cbd5e1] bg-white px-3.5 py-3 text-xs text-[#1e293b] outline-none transition placeholder:text-[#94a3b8] hover:border-[#94a3b8] focus:border-[#17395c] focus:ring-2 focus:ring-[#17395c]/10" />
              </label>

              {mode !== 'forgot' && (
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-[#64748b]">{mode === 'signup' ? 'Create password' : 'Password'}</span>
                  <div className="relative">
                    <input required type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'signup' ? 'At least 4 characters' : 'Enter your password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} className="w-full rounded border border-[#cbd5e1] bg-white px-3.5 py-3 pr-10 text-xs text-[#1e293b] outline-none transition placeholder:text-[#94a3b8] hover:border-[#94a3b8] focus:border-[#17395c] focus:ring-2 focus:ring-[#17395c]/10" />
                    <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(v => !v)} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[#94a3b8] transition hover:text-[#17395c]">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>
              )}

              <label className="flex cursor-pointer items-center gap-2.5 pt-1">
                <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="h-3.5 w-3.5 accent-[#17395c]" />
                <span className="text-xs text-[#64748b]">I agree to the access terms.</span>
              </label>

              <button type="submit" disabled={isLoading} className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#17395c] to-[#0f2b48] px-4 py-3.5 text-xs font-bold text-white shadow-lg shadow-[#17395c]/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0">
                {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{isLoading ? 'Processing…' : mode === 'login' ? 'Sign in to Stock Operations' : mode === 'signup' ? 'Submit Account Request' : 'Request Password Recovery'}</span>
                {!isLoading && <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />}
              </button>
            </form>

            <div className="mt-5 flex flex-wrap gap-2">
              {mode !== 'login' && (
                <button type="button" onClick={() => switchMode('login')} className="rounded border border-[#cbd5e1] bg-white px-3 py-2 text-[11px] font-semibold text-[#475569] transition hover:border-[#17395c] hover:text-[#17395c]">Back to login</button>
              )}
              {mode === 'login' && (
                <>
                  <button type="button" onClick={() => switchMode('signup')} className="flex items-center gap-1.5 rounded border border-[#cbd5e1] bg-white px-3 py-2 text-[11px] font-semibold text-[#475569] transition hover:border-[#17395c] hover:text-[#17395c]"><UserPlus className="h-3.5 w-3.5" /> Create account</button>
                  <button type="button" onClick={() => switchMode('forgot')} className="flex items-center gap-1.5 rounded border border-[#cbd5e1] bg-white px-3 py-2 text-[11px] font-semibold text-[#475569] transition hover:border-[#17395c] hover:text-[#17395c]"><KeyRound className="h-3.5 w-3.5" /> Forgot password</button>
                </>
              )}
            </div>

            <div className="mt-9 flex items-center justify-between border-t border-[#e2e8f0] pt-4 text-[10px] text-[#94a3b8]">
              <span>DIAMOND WORLD LTD</span>
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Secure session</span>
            </div>
          </section>
          </motion.div>
          <footer className="mt-4 flex flex-col items-center justify-between gap-2 rounded border border-[#d8dee6] bg-white px-5 py-3.5 text-center shadow-2xs sm:flex-row sm:text-left">
            <div className="flex items-center gap-2.5">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-white p-2.5 border border-[#d8dee6] shadow-sm shadow-[#17395c]/20">
                <DiamondWorldLogo tone="black" className="h-full w-full text-white" />
              </div>
              <div>
                <div className="text-base font-black uppercase tracking-tight text-[#17395c]">Diamond World LTD</div>
                <div className="mt-1 text-[11px] font-medium text-[#94a3b8]">Universal Stock Operations ERP</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#64748b]">
              <span className="hidden h-px w-8 bg-[#cbd5e1] sm:block" />
              <span>Developed by <strong className="font-black tracking-wide text-[#17395c]">Shahadat Hossen</strong></span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};
