'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from 'lucide-react';
import { signup, clearError } from '@/store/slices/authSlice';
import { AppDispatch, RootState } from '@/store';

interface SignupProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function Signup({ onClose, onSwitchToLogin }: SignupProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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
    if (!validateEmail(email)) {
      setLocalError('Please enter a valid email');
      toast.error('Please enter a valid email');
      return;
    }
    if (!password) {
      setLocalError('Password is required');
      toast.error('Password is required');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    // Dispatch signup action
    const result = await dispatch(signup({ email, password }));
    
    if (signup.fulfilled.match(result)) {
      onClose();
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } else {
      const errorMsg = result.payload || result.error.message || 'Signup failed. Please try again.';
      toast.error(errorMsg);
      setLocalError(errorMsg);
    }
  };

  const displayError = localError || error;

  return (
    <div className="w-full">
        <div className="mb-5"><h2 id="auth-title" className="text-2xl font-semibold tracking-tight text-stone-950">Create your account</h2><p className="mt-1 text-sm text-stone-500">Save your details and keep your orders together.</p></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {displayError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {displayError}
            </div>
          )}

          <div>
            <label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium text-stone-700">Email address</label>
            <div className="relative"><Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"/><input type="email" id="signup-email" autoComplete="email" required value={email} onChange={(e) => { setEmail(e.target.value); setLocalError(''); dispatch(clearError()); }} disabled={isLoading} className="w-full rounded-xl border border-amber-200 bg-white py-3 pl-10 pr-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 disabled:opacity-60" placeholder="you@example.com"/></div>
          </div>

          <div>
            <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium text-stone-700">Password</label>
            <div className="relative"><LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"/><input type={showPassword ? 'text' : 'password'} id="signup-password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => { setPassword(e.target.value); setLocalError(''); dispatch(clearError()); }} disabled={isLoading} className="w-full rounded-xl border border-amber-200 bg-white py-3 pl-10 pr-12 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 disabled:opacity-60" placeholder="At least 6 characters"/><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-stone-400 transition hover:bg-amber-50 hover:text-stone-700">{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-stone-700">Confirm password</label>
            <div className="relative"><LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"/><input type={showConfirmPassword ? 'text' : 'password'} id="confirm-password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setLocalError(''); dispatch(clearError()); }} disabled={isLoading} className="w-full rounded-xl border border-amber-200 bg-white py-3 pl-10 pr-12 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 disabled:opacity-60" placeholder="Re-enter your password"/><button type="button" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-stone-400 transition hover:bg-amber-50 hover:text-stone-700">{showConfirmPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-800 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-amber-900/15 transition hover:bg-amber-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? <><LoaderCircle size={17} className="animate-spin"/>Creating account…</> : <>Create account<ArrowRight size={17}/></>}
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-sm text-stone-500">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="font-semibold text-amber-800 underline-offset-4 hover:underline"
            >
              Login
            </button>
          </p>
        </div>

    </div>
  );
}
