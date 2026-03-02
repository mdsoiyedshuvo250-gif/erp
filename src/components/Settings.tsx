import React, { useState } from 'react';
import { Database, FileDown, ShieldCheck, HardDriveDownload, Info, Upload, AlertCircle, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface SettingsProps {
  language: 'EN' | 'BN';
}

export default function Settings({ language }: SettingsProps) {
  const [isRestoring, setIsRestoring] = useState(false);

  const handleDownloadDB = async () => {
    try {
      const res = await fetch('/api/backup/export');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sangjog_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert(language === 'BN' ? 'ব্যাকআপ ডাউনলোড করতে সমস্যা হয়েছে।' : 'Failed to download backup.');
    }
  };

  const handleExportCSV = () => {
    window.open('/api/export/transactions', '_blank');
  };

  const handleRestoreDB = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(language === 'BN' 
      ? 'আপনি কি নিশ্চিত? এটি বর্তমান সব ডাটা মুছে ফেলবে এবং নতুন ফাইল লোড করবে।' 
      : 'Are you sure? This will delete all current data and load the new file.')) {
      return;
    }

    setIsRestoring(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string);
        const res = await fetch('/api/backup/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(backup),
        });

        if (res.ok) {
          alert(language === 'BN' ? 'ডাটা সফলভাবে রিস্টোর হয়েছে!' : 'Data restored successfully!');
          window.location.reload();
        } else {
          alert(language === 'BN' ? 'রিস্টোর করতে সমস্যা হয়েছে।' : 'Failed to restore data.');
        }
      } catch (error) {
        console.error(error);
        alert(language === 'BN' ? 'ভুল ফাইল ফরম্যাট।' : 'Invalid file format.');
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  const handleResetDB = async () => {
    if (!confirm(language === 'BN' 
      ? 'আপনি কি নিশ্চিত? এটি সব ডাটা চিরতরে মুছে ফেলবে!' 
      : 'Are you sure? This will permanently delete all data!')) {
      return;
    }

    const password = prompt(language === 'BN' ? 'নিশ্চিত করতে "RESET" লিখুন:' : 'Type "RESET" to confirm:');
    if (!password || password.toUpperCase() !== 'RESET') {
      alert(language === 'BN' ? 'ভুল পাসওয়ার্ড!' : 'Incorrect confirmation text!');
      return;
    }

    try {
      const res = await fetch('/api/backup/reset', { method: 'POST' });
      if (res.ok) {
        alert(language === 'BN' ? 'সব ডাটা মুছে ফেলা হয়েছে।' : 'All data has been cleared.');
        window.location.reload();
      } else {
        const data = await res.json();
        alert((language === 'BN' ? 'রিসেট করতে সমস্যা হয়েছে: ' : 'Failed to reset: ') + (data.error || res.statusText));
      }
    } catch (error) {
      console.error(error);
      alert(language === 'BN' ? 'সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।' : 'Could not connect to server.');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-indigo-500" />
        </div>
        <h3 className="text-2xl font-bold">
          {language === 'BN' ? 'ডাটা নিরাপত্তা ও সেটিংস' : 'Data Security & Settings'}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database Backup */}
        <div className="bg-white/5 border border-white/5 rounded-3xl p-8 hover:border-indigo-500/30 transition-all group">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
            <Database className="w-7 h-7 text-indigo-500 group-hover:text-white" />
          </div>
          <h4 className="text-xl font-bold mb-2">
            {language === 'BN' ? 'ডাটা ব্যাকআপ (Download)' : 'Database Backup (Download)'}
          </h4>
          <p className="text-gray-400 text-sm mb-6">
            {language === 'BN' 
              ? 'আপনার সব ডাটা একটি ফাইলে ডাউনলোড করে কম্পিউটারে সেভ করে রাখুন।' 
              : 'Download all your data in a single file and save it on your computer.'}
          </p>
          <button 
            onClick={handleDownloadDB}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
          >
            <HardDriveDownload className="w-5 h-5" />
            {language === 'BN' ? 'ব্যাকআপ ডাউনলোড করুন' : 'Download Backup'}
          </button>
        </div>

        {/* Database Restore */}
        <div className="bg-white/5 border border-white/5 rounded-3xl p-8 hover:border-amber-500/30 transition-all group">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:bg-amber-500 transition-colors">
            <Upload className="w-7 h-7 text-amber-500 group-hover:text-white" />
          </div>
          <h4 className="text-xl font-bold mb-2">
            {language === 'BN' ? 'ডাটা রিস্টোর (Upload)' : 'Database Restore (Upload)'}
          </h4>
          <p className="text-gray-400 text-sm mb-6">
            {language === 'BN' 
              ? 'আপনার কম্পিউটার থেকে আগের ব্যাকআপ ফাইলটি সিলেক্ট করে ডাটা লোড করুন।' 
              : 'Select a previous backup file from your computer to load the data.'}
          </p>
          <label className={cn(
            "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all cursor-pointer",
            isRestoring ? "bg-gray-600 cursor-not-allowed" : "bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-600/20"
          )}>
            <Upload className="w-5 h-5" />
            {isRestoring 
              ? (language === 'BN' ? 'প্রসেসিং হচ্ছে...' : 'Restoring...') 
              : (language === 'BN' ? 'ফাইল সিলেক্ট করুন' : 'Select File')}
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={handleRestoreDB} 
              disabled={isRestoring}
            />
          </label>
        </div>

        {/* CSV Export */}
        <div className="bg-white/5 border border-white/5 rounded-3xl p-8 hover:border-emerald-500/30 transition-all group md:col-span-2">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
              <FileDown className="w-7 h-7 text-emerald-500 group-hover:text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold mb-1">
                {language === 'BN' ? 'এক্সেল/CSV রিপোর্ট' : 'Excel/CSV Report'}
              </h4>
              <p className="text-gray-400 text-sm">
                {language === 'BN' 
                  ? 'সব লেনদেনের একটি পূর্ণাঙ্গ রিপোর্ট CSV ফরম্যাটে ডাউনলোড করুন।' 
                  : 'Download a complete report of all transactions in CSV format.'}
              </p>
            </div>
            <button 
              onClick={handleExportCSV}
              className="px-8 bg-emerald-600 hover:bg-emerald-700 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20"
            >
              {language === 'BN' ? 'ডাউনলোড' : 'Download'}
            </button>
          </div>
        </div>

        {/* Reset Database */}
        <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-8 hover:border-red-500/30 transition-all group md:col-span-2">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500 transition-colors">
              <Trash2 className="w-7 h-7 text-red-500 group-hover:text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold mb-1 text-red-500">
                {language === 'BN' ? 'সব ডাটা মুছুন (Reset)' : 'Reset All Data'}
              </h4>
              <p className="text-gray-400 text-sm">
                {language === 'BN' 
                  ? 'সতর্কতা: এটি আপনার সব গাড়ি, লেনদেন এবং সেটিংস চিরতরে মুছে ফেলবে।' 
                  : 'Warning: This will permanently delete all vehicles, transactions, and settings.'}
              </p>
            </div>
            <button 
              onClick={handleResetDB}
              className="px-8 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white py-3 rounded-xl font-bold transition-all border border-red-500/30"
            >
              {language === 'BN' ? 'রিসেট করুন' : 'Reset Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Warning Card */}
      <div className="bg-amber-600/10 border border-amber-500/20 rounded-3xl p-6 flex gap-4 items-start">
        <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
        <div className="text-sm text-gray-300 leading-relaxed">
          <p className="font-bold text-white mb-1">
            {language === 'BN' ? 'সতর্কতা (Warning)' : 'Warning'}
          </p>
          {language === 'BN' 
            ? 'ডাটা রিস্টোর করার সময় আপনার বর্তমান সব ডাটা মুছে যাবে। তাই রিস্টোর করার আগে বর্তমান ডাটার একটি ব্যাকআপ নিয়ে রাখা নিরাপদ।' 
            : 'Restoring data will overwrite all current data. It is safer to take a backup of your current data before restoring.'}
        </div>
      </div>
    </div>
  );
}
