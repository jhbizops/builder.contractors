import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Users, Handshake, TrendingUp, Globe, Shield, Zap, CheckCircle2, Building2, Hammer, Share2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-primary mr-2" />
              <h1 className="text-2xl font-bold text-slate-900">Builder.Contractors</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" data-testid="button-login">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button data-testid="button-register">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full mb-6">
              <Globe className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm font-medium text-blue-700">Connecting Builders Worldwide</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight" data-testid="text-hero-title">
              Exchange Leads.<br />
              <span className="text-primary">Grow Together.</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto" data-testid="text-hero-subtitle">
              Join the global network of builders and contractors sharing projects, exchanging work opportunities, and supporting each other's growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 py-6" data-testid="button-hero-signup">
                  Start Exchanging Projects
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6" data-testid="button-hero-login">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Simple, powerful tools to connect with builders and contractors globally
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary transition-colors" data-testid="card-feature-share">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Share2 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Share Leads</h3>
                <p className="text-slate-600">
                  Got a project outside your area or expertise? Share it with builders who can take it on. Help each other grow.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors" data-testid="card-feature-exchange">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Handshake className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Exchange Work</h3>
                <p className="text-slate-600">
                  Find contractors in different locations who can handle overflow work or specialized projects you can't service.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors" data-testid="card-feature-grow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Grow Together</h3>
                <p className="text-slate-600">
                  Build relationships with trusted contractors worldwide. Get referrals, support, and expand your business network.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">
                Why Builders Choose Builder.Contractors
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Never Lose a Lead Again</h4>
                    <p className="text-slate-600">Share projects you can't take on and help fellow builders succeed</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Expand Your Reach</h4>
                    <p className="text-slate-600">Connect with contractors in new markets and regions you don't serve</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Build Trust & Reputation</h4>
                    <p className="text-slate-600">Create lasting partnerships with verified builders and contractors</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle2 className="h-6 w-6 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-1">Manage Everything in One Place</h4>
                    <p className="text-slate-600">Track leads, communicate with partners, and share files seamlessly</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="pt-6">
                  <Users className="h-10 w-10 mb-3 opacity-90" />
                  <div className="text-3xl font-bold mb-1">Global</div>
                  <p className="text-blue-100">Network</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="pt-6">
                  <Shield className="h-10 w-10 mb-3 opacity-90" />
                  <div className="text-3xl font-bold mb-1">Secure</div>
                  <p className="text-green-100">Platform</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="pt-6">
                  <Zap className="h-10 w-10 mb-3 opacity-90" />
                  <div className="text-3xl font-bold mb-1">Fast</div>
                  <p className="text-purple-100">Setup</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardContent className="pt-6">
                  <Hammer className="h-10 w-10 mb-3 opacity-90" />
                  <div className="text-3xl font-bold mb-1">Built</div>
                  <p className="text-orange-100">For Trades</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6" data-testid="text-cta-title">
            Ready to Start Exchanging Projects?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of builders and contractors worldwide who are growing their business together
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6" data-testid="button-cta-signup">
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Building2 className="h-6 w-6 text-primary mr-2" />
              <span className="text-white font-bold">Builder.Contractors</span>
            </div>
            <div className="text-sm">
              © 2024 Builder.Contractors. Connecting builders worldwide.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
