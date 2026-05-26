import React, { useState } from 'react';
import { Search, Filter, Download, ArrowLeft, Printer, AlertTriangle } from 'lucide-react';
import { Pengajuan, Layanan } from '../types';

interface LaporanViewProps {
  pengajuan: Pengajuan[];
  layanan: Layanan[];
  onSetInspection: (action: string, sql: string, plsql: string, flask: string) => void;
}

export default function LaporanView({
  pengajuan,
  layanan,
  onSetInspection
}: LaporanViewProps) {
  const [tglAwal, setTglAwal] = useState('');
  const [tglAkhir, setTglAkhir] = useState('');
  const [selectedLayanan, setSelectedLayanan] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [keyword, setKeyword] = useState('');
  

  // Trigger inspection log on filter action
  const handleFilterInspect = () => {
    onSetInspection(
      "Melakukan Penyaringan Multi-Faset Laporan Administrasi",
      `SELECT * FROM laporan_pengajuan_layanan \nWHERE (tanggal_pengajuan BETWEEN '${tglAwal || '2026-05-01'}' AND '${tglAkhir || '2026-05-31'}')\nAND ID_LAYANAN = ${selectedLayanan || 'ALL'};\n-- Memanfaatkan relational database views`,
      `-- Database RELATIONAL VIEW: laporan_pengajuan_layanan\nCREATE OR REPLACE VIEW laporan_pengajuan_layanan AS\nSELECT \n   p.id_pengajuan,\n   p.tanggal_pengajuan,\n   pn.nik AS nik_penduduk,\n   pn.nama AS nama_penduduk,\n   k.no_kk AS no_kk_penduduk,\n   k.alamat AS alamat_penduduk,\n   p.id_status,\n   s.nama_status AS status,\n   l.id_layanan,\n   l.nama_layanan AS layanan,\n   p.catatan_status\nFROM pengajuan p\nJOIN penduduk pn ON p.id_penduduk = pn.id_penduduk\nJOIN keluarga k ON pn.id_keluarga = k.id_keluarga\nJOIN status_pengajuan s ON p.id_status = s.id_status\nJOIN pengajuan_layanan pl ON p.id_pengajuan = pl.id_pengajuan\nJOIN layanan l ON pl.id_layanan = l.id_layanan;`,
      `# services/laporan_service.py\n@staticmethod\ndef get_laporan(tgl_awal=None, tgl_akhir=None, id_layanan=None, status=None, search=None):\n    query = "SELECT * FROM laporan_pengajuan_layanan WHERE 1=1"\n    params = {}\n    # Membangun query dinamis di Flask backend`
    );
  };


  const handlePrint = () => {
    window.print();
    onSetInspection(
      "Membuka antarmuka Cetak Dokumen PDF Laporan",
      `-- Memanfaatkan CSS Media Print Stylesheet`,
      `-- Memanfaatkan layout printer responsif template Jinja2`,
      `# routes/laporan_routes.py\n@laporan_bp.route('/laporan/cetak-pdf')\ndef print_report():\n    return render_template('laporan/cetak.html', list=records)`
    );
  };

  // Perform filtering on local state mimicking the DB view
  const records = pengajuan.filter(p => {
    // Filter by dates
    if (tglAwal && p.tanggal_pengajuan < tglAwal) return false;
    if (tglAkhir) {
      // Add one day to end date to encompass whole day
      const filterEnd = new Date(tglAkhir);
      filterEnd.setDate(filterEnd.getDate() + 1);
      const rowDate = new Date(p.tanggal_pengajuan);
      if (rowDate > filterEnd) return false;
    }
    // Filter by Service
    if (selectedLayanan && p.id_layanan !== Number(selectedLayanan)) return false;
    // Filter by Status
    if (selectedStatus && p.status !== selectedStatus) return false;
    // Filter by Keyword (Name or NIK or KK)
    if (keyword) {
      const kw = keyword.toLowerCase();
      const matchName = p.nama_penduduk.toLowerCase().includes(kw);
      const matchNIK = p.nik_penduduk.includes(kw);
      const matchKK = p.no_kk_penduduk.includes(kw);
      if (!matchName && !matchNIK && !matchKK) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 text-xs print:p-0 print:bg-white print:text-black">
      {/* HEADER - Hides on print */}
      <div className="flex bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm justify-between items-center print:hidden">
        <div>
          <h1 className="text-xl font-black font-display text-slate-950 tracking-tight text-slate-900">UAS Laporan & Rekapitulasi Desa</h1>
          <p className="text-slate-500 mt-1 font-medium">Gundukan data statistik kependudukan instansi desa, tersusun dari Oracle View <code className="font-mono text-[#6D28D9] font-bold">laporan_pengajuan_layanan</code>.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Print PDF Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-white border border-slate-205 text-slate-700 font-bold px-3.5 py-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-all shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* FILTER PANEL - Hides on print */}
      <div className="bg-white rounded-[24px] border border-slate-205 p-6 shadow-sm space-y-4 print:hidden">
        <h2 className="font-bold text-slate-950 flex items-center gap-2 font-display text-sm tracking-tight text-slate-900">
          <Filter className="w-4 h-4 text-[#6D28D9]" />
          <span>Saringan Filter Oracle Views (Multi-Search)</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-slate-400 font-bold mb-1.5 uppercase text-[9px] tracking-wider">Tanggal Mulai</label>
            <input
              type="date"
              value={tglAwal}
              onChange={(e) => { setTglAwal(e.target.value); handleFilterInspect(); }}
              className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-slate-700 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-bold mb-1.5 uppercase text-[9px] tracking-wider">Tanggal Akhir</label>
            <input
              type="date"
              value={tglAkhir}
              onChange={(e) => { setTglAkhir(e.target.value); handleFilterInspect(); }}
              className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-slate-700 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 font-bold mb-1.5 uppercase text-[9px] tracking-wider">Jenis Layanan Urusan</label>
            <select
              value={selectedLayanan}
              onChange={(e) => { setSelectedLayanan(e.target.value); handleFilterInspect(); }}
              className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-slate-700 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            >
              <option value="">-- Semua Layanan --</option>
              {layanan.map((l) => (
                <option key={l.id_layanan} value={l.id_layanan}>{l.nama_layanan}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 font-bold mb-1.5 uppercase text-[9px] tracking-wider">Status Disposisi</label>
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); handleFilterInspect(); }}
              className="w-full border border-slate-200 p-2.5 rounded-xl bg-white text-slate-700 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            >
              <option value="">-- Semua Status --</option>
              <option value="MENUNGGU">MENUNGGU</option>
              <option value="DIPROSES">DIPROSES</option>
              <option value="SELESAI">SELESAI</option>
              <option value="DITOLAK">DITOLAK</option>
              <option value="KADALUARSA">KADALUARSA</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-400 font-bold mb-1.5 uppercase text-[9px] tracking-wider">Kata Kunci (Nama/NIK/KK)</label>
            <input
              type="text"
              placeholder="Cari warga..."
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); handleFilterInspect(); }}
              className="w-full text-xs bg-white border border-slate-200 px-3.5 py-3 rounded-xl text-slate-705 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* REPORT CONTENT VIEW - Prints beautifully */}
      <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
        
        {/* Printable Letterhead (Only visible during print) */}
        <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-6">
          <h1 className="text-base uppercase font-black font-display text-slate-900">Sistem Administrasi Kependudukan Desa</h1>
          <h2 className="text-sm uppercase tracking-wide text-slate-700">Kantor Kepala Desa Sukamakmur, Daerah Khusus Kependudukan</h2>
          <p className="text-[10px] text-slate-500 font-mono mt-1">UAS BASIS DATA LANJUT - LAPORAN REKAPITULASI DOKUMEN LAYANAN DESA</p>
          <div className="text-[10px] text-slate-600 mt-2 font-mono">Dibuat otomatis oleh RELATIONAL ORACLE VIEW: laporan_pengajuan_layanan</div>
        </div>

        {/* Info label */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center print:hidden">
          <span className="font-bold text-slate-950">Ditemukan {records.length} Berkas Pelayanan Terhitung</span>
          <span className="text-[10px] text-slate-400 font-semibold font-mono">DBMS Query execution: <code className="font-mono text-[#6D28D9] bg-purple-50 px-1.5 py-0.5 rounded border border-purple-150">0.02ms</code></span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px] print:bg-slate-100 print:text-black">
                <th className="p-4 text-center">ID</th>
                <th className="p-4">Tanggal Pengajuan</th>
                <th className="p-4">Nama Pemohon</th>
                <th className="p-4">NIK Pemohon</th>
                <th className="p-4">No Kartu Keluarga</th>
                <th className="p-4">Nominal Jenis Layanan</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row) => (
                <tr key={row.id_pengajuan} className="border-b border-slate-100 hover:bg-slate-50/40 transition-all font-medium print:text-black">
                  <td className="p-4 text-center font-mono text-slate-400">#{row.id_pengajuan}</td>
                  <td className="p-4 text-slate-500 font-mono">{row.tanggal_pengajuan}</td>
                  <td className="p-4 font-bold text-slate-950 print:text-black">{row.nama_penduduk}</td>
                  <td className="p-4 font-mono text-slate-600">{row.nik_penduduk}</td>
                  <td className="p-4 font-mono text-slate-500">{row.no_kk_penduduk}</td>
                  <td className="p-4 text-slate-800 font-bold">{row.layanan}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 border text-[9px] tracking-wider rounded-full font-bold print:border-none print:p-0 print:font-black ${
                      row.status === 'SELESAI' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                      row.status === 'DIPROSES' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                      row.status === 'DITOLAK' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                      'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center p-12 text-slate-400">Tidak ada pengajuan kependudukan yang cocok dengan parameter filter di atas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Printable Footer (Only visible during print) */}
        <div className="hidden print:flex justify-between items-center mt-12 text-[10px] font-mono">
          <div>
            <p>Dicetak Pada: {new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC</p>
            <p>Pengguna Pemeriksa: Administrator Desa (ADMIN)</p>
          </div>
          <div className="text-center">
            <p>Mengonfirmasi,</p>
            <p className="mt-12 font-bold uppercase underline">Hj. Siti Aminah, S.E.</p>
            <p className="text-[9px] text-slate-500">Kepala Desa Sukamakmur</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
