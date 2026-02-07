import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Plus, Edit, Trash2, Search, Loader2, RefreshCw, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { eodhdService } from '@/services/eodhd';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';

const CarteraPage = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  
  const [brokers, setBrokers] = useState([]);
  const [selectedBrokerId, setSelectedBrokerId] = useState(null);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAddPositionOpen, setIsAddPositionOpen] = useState(false);
  const [isAddLiquidityOpen, setIsAddLiquidityOpen] = useState(false);
  
  const [editingBroker, setEditingBroker] = useState(null);
  const [editBrokerName, setEditBrokerName] = useState('');

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newPosition, setNewPosition] = useState({
    ticker: '', name: '', type: 'Stock', quantity: 0, entry_price: 0, currency: 'USD', target_percentage: 0, classification: 'Otros'
  });
  const [liquidityAmount, setLiquidityAmount] = useState(0);

  const ASSET_CLASSES = ["Pilares", "Micro/Small/Mid Caps", "Large Caps", "Otros", "Efectivo", "ETFs/Fondos", "Bonos"];

  useEffect(() => { if (user) initializePage(); }, [user]);
  useEffect(() => { if (selectedBrokerId) loadPositions(selectedBrokerId); }, [selectedBrokerId]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (searchTerm.length > 1) {
        setIsSearching(true);
        const k = await eodhdService.getApiKey(user.id);
        if (k) setSearchResults((await eodhdService.searchTickers(searchTerm, k)).slice(0, 10));
        setIsSearching(false);
      } else setSearchResults([]);
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm, user]);

  const initializePage = async () => {
    setLoading(true);
    await loadBrokers();
    setLoading(false);
  };

  const loadBrokers = async () => {
    const { data } = await supabase.from('brokers').select('*').eq('user_id', user.id).order('created_at');
    if (data?.length > 0) {
      setBrokers(data);
      if (!selectedBrokerId) setSelectedBrokerId(data[0].id);
    } else {
      const { data: b } = await supabase.from('brokers').insert({ user_id: user.id, name: 'Mi Broker' }).select().single();
      if (b) { setBrokers([b]); setSelectedBrokerId(b.id); }
    }
  };

  const loadPositions = async (bId) => {
    const { data } = await supabase.from('positions').select('*, assets(*)').eq('broker_id', bId);
    setPositions(data || []);
  };

  const handleUpdateBroker = async () => {
    if (!editBrokerName) return;
    await supabase.from('brokers').update({ name: editBrokerName }).eq('id', editingBroker.id);
    setEditingBroker(null);
    loadBrokers();
  };

  const handleDeleteBroker = async () => {
    await supabase.from('brokers').delete().eq('id', editingBroker.id);
    setEditingBroker(null);
    setSelectedBrokerId(null);
    loadBrokers();
  };

  const handleAddLiquidity = async () => {
     let { data: asset } = await supabase.from('assets').select('id').eq('ticker', 'CASH').maybeSingle();
     if (!asset) {
       const { data: a } = await supabase.from('assets').insert({ 
         ticker: 'CASH', company_name: 'Liquidez / Efectivo', asset_class: 'Cash', currency: 'USD', current_price: 1 
       }).select().single();
       asset = a;
     }

     const existing = positions.find(p => p.asset_id === asset.id);
     
     let pid = positions[0]?.portfolio_id;
     if (!pid) {
        const { data: p } = await supabase.from('portfolios').select('id').limit(1).single();
        pid = p?.id; 
     }

     if (existing) {
        await supabase.from('positions').update({ quantity: parseFloat(existing.quantity) + parseFloat(liquidityAmount) }).eq('id', existing.id);
     } else {
        await supabase.from('positions').insert({
          portfolio_id: pid, broker_id: selectedBrokerId, asset_id: asset.id, quantity: liquidityAmount, entry_price: 1, custom_classification: 'Efectivo'
        });
     }
     setIsAddLiquidityOpen(false);
     loadPositions(selectedBrokerId);
     toast({ title: "Liquidity added" });
  };

  const handleInlineUpdate = async (id, field, value) => {
    setPositions(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    await supabase.from('positions').update({ [field]: value }).eq('id', id);
  };

  const handleAddPosition = async () => {
     let { data: asset } = await supabase.from('assets').select('id').eq('ticker', newPosition.ticker).maybeSingle();
     if (!asset) {
        const { data: a } = await supabase.from('assets').insert({
          ticker: newPosition.ticker, company_name: newPosition.name, asset_class: newPosition.type, currency: newPosition.currency, current_price: newPosition.entry_price
        }).select().single();
        asset = a;
     }
     const { data: p } = await supabase.from('portfolios').select('id').eq('user_id', user.id).limit(1);
     
     await supabase.from('positions').insert({
        portfolio_id: p[0].id, broker_id: selectedBrokerId, asset_id: asset.id, 
        quantity: newPosition.quantity, entry_price: newPosition.entry_price, target_percentage: newPosition.target_percentage,
        custom_classification: newPosition.classification
     });
     setIsAddPositionOpen(false);
     loadPositions(selectedBrokerId);
  };

  const refreshPrices = async () => {
     setRefreshing(true);
     const k = await eodhdService.getApiKey(user.id);
     if (k) {
       const uniqueAssets = [...new Set(positions.map(p => p.asset_id))];
       for (const id of uniqueAssets) {
          const p = positions.find(pos => pos.asset_id === id);
          if (p?.assets?.ticker && p.assets.ticker !== 'CASH') {
             try {
                const q = await eodhdService.getQuote(p.assets.ticker, k);
                if (q) await supabase.from('assets').update({ current_price: q.current }).eq('id', id);
             } catch(e) {}
          }
       }
       loadPositions(selectedBrokerId);
       toast({ title: "Updated" });
     }
     setRefreshing(false);
  };

  if (loading) return <Loader2 className="animate-spin mx-auto mt-20" />;

  return (
    <div className="space-y-6">
      <Helmet><title>Cartera - WealthFlow</title></Helmet>

      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
           <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Cartera</h1>
           <div className="flex gap-2">
             <Button variant="outline" size="sm" onClick={refreshPrices} disabled={refreshing}>
               <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Update
             </Button>
             <Button variant="outline" size="sm" onClick={() => setIsAddLiquidityOpen(true)} className="gap-2 text-green-600 border-green-200 bg-green-50 hover:bg-green-100">
               <DollarSign className="w-4 h-4" /> Añadir Liquidez
             </Button>
             <Button size="sm" onClick={() => setIsAddPositionOpen(true)}><Plus className="w-4 h-4 mr-2" /> Position</Button>
           </div>
        </div>

        <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
          {brokers.map((broker) => (
            <div key={broker.id} className="relative group">
              <button
                onClick={() => setSelectedBrokerId(broker.id)}
                className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all pr-8 ${
                  selectedBrokerId === broker.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                }`}
              >
                {broker.name}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setEditingBroker(broker); setEditBrokerName(broker.name); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition text-xs"
              >
                <Edit className="w-3 h-3" />
              </button>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={async () => {
             await supabase.from('brokers').insert({ user_id: user.id, name: 'New Broker' }); loadBrokers();
          }}><Plus className="w-4 h-4" /></Button>
        </div>
      </div>

      {selectedBrokerId && (
        <div className="bg-white dark:bg-slate-800 border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-white dark:bg-slate-950">
                <tr>
                  <th className="px-4 py-3 text-left">Asset</th>
                  <th className="px-4 py-3 text-left">Classification</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3 text-right">Entry Price</th>
                  <th className="px-4 py-3 text-right">Current Price</th>
                  <th className="px-4 py-3 text-right">Total Value</th>
                  <th className="px-4 py-3 text-right">% Target</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {positions.map((pos) => {
                   const val = pos.quantity * (pos.assets?.current_price || pos.entry_price);
                   return (
                      <tr key={pos.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-4 py-2 font-medium">
                          {pos.assets?.ticker}
                          <div className="text-xs text-slate-500 font-normal">{pos.assets?.company_name}</div>
                        </td>
                        <td className="px-4 py-2">
                           <select 
                             value={pos.custom_classification || 'Otros'} 
                             onChange={(e) => handleInlineUpdate(pos.id, 'custom_classification', e.target.value)}
                             className="bg-transparent border-none text-xs focus:ring-0 cursor-pointer"
                           >
                              {ASSET_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                           </select>
                        </td>
                        <td className="px-4 py-2 text-right">
                           <input 
                              type="number" className="w-20 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none"
                              value={pos.quantity}
                              onChange={(e) => handleInlineUpdate(pos.id, 'quantity', e.target.value)}
                           />
                        </td>
                        <td className="px-4 py-2 text-right">
                           <input 
                              type="number" className="w-20 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none"
                              value={pos.entry_price}
                              onChange={(e) => handleInlineUpdate(pos.id, 'entry_price', e.target.value)}
                           />
                        </td>
                        <td className="px-4 py-2 text-right">${pos.assets?.current_price?.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right font-bold">${val.toFixed(0)}</td>
                        <td className="px-4 py-2 text-right">
                           <input 
                              type="number" className="w-12 text-right bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none"
                              value={pos.target_percentage}
                              onChange={(e) => handleInlineUpdate(pos.id, 'target_percentage', e.target.value)}
                           />%
                        </td>
                        <td className="px-4 py-2">
                           <Button variant="ghost" size="icon" onClick={async () => {
                              await supabase.from('positions').delete().eq('id', pos.id); loadPositions(selectedBrokerId);
                           }} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></Button>
                        </td>
                      </tr>
                   );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={!!editingBroker} onOpenChange={() => setEditingBroker(null)}>
         <DialogContent>
            <DialogHeader><DialogTitle>Edit Broker</DialogTitle></DialogHeader>
            <input className="w-full p-2 border rounded" value={editBrokerName} onChange={e => setEditBrokerName(e.target.value)} />
            <DialogFooter className="flex justify-between">
               <Button variant="destructive" onClick={handleDeleteBroker}>Delete Broker</Button>
               <Button onClick={handleUpdateBroker}>Save</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
      
      <Dialog open={isAddLiquidityOpen} onOpenChange={setIsAddLiquidityOpen}>
         <DialogContent>
            <DialogHeader><DialogTitle>Añadir Liquidez (Cash)</DialogTitle></DialogHeader>
            <input type="number" className="w-full p-2 border rounded" placeholder="Amount" value={liquidityAmount} onChange={e => setLiquidityAmount(e.target.value)} />
            <DialogFooter><Button onClick={handleAddLiquidity}>Add Cash</Button></DialogFooter>
         </DialogContent>
      </Dialog>

       <Dialog open={isAddPositionOpen} onOpenChange={setIsAddPositionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Añadir Posición</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="relative">
               <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Ticker</label>
               <div className="relative">
                 <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                 <input 
                   className="w-full pl-9 pr-3 py-2 border rounded-md" placeholder="Search AAPL..."
                   value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                 />
                 {isSearching && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-slate-400" />}
               </div>
               {searchResults.length > 0 && (
                 <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {searchResults.map((result) => (
                      <button key={result.symbol} className="w-full text-left px-4 py-2 hover:bg-slate-100 text-sm"
                        onClick={() => {
                           setNewPosition({...newPosition, ticker: result.symbol, name: result.description});
                           setSearchTerm(result.displaySymbol); setSearchResults([]);
                        }}
                      >
                         {result.displaySymbol}
                      </button>
                    ))}
                 </div>
               )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Qty</label>
                 <input type="number" className="w-full px-3 py-2 border rounded-md"
                    value={newPosition.quantity} onChange={(e) => setNewPosition({...newPosition, quantity: parseFloat(e.target.value)})}
                 />
               </div>
               <div>
                 <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Price</label>
                 <input type="number" className="w-full px-3 py-2 border rounded-md"
                    value={newPosition.entry_price} onChange={(e) => setNewPosition({...newPosition, entry_price: parseFloat(e.target.value)})}
                 />
               </div>
            </div>
            <div>
                 <label className="text-xs font-semibold uppercase text-slate-500 mb-1 block">Classification</label>
                 <select className="w-full px-3 py-2 border rounded-md"
                    value={newPosition.classification} onChange={(e) => setNewPosition({...newPosition, classification: e.target.value})}
                 >
                    {ASSET_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
            </div>
          </div>
          <DialogFooter><Button onClick={handleAddPosition}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CarteraPage;