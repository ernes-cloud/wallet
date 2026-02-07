import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

const NotificationsPage = () => {
  const { user } = useSupabaseAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setNotifications(data || []);
  };

  const markAsRead = async (id) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    loadNotifications();
  };

  const clearAll = async () => {
    await supabase.from('notifications').delete().eq('user_id', user.id);
    loadNotifications();
  };

  return (
    <div className="space-y-6">
      <Helmet><title>Notifications - WealthFlow</title></Helmet>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Notificaciones</h1>
        {notifications.length > 0 && (
          <Button variant="outline" onClick={clearAll} className="text-red-500">
            <Trash2 className="w-4 h-4 mr-2" /> Clear All
          </Button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {notifications.length === 0 ? (
           <div className="p-12 text-center text-slate-500">
             <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
             <p>No new notifications</p>
           </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {notifications.map(note => (
              <div key={note.id} className={`p-4 flex gap-4 ${note.is_read ? 'opacity-60' : 'bg-blue-50/50 dark:bg-blue-900/10'}`}>
                <div className="mt-1">
                   <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white">{note.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">{note.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(note.created_at).toLocaleString()}</p>
                </div>
                {!note.is_read && (
                  <Button size="icon" variant="ghost" onClick={() => markAsRead(note.id)}>
                    <Check className="w-4 h-4 text-green-600" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;