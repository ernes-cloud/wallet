import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Newspaper, Activity, AlertCircle, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { eodhdService } from '@/services/eodhd';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const GlobalSearchOverlay = ({ ticker, onClose, userId }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    quote: null,
    profile: null,
    news: [],
    financials: null,
    chart: []
  });
  const [chartPeriod, setChartPeriod] = useState('1M');

  useEffect(() => {
    if (ticker && userId) {
      loadAllData();
    }
  }, [ticker, userId]);

  useEffect(() => {
    if (ticker && userId && !loading) {
       loadChartData(chartPeriod);
    }
  }, [chartPeriod]);

  const loadAllData = async () => {
    setLoading(true);
    const apiKey = await eodhdService.getApiKey(userId);
    if (!apiKey) {
      toast({ title: "API Key missing", description: "Please add your EODHD API Key in Settings.", variant: "destructive" });
      setLoading(false);
      return;
    }

    try {
      const [quote, fundamentalData, news] = await Promise.all([
        eodhdService.getQuote(ticker, apiKey),
        eodhdService.getFundamentalData(ticker, apiKey),
        eodhdService.getNews(ticker, apiKey)
      ]);

      setData(prev => ({ 
        ...prev, 
        quote, 
        profile: fundamentalData?.profile || null,
        financials: fundamentalData || null,
        news: news || []
      }));
      
      // Initial chart load
      await loadChartData('1M', apiKey);
      
    } catch (e) {
      console.error(e);
      toast({ title: "Error fetching data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async (period, providedApiKey) => {
    let apiKey = providedApiKey;
    if (!apiKey) apiKey = await eodhdService.getApiKey(userId);

    const candles = await eodhdService.getHistoricalData(ticker, period, apiKey);
    setData(prev => ({ ...prev, chart: Array.isArray(candles) ? candles : [] }));
  };

  const addToFavorites = async () => {
    try {
      let { data: wl } = await supabase.from('watchlists').select('id').eq('user_id', userId).limit(1).maybeSingle();
      if (!wl) {
        const { data: newWl } = await supabase.from('watchlists').insert({ user_id: userId, name: 'My Watchlist' }).select().single();
        wl = newWl;
      }
      await supabase.from('watchlist_items').insert({ watchlist_id: wl.id, ticker: ticker });
      toast({ title: `${ticker} added to favorites` });
    } catch (e) {
      toast({ title: "Already in favorites", variant: "destructive" });
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900 overflow-y-auto"
      >
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
          {/* Header */}
          <div className="flex justify-between items-start">
             <div>
                <Button variant="ghost" onClick={onClose} className="mb-2 pl-0 hover:pl-2 transition-all">← Back</Button>
                <div className="flex items-center gap-4">
                  <h1 className="text-4xl font-bold text-slate-900 dark:text-white">{ticker}</h1>
                  {data.quote && (
                    <div className={`text-2xl font-semibold ${data.quote.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${data.quote.current?.toFixed(2)} 
                      <span className="text-lg ml-2">({data.quote.percentChange?.toFixed(2)}%)</span>
                    </div>
                  )}
                </div>
                <p className="text-xl text-slate-500">{data.profile?.name}</p>
             </div>
             <div className="flex gap-2">
                <Button onClick={addToFavorites} className="gap-2"><Plus className="w-4 h-4"/> Add to Favorites</Button>
                <Button variant="outline" size="icon" onClick={onClose}><X className="w-5 h-5"/></Button>
             </div>
          </div>

          {loading ? (
            <div className="h-96 flex items-center justify-center">
               <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* Chart Section */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                   {['1D', '1W', '1M', '3M', '6M', '1Y'].map(p => (
                      <button 
                        key={p} 
                        onClick={() => setChartPeriod(p)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          chartPeriod === p 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                   ))}
                </div>
                <div className="h-[400px] w-full">
                  {data.chart && data.chart.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.chart}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="time" 
                          hide={false} 
                          tick={{ fontSize: 12, fill: '#94a3b8' }}
                          tickLine={false}
                          axisLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          domain={['auto', 'auto']} 
                          hide={false} 
                          orientation="right"
                          tick={{ fontSize: 12, fill: '#94a3b8' }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                          itemStyle={{ color: '#fff' }}
                          labelStyle={{ color: '#94a3b8' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="close" 
                          stroke="#3b82f6" 
                          strokeWidth={2} 
                          fillOpacity={1} 
                          fill="url(#colorPrice)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                      No chart data available for this period.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Key Metrics */}
                 <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                       <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white"><Activity className="w-5 h-5 text-blue-500"/> Key Metrics</h3>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                            <div className="text-xs text-slate-500 uppercase">Market Cap</div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {data.profile?.marketCapitalization ? `$${(data.profile.marketCapitalization/1000000000).toFixed(2)}B` : '-'}
                            </div>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                            <div className="text-xs text-slate-500 uppercase">P/E Ratio</div>
                            <div className="font-semibold text-slate-900 dark:text-white">{data.financials?.metric?.peTTM?.toFixed(2) || '-'}</div>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                            <div className="text-xs text-slate-500 uppercase">Div Yield</div>
                            <div className="font-semibold text-slate-900 dark:text-white">{data.financials?.metric?.dividendYieldIndicatedAnnual?.toFixed(2) || '0'}%</div>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                            <div className="text-xs text-slate-500 uppercase">52W High</div>
                            <div className="font-semibold text-green-600">${data.financials?.metric?.['52WeekHigh']?.toFixed(2) || '-'}</div>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                            <div className="text-xs text-slate-500 uppercase">52W Low</div>
                            <div className="font-semibold text-red-600">${data.financials?.metric?.['52WeekLow']?.toFixed(2) || '-'}</div>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                            <div className="text-xs text-slate-500 uppercase">Beta</div>
                            <div className="font-semibold text-slate-900 dark:text-white">{data.financials?.metric?.beta?.toFixed(2) || '-'}</div>
                          </div>
                       </div>
                    </div>

                    {/* News Feed */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                       <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white"><Newspaper className="w-5 h-5 text-purple-500"/> Recent News</h3>
                       <div className="space-y-4">
                          {data.news.slice(0, 5).map((item, idx) => (
                             <a href={item.url} target="_blank" rel="noopener noreferrer" key={idx} className="block p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-100 dark:border-slate-700/50">
                                <div className="flex gap-4">
                                   {item.image && <img src={item.image} alt="" className="w-20 h-20 object-cover rounded-lg shrink-0"/>}
                                   <div>
                                      <h4 className="font-bold text-sm md:text-base line-clamp-2 mb-1 text-slate-900 dark:text-white">{item.headline}</h4>
                                      <p className="text-xs text-slate-500">{item.source} • {new Date(item.datetime * 1000).toLocaleDateString()}</p>
                                      <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-2">{item.summary}</p>
                                   </div>
                                </div>
                             </a>
                          ))}
                          {data.news.length === 0 && <p className="text-slate-500">No recent news available.</p>}
                       </div>
                    </div>
                 </div>

                 {/* Sidebar Info */}
                 <div className="space-y-6">
                    {/* Profile Summary */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                       <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">About</h3>
                       <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                          <div><span className="text-slate-500">Industry:</span> <span className="font-medium ml-2">{data.profile?.industry || '-'}</span></div>
                          <div><span className="text-slate-500">Sector:</span> <span className="font-medium ml-2">{data.profile?.sector || '-'}</span></div>
                          <div><span className="text-slate-500">Exchange:</span> <span className="font-medium ml-2">{data.profile?.exchange || '-'}</span></div>
                          <div><span className="text-slate-500">IPO:</span> <span className="font-medium ml-2">{data.profile?.ipo || '-'}</span></div>
                          {data.profile?.weburl && (
                            <div><span className="text-slate-500">Website:</span> <a href={data.profile.weburl} target="_blank" rel="noreferrer" className="text-blue-600 ml-2 hover:underline truncate block">{data.profile.weburl}</a></div>
                          )}
                       </div>
                    </div>

                    {data.profile?.description && (
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                         <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Description</h3>
                         <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{data.profile.description}</p>
                      </div>
                    )}
                 </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GlobalSearchOverlay;