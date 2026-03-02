import React, { useState, useEffect } from 'react';
import { Plus, HandCoins, User, Truck, Calendar, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { Vehicle, DriverAdvance } from '../types';
import { cn } from '../lib/utils';

interface DriverAdvancesProps {
  language: 'EN' | 'BN';
}

export default function DriverAdvances({ language }: DriverAdvancesProps) {
  const [advances, setAdvances] = useState<DriverAdvance[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    amount: '',
    description: ''
  });

  const fetchData = async () => {
    const [advRes, vehRes] = await Promise.all([
      fetch('/api/driver-advances'),
      fetch('/api/vehicles')
    ]);
    setAdvances(await advRes.json());
    setVehicles(await vehRes.json());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/driver-advances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        vehicle_id: parseInt(formData.vehicle_id),
        amount: parseFloat(formData.amount)
      })
    });
    setFormData({ vehicle_id: '', amount: '', description: '' });
    setShowForm(false);
    fetchData();
  };

  const handleSettle = async (id: number) => {
    await fetch('/api/driver-advances/settle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (!confirm(language === 'BN' ? 'আপনি কি নিশ্চিত?' : 'Are you sure?')) return;
    try {
      const res = await fetch(`/api/driver-advances/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const error = await res.json();
        alert(language === 'BN' ? error.error || 'ডিলেট করতে সমস্যা হয়েছে' : error.error || 'Error deleting advance');
      }
    } catch (err) {
      alert(language === 'BN' ? 'সার্ভারের সাথে যোগাযোগ করতে সমস্যা হয়েছে' : 'Connection error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center">
            <HandCoins className="w-6 h-6 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-bold">
            {language === 'BN' ? 'ড্রাইভার এডভান্স' : 'Driver Advances'}
          </h3>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 rounded-xl font-medium transition-all"
        >
          <Plus className="w-5 h-5 pointer-events-none" />
          {language === 'BN' ? 'নতুন এডভান্স যোগ করুন' : 'Add New Advance'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white/5 border border-white/5 rounded-3xl p-8 max-w-2xl">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">
                {language === 'BN' ? 'গাড়ি নির্বাচন করুন' : 'Select Vehicle'}
              </label>
              <select
                required
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              >
                <option value="" className="bg-gray-900">
                  {language === 'BN' ? 'গাড়ি নির্বাচন করুন' : 'Select Vehicle'}
                </option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id} className="bg-gray-900">{v.name} ({v.driver_name})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">
                {language === 'BN' ? 'পরিমাণ' : 'Amount'}
              </label>
              <input
                required
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-400">
                {language === 'BN' ? 'বিবরণ' : 'Description'}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
              />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl font-bold">
                {language === 'BN' ? 'এডভান্স যোগ করুন' : 'Add Advance'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {advances.map((advance) => (
          <div key={advance.id} className="bg-white/5 border border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
            <div className="flex items-center gap-6">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center",
                advance.status === 'settled' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
              )}>
                {advance.status === 'settled' ? <CheckCircle2 className="w-6 h-6 pointer-events-none" /> : <Clock className="w-6 h-6 pointer-events-none" />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-lg">{advance.driver_name}</h4>
                  <span className="text-xs text-gray-500 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                    {advance.vehicle_name}
                  </span>
                </div>
                <p className="text-sm text-gray-400 flex items-center gap-4">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3 pointer-events-none" /> {new Date(advance.date).toLocaleDateString()}</span>
                  {advance.description && <span>• {advance.description}</span>}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{formatCurrency(advance.amount, language)}</p>
                <p className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  advance.status === 'settled' ? "text-emerald-500" : "text-amber-500"
                )}>
                  {advance.status === 'settled' ? (language === 'BN' ? 'পরিশোধিত' : 'Settled') : (language === 'BN' ? 'বকেয়া' : 'Pending')}
                </p>
              </div>
              
              {advance.status === 'pending' && (
                <button 
                  onClick={() => handleSettle(advance.id)}
                  className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all text-sm font-bold"
                >
                  {language === 'BN' ? 'পরিশোধ করুন' : 'Settle'}
                </button>
              )}

              <button 
                onClick={() => handleDelete(advance.id)}
                className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-5 h-5 pointer-events-none" />
              </button>
            </div>
          </div>
        ))}

        {advances.length === 0 && (
          <div className="text-center py-12 bg-white/5 border border-dashed border-white/10 rounded-3xl">
            <HandCoins className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">
              {language === 'BN' ? 'কোন এডভান্স পাওয়া যায়নি' : 'No advances found'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
