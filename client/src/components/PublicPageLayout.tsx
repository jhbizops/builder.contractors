import type { ReactNode } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { CountrySelector } from "@/components/CountrySelector";
import { useGlobalization } from "@/contexts/GlobalizationContext";

type PublicPageLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function PublicPageLayout({ title, subtitle, children }: PublicPageLayoutProps) {
  const { settings } = useGlobalization();
  const isRtl = settings.locale.startsWith("ar");

  return (
    <div className="min-h-screen bg-slate-50" dir={isRtl ? "rtl" : "ltr"}>
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/">
                <span className="inline-flex items-center" aria-label="Builder.Contractors home">
                  <BrandLogo size="md" alt="Builder.Contractors home" />
                </span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <CountrySelector className="w-48" />
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <header className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">{title}</h1>
          {subtitle ? <p className="text-lg text-slate-600 max-w-3xl mx-auto">{subtitle}</p> : null}
        </header>
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <BrandLogo size="sm" className="mr-2" alt="Builder.Contractors" />
              <span className="text-white font-bold">Builder.Contractors</span>
            </div>
            <div className="text-sm">
              © 2025 Builder.Contractors. Connecting builders worldwide. Powered by{" "}
              <a
                href="https://elyment.com.au"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline transition-colors"
              >
                Elyment
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
