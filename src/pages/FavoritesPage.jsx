import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, Trash2, Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { eodhdService } from '@/services/eodhd';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

const FavoritesPage = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [watchlists, setWatchlists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [items, setItems] = useState([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  
  const [manageAlertsItem, setManageAlertsItem] = useState(null);
  const [itemAlerts, setItemAlerts] = useState([]);
  const [newAlert, setNewAlert] = useState({ type: 'PRICE_TARGET', value: '' });

  useEffect(() => {
    if (user) loadWatchlists();
  }, [user]);

  useEffect(() => {
    if (selectedList) loadItems(selectedList.id);
  }, [selectedList]);

  useEffect(() => {
    if (manageAlertsItem) {
      loadAlerts(manageAlertsItem.id);
    }
  }, [manageAlertsItem]);

  const loadWatchlists = async () => {
    const { data } = await supabase.from('watchlists').select('*').eq('user_id', user.id);
    if (data && data.length > 0) {
      setWatchlists(data);
      setSelectedList(data[0]);
    }
  };

  const loadItems = async (listId) => {
    const { data: dbItems } = await supabase.from('watchlist_items').select('*').eq('watchlist_id', listId);
    
    const apiKey = await eodhdService.getApiKey(user.id);
    const enhancedItems = await Promise.all((dbItems || []).map(async (item) => {
      let quote = null;
      if (apiKey) {
        try { quote = await eodhdService.getQuote(item.ticker, apiKey); } catch (e) {}
      }
      return { ...item, quote };
    }));
    setItems(enhancedItems);
  };

  const loadAlerts = async (itemId) => {
    const { data } = await supabase
      .from('watchlist_alerts')
      .select('*')
      .eq('watchlist_item_id', itemId)
      .order('created_at', { ascending: false });
    setItemAlerts(data || []);
  };

  const createWatchlist = async () => {
    if (!newListName) return;
    await supabase.from('watchlists').insert({ user_id: user.id, name: newListName });
    setNewListName('');
    setIsCreateOpen(false);
    loadWatchlists();
  };

  const removeItem = async (id) => {
    await supabase.from('watchlist_items').delete().eq('id', id);
    loadItems(selectedList.id);
  };

  const handleAddAlert = async () => {
    if (!newAlert.value) return;

    const initialPrice = manageAlertsItem.quote?.current || 0;

    const { error } = await supabase.from('watchlist_alerts').insert({
      watchlist_item_id: manageAlertsItem.id,
      alert_type: newAlert.type,
      target_value: parseFloat(newAlert.value),
      initial_price: initialPrice,
      status: 'PENDING'
    });

    if (error) {
      toast({ title: "Error creating alert", variant: "destructive" });
    } else {
      toast({ title: "Alert created" });
      setNewAlert({ type: 'PRICE_TARGET', value: '' });
      loadAlerts(manageAlertsItem.id);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    await supabase.from('watchlist_alerts').delete().eq('id', alertId);
    loadAlerts(manageAlertsItem.id);
  };

  return (
    <div className="space-y-6">
      <Helmet><title>Favorites - WealthFlow</title></Helmet>
      
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Favorites</h1>
        <Button onClick={() => setIsCreateOpen(true)} size="sm"><Plus className="w-4 h-4 mr-2" /> New Watchlist</Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {watchlists.map(wl => (
          <button
            key={wl.id}
            onClick={() => setSelectedList(wl)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              selectedList?.id === wl.id 
              ? 'bg-blue-600 text-white' 
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {wl.name}
          </button>
        ))}
      </div>

      {selectedList && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-sm text-slate-700 dark:text-slate-300">Ticker</th>
                <th className="px-6 py-4 text-right font-semibold text-sm text-slate-700 dark:text-slate-300">Price</th>
                <th className="px-6 py-4 text-right font-semibold text-sm text-slate-700 dark:text-slate-300">Change</th>
                <th className="px-6 py-4 text-center font-semibold text-sm text-slate-700 dark:text-slate-300">Alerts</th>
                <th className="px-6 py-4 text-right font-semibold text-sm text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {items.map(item => (
                <tr key={item.id}>
                  <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{item.ticker}</td>
                  <td className="px-6 py-4 text-right text-slate-700 dark:text-slate-300">${item.quote?.current?.toFixed(2) || '-'}</td>
                  <td className={`px-6 py-4 text-right font-medium ${item.quote?.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.quote?.percentChange ? `${item.quote.percentChange.toFixed(2)}%` : '-'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setManageAlertsItem(item)}
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Manage Alerts
                    </Button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No items in watchlist. Add from Dashboard.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Watchlist</DialogTitle></DialogHeader>
          <input 
             className="w-full p-2 border rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" 
             placeholder="Watchlist Name" 
             value={newListName} 
             onChange={e => setNewListName(e.target.value)} 
          />
          <DialogFooter><Button onClick={createWatchlist}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!manageAlertsItem} onOpenChange={() => setManageAlertsItem(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Alerts for {manageAlertsItem?.ticker}</DialogTitle>
            <DialogDescription>Current Price: ${manageAlertsItem?.quote?.current?.toFixed(2) || '-'}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-3">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Add New Alert</h4>
              <div className="flex gap-2">
                <select 
                  className="p-2 border rounded text-sm w-1/3 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  value={newAlert.type}
                  onChange={(e) => setNewAlert({...newAlert, type: e.target.value})}
                >
                  <option value="PRICE_TARGET">Price Target ($)</option>
                  <option value="PERCENT_CHANGE">Percent Change (%)</option>
                </select>
                <input 
                  type="number" 
                  placeholder={newAlert.type === 'PRICE_TARGET' ? "Target Price (e.g., 150)" : "Percentage (e.g., 5 for +5%)"}
                  className="p-2 border rounded text-sm flex-1 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                  value={newAlert.value}
                  onChange={(e) => setNewAlert({...newAlert, value: e.target.value})}
                />
                <Button onClick={handleAddAlert} size="sm">Add</Button>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Active Alerts</h4>
              {itemAlerts.length === 0 && <p className="text-sm text-slate-500">No active alerts.</p>}
              {itemAlerts.map(alert => (
                <div key={alert.id} className="flex justify-between items-center p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
                  <div>
                    <div className="font-medium text-sm flex items-center gap-2 text-slate-900 dark:text-white">
                      {alert.alert_type === 'PRICE_TARGET' ? (
                        <>Target Price: ${alert.target_value}</>
                      ) : (
                        <>Change: +{alert.target_value}%</>
                      )}
                      {alert.status === 'TRIGGERED' && <span className="text-xs bg-red-100 text-red-600 px-2 rounded-full">Triggered</span>}
                      {alert.status === 'PENDING' && <span className="text-xs bg-yellow-100 text-yellow-600 px-2 rounded-full">Pending</span>}
                    </div>
                    {alert.alert_type === 'PERCENT_CHANGE' && (
                       <div className="text-xs text-slate-500">Ref Price: ${alert.initial_price}</div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="text-red-500 h-8 w-8" onClick={() => handleDeleteAlert(alert.id)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FavoritesPage;