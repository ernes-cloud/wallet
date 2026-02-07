import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { ArrowRightLeft, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const CurrencyConverter = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [targetCurrency, setTargetCurrency] = useState('EUR');
  const [amount, setAmount] = useState(1000);
  const [convertedAmount, setConvertedAmount] = useState(0);
  const [rates, setRates] = useState([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [loading, setLoading] = useState(true);

  const currencies = ['USD', 'EUR', 'GBP', 'JPY'];

  useEffect(() => {
    loadData();
  }, [user, baseCurrency]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load currency rates
      const { data: ratesData } = await supabase
        .from('currency_rates')
        .select('*');

      setRates(ratesData || []);

      // Load portfolio value
      const { data: portfolios } = await supabase
        .from('portfolios')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (portfolios && portfolios.length > 0) {
        const { data: positions } = await supabase
          .from('positions')
          .select(`
            *,
            assets (*)
          `)
          .eq('portfolio_id', portfolios[0].id);

        let total = 0;
        positions?.forEach(pos => {
          const currentPrice = pos.assets?.current_price || pos.entry_price;
          const posValue = pos.quantity * currentPrice;
          
          // Convert to base currency
          const assetCurrency = pos.assets?.currency || 'USD';
          const rate = getConversionRate(assetCurrency, baseCurrency, ratesData || []);
          total += posValue * rate;
        });

        setPortfolioValue(total);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getConversionRate = (from, to, ratesData = rates) => {
    if (from === to) return 1;
    
    const rate = ratesData.find(r => r.from_currency === from && r.to_currency === to);
    if (rate) return rate.rate;

    // Try reverse conversion
    const reverseRate = ratesData.find(r => r.from_currency === to && r.to_currency === from);
    if (reverseRate) return 1 / reverseRate.rate;

    return 1;
  };

  useEffect(() => {
    const rate = getConversionRate(baseCurrency, targetCurrency);
    setConvertedAmount(amount * rate);
  }, [amount, baseCurrency, targetCurrency, rates]);

  const handleSwapCurrencies = () => {
    setBaseCurrency(targetCurrency);
    setTargetCurrency(baseCurrency);
  };

  const handleSetBaseCurrency = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ base_currency: baseCurrency })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Base currency updated",
        description: `Your base currency is now set to ${baseCurrency}`,
      });
    } catch (error) {
      toast({
        title: "Error updating currency",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Currency Converter - WealthFlow</title>
        <meta name="description" content="Convert portfolio values across multiple currencies" />
      </Helmet>

      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Currency Converter</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Convert and view your portfolio in different currencies</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Converter */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"
        >
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Quick Converter</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                From Currency
              </label>
              <select
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              >
                {currencies.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwapCurrencies}
                className="gap-2"
              >
                <ArrowRightLeft className="w-4 h-4" />
                Swap
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                To Currency
              </label>
              <select
                value={targetCurrency}
                onChange={(e) => setTargetCurrency(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
              >
                {currencies.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Converted Amount</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {convertedAmount.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })} {targetCurrency}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Portfolio Value */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"
        >
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Portfolio Value</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Base Currency
              </label>
              <div className="flex gap-2">
                <select
                  value={baseCurrency}
                  onChange={(e) => setBaseCurrency(e.target.value)}
                  className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                >
                  {currencies.map(currency => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
                <Button onClick={handleSetBaseCurrency}>
                  Set Default
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {currencies.map(currency => {
                  const rate = getConversionRate(baseCurrency, currency);
                  const value = portfolioValue * rate;

                  return (
                    <div
                      key={currency}
                      className={`p-4 rounded-lg border transition ${
                        currency === baseCurrency
                          ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                          : 'bg-slate-50 border-slate-200 dark:bg-slate-700 dark:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white dark:bg-slate-800 rounded-lg">
                            <DollarSign className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {currency}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900 dark:text-white">
                            {value.toLocaleString('en-US', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })}
                          </p>
                          {currency !== baseCurrency && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Rate: {rate.toFixed(6)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Exchange Rates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6"
      >
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Current Exchange Rates</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {currencies.map(currency => (
            <div key={currency} className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                {baseCurrency} → {currency}
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {getConversionRate(baseCurrency, currency).toFixed(6)}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default CurrencyConverter;