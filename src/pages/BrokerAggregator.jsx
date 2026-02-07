import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const BrokerAggregator = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [selectedBroker, setSelectedBroker] = useState('IBKR');
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPosition, setEditingPosition] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const brokers = ['IBKR', 'Degiro', 'Revolut', 'Trade Republic'];

  useEffect(() => {
    if (user) {
      loadPositions();
    }
  }, [selectedBroker, user]);

  const loadPositions = async () => {
    try {
      setLoading(true);

      // Get portfolio
      const { data: portfolios } = await supabase
        .from('portfolios')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!portfolios || portfolios.length === 0) {
        setPositions([]);
        return;
      }

      // Get broker
      const { data: broker } = await supabase
        .from('brokers')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', selectedBroker)
        .maybeSingle();

      if (!broker) {
        // Create broker if it doesn't exist
        const { error } = await supabase
          .from('brokers')
          .insert([{ user_id: user.id, name: selectedBroker }]);
        
        if (error) {
          console.error("Failed to create broker:", error);
          // Don't crash, just show empty
          setPositions([]);
          return;
        }
        // If created successfully, positions are empty anyway
        setPositions([]);
        return;
      }

      // Get positions
      const { data: positionsData } = await supabase
        .from('positions')
        .select(`
          *,
          assets (*)
        `)
        .eq('portfolio_id', portfolios[0].id)
        .eq('broker_id', broker.id);

      setPositions((positionsData || []).filter(p => p !== null));
    } catch (error) {
      console.error('Error loading positions:', error);
      toast({
        title: "Error loading positions",
        description: error.message,
        variant: "destructive",
      });
      setPositions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPosition = () => {
    setIsAddDialogOpen(true);
  };

  const handleDeletePosition = async (positionId) => {
    try {
      const { error } = await supabase
        .from('positions')
        .delete()
        .eq('id', positionId);

      if (error) throw error;

      toast({
        title: "Position deleted",
        description: "The position has been removed from your portfolio.",
      });

      loadPositions();
    } catch (error) {
      toast({
        title: "Error deleting position",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const calculatePositionValue = (position) => {
    const currentPrice = position.assets?.current_price || position.entry_price;
    return position.quantity * currentPrice;
  };

  const calculateTotalValue = () => {
    return positions.reduce((sum, pos) => sum + calculatePositionValue(pos), 0);
  };

  const calculatePositionPercentage = (position) => {
    const total = calculateTotalValue();
    return total > 0 ? (calculatePositionValue(position) / total) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Broker Aggregator - WealthFlow</title>
        <meta name="description" content="Manage positions across multiple brokers" />
      </Helmet>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Broker Aggregator</h1>
        <Button onClick={handleAddPosition} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Position
        </Button>
      </div>

      {/* Broker Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        {brokers.map((broker) => (
          <button
            key={broker}
            onClick={() => setSelectedBroker(broker)}
            className={`px-6 py-3 font-medium transition ${
              selectedBroker === broker
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {broker}
          </button>
        ))}
      </div>

      {/* Positions Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Ticker</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Company</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Quantity</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Entry Price</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Current Price</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Position Value</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">% of Portfolio</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : positions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No positions found. Click "Add Position" to get started.
                  </td>
                </tr>
              ) : (
                positions.map((position) => {
                  if (!position) return null;
                  const currentPrice = position.assets?.current_price || position.entry_price;
                  const positionValue = calculatePositionValue(position);
                  const percentage = calculatePositionPercentage(position);
                  const pnl = ((currentPrice - position.entry_price) / position.entry_price) * 100;

                  return (
                    <tr key={position.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-900 dark:text-white">
                          {position.assets?.ticker}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                        {position.assets?.company_name}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-900 dark:text-white">
                        {position.quantity.toFixed(4)}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-700 dark:text-slate-300">
                        ${position.entry_price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${currentPrice.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                        ${positionValue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-700 dark:text-slate-300">
                        {percentage.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingPosition(position)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeletePosition(position.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {positions.length > 0 && (
        <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 flex items-center justify-between">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Total Portfolio Value</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            ${calculateTotalValue().toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
};

export default BrokerAggregator;