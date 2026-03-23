import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Server, ArrowLeft, Loader2, Eye, EyeOff, Check, X, ShieldCheck } from 'lucide-react';

const checkPasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return { checks, passed, total: 5 };
};

const isValidEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test(email)) return false;
  const domain = email.split('@')[1];
  const knownFake = ['mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwam.com', 'yopmail.com'];
  if (knownFake.includes(domain.toLowerCase())) return false;
  return true;
};

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailTouched, setEmailTouched] = useState(false);

  const { signIn, signUp, user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const strength = useMemo(() => checkPasswordStrength(password), [password]);
  const emailValid = isValidEmail(email);
  const emailInvalid = emailTouched && email.length > 0 && !emailValid;

  useEffect(() => {
    if (!authLoading && user && profile) {
      if (profile.is_banned) {
        toast({
          title: 'Account Banned',
          description: profile.ban_reason || 'Your account has been banned.',
          variant: 'destructive',
        });
        return;
      }
      navigate('/dashboard');
    }
  }, [user, profile, authLoading, navigate, toast]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email) errs.email = 'Email is required';
    else if (!isValidEmail(email)) errs.email = 'Please enter a valid email address (e.g. you@gmail.com)';
    if (!password) errs.password = 'Password is required';
    if (isSignUp) {
      if (strength.passed < 3) errs.password = 'Password is too weak — meet at least 3 of the 5 requirements below';
      if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
      if (!tosAccepted) errs.tos = 'You must accept the Terms of Service to create an account';
    } else {
      if (password.length < 6) errs.password = 'Password must be at least 6 characters';
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({ title: 'Account exists', description: 'An account with this email already exists. Try logging in instead.', variant: 'destructive' });
          } else {
            toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
          }
        } else {
          toast({ title: 'Welcome!', description: 'Your account has been created successfully.' });
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const strengthColor = () => {
    if (strength.passed <= 1) return 'bg-destructive';
    if (strength.passed <= 2) return 'bg-warning';
    if (strength.passed <= 3) return 'bg-yellow-400';
    if (strength.passed <= 4) return 'bg-primary/70';
    return 'bg-primary';
  };

  const strengthLabel = () => {
    if (!password) return '';
    if (strength.passed <= 1) return 'Very Weak';
    if (strength.passed <= 2) return 'Weak';
    if (strength.passed <= 3) return 'Fair';
    if (strength.passed <= 4) return 'Strong';
    return 'Very Strong';
  };

  const switchMode = (signup: boolean) => {
    setIsSignUp(signup);
    setErrors({});
    setPassword('');
    setConfirmPassword('');
    setTosAccepted(false);
    setEmailTouched(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="p-4">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to home</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border bg-card">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Server className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl">{isSignUp ? 'Create Account' : 'Welcome Back'}</CardTitle>
              <CardDescription className="mt-2">
                {isSignUp ? 'Sign up to start hosting your applications' : 'Login to access your hosting panel'}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    className={`pr-10 ${errors.email || emailInvalid ? 'border-destructive' : emailTouched && emailValid ? 'border-primary' : ''}`}
                  />
                  {emailTouched && email.length > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {emailValid
                        ? <Check className="w-4 h-4 text-primary" />
                        : <X className="w-4 h-4 text-destructive" />}
                    </span>
                  )}
                </div>
                {(errors.email || emailInvalid) && (
                  <p className="text-sm text-destructive">{errors.email || 'Please enter a valid email address'}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}

                {/* Strength Meter - only on signup */}
                {isSignUp && password.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex gap-1 h-1.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full transition-all ${i <= strength.passed ? strengthColor() : 'bg-muted'}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{strengthLabel()}</p>
                    <ul className="text-xs space-y-0.5">
                      {[
                        { key: 'length', label: 'At least 8 characters' },
                        { key: 'uppercase', label: 'One uppercase letter (A-Z)' },
                        { key: 'lowercase', label: 'One lowercase letter (a-z)' },
                        { key: 'number', label: 'One number (0-9)' },
                        { key: 'special', label: 'One special character (!@#...)' },
                      ].map(({ key, label }) => (
                        <li key={key} className={`flex items-center gap-1.5 ${strength.checks[key as keyof typeof strength.checks] ? 'text-primary' : 'text-muted-foreground'}`}>
                          {strength.checks[key as keyof typeof strength.checks]
                            ? <Check className="w-3 h-3 shrink-0" />
                            : <X className="w-3 h-3 shrink-0" />}
                          {label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm Password - only on signup */}
              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pr-10 ${errors.confirmPassword ? 'border-destructive' : confirmPassword && password === confirmPassword ? 'border-primary' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && !errors.confirmPassword && (
                    <p className="text-sm text-destructive">Passwords do not match</p>
                  )}
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>
              )}

              {/* Terms of Service - only on signup */}
              {isSignUp && (
                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <div
                      className={`mt-0.5 w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-all ${
                        tosAccepted ? 'bg-primary border-primary' : errors.tos ? 'border-destructive' : 'border-border'
                      }`}
                      onClick={() => setTosAccepted(!tosAccepted)}
                    >
                      {tosAccepted && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className="text-sm text-muted-foreground leading-relaxed">
                      I have read and agree to the{' '}
                      <Link to="/terms" target="_blank" className="text-primary hover:underline font-medium">
                        Terms of Service
                      </Link>
                      , including the{' '}
                      <span className="text-warning font-medium">No Refund Policy</span>.
                      All payments are final and non-refundable.
                    </span>
                  </label>
                  {errors.tos && <p className="text-sm text-destructive">{errors.tos}</p>}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:opacity-90"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isSignUp ? (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Create Account
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              {isSignUp ? (
                <p className="text-muted-foreground">
                  Already have an account?{' '}
                  <button type="button" onClick={() => switchMode(false)} className="text-primary hover:underline font-medium">
                    Login
                  </button>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => switchMode(true)} className="text-primary hover:underline font-medium">
                    Sign up
                  </button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Auth;
