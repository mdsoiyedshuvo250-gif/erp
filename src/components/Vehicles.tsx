import React, { useState, useEffect, useRef } from 'react';
import { Plus, Truck, User, Hash, Activity, Edit2, Trash2, Camera, X } from 'lucide-react';
import { Vehicle } from '../types';
import { cn } from '../lib/utils';

interface VehiclesProps {
  language: 'EN' | 'BN';
}

export default function Vehicles({ language }: VehiclesProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    number_plate: '',
    driver_name: '',
    status: 'active'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchVehicles = () => {
    fetch('/api/vehicles').then(res => res.json()).then(setVehicles);
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingVehicle ? `/api/vehicles/${editingVehicle.id}` : '/api/vehicles';
    const method = editingVehicle ? 'PUT' : 'POST';
    
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    setFormData({ name: '', number_plate: '', driver_name: '', status: 'active' });
    setShowForm(false);
    setEditingVehicle(null);
    fetchVehicles();
  };

  const handleDelete = async (id: number) => {
    if (!confirm(language === 'BN' ? 'আপনি কি নিশ্চিত?' : 'Are you sure?')) return;
    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchVehicles();
      } else {
        const error = await res.json();
        alert(language === 'BN' ? error.error || 'ডিলেট করতে সমস্যা হয়েছে' : error.error || 'Error deleting vehicle');
      }
    } catch (err) {
      alert(language === 'BN' ? 'সার্ভারের সাথে যোগাযোগ করতে সমস্যা হয়েছে' : 'Connection error');
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      number_plate: vehicle.number_plate,
      driver_name: vehicle.driver_name,
      status: vehicle.status
    });
    setShowForm(true);
  };

  const handleImageUpload = async (vehicleId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    await fetch(`/api/vehicles/upload-image/${vehicleId}`, {
      method: 'POST',
      body: formData
    });
    fetchVehicles();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold">
          {language === 'BN' ? 'গাড়িসমূহ' : 'Vehicles'}
        </h3>
        <button 
          onClick={() => {
            setEditingVehicle(null);
            setFormData({ name: '', number_plate: '', driver_name: '', status: 'active' });
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 rounded-xl font-medium transition-all"
        >
          <Plus className="w-5 h-5 pointer-events-none" />
          {language === 'BN' ? 'নতুন গাড়ি যোগ করুন' : 'Add New Vehicle'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white/5 border border-white/5 rounded-3xl p-8 max-w-2xl relative">
          <button 
            onClick={() => setShowForm(false)}
            className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 pointer-events-none" />
          </button>
          <h4 className="text-xl font-bold mb-6">
            {editingVehicle 
              ? (language === 'BN' ? 'গাড়ি এডিট করুন' : 'Edit Vehicle') 
              : (language === 'BN' ? 'নতুন গাড়ি যোগ করুন' : 'Add New Vehicle')}
          </h4>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">
                {language === 'BN' ? 'গাড়ির নাম' : 'Vehicle Name'}
              </label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">
                {language === 'BN' ? 'গাড়ির নাম্বার' : 'Number Plate'}
              </label>
              <input
                required
                type="text"
                value={formData.number_plate}
                onChange={(e) => setFormData({ ...formData, number_plate: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">
                {language === 'BN' ? 'চালকের নাম' : 'Driver Name'}
              </label>
              <input
                required
                type="text"
                value={formData.driver_name}
                onChange={(e) => setFormData({ ...formData, driver_name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">
                {language === 'BN' ? 'স্ট্যাটাস' : 'Status'}
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              >
                <option value="active" className="bg-gray-900">{language === 'BN' ? 'সচল' : 'Active'}</option>
                <option value="inactive" className="bg-gray-900">{language === 'BN' ? 'অচল' : 'Inactive'}</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl font-bold">
                {language === 'BN' ? 'সংরক্ষণ করুন' : 'Save Vehicle'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="bg-[#151921] border border-white/5 rounded-[32px] p-8 hover:border-indigo-500/30 transition-all group relative overflow-hidden shadow-2xl">
            {/* Action Buttons - Top Right */}
            <div className="absolute top-6 right-6 flex gap-2 z-10">
              <button 
                onClick={() => handleEdit(vehicle)}
                className="p-2.5 bg-white/5 hover:bg-indigo-600 text-gray-400 hover:text-white rounded-xl transition-all backdrop-blur-md border border-white/5 shadow-lg"
                title={language === 'BN' ? 'এডিট' : 'Edit'}
              >
                <Edit2 className="w-4 h-4 pointer-events-none" />
              </button>
              <button 
                onClick={() => handleDelete(vehicle.id)}
                className="p-2.5 bg-white/5 hover:bg-rose-600 text-gray-400 hover:text-white rounded-xl transition-all backdrop-blur-md border border-white/5 shadow-lg"
                title={language === 'BN' ? 'ডিলিট' : 'Delete'}
              >
                <Trash2 className="w-4 h-4 pointer-events-none" />
              </button>
            </div>

            <div className="flex flex-col items-start gap-6">
              {/* Image Section */}
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-indigo-500/20 shadow-2xl">
                  {vehicle.image_url ? (
                    <img 
                      src={vehicle.image_url} 
                      alt={vehicle.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-indigo-600/10 flex items-center justify-center">
                      <Truck className="w-10 h-10 text-indigo-500" />
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-9 h-9 bg-indigo-600 border-4 border-[#151921] rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-500 text-white shadow-xl transition-all">
                  <Camera className="w-4 h-4" />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(vehicle.id, e)}
                  />
                </label>
              </div>

              {/* Content Section */}
              <div className="w-full space-y-6">
                <div>
                  <h4 className="text-3xl font-black tracking-tight text-white mb-1 uppercase">{vehicle.name}</h4>
                  <div className={cn(
                    "inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border",
                    vehicle.status === 'active' 
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                      : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                  )}>
                    {vehicle.status === 'active' 
                      ? (language === 'BN' ? 'সচল' : 'Active') 
                      : (language === 'BN' ? 'অচল' : 'Inactive')}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-gray-400 group/item">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/item:bg-indigo-600/10 transition-colors">
                      <Hash className="w-4 h-4 group-hover/item:text-indigo-500 transition-colors" />
                    </div>
                    <span className="text-base font-medium tracking-wide">{vehicle.number_plate}</span>
                  </div>
                  <div className="flex items-center gap-4 text-gray-400 group/item">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/item:bg-indigo-600/10 transition-colors">
                      <User className="w-4 h-4 group-hover/item:text-indigo-500 transition-colors" />
                    </div>
                    <span className="text-base font-medium tracking-wide">{vehicle.driver_name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-gray-400 group/item">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/item:bg-indigo-600/10 transition-colors">
                      <Activity className="w-4 h-4 group-hover/item:text-indigo-500 transition-colors" />
                    </div>
                    <span className="text-base font-medium tracking-wide">
                      {vehicle.status === 'active' 
                        ? (language === 'BN' ? 'চলমান' : 'In Operation')
                        : (language === 'BN' ? 'বন্ধ আছে' : 'Stopped')}
                    </span>
                  </div>
                </div>
                
                <button className="w-full py-4 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all text-sm font-bold text-gray-300 hover:text-white shadow-inner">
                  {language === 'BN' ? 'বিস্তারিত দেখুন' : 'View Details'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
