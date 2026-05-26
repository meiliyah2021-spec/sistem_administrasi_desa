import React, { useEffect, useState } from 'react';
import { 
  Users, Home, Server, FileText, ShieldAlert, Cpu, 
  Database, LogOut, ArrowLeft, Sliders, Menu, ChevronRight, UserCheck, KeyRound, AlertCircle, History 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Import Types
import { Role, User, Keluarga, Penduduk, Layanan, Pengajuan, RiwayatStatus, AuditLog, LogPenduduk } from './types';

// Import Seed Datasets
import { 
  SEED_USERS, SEED_KELUARGA, SEED_PENDUDUK, 
  SEED_LAYANAN, SEED_PENGAJUAN, SEED_RIWAYAT, 
  SEED_AUDITS, SEED_LOG_PENDUDUK 
} from './data';

// Import Modular Page Views
import InspectorConsole from './components/InspectorConsole';
import DashboardView from './components/DashboardView';
import KeluargaView from './components/KeluargaView';
import PendudukView from './components/PendudukView';
import LayananView from './components/LayananView';
import PengajuanView from './components/PengajuanView';
import AuditingView from './components/AuditingView';
import LaporanView from './components/LaporanView';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Core Data states
  const [families, setFamilies] = useState<Keluarga[]>([]);
  const [residents, setResidents] = useState<Penduduk[]>([]);
  const [services, setServices] = useState<Layanan[]>([]);
  const [submissions, setSubmissions] = useState<Pengajuan[]>([]);
  const [historyLogs, setHistoryLogs] = useState<RiwayatStatus[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [residentTriggerLogs, setResidentTriggerLogs] = useState<LogPenduduk[]>([]);
  const loadPenduduk = async () => {
    const res = await fetch("http://127.0.0.1:5000/api/penduduk");
    const data = await res.json();
    setResidents(data);
  };

  const loadKeluarga = async () => {
    const res = await fetch("http://127.0.0.1:5000/api/keluarga");
    const data = await res.json();
    setFamilies(data);
  };

  useEffect(() => {
  fetch("http://127.0.0.1:5000/api/penduduk")
    .then(res => res.json())
    .then(data => setResidents(data));

  fetch("http://127.0.0.1:5000/api/keluarga")
    .then(res => res.json())
    .then(data => setFamilies(data));

  fetch("http://127.0.0.1:5000/api/layanan")
    .then(res => res.json())
    .then(data => setServices(data));

  fetch("http://127.0.0.1:5000/api/pengajuan")
    .then(res => res.json())
    .then(data => setSubmissions(data));

  fetch("http://127.0.0.1:5000/api/audit")
    .then(res => res.json())
    .then(data => setAuditLogs(data));
}, []);

  // App Navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSubId, setSelectedSubId] = useState<number | null>(null);

  // Live Inspector Code panel states
  const [inspectAction, setInspectAction] = useState('Web booting - Sistem Administrasi Kependudukan siap.');
  const [inspectSql, setInspectSql] = useState('CONNECT system/oracle_village_password@xe;');
  const [inspectPlsql, setInspectPlsql] = useState('-- PL/SQL Engine Initialized.\n-- All custom packages, triggers, indices compiled successfully.');
  const [inspectFlask, setInspectFlask] = useState('# app.py Booting\nfrom flask import Flask\napp = Flask(__name__)\n# Established database thin pool.');

  const updateInspection = (action: string, sql: string, plsql: string, flask: string) => {
    setInspectAction(action);
    setInspectSql(sql);
    setInspectPlsql(plsql);
    setInspectFlask(flask);
  };

  // 1. Authentication Logic
   const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoginError(null);

  try {
    const response = await fetch("http://127.0.0.1:5000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: loginUsername,
        password: loginPassword
      })
    });

    const result = await response.json();

    if (result.success) {
      setCurrentUser(result.user);

      updateInspection(
        `Berhasil login sebagai ${result.user.nama_petugas}`,
        `SELECT p.id_petugas, p.nama_petugas, r.nama_role FROM petugas p JOIN role_petugas r ON p.id_role = r.id_role WHERE p.username = '${loginUsername}';`,
        `-- Login berhasil dicek dari tabel PETUGAS Oracle`,
        `POST /api/login berhasil mengembalikan user dari Oracle`
      );
    } else {
      setLoginError(result.message || "Login gagal");
    }
  } catch (error) {
    setLoginError("Tidak bisa terhubung ke backend Flask");
  }
}; 

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginUsername('admin');
    setLoginPassword('admin');
    setAuditLogs([])
    updateInspection(
      "Melakukan logout sesi admin",
      "-- Session destroyed",
      "-- Menghilangkan token hak akses",
      "# routes/auth_routes.py\n@auth_bp.route('/logout')\ndef logout():\n    session.clear()\n    return redirect(url_for('auth.login'))"
    );
  };

  // 2. CRUD Keluarga Simulations
  const handleAddKeluarga = (no_kk: string, alamat: string) => {
    // Duplication pre-check
    const isDup = families.some(f => f.no_kk === no_kk);
    if (isDup) {
      alert("Error DBMS: ORA-20021: Kartu Keluarga sudah terdaftar di database!");
      return;
    }

    const newId = families.length > 0 ? Math.max(...families.map(f => f.id_keluarga)) + 1 : 1;
    const newKkRecord: Keluarga = {
      id_keluarga: newId,
      no_kk,
      alamat,
      id_kepala_keluarga: null,
      nama_kepala_keluarga: undefined,
      jumlah_anggota: 0
    };

    setFamilies([...families, newKkRecord]);

    // Push into Audit Log
    const logId = auditLogs.length + 1;
    const newAudit: AuditLog = {
      id_log: logId,
      nama_tabel: 'KELUARGA',
      id_data: newId,
      aksi: 'INSERT',
      waktu_aksi: new Date().toISOString().replace('T', ' ').substring(0, 19),
      nama_user: currentUser?.username || 'SYSTEM',
      keterangan: `Operasi INSERT KK baru. No KK: ${no_kk}, Alamat: ${alamat}`
    };
    setAuditLogs([newAudit, ...auditLogs]);

    updateInspection(
      `Menambahkan KK baru: ${no_kk}`,
      `INSERT INTO keluarga (no_kk, alamat) VALUES ('${no_kk}', '${alamat}');`,
      `-- PL/SQL Stored Procedure: tambah_keluarga\nCREATE OR REPLACE PROCEDURE tambah_keluarga (\n   p_no_kk IN VARCHAR2,\n   p_alamat IN VARCHAR2,\n   p_id OUT NUMBER\n) IS ...`,
      `# routes/keluarga_routes.py\nKeluargaService.create('${no_kk}', '${alamat}')`
    );
  };

  const handleEditKeluarga = (id: number, no_kk: string, alamat: string, h_id: number | null) => {
    const headObj = residents.find(r => r.id_penduduk === h_id);
    const updated = families.map(f => {
      if (f.id_keluarga === id) {
        return {
          ...f,
          no_kk,
          alamat,
          id_kepala_keluarga: h_id,
          nama_kepala_keluarga: headObj ? headObj.nama : undefined
        };
      }
      return f;
    });
    setFamilies(updated);

    // Push Audit Log
    const newAudit: AuditLog = {
      id_log: auditLogs.length + 1,
      nama_tabel: 'KELUARGA',
      id_data: id,
      aksi: 'UPDATE',
      waktu_aksi: new Date().toISOString().replace('T', ' ').substring(0, 19),
      nama_user: currentUser?.username || 'SYSTEM',
      keterangan: `Operasi UPDATE KK ID ${id}. No KK: ${no_kk}, Alamat: ${alamat}, Kepala: ${headObj?.nama || 'null'}`
    };
    setAuditLogs([newAudit, ...auditLogs]);

    updateInspection(
      `Memperbarui profil KK ID ${id}`,
      `UPDATE keluarga SET no_kk = '${no_kk}', alamat = '${alamat}', id_kepala_keluarga = ${h_id || 'NULL'} WHERE id_keluarga = ${id};`,
      `-- PL/SQL: update_keluarga\nCREATE OR REPLACE PROCEDURE update_keluarga (...)\n-- Memperbaiki alamat administrasi`,
      `# services/keluarga_service.py\nKeluargaService.update(${id}, '${no_kk}', '${alamat}', ${h_id})`
    );
  };

  const handleDeleteKeluarga = (id: number) => {
    // Delete KK will cascade delete residents inside it (implements DB Cascade delete schema)
    const associatedResidents = residents.filter(r => r.id_keluarga === id);
    const resIds = associatedResidents.map(r => r.id_penduduk);

    setFamilies(families.filter(f => f.id_keluarga !== id));
    setResidents(residents.filter(r => r.id_keluarga !== id));
    setSubmissions(submissions.filter(s => !resIds.includes(s.id_penduduk)));

    const newAudit: AuditLog = {
      id_log: auditLogs.length + 1,
      nama_tabel: 'KELUARGA',
      id_data: id,
      aksi: 'DELETE',
      waktu_aksi: new Date().toISOString().replace('T', ' ').substring(0, 19),
      nama_user: currentUser?.username || 'SYSTEM',
      keterangan: `Operasi CASCADE DELETE KK ID ${id} (Menghapus keluarga dan semua anggota penduduknya).`
    };
    setAuditLogs([newAudit, ...auditLogs]);

    updateInspection(
      `Menghapus berkas KK ID ${id} (Cascade)`,
      `DELETE FROM keluarga WHERE id_keluarga = ${id}; -- Mematikan relasi Cascade`,
      `-- Seluruh baris penduduk yang merujuk pada id_keluarga dihapus secara otomatis\n-- oleh constraint: ON DELETE CASCADE`,
      `# services/keluarga_service.py\nKeluargaService.delete(${id})`
    );
  };

  // 3. CRUD Penduduk Simulations
  const handleAddPenduduk = (nik: string, nama: string, jenis_kelamin: 'L' | 'P', tanggal_lahir: string, id_keluarga: number) => {
    // Validation: Check duplicate NIK
    const isDup = residents.some(r => r.nik === nik);
    if (isDup) {
      return "ORA-200029: Nomor NIK sudah digunakan oleh penduduk lain!";
    }

    const newId = residents.length > 0 ? Math.max(...residents.map(r => r.id_penduduk)) + 1 : 1;
    const newRecord: Penduduk = {
      id_penduduk: newId,
      nik,
      nama,
      jenis_kelamin,
      tanggal_lahir,
      id_keluarga
    };

    setResidents([...residents, newRecord]);

    // Update family headcount count automatically (matches Oracle Trigger simulations tracking count)
    setFamilies(families.map(f => {
  if (f.id_keluarga === id_keluarga) {
    return { ...f, jumlah_anggota: (f.jumlah_anggota ?? 0) + 1 };
  }
  return f;
}));

    // Trigger AFTER Trigger event logging to DB tables: log_penduduk1
    const trigLogId = residentTriggerLogs.length + 1;
    const trigLog: LogPenduduk = {
      id_log: trigLogId,
      aksi: 'INSERT',
      id_penduduk: newId,
      nik,
      nama_lama: null,
      nama_baru: nama,
      jenis_kelamin,
      waktu_log: new Date().toISOString().replace('T', ' ').substring(0, 19),
      keterangan: `Menambahkan penduduk baru: ${nama}`
    };
    setResidentTriggerLogs([trigLog, ...residentTriggerLogs]);

    // Push into Global Audit Log
    const newAudit: AuditLog = {
      id_log: auditLogs.length + 1,
      nama_tabel: 'PENDUDUK',
      id_data: newId,
      aksi: 'INSERT',
      waktu_aksi: new Date().toISOString().replace('T', ' ').substring(0, 19),
      nama_user: currentUser?.username || 'SYSTEM',
      keterangan: `Operasi INSERT Penduduk baru. NIK: ${nik}, Nama: ${nama}`
    };
    setAuditLogs([newAudit, ...auditLogs]);

    updateInspection(
      `Pendaftaran Penduduk: ${nama}`,
      `INSERT INTO penduduk (nik, nama, jenis_kelamin, tanggal_lahir, id_keluarga) VALUES ('${nik}', '${nama}', '${jenis_kelamin}', TO_DATE('${tanggal_lahir}', 'YYYY-MM-DD'), ${id_keluarga});`,
      `-- PL/SQL AFTER INSERT Trigger dicatat di LOG_PENDUDUK1\n-- Triger mendeteksi biodata dan menyalin mutasi log kependudukan otomatis.`,
      `# services/penduduk_service.py\nPendudukService.create('${nik}', '${nama}', '${jenis_kelamin}', '${tanggal_lahir}', ${id_keluarga})`
    );

    return true;
  };

  const handleEditPenduduk = async (
  id: number,
  nik: string,
  nama: string,
  jenis_kelamin: 'L' | 'P',
  tanggal_lahir: string,
  id_keluarga: number
) => {
  try {
    const response = await fetch(`http://127.0.0.1:5000/api/penduduk/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nik,
        nama,
        jenis_kelamin,
        tanggal_lahir,
        id_keluarga
      })
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Gagal update penduduk");
      return false;
    }

    await loadPenduduk();
    await loadKeluarga();

    updateInspection(
      `Mutasi Biodata Penduduk: ${nama}`,
      `UPDATE penduduk SET nik = '${nik}', nama = '${nama}', jenis_kelamin = '${jenis_kelamin}', tanggal_lahir = TO_DATE('${tanggal_lahir}', 'YYYY-MM-DD'), id_keluarga = ${id_keluarga} WHERE id_penduduk = ${id};`,
      `-- PL/SQL Procedure update_penduduk berhasil dijalankan`,
      `PUT /api/penduduk/${id}`
    );

    return true;
  } catch (error) {
    alert("Tidak bisa terhubung ke backend Flask");
    return false;
  }
};

  const handleDeletePenduduk = (id: number) => {
    const targetObj = residents.find(r => r.id_penduduk === id);
    if (!targetObj) return;

    setResidents(residents.filter(r => r.id_penduduk !== id));
    // Remove headcount
    setFamilies(families.map(f => {
  if (f.id_keluarga === targetObj.id_keluarga) {
    return {
      ...f,
      jumlah_anggota: Math.max(0, (f.jumlah_anggota ?? 0) - 1)
    };
  }
  return f;
}));

    // Trigger Audit Log
    const newAudit: AuditLog = {
      id_log: auditLogs.length + 1,
      nama_tabel: 'PENDUDUK',
      id_data: id,
      aksi: 'DELETE',
      waktu_aksi: new Date().toISOString().replace('T', ' ').substring(0, 19),
      nama_user: currentUser?.username || 'SYSTEM',
      keterangan: `Operasi DELETE warga. NIK: ${targetObj.nik}, Nama: ${targetObj.nama}`
    };
    setAuditLogs([newAudit, ...auditLogs]);

    updateInspection(
      `Menghapus warga: ${targetObj.nama}`,
      `DELETE FROM penduduk WHERE id_penduduk = ${id};`,
      `-- PL/SQL logs deletion activity in audit trail.\n-- Triggers update on kk members count.`,
      `# services/penduduk_service.py\nPendudukService.delete(${id})`
    );
  };

  // 4. CRUD Layanan Simulations
  const handleAddLayanan = (nama_layanan: string, deskripsi: string) => {
    // Check duplication
    const isDup = services.some(l => l.nama_layanan === nama_layanan);
    if (isDup) {
      alert("Error DBMS: ORA-20027: Jenis Layanan tersebut sudah terdaftar di database!");
      return;
    }

    const newId = services.length > 0 ? Math.max(...services.map(l => l.id_layanan)) + 1 : 1;
    const newRecord: Layanan = {
      id_layanan: newId,
      nama_layanan,
      deskripsi,
      status_aktif: 'Y'
    };

    setServices([...services, newRecord]);

    // Log Action
    const newAudit: AuditLog = {
      id_log: auditLogs.length + 1,
      nama_tabel: 'LAYANAN',
      id_data: newId,
      aksi: 'INSERT',
      waktu_aksi: new Date().toISOString().replace('T', ' ').substring(0, 19),
      nama_user: currentUser?.username || 'SYSTEM',
      keterangan: `Operasi INSERT Layanan baru. Nama Layanan: ${nama_layanan}`
    };
    setAuditLogs([newAudit, ...auditLogs]);

    updateInspection(
      `Merilis Layanan: ${nama_layanan}`,
      `INSERT INTO layanan (nama_layanan, deskripsi, status_aktif) VALUES ('${nama_layanan}', '${deskripsi}', 'Y');`,
      `-- PL/SQL Stored Procedure: tambah_layanan\n-- Menambahkan data master jenis layanan kependudukan`,
      `# services/layanan_service.py\nLayananService.create('${nama_layanan}', '${deskripsi}')`
    );
  };

  const handleEditLayanan = (id: number, nama_layanan: string, deskripsi: string, status_aktif: 'Y' | 'N') => {
    const updated = services.map(l => {
      if (l.id_layanan === id) {
        return { ...l, nama_layanan, deskripsi, status_aktif };
      }
      return l;
    });
    setServices(updated);

    // Log Action
    const newAudit: AuditLog = {
      id_log: auditLogs.length + 1,
      nama_tabel: 'LAYANAN',
      id_data: id,
      aksi: 'UPDATE',
      waktu_aksi: new Date().toISOString().replace('T', ' ').substring(0, 19),
      nama_user: currentUser?.username || 'SYSTEM',
      keterangan: `Operasi UPDATE Layanan ID ${id}. Set status: ${status_aktif}`
    };
    setAuditLogs([newAudit, ...auditLogs]);

    updateInspection(
      `Memperbarui Layanan ID ${id}`,
      `UPDATE layanan SET nama_layanan = '${nama_layanan}', deskripsi = '${deskripsi}', status_aktif = '${status_aktif}' WHERE id_layanan = ${id};`,
      `-- PL/SQL Stored Procedure: update_layanan\n-- Mengubah status atau prasyarat layanan kependudukan`,
      `# services/layanan_service.py\nLayananService.update(${id}, ...)`
    );
  };

  const handleDeactivateLayanan = (id: number) => {
    const updated = services.map(l => {
      if (l.id_layanan === id) {
        return { ...l, status_aktif: 'N' as 'N' };
      }
      return l;
    });
    setServices(updated);

    // Log Action
    const newAudit: AuditLog = {
      id_log: auditLogs.length + 1,
      nama_tabel: 'LAYANAN',
      id_data: id,
      aksi: 'UPDATE',
      waktu_aksi: new Date().toISOString().replace('T', ' ').substring(0, 19),
      nama_user: currentUser?.username || 'SYSTEM',
      keterangan: `Operasi de-aktivasi layanan ID ${id} via PL/SQL (Layanan dinonaktifkan tanpa didelete).`
    };
    setAuditLogs([newAudit, ...auditLogs]);
  };

  // 5. Transaction & Status Actions
  const handleAddPengajuan = (id_penduduk: number, id_layanan: number, catatan: string) => {
    const citizen = residents.find(r => r.id_penduduk === id_penduduk);
    const service = services.find(l => l.id_layanan === id_layanan);
    const parentKK = citizen ? families.find(f => f.id_keluarga === citizen.id_keluarga) : null;

    if (!citizen || !service) return "Layanan atau Penduduk tidak ditemukan!";

    const newId = submissions.length > 0 ? Math.max(...submissions.map(s => s.id_pengajuan)) + 1 : 1;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newSub: Pengajuan = {
      id_pengajuan: newId,
      id_penduduk,
      nama_penduduk: citizen.nama,
      nik_penduduk: citizen.nik,
      no_kk_penduduk: parentKK?.no_kk || "Tidak terdaftar",
      alamat_penduduk: parentKK?.alamat || "Tidak terdaftar",
      id_petugas: currentUser?.id_petugas || 1,
      nama_petugas: currentUser?.nama_petugas || 'Administrator Desa',
      id_status: 1, // MENUNGGU
      status: 'MENUNGGU',
      id_layanan,
      layanan: service.nama_layanan,
      tanggal_pengajuan: nowStr,
      catatan_status: catatan || "Pengajuan berkas baru masuk."
    };

    setSubmissions([newSub, ...submissions]);

    // Register Status History
    const newRiwayat: RiwayatStatus = {
      id_riwayat: historyLogs.length + 1,
      id_pengajuan: newId,
      status: 'MENUNGGU',
      petugas: currentUser?.nama_petugas || 'System Automated',
      tanggal_update: nowStr,
      catatan: catatan || "Berkas masuk loket dan terdaftar di server."
    };
    setHistoryLogs([newRiwayat, ...historyLogs]);

    // Save into Global Audit
    const newAudit: AuditLog = {
      id_log: auditLogs.length + 1,
      nama_tabel: 'PENGAJUAN',
      id_data: newId,
      aksi: 'INSERT',
      waktu_aksi: nowStr,
      nama_user: currentUser?.username || 'SYSTEM',
      keterangan: `Membuat berkas pengajuan #${newId} untuk warga ${citizen.nama} (Layanan: ${service.nama_layanan}).`
    };
    setAuditLogs([newAudit, ...auditLogs]);

    updateInspection(
      `Mendaftarkan pengajuan #${newId}`,
      `INSERT INTO pengajuan (id_penduduk, id_petugas, id_status, catatan_status) VALUES (${id_penduduk}, ${currentUser?.id_petugas}, 1, '${catatan}');\nINSERT INTO pengajuan_layanan VALUES (${newId}, ${id_layanan});`,
      `-- PL/SQL Transaction: tambah_pengajuan_dengan_layanan\n-- Menambahkan data induk pengajuan dan mendaftarkannya pada jembatan pengajuan_layanan secara atomic.`,
      `# services/pengajuan_service.py\nPengajuanService.create(${id_penduduk}, ${currentUser?.id_petugas}, ${id_layanan}, '${catatan}')`
    );

    return true;
  };

  const handleUpdateStatus = (id_pengajuan: number, id_status: number, statusStr: 'MENUNGGU' | 'DIPROSES' | 'SELESAI' | 'DITOLAK' | 'KADALUARSA', catatanTxt: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Update submission
    setSubmissions(submissions.map(s => {
      if (s.id_pengajuan === id_pengajuan) {
        return {
          ...s,
          id_status,
          status: statusStr,
          catatan_status: catatanTxt
        };
      }
      return s;
    }));

    // Insert history record
    const newRiwayat: RiwayatStatus = {
      id_riwayat: historyLogs.length + 1,
      id_pengajuan,
      status: statusStr,
      petugas: currentUser?.nama_petugas || 'System Automated',
      tanggal_update: nowStr,
      catatan: catatanTxt
    };
    setHistoryLogs([newRiwayat, ...historyLogs]);

    // Push into Global Audit Log
    const newAudit: AuditLog = {
      id_log: auditLogs.length + 1,
      nama_tabel: 'PENGAJUAN',
      id_data: id_pengajuan,
      aksi: 'UPDATE',
      waktu_aksi: nowStr,
      nama_user: currentUser?.username || 'SYSTEM',
      keterangan: `Mengubah dispersasi status pengajuan #${id_pengajuan} menjadi status: ${statusStr}. Catatan: ${catatanTxt}`
    };
    setAuditLogs([newAudit, ...auditLogs]);
  };

  // 6. Automatic Expiry Scheduler Simulation (PL/SQL Stored Procedure Batch)
  const handleTriggerAutomatedExpiry = () => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    // Find submissions that are 'MENUNGGU' (id_status: 1) and older than 7 days (the seed ID 4 is dated '2026-05-02')
    // Let's filter other pending items that fit the bill too
    const itemsToMark = submissions.filter(s => {
      if (s.status !== 'MENUNGGU') return false;
      const submissionDate = new Date(s.tanggal_pengajuan);
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - 7);
      return submissionDate < limitDate;
    });

    if (itemsToMark.length === 0) {
      alert("Prosedur Oracle: Selesai. Sebanyak 0 berkas lawas diproses (Seluruh pengajuan MENUNGGU saat ini masih dalam tenggat < 7 hari).");
      return;
    }

    const itemIds = itemsToMark.map(i => i.id_pengajuan);

    // Mutate state
    setSubmissions(submissions.map(s => {
      if (itemIds.includes(s.id_pengajuan)) {
        return {
          ...s,
          id_status: 5,
          status: 'KADALUARSA',
          catatan_status: 'Dibatalkan otomatis oleh Server (PL/SQL update_status_otomatis) karena tidak dilengkapi berkasnya > 7 hari.'
        };
      }
      return s;
    }));

    // Register history records
    const newHistories: RiwayatStatus[] = itemsToMark.map((item, index) => ({
      id_riwayat: historyLogs.length + 1 + index,
      id_pengajuan: item.id_pengajuan,
      status: 'KADALUARSA',
      petugas: 'Oracle Scheduler Batch',
      tanggal_update: nowStr,
      catatan: 'Dibatalkan karena berkas lawas melewati batas pelunasan administrasi (> 7 hari kerja).'
    }));
    setHistoryLogs([...newHistories, ...historyLogs]);

    // Push into Audit Log
    const newAudits: AuditLog[] = itemsToMark.map((item, index) => ({
      id_log: auditLogs.length + 1 + index,
      nama_tabel: 'PENGAJUAN',
      id_data: item.id_pengajuan,
      aksi: 'UPDATE',
      waktu_aksi: nowStr,
      nama_user: 'DBMS_SCHEDULER',
      keterangan: `Batch automatic de-registration of old document ID #${item.id_pengajuan} (Expired document marked safely).`
    }));
    setAuditLogs([...newAudits, ...auditLogs]);

    alert(`Prosedur Oracle Sukses!\nupdate_status_otomatis() memproses ${itemsToMark.length} berkas lawas.\n- Berkas ID #${itemIds.join(', #')} diset KADALUARSA secara otomatis.`);
  };

  // Helper stats computer
  const computeStats = () => {
    return {
      total_penduduk: residents.length,
      total_keluarga: families.length,
      total_layanan_aktif: services.filter(l => l.status_aktif === 'Y').length,
      total_pengajuan: submissions.length,
      total_pengajuan_hari_ini: submissions.filter(s => s.tanggal_pengajuan.startsWith('2026-05-21')).length,
      
      // Status breakdowns
      total_menunggu: submissions.filter(s => s.status === 'MENUNGGU').length,
      total_diproses: submissions.filter(s => s.status === 'DIPROSES').length,
      total_selesai: submissions.filter(s => s.status === 'SELESAI').length,
      total_ditolak: submissions.filter(s => s.status === 'DITOLAK').length,
      total_kadaluarsa: submissions.filter(s => s.status === 'KADALUARSA').length,
    };
  };

  // Render core views based on tabs
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            stats={computeStats()}
            recents={submissions}
            user={currentUser}
            onNavigate={(tab, arg) => {
              if (tab === 'pengajuan_detail') {
                setSelectedSubId(arg);
                setActiveTab('pengajuan');
              } else if (tab === 'pengajuan_tambah') {
                setActiveTab('pengajuan');
                // Trigger sub-action through simple DOM emulation delay or state
                setTimeout(() => {
                  const addBtn = document.getElementById('btn_add_pengajuan');
                  if (addBtn) addBtn.click();
                }, 100);
              } else {
                setActiveTab(tab);
              }
            }}
            onTriggerExpiry={handleTriggerAutomatedExpiry}
            onSetInspection={updateInspection}
          />
        );
      case 'keluarga':
        return (
          <KeluargaView
            keluarga={families}
            penduduk={residents}
            user={currentUser}
            onAddKeluarga={handleAddKeluarga}
            onEditKeluarga={handleEditKeluarga}
            onDeleteKeluarga={handleDeleteKeluarga}
            onSetInspection={updateInspection}
          />
        );
      case 'penduduk':
        return (
          <PendudukView
            penduduk={residents}
            keluarga={families}
            user={currentUser}
            onAddPenduduk={handleAddPenduduk}
            onEditPenduduk={handleEditPenduduk}
            onDeletePenduduk={handleDeletePenduduk}
            onSetInspection={updateInspection}
          />
        );
      case 'layanan':
        return (
          <LayananView
            layanan={services}
            user={currentUser}
            onAddLayanan={handleAddLayanan}
            onEditLayanan={handleEditLayanan}
            onDeactivateLayanan={handleDeactivateLayanan}
            onSetInspection={updateInspection}
          />
        );
      case 'pengajuan':
        return (
          <PengajuanView
            pengajuan={submissions}
            riwayat={historyLogs}
            penduduk={residents}
            layanan={services}
            user={currentUser}
            onAddPengajuan={handleAddPengajuan}
            onUpdateStatus={handleUpdateStatus}
            onSetInspection={updateInspection}
            initialSelectedId={selectedSubId}
          />
        );
      case 'auditing':
        return (
          <AuditingView
            auditLogs={auditLogs}
            pendudukLogs={residentTriggerLogs}
            onSetInspection={updateInspection}
          />
        );
      case 'laporan':
        return (
          <LaporanView
            pengajuan={submissions}
            layanan={services}
            onSetInspection={updateInspection}
          />
        );
      default:
        return <div className="text-center p-8">Tab tidak ditemukan.</div>;
    }
  };

  // LOGIN PAGE VIEW (Unauthenticated)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-purple-900 selection:text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-950/20 via-slate-950 to-slate-950 z-0" />
        
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur-md relative z-10 space-y-6"
          id="login_card"
        >
          {/* Brand Logo */}
          <div className="text-center space-y-2">
            <div className="bg-purple-900/50 border border-purple-500/30 text-purple-400 p-3.5 inline-block rounded-2xl">
              <Cpu className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold font-display text-white tracking-tight">Sistem Administrasi Kependudukan</h1>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Desa Sukamakmur • UAS Basis Data Lanjut</p>
          </div>

          {loginError && (
            <div className="bg-rose-950/50 border border-rose-800/60 p-3 rounded-lg flex items-center gap-2 text-rose-300 font-medium text-xs">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 text-xs font-medium text-slate-300">
            <div>
              <label className="block text-slate-400 mb-1.5 font-bold">Username Sesi Sesuai Role</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono text-sm uppercase tracking-widest placeholder:text-slate-600"
                  placeholder="Masukkan Username"
                />
                <UserCheck className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5 font-bold">PIN Sesi / Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono text-sm placeholder:text-slate-600"
                  placeholder="Masukkan Password..."
                />
                <KeyRound className="w-4 w-4 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-bold py-3 rounded-xl transition-all shadow-md cursor-pointer text-xs"
              id="btn_login_submit"
            >
              Masuk
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // PORTAL PANEL VIEW (Authenticated)
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans selection:bg-purple-950 selection:text-white print:bg-white print:min-h-0">
      {/* SIDEBAR NAVIGATION - Hides on native print */}
      <aside className="w-full md:w-64 bg-gradient-to-b from-[#4C1D95] via-[#6D28D9] to-[#8B5CF6] text-white flex flex-col justify-between shrink-0 border-r border-[#4C1D95]/30 print:hidden z-30 shadow-xl">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
            <Cpu className="w-6 h-6 text-purple-200" />
            <div>
              <span className="block font-black text-sm tracking-tight text-white uppercase font-display">SAK Desa</span>
              <span className="text-[10px] text-purple-200 tracking-widest font-mono font-bold">SukaMakmur</span>
            </div>
          </div>

          {/* Menus list */}
          <nav className="px-4 space-y-1 text-xs">
            {/* Dashboard */}
            <button
              onClick={() => { setActiveTab('dashboard'); setSelectedSubId(null); }}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all font-semibold cursor-pointer border ${
                activeTab === 'dashboard' 
                  ? 'bg-white/20 text-white border-white/20 shadow-sm font-bold' 
                  : 'border-transparent text-purple-100 hover:bg-white/10 hover:text-white opacity-80 hover:opacity-100'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Dashboard Sistem</span>
            </button>

            {/* Sub-label: Data Master */}
            <p className="px-4 pt-4 pb-1 text-[10px] font-bold text-purple-200 uppercase tracking-widest">Data Master</p>
            
            {/* Keluarga */}
            <button
              onClick={() => { setActiveTab('keluarga'); setSelectedSubId(null); }}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all font-semibold cursor-pointer border ${
                activeTab === 'keluarga' 
                  ? 'bg-white/20 text-white border-white/20 shadow-sm font-bold' 
                  : 'border-transparent text-purple-100 hover:bg-white/10 hover:text-white opacity-80 hover:opacity-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Keluarga (KK)</span>
            </button>

            {/* Penduduk */}
            <button
              onClick={() => { setActiveTab('penduduk'); setSelectedSubId(null); }}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all font-semibold cursor-pointer border ${
                activeTab === 'penduduk' 
                  ? 'bg-white/20 text-white border-white/20 shadow-sm font-bold' 
                  : 'border-transparent text-purple-100 hover:bg-white/10 hover:text-white opacity-80 hover:opacity-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Kependudukan</span>
            </button>

            {/* Layanan */}
            <button
              onClick={() => { setActiveTab('layanan'); setSelectedSubId(null); }}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all font-semibold cursor-pointer border ${
                activeTab === 'layanan' 
                  ? 'bg-white/20 text-white border-white/20 shadow-sm font-bold' 
                  : 'border-transparent text-purple-100 hover:bg-white/10 hover:text-white opacity-80 hover:opacity-100'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>Layanan Publik</span>
            </button>

            {/* Sub-label: Transaksi */}
            <p className="px-4 pt-4 pb-1 text-[10px] font-bold text-purple-200 uppercase tracking-widest">Transaksi</p>

            {/* Pengajuan */}
            <button
              onClick={() => { setActiveTab('pengajuan'); setSelectedSubId(null); }}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all font-semibold cursor-pointer border ${
                activeTab === 'pengajuan' 
                  ? 'bg-white/20 text-white border-white/20 shadow-sm font-bold' 
                  : 'border-transparent text-purple-100 hover:bg-white/10 hover:text-white opacity-80 hover:opacity-100'
              }`}
              id="btn_add_pengajuan_tab"
            >
              <FileText className="w-4 h-4" />
              <span>Pengajuan Dokumen</span>
            </button>

            {/* Sub-label: Logging/Trigger */}
            <p className="px-4 pt-4 pb-1 text-[10px] font-bold text-purple-200 uppercase tracking-widest">PL/SQL Auditing</p>

            {/* Auditing */}
            <button
              onClick={() => { setActiveTab('auditing'); setSelectedSubId(null); }}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all font-semibold cursor-pointer border ${
                activeTab === 'auditing' 
                  ? 'bg-white/20 text-white border-white/20 shadow-sm font-bold' 
                  : 'border-transparent text-purple-100 hover:bg-white/10 hover:text-white opacity-80 hover:opacity-100'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Audit logs / Triggers</span>
            </button>

            {/* Sub-label: Laporan */}
            <p className="px-4 pt-4 pb-1 text-[10px] font-bold text-purple-200 uppercase tracking-widest">Laporan Utama</p>

            {/* Laporan */}
            <button
              onClick={() => { setActiveTab('laporan'); setSelectedSubId(null); }}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all font-semibold cursor-pointer border ${
                activeTab === 'laporan' 
                  ? 'bg-white/20 text-white border-white/20 shadow-sm font-bold' 
                  : 'border-transparent text-purple-100 hover:bg-white/10 hover:text-white opacity-80 hover:opacity-100'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Unduh Laporan</span>
            </button>
          </nav>
        </div>

        {/* Profile Card Footer */}
        <div className="p-4 border-t border-white/10 bg-white/10 backdrop-blur-sm text-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="bg-white/20 text-white font-bold p-1 px-2 rounded font-mono text-[9px] border border-white/20 shadow-sm uppercase">
              {currentUser.nama_role}
            </div>
            <div className="text-[10px] truncate text-purple-100 font-semibold">{currentUser.nama_petugas}</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1 bg-rose-500/20 text-rose-200 hover:bg-rose-600 hover:text-white font-bold p-2.5 rounded-xl transition-all cursor-pointer border border-rose-500/30 text-[11px]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluarkan Sinyal</span>
          </button>
        </div>
      </aside>

      {/* CORE FRAME FOR WRAPPED PAGES */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 print:p-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FIXED TRACE CONSOLE PANEL - Hides on print */}
      <div className="print:hidden">
        <InspectorConsole
          currentTab={activeTab}
          actionName={inspectAction}
          sqlSnippet={inspectSql}
          plsqlSnippet={inspectPlsql}
          flaskSnippet={inspectFlask}
        />
      </div>
    </div>
  );
}
