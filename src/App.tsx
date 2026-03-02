import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Building2, 
  Truck, 
  Settings, 
  Menu, 
  X, 
  Moon, 
  Sun, 
  User,
  Globe,
  HandCoins,
  HardDriveDownload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import BankAccounts from './components/BankAccounts';
import Vehicles from './components/Vehicles';
import DriverAdvances from './components/DriverAdvances';
import SettingsView from './components/Settings';

type View = 'dashboard' | 'transactions' | 'bank' | 'vehicles' | 'advances' | 'settings';

export default function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [language, setLanguage] = useState<'EN' | 'BN'>('BN');

  const menuItems = [
    { id: 'dashboard', label: language === 'BN' ? 'ড্যাশবোর্ড' : 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: language === 'BN' ? 'লেনদেন যোগ' : 'Add Transaction', icon: ArrowLeftRight },
    { id: 'bank', label: language === 'BN' ? 'ব্যাংক হিসাব' : 'Bank Account', icon: Building2 },
    { id: 'vehicles', label: language === 'BN' ? 'গাড়ির প্রোফাইল' : 'Vehicle Profile', icon: Truck },
    { id: 'advances', label: language === 'BN' ? 'ড্রাইভার এডভান্স' : 'Driver Advance', icon: HandCoins },
    { id: 'settings', label: language === 'BN' ? 'সেটিংস' : 'Settings', icon: Settings },
  ];

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className={cn(
      "min-h-screen flex transition-colors duration-300",
      isDarkMode ? "bg-[#0B0E14] text-white" : "bg-gray-50 text-gray-900"
    )}>
      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out transform border-r lg:translate-x-0",
        isDarkMode ? "bg-[#0B0E14] border-white/5" : "bg-white border-gray-200",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Truck className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">SANGJOG ERP</h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-white/5 rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id as View);
                if (window.innerWidth < 1024) setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                activeView === item.id 
                  ? "bg-indigo-600/10 text-indigo-500 font-medium" 
                  : "hover:bg-white/5 text-gray-400 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                activeView === item.id ? "text-indigo-500" : "group-hover:text-white"
              )} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 min-w-0",
        "lg:ml-64"
      )}>
        {/* Header */}
        <header className={cn(
          "h-20 border-b flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 backdrop-blur-md",
          isDarkMode ? "bg-[#0B0E14]/80 border-white/5" : "bg-white/80 border-gray-200"
        )}>
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg md:text-2xl font-bold truncate max-w-[150px] md:max-w-none">
              {language === 'BN' ? 'সংযাগ ভেহিক্যাল ইআরপি' : 'Sangjog Vehicle ERP'}
            </h2>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setLanguage(language === 'BN' ? 'EN' : 'BN')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium"
            >
              <Globe className="w-4 h-4" />
              {language}
            </button>
            
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center cursor-pointer hover:bg-indigo-600/30 transition-colors">
              <User className="w-5 h-5 text-indigo-500" />
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeView === 'dashboard' && <Dashboard language={language} />}
              {activeView === 'transactions' && <Transactions language={language} />}
              {activeView === 'bank' && <BankAccounts language={language} />}
              {activeView === 'vehicles' && <Vehicles language={language} />}
              {activeView === 'advances' && <DriverAdvances language={language} />}
              {activeView === 'settings' && <SettingsView language={language} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
