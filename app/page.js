'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from './supabase';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  Users,
  Calendar,
  Wallet,
  TrendingUp,
  MapPin,
  Clock,
  Search,
  ArrowRight,
  ShieldCheck,
  Mail,
  ChevronRight,
  Sparkles,
  Phone,
  CheckCircle2,
  RefreshCw,
  X
} from 'lucide-react';

// Registrasi modul Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// =========================================================================
// DATA CADANGAN / DEFAULT JIKA DATABASE BELUM DIISI
// =========================================================================
const defaultAnggota = Array.from({ length: 30 }, (_, index) => {
  const id = index + 1;
  let jabatan = 'Anggota';
  if (id === 1) jabatan = 'Ketua';
  else if (id === 2) jabatan = 'Wakil Ketua';
  else if (id === 3) jabatan = 'Sekretaris Umum';
  else if (id === 4) jabatan = 'WakilSekretaris Umum';
  else if (id === 5) jabatan = 'Bendahara Umum';
  else if (id === 6) jabatan = 'Wakil Bendahara Umum';
  else if (id === 7) jabatan = 'Kepala Departemen A';
  else if (id === 8) jabatan = 'Sekertaris Departemen A';
  else if (id === 9) jabatan = 'Kepala Departemen B';
  else if (id === 10) jabatan = 'Sekertaris Departemen B';
  else if (id === 11) jabatan = 'Kepala Departemen C';
  else if (id === 12) jabatan = 'Sekertaris Departemen C';
  else if (id === 13) jabatan = 'Kepala Departemen D';
  else if (id === 14) jabatan = 'Sekertaris Departemen D';
  
  let namaOtomatis = `Anggota Karang Taruna ${id}`;
  let namaAsli = '';

  if (id === 1) namaAsli = 'Falah';        
  else if (id === 2) namaAsli = 'Ziran'; 
  else if (id === 3) namaAsli = 'Kia';    
  else if (id === 4) namaAsli = 'Jeki';   
  else if (id === 5) namaAsli = 'Alip';   
  else if (id === 6) namaAsli = 'Najla';
  else if (id === 7) namaAsli = 'Oji';
  else if (id === 8) namaAsli = 'Fakih';
  else if (id === 9) namaAsli = 'Najar';
  else if (id === 10) namaAsli = 'Jakyam';
  else if (id === 11) namaAsli = 'Kepin';
  else if (id === 12) namaAsli = 'Rajih';
  else if (id === 13) namaAsli = 'Panjul';
  else if (id === 14) namaAsli = 'Fajar';

  let rtOtomatis = `RT 0${(id % 4) + 1}`;
  let rtManual = ''; 

  if (id === 1) rtManual = 'RT 05';
  else if (id === 2) rtManual = 'RT 04';
  else if (id === 3) rtManual = 'RT 05';
  else if (id === 4) rtManual = 'RT 07';
  else if (id === 5) rtManual = 'RT 04';
  else if (id === 6) rtManual = 'RT 04';
  else if (id === 7) rtManual = 'RT 04';
  else if (id === 8) rtManual = 'RT 04';
  else if (id === 9) rtManual = 'RT 04';
  else if (id === 10) rtManual = 'RT 02';
  else if (id === 11) rtManual = 'RT 04';
  else if (id === 12) rtManual = 'RT 02';
  else if (id === 13) rtManual = 'RT 07';
  else if (id === 14) rtManual = 'RT 06';

  return {
    id: id,
    nama: namaAsli !== '' ? namaAsli : namaOtomatis, 
    jabatan: jabatan,
    sub_unit: `${rtManual !== '' ? rtManual : rtOtomatis} / RW 09`,
    foto: `/foto-anggota/anggota${id}.jpg`,
    status: 'Aktif'
  };
});

const defaultAgenda = [
  { id: 1, nama: 'Rapat Bulanan Pengurus', tanggal: '21 Juni 2026', jam: '19.30 WIB', lokasi: 'Graha Pemuda RW 09', status: 'Segera', warna: 'bg-amber-500' },
  { id: 2, nama: 'Kerja Bakti Lingkungan', tanggal: '28 Juni 2026', jam: '07.00 WIB', lokasi: 'Area Balai RW 09', status: 'Segera', warna: 'bg-amber-500' },
  { id: 3, nama: 'Turnamen Futsal Antar RT', tanggal: '12 Juli 2026', jam: '08.00 WIB', lokasi: 'Lapangan Utama RW 09', status: 'Mendatang', warna: 'bg-blue-500' },
  { id: 4, nama: 'Musyawarah Panitia HUT RI', tanggal: '02 Agustus 2026', jam: '20.00 WIB', lokasi: 'Graha Pemuda RW 09', status: 'Mendatang', warna: 'bg-blue-500' },
];

export default function BerandaUtama() {
  const [listAnggota, setListAnggota] = useState(defaultAnggota);
  const [listAgenda, setListAgenda] = useState(defaultAgenda);
  const [listKeuangan, setListKeuangan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tampilkanAnggota, setTampilkanAnggota] = useState(false);
  const [tampilkanAgenda, setTampilkanAgenda] = useState(false);
  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('Semua');
  const [chartData, setChartData] = useState(null);
  
  // State Ringkasan Keuangan
  const [ringkasanDana, setRingkasanDana] = useState({
    masuk: 0,
    keluar: 0,
    totalSaatIni: 0
  });

  // Fungsi Sinkronisasi Data Supabase
  const ambilSemuaData = async () => {
    try {
      // 1. Ambil Data Anggota
      const { data: dataAnggota } = await supabase
        .from('anggota')
        .select('*')
        .order('id', { ascending: true });
      if (dataAnggota && dataAnggota.length > 0) {
        setListAnggota(dataAnggota);
      }

      // 2. Ambil Data Agenda
      const { data: dataAgenda } = await supabase
        .from('agenda')
        .select('*')
        .order('id', { ascending: true });
      if (dataAgenda && dataAgenda.length > 0) {
        setListAgenda(dataAgenda);
      }

      // 3. Ambil Data Keuangan
      const { data: dataKeuangan } = await supabase
        .from('keuangan')
        .select('*')
        .order('id', { ascending: true });
        
      if (dataKeuangan && dataKeuangan.length > 0) {
        setListKeuangan(dataKeuangan);
        const labels = dataKeuangan.map(item => item.bulan);
        const nominalMasuk = dataKeuangan.map(item => Number(item.nominal) || 0);
        const nominalKeluar = dataKeuangan.map(item => Number(item.pengeluaran) || 0);

        const totalMasuk = nominalMasuk.reduce((a, b) => a + b, 0);
        const totalKeluar = nominalKeluar.reduce((a, b) => a + b, 0);
        
        setRingkasanDana({
          masuk: totalMasuk,
          keluar: totalKeluar,
          totalSaatIni: totalMasuk - totalKeluar
        });

        setChartData({
          labels: labels,
          datasets: [
            {
              label: 'Kas Masuk (Rp)',
              data: nominalMasuk,
              backgroundColor: '#10b981', // Emerald Hijau
              borderRadius: 6,
              hoverBackgroundColor: '#059669',
            },
            {
              label: 'Pengeluaran (Rp)',
              data: nominalKeluar,
              backgroundColor: '#ef4444', // Merah
              borderRadius: 6,
              hoverBackgroundColor: '#dc2626',
            },
          ],
        });
      }
    } catch (err) {
      console.error('Gagal menyinkronkan data database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    ambilSemuaData();

    // Setup Realtime Subscription untuk Sinkronisasi Instan Mobile & Desktop
    const subscriptionChannel = supabase
      .channel('portal-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'anggota' }, () => {
        ambilSemuaData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agenda' }, () => {
        ambilSemuaData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'keuangan' }, () => {
        ambilSemuaData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscriptionChannel);
    };
  }, []);

  // Filter Anggota berdasarkan kata kunci dan kategori
  const anggotaDifilter = useMemo(() => {
    return listAnggota.filter((anggota) => {
      const matchSearch =
        (anggota.nama && anggota.nama.toLowerCase().includes(search.toLowerCase())) ||
        (anggota.jabatan && anggota.jabatan.toLowerCase().includes(search.toLowerCase())) ||
        ((anggota.sub_unit || anggota.subUnit) && (anggota.sub_unit || anggota.subUnit).toLowerCase().includes(search.toLowerCase()));

      if (!matchSearch) return false;

      if (kategoriFilter === 'Pengurus Inti') {
        const j = (anggota.jabatan || '').toLowerCase();
        return j.includes('ketua') || j.includes('sekretaris') || j.includes('bendahara');
      }
      if (kategoriFilter === 'Departemen') {
        return (anggota.jabatan || '').toLowerCase().includes('departemen');
      }
      if (kategoriFilter === 'Anggota') {
        return (anggota.jabatan || '').toLowerCase() === 'anggota';
      }

      return true;
    });
  }, [listAnggota, search, kategoriFilter]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-white">
      
      {/* ================= HEADER / TOP NAVBAR ================= */}
      <header className="sticky top-0 z-40 bg-slate-900/85 backdrop-blur-lg border-b border-slate-800/80 px-4 sm:px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-emerald-600/30 shrink-0">
              KT
            </div>
            <div className="overflow-hidden">
              <h2 className="text-sm font-bold text-white tracking-tight leading-tight truncate">
                KARTAR RW 09
              </h2>
              <p className="text-[10px] text-emerald-400 font-medium truncate">Portal Informasi Digital</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={ambilSemuaData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700/80 cursor-pointer active:scale-95"
              title="Perbarui Data Terkini"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <Link
              href="/admin"
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-semibold transition-all border border-slate-700/80 flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </Link>
          </div>

        </div>
      </header>

      {/* ================= HERO BANNER SECTION ================= */}
      <section className="relative overflow-hidden bg-slate-950 border-b border-slate-800/80">
        {/* Background Image with Gradient Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-35 mix-blend-luminosity scale-105 transform transition-transform duration-700"
          style={{ backgroundImage: `url('/foto kartar 2.jpeg')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/70 to-emerald-950/20" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-14 sm:pt-20 sm:pb-24 relative z-10 space-y-6">
          
          {/* Badge Tagline */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold tracking-wide backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>KREATIF, INOVATIF & TRANSPARAN</span>
          </div>

          {/* Heading */}
          <div className="space-y-3 max-w-2xl">
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Portal Digital <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Karang Taruna Unit RW 09
              </span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-base font-normal leading-relaxed">
              Wadah keterbukaan informasi, pendataan keanggotaan pemuda, jadwal kegiatan sosial, dan transparansi kas warga yang tersinkronisasi langsung.
            </p>
          </div>

          {/* Quick CTA Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2">
            <button
              onClick={() => { setTampilkanAnggota(true); setTampilkanAgenda(false); }}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Users className="w-4 h-4" />
              <span>Lihat Anggota ({listAnggota.length})</span>
            </button>

            <button
              onClick={() => { setTampilkanAgenda(true); setTampilkanAnggota(false); }}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs sm:text-sm transition-all border border-slate-700 flex items-center gap-2 cursor-pointer backdrop-blur-md active:scale-95"
            >
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>Agenda Acara</span>
            </button>
          </div>

          {/* Quick Stats Ticker (100% Identik Mobile & Desktop) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 pt-6 border-t border-slate-800/80 max-w-3xl">
            <div className="p-3 sm:p-4 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-sm">
              <span className="text-[10px] sm:text-xs text-slate-400 font-medium">Total Pemuda Terdata</span>
              <p className="text-lg sm:text-2xl font-black text-white mt-0.5">{listAnggota.length} Orang</p>
            </div>
            <div className="p-3 sm:p-4 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-sm">
              <span className="text-[10px] sm:text-xs text-slate-400 font-medium">Agenda Terjadwal</span>
              <p className="text-lg sm:text-2xl font-black text-white mt-0.5">{listAgenda.length} Kegiatan</p>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3 sm:p-4 bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-sm">
              <span className="text-[10px] sm:text-xs text-slate-400 font-medium">Saldo Kas Aktif</span>
              <p className="text-lg sm:text-2xl font-black text-emerald-400 mt-0.5">
                Rp {ringkasanDana.totalSaatIni.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ================= KONTEN UTAMA ================= */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-10 flex-grow">
        
        {/* ================= 3 KARTU MENU UTAMA ================= */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Menu 1: Database Anggota */}
          <button
            onClick={() => { setTampilkanAnggota(!tampilkanAnggota); setTampilkanAgenda(false); }}
            className={`p-5 sm:p-6 rounded-3xl border text-left transition-all duration-300 relative overflow-hidden group cursor-pointer ${
              tampilkanAnggota
                ? 'bg-slate-800 border-blue-500 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold tracking-wider uppercase text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                ANGGOTA
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            
            <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
              Manajemen Anggota
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-1.5 leading-relaxed">
              Pendataan profil, susunan organisasi, dan domisili RT pemuda aktif ({listAnggota.length} orang).
            </p>
            
            <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-blue-400">
              <span>{tampilkanAnggota ? 'Tutup Daftar Anggota' : 'Buka Direktori Anggota'}</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${tampilkanAnggota ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
            </div>
          </button>

          {/* Menu 2: Agenda Kegiatan */}
          <button
            onClick={() => { setTampilkanAgenda(!tampilkanAgenda); setTampilkanAnggota(false); }}
            className={`p-5 sm:p-6 rounded-3xl border text-left transition-all duration-300 relative overflow-hidden group cursor-pointer ${
              tampilkanAgenda
                ? 'bg-slate-800 border-purple-500 shadow-xl shadow-purple-500/10 ring-2 ring-purple-500/20'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 shadow-md'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold tracking-wider uppercase text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg">
                JADWAL
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            
            <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
              Agenda Kegiatan
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-1.5 leading-relaxed">
              Jadwal aksi sosial, turnamen olahraga, kerja bakti, dan rapat kerja pemuda ({listAgenda.length} agenda).
            </p>
            
            <div className="mt-5 flex items-center gap-1.5 text-xs font-bold text-purple-400">
              <span>{tampilkanAgenda ? 'Tutup Jadwal Agenda' : 'Lihat Semua Jadwal'}</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${tampilkanAgenda ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
            </div>
          </button>

          {/* Menu 3: Layanan & Contact Person */}
          <div className="p-5 sm:p-6 rounded-3xl border border-slate-800 bg-slate-900/90 hover:border-slate-700 transition-all shadow-md relative group flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold tracking-wider uppercase text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                  LAYANAN
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Phone className="w-4 h-4" />
                </div>
              </div>
              
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                Layanan & Hubungi Pengurus
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm mt-1.5 leading-relaxed">
                Penyampaian aspirasi pemuda, izin kegiatan, atau informasi kerjasama organisasi.
              </p>
            </div>
            
            <div className="mt-5 pt-3 border-t border-slate-800/80">
              <a
                href="https://www.instagram.com/p3ba_09/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
              >
                <span>Instagram @p3ba_09</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </section>

        {/* ================= SECTION MANAJEMEN ANGGOTA (EXPANDED) ================= */}
        {tampilkanAnggota && (
          <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-8 shadow-2xl space-y-5 sm:space-y-6 animate-in fade-in duration-200">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-bold text-white">Daftar Anggota Karang Taruna</h2>
                  <span className="text-xs bg-blue-500/20 text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-500/30">
                    {anggotaDifilter.length} Orang
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Struktur organisasi dan anggota aktif Unit RW 09.</p>
              </div>

              {/* Kotak Cari */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama, jabatan, atau RT..."
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-base sm:text-xs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Kategori Chips (Geser Horizontal di HP) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
              {['Semua', 'Pengurus Inti', 'Departemen', 'Anggota'].map((kat) => (
                <button
                  key={kat}
                  onClick={() => setKategoriFilter(kat)}
                  className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
                    kategoriFilter === kat
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
                  }`}
                >
                  {kat}
                </button>
              ))}
            </div>

            {/* Grid Kartu Profil Anggota */}
            {anggotaDifilter.length === 0 ? (
              <div className="text-center py-14 border border-dashed border-slate-800 rounded-2xl text-slate-400 text-xs sm:text-sm">
                Anggota yang Anda cari tidak ditemukan.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {anggotaDifilter.map((anggota) => (
                  <div 
                    key={anggota.id} 
                    className="bg-slate-800/40 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col items-center text-center transition-all hover:bg-slate-800/80 group shadow-sm"
                  >
                    {/* Foto Profil Avatar */}
                    <div className="relative mb-3">
                      <img 
                        src={anggota.foto || `https://api.dicebear.com/7.x/avataaars/svg?seed=Anggota${anggota.id}`} 
                        alt={anggota.nama} 
                        className="w-16 h-16 rounded-full object-cover bg-slate-700 border-2 border-slate-700 group-hover:border-blue-500/50 transition-colors shadow"
                        onError={(e) => {
                          e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='%239ca3af' viewBox='0 0 24 24'><path d='M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z'/></svg>";
                        }}
                      />
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-800" title="Aktif" />
                    </div>

                    {/* Detail Anggota */}
                    <h4 className="font-bold text-sm text-white line-clamp-1 group-hover:text-blue-400 transition-colors">
                      {anggota.nama}
                    </h4>
                    
                    <span className="text-[11px] font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded-full my-1.5 line-clamp-1 max-w-[180px]">
                      {anggota.jabatan}
                    </span>
                    
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {anggota.sub_unit || anggota.subUnit || 'RW 09'}
                    </p>
                  </div>
                ))}
              </div>
            )}

          </section>
        )}

        {/* ================= SECTION AGENDA KEGIATAN (EXPANDED) ================= */}
        {tampilkanAgenda && (
          <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-8 shadow-2xl space-y-5 sm:space-y-6 animate-in fade-in duration-200">
            
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">Agenda & Jadwal Kegiatan</h2>
                <span className="text-xs bg-purple-500/20 text-purple-300 font-semibold px-2 py-0.5 rounded-full border border-purple-500/30">
                  {listAgenda.length} Kegiatan
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Jadwal pelaksanaan aksi sosial, olahraga, dan rapat resmi.</p>
            </div>
            
            {listAgenda.length === 0 ? (
              <div className="text-center py-14 border border-dashed border-slate-800 rounded-2xl text-slate-400 text-xs sm:text-sm">
                Belum ada agenda kegiatan yang terdaftar.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                {listAgenda.map((agenda) => (
                  <div 
                    key={agenda.id} 
                    className="bg-slate-800/40 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all hover:bg-slate-800/70 group shadow-sm gap-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-bold text-sm sm:text-base text-white group-hover:text-purple-400 transition-colors">
                          {agenda.nama}
                        </h4>
                        <span className={`text-[10px] text-white font-bold px-2.5 py-0.5 rounded-full shadow-sm shrink-0 ${agenda.warna || 'bg-blue-500'}`}>
                          {agenda.status}
                        </span>
                      </div>
                      
                      <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{agenda.tanggal} {agenda.jam ? `(${agenda.jam})` : ''}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{agenda.lokasi}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </section>
        )}

        {/* ================= SECTION GRAFIK KEUANGAN & TRANSPARANSI KAS ================= */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-8 shadow-xl space-y-6">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4 sm:pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg sm:text-xl font-bold text-white">Transparansi Kas Karang Taruna</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">Laporan arus kas masuk dan pengeluaran per periode secara terbuka.</p>
            </div>
            
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full self-start sm:self-auto">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Data Terverifikasi</span>
            </div>
          </div>

          {/* 3 Kartu Ringkasan Uang Kas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 bg-emerald-950/40 border border-emerald-500/20 rounded-2xl">
              <p className="text-[10px] sm:text-[11px] font-bold text-emerald-400 tracking-wider uppercase">Total Kas Masuk</p>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
                Rp {ringkasanDana.masuk.toLocaleString('id-ID')}
              </h3>
            </div>

            <div className="p-4 sm:p-5 bg-rose-950/40 border border-rose-500/20 rounded-2xl">
              <p className="text-[10px] sm:text-[11px] font-bold text-rose-400 tracking-wider uppercase">Total Pengeluaran</p>
              <h3 className="text-xl sm:text-2xl font-black text-rose-400 mt-1">
                Rp {ringkasanDana.keluar.toLocaleString('id-ID')}
              </h3>
            </div>

            <div className="p-4 sm:p-5 bg-blue-950/40 border border-blue-500/20 rounded-2xl">
              <p className="text-[10px] sm:text-[11px] font-bold text-blue-400 tracking-wider uppercase">Saldo Kas Saat Ini</p>
              <h3 className="text-xl sm:text-2xl font-black text-blue-400 mt-1">
                Rp {ringkasanDana.totalSaatIni.toLocaleString('id-ID')}
              </h3>
            </div>
          </div>

          {/* Visualisasi Grafik Batang */}
          <div className="pt-2 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Grafik Akumulasi Per Periode</h3>
              <p className="text-[11px] text-slate-400">Perbandingan kas masuk (hijau) vs pengeluaran (merah).</p>
            </div>

            <div className="w-full bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 sm:p-4">
              {chartData ? (
                <div className="h-64 sm:h-80 relative">
                  <Bar 
                    data={chartData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'top',
                          labels: {
                            color: '#94a3b8',
                            font: { size: 11, weight: 'bold' }
                          }
                        },
                        tooltip: {
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderWidth: 1,
                          titleColor: '#f8fafc',
                          bodyColor: '#cbd5e1',
                          padding: 10,
                          cornerRadius: 8
                        }
                      },
                      scales: {
                        x: {
                          grid: { color: 'rgba(51, 65, 85, 0.3)' },
                          ticks: { color: '#94a3b8', font: { size: 11 } }
                        },
                        y: {
                          beginAtZero: true,
                          grid: { color: 'rgba(51, 65, 85, 0.3)' },
                          ticks: { 
                            color: '#94a3b8', 
                            font: { size: 11 },
                            callback: function(value) {
                              return 'Rp ' + (Number(value) / 1000).toLocaleString('id-ID') + 'k';
                            }
                          }
                        }
                      }
                    }} 
                  />
                </div>
              ) : (
                <p className="text-center text-slate-500 py-12 text-xs">Memuat data grafik keuangan...</p>
              )}
            </div>

            {/* Rincian Kas Bulanan (Tersedia Lengkap di Mobile & Desktop) */}
            {listKeuangan.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                  Rincian Data Bulanan
                </h4>

                {/* Mobile View: Kartu Ringkas */}
                <div className="block sm:hidden space-y-2.5">
                  {listKeuangan.map((item) => {
                    const masuk = Number(item.nominal) || 0;
                    const keluar = Number(item.pengeluaran) || 0;
                    const selisih = masuk - keluar;

                    return (
                      <div key={item.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
                        <div className="flex items-center justify-between font-bold text-white">
                          <span>{item.bulan}</span>
                          <span className={selisih >= 0 ? 'text-blue-400' : 'text-rose-400'}>
                            Saldo: Rp {selisih.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-slate-400">
                          <div>
                            Masuk: <span className="text-emerald-400 font-semibold">Rp {masuk.toLocaleString('id-ID')}</span>
                          </div>
                          <div>
                            Keluar: <span className="text-rose-400 font-semibold">Rp {keluar.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop View: Tabel Rinci */}
                <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Bulan</th>
                        <th className="px-4 py-3">Kas Masuk (Rp)</th>
                        <th className="px-4 py-3">Pengeluaran (Rp)</th>
                        <th className="px-4 py-3">Selisih</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                      {listKeuangan.map((item) => {
                        const masuk = Number(item.nominal) || 0;
                        const keluar = Number(item.pengeluaran) || 0;
                        const selisih = masuk - keluar;

                        return (
                          <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 font-semibold text-white">{item.bulan}</td>
                            <td className="px-4 py-3 text-emerald-400 font-medium">Rp {masuk.toLocaleString('id-ID')}</td>
                            <td className="px-4 py-3 text-rose-400 font-medium">Rp {keluar.toLocaleString('id-ID')}</td>
                            <td className="px-4 py-3 font-semibold">
                              <span className={selisih >= 0 ? 'text-blue-400' : 'text-rose-400'}>
                                Rp {selisih.toLocaleString('id-ID')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

        </section>

      </main>

      {/* ================= FOOTER HALAMAN ================= */}
      <footer className="w-full bg-slate-950 text-slate-400 border-t border-slate-800 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-xs sm:text-sm">
          
          {/* Kolom 1: Profil Organisasi */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                KT
              </div>
              <h4 className="text-white font-bold text-sm tracking-wide">KARTAR UNIT RW 09</h4>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-xs">
              Organisasi kepemudaan tingkat RW 09 yang berfokus pada aksi sosial, olahraga, kreativitas pemuda, dan gotong royong warga.
            </p>
            <p className="text-emerald-400 text-[11px] font-semibold tracking-wider uppercase">
              Pemuda Bergerak, RW 09 Berdampak
            </p>
          </div>

          {/* Kolom 2: Informasi Sekretariat */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide">Informasi Sekretariat</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>Balai Pertemuan Warga RW 09</span>
              </li>
              <li className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>Rapat Rutin: Setiap Minggu ke-2</span>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Kontak & Akses Pengurus */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide">Kontak & Akses Pengurus</h4>
            <div className="space-y-2 text-xs">
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500" />
                <span className="text-slate-300">kartar.rw02@gmail.com</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-slate-500 font-bold">IG:</span>
                <a 
                  href="https://www.instagram.com/p3ba_09/" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  @p3ba_09
                </a>
              </p>
            </div>
            
            <div className="pt-2">
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 text-xs font-semibold rounded-xl border border-slate-800 transition-colors shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Masuk Panel Admin</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

        </div>

        {/* Hak Cipta */}
        <div className="w-full bg-slate-950/90 text-center py-4 text-[11px] text-slate-500 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-center gap-2">
          <span>&copy; 2026 Karang Taruna Unit RW 09. All Rights Reserved.</span>
          <span className="hidden sm:inline">•</span>
          <Link href="/admin" className="text-slate-500 hover:text-emerald-400 transition-colors text-[11px]">
            Kelola Website (Admin)
          </Link>
        </div>
      </footer>

    </div>
  );
}