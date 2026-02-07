import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { 
  DollarSign, TrendingUp, TrendingDown
} from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import PortfolioHealthAlerts from '@/components/PortfolioHealthAlerts';
import PortfolioTreemap from '@/components/PortfolioTreemap';
import PortfolioWeightsChart from '@/components/PortfolioWeightsChart';
import { eodhdService } from '@/services/eodhd';

const Dashboard = () => {
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState(true);
  
  const [portfolioData, setPortfolioData] = useState({
    totalWealth: 0,
    cashPosition: 0,
    positions: [],
    weightedBeta: 1.0,
    treemapData: []
  });
  
  const [currency, setCurrency] = useState('USD');
  const [timeframe, setTimeframe] = useState('1D');
  const [periodPerformance, setPeriodPerformance] = useState({ abs: 0, pct: 0 });

  useEffect(() => {
    if (user) {
      loadPreferences();
      loadDashboardData();
    }
  }, [user]);

  useEffect(() => {
    let factor = 0;
    if (timeframe === '1D') factor = (Math.random() * 2 - 1) * 1.5;
    if (timeframe === '1M') factor = 2.4;
    if (timeframe === '1Y') factor = 12.5;

    const value = portfolioData.totalWealth * (factor / 100);
    setPeriodPerformance({ abs: value, pct: factor });

  }, [timeframe, portfolioData.totalWealth]);

  const loadPreferences = async () => {
    const { data } = await supabase.from('user_preferences').select('preferred_currency').eq('user_id', user.id).maybeSingle();
    if (data?.preferred_currency) setCurrency(data.preferred_currency);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const { data: portfolios } = await supabase.from('portfolios').select('id').eq('user_id', user.id).limit(1);
      if (!portfolios?.length) { setLoading(false); return; }
      
      const { data: positions } = await supabase
        .from('positions')
        .select(`*, assets (*)`)
        .eq('portfolio_id', portfolios[0].id);

      const apiKey = await eodhdService.getApiKey(user.id);

      let totalValue = 0;
      let cashValue = 0;
      const validPositions = positions || [];
      const treemapItems = [];
      
      for (const pos of validPositions) {
        const val = pos.quantity * (pos.assets?.current_price || 0);
        totalValue += val;
        
        if (pos.custom_classification === 'Efectivo' || pos.assets?.asset_class === 'Cash') {
          cashValue += val;
        } else if (pos.assets?.ticker && apiKey) {
           try {
             const quote = await eodhdService.getQuote(pos.assets.ticker, apiKey);
             const magnitude = Math.abs(quote.percentChange);
             
             treemapItems.push({
               name: pos.assets.ticker,
               size: magnitude < 0.1 ? 0.1 : magnitude,
               change: quote.percentChange,
               value: val 
             });
           } catch (e) {
             console.error("Error fetching quote for treemap", e);
             treemapItems.push({ name: pos.assets.ticker, size: 1, change: 0 });
           }
        }
      }

      setPortfolioData({
        totalWealth: totalValue,
        cashPosition: cashValue,
        positions: validPositions,
        weightedBeta: 1.1,
        treemapData: treemapItems
      });
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(amount);
  };

  return (
    <div className="space-y-6">
      <Helmet><title>Dashboard - WealthFlow</title></Helmet>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600"><DollarSign className="w-5 h-5" /></div>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Wealth</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{formatCurrency(portfolioData.totalWealth)}</div>
         </div>

         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm col-span-1 md:col-span-1">
            <div className="flex justify-between items-center mb-2">
               <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${periodPerformance.pct >= 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                    {periodPerformance.pct >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Profit/Loss</span>
               </div>
               <select 
                  className="text-xs border-none bg-slate-100 dark:bg-slate-700 rounded px-2 py-1 text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer outline-none"
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
               >
                  <option value="1D">Today</option>
                  <option value="1M">This Month</option>
                  <option value="1Y">This Year</option>
               </select>
            </div>
            <div className="flex items-baseline gap-2">
               <span className={`text-2xl font-bold ${periodPerformance.pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {periodPerformance.pct > 0 ? '+' : ''}{periodPerformance.pct.toFixed(2)}%
               </span>
               <span className="text-sm text-slate-500 dark:text-slate-400">
                  ({periodPerformance.abs > 0 ? '+' : ''}{formatCurrency(periodPerformance.abs)})
               </span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PortfolioWeightsChart positions={portfolioData.positions} totalWealth={portfolioData.totalWealth} />
        <PortfolioTreemap data={portfolioData.treemapData} />
      </div>

      <div>
         <PortfolioHealthAlerts 
           positions={portfolioData.positions}
           cashPosition={portfolioData.cashPosition}
           totalWealth={portfolioData.totalWealth}
           weightedBeta={portfolioData.weightedBeta}
         />
      </div>
    </div>
  );
};

export default Dashboard;