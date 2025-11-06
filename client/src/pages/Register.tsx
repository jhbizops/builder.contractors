import React, { useEffect, useMemo, useState } from 'react';
import { Redirect, Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { BrandLogo } from '@/components/BrandLogo';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { codeToFlagEmoji, fetchCountries } from '@/lib/countries';
import type { GeoCountry } from '@/types/geo';
import { useGlobalization } from '@/contexts/GlobalizationContext';
import { createLocaleFromCountry } from '@/lib/globalization';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['sales', 'builder', 'dual'], {
    required_error: 'Please select a role',
  }),
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

  const watchedRole = watch('role');
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

      await registerUser(data.email, data.password, data.role, matchedCountry
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
          <p className="text-slate-600 mt-2">Create your contractor account</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                {...register('confirmPassword')}
                className={errors.confirmPassword ? 'border-red-500' : ''}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">Role</Label>
              <RadioGroup
                value={watchedRole ?? ''}
                onValueChange={(value) => setValue('role', value as 'sales' | 'builder' | 'dual')}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sales" id="sales" />
                  <Label htmlFor="sales" className="text-sm">Sales Partner</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="builder" id="builder" />
                  <Label htmlFor="builder" className="text-sm">Builder Partner</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dual" id="dual" />
                  <Label htmlFor="dual" className="text-sm">Both Sales & Builder</Label>
                </div>
              </RadioGroup>
              {errors.role && (
                <p className="text-sm text-red-500 mt-1">{errors.role.message}</p>
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
                            {country.localize ? (
                              <Badge variant="secondary" className="ml-2">Localized</Badge>
                            ) : null}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

            <Button type="submit" className="w-full" disabled={isLoading}>
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
