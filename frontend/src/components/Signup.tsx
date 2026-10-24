'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowRight, ChevronDown, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from 'lucide-react';
import { signup, verifySignup, clearError } from '@/store/slices/authSlice';
import { AppDispatch, RootState } from '@/store';

interface SignupProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function Signup({ onClose, onSwitchToLogin }: SignupProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('prefer_not_to_say');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [localError, setLocalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    dispatch(clearError());

    if (verificationSent) {
      if (!/^\d{6}$/.test(verificationCode)) {
        setLocalError('Enter the 6-digit code sent to your email');
        return;
      }
      const verified = await dispatch(verifySignup({ email: email.trim(), code: verificationCode }));
      if (verifySignup.fulfilled.match(verified)) {
        onClose();
      setVerificationSent(false);
      setResendSeconds(0);
        setVerificationCode('');
        setEmail(''); setFullName(''); setPhone(''); setPassword(''); setConfirmPassword('');
      } else {
        const errorMsg = (typeof verified.payload === 'string' ? verified.payload : verified.error?.message) || 'Verification failed. Please try again.';
        toast.error(errorMsg); setLocalError(errorMsg);
      }
      return;
    }

    // Validation
    if (!email.trim()) {
      setLocalError('Email is required');
      toast.error('Email is required');
      return;
    }
    if (!fullName.trim() || phone.length !== 10 || !/^[6-9]\d{9}$/.test(phone)) {
      setLocalError('Enter your name and a valid 10-digit Indian mobile number');
      toast.error('Enter your name and a valid 10-digit Indian mobile number');
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
    const result = await dispatch(signup({ fullName: fullName.trim(), phone: `+91${phone}`, gender, email, password }));
    
    if (signup.fulfilled.match(result)) {
      setVerificationSent(true);
      setResendSeconds(60);
      toast.success('A verification code has been sent to your email');
    } else {
      const errorMsg = (typeof result.payload === 'string' ? result.payload : result.error?.message) || 'Signup failed. Please try again.';
      toast.error(errorMsg);
      setLocalError(errorMsg);
    }
  };

  const handleResendCode = async () => {
    if (resendSeconds > 0 || isLoading) return;
    setLocalError('');
    const result = await dispatch(signup({ fullName: fullName.trim(), phone: `+91${phone}`, gender, email: email.trim(), password }));
    if (signup.fulfilled.match(result)) {
      setResendSeconds(60);
      toast.success('A new verification code has been sent');
    }
    else {
      const errorMsg = (typeof result.payload === 'string' ? result.payload : result.error?.message) || 'Could not resend the code';
      setLocalError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const displayError = localError || error;

  return (
    <div className="w-full">
        <div className="mb-5"><h2 id="auth-title" className="text-2xl font-semibold tracking-tight text-stone-950">{verificationSent ? 'Verify your email' : 'Create your account'}</h2><p className="mt-1 text-sm text-stone-500">{verificationSent ? `Enter the 6-digit code sent to ${email}. It expires in 10 minutes.` : 'Save your details and keep your orders together.'}</p></div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {displayError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {displayError}
            </div>
          )}

          {!verificationSent && <>
          <div>
            <label htmlFor="signup-name" className="mb-1.5 block text-sm font-medium text-stone-700">Full name</label>
            <input id="signup-name" autoComplete="name" required maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={isLoading} className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm text-stone-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 disabled:opacity-60" placeholder="Your name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="signup-phone" className="mb-1.5 block text-sm font-medium text-stone-700">Contact number</label>
              <div className="mt-1.5 flex overflow-hidden rounded-xl border border-amber-200 bg-white transition focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-100">
                <span className="inline-flex shrink-0 items-center gap-1.5 border-r border-amber-100 bg-amber-50/80 px-3 text-sm font-medium text-stone-700"><span aria-hidden="true">🇮🇳</span><span>+91</span></span>
                <input id="signup-phone" type="tel" inputMode="numeric" autoComplete="tel-national" required minLength={10} maxLength={10} pattern="[6-9][0-9]{9}" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} disabled={isLoading} className="min-w-0 w-full bg-transparent px-3 py-3 text-sm text-stone-900 outline-none disabled:opacity-60" placeholder="10-digit mobile number" />
              </div>
            </div>
            <div>
              <label htmlFor="signup-gender" className="mb-1.5 block text-sm font-medium text-stone-700">Gender</label>
              <div className="relative">
                <select
                  id="signup-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  disabled={isLoading}
                  className="w-full appearance-none rounded-xl border border-amber-200 bg-white py-3 pl-3 pr-8 text-sm text-stone-900 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 disabled:opacity-60"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium text-stone-700">Email address</label>
            <div className="relative"><Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"/><input type="email" id="signup-email" autoComplete="email" required value={email} onChange={(e) => { setEmail(e.target.value); setLocalError(''); dispatch(clearError()); }} disabled={isLoading} className="w-full rounded-xl border border-amber-200 bg-white py-3 pl-10 pr-4 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 disabled:opacity-60" placeholder="you@example.com"/></div>
          </div>
          </>}

          {verificationSent && <section aria-label="Email verification" className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-white/80 p-5 shadow-sm shadow-amber-950/5 sm:p-6">
            <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-orange-100/80 blur-2xl" />
            <div className="relative">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-100 to-orange-100 text-amber-800 shadow-sm shadow-amber-900/5">
                <Mail size={25} strokeWidth={1.8} />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold tracking-tight text-stone-900">Check your inbox</h3>
                <p className="mx-auto mt-1 max-w-xs text-sm leading-5 text-stone-500">We sent a one-time code to verify this email address.</p>
                <div aria-label={`Verification email sent to ${email}; address locked`} className="mx-auto mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-amber-100 bg-amber-50/80 px-3 py-1.5 text-sm font-medium text-amber-950">
                  <Mail size={14} className="shrink-0 text-amber-700" />
                  <span className="truncate">{email}</span>
                  <LockKeyhole size={13} aria-hidden="true" className="shrink-0 text-stone-400" />
                </div>
              </div>
              <div className="mt-5">
                <label htmlFor="signup-code" className="mb-2 block text-center text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">6-digit verification code</label>
                <input id="signup-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={verificationCode} onChange={(e) => { setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setLocalError(''); dispatch(clearError()); }} disabled={isLoading} className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3.5 text-center text-2xl font-semibold tracking-[0.55em] text-stone-900 shadow-inner shadow-amber-950/[0.02] outline-none transition placeholder:text-amber-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 disabled:opacity-60" placeholder="••••••" />
              </div>
              <div className="mt-4 flex flex-col items-center gap-2 text-center">
                <p className="text-xs text-stone-500">The code expires in 10 minutes. Check your spam folder if it’s missing.</p>
                <button type="button" onClick={handleResendCode} disabled={isLoading || resendSeconds > 0} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-50 hover:text-amber-950 disabled:cursor-not-allowed disabled:opacity-50">{resendSeconds > 0 ? `Resend code in 00:${String(resendSeconds).padStart(2, '0')}` : <>Didn’t receive it? <span className="underline underline-offset-4">Resend code</span></>}</button>
              </div>
            </div>
          </section>}

          {!verificationSent && <>
          <div>
            <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium text-stone-700">Password</label>
            <div className="relative"><LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"/><input type={showPassword ? 'text' : 'password'} id="signup-password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => { setPassword(e.target.value); setLocalError(''); dispatch(clearError()); }} disabled={isLoading} className="w-full rounded-xl border border-amber-200 bg-white py-3 pl-10 pr-12 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 disabled:opacity-60" placeholder="At least 6 characters"/><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-stone-400 transition hover:bg-amber-50 hover:text-stone-700">{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>
          </div>

          <div>
            <label htmlFor="confirm-password" className="mb-1.5 block text-sm font-medium text-stone-700">Confirm password</label>
            <div className="relative"><LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"/><input type={showConfirmPassword ? 'text' : 'password'} id="confirm-password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setLocalError(''); dispatch(clearError()); }} disabled={isLoading} className="w-full rounded-xl border border-amber-200 bg-white py-3 pl-10 pr-12 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 disabled:opacity-60" placeholder="Re-enter your password"/><button type="button" aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-stone-400 transition hover:bg-amber-50 hover:text-stone-700">{showConfirmPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div>
          </div>
          </>}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-800 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-amber-900/15 transition hover:bg-amber-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? <><LoaderCircle size={17} className="animate-spin"/>{verificationSent ? 'Verifying…' : 'Sending code…'}</> : <>{verificationSent ? 'Verify and create account' : 'Send verification code'}<ArrowRight size={17}/></>}
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
