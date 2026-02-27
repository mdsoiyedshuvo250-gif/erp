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
    await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
    fetchVehicles();
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
          <Plus className="w-5 h-5" />
          {language === 'BN' ? 'নতুন গাড়ি যোগ করুন' : 'Add New Vehicle'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white/5 border border-white/5 rounded-3xl p-8 max-w-2xl relative">
          <button 
            onClick={() => setShowForm(false)}
            className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
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
          <div key={vehicle.id} className="bg-white/5 border border-white/5 rounded-3xl p-6 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
            <div className="absolute top-4 right-4 flex gap-2">
              <button 
                onClick={() => handleEdit(vehicle)}
                className="p-2 bg-indigo-600/20 text-indigo-500 hover:bg-indigo-600 hover:text-white rounded-lg transition-all"
                title={language === 'BN' ? 'এডিট' : 'Edit'}
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleDelete(vehicle.id)}
                className="p-2 bg-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                title={language === 'BN' ? 'ডিলিট' : 'Delete'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-start justify-between mb-6">
              <div className="relative group/img">
                {vehicle.image_url ? (
                  <img 
                    src={vehicle.image_url} 
                    alt={vehicle.name} 
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/30"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-indigo-600/20 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                    <Truck className="w-10 h-10 text-indigo-500 group-hover:text-white" />
                  </div>
                )}
                <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-indigo-600 border-2 border-gray-900 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-500 text-white shadow-xl transition-all">
                  <Camera className="w-5 h-5" />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleImageUpload(vehicle.id, e)}
                  />
                </label>
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                vehicle.status === 'active' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
              )}>
                {vehicle.status === 'active' 
                  ? (language === 'BN' ? 'সচল' : 'Active') 
                  : (language === 'BN' ? 'অচল' : 'Inactive')}
              </div>
            </div>
            
            <h4 className="text-xl font-bold mb-4">{vehicle.name}</h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-400">
                <Hash className="w-4 h-4" />
                <span className="text-sm">{vehicle.number_plate}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <User className="w-4 h-4" />
                <span className="text-sm">{vehicle.driver_name}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Activity className="w-4 h-4" />
                <span className="text-sm">{language === 'BN' ? 'চলমান' : 'In Operation'}</span>
              </div>
            </div>
            
            <button className="w-full mt-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium text-gray-400">
              {language === 'BN' ? 'বিস্তারিত দেখুন' : 'View Details'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
