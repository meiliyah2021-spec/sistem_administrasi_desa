import { Role, User, Keluarga, Penduduk, Layanan, Pengajuan, RiwayatStatus, AuditLog, LogPenduduk } from './types';

// Seed Administrative Persons
export const SEED_USERS: User[] = [
  {
    id_petugas: 1,
    nama_petugas: 'Administrator Desa',
    username: 'admin',
    jabatan: 'Kepala Bidang IT',
    nama_role: Role.ADMIN
  },
  {
    id_petugas: 2,
    nama_petugas: 'Budi Santoso',
    username: 'petugas',
    jabatan: 'Staf Administrasi',
    nama_role: Role.PETUGAS
  }
];

// Seed Services
export const SEED_LAYANAN: Layanan[] = [
  {
    id_layanan: 1,
    nama_layanan: 'Kartu Tanda Penduduk (KTP) Baru',
    deskripsi: 'Pengajuan pembuatan KTP pertama kali maupun penggantian KTP rusak/hilang',
    status_aktif: 'Y'
  },
  {
    id_layanan: 2,
    nama_layanan: 'Kartu Keluarga (KK) Baru/Revisi',
    deskripsi: 'Pengajuan penerbitan Kartu Keluarga karena pernikahan, kelahiran, atau perubahan data',
    status_aktif: 'Y'
  },
  {
    id_layanan: 3,
    nama_layanan: 'Surat Keterangan Catatan Kepolisian (SKCK)',
    deskripsi: 'Surat pengantar dari desa untuk pembuatan SKCK di Polsek/Polres',
    status_aktif: 'Y'
  },
  {
    id_layanan: 4,
    nama_layanan: 'Surat Keterangan Kematian',
    deskripsi: 'Surat keterangan meninggal dunia untuk mengurus akta kematian',
    status_aktif: 'Y'
  },
  {
    id_layanan: 5,
    nama_layanan: 'Surat Keterangan Usaha (SKU)',
    deskripsi: 'Surat keterangan kepemilikan usaha untuk pengajuan kredit bank atau legalitas',
    status_aktif: 'Y'
  },
  {
    id_layanan: 6,
    nama_layanan: 'Layanan Darurat Ambulans Desa',
    deskripsi: 'Layanan peminjaman ambulans desa untuk kegawatdaruratan warga (Layanan Nonaktif)',
    status_aktif: 'N'
  }
];

// Seed Keluarga
export const SEED_KELUARGA: Keluarga[] = [
  {
    id_keluarga: 1,
    no_kk: '3201234567890001',
    alamat: 'Jl. Merdeka No. 10, RT 01 RW 02, Desa Sukamakmur',
    id_kepala_keluarga: 1
  },
  {
    id_keluarga: 2,
    no_kk: '3201234567890002',
    alamat: 'Dusun Harapan Indah RT 03 RW 05, Desa Sukamakmur',
    id_kepala_keluarga: 4
  }
];

// Seed Citizens (Penduduk)
export const SEED_PENDUDUK: Penduduk[] = [
  {
    id_penduduk: 1,
    nik: '3201231204850001',
    nama: 'Ahmad Hartono',
    jenis_kelamin: 'L',
    tanggal_lahir: '1985-04-12',
    id_keluarga: 1
  },
  {
    id_penduduk: 2,
    nik: '3201234509880002',
    nama: 'Lilis Setyowati',
    jenis_kelamin: 'P',
    tanggal_lahir: '1988-09-05',
    id_keluarga: 1
  },
  {
    id_penduduk: 3,
    nik: '3201232112100003',
    nama: 'Rahmat Hartono',
    jenis_kelamin: 'L',
    tanggal_lahir: '2010-12-21',
    id_keluarga: 1
  },
  {
    id_penduduk: 4,
    nik: '3201231508780004',
    nama: 'Deni Setiawan',
    jenis_kelamin: 'L',
    tanggal_lahir: '1978-08-15',
    id_keluarga: 2
  },
  {
    id_penduduk: 5,
    nik: '3201236101820005',
    nama: 'Ratna Sari',
    jenis_kelamin: 'P',
    tanggal_lahir: '1982-01-21',
    id_keluarga: 2
  }
];

// Seed Applications
export const SEED_PENGAJUAN: Pengajuan[] = [
  {
    id_pengajuan: 1,
    id_penduduk: 1,
    nama_penduduk: 'Ahmad Hartono',
    nik_penduduk: '3201231204850001',
    no_kk_penduduk: '3201234567890001',
    alamat_penduduk: 'Jl. Merdeka No. 10, RT 01 RW 02, Desa Sukamakmur',
    id_petugas: 2,
    nama_petugas: 'Budi Santoso',
    id_status: 3,
    status: 'SELESAI',
    id_layanan: 1,
    layanan: 'Kartu Tanda Penduduk (KTP) Baru',
    tanggal_pengajuan: '2026-05-11 08:30:00',
    catatan_status: 'KTP baru sudah diserahkan ke kepala keluarga'
  },
  {
    id_pengajuan: 2,
    id_penduduk: 2,
    nama_penduduk: 'Lilis Setyowati',
    nik_penduduk: '3201234509880002',
    no_kk_penduduk: '3201234567890001',
    alamat_penduduk: 'Jl. Merdeka No. 10, RT 01 RW 02, Desa Sukamakmur',
    id_petugas: 2,
    nama_petugas: 'Budi Santoso',
    id_status: 1,
    status: 'MENUNGGU',
    id_layanan: 2,
    layanan: 'Kartu Keluarga (KK) Baru/Revisi',
    tanggal_pengajuan: '2026-05-13 14:15:00',
    catatan_status: 'Menunggu berkas foto copy buku nikah dilegalisir'
  },
  {
    id_pengajuan: 3,
    id_penduduk: 4,
    nama_penduduk: 'Deni Setiawan',
    nik_penduduk: '3201231508780004',
    no_kk_penduduk: '3201234567890002',
    alamat_penduduk: 'Dusun Harapan Indah RT 03 RW 05, Desa Sukamakmur',
    id_petugas: 1,
    nama_petugas: 'Administrator Desa',
    id_status: 2,
    status: 'DIPROSES',
    id_layanan: 5,
    layanan: 'Surat Keterangan Usaha (SKU)',
    tanggal_pengajuan: '2026-05-20 10:00:00',
    catatan_status: 'Sedang divalidasi kepemilikan bangunan usaha fisiknya'
  },
  {
    // STALE - Older than 7 days, perfect for demonstrating automated status updates!
    id_pengajuan: 4,
    id_penduduk: 5,
    nama_penduduk: 'Ratna Sari',
    nik_penduduk: '3201236101820005',
    no_kk_penduduk: '3201234567890002',
    alamat_penduduk: 'Dusun Harapan Indah RT 03 RW 05, Desa Sukamakmur',
    id_petugas: 2,
    nama_petugas: 'Budi Santoso',
    id_status: 1,
    status: 'MENUNGGU',
    id_layanan: 3,
    layanan: 'Surat Keterangan Catatan Kepolisian (SKCK)',
    tanggal_pengajuan: '2026-05-02 09:00:00', // Long time ago!
    catatan_status: 'Pengajuan SKCK lama ditinggal pemohon'
  }
];

// Seed Riwayat Status
export const SEED_RIWAYAT: RiwayatStatus[] = [
  {
    id_riwayat: 1,
    id_pengajuan: 1,
    status: 'MENUNGGU',
    petugas: 'Budi Santoso',
    tanggal_update: '2026-05-11 08:30:00',
    catatan: 'Berkas KTP diterima lengkap'
  },
  {
    id_riwayat: 2,
    id_pengajuan: 1,
    status: 'DIPROSES',
    petugas: 'Budi Santoso',
    tanggal_update: '2026-05-12 11:20:00',
    catatan: 'KTP dalam proses cetak di Kecamatan'
  },
  {
    id_riwayat: 3,
    id_pengajuan: 1,
    status: 'SELESAI',
    petugas: 'Budi Santoso',
    tanggal_update: '2026-05-13 15:45:00',
    catatan: 'Selesai dan terdistribusi'
  },
  {
    id_riwayat: 4,
    id_pengajuan: 2,
    status: 'MENUNGGU',
    petugas: 'Budi Santoso',
    tanggal_update: '2026-05-13 14:15:00',
    catatan: 'Draft pengajuan keluarga baru diterima'
  },
  {
    id_riwayat: 5,
    id_pengajuan: 3,
    status: 'MENUNGGU',
    petugas: 'Administrator Desa',
    tanggal_update: '2026-05-20 10:00:00',
    catatan: 'Pengajuan SKU diterima'
  },
  {
    id_riwayat: 6,
    id_pengajuan: 3,
    status: 'DIPROSES',
    petugas: 'Administrator Desa',
    tanggal_update: '2026-05-21 00:10:00',
    catatan: 'Proses verifikasi lapangan'
  },
  {
    id_riwayat: 7,
    id_pengajuan: 4,
    status: 'MENUNGGU',
    petugas: 'Budi Santoso',
    tanggal_update: '2026-05-02 09:00:00',
    catatan: 'Berkas masuk, pemohon belum melengkapi surat pengantar RT'
  }
];

// Seed Audit Logs
export const SEED_AUDITS: AuditLog[] = [
  {
    id_log: 1,
    nama_tabel: 'PENDUDUK',
    id_data: 1,
    aksi: 'INSERT',
    waktu_aksi: '2026-05-10 10:15:22',
    nama_user: 'SYSTEM',
    keterangan: 'Operasi INSERT penduduk baru. NIK: 3201231204850001, Nama: Ahmad Hartono'
  },
  {
    id_log: 2,
    nama_tabel: 'PENDUDUK',
    id_data: 2,
    aksi: 'INSERT',
    waktu_aksi: '2026-05-10 10:18:11',
    nama_user: 'SYSTEM',
    keterangan: 'Operasi INSERT penduduk baru. NIK: 3201234509880002, Nama: Lilis Setyowati'
  },
  {
    id_log: 3,
    nama_tabel: 'KELUARGA',
    id_data: 1,
    aksi: 'UPDATE',
    waktu_aksi: '2026-05-10 10:20:00',
    nama_user: 'SYSTEM',
    keterangan: 'Pengaturan kepala keluarga untuk KK 3201234567890001'
  },
  {
    id_log: 4,
    nama_tabel: 'PENGAJUAN',
    id_data: 1,
    aksi: 'INSERT',
    waktu_aksi: '2026-05-11 08:30:00',
    nama_user: 'SYSTEM',
    keterangan: 'Pembuatan berkas pengajuan baru untuk Penduduk ID: 1 dengan Status ID: 1'
  }
];

// Seed Log Penduduk
export const SEED_LOG_PENDUDUK: LogPenduduk[] = [
  {
    id_log: 1,
    aksi: 'INSERT',
    id_penduduk: 1,
    nik: '3201231204850001',
    nama_lama: null,
    nama_baru: 'Ahmad Hartono',
    jenis_kelamin: 'L',
    waktu_log: '2026-05-10 10:15:22',
    keterangan: 'Menambahkan penduduk baru: Ahmad Hartono'
  },
  {
    id_log: 2,
    aksi: 'INSERT',
    id_penduduk: 2,
    nik: '3201234509880002',
    nama_lama: null,
    nama_baru: 'Lilis Setyowati',
    jenis_kelamin: 'P',
    waktu_log: '2026-05-10 10:18:11',
    keterangan: 'Menambahkan penduduk baru: Lilis Setyowati'
  }
];
