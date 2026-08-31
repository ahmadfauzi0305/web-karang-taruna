'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '../supabase';
import {
  Users,
  Calendar,
  DollarSign,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  Search,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Lock,
  Mail,
  ExternalLink,
  Sparkles,
  Database,
  Copy,
  Check,
  Upload,
  Camera,
  X
} from 'lucide-react';

export default function AdminDashboard() {
  // ==========================================
  // STATE CLIENT & AUTENTIKASI (SUPABASE AUTH)
  // ==========================================
  const [isClient, setIsClient] = useState(false);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  // ==========================================
  // STATE NAVIGASI TAB & NOTIFIKASI
  // ==========================================
  const [activeTab, setActiveTab] = useState('anggota'); // 'anggota' | 'agenda' | 'keuangan' | 'sql'
  const [pesanNotif, setPesanNotif] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [dbErrorWarning, setDbErrorWarning] = useState(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // ==========================================
  // STATE DATA ENTITAS
  // ==========================================
  const [listAnggota, setListAnggota] = useState([]);
  const [listAgenda, setListAgenda] = useState([]);
  const [listKeuangan, setListKeuangan] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // ==========================================
  // STATE MODAL / FORM (ADD & EDIT)
  // ==========================================
  const [modalType, setModalType] = useState(null);
  const [itemAktif, setItemAktif] = useState(null);
  const [isUploadingFoto, setIsUploadingFoto] = useState(false);
  const fileInputRef = useRef(null);

  // Form Anggota
  const [formAnggota, setFormAnggota] = useState({
    nama: '',
    jabatan: 'Anggota',
    sub_unit: 'RT 01 / RW 09',
    foto: '',
    status: 'Aktif'
  });

  // Form Agenda
  const [formAgenda, setFormAgenda] = useState({
    nama: '',
    tanggal: '',
    jam: '',
    lokasi: 'Graha Pemuda',
    status: 'Mendatang',
    warna: 'bg-blue-500'
  });

  // Form Keuangan
  const [formKeuangan, setFormKeuangan] = useState({
    bulan: '',
    nominal: '',
    pengeluaran: ''
  });

  const triggerNotif = (type, teks) => {
    setPesanNotif({ type, teks });
    setTimeout(() => {
      setPesanNotif(null);
    }, 4000);
  };

  // ==========================================
  // CEK SESI LOGIN SUPABASE PADA MOUNT
  // ==========================================
  useEffect(() => {
    setIsClient(true);
    let isMounted = true;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('kartar_admin_pin_auth');
    }

    const cekSesi = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (isMounted && data?.session) {
          setSession(data.session);
        }
      } catch (err) {
        console.error('Error membaca sesi Supabase:', err);
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    cekSesi();

    try {
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (isMounted) {
          setSession(newSession);
        }
      });

      return () => {
        isMounted = false;
        authListener?.subscription?.unsubscribe?.();
      };
    } catch (err) {
      console.error('Error auth listener:', err);
      return () => { isMounted = false; };
    }
  }, []);

  const isLoggedIn = !!session;

  useEffect(() => {
    if (isLoggedIn) {
      ambilSemuaData();
    }
  }, [isLoggedIn]);

  const ambilSemuaData = async () => {
    setLoadingData(true);
    setDbErrorWarning(null);
    try {
      // 1. Ambil Anggota
      const { data: dataAnggota, error: errAnggota } = await supabase
        .from('anggota')
        .select('*')
        .order('id', { ascending: true });
      
      if (errAnggota) {
        console.warn('Tabel anggota belum ada atau error:', errAnggota);
        setDbErrorWarning('Tabel database (anggota/agenda) belum dibuat di Supabase.');
      } else if (dataAnggota) {
        setListAnggota(dataAnggota);
      }

      // 2. Ambil Agenda
      const { data: dataAgenda } = await supabase
        .from('agenda')
        .select('*')
        .order('id', { ascending: true });
      if (dataAgenda) setListAgenda(dataAgenda);

      // 3. Ambil Keuangan
      const { data: dataKeuangan } = await supabase
        .from('keuangan')
        .select('*')
        .order('id', { ascending: true });
      if (dataKeuangan) setListKeuangan(dataKeuangan);

    } catch (err) {
      console.error(err);
      triggerNotif('error', 'Gagal memuat data dari database.');
    } finally {
      setLoadingData(false);
    }
  };

  // ==========================================
  // HANDLER LOGIN RESMI (SUPABASE AUTH)
  // ==========================================
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmittingAuth(true);
    setAuthError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (error) {
        setAuthError(error.message === 'Invalid login credentials' 
          ? 'Email atau Password salah. Pastikan akun telah didaftarkan di Supabase Auth.' 
          : error.message
        );
      } else {
        setSession(data.session);
        triggerNotif('sukses', 'Login berhasil! Selamat datang Admin.');
      }
    } catch (err) {
      setAuthError('Terjadi kesalahan koneksi saat login.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setSession(null);
    triggerNotif('sukses', 'Anda telah keluar dari akun admin.');
  };

  // ==========================================
  // HANDLER UPLOAD FOTO DARI FILE (HP / LAPTOP)
  // ==========================================
  const handleUploadFotoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      triggerNotif('error', 'File harus berupa gambar (JPG, PNG, atau WebP).');
      return;
    }

    setIsUploadingFoto(true);

    try {
      // 1. Coba unggah ke Supabase Storage bucket 'foto-anggota'
      const fileExt = file.name.split('.').pop();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `${Date.now()}_${sanitizedName}.${fileExt}`;
      const filePath = `anggota/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('foto-anggota')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (!uploadError && uploadData) {
        const { data: urlData } = supabase.storage
          .from('foto-anggota')
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          setFormAnggota(prev => ({ ...prev, foto: urlData.publicUrl }));
          triggerNotif('sukses', 'Foto berhasil diunggah!');
          setIsUploadingFoto(false);
          return;
        }
      }

      // 2. Fallback otomatis: Kompres gambar via Canvas (Base64)
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 350;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          setFormAnggota(prev => ({ ...prev, foto: compressedBase64 }));
          triggerNotif('sukses', 'Foto dari file berhasil dimuat!');
          setIsUploadingFoto(false);
        };
        img.src = readerEvent.target.result;
      };
      reader.readAsDataURL(file);

    } catch (err) {
      console.error('Error saat upload foto:', err);
      triggerNotif('error', 'Gagal memproses file foto.');
      setIsUploadingFoto(false);
    }
  };

  // ==========================================
  // CRUD ANGGOTA
  // ==========================================
  const bukaModalTambahAnggota = () => {
    const nextId = (listAnggota.length > 0 ? Math.max(...listAnggota.map(a => Number(a.id) || 0)) : 0) + 1;
    setFormAnggota({
      nama: '',
      jabatan: 'Anggota',
      sub_unit: 'RT 01 / RW 09',
      foto: `https://api.dicebear.com/7.x/avataaars/svg?seed=Anggota${nextId}`,
      status: 'Aktif'
    });
    setModalType('tambah_anggota');
  };

  const bukaModalEditAnggota = (item) => {
    setItemAktif(item);
    setFormAnggota({
      nama: item.nama || '',
      jabatan: item.jabatan || '',
      sub_unit: item.sub_unit || item.subUnit || 'RT 01 / RW 09',
      foto: item.foto || '',
      status: item.status || 'Aktif'
    });
    setModalType('edit_anggota');
  };

  const simpanAnggota = async (e) => {
    e.preventDefault();
    if (!formAnggota.nama.trim()) {
      triggerNotif('error', 'Nama anggota tidak boleh kosong.');
      return;
    }

    try {
      if (modalType === 'tambah_anggota') {
        const { error } = await supabase.from('anggota').insert([formAnggota]);
        if (error) throw error;
        triggerNotif('sukses', `Anggota "${formAnggota.nama}" berhasil ditambahkan!`);
      } else {
        const { error } = await supabase
          .from('anggota')
          .update(formAnggota)
          .eq('id', itemAktif.id);
        if (error) throw error;
        triggerNotif('sukses', `Data anggota "${formAnggota.nama}" berhasil diupdate!`);
      }
      setModalType(null);
      ambilSemuaData();
    } catch (err) {
      console.error(err);
      triggerNotif('error', `Gagal menyimpan: ${err.message || 'Periksa tabel anggota di Supabase'}`);
    }
  };

  const hapusAnggota = async (id, nama) => {
    if (!confirm(`Yakin ingin menghapus anggota "${nama}"?`)) return;
    try {
      const { error } = await supabase.from('anggota').delete().eq('id', id);
      if (error) throw error;
      triggerNotif('sukses', `Anggota "${nama}" berhasil dihapus.`);
      ambilSemuaData();
    } catch (err) {
      console.error(err);
      triggerNotif('error', `Gagal menghapus: ${err.message || 'Error database'}`);
    }
  };

  // ==========================================
  // CRUD AGENDA
  // ==========================================
  const bukaModalTambahAgenda = () => {
    setFormAgenda({
      nama: '',
      tanggal: '',
      jam: '19.30 WIB',
      lokasi: 'Graha Pemuda',
      status: 'Mendatang',
      warna: 'bg-blue-500'
    });
    setModalType('tambah_agenda');
  };

  const bukaModalEditAgenda = (item) => {
    setItemAktif(item);
    setFormAgenda({
      nama: item.nama || '',
      tanggal: item.tanggal || '',
      jam: item.jam || '',
      lokasi: item.lokasi || '',
      status: item.status || 'Mendatang',
      warna: item.warna || 'bg-blue-500'
    });
    setModalType('edit_agenda');
  };

  const simpanAgenda = async (e) => {
    e.preventDefault();
    if (!formAgenda.nama.trim() || !formAgenda.tanggal.trim()) {
      triggerNotif('error', 'Nama kegiatan dan tanggal harus diisi.');
      return;
    }

    try {
      if (modalType === 'tambah_agenda') {
        const { error } = await supabase.from('agenda').insert([formAgenda]);
        if (error) throw error;
        triggerNotif('sukses', `Agenda "${formAgenda.nama}" berhasil ditambahkan!`);
      } else {
        const { error } = await supabase
          .from('agenda')
          .update(formAgenda)
          .eq('id', itemAktif.id);
        if (error) throw error;
        triggerNotif('sukses', `Agenda "${formAgenda.nama}" berhasil diperbarui!`);
      }
      setModalType(null);
      ambilSemuaData();
    } catch (err) {
      console.error(err);
      triggerNotif('error', `Gagal menyimpan: ${err.message || 'Periksa tabel agenda di Supabase'}`);
    }
  };

  const hapusAgenda = async (id, nama) => {
    if (!confirm(`Yakin ingin menghapus agenda "${nama}"?`)) return;
    try {
      const { error } = await supabase.from('agenda').delete().eq('id', id);
      if (error) throw error;
      triggerNotif('sukses', `Agenda "${nama}" berhasil dihapus.`);
      ambilSemuaData();
    } catch (err) {
      console.error(err);
      triggerNotif('error', `Gagal menghapus: ${err.message || 'Error database'}`);
    }
  };

  // ==========================================
  // CRUD KEUANGAN
  // ==========================================
  const bukaModalTambahKeuangan = () => {
    setFormKeuangan({
      bulan: '',
      nominal: '',
      pengeluaran: ''
    });
    setModalType('tambah_keuangan');
  };

  const bukaModalEditKeuangan = (item) => {
    setItemAktif(item);
    setFormKeuangan({
      bulan: item.bulan || '',
      nominal: item.nominal || 0,
      pengeluaran: item.pengeluaran || 0
    });
    setModalType('edit_keuangan');
  };

  const simpanKeuangan = async (e) => {
    e.preventDefault();
    if (!formKeuangan.bulan.trim()) {
      triggerNotif('error', 'Nama bulan/periode harus diisi.');
      return;
    }

    const payload = {
      bulan: formKeuangan.bulan.trim(),
      nominal: Number(formKeuangan.nominal) || 0,
      pengeluaran: Number(formKeuangan.pengeluaran) || 0
    };

    try {
      if (modalType === 'tambah_keuangan') {
        // Hitung ID berikutnya secara manual (tabel keuangan tidak auto-increment)
        const nextId = listKeuangan.length > 0 
          ? Math.max(...listKeuangan.map(k => Number(k.id) || 0)) + 1 
          : 1;
        const { error } = await supabase.from('keuangan').insert([{ id: nextId, ...payload }]);
        if (error) throw error;
        triggerNotif('sukses', `Data kas bulan "${payload.bulan}" berhasil ditambahkan!`);
      } else {
        const { error } = await supabase
          .from('keuangan')
          .update(payload)
          .eq('id', itemAktif.id);
        if (error) throw error;
        triggerNotif('sukses', `Data kas bulan "${payload.bulan}" berhasil diperbarui!`);
      }
      setModalType(null);
      ambilSemuaData();
    } catch (err) {
      console.error(err);
      triggerNotif('error', `Gagal menyimpan: ${err.message || 'Periksa tabel keuangan di Supabase'}`);
    }
  };

  const hapusKeuangan = async (id, bulan) => {
    if (!confirm(`Yakin ingin menghapus catatan kas bulan "${bulan}"?`)) return;
    try {
      const { error } = await supabase.from('keuangan').delete().eq('id', id);
      if (error) throw error;
      triggerNotif('sukses', `Catatan kas bulan "${bulan}" berhasil dihapus.`);
      ambilSemuaData();
    } catch (err) {
      console.error(err);
      triggerNotif('error', `Gagal menghapus: ${err.message || 'Error database'}`);
    }
  };

  // Perhitungan Ringkasan Kas
  const totalKasMasuk = listKeuangan.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);
  const totalKasKeluar = listKeuangan.reduce((acc, curr) => acc + (Number(curr.pengeluaran) || 0), 0);
  const totalSaldoSaatIni = totalKasMasuk - totalKasKeluar;

  // Filter Anggota
  const filteredAnggota = listAnggota.filter(
    (a) =>
      (a.nama && a.nama.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.jabatan && a.jabatan.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (a.sub_unit && a.sub_unit.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Script SQL Singkat untuk Copy Paste
  const sqlScriptText = `-- JALANKAN DI SUPABASE SQL EDITOR:
CREATE TABLE IF NOT EXISTS public.anggota (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  nama TEXT NOT NULL,
  jabatan TEXT NOT NULL,
  sub_unit TEXT DEFAULT 'RT 01 / RW 09',
  foto TEXT,
  status TEXT DEFAULT 'Aktif',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.agenda (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  nama TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  jam TEXT NOT NULL,
  lokasi TEXT NOT NULL,
  status TEXT DEFAULT 'Mendatang',
  warna TEXT DEFAULT 'bg-blue-500',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.keuangan (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  bulan TEXT NOT NULL,
  nominal BIGINT DEFAULT 0,
  pengeluaran BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Storage bucket untuk foto anggota
INSERT INTO storage.buckets (id, name, public) VALUES ('foto-anggota', 'foto-anggota', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public Read Foto" ON storage.objects FOR SELECT USING (bucket_id = 'foto-anggota');
CREATE POLICY "Public Upload Foto" ON storage.objects FOR ALL USING (bucket_id = 'foto-anggota') WITH CHECK (bucket_id = 'foto-anggota');

ALTER TABLE public.anggota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keuangan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Anggota" ON public.anggota FOR SELECT USING (true);
CREATE POLICY "Public Read Agenda" ON public.agenda FOR SELECT USING (true);
CREATE POLICY "Public Read Keuangan" ON public.keuangan FOR SELECT USING (true);
CREATE POLICY "Full Access Anggota" ON public.anggota FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full Access Agenda" ON public.agenda FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Full Access Keuangan" ON public.keuangan FOR ALL USING (true) WITH CHECK (true);`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlScriptText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
    triggerNotif('sukses', 'Script SQL berhasil disalin!');
  };

  // ==========================================
  // TAMPILAN LOADING AWAL
  // ==========================================
  if (!isClient || authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
        <div className="flex items-center gap-3 p-4 bg-gray-900 border border-gray-800 rounded-2xl shadow-xl">
          <RefreshCw className="w-5 h-5 animate-spin text-green-400" />
          <span className="text-xs sm:text-sm font-medium">Memverifikasi keamanan admin...</span>
        </div>
      </div>
    );
  }

  // ==========================================
  // TAMPILAN FORM LOGIN KETAT (MOBILE FRIENDLY)
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-gray-900/95 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md text-gray-100">
          
          {/* Header Login */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex p-3 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 mb-1">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">Panel Admin Karang Taruna</h1>
            <p className="text-xs text-gray-400">Autentikasi resmi untuk pengurus dan pengelola data portal.</p>
          </div>

          {/* Alert Error */}
          {authError && (
            <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2.5 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Form Login Resmi */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Email Admin
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@karangtaruna.id"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/80 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-base sm:text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/80 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 text-base sm:text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingAuth}
              className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-green-600/20 transition-all flex items-center justify-center gap-2 mt-5 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              {isSubmittingAuth ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Masuk sebagai Admin</span>
                </>
              )}
            </button>
          </form>

          {/* Info Hak Akses Admin */}
          <div className="mt-6 pt-5 border-t border-gray-800/80 text-center space-y-3">
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Akses admin diamankan dengan autentikasi resmi. Pembuatan akun baru hanya dapat dilakukan melalui{' '}
              <span className="text-green-400 font-medium">Dashboard Supabase &gt; Authentication &gt; Users</span>.
            </p>
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors p-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Halaman Utama</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // ==========================================
  // TAMPILAN DASHBOARD ADMIN UTAMA (RESPONSIF HP & LAPTOP)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      
      {/* Toast Notifikasi (Responsif Layar HP & Laptop) */}
      {pesanNotif && (
        <div className="fixed top-4 inset-x-4 sm:inset-x-auto sm:top-5 sm:right-5 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-2.5 text-xs sm:text-sm font-medium justify-center sm:justify-start ${
              pesanNotif.type === 'sukses'
                ? 'bg-emerald-950/95 text-emerald-300 border-emerald-500/40 backdrop-blur-md'
                : 'bg-rose-950/95 text-rose-300 border-rose-500/40 backdrop-blur-md'
            }`}
          >
            {pesanNotif.type === 'sukses' ? (
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 shrink-0" />
            )}
            <span>{pesanNotif.teks}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          
          {/* Logo & Judul */}
          <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden">
            <div className="p-2 sm:p-2.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 shrink-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-lg font-bold text-white tracking-tight truncate">Admin Panel</h1>
                <span className="hidden xs:inline-block text-[9px] sm:text-[10px] bg-green-500/20 text-green-300 font-semibold px-2 py-0.5 rounded-full border border-green-500/30 truncate max-w-[120px] sm:max-w-none">
                  {session?.user?.email ? session.user.email.split('@')[0] : 'ADMIN'}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 truncate">Karang Taruna Unit RW 09</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link
              href="/"
              target="_blank"
              className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5 border border-slate-700 active:scale-95"
              title="Lihat Website Utama"
            >
              <span className="hidden sm:inline">Lihat Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={ambilSemuaData}
              disabled={loadingData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-slate-700 cursor-pointer active:scale-95"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loadingData ? 'animate-spin text-green-400' : ''}`} />
            </button>

            <button
              onClick={handleLogout}
              className="px-2.5 sm:px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium transition-all flex items-center gap-1 sm:gap-1.5 border border-rose-500/30 cursor-pointer active:scale-95"
              title="Keluar"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-5 sm:space-y-6 flex-grow">
        
        {/* Banner Peringatan jika tabel Supabase belum ada */}
        {dbErrorWarning && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-300 text-xs">
            <div className="flex items-start gap-2.5">
              <Database className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-200">Tabel Database Belum Lengkap:</strong>
                <p className="text-amber-300/80 mt-0.5 text-[11px] sm:text-xs">
                  Tabel <code className="bg-amber-950 px-1 py-0.5 rounded text-amber-200">anggota</code> dan <code className="bg-amber-950 px-1 py-0.5 rounded text-amber-200">agenda</code> belum dibuat di SQL Editor Supabase.
                </p>
              </div>
            </div>
            <button
              onClick={copySqlToClipboard}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-all shadow w-full sm:w-auto"
            >
              {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSql ? 'Disalin!' : 'Salin Script SQL'}</span>
            </button>
          </div>
        )}

        {/* Tab Navigation Menu (Horizontal Scroll Smooth di HP) */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-sm overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('anggota')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'anggota'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Anggota ({listAnggota.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('agenda')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'agenda'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Agenda ({listAgenda.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('keuangan')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'keuangan'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Keuangan ({listKeuangan.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ml-auto ${
              activeTab === 'sql'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Panduan SQL</span>
            <span className="sm:hidden">SQL</span>
          </button>
        </div>

        {/* ==========================================
            TAB 1: MANAJEMEN ANGGOTA
           ========================================== */}
        {activeTab === 'anggota' && (
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-xl space-y-5 sm:space-y-6">
            
            {/* Header Anggota & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Database Anggota</h2>
                <p className="text-xs text-slate-400">Kelola nama, jabatan, RT, dan foto pengurus Karang Taruna.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative w-full sm:w-auto">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama / jabatan / RT..."
                    className="w-full pl-9 pr-4 py-2.5 sm:py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <button
                  onClick={bukaModalTambahAnggota}
                  className="px-4 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer shrink-0 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Anggota</span>
                </button>
              </div>
            </div>

            {/* List Anggota (Grid Responsif) */}
            {filteredAnggota.length === 0 ? (
              <div className="text-center py-14 sm:py-16 border border-dashed border-slate-800 rounded-2xl p-4">
                <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-400">
                  {listAnggota.length === 0 ? 'Belum ada data anggota di database' : 'Anggota tidak ditemukan'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {listAnggota.length === 0
                    ? 'Klik tombol Tambah Anggota di atas untuk menambahkan anggota baru.'
                    : 'Coba kata kunci pencarian yang lain.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {filteredAnggota.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-800/40 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between transition-all group hover:bg-slate-800/80 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.foto || `https://api.dicebear.com/7.x/avataaars/svg?seed=Anggota${item.id}`}
                        alt={item.nama}
                        className="w-12 h-12 rounded-full object-cover bg-slate-700 border border-slate-600 shrink-0"
                        onError={(e) => {
                          e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='%239ca3af' viewBox='0 0 24 24'><path d='M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z'/></svg>";
                        }}
                      />
                      <div className="overflow-hidden">
                        <h4 className="text-sm font-bold text-white truncate">{item.nama}</h4>
                        <p className="text-xs text-blue-400 font-medium truncate">{item.jabatan}</p>
                        <p className="text-[10px] text-slate-400">{item.sub_unit || item.subUnit}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {item.status || 'Aktif'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => bukaModalEditAnggota(item)}
                          className="p-2 sm:p-1.5 bg-slate-700/60 hover:bg-blue-600/30 hover:text-blue-300 text-slate-300 rounded-lg transition-all cursor-pointer active:scale-95"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => hapusAnggota(item.id, item.nama)}
                          className="p-2 sm:p-1.5 bg-slate-700/60 hover:bg-rose-600/30 hover:text-rose-300 text-slate-300 rounded-lg transition-all cursor-pointer active:scale-95"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ==========================================
            TAB 2: AGENDA KEGIATAN
           ========================================== */}
        {activeTab === 'agenda' && (
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-xl space-y-5 sm:space-y-6">
            
            {/* Header Agenda */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Agenda & Jadwal Kegiatan</h2>
                <p className="text-xs text-slate-400">Atur kegiatan rapat, kerja bakti, turnamen, dan aksi sosial.</p>
              </div>

              <button
                onClick={bukaModalTambahAgenda}
                className="px-4 py-2.5 sm:py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer shrink-0 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Agenda</span>
              </button>
            </div>

            {/* List Agenda */}
            {listAgenda.length === 0 ? (
              <div className="text-center py-14 sm:py-16 border border-dashed border-slate-800 rounded-2xl p-4">
                <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-400">Belum ada agenda kegiatan di database</p>
                <p className="text-xs text-slate-500 mt-1">Klik tombol di atas untuk membuat jadwal kegiatan baru.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                {listAgenda.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-800/40 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all group shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-white">{item.nama}</h4>
                        <span className={`text-[10px] text-white font-bold px-2 py-0.5 rounded shadow-sm shrink-0 ${item.warna || 'bg-blue-500'}`}>
                          {item.status}
                        </span>
                      </div>
                      
                      <div className="text-xs text-slate-300 space-y-1">
                        <p><span className="text-slate-500">Waktu:</span> {item.tanggal} {item.jam ? `(${item.jam})` : ''}</p>
                        <p><span className="text-slate-500">Lokasi:</span> {item.lokasi}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                      <button
                        onClick={() => bukaModalEditAgenda(item)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-purple-600/30 hover:text-purple-300 text-slate-300 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => hapusAgenda(item.id, item.nama)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-rose-600/30 hover:text-rose-300 text-slate-300 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ==========================================
            TAB 3: KAS & KEUANGAN (MOBILE OPTIMIZED)
           ========================================== */}
        {activeTab === 'keuangan' && (
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-xl space-y-5 sm:space-y-6">
            
            {/* KPI Cards Keuangan */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-4 sm:p-5 bg-emerald-950/40 border border-emerald-500/20 rounded-2xl">
                <p className="text-[10px] sm:text-[11px] font-bold text-emerald-400 tracking-wider uppercase">Total Kas Masuk</p>
                <h3 className="text-xl sm:text-2xl font-extrabold text-emerald-400 mt-1">
                  Rp {totalKasMasuk.toLocaleString('id-ID')}
                </h3>
              </div>

              <div className="p-4 sm:p-5 bg-rose-950/40 border border-rose-500/20 rounded-2xl">
                <p className="text-[10px] sm:text-[11px] font-bold text-rose-400 tracking-wider uppercase">Total Pengeluaran</p>
                <h3 className="text-xl sm:text-2xl font-extrabold text-rose-400 mt-1">
                  Rp {totalKasKeluar.toLocaleString('id-ID')}
                </h3>
              </div>

              <div className="p-4 sm:p-5 bg-blue-950/40 border border-blue-500/20 rounded-2xl">
                <p className="text-[10px] sm:text-[11px] font-bold text-blue-400 tracking-wider uppercase">Saldo Kas Saat Ini</p>
                <h3 className="text-xl sm:text-2xl font-extrabold text-blue-400 mt-1">
                  Rp {totalSaldoSaatIni.toLocaleString('id-ID')}
                </h3>
              </div>
            </div>

            {/* Header Catatan Kas */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Catatan Kas Bulanan</h2>
                <p className="text-xs text-slate-400">Data ini langsung disinkronkan ke grafik di halaman utama.</p>
              </div>

              <button
                onClick={bukaModalTambahKeuangan}
                className="px-4 py-2.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer shrink-0 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Catatan Kas</span>
              </button>
            </div>

            {/* Tampilan Khusus Mobile (Card View) */}
            <div className="block sm:hidden space-y-3">
              {listKeuangan.length === 0 ? (
                <div className="text-center py-10 text-slate-500 border border-dashed border-slate-800 rounded-2xl text-xs">
                  Belum ada catatan keuangan.
                </div>
              ) : (
                listKeuangan.map((item) => {
                  const masuk = Number(item.nominal) || 0;
                  const keluar = Number(item.pengeluaran) || 0;
                  const selisih = masuk - keluar;

                  return (
                    <div key={item.id} className="bg-slate-800/50 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                        <span className="font-bold text-sm text-white">{item.bulan}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${selisih >= 0 ? 'text-blue-400 bg-blue-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                          Saldo: Rp {selisih.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Kas Masuk</span>
                          <span className="text-emerald-400 font-bold">Rp {masuk.toLocaleString('id-ID')}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Pengeluaran</span>
                          <span className="text-rose-400 font-bold">Rp {keluar.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => bukaModalEditKeuangan(item)}
                          className="px-3 py-1 bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => hapusKeuangan(item.id, item.bulan)}
                          className="px-3 py-1 bg-rose-500/20 text-rose-300 rounded-lg text-xs font-medium flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Tampilan Desktop (Table View) */}
            <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-5 py-3.5">Periode / Bulan</th>
                    <th className="px-5 py-3.5">Kas Masuk (Rp)</th>
                    <th className="px-5 py-3.5">Pengeluaran (Rp)</th>
                    <th className="px-5 py-3.5">Selisih</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                  {listKeuangan.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-500">
                        Belum ada catatan keuangan di tabel database.
                      </td>
                    </tr>
                  ) : (
                    listKeuangan.map((item) => {
                      const masuk = Number(item.nominal) || 0;
                      const keluar = Number(item.pengeluaran) || 0;
                      const selisih = masuk - keluar;

                      return (
                        <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-4 font-bold text-white">{item.bulan}</td>
                          <td className="px-5 py-4 text-emerald-400 font-semibold">
                            Rp {masuk.toLocaleString('id-ID')}
                          </td>
                          <td className="px-5 py-4 text-rose-400 font-semibold">
                            Rp {keluar.toLocaleString('id-ID')}
                          </td>
                          <td className="px-5 py-4 font-semibold">
                            <span className={selisih >= 0 ? 'text-blue-400' : 'text-rose-400'}>
                              Rp {selisih.toLocaleString('id-ID')}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => bukaModalEditKeuangan(item)}
                                className="p-1.5 bg-slate-800 hover:bg-emerald-600/30 hover:text-emerald-300 text-slate-300 rounded-lg transition-all cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => hapusKeuangan(item.id, item.bulan)}
                                className="p-1.5 bg-slate-800 hover:bg-rose-600/30 hover:text-rose-300 text-slate-300 rounded-lg transition-all cursor-pointer"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ==========================================
            TAB 4: PANDUAN SQL & DATABASE
           ========================================== */}
        {activeTab === 'sql' && (
          <div className="bg-slate-900/70 border border-slate-800/80 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4 sm:space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">Panduan Database & Storage</h2>
                <p className="text-xs text-slate-400">
                  Script SQL lengkap untuk tabel `anggota`, `agenda`, `keuangan`, serta bucket storage untuk upload foto.
                </p>
              </div>

              <button
                onClick={copySqlToClipboard}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow active:scale-95"
              >
                {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSql ? 'Tersalin ke Clipboard!' : 'Salin Semua SQL'}</span>
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 sm:p-4 overflow-x-auto text-[11px] sm:text-xs font-mono text-emerald-400 leading-relaxed max-h-72 sm:max-h-96 overflow-y-auto">
              <pre>{sqlScriptText}</pre>
            </div>

            <div className="p-3.5 sm:p-4 bg-blue-950/30 border border-blue-500/20 rounded-2xl text-blue-300 text-xs space-y-1">
              <strong className="text-blue-200">Cara Menjalankan:</strong>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 pt-1 text-[11px] sm:text-xs">
                <li>Buka <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-400 underline">Dashboard Supabase</a>.</li>
                <li>Pilih proyek Anda &gt; buka menu <strong>SQL Editor</strong> di bilah samping.</li>
                <li>Klik <strong>New Query</strong>, tempel teks SQL di atas, lalu klik <strong>Run</strong>.</li>
              </ol>
            </div>
          </div>
        )}

      </main>

      {/* ==========================================
          MODAL FORM POPUP (RESPONSIF MOBILE / BOTTOM SHEET TOUCH)
         ========================================== */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-5 sm:zoom-in-95 duration-150 max-h-[88vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h3 className="text-sm sm:text-base font-bold text-white">
                {modalType === 'tambah_anggota' && 'Tambah Anggota Baru'}
                {modalType === 'edit_anggota' && 'Edit Data Anggota'}
                {modalType === 'tambah_agenda' && 'Tambah Agenda Kegiatan'}
                {modalType === 'edit_agenda' && 'Edit Agenda Kegiatan'}
                {modalType === 'tambah_keuangan' && 'Tambah Catatan Kas'}
                {modalType === 'edit_keuangan' && 'Edit Catatan Kas'}
              </h3>
              <button
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-white text-base font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* FORM ANGGOTA (DENGAN KAMERA & GALERI HP) */}
            {(modalType === 'tambah_anggota' || modalType === 'edit_anggota') && (
              <form onSubmit={simpanAnggota} className="space-y-4">
                
                {/* Bagian Upload Foto */}
                <div className="p-3.5 sm:p-4 bg-slate-800/60 border border-slate-700/80 rounded-2xl space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">
                    Foto Profil Anggota
                  </label>

                  <div className="flex flex-col xs:flex-row items-center gap-3.5 sm:gap-4">
                    
                    {/* Preview Foto */}
                    <div className="relative group shrink-0">
                      <img
                        src={formAnggota.foto || `https://api.dicebear.com/7.x/avataaars/svg?seed=Preview`}
                        alt="Preview Foto"
                        className="w-18 h-18 sm:w-20 sm:h-20 rounded-full object-cover bg-slate-700 border-2 border-blue-500/50 shadow-md"
                        onError={(e) => {
                          e.target.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='%239ca3af' viewBox='0 0 24 24'><path d='M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z'/></svg>";
                        }}
                      />
                      {formAnggota.foto && (
                        <button
                          type="button"
                          onClick={() => setFormAnggota({ ...formAnggota, foto: '' })}
                          className="absolute -top-1 -right-1 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow cursor-pointer"
                          title="Hapus Foto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Tombol Upload File & Alternatif */}
                    <div className="space-y-2 w-full text-center xs:text-left">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleUploadFotoFile}
                        className="hidden"
                      />

                      <div className="flex flex-wrap items-center justify-center xs:justify-start gap-2">
                        <button
                          type="button"
                          disabled={isUploadingFoto}
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                        >
                          {isUploadingFoto ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Mengunggah...</span>
                            </>
                          ) : (
                            <>
                              <Camera className="w-3.5 h-3.5" />
                              <span>Pilih / Foto HP</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setFormAnggota({
                              ...formAnggota,
                              foto: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(formAnggota.nama || 'Avatar' + Date.now())}`
                            })
                          }
                          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl text-[11px] font-semibold text-slate-200 cursor-pointer flex items-center gap-1 transition-all active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Avatar AI</span>
                        </button>
                      </div>

                      <p className="text-[10px] text-slate-400">
                        Bisa ambil foto kamera HP atau pilih dari galeri / file.
                      </p>
                    </div>

                  </div>

                  <div className="pt-1">
                    <input
                      type="text"
                      placeholder="Atau tempel URL foto online di sini..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-[11px] text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={formAnggota.foto}
                      onChange={(e) => setFormAnggota({ ...formAnggota, foto: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Muhammad Falah"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-xs"
                    value={formAnggota.nama}
                    onChange={(e) => setFormAnggota({ ...formAnggota, nama: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Jabatan</label>
                    <input
                      type="text"
                      required
                      placeholder="Ketua / Sekretaris / Anggota"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-xs"
                      value={formAnggota.jabatan}
                      onChange={(e) => setFormAnggota({ ...formAnggota, jabatan: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Sub Unit / RT</label>
                    <input
                      type="text"
                      placeholder="RT 05 / RW 09"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-xs"
                      value={formAnggota.sub_unit}
                      onChange={(e) => setFormAnggota({ ...formAnggota, sub_unit: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Status Keanggotaan</label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base sm:text-xs"
                    value={formAnggota.status}
                    onChange={(e) => setFormAnggota({ ...formAnggota, status: e.target.value })}
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Non-Aktif">Non-Aktif</option>
                    <option value="Alumni">Alumni</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30 cursor-pointer"
                  >
                    Simpan Data
                  </button>
                </div>
              </form>
            )}

            {/* FORM AGENDA */}
            {(modalType === 'tambah_agenda' || modalType === 'edit_agenda') && (
              <form onSubmit={simpanAgenda} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Kegiatan</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Rapat Kerja Anggaran"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-base sm:text-xs"
                    value={formAgenda.nama}
                    onChange={(e) => setFormAgenda({ ...formAgenda, nama: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Tanggal</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 15 Juli 2026"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-base sm:text-xs"
                      value={formAgenda.tanggal}
                      onChange={(e) => setFormAgenda({ ...formAgenda, tanggal: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Jam / Waktu</label>
                    <input
                      type="text"
                      placeholder="Contoh: 19.30 WIB"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-base sm:text-xs"
                      value={formAgenda.jam}
                      onChange={(e) => setFormAgenda({ ...formAgenda, jam: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Lokasi Kegiatan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Graha Pemuda / Lapangan RW 09"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-base sm:text-xs"
                    value={formAgenda.lokasi}
                    onChange={(e) => setFormAgenda({ ...formAgenda, lokasi: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Status Badge</label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-base sm:text-xs"
                      value={formAgenda.status}
                      onChange={(e) => setFormAgenda({ ...formAgenda, status: e.target.value })}
                    >
                      <option value="Segera">Segera</option>
                      <option value="Mendatang">Mendatang</option>
                      <option value="Selesai">Selesai</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Warna Label</label>
                    <select
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-base sm:text-xs"
                      value={formAgenda.warna}
                      onChange={(e) => setFormAgenda({ ...formAgenda, warna: e.target.value })}
                    >
                      <option value="bg-amber-500">Kuning / Amber (Segera)</option>
                      <option value="bg-blue-500">Biru (Mendatang)</option>
                      <option value="bg-emerald-500">Hijau (Selesai/Aman)</option>
                      <option value="bg-purple-500">Ungu (Spesial)</option>
                      <option value="bg-rose-500">Merah (Penting)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                  >
                    Simpan Agenda
                  </button>
                </div>
              </form>
            )}

            {/* FORM KEUANGAN */}
            {(modalType === 'tambah_keuangan' || modalType === 'edit_keuangan') && (
              <form onSubmit={simpanKeuangan} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Bulan / Periode</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Juli 2026"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base sm:text-xs"
                    value={formKeuangan.bulan}
                    onChange={(e) => setFormKeuangan({ ...formKeuangan, bulan: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Kas Masuk (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 1500000"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base sm:text-xs"
                    value={formKeuangan.nominal}
                    onChange={(e) => setFormKeuangan({ ...formKeuangan, nominal: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Pengeluaran (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 850000"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base sm:text-xs"
                    value={formKeuangan.pengeluaran}
                    onChange={(e) => setFormKeuangan({ ...formKeuangan, pengeluaran: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
                  >
                    Simpan Kas
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
