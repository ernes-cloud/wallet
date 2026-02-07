import React from 'react';
import { motion } from 'framer-motion';

const PortfolioWeightsChart = ({ positions, totalWealth }) => {
  // Sort positions by value descending
  const sortedPositions = [...positions]
    .map(p => {
      const value = p.quantity * (p.assets?.current_price || p.entry_price || 0);
      const name = p.assets?.company_name || p.assets?.ticker || 'Unknown';
      const weight = totalWealth > 0 ? (value / totalWealth) * 100 : 0;
      return { name, weight, ticker: p.assets?.ticker };
    })
    .sort((a, b) => b.weight - a.weight);

  // Take top 10 for display or all if list is short
  const displayPositions = sortedPositions;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
    >
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 text-center">Positions ordered by portfolio weight %</h2>
      
      <div className="space-y-4">
        {displayPositions.map((item, index) => (
          <div key={index} className="flex items-center gap-4">
             {/* Label */}
             <div className="w-1/3 text-right text-sm font-medium text-slate-700 dark:text-slate-300 truncate" title={item.name}>
                {item.name}
             </div>
             
             {/* Bar container */}
             <div className="flex-1 flex items-center gap-3">
                <div className="h-4 bg-blue-500 rounded-r-full" style={{ width: `${Math.max(item.weight, 1)}%`, transition: 'width 1s ease-in-out' }}></div>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{item.weight.toFixed(0)}%</span>
             </div>
          </div>
        ))}

        {/* X Axis scale roughly */}
        <div className="flex items-center gap-4 mt-2">
           <div className="w-1/3"></div>
           <div className="flex-1 flex justify-between text-xs text-slate-400 px-1">
              <span>0%</span>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PortfolioWeightsChart;