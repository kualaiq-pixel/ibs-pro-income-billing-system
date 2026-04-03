'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/hooks/use-translation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePwaInstall } from '@/hooks/use-pwa-install';
import dynamic from 'next/dynamic';

const LoginFloatingControls = dynamic(
  () => import('./login-floating-controls'),
  { ssr: false }
);

import {
  DollarSign,
  Loader2,
  Shield,
  Building2,
  Eye,
  EyeOff,
  Download,
} from 'lucide-react';

export function LoginPage() {
  const t = useTranslation();
  const { login } = useAppStore();
  const { isInstallable, install } = usePwaInstall();

  const [loginTab, setLoginTab] = useState<string>('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error(t('loginError'));
      return;
    }
    if (loginTab === 'company' && !companyCode.trim()) {
      toast.error(t('loginError'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          isCompanyLogin: loginTab === 'company',
          companyCode: loginTab === 'company' ? companyCode.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || t('loginError'));
        return;
      }

      const { user } = data;
      login(
        {
          id: user.id,
          username: user.username,
          role: user.role,
          companyId: user.companyId ?? null,
        },
        user.companyName
          ? {
              id: user.companyId ?? '',
              name: user.companyName,
              code: user.companyCode || '',
              vat: '',
              vatId: '',
              accountNumber: '',
              address: '',
              zipCode: '',
              city: '',
              country: '',
              currency: '€',
              createdAt: '',
              updatedAt: '',
            }
          : null
      );

      toast.success(t('welcomeBack'));
    } catch {
      toast.error(t('loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] safe-area-left safe-area-right">
      {/* Floating controls — returns null during SSR/hydration, renders after mount */}
      <LoginFloatingControls />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo / Branding */}
        <div className="mb-6 sm:mb-8 flex flex-col items-center text-center">
          <div className="mb-3 sm:mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <DollarSign className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">IBS Pro</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Income & Billing System
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border/50 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-center">{t('login')}</CardTitle>
            <CardDescription className="text-center">
              {t('welcomeBack')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={loginTab} onValueChange={setLoginTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="admin" className="gap-1.5 text-xs sm:text-sm">
                  <Shield className="h-3.5 w-3.5 hidden sm:block" />
                  {t('adminLogin')}
                </TabsTrigger>
                <TabsTrigger value="company" className="gap-1.5 text-xs sm:text-sm">
                  <Building2 className="h-3.5 w-3.5 hidden sm:block" />
                  {t('companyLogin')}
                </TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <motion.div
                  key={loginTab}
                  initial={{ opacity: 0, x: loginTab === 'admin' ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: loginTab === 'admin' ? 10 : -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-4">
                    {/* Username */}
                    <div className="space-y-2">
                      <Label htmlFor="username">{t('username')}</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder={t('username')}
                        autoComplete="username"
                        autoFocus
                        disabled={isLoading}
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <Label htmlFor="password">{t('password')}</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t('password')}
                          autoComplete="current-password"
                          disabled={isLoading}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-muted-foreground"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Company Code (company tab only) */}
                    <AnimatePresence>
                      {loginTab === 'company' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="space-y-2 overflow-hidden">
                            <Label htmlFor="companyCode">{t('companyCode')}</Label>
                            <Input
                              id="companyCode"
                              value={companyCode}
                              onChange={(e) => setCompanyCode(e.target.value)}
                              placeholder={t('companyCode')}
                              disabled={isLoading}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Login Button */}
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ...
                        </>
                      ) : (
                        t('login')
                      )}
                    </Button>
                  </form>
                </motion.div>
              </AnimatePresence>
            </Tabs>

            {/* Footer links */}
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <button type="button" className="hover:text-primary transition-colors">
                {t('forgotPassword')}
              </button>
              <button type="button" className="hover:text-primary transition-colors">
                {t('help')}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Install App Button */}
        <AnimatePresence>
          {isInstallable && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="mt-4"
            >
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 border-primary/30 hover:bg-primary/10 hover:text-primary"
                onClick={install}
              >
                <Download className="h-4 w-4" />
                Install App
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          IBS Pro &copy; {new Date().getFullYear()} &mdash; Income & Billing System
        </p>
      </motion.div>
    </div>
  );
}
