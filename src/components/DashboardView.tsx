import React from 'react';
import { 
  Users, Home, Server, FileText, CheckCircle, 
  Clock, Coffee, AlertTriangle, XCircle, RefreshCw, Plus, Calendar 
} from 'lucide-react';
import { Pengajuan, User, Role } from '../types';

interface DashboardViewProps {
  stats: any;
  recents: Pengajuan[];
  user: User | null;
  onNavigate: (tab: string, arg?: any) => void;
  onTriggerExpiry: () => void;
  onSetInspection: (action: string, sql: string, plsql: string, flask: string) => void;
}

export default function DashboardView({
  stats,
  recents,
  user,
  onNavigate,
  onTriggerExpiry,
  onSetInspection
}: DashboardViewProps) {

  // Trigger inspection log on card clicks or action clicks
  const inspectCard = (title: string, value: string) => {
    onSetInspection(
      `Membaca parameter statistik dashboard: ${title}`,
      `SELECT total_pengajuan_by_status('MENUNGGU') FROM DUAL; -- Contoh pemanggilan function`,
      `-- Oracle PL/SQL Function untuk merekapitulasi data statis\nCREATE OR REPLACE FUNCTION total_pengajuan_by_status (\n   p_nama_status IN VARCHAR2\n) RETURN NUMBER IS\n   v_count NUMBER := 0;\nBEGIN\n   SELECT COUNT(*)\n   INTO v_count\n   FROM pengajuan p\n   JOIN status_pengajuan s ON p.id_status = s.id_status\n   WHERE UPPER(s.nama_status) = UPPER(p_nama_status);\n   RETURN v_count;\nEND;`,
      `# services/dashboard_service.py\n@staticmethod\ndef get_statistics():\n    status_menunggu = call_function("total_pengajuan_by_status", oracledb.NUMBER, ["MENUNGGU"])\n    return { "total_menunggu": status_menunggu }\n    # Dikembalikan untuk dirender pada Jinja2 template`
    );
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black font-display text-slate-950 tracking-tight">Dashboard Utama</h1>
          <p className="text-slate-500 text-xs mt-1 font-medium">
            Selamat datang, <strong className="text-purple-700 font-bold">{user?.nama_petugas}</strong> ({user?.jabatan}). Anda bekerja dengan hak akses <span className="bg-purple-100 text-[#6D28D9] font-bold px-2 py-0.5 rounded-full text-[10px] border border-purple-200 uppercase">{user?.nama_role}</span>.
          </p>
        </div>
        
        {/* Core Actions */}
        <div className="flex items-center gap-2">
          {(user?.nama_role === Role.ADMIN || user?.nama_role === Role.PETUGAS) && (
            <button
              onClick={() => onNavigate('pengajuan_tambah')}
              className="flex items-center gap-1.5 bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md hover:brightness-110 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Pengajuan</span>
            </button>
          )}
          <button
            onClick={() => {
              onTriggerExpiry();
              onSetInspection(
                "Menjalankan Prosedur Batch Otomatis update_status_otomatis()",
                "DECLARE\n   v_rows NUMBER;\nBEGIN\n   update_status_otomatis(v_rows);\n   DBMS_OUTPUT.PUT_LINE('Updated rows: ' || v_rows);\nEND;",
                `-- Oracle PL/SQL Procedure: update_status_otomatis\nCREATE OR REPLACE PROCEDURE update_status_otomatis (\n   p_rows_updated OUT NUMBER\n) IS\n   v_count NUMBER := 0;\nBEGIN\n   -- Hitung data tertahan > 7 hari\n   SELECT COUNT(*) INTO v_count\n   FROM pengajuan WHERE id_status = 1 AND tanggal_pengajuan < (SYSDATE - 7);\n   \n   p_rows_updated := v_count;\n   IF v_count > 0 THEN\n      UPDATE pengajuan SET id_status = 5, catatan_status = 'Dibatalkan otomatis karena kadaluarsa (> 7 hari).'\n      WHERE id_status = 1 AND tanggal_pengajuan < (SYSDATE - 7);\n   END IF;\n   COMMIT;\nEND;`,
                `# routes/dashboard_routes.py\n@dashboard_bp.route('/dashboard/update-kadaluarsa-otomatis', methods=['POST'])\ndef update_kadaluarsa():\n    rows_processed = PengajuanService.run_automatic_expiry()\n    flash(f"Berhasil! Sebanyak {rows_processed} berkas kadaluarsa ditiadakan.", "success")`
              );
            }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-[#D97706] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md cursor-pointer hover:brightness-110 transition-all border border-amber-600/30"
          >
            <RefreshCw className="w-4 h-4 animate-spin-slow" />
            <span>Update Kadaluarsa Otomatis</span>
          </button>
        </div>
      </div>

      {/* Grid Statistics Cards - Beautiful Tall Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Penduduk */}
        <div 
          onClick={() => inspectCard('Total Penduduk', stats.total_penduduk)}
          className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm cursor-pointer hover:border-purple-400 hover:shadow-md transition-all flex flex-col justify-between h-36"
        >
          <div className="flex justify-between items-start w-full">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-display">Total Penduduk</span>
            <div className="bg-purple-50 p-2.5 rounded-xl text-purple-600 border border-purple-100">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{stats.total_penduduk}</h3>
            <span className="text-[10px] text-emerald-500 font-bold mt-1 block">● Live Oracle Mutasi</span>
          </div>
        </div>

        {/* Total Keluarga */}
        <div 
          onClick={() => inspectCard('Total Keluarga', stats.total_keluarga)}
          className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm cursor-pointer hover:border-teal-400 hover:shadow-md transition-all flex flex-col justify-between h-36"
        >
          <div className="flex justify-between items-start w-full">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-display">Total Keluarga</span>
            <div className="bg-teal-50 p-2.5 rounded-xl text-teal-600 border border-teal-100">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-[#0D9488] tracking-tight">{stats.total_keluarga}</h3>
            <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Rujukan KK Master</span>
          </div>
        </div>

        {/* Total Layanan Aktif */}
        <div 
          onClick={() => inspectCard('Total Layanan Aktif', stats.total_layanan_aktif)}
          className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm cursor-pointer hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between h-36"
        >
          <div className="flex justify-between items-start w-full">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-display">Layanan Aktif</span>
            <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 border border-indigo-100">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-indigo-700 tracking-tight">{stats.total_layanan_aktif}</h3>
            <span className="text-[10px] text-indigo-500 font-bold mt-1 block">Panggil Function()</span>
          </div>
        </div>

        {/* Total Pengajuan */}
        <div 
          onClick={() => inspectCard('Total Pengajuan', stats.total_pengajuan)}
          className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm cursor-pointer hover:border-sky-400 hover:shadow-md transition-all flex flex-col justify-between h-36"
        >
          <div className="flex justify-between items-start w-full">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-display">Total Pengajuan</span>
            <div className="bg-sky-50 p-2.5 rounded-xl text-sky-600 border border-sky-100">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-sky-700 tracking-tight">{stats.total_pengajuan}</h3>
            <span className="text-[10px] text-sky-500 font-bold mt-1 block">Relasional View Map</span>
          </div>
        </div>

        {/* Pengajuan Hari Ini */}
        <div 
          onClick={() => inspectCard('Pengajuan Hari Ini', stats.total_pengajuan_hari_ini)}
          className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all flex flex-col justify-between h-36"
        >
          <div className="flex justify-between items-start w-full">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider font-display">Berkas Hari Ini</span>
            <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600 border border-emerald-100">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-emerald-700 tracking-tight">{stats.total_pengajuan_hari_ini}</h3>
            <span className="text-[10px] text-emerald-500 font-bold mt-1 block">SYS_DATE Live</span>
          </div>
        </div>
      </div>

      {/* Mini Cards Status Breakdown - Modern Rounded Outlines */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {/* Waiting */}
        <div className="bg-amber-50/60 border border-amber-200/60 rounded-[20px] p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-[#D97706]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 block">Menunggu</span>
              <p className="text-lg font-black text-slate-800 leading-none mt-1">{stats.total_menunggu}</p>
            </div>
          </div>
          <span className="text-[8px] bg-amber-200/50 text-amber-900 px-1.5 py-0.5 rounded font-bold">PENDING</span>
        </div>

        {/* Processing */}
        <div className="bg-blue-50/60 border border-blue-200/60 rounded-[20px] p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
              <Coffee className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 block">Diproses</span>
              <p className="text-lg font-black text-slate-800 leading-none mt-1">{stats.total_diproses}</p>
            </div>
          </div>
          <span className="text-[8px] bg-blue-200/50 text-blue-900 px-1.5 py-0.5 rounded font-bold">ACTIVE</span>
        </div>

        {/* Completed */}
        <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-[20px] p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl text-[#059669]">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 block">Selesai</span>
              <p className="text-lg font-black text-slate-800 leading-none mt-1">{stats.total_selesai}</p>
            </div>
          </div>
          <span className="text-[8px] bg-emerald-200/50 text-emerald-900 px-1.5 py-0.5 rounded font-bold">SUCCESS</span>
        </div>

        {/* Rejected */}
        <div className="bg-rose-50/60 border border-rose-200/60 rounded-[20px] p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-xl text-[#E11D48]">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600 block">Ditolak</span>
              <p className="text-lg font-black text-slate-800 leading-none mt-1">{stats.total_ditolak}</p>
            </div>
          </div>
          <span className="text-[8px] bg-rose-200/50 text-rose-900 px-1.5 py-0.5 rounded font-bold">REJECTED</span>
        </div>

        {/* Expired */}
        <div className="bg-slate-900 border border-slate-800 rounded-[20px] p-4 flex items-center justify-between shadow-md text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl text-slate-205">
              <AlertTriangle className="w-4 h-4 text-slate-300" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Kadaluarsa</span>
              <p className="text-lg font-black text-white leading-none mt-1">{stats.total_kadaluarsa}</p>
            </div>
          </div>
          <span className="text-[8px] bg-white/20 text-white px-1.5 py-0.5 rounded font-bold">EXPIRED</span>
        </div>
      </div>

      {/* Charts Panel Using Beautiful High-Contrast SVG elements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="text-sm font-bold font-display text-slate-800">Sebaran Pengajuan Per Status</h2>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Berdasarkan data relasional DBMS Oracle aktual</p>
          </div>
          <div className="h-[200px] flex items-end gap-6 pb-2 border-b border-slate-150">
            {/* Calculate and draw SVG bar graph */}
            {[
              { label: 'MENUNGGU', val: stats.total_menunggu, color: '#f59e0b' },
              { label: 'DIPROSES', val: stats.total_diproses, color: '#3b82f6' },
              { label: 'SELESAI', val: stats.total_selesai, color: '#10b981' },
              { label: 'DITOLAK', val: stats.total_ditolak, color: '#ef4444' },
              { label: 'KADALUARSA', val: stats.total_kadaluarsa, color: '#64748b' }
            ].map((chartItem, idx) => {
              const maxVal = Math.max(stats.total_menunggu, stats.total_diproses, stats.total_selesai, stats.total_ditolak, stats.total_kadaluarsa, 1);
              const pct = (chartItem.val / maxVal) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer relative">
                  {/* Tooltip */}
                  <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-all bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-md z-10 font-bold whitespace-nowrap">
                    {chartItem.val} Berkas
                  </div>
                  <div 
                    className="w-full rounded-t-lg transition-all duration-500 hover:brightness-95"
                    style={{ height: `${pct}%`, backgroundColor: chartItem.color }}
                  />
                  <span className="text-[9px] font-bold text-slate-400 rotate-12 md:rotate-0 mt-1 whitespace-nowrap">{chartItem.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* General Guidelines Info Box - Custom Bento Dark Gradient */}
        <div className="bg-gradient-to-br from-[#4C1D95] via-[#6D28D9] to-[#8B5CF6] text-white p-6 rounded-[28px] shadow-lg flex flex-col justify-between border border-white/10">
          <div>
            <h2 className="text-lg font-black font-display text-white tracking-tight">Sistem Administrasi Kependudukan Desa</h2>
            <p className="text-xs text-purple-100 mt-2 leading-relaxed">
              Pengelolaan data penduduk, keluarga, layanan administrasi, dan pengajuan surat berbasis Oracle Database.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                <span className="block text-[10px] text-purple-200 font-bold font-mono">PL/SQL Triggers</span>
                <span className="text-xs font-bold font-mono">4 Aktif</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                <span className="block text-[10px] text-purple-200 font-bold font-mono">Functions</span>
                <span className="text-xs font-bold font-mono">5 Terintegrasi</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                <span className="block text-[10px] text-purple-200 font-bold font-mono">Procedures</span>
                <span className="text-xs font-bold font-mono">6 Tersemat</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
                <span className="block text-[10px] text-purple-200 font-bold font-mono">Logging</span>
                <span className="text-xs font-bold font-mono">Audit + log_pend1</span>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-4 mt-6 flex items-center justify-between text-xs text-purple-200 font-mono">
            <span>DBMS: Oracle DB 19c/XE</span>
            <span>Driver: Python-oracledb</span>
          </div>
        </div>
      </div>

      {/* Latest Submissions Table */}
      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold font-display text-slate-900">5 Pengajuan Berkas Terbaru</h2>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Berdasarkan tabel log riwayat transaksi kependudukan</p>
          </div>
          <button 
            onClick={() => onNavigate('pengajuan')}
            className="text-xs text-[#6D28D9] hover:text-[#4C1D95] font-bold cursor-pointer bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100"
          >
            Lihat Semua Berkas
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-250 text-slate-400 font-bold tracking-wider uppercase text-[10px]">
                <th className="p-4 text-center">ID</th>
                <th className="p-4">Tanggal Pengajuan</th>
                <th className="p-4">Pemohon (NIK)</th>
                <th className="p-4">Layanan Pengajuan</th>
                <th className="p-4">Status</th>
                <th className="p-4">Petugas Verifikasi</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {recents.slice(0, 5).map((row) => (
                <tr key={row.id_pengajuan} className="border-b border-slate-100 hover:bg-slate-50/30 transition-all font-medium">
                  <td className="p-4 text-center font-mono text-slate-500">#{row.id_pengajuan}</td>
                  <td className="p-4 text-slate-600 font-mono">{row.tanggal_pengajuan}</td>
                  <td className="p-4">
                    <span className="block text-slate-950 font-bold">{row.nama_penduduk}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{row.nik_penduduk}</span>
                  </td>
                  <td className="p-4 text-slate-700 font-semibold">{row.layanan}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      row.status === 'MENUNGGU' ? 'status-menunggu' :
                      row.status === 'DIPROSES' ? 'status-diproses' :
                      row.status === 'SELESAI' ? 'status-selesai' :
                      row.status === 'DITOLAK' ? 'status-ditolak' :
                      'status-kadaluarsa'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500">{row.nama_petugas}</td>
                  <td className="p-4 text-center">
                    <button
                       onClick={() => onNavigate('pengajuan_detail', row.id_pengajuan)}
                      className="bg-purple-50 text-[#6D28D9] border border-purple-200 px-3 py-1.5 rounded-lg font-bold hover:bg-purple-100 hover:text-white hover:bg-[#6D28D9] cursor-pointer transition-all text-xs"
                    >
                      Detail & Mutasi
                    </button>
                  </td>
                </tr>
              ))}
              {recents.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-slate-400">Belum ada pengajuan terdaftar.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
