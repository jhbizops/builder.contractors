import React, { useEffect, useMemo, useState } from 'react';
import { Redirect, Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { BrandLogo } from '@/components/BrandLogo';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { codeToFlagEmoji, fetchCountries } from '@/lib/countries';
import type { GeoCountry } from '@/types/geo';
import { useGlobalization } from '@/contexts/GlobalizationContext';
import { createLocaleFromCountry } from '@/lib/globalization';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  country: z.string().length(2, 'Please select your country'),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the Terms of Service and Privacy Policy',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const { currentUser, register: registerUser } = useAuth();
  const { geo, setGeoCountry } = useGlobalization();
  const { data: countriesData, isPending: loadingCountries } = useQuery<GeoCountry[]>({
    queryKey: ['/api/countries'],
    queryFn: fetchCountries,
    staleTime: 1000 * 60 * 60,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      country: '',
      agreeToTerms: false,
    },
  });

  const watchedCountry = watch('country');

  const countries = useMemo(() => countriesData ?? [], [countriesData]);

  useEffect(() => {
    if (geo.country && !watchedCountry) {
      setValue('country', geo.country.code);
    }
  }, [geo.country, setValue, watchedCountry]);

  if (currentUser) {
    return <Redirect to="/dashboard" />;
  }

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const matchedCountry =
        countries.find((country) => country.code === data.country) ?? geo.country ?? null;

      if (matchedCountry) {
        setGeoCountry(matchedCountry);
      }

      await registerUser(data.email, data.password, 'dual', matchedCountry
        ? {
            country: matchedCountry.code,
            locale: createLocaleFromCountry(matchedCountry.code, matchedCountry.languages),
            currency: matchedCountry.currency,
            languages: [...matchedCountry.languages],
          }
        : undefined);
    } catch (error) {
      // Error is handled in the context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <BrandLogo size="sm" className="mx-auto mb-4" alt="Builder.Contractors" />
          <CardTitle className="text-2xl font-bold text-slate-900">Join Builder.Contractors</CardTitle>
          <p className="text-slate-600 mt-2">
            Create your account in less than a minute. No sales or builder split required.
          </p>
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
              <p className="text-xs text-slate-500 mt-1">We only use this for account access.</p>
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
                  autoComplete="new-password"
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
              <p className="text-xs text-slate-500 mt-1">Use at least 8 characters.</p>
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                  data-testid="input-confirm-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-500"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Controller
              control={control}
              name="country"
              render={({ field }) => (
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      const match = countries.find((country) => country.code === value);
                      if (match) {
                        setGeoCountry(match);
                      }
                    }}
                    disabled={loadingCountries}
                    data-testid="select-country"
                  >
                    <SelectTrigger id="country" className="mt-1">
                      <SelectValue
                        placeholder={loadingCountries ? 'Loading countries…' : 'Select your country'}
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          <div className="flex items-center gap-2">
                            <span aria-hidden="true">{codeToFlagEmoji(country.code)}</span>
                            <span className="truncate">{country.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-1">
                    We use this to localize currency and date formats.
                  </p>
                  {errors.country && (
                    <p className="text-sm text-red-500 mt-1">{errors.country.message}</p>
                  )}
                </div>
              )}
            />

            <Controller
              control={control}
              name="agreeToTerms"
              render={({ field: { value, onChange, onBlur } }) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreeToTerms"
                    checked={value}
                    onCheckedChange={(checked) => onChange(checked === true)}
                    onBlur={onBlur}
                  />
                  <Label htmlFor="agreeToTerms" className="text-sm">
                    I agree to the Terms of Service and Privacy Policy
                  </Label>
                </div>
              )}
            />
            {errors.agreeToTerms && (
              <p className="text-sm text-red-500">{errors.agreeToTerms.message}</p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-register">
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-medium hover:text-blue-700">
                Sign in here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
