import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

const PortfolioHealthAlerts = ({ positions, totalWealth }) => {
  const alerts = [];
  const warnings = [];
  const goods = [];

  // 1. Min 10 Positions
  const posCount = positions.filter(p => p.custom_classification !== 'Efectivo').length;
  if (posCount < 10) {
    warnings.push(`Diversification low: Only ${posCount} positions (Target: >10)`);
  } else {
    goods.push(`Good diversification: ${posCount} positions`);
  }

  // 2. Weight Distributions
  let pilaresTotal = 0;
  let smallCapTotal = 0;
  let cashTotal = 0;
  let maxSingleWeight = 0;
  let maxSingleTicker = '';

  positions.forEach(p => {
    const val = p.quantity * (p.assets?.current_price || p.entry_price);
    const weight = totalWealth > 0 ? (val / totalWealth) * 100 : 0;
    
    if (weight > maxSingleWeight) {
      maxSingleWeight = weight;
      maxSingleTicker = p.assets?.ticker;
    }

    if (p.custom_classification === 'Pilares') pilaresTotal += weight;
    if (p.custom_classification === 'Micro/Small/Mid Caps') smallCapTotal += weight;
    if (p.custom_classification === 'Efectivo') cashTotal += weight;
  });

  // Check Single Weight
  if (maxSingleWeight > 15) {
    alerts.push(`Concentration Risk: ${maxSingleTicker} is ${maxSingleWeight.toFixed(1)}% of portfolio (>15%)`);
  }

  // Check Pilares
  if (pilaresTotal < 60) warnings.push(`Pilares weight low: ${pilaresTotal.toFixed(1)}% (Target: 70-80%)`);
  else if (pilaresTotal > 85) warnings.push(`Pilares weight high: ${pilaresTotal.toFixed(1)}%`);
  else goods.push(`Pilares weight healthy: ${pilaresTotal.toFixed(1)}%`);

  // Check Small Caps
  if (smallCapTotal > 10) alerts.push(`High risk in Small/Mid Caps: ${smallCapTotal.toFixed(1)}% (Max 10%)`);
  else goods.push(`Small/Mid Cap risk managed`);

  // Check Cash
  if (cashTotal < 5) warnings.push(`Low liquidity: ${cashTotal.toFixed(1)}% cash`);
  else if (cashTotal > 25) warnings.push(`High cash drag: ${cashTotal.toFixed(1)}%`);
  else goods.push(`Cash position healthy: ${cashTotal.toFixed(1)}%`);

  // 3. Losses Analysis
  const losers = positions.filter(p => {
    const current = p.quantity * (p.assets?.current_price || 0);
    const cost = p.quantity * p.entry_price;
    return current < cost && p.custom_classification !== 'Efectivo';
  }).map(p => {
    const current = p.quantity * (p.assets?.current_price || 0);
    const cost = p.quantity * p.entry_price;
    const pct = ((current - cost) / cost) * 100;
    return { ticker: p.assets?.ticker, pct };
  }).sort((a,b) => a.pct - b.pct).slice(0, 3);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Portfolio Health Analysis</h2>

      <div className="space-y-4">
        {alerts.map((msg, i) => (
           <div key={`alert-${i}`} className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 rounded-lg flex gap-3 items-start text-sm">
             <AlertCircle className="w-5 h-5 shrink-0" /> {msg}
           </div>
        ))}
        {warnings.map((msg, i) => (
           <div key={`warn-${i}`} className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-200 rounded-lg flex gap-3 items-start text-sm">
             <AlertTriangle className="w-5 h-5 shrink-0" /> {msg}
           </div>
        ))}
        {goods.length > 0 && (
           <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-200 rounded-lg flex gap-3 items-start text-sm">
             <CheckCircle className="w-5 h-5 shrink-0" />
             <div>
               <div className="font-semibold">Healthy Metrics</div>
               <div className="text-xs opacity-80 mt-1">{goods.length} checks passed</div>
             </div>
           </div>
        )}
      </div>

      {losers.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
           <h3 className="text-sm font-bold mb-3 text-slate-500 uppercase">Top Underperformers</h3>
           <div className="space-y-2">
             {losers.map(l => (
               <div key={l.ticker} className="flex justify-between text-sm">
                  <span className="font-medium">{l.ticker}</span>
                  <span className="text-red-600 font-bold">{l.pct.toFixed(2)}%</span>
               </div>
             ))}
           </div>
        </div>
      )}
    </motion.div>
  );
};

export default PortfolioHealthAlerts;