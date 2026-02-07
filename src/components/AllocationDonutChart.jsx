import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const AllocationDonutChart = ({ positions }) => {
  const chartData = useMemo(() => {
    const sectorMap = new Map();
    let total = 0;

    positions.forEach(pos => {
      const value = pos.quantity * (pos.assets?.current_price || pos.entry_price);
      const sector = pos.assets?.sector || 'Other';
      total += value;
      sectorMap.set(sector, (sectorMap.get(sector) || 0) + value);
    });

    const data = Array.from(sectorMap.entries()).map(([sector, value]) => ({
      sector,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
      target: 0
    }));

    return data.sort((a, b) => b.value - a.value);
  }, [positions]);

  const colors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
    '#06b6d4', '#6366f1', '#f97316', '#14b8a6', '#a855f7'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"
    >
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Real vs Target Allocation</h2>
      
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-64 h-64">
          <svg viewBox="0 0 200 200" className="transform -rotate-90">
            {chartData.map((item, index) => {
              const startAngle = chartData
                .slice(0, index)
                .reduce((sum, d) => sum + (d.percentage / 100) * 360, 0);
              const endAngle = startAngle + (item.percentage / 100) * 360;
              const largeArc = item.percentage > 50 ? 1 : 0;

              const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
              const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
              const x2 = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
              const y2 = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);

              return (
                <path
                  key={item.sector}
                  d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={colors[index % colors.length]}
                  className="transition-all hover:opacity-80"
                />
              );
            })}
            <circle cx="100" cy="100" r="50" fill="white" className="dark:fill-slate-800" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {chartData.length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Sectors</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {chartData.map((item, index) => (
          <div key={item.sector} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {item.sector}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {item.percentage.toFixed(1)}%
              </span>
              {item.target > 0 && (
                <span className="text-xs text-slate-500 dark:text-slate-500">
                  Target: {item.target}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default AllocationDonutChart;