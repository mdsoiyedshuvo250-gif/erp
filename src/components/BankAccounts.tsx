import React, { useState, useEffect } from 'react';
import { Plus, Building2, Wallet, History, Trash2 } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { BankAccount } from '../types';

interface BankAccountsProps {
  language: 'EN' | 'BN';
}

export default function BankAccounts({ language }: BankAccountsProps) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    account_name: '',
    bank_name: '',
    balance: ''
  });

  const popularBanks = [
    "Sonali Bank", "Janata Bank", "Agrani Bank", "Rupali Bank", 
    "Islami Bank", "Dutch-Bangla Bank", "BRAC Bank", "City Bank", 
    "Eastern Bank", "Mutual Trust Bank", "Prime Bank", "Southeast Bank", 
    "UCB", "Pubali Bank", "Uttara Bank", "AB Bank", "IFIC Bank", 
    "National Bank", "Standard Bank", "Jamuna Bank", "Mercantile Bank", 
    "One Bank", "Trust Bank", "EXIM Bank", "Social Islami Bank", 
    "Shahjalal Islami Bank", "Al-Arafah Islami Bank", "First Security Islami Bank"
  ];

  const fetchAccounts = () => {
    fetch('/api/bank-accounts').then(res => res.json()).then(setAccounts);
  };

  const handleDelete = async (id: number) => {
    if (!confirm(language === 'BN' ? 'আপনি কি নিশ্চিত?' : 'Are you sure?')) return;
    try {
      const res = await fetch(`/api/bank-accounts/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        alert(language === 'BN' ? data.error || 'ডিলেট করতে সমস্যা হয়েছে' : data.error || 'Error deleting account');
      } else {
        fetchAccounts();
      }
    } catch (err) {
      alert(language === 'BN' ? 'সার্ভারের সাথে যোগাযোগ করতে সমস্যা হয়েছে' : 'Connection error');
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/bank-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        balance: parseFloat(formData.balance)
      })
    });
    setFormData({ account_name: '', bank_name: '', balance: '' });
    setShowForm(false);
    fetchAccounts();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">
          {language === 'BN' ? 'ব্যাংক হিসাবসমূহ' : 'Bank Accounts'}
        </h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 rounded-xl font-medium transition-all"
        >
          <Plus className="w-5 h-5 pointer-events-none" />
          {language === 'BN' ? 'নতুন ব্যাংক যোগ করুন' : 'Add New Bank'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white/5 border border-white/5 rounded-3xl p-8 max-w-2xl">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">
                {language === 'BN' ? 'হিসাবের নাম' : 'Account Name'}
              </label>
              <input
                required
                type="text"
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">
                {language === 'BN' ? 'ব্যাংকের নাম' : 'Bank Name'}
              </label>
              <input
                required
                type="text"
                list="bank-list"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <datalist id="bank-list">
                {popularBanks.map(bank => (
                  <option key={bank} value={bank} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">
                {language === 'BN' ? 'বর্তমান ব্যালেন্স' : 'Current Balance'}
              </label>
              <input
                required
                type="number"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl font-bold">
                {language === 'BN' ? 'সংরক্ষণ করুন' : 'Save Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <div key={account.id} className="bg-white/5 border border-white/5 rounded-3xl p-6 hover:border-indigo-500/30 transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                <Building2 className="w-6 h-6 text-indigo-500 group-hover:text-white pointer-events-none" />
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleDelete(account.id)}
                    className="p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                    title={language === 'BN' ? 'ডিলিট' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4 pointer-events-none" />
                  </button>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-1">
                    {account.bank_name}
                  </p>
                  <h4 className="font-bold text-lg">{account.account_name}</h4>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5">
                <div className="flex items-center gap-2 text-gray-400">
                  <Wallet className="w-4 h-4" />
                  <span className="text-sm">{language === 'BN' ? 'ব্যালেন্স' : 'Balance'}</span>
                </div>
                <span className="text-xl font-bold text-emerald-500">
                  {formatCurrency(account.balance, language)}
                </span>
              </div>
              
              <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium text-gray-400">
                <History className="w-4 h-4" />
                {language === 'BN' ? 'লেনদেন ইতিহাস' : 'Transaction History'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
