import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { TrendingUp, Shield, BarChart3, Zap, CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

const LandingPage = () => {
  const { user } = useSupabaseAuth();

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Helmet>
        <title>WealthFlow - Intelligent Portfolio Management</title>
        <meta name="description" content="Manage your wealth with professional-grade tools, real-time alerts, and comprehensive analysis." />
      </Helmet>

      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-50 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">WealthFlow</span>
           </div>
           <div className="flex gap-4">
              <Link to="/auth">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/auth">
                <Button>Get Started</Button>
              </Link>
           </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 text-center">
         <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white tracking-tight">
               Master your wealth with <span className="text-blue-600">precision</span>.
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
               Professional-grade portfolio tracking, real-time market data, and intelligent health alerts—all in one place.
            </p>
            <div className="flex justify-center gap-4 pt-4">
               <Link to="/auth">
                  <Button size="lg" className="h-12 px-8 text-lg rounded-full">Start Free Trial <ArrowRight className="ml-2 w-5 h-5"/></Button>
               </Link>
               <Link to="#features">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-lg rounded-full">Learn More</Button>
               </Link>
            </div>
         </div>
         
         <div className="mt-16 max-w-6xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-2 md:p-4">
            <div className="aspect-[16/9] bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden relative">
               <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                  <span className="text-sm">Platform Preview Image</span>
                  {/* In a real app, an <img> would go here */}
               </div>
               <img alt="Dashboard Preview" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1686061594225-3e92c0cd51b0" />
            </div>
         </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-white dark:bg-slate-800">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Everything you need to grow</h2>
               <p className="text-slate-600 dark:text-slate-400">Powerful features designed for the modern investor.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 mb-6">
                     <BarChart3 className="w-6 h-6"/>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Portfolio Analysis</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                     Deep dive into your asset allocation with intuitive visualizations and treemaps.
                  </p>
               </div>
               <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 mb-6">
                     <Shield className="w-6 h-6"/>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Health Checks</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                     Automated alerts for portfolio diversification, cash drag, and concentration risks.
                  </p>
               </div>
               <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-600 mb-6">
                     <Zap className="w-6 h-6"/>
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Real-time Alerts</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                     Set custom price targets and get notified instantly when markets move.
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* Pricing Simple */}
      <section className="py-20 px-6">
         <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Simple, transparent pricing</h2>
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-blue-100 dark:border-slate-700 relative overflow-hidden">
               <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">BETA</div>
               <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Pro Access</h3>
               <div className="my-6">
                  <span className="text-5xl font-bold text-slate-900 dark:text-white">$0</span>
                  <span className="text-slate-500">/month</span>
               </div>
               <p className="text-slate-600 dark:text-slate-400 mb-8">Currently free during our public beta period.</p>
               <ul className="space-y-4 mb-8 text-left max-w-xs mx-auto">
                  <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300"><CheckCircle className="w-5 h-5 text-green-500"/> Unlimited Watchlists</li>
                  <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300"><CheckCircle className="w-5 h-5 text-green-500"/> Real-time Data</li>
                  <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300"><CheckCircle className="w-5 h-5 text-green-500"/> Portfolio Health Score</li>
                  <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300"><CheckCircle className="w-5 h-5 text-green-500"/> Advanced Charting</li>
               </ul>
               <Link to="/auth">
                  <Button size="lg" className="w-full">Start for Free</Button>
               </Link>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 px-6">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
               <div className="bg-blue-600 p-1.5 rounded-md">
                 <TrendingUp className="w-4 h-4 text-white" />
               </div>
               <span className="font-bold text-slate-900 dark:text-white">WealthFlow</span>
            </div>
            <p className="text-slate-500 text-sm">© 2024 WealthFlow. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-slate-600 dark:text-slate-400">
               <Link to="#" className="hover:text-blue-600">Privacy</Link>
               <Link to="#" className="hover:text-blue-600">Terms</Link>
               <Link to="#" className="hover:text-blue-600">Contact</Link>
            </div>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;