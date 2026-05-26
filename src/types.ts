export enum Role {
  ADMIN = 'ADMIN',
  PETUGAS = 'PETUGAS',
}

export interface User {
  id_petugas: number;
  nama_petugas: string;
  username: string;
  jabatan: string;
  nama_role: Role;
}

export interface Keluarga {
  id_keluarga: number;
  no_kk: string;
  alamat: string;
  id_kepala_keluarga: number | null;
  nama_kepala_keluarga?: string;
  jumlah_anggota?: number;
}

export interface Penduduk {
  id_penduduk: number;
  nik: string;
  nama: string;
  jenis_kelamin: 'L' | 'P';
  tanggal_lahir: string; // YYYY-MM-DD
  id_keluarga: number;
  no_kk?: string;
  alamat?: string;
}

export interface Layanan {
  id_layanan: number;
  nama_layanan: string;
  deskripsi: string;
  status_aktif: 'Y' | 'N';
}

export interface StatusPengajuan {
  id_status: number;
  nama_status: 'MENUNGGU' | 'DIPROSES' | 'SELESAI' | 'DITOLAK' | 'KADALUARSA';
}

export interface Pengajuan {
  id_pengajuan: number;
  id_penduduk: number;
  nama_penduduk: string;
  nik_penduduk: string;
  no_kk_penduduk: string;
  alamat_penduduk: string;
  id_petugas: number;
  nama_petugas: string;
  id_status: number;
  status: 'MENUNGGU' | 'DIPROSES' | 'SELESAI' | 'DITOLAK' | 'KADALUARSA';
  id_layanan: number;
  layanan: string;
  tanggal_pengajuan: string; // YYYY-MM-DD THH:mm:SS
  catatan_status: string;
}

export interface RiwayatStatus {
  id_riwayat: number;
  id_pengajuan: number;
  status: 'MENUNGGU' | 'DIPROSES' | 'SELESAI' | 'DITOLAK' | 'KADALUARSA';
  petugas: string;
  tanggal_update: string;
  catatan: string;
}

export interface AuditLog {
  id_log: number;
  nama_tabel: string;
  id_data: number;
  aksi: 'INSERT' | 'UPDATE' | 'DELETE';
  waktu_aksi: string;
  nama_user: string;
  keterangan: string;
}

export interface LogPenduduk {
  id_log: number;
  aksi: 'INSERT' | 'UPDATE' | 'DELETE';
  id_penduduk: number;
  nik: string;
  nama_lama: string | null;
  nama_baru: string | null;
  jenis_kelamin: 'L' | 'P';
  waktu_log: string;
  keterangan: string;
}
