import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Building2, 
  Banknote,
  Edit2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText as FilePdf,
  HardDriveDownload,
  FileDown,
  History
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { formatCurrency, cn } from '../lib/utils';
import { DashboardData } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DashboardProps {
  language: 'EN' | 'BN';
}

export default function Dashboard({ language }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [newBalance, setNewBalance] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const fetchData = async (month: string) => {
    const res = await fetch(`/api/dashboard?month=${month}`);
    const json = await res.json();
    setData(json);
    setNewBalance(json.openingBalance.toString());
  };

  useEffect(() => {
    fetchData(selectedMonth);
  }, [selectedMonth]);

  const handleUpdateBalance = async () => {
    await fetch('/api/settings/opening-balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        value: parseFloat(newBalance),
        month: selectedMonth
      })
    });
    setIsEditingBalance(false);
    fetchData(selectedMonth);
  };

  const changeMonth = (delta: number) => {
    const date = new Date(selectedMonth + '-01');
    date.setMonth(date.getMonth() + delta);
    setSelectedMonth(date.toISOString().slice(0, 7));
  };

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString(language === 'BN' ? 'bn-BD' : 'en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const downloadExcel = () => {
    window.open(`/api/export/transactions?month=${selectedMonth}`);
  };

  const downloadPDF = async () => {
    if (!data) return;
    
    // Fetch detailed transactions for the month
    const res = await fetch(`/api/transactions?month=${selectedMonth}`);
    const transactions = await res.json();
    
    const doc = new jsPDF();
    const title = language === 'BN' ? `${formatMonth(selectedMonth)}-এর রিপোর্ট` : `Report for ${formatMonth(selectedMonth)}`;
    
    doc.setFontSize(20);
    doc.text(title, 14, 22);
    
    doc.setFontSize(12);
    doc.text(`${language === 'BN' ? 'প্রারম্ভিক ব্যালেন্স' : 'Opening Balance'}: ${formatCurrency(data.openingBalance, language)}`, 14, 32);
    doc.text(`${language === 'BN' ? 'মোট আয়' : 'Total Income'}: ${formatCurrency(data.totalIncome, language)}`, 14, 38);
    doc.text(`${language === 'BN' ? 'মোট ব্যয়' : 'Total Expense'}: ${formatCurrency(data.totalExpense, language)}`, 14, 44);
    doc.text(`${language === 'BN' ? 'নিট মুনাফা' : 'Net Profit'}: ${formatCurrency(data.totalIncome - data.totalExpense, language)}`, 14, 50);
    doc.text(`${language === 'BN' ? 'বর্তমান হাতে নগদ' : 'Current Cash'}: ${formatCurrency(data.currentCash, language)}`, 14, 56);

    const tableHeaders = [
      language === 'BN' ? 'তারিখ' : 'Date',
      language === 'BN' ? 'বিভাগ' : 'Category',
      language === 'BN' ? 'গাড়ি' : 'Vehicle',
      language === 'BN' ? 'পরিমাণ' : 'Amount'
    ];

    const tableData = transactions.map((t: any) => [
      new Date(t.date).toLocaleDateString(),
      t.category,
      t.vehicle_name || '-',
      `${t.type === 'income' ? '+' : '-'}${t.amount}`
    ]);

    autoTable(doc, {
      startY: 65,
      head: [tableHeaders],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`Report_${selectedMonth}.pdf`);
  };

  if (!data) return <div className="animate-pulse">Loading...</div>;

  const stats = [
    { 
      label: language === 'BN' ? 'মোট আয়' : 'Total Income', 
      value: data.totalIncome, 
      icon: TrendingUp, 
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    { 
      label: language === 'BN' ? 'মোট ব্যয়' : 'Total Expense', 
      value: data.totalExpense, 
      icon: TrendingDown, 
      color: 'text-rose-500',
      bg: 'bg-rose-500/10'
    },
    { 
      label: language === 'BN' ? 'ব্যাংক ব্যালেন্স' : 'Bank Balance', 
      value: data.bankBalance, 
      icon: Building2, 
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10'
    },
    { 
      label: language === 'BN' ? 'বর্তমান হাতে নগদ' : 'Current Cash', 
      value: data.currentCash, 
      icon: Banknote, 
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
    { 
      label: language === 'BN' ? 'মোট ব্যালেন্স' : 'Total Balance', 
      value: data.totalBalance, 
      icon: Wallet, 
      color: 'text-white',
      bg: 'bg-indigo-600',
      highlight: true
    },
  ];

  const chartData = data.incomeByVehicle.map(item => ({
    name: item.name,
    income: item.amount,
    expense: data.expenseByVehicle.find(e => e.name === item.name)?.amount || 0
  }));

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Month Selector */}
      <div className="flex flex-col lg:flex-row items-center justify-between bg-white/5 border border-white/5 rounded-3xl p-4 md:p-6 lg:px-8 gap-4">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-lg">
            {language === 'BN' ? 'মাস নির্বাচন করুন' : 'Select Month'}
          </h3>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
          <div className="flex items-center gap-2">
            <button 
              onClick={downloadExcel}
              className="flex items-center gap-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all"
              title={language === 'BN' ? 'এক্সেল ডাউনলোড' : 'Download Excel'}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'BN' ? 'এক্সেল' : 'Excel'}</span>
            </button>
            <button 
              onClick={downloadPDF}
              className="flex items-center gap-2 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all"
              title={language === 'BN' ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}
            >
              <FilePdf className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'BN' ? 'পিডিএফ' : 'PDF'}</span>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => changeMonth(-1)}
              className="p-2 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="text-lg md:text-xl font-bold min-w-[120px] md:min-w-[150px] text-center">
              {formatMonth(selectedMonth)}
            </span>
            <button 
              onClick={() => changeMonth(1)}
              className="p-2 hover:bg-white/10 rounded-xl transition-all text-gray-400 hover:text-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Opening Balance Card */}
      <div className="bg-white/5 border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center shrink-0">
            <Banknote className="w-8 h-8 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-gray-400 font-medium mb-1 text-sm md:text-base">
              {language === 'BN' 
                ? `${formatMonth(selectedMonth)}-এর প্রারম্ভিক ব্যালেন্স` 
                : `Opening Balance for ${formatMonth(selectedMonth)}`}
            </h3>
            <div className="flex items-center justify-center md:justify-start gap-3">
              {isEditingBalance ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    className="bg-white/10 border border-white/10 rounded-lg px-3 py-1 text-xl md:text-2xl font-bold w-32 md:w-40 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button 
                    onClick={handleUpdateBalance}
                    className="bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-3xl md:text-4xl font-bold">{formatCurrency(data.openingBalance, language)}</span>
                  <button 
                    onClick={() => setIsEditingBalance(true)}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        <p className="text-gray-500 text-sm max-w-[200px] text-center md:text-right italic hidden md:block">
          {language === 'BN' ? 'আপনার গাড়ির সঠিক হিসাব, সবসময় আপনার হাতের মুঠোয়' : 'Accurate vehicle accounting, always at your fingertips'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <div 
            key={i}
            className={cn(
              "p-6 rounded-3xl border transition-all duration-300 hover:scale-[1.02]",
              stat.highlight 
                ? "bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-600/20" 
                : "bg-white/5 border-white/5"
            )}
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", stat.bg)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <p className={cn("text-sm font-medium mb-1", stat.highlight ? "text-indigo-100" : "text-gray-400")}>
              {stat.label}
            </p>
            <p className="text-2xl font-bold">
              {formatCurrency(stat.value, language)}
            </p>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="bg-white/5 border border-white/5 rounded-3xl p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-indigo-500" />
            <h3 className="text-xl font-bold">
              {language === 'BN' ? 'আয় বনাম ব্যয় (গাড়ি অনুযায়ী)' : 'Income vs Expense (By Vehicle)'}
            </h3>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-gray-400">{language === 'BN' ? 'আয়' : 'Income'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-gray-400">{language === 'BN' ? 'ব্যয়' : 'Expense'}</span>
            </div>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                tickFormatter={(value) => `৳${value}`}
              />
              <Tooltip 
                cursor={{ fill: '#ffffff05' }}
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: 'none', 
                  borderRadius: '12px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
