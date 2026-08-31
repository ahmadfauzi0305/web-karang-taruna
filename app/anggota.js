'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function ManajemenAnggota() {
  const [listAnggota, setListAnggota] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ambilAnggota = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('anggota')
          .select('*')
          .order('id', { ascending: true });
        if (data && data.length > 0) {
          setListAnggota(data);
        }
      } catch (err) {
        console.error('Error fetching anggota:', err);
      } finally {
        setLoading(false);
      }
    };
    ambilAnggota();
  }, []);

  const anggotaDifilter = listAnggota.filter((anggota) =>
    (anggota.nama && anggota.nama.toLowerCase().includes(search.toLowerCase())) ||
    (anggota.jabatan && anggota.jabatan.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="bg-gray-50 min-h-screen p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manajemen Anggota</h1>
            <p className="text-gray-500 text-sm">Total Terdaftar: {listAnggota.length} Orang</p>
          </div>
          
          {/* Kotak Pencarian */}
          <div className="mt-4 md:mt-0">
            <input
              type="text"
              placeholder="Cari nama atau jabatan..."
              className="w-full md:w-64 px-4 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Grid Kartu Profil */}
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Memuat data anggota...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {anggotaDifilter.map((anggota) => (
              <div 
                key={anggota.id} 
                className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow"
              >
                {/* Foto Profil Avatar */}
                <div className="w-20 h-20 bg-green-50 rounded-full mb-3 overflow-hidden border-2 border-green-100">
                  <img 
                    src={anggota.foto || `https://api.dicebear.com/7.x/avataaars/svg?seed=Anggota${anggota.id}`} 
                    alt={anggota.nama} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='%239ca3af' viewBox='0 0 24 24'><path d='M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z'/></svg>";
                    }}
                  />
                </div>

                {/* Detail Anggota */}
                <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">{anggota.nama}</h3>
                <p className="text-xs font-medium text-green-600 bg-green-50 px-2.5 py-0.5 rounded-full my-1.5">
                  {anggota.jabatan}
                </p>
                
                <div className="text-xs text-gray-400 mt-1">
                  <p>{anggota.sub_unit || anggota.subUnit}</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">ID: KT-{String(anggota.id).padStart(3, '0')}</p>
                </div>

                {/* Status Badge */}
                <div className="mt-4 w-full pt-3 border-t border-gray-50 flex items-center justify-center gap-1.5 text-xs text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  {anggota.status || 'Aktif'}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Jika pencarian tidak ketemu */}
        {!loading && anggotaDifilter.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            Anggota yang kamu cari tidak ditemukan.
          </div>
        )}

      </div>
    </div>
  );
}