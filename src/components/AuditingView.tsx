import React, { useState } from 'react';
import { Database, Search, ShieldAlert, Cpu } from 'lucide-react';
import { AuditLog, LogPenduduk } from '../types';

interface AuditingViewProps {
  auditLogs: AuditLog[];
  pendudukLogs: LogPenduduk[];
  onSetInspection: (action: string, sql: string, plsql: string, flask: string) => void;
}

export default function AuditingView({
  auditLogs,
  pendudukLogs,
  onSetInspection
}: AuditingViewProps) {
  const [activeLogTab, setActiveLogTab] = useState<'audit' | 'penduduk_trigger'>('audit');
  const [search, setSearch] = useState('');

  const handleInspectLog = (tableName: string) => {
    onSetInspection(
      `Membaca riwayat auditing logs dari tabel ${tableName}`,
      `SELECT * FROM ${tableName} ORDER BY 1 DESC;`,
      `-- PL/SQL After Trigger untuk auditing data kependudukan\n-- Dicatat otomatis pasca operasi DML oleh trigger\nCREATE OR REPLACE TRIGGER trg_penduduk_log\nAFTER INSERT OR UPDATE OR DELETE ON penduduk FOR EACH ROW\nBEGIN\n  IF INSERTING THEN\n    INSERT INTO log_penduduk1 (aksi, id_penduduk, nik, nama_lama, nama_baru, keterangan)\n    VALUES ('INSERT', :NEW.id_penduduk, :NEW.nik, NULL, :NEW.nama, 'Menambahkan penduduk baru: ' || :NEW.nama);\n  ELIF UPDATING THEN\n    INSERT INTO log_penduduk1 (aksi, id_penduduk, nik, nama_lama, nama_baru, keterangan)\n    VALUES ('UPDATE', :NEW.id_penduduk, :NEW.nik, :OLD.nama, :NEW.nama, 'Mengubah biodata dari ' || :OLD.nama || ' menjadi ' || :NEW.nama);\n  END IF;\nEND;`,
      `# routes/audit_routes.py\n@audit_bp.route('/audit-log')\ndef index():\n    audits = execute_query("SELECT * FROM audit_log ORDER BY waktu_aksi DESC")\n    return render_template('audit/index.html', audits=audits)`
    );
  };

  const filteredAudits = auditLogs.filter(a =>
    a.nama_tabel.toLowerCase().includes(search.toLowerCase()) ||
    a.aksi.toLowerCase().includes(search.toLowerCase()) ||
    a.keterangan.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPendudukLogs = pendudukLogs.filter(p =>
    p.nama_lama?.toLowerCase().includes(search.toLowerCase()) ||
    p.nama_baru?.toLowerCase().includes(search.toLowerCase()) ||
    p.keterangan.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-xs">
      {/* HEADER */}
      <div className="flex bg-white p-6 rounded-2xl border border-slate-100 shadow-sm justify-between items-center">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-800">Sistem Auditing Desa (Oracle Trigger Events)</h1>
          <p className="text-slate-400 mt-1">Menginspeksi rekam aktivitas basis data yang terpantau dan tercatat otomatis oleh Trigger PL/SQL.</p>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            setActiveLogTab('audit');
            handleInspectLog('AUDIT_LOG');
          }}
          className={`px-6 py-3 cursor-pointer border-b-2 text-xs font-bold transition-all ${
            activeLogTab === 'audit'
              ? 'border-purple-600 text-purple-700 bg-white rounded-t-xl font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Audit Log Global (Tabel AUDIT_LOG)
        </button>
        <button
          onClick={() => {
            setActiveLogTab('penduduk_trigger');
            handleInspectLog('LOG_PENDUDUK1');
          }}
          className={`px-6 py-3 cursor-pointer border-b-2 text-xs font-bold transition-all ${
            activeLogTab === 'penduduk_trigger'
              ? 'border-purple-600 text-purple-700 bg-white rounded-t-xl font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Log Mutasi Penduduk (Tabel LOG_PENDUDUK1)
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* SEARCH */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex">
          <div className="w-full max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari logs berdasarkan aksi, tabel, keterangan modifikasi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        {activeLogTab === 'audit' ? (
          /* AUDIT LOG TABLE */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold tracking-wider text-[10px] uppercase">
                  <th className="p-4 text-center">ID Log</th>
                  <th className="p-4 text-center">Aksi / DML</th>
                  <th className="p-4 font-bold">Waktu Eksekusi</th>
                  <th className="p-4">Target Tabel</th>
                  <th className="p-4">Oleh User DB</th>
                  <th className="p-4">Catatan Perubahan</th>
                </tr>
              </thead>
              <tbody>
                {filteredAudits.map((row) => (
                  <tr key={row.id_log} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all font-medium">
                    <td className="p-4 text-center font-mono text-slate-400">#{row.id_log}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        row.aksi === 'INSERT' ? 'bg-emerald-100 text-emerald-700 border border-emerald-250' :
                        row.aksi === 'UPDATE' ? 'bg-amber-100 text-amber-700 border border-amber-250' :
                        'bg-rose-100 text-rose-700 border border-rose-250'
                      }`}>
                        {row.aksi}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-500">{row.waktu_aksi}</td>
                    <td className="p-4 font-bold text-slate-750">{row.nama_tabel}</td>
                    <td className="p-4 text-slate-600 font-mono text-[10px]">{row.nama_user}</td>
                    <td className="p-4 text-slate-700 font-bold whitespace-normal line-clamp-2 max-w-sm" title={row.keterangan}>
                      {row.keterangan}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* RESIDENT TRIGGERS TABLE */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold tracking-wider text-[10px] uppercase">
                  <th className="p-4 text-center">ID Log</th>
                  <th className="p-4 text-center">Aksi</th>
                  <th className="p-4">Tanggal Trigger</th>
                  <th className="p-4">NIK Warga</th>
                  <th className="p-4">Nama Lama</th>
                  <th className="p-4">Nama Baru (Simpanan)</th>
                  <th className="p-4">Deskripsi Trigger</th>
                </tr>
              </thead>
              <tbody>
                {filteredPendudukLogs.map((row) => (
                  <tr key={row.id_log} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all font-medium">
                    <td className="p-4 text-center font-mono text-slate-400">#{row.id_log}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        row.aksi === 'INSERT' ? 'bg-emerald-100 text-emerald-750' : 'bg-amber-100 text-amber-750'
                      }`}>
                        {row.aksi}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-500">{row.waktu_log}</td>
                    <td className="p-4 font-mono font-bold text-slate-800">{row.nik}</td>
                    <td className="p-4 text-slate-400 font-semibold">{row.nama_lama || <span className="italic text-slate-300">- Baru -</span>}</td>
                    <td className="p-4 text-slate-800 font-bold">{row.nama_baru}</td>
                    <td className="p-4 text-slate-700 font-semibold">{row.keterangan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
