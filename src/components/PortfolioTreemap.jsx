import React from 'react';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';

const CustomTreemapContent = (props) => {
  const { x, y, width, height, name, change } = props;

  // Determine color based on change (Green for positive, Red for negative)
  const fillColor = change >= 0 ? '#22c55e' : '#ef4444';

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: fillColor,
          stroke: '#fff',
          strokeWidth: 2,
          opacity: 0.9,
        }}
      />
      {width > 40 && height > 30 ? (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="#fff"
          fontSize={Math.min(width / 5, height / 3, 16)}
          style={{ pointerEvents: 'none' }}
        >
          <tspan x={x + width / 2} dy="-0.6em" fontWeight="bold">
            {name}
          </tspan>
          <tspan x={x + width / 2} dy="1.2em" fontSize="0.85em">
            {change > 0 ? '+' : ''}{change?.toFixed(2)}%
          </tspan>
        </text>
      ) : null}
    </g>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 shadow-lg rounded-lg">
        <p className="font-bold text-slate-900 dark:text-white">{data.name}</p>
        <p className={data.change >= 0 ? 'text-green-600' : 'text-red-600'}>
          Daily Change: {data.change > 0 ? '+' : ''}{data.change?.toFixed(2)}%
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Magnitude: {data.size.toFixed(2)} (Chart Size)
        </p>
      </div>
    );
  }
  return null;
};

const PortfolioTreemap = ({ data }) => {
  const validData = data.filter(d => d.size > 0);

  const chartData = [
    {
      name: 'Portfolio',
      children: validData
    }
  ];

  if (validData.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
        <p className="text-slate-500">Not enough data to display Treemap</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 h-[500px]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Wallet Map</h2>
        <div className="flex gap-4 text-xs font-medium">
           <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-sm"></div> Positive</div>
           <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Negative</div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="90%">
        <Treemap
          data={chartData}
          dataKey="size"
          stroke="#fff"
          fill="#8884d8"
          content={<CustomTreemapContent />}
          isAnimationActive={false}
        >
          <Tooltip content={<CustomTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
};

export default PortfolioTreemap;