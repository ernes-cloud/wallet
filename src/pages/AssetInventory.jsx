import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AssetInventory = () => {
  const { toast } = useToast();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedAssetClass, setSelectedAssetClass] = useState('All');

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('ticker', { ascending: true });

      if (error) throw error;
      setAssets(data || []);
    } catch (error) {
      console.error('Error loading assets:', error);
      toast({
        title: "Error loading assets",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sectors = ['All', ...new Set(assets.map(a => a.sector).filter(Boolean))];
  const assetClasses = ['All', ...new Set(assets.map(a => a.asset_class).filter(Boolean))];

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector === 'All' || asset.sector === selectedSector;
    const matchesClass = selectedAssetClass === 'All' || asset.asset_class === selectedAssetClass;
    return matchesSearch && matchesSector && matchesClass;
  });

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Asset Inventory - WealthFlow</title>
        <meta name="description" content="Browse and manage your asset inventory" />
      </Helmet>

      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Asset Inventory</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Browse all available assets and their current market data</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticker or company name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
          />
        </div>
        <select
          value={selectedSector}
          onChange={(e) => setSelectedSector(e.target.value)}
          className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
        >
          {sectors.map(sector => (
            <option key={sector} value={sector}>{sector}</option>
          ))}
        </select>
        <select
          value={selectedAssetClass}
          onChange={(e) => setSelectedAssetClass(e.target.value)}
          className="px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
        >
          {assetClasses.map(assetClass => (
            <option key={assetClass} value={assetClass}>{assetClass}</option>
          ))}
        </select>
      </div>

      {/* Assets Table */}
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
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Company Name</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Sector</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Asset Class</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Current Price</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">52W High</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">52W Low</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No assets found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {asset.ticker}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-white">
                      {asset.company_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {asset.sector || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      {asset.asset_class}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                      {asset.current_price ? `$${asset.current_price.toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right text-green-600">
                      {asset.week_52_high ? `$${asset.week_52_high.toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right text-red-600">
                      {asset.week_52_low ? `$${asset.week_52_low.toFixed(2)}` : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="text-sm text-slate-600 dark:text-slate-400">
        Showing {filteredAssets.length} of {assets.length} assets
      </div>
    </div>
  );
};

export default AssetInventory;