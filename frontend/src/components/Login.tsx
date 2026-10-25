'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from 'lucide-react';
import { login, clearError } from '@/store/slices/authSlice';
import { AppDispatch, RootState } from '@/store';
import { fetchCart} from '@/store/slices/orderSlice';
import { authService } from '@/services/api/authService';

interface LoginProps {
  onClose: () => void;
  onSwitchToSignup: () => void;
}

export default function Login({ onClose, onSwitchToSignup }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    dispatch(clearError());

    // Validation
    if (!email.trim()) {
      setLocalError('Email is required');
      toast.error('Email is required');
      return;
    }
    if (!password) {
      setLocalError('Password is required');
      toast.error('Password is required');
      return;
    }

    // Dispatch login action
    const result = await dispatch(login({ email, password }));
    
    if (login.fulfilled.match(result)) {
      onClose();
      setEmail('');
      setPassword('');
      dispatch(fetchCart());
    } else {
      const errorMsg = (typeof result.payload === 'string' ? result.payload : result.error?.message) || 'Login failed. Please try again.';
      toast.error(errorMsg);
      setLocalError(errorMsg);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!resetRequested) {
        await authService.forgotPassword(email.trim());
        setResetRequested(true);
        toast.success('If an account exists, a reset code has been sent.');
      } else {
        if (newPassword !== confirmNewPassword) {
          toast.error('Passwords do not match');
          return;
        }
        await authService.resetPassword(email.trim(), resetCode, newPassword);
        toast.success('Password updated. Sign in with your new password.');
        setForgotMode(false); setResetRequested(false); setPassword(''); setNewPassword(''); setConfirmNewPassword(''); setResetCode('');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Password reset failed');
    }
  };

  const displayError = localError || error;

  return (
    <div className="w-full">
        <div className="mb-5"><h2 id="auth-title" className="text-2xl font-semibold tracking-tight text-stone-950">{forgotMode ? (resetRequested ? 'Choose a new password' : 'Reset your password') : 'Welcome back'}</h2><p className="mt-1 text-sm text-stone-500">{forgotMode ? 'We’ll email a one-time code to verify it’s you.' : 'Sign in to continue to your account.'}</p></div>
        {forgotMode ? <form onSubmit={handleForgotPassword} className="space-y-4">
          {!resetRequested ? <div><label htmlFor="email" className="mb-1.5 block text-sm font-medium text-stone-700">Email address</label><input type="email" id="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100" placeholder="you@example.com"/></div> : <section aria-label="Password reset verification" className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-white/80 p-5 shadow-sm shadow-amber-950/5 sm:p-6">
            <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-orange-100/80 blur-2xl" />
            <div className="relative">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-100 to-orange-100 text-amber-800 shadow-sm shadow-amber-900/5"><Mail size={25} strokeWidth={1.8} /></div>
              <div className="text-center"><h3 className="text-lg font-semibold tracking-tight text-stone-900">Check your inbox</h3><p className="mx-auto mt-1 max-w-xs text-sm leading-5 text-stone-500">We sent a password reset code to your email.</p><div aria-label={`Reset code sent to ${email}`} className="mx-auto mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-amber-100 bg-amber-50/80 px-3 py-1.5 text-sm font-medium text-amber-950"><Mail size={14} className="shrink-0 text-amber-700"/><span className="truncate">{email}</span><LockKeyhole size={13} aria-hidden="true" className="shrink-0 text-stone-400"/></div></div>
              <div className="mt-5"><label htmlFor="reset-code" className="mb-2 block text-center text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">6-digit reset code</label><input id="reset-code" inputMode="numeric" autoComplete="one-time-code" required maxLength={6} pattern="[0-9]{6}" value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3.5 text-center text-2xl font-semibold tracking-[0.55em] text-stone-900 shadow-inner shadow-amber-950/[0.02] outline-none transition placeholder:text-amber-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 disabled:opacity-60" placeholder="••••••"/></div>
              <p className="mt-3 text-center text-xs text-stone-500">The code expires in 10 minutes. Check your spam folder if it’s missing.</p>
              <div className="mt-5"><label htmlFor="new-password" className="mb-1.5 block text-sm font-medium text-stone-700">New password</label><div className="relative"><input type={showNewPassword ? 'text' : 'password'} id="new-password" autoComplete="new-password" required minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full rounded-xl border border-amber-200 bg-white py-3 pl-4 pr-12 text-sm text-stone-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100" placeholder="Enter a new password"/><button type="button" aria-label={showNewPassword ? 'Hide new password' : 'Show new password'} onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-stone-400 transition hover:bg-amber-50 hover:text-stone-700">{showNewPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></div>
              <div className="mt-4"><label htmlFor="confirm-new-password" className="mb-1.5 block text-sm font-medium text-stone-700">Confirm new password</label><div className="relative"><input type={showConfirmNewPassword ? 'text' : 'password'} id="confirm-new-password" autoComplete="new-password" required minLength={6} value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} className="w-full rounded-xl border border-amber-200 bg-white py-3 pl-4 pr-12 text-sm text-stone-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100" placeholder="Re-enter your new password"/><button type="button" aria-label={showConfirmNewPassword ? 'Hide confirmation password' : 'Show confirmation password'} onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-stone-400 transition hover:bg-amber-50 hover:text-stone-700">{showConfirmNewPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></div>
            </div>
          </section>}
          <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-800 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-900">{resetRequested ? 'Update password' : 'Send reset code'}<ArrowRight size={17}/></button>
          <button type="button" onClick={() => { setForgotMode(false); setResetRequested(false); }} className="w-full text-center text-sm font-semibold text-amber-800">Back to sign in</button>
        </form> : <form onSubmit={handleSubmit} className="space-y-4">
          {displayError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {displayError}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-stone-700">Email address</label>
            <div className="relative"><Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"/><input type="email" id="email" autoComplete="email" required value={email} onChange={(e) => { setEmail(e.target.value); setLocalError(''); dispatch(clearError()); }} disabled={isLoading} className="w-full rounded-xl border border-amber-200 bg-white py-3 pl-10 pr-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 disabled:opacity-60" placeholder="you@example.com"/></div>
          </div>

          <div className="-mt-2 text-right"><button type="button" onClick={() => setForgotMode(true)} className="text-sm font-semibold text-amber-800 hover:underline">Forgot password?</button></div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-stone-700">Password</label>
            <div className="relative"><LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"/><input type={showPassword ? 'text' : 'password'} id="password" autoComplete="current-password" required value={password} onChange={(e) => { setPassword(e.target.value); setLocalError(''); dispatch(clearError()); }} disabled={isLoading} className="w-full rounded-xl border border-amber-200 bg-white py-3 pl-10 pr-12 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 disabled:opacity-60" placeholder="Enter your password"/><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-stone-400 transition hover:bg-amber-50 hover:text-stone-700">{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-800 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-amber-900/15 transition hover:bg-amber-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? <><LoaderCircle size={17} className="animate-spin"/>Signing in…</> : <>Sign in<ArrowRight size={17}/></>}
          </button>
        </form>
        }

        <div className="mt-5 text-center">
          <p className="text-sm text-stone-500">
            Don&apos;t have an account?{' '}
            <button
              onClick={onSwitchToSignup}
              className="font-semibold text-amber-800 underline-offset-4 hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>
    </div>
  );
}
