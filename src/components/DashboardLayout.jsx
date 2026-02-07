import React, { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Wallet, 
  Settings, 
  LogOut, 
  Moon, 
  Sun,
  Menu,
  X,
  TrendingUp,
  Star,
  Bell,
  Search,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { eodhdService } from '@/services/eodhd';
import GlobalSearchOverlay from './GlobalSearchOverlay';

const DashboardLayout = () => {
  const { user, signOut } = useSupabaseAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [overlayTicker, setOverlayTicker] = useState(null);

  useEffect(() => {
    if (user) {
      const loadPreferences = async () => {
        const { data } = await supabase
          .from('user_preferences')
          .select('dark_mode')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data) {
          setDarkMode(data.dark_mode);
          if (data.dark_mode) document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
        }
      };

      const checkNotifications = async () => {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
        setUnreadCount(count || 0);
      };

      loadPreferences();
      checkNotifications();
    }
  }, [user]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length > 1) {
        setIsSearching(true);
        const apiKey = await eodhdService.getApiKey(user?.id);
        if (apiKey) {
           const results = await eodhdService.searchTickers(searchTerm, apiKey);
           setSearchResults(results.slice(0, 5));
        }
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, user]);

  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    if (user) {
      await supabase.from('user_preferences').upsert({ user_id: user.id, dark_mode: newMode }, { onConflict: 'user_id' });
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/app' },
    { icon: Wallet, label: 'Portfolio', path: '/app/cartera' },
    { icon: Star, label: 'Favorites', path: '/app/favoritos' },
    { icon: Bell, label: 'Notifications', path: '/app/notificaciones', badge: unreadCount },
    { icon: Settings, label: 'Settings', path: '/app/settings' },
  ];

  const handleSelectSearchResult = (symbol) => {
    setOverlayTicker(symbol);
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      {overlayTicker && (
         <GlobalSearchOverlay ticker={overlayTicker} onClose={() => setOverlayTicker(null)} userId={user?.id} />
      )}
      
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
        <aside className="hidden lg:flex flex-col w-64 h-full shrink-0 z-30 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
           <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">WealthFlow</span>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/app'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition relative ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.badge > 0 && (
                  <span className="absolute right-3 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
            <Button variant="outline" className="w-full justify-start gap-3" onClick={toggleDarkMode}>
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span>{darkMode ? 'Light' : 'Dark'}</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-red-600" onClick={() => signOut()}>
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </Button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
          <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 lg:hidden">
                <button onClick={() => setSidebarOpen(true)} className="p-2">
                   <Menu className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                </button>
                <span className="font-bold text-lg text-slate-900 dark:text-white lg:hidden">WealthFlow</span>
              </div>
              
              <div className="flex-1 max-w-xl relative">
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input 
                     className="w-full pl-10 pr-4 py-2 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400"
                     placeholder="Search stocks, crypto, ETFs..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                   />
                   {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />}
                 </div>
                 
                 {searchResults.length > 0 && (
                   <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                     {searchResults.map((r) => (
                       <button 
                         key={r.symbol} 
                         onClick={() => handleSelectSearchResult(r.symbol)} 
                         className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 border-b last:border-0 border-slate-100 dark:border-slate-700 transition-colors"
                       >
                         <div className="flex justify-between items-center">
                           <span className="font-bold text-sm text-slate-900 dark:text-white">{r.displaySymbol}</span>
                           <span className="text-xs text-slate-500 uppercase">{r.type}</span>
                         </div>
                         <div className="text-xs text-slate-600 dark:text-slate-400 truncate">{r.description}</div>
                       </button>
                     ))}
                   </div>
                 )}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
            <Outlet />
          </main>
        </div>
        
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
              <motion.div initial={{x:'-100%'}} animate={{x:0}} exit={{x:'-100%'}} className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 h-full lg:hidden p-4">
                 <div className="flex justify-between items-center mb-6">
                    <span className="font-bold text-xl text-slate-900 dark:text-white">Menu</span>
                    <button onClick={() => setSidebarOpen(false)} className="text-slate-500"><X className="w-6 h-6" /></button>
                 </div>
                 <nav className="space-y-2">
                    {navItems.map((item) => (
                      <NavLink key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">
                         <item.icon className="w-5 h-5" /> <span>{item.label}</span>
                      </NavLink>
                    ))}
                 </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DashboardLayout;