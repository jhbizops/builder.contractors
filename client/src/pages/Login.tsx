import { useState } from 'react';
import { Redirect, Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandLogo } from '@/components/BrandLogo';
import { HeadManager } from '@/components/HeadManager';
import { Checkbox } from '@/components/ui/checkbox';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { currentUser, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  if (currentUser) {
    return <Redirect to="/dashboard" />;
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      await login(data.email, data.password, data.rememberMe ?? false);
    } catch (error) {
      setAuthError('Unable to sign in. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <HeadManager
        title="Sign in | Builder.Contractors"
        description="Secure sign in for Builder.Contractors members."
        canonicalPath="/login"
        robotsContent="noindex,nofollow,noarchive,nosnippet"
      />
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <BrandLogo size="sm" className="mx-auto mb-4" alt="Builder.Contractors" />
          <CardTitle className="text-2xl font-bold text-slate-900">Welcome Back</CardTitle>
          <p className="text-slate-600 mt-2">Sign in to manage your builder network in minutes.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                autoComplete="email"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
                data-testid="input-email"
              />
              <p className="text-xs text-slate-500 mt-1">Use the email you registered with.</p>
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                  className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                  data-testid="input-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Minimum 6 characters.</p>
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Controller
                control={control}
                name="rememberMe"
                render={({ field: { value, onChange, onBlur } }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rememberMe"
                      checked={value}
                      onCheckedChange={(checked) => onChange(checked === true)}
                      onBlur={onBlur}
                      data-testid="checkbox-remember"
                    />
                  <Label htmlFor="rememberMe" className="text-sm cursor-pointer">
                      Keep me signed in for 30 days on this device
                  </Label>
                  </div>
                )}
              />
              <span className="text-xs text-slate-500">
                Use a shared device? Leave this unchecked.
              </span>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-signin"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
            {authError && (
              <p className="text-sm text-red-500 text-center" role="alert">
                {authError}
              </p>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary font-medium hover:text-blue-700">
                Register here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
}
