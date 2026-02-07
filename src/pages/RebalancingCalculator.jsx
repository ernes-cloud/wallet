import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const RebalancingCalculator = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPositions();
  }, [user]);

  const loadPositions = async () => {
    try {
      setLoading(true);

      const { data: portfolios } = await supabase
        .from('portfolios')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!portfolios || portfolios.length === 0) return;

      const { data: positionsData } = await supabase
        .from('positions')
        .select(`
          *,
          assets (*)
        `)
        .eq('portfolio_id', portfolios[0].id);

      setPositions(positionsData || []);
    } catch (error) {
      console.error('Error loading positions:', error);
      toast({
        title: "Error loading positions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalValue = () => {
    return positions.reduce((sum, pos) => {
      const currentPrice = pos.assets?.current_price || pos.entry_price;
      return sum + (pos.quantity * currentPrice);
    }, 0);
  };

  const getRebalanceRecommendations = () => {
    const totalValue = calculateTotalValue();
    
    return positions.map(pos => {
      const currentPrice = pos.assets?.current_price || pos.entry_price;
      const currentValue = pos.quantity * currentPrice;
      const currentPercentage = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
      const targetPercentage = pos.target_percentage || 0;
      
      const difference = currentPercentage - targetPercentage;
      const targetValue = (targetPercentage / 100) * totalValue;
      const valueDifference = currentValue - targetValue;
      const quantityToTrade = Math.abs(valueDifference / currentPrice);

      let action = 'HOLD';
      if (targetPercentage > 0) {
        if (difference < -1) action = 'BUY';
        else if (difference > 1) action = 'SELL';
      }

      return {
        ...pos,
        currentPercentage,
        targetPercentage,
        difference,
        action,
        quantityToTrade
      };
    }).filter(pos => pos.target_percentage > 0);
  };

  const recommendations = getRebalanceRecommendations();

  const getActionButton = (recommendation) => {
    if (recommendation.action === 'BUY') {
      return (
        <Button
          className="bg-green-600 hover:bg-green-700 text-white gap-2"
          onClick={() => toast({
            title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
          })}
        >
          <TrendingUp className="w-4 h-4" />
          BUY {recommendation.quantityToTrade.toFixed(2)}
        </Button>
      );
    } else if (recommendation.action === 'SELL') {
      return (
        <Button
          className="bg-red-600 hover:bg-red-700 text-white gap-2"
          onClick={() => toast({
            title: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀"
          })}
        >
          <TrendingDown className="w-4 h-4" />
          SELL {recommendation.quantityToTrade.toFixed(2)}
        </Button>
      );
    } else {
      return (
        <Button
          variant="outline"
          className="text-slate-600 gap-2"
          disabled
        >
          <Minus className="w-4 h-4" />
          HOLD
        </Button>
      );
    }
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Rebalancing Calculator - WealthFlow</title>
        <meta name="description" content="Smart portfolio rebalancing recommendations" />
      </Helmet>

      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Rebalancing Calculator</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Get intelligent buy/sell recommendations based on your target allocation</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : recommendations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center"
        >
          <p className="text-slate-600 dark:text-slate-400">
            No rebalancing recommendations available. Set target percentages for your positions to get started.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Asset</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Current %</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Target %</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Difference</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {recommendations.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {rec.assets?.ticker}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {rec.assets?.company_name}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium text-slate-900 dark:text-white">
                        {rec.currentPercentage.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-slate-700 dark:text-slate-300">
                        {rec.targetPercentage.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-medium ${
                        rec.difference > 1 ? 'text-red-600' : 
                        rec.difference < -1 ? 'text-green-600' : 
                        'text-slate-600'
                      }`}>
                        {rec.difference > 0 ? '+' : ''}{rec.difference.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center justify-center w-24 h-10 rounded-full font-semibold ${
                        rec.action === 'BUY' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                        rec.action === 'SELL' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}>
                        {rec.action}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {getActionButton(rec)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RebalancingCalculator;