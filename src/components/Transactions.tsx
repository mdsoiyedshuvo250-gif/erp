import React, { useState, useEffect } from 'react';
import { Plus, ArrowUpRight, ArrowDownLeft, Calendar, Truck, Building2, FileText, History, ArrowLeftRight, Trash2, Edit2, X } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { Vehicle, BankAccount, Transaction } from '../types';

interface TransactionsProps {
  language: 'EN' | 'BN';
}

export default function Transactions({ language }: TransactionsProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string; type: string }[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    category: '',
    amount: '',
    vehicle_id: '',
    bank_account_id: '',
    description: ''
  });

  const fetchData = async () => {
    const [vRes, bRes, tRes, cRes] = await Promise.all([
      fetch('/api/vehicles'),
      fetch('/api/bank-accounts'),
      fetch('/api/transactions'),
      fetch('/api/categories')
    ]);
    setVehicles(await vRes.json());
    setBankAccounts(await bRes.json());
    setTransactions(await tRes.json());
    setCategories(await cRes.json());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName) return;
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName, type: formData.type })
    });
    if (res.ok) {
      const data = await res.json();
      setCategories([...categories, { id: data.id, name: newCategoryName, type: formData.type }]);
      setFormData({ ...formData, category: newCategoryName });
      setNewCategoryName('');
      setIsAddingCategory(false);
    } else {
      alert('Category already exists or error occurred');
    }
  };

  const filteredCategories = categories.filter(c => c.type === formData.type);

  const handleDelete = async (id: number) => {
    if (!confirm(language === 'BN' ? 'আপনি কি নিশ্চিত?' : 'Are you sure?')) return;
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleEdit = (t: any) => {
    setEditingTransaction(t);
    setFormData({
      type: t.type,
      category: t.category,
      amount: t.amount.toString(),
      vehicle_id: t.vehicle_id?.toString() || '',
      bank_account_id: t.bank_account_id?.toString() || '',
      description: t.description || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingTransaction ? `/api/transactions/${editingTransaction.id}` : '/api/transactions';
    const method = editingTransaction ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        amount: parseFloat(formData.amount),
        vehicle_id: formData.vehicle_id ? parseInt(formData.vehicle_id) : null,
        bank_account_id: formData.bank_account_id ? parseInt(formData.bank_account_id) : null,
      })
    });
    
    setFormData({
      type: 'income',
      category: '',
      amount: '',
      vehicle_id: '',
      bank_account_id: '',
      description: ''
    });
    setEditingTransaction(null);
    setShowForm(false);
    fetchData();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center">
            <ArrowLeftRight className="w-6 h-6 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-bold">
            {language === 'BN' ? 'লেনদেনসমূহ' : 'Transactions'}
          </h3>
        </div>
        <button 
          onClick={() => {
            if (showForm && editingTransaction) {
              setEditingTransaction(null);
              setFormData({
                type: 'income',
                category: '',
                amount: '',
                vehicle_id: '',
                bank_account_id: '',
                description: ''
              });
            } else {
              setShowForm(!showForm);
            }
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 rounded-xl font-medium transition-all"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm 
            ? (language === 'BN' ? 'বন্ধ করুন' : 'Close') 
            : (language === 'BN' ? 'নতুন লেনদেন' : 'New Transaction')}
        </button>
      </div>

      {showForm && (
        <div className="bg-white/5 border border-white/5 rounded-3xl p-8 max-w-3xl mx-auto relative">
          <h4 className="text-xl font-bold mb-6">
            {editingTransaction 
              ? (language === 'BN' ? 'লেনদেন এডিট করুন' : 'Edit Transaction') 
              : (language === 'BN' ? 'নতুন লেনদেন যোগ করুন' : 'Add New Transaction')}
          </h4>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'income' })}
                className={`flex items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${
                  formData.type === 'income' 
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <ArrowUpRight className="w-5 h-5" />
                {language === 'BN' ? 'আয়' : 'Income'}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'expense' })}
                className={`flex items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${
                  formData.type === 'expense' 
                    ? 'bg-rose-500/10 border-rose-500 text-rose-500' 
                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <ArrowDownLeft className="w-5 h-5" />
                {language === 'BN' ? 'ব্যয়' : 'Expense'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {language === 'BN' ? 'বিভাগ' : 'Category'}
                </div>
                <button 
                  type="button"
                  onClick={() => setIsAddingCategory(!isAddingCategory)}
                  className="text-xs text-indigo-500 hover:underline"
                >
                  {isAddingCategory 
                    ? (language === 'BN' ? 'তালিকা থেকে বেছে নিন' : 'Select from list') 
                    : (language === 'BN' ? 'নতুন বিভাগ যোগ করুন' : '+ Add New')}
                </button>
              </label>
              
              {isAddingCategory ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder={language === 'BN' ? 'নতুন বিভাগের নাম' : 'New category name'}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="bg-indigo-600 px-4 rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    {language === 'BN' ? 'যোগ করুন' : 'Add'}
                  </button>
                </div>
              ) : (
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                >
                  <option value="" className="bg-gray-900">
                    {language === 'BN' ? 'বিভাগ নির্বাচন করুন' : 'Select Category'}
                  </option>
                  {filteredCategories.map(c => (
                    <option key={c.id} value={c.name} className="bg-gray-900">{c.name}</option>
                  ))}
                </select>
              )}
            </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  {language === 'BN' ? 'পরিমাণ' : 'Amount'}
                </label>
                <input
                  required
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  {language === 'BN' ? 'গাড়ি নির্বাচন করুন' : 'Select Vehicle'}
                </label>
                <select
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                >
                  <option value="" className="bg-gray-900">
                    {language === 'BN' ? 'গাড়ি নির্বাচন করুন' : 'Select Vehicle'}
                  </option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id} className="bg-gray-900">{v.name} ({v.number_plate})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {language === 'BN' ? 'ব্যাংক হিসাব (ঐচ্ছিক)' : 'Bank Account (Optional)'}
                </label>
                <select
                  value={formData.bank_account_id}
                  onChange={(e) => setFormData({ ...formData, bank_account_id: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                >
                  <option value="" className="bg-gray-900">
                    {language === 'BN' ? 'নগদ লেনদেন' : 'Cash Transaction'}
                  </option>
                  {bankAccounts.map(a => (
                    <option key={a.id} value={a.id} className="bg-gray-900">{a.account_name} - {a.bank_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {language === 'BN' ? 'বিবরণ' : 'Description'}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
            >
              {editingTransaction 
                ? (language === 'BN' ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes') 
                : (language === 'BN' ? 'লেনদেন নিশ্চিত করুন' : 'Confirm Transaction')}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white/5 border border-white/5 rounded-3xl overflow-hidden">
        <div className="p-4 md:p-6 border-b border-white/5 flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-500" />
          <h4 className="font-bold">{language === 'BN' ? 'সাম্প্রতিক লেনদেন' : 'Recent Transactions'}</h4>
        </div>
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-4 md:px-6 py-4 font-bold">{language === 'BN' ? 'তারিখ' : 'Date'}</th>
                <th className="px-4 md:px-6 py-4 font-bold">{language === 'BN' ? 'বিভাগ' : 'Category'}</th>
                <th className="px-4 md:px-6 py-4 font-bold">{language === 'BN' ? 'গাড়ি' : 'Vehicle'}</th>
                <th className="px-4 md:px-6 py-4 font-bold">{language === 'BN' ? 'ব্যাংক' : 'Bank'}</th>
                <th className="px-4 md:px-6 py-4 font-bold text-right">{language === 'BN' ? 'পরিমাণ' : 'Amount'}</th>
                <th className="px-4 md:px-6 py-4 font-bold text-right">{language === 'BN' ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-4 md:px-6 py-4 text-sm text-gray-400">
                    {new Date(t.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium">{t.category}</span>
                      {t.description && <span className="text-xs text-gray-500 line-clamp-1">{t.description}</span>}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <span className="text-xs md:text-sm px-2 py-1 rounded-lg bg-white/5 border border-white/5">
                      {t.vehicle_name || '-'}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4">
                    <span className="text-xs md:text-sm text-gray-400">
                      {t.bank_name ? `${t.account_name} (${t.bank_name})` : (language === 'BN' ? 'নগদ' : 'Cash')}
                    </span>
                  </td>
                  <td className={cn(
                    "px-4 md:px-6 py-4 text-right font-bold text-sm md:text-base",
                    t.type === 'income' ? "text-emerald-500" : "text-rose-500"
                  )}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(t)}
                        className="p-2 hover:bg-indigo-500/10 text-indigo-500 rounded-lg transition-colors"
                        title={language === 'BN' ? 'এডিট' : 'Edit'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(t.id)}
                        className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-lg transition-colors"
                        title={language === 'BN' ? 'ডিলিট' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 md:px-6 py-12 text-center text-gray-500">
                    {language === 'BN' ? 'কোন লেনদেন পাওয়া যায়নি' : 'No transactions found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
