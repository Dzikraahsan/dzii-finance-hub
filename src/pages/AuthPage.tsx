import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2,
  ArrowLeft, ArrowRight, ShieldCheck, Sparkles, User as UserIcon,
} from 'lucide-react';

type Mode = 'signin' | 'signup';
type Step = 1 | 2 | 3;

interface PwChecks {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function evaluatePassword(pw: string): { checks: PwChecks; score: number; label: string; tone: string } {
  const checks: PwChecks = {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const label = ['', 'Weak', 'Weak', 'Fair', 'Good', 'Strong'][score];
  const tone = ['bg-muted', 'bg-destructive', 'bg-destructive', 'bg-warning', 'bg-accent', 'bg-success'][score];
  return { checks, score, label, tone };
}

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');

  // shared
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // signup-only
  const [name, setName] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [accountCreated, setAccountCreated] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  useEffect(() => { emailRef.current?.focus(); }, [mode]);

  const pwInfo = useMemo(() => evaluatePassword(password), [password]);

  const emailError = touched.email && !email ? 'Email is required'
    : touched.email && !emailRegex.test(email) ? 'Enter a valid email' : '';
  const passwordError = touched.password && !password ? 'Password is required'
    : touched.password && mode === 'signin' && password.length < 6 ? 'Password is too short' : '';
  const nameError = touched.name && !name.trim() ? 'Name is required' : '';
  const confirmError = touched.confirm && confirmPw !== password ? 'Passwords do not match' : '';

  const canSignIn = !!email && !!password && !emailError && !passwordError;
  const canStep1 = !!name.trim() && emailRegex.test(email);
  const canStep2 = pwInfo.score >= 4 && confirmPw === password && password.length >= 8;

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') setCapsOn(e.getModifierState('CapsLock'));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    if (!canSignIn || loading) return;
    setServerError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) setServerError(error.message);
    setLoading(false);
  };

  const handleCreateAccount = async () => {
    if (loading) return;
    setServerError('');
    setLoading(true);
    const { error } = await signUp(email, password);
    if (error) setServerError(error.message);
    else setAccountCreated(true);
    setLoading(false);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setServerError('');
    setTouched({});
    setStep(1);
    setAccountCreated(false);
  };

  return (
    <div className="relative min-h-[100dvh] bg-background flex items-center justify-center px-5 py-10 overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 gradient-mesh opacity-60" aria-hidden />
      <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-accent/10 blur-3xl" aria-hidden />

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl gradient-primary mx-auto flex items-center justify-center mb-4 glow-primary">
            <span className="text-xl font-black text-primary-foreground font-display">D</span>
          </div>
          <h1 className="text-h2 text-gradient">Dzii Finance</h1>
          <p className="text-caption text-muted-foreground mt-1.5">
            {mode === 'signin' ? 'Welcome back — sign in to continue' : 'Create your finance command center'}
          </p>
        </div>

        {/* Mode tabs */}
        <div className="flex p-1 surface-card mb-6">
          {(['signin', 'signup'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-2 rounded-xl text-caption font-semibold transition-all ${
                mode === m ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {m === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        {/* CARD */}
        <div className="surface-card-lg p-5 sm:p-6">
          {mode === 'signin' ? (
            <SignInForm
              {...{
                email, setEmail, password, setPassword, showPw, setShowPw,
                capsOn, handleKey, loading, serverError,
                emailError, passwordError, touched, setTouched,
                onSubmit: handleSignIn, emailRef,
              }}
            />
          ) : accountCreated ? (
            <AccountCreated email={email} onSignIn={() => switchMode('signin')} />
          ) : (
            <SignUpFlow
              {...{
                step, setStep,
                name, setName, email, setEmail, password, setPassword,
                confirmPw, setConfirmPw,
                showPw, setShowPw, showConfirm, setShowConfirm,
                capsOn, handleKey, loading, serverError,
                nameError, emailError, passwordError, confirmError,
                touched, setTouched,
                pwInfo, canStep1, canStep2,
                onCreate: handleCreateAccount, emailRef,
              }}
            />
          )}
        </div>

        <p className="text-center text-caption text-muted-foreground mt-5">
          {mode === 'signin' ? "New to Dzii?" : 'Already have an account?'}{' '}
          <button onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} className="text-primary font-semibold hover:underline">
            {mode === 'signin' ? 'Create an account' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}

/* ---------------- SIGN IN ---------------- */

function SignInForm(props: any) {
  const {
    email, setEmail, password, setPassword, showPw, setShowPw,
    capsOn, handleKey, loading, serverError,
    emailError, passwordError, touched, setTouched, onSubmit, emailRef,
  } = props;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field
        id="signin-email"
        label="Email"
        icon={<Mail className="w-4 h-4" />}
        error={emailError}
      >
        <input
          ref={emailRef}
          id="signin-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onBlur={() => setTouched((t: any) => ({ ...t, email: true }))}
          className="auth-input"
          aria-invalid={!!emailError}
        />
      </Field>

      <Field
        id="signin-password"
        label="Password"
        icon={<Lock className="w-4 h-4" />}
        error={passwordError}
        hint={capsOn ? 'Caps Lock is on' : undefined}
        rightAction={
          <button type="button" onClick={() => setShowPw((s: boolean) => !s)} aria-label={showPw ? 'Hide password' : 'Show password'} className="text-muted-foreground hover:text-foreground">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
      >
        <input
          id="signin-password"
          type={showPw ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyUp={handleKey}
          onKeyDown={handleKey}
          onBlur={() => setTouched((t: any) => ({ ...t, password: true }))}
          className="auth-input pr-10"
          aria-invalid={!!passwordError}
        />
      </Field>

      <div className="flex items-center justify-between text-caption">
        <label className="flex items-center gap-2 text-muted-foreground select-none cursor-pointer">
          <input type="checkbox" className="accent-primary w-3.5 h-3.5" />
          Remember me
        </label>
        <button type="button" className="text-primary font-medium hover:underline">Forgot?</button>
      </div>

      {serverError && <ServerError message={serverError} />}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed btn-press shadow-md flex items-center justify-center gap-2"
      >
        {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>) : 'Sign in'}
      </button>
    </form>
  );
}

/* ---------------- SIGN UP FLOW ---------------- */

function SignUpFlow(props: any) {
  const {
    step, setStep,
    name, setName, email, setEmail, password, setPassword, confirmPw, setConfirmPw,
    showPw, setShowPw, showConfirm, setShowConfirm,
    capsOn, handleKey, loading, serverError,
    nameError, emailError, passwordError, confirmError,
    touched, setTouched,
    pwInfo, canStep1, canStep2, onCreate, emailRef,
  } = props;

  return (
    <div className="space-y-5">
      <Stepper step={step} />

      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <Field id="su-name" label="Full name" icon={<UserIcon className="w-4 h-4" />} error={nameError}>
            <input
              id="su-name" type="text" autoComplete="name" placeholder="Jane Cooper"
              value={name} onChange={e => setName(e.target.value)}
              onBlur={() => setTouched((t: any) => ({ ...t, name: true }))}
              className="auth-input" aria-invalid={!!nameError}
            />
          </Field>

          <Field id="su-email" label="Email" icon={<Mail className="w-4 h-4" />} error={emailError}>
            <input
              ref={emailRef}
              id="su-email" type="email" autoComplete="email" inputMode="email"
              placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onBlur={() => setTouched((t: any) => ({ ...t, email: true }))}
              className="auth-input" aria-invalid={!!emailError}
            />
          </Field>

          <StepActions
            primary={{
              label: 'Continue', icon: <ArrowRight className="w-4 h-4" />,
              disabled: !canStep1,
              onClick: () => { setTouched((t: any) => ({ ...t, name: true, email: true })); if (canStep1) setStep(2); },
            }}
          />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <Field
            id="su-pw" label="Create password" icon={<Lock className="w-4 h-4" />} error={passwordError}
            hint={capsOn ? 'Caps Lock is on' : undefined}
            rightAction={
              <button type="button" onClick={() => setShowPw((s: boolean) => !s)} aria-label="Toggle password" className="text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          >
            <input
              id="su-pw" type={showPw ? 'text' : 'password'} autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyUp={handleKey} onKeyDown={handleKey}
              onBlur={() => setTouched((t: any) => ({ ...t, password: true }))}
              className="auth-input pr-10"
            />
          </Field>

          {/* Strength meter */}
          <div className="space-y-2">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${
                  pwInfo.score >= i + 1 ? pwInfo.tone : 'bg-muted'
                }`} />
              ))}
            </div>
            <p className="text-caption text-muted-foreground">
              Strength: <span className="font-semibold text-foreground">{pwInfo.label || '—'}</span>
            </p>
          </div>

          {/* Checklist */}
          <ul className="grid grid-cols-2 gap-1.5 text-caption">
            <Check ok={pwInfo.checks.length}>8+ characters</Check>
            <Check ok={pwInfo.checks.upper}>Uppercase</Check>
            <Check ok={pwInfo.checks.lower}>Lowercase</Check>
            <Check ok={pwInfo.checks.number}>Number</Check>
            <Check ok={pwInfo.checks.special}>Special character</Check>
          </ul>

          <Field
            id="su-confirm" label="Confirm password" icon={<ShieldCheck className="w-4 h-4" />} error={confirmError}
            rightAction={
              <button type="button" onClick={() => setShowConfirm((s: boolean) => !s)} aria-label="Toggle password" className="text-muted-foreground hover:text-foreground">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          >
            <input
              id="su-confirm" type={showConfirm ? 'text' : 'password'} autoComplete="new-password"
              placeholder="Re-enter password"
              value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              onBlur={() => setTouched((t: any) => ({ ...t, confirm: true }))}
              className="auth-input pr-10" aria-invalid={!!confirmError}
            />
          </Field>

          <StepActions
            secondary={{ label: 'Back', icon: <ArrowLeft className="w-4 h-4" />, onClick: () => setStep(1) }}
            primary={{
              label: 'Review', icon: <ArrowRight className="w-4 h-4" />,
              disabled: !canStep2,
              onClick: () => { setTouched((t: any) => ({ ...t, password: true, confirm: true })); if (canStep2) setStep(3); },
            }}
          />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <div className="rounded-xl bg-surface border border-border p-4 space-y-3">
            <Review label="Name" value={name} />
            <Review label="Email" value={email} />
            <Review label="Password" value={'•'.repeat(Math.min(password.length, 14))} />
          </div>

          {serverError && <ServerError message={serverError} />}

          <StepActions
            secondary={{ label: 'Back', icon: <ArrowLeft className="w-4 h-4" />, onClick: () => setStep(2) }}
            primary={{
              label: loading ? 'Creating…' : 'Create account',
              icon: loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />,
              disabled: loading,
              onClick: onCreate,
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ---------------- SUB-COMPONENTS ---------------- */

function Field({ id, label, icon, error, hint, rightAction, children }: any) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-caption font-medium text-foreground">{label}</label>
      <div className={`relative flex items-center rounded-xl border bg-surface transition-all
        ${error ? 'border-destructive/60 ring-2 ring-destructive/15' : 'border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15'}`}>
        <span className="absolute left-3.5 text-muted-foreground pointer-events-none">{icon}</span>
        <div className="w-full">{children}</div>
        {rightAction && <span className="absolute right-3.5">{rightAction}</span>}
      </div>
      {error ? (
        <p className="text-caption text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>
      ) : hint ? (
        <p className="text-caption text-warning flex items-center gap-1"><AlertCircle className="w-3 h-3" />{hint}</p>
      ) : null}
    </div>
  );
}

function ServerError({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 flex items-start gap-2">
      <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
      <p className="text-caption text-destructive">{message}</p>
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-between gap-2">
      {[1, 2, 3].map(n => (
        <div key={n} className="flex-1 flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-caption font-semibold shrink-0 transition-all
            ${step === n ? 'bg-primary text-primary-foreground shadow-sm'
              : step > n ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
            {step > n ? <CheckCircle2 className="w-4 h-4" /> : n}
          </div>
          {n < 3 && <div className={`h-px flex-1 ${step > n ? 'bg-primary/40' : 'bg-border'}`} />}
        </div>
      ))}
    </div>
  );
}

function StepActions({ primary, secondary }: any) {
  return (
    <div className="flex items-center gap-2 pt-1">
      {secondary && (
        <button type="button" onClick={secondary.onClick}
          className="h-11 px-4 rounded-xl bg-surface border border-border text-sm font-medium text-foreground btn-press flex items-center gap-2">
          {secondary.icon}{secondary.label}
        </button>
      )}
      <button type="button" onClick={primary.onClick} disabled={primary.disabled}
        className="flex-1 h-11 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed btn-press shadow-md flex items-center justify-center gap-2">
        {primary.label}{primary.icon}
      </button>
    </div>
  );
}

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-1.5 ${ok ? 'text-success' : 'text-muted-foreground'}`}>
      <CheckCircle2 className={`w-3.5 h-3.5 ${ok ? '' : 'opacity-40'}`} />
      <span>{children}</span>
    </li>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground truncate max-w-[60%]">{value}</span>
    </div>
  );
}

function AccountCreated({ email, onSignIn }: { email: string; onSignIn: () => void }) {
  return (
    <div className="text-center py-2 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-success/15 text-success mx-auto flex items-center justify-center mb-4">
        <CheckCircle2 className="w-7 h-7" />
      </div>
      <h2 className="text-h3 text-foreground mb-1">Account created</h2>
      <p className="text-caption text-muted-foreground mb-5">
        We sent a confirmation link to <span className="text-foreground font-medium">{email}</span>.
      </p>
      <button onClick={onSignIn}
        className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm btn-press shadow-md">
        Continue to sign in
      </button>
    </div>
  );
}
