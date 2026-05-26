import React, { useState } from 'react';
import { 
  FileText, Plus, Search, Eye, ArrowLeft, AlertTriangle, 
  CheckCircle, Play, XCircle, Clock, Calendar, CornerDownRight, ShieldAlert 
} from 'lucide-react';
import { Pengajuan, Penduduk, Layanan, RiwayatStatus, User, Role } from '../types';

interface PengajuanViewProps {
  pengajuan: Pengajuan[];
  riwayat: RiwayatStatus[];
  penduduk: Penduduk[];
  layanan: Layanan[];
  user: User | null;
  onAddPengajuan: (id_penduduk: number, id_layanan: number, catatan: string) => string | boolean;
  onUpdateStatus: (id_pengajuan: number, id_status: number, status: 'MENUNGGU' | 'DIPROSES' | 'SELESAI' | 'DITOLAK' | 'KADALUARSA', catatan: string) => void;
  onSetInspection: (action: string, sql: string, plsql: string, flask: string) => void;
  initialSelectedId: number | null;
}

export default function PengajuanView({
  pengajuan,
  riwayat,
  penduduk,
  layanan,
  user,
  onAddPengajuan,
  onUpdateStatus,
  onSetInspection,
  initialSelectedId
}: PengajuanViewProps) {
  const [viewState, setViewState] = useState<'list' | 'add' | 'detail'>(initialSelectedId ? 'detail' : 'list');
  const [selectedId, setSelectedId] = useState<number | null>(initialSelectedId);
  const [search, setSearch] = useState('');
  const [oracleError, setOracleError] = useState<string | null>(null);

  // Form states
  const [idPenduduk, setIdPenduduk] = useState('');
  const [idLayanan, setIdLayanan] = useState('');
  const [catatan, setCatatan] = useState('');
  
  // Transition Form state
  const [catatanStatus, setCatatanStatus] = useState('');

  const handleOpenAdd = () => {
    setIdPenduduk('');
    setIdLayanan('');
    setCatatan('');
    setOracleError(null);
    setViewState('add');
    onSetInspection(
      "Membuka form pendaftaran pengajuan berkas",
      "SELECT boleh_mengajukan(:id_pndk) FROM DUAL; -- Preflight check",
      `-- PL/SQL Stored Procedure: tambah_pengajuan_dengan_layanan\nCREATE OR REPLACE PROCEDURE tambah_pengajuan_dengan_layanan (\n   p_id_penduduk IN NUMBER, p_id_petugas IN NUMBER, p_id_layanan IN NUMBER,\n   p_catatan IN VARCHAR2, p_id_new OUT NUMBER\n) IS\n   v_boleh VARCHAR2(100);\nBEGIN\n   -- 1. Evaluasi Kelayakan Pemohon via Function\n   v_boleh := boleh_mengajukan(p_id_penduduk);\n   IF v_boleh != 'BOLEH' THEN\n      RAISE_APPLICATION_ERROR(-20041, v_boleh);\n   END IF;\n   \n   -- 2. Evaluasi Keaktifan Layanan via Function\n   IF cek_layanan_aktif(p_id_layanan) = 0 THEN\n      RAISE_APPLICATION_ERROR(-20042, 'VALIDASI GAGAL: Layanan ditangguhkan.');\n   END IF;\n\n   -- 3. Simpan berkas (MENUNGGU - ID: 1)\n   INSERT INTO pengajuan (id_penduduk, id_petugas, id_status, catatan_status) \n   VALUES (p_id_penduduk, p_id_petugas, 1, p_catatan) RETURNING id_pengajuan INTO p_id_new;\n   \n   INSERT INTO pengajuan_layanan VALUES (p_id_new, p_id_layanan);\n   COMMIT;\nEND;`,
      `# services/pengajuan_service.py\n@staticmethod\ndef create(id_penduduk, id_petugas, id_layanan, catatan):\n    auth_res = call_function("boleh_mengajukan", oracledb.STRING, [id_penduduk])\n    if auth_res != "BOLEH":\n         raise ValueError(auth_res)\n    # Call Prosedur`
    );
  };

  const handleOpenDetail = (id: number) => {
    setSelectedId(id);
    setCatatanStatus('');
    setOracleError(null);
    setViewState('detail');
    onSetInspection(
      `Membuka pelacakan riwayat dokumen: Pengajuan #${id}`,
      `SELECT * FROM pengajuan WHERE id_pengajuan = ${id};\nSELECT * FROM riwayat_status_pengajuan WHERE id_pengajuan = ${id} ORDER BY tanggal_update DESC;`,
      `-- Dipesan otomatis ke web client untuk rendering riwayat\n-- Menampilkan riwayat mutasi dari tabel riwayat_status_pengajuan`,
      `# routes/pengajuan_routes.py\n@pengajuan_bp.route('/pengajuan/detail/<int:id_pengajuan>')\ndef detail(id_pengajuan):\n    item = PengajuanService.get_by_id(id_pengajuan)\n    riwayat = PengajuanService.get_riwayat(id_pengajuan)`
    );
  };

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setOracleError(null);
    if (!idPenduduk || !idLayanan) return;

    // Simulated pre-flight check mimicking Oracle Function boleh_mengajukan(id_penduduk)
    const activeSubmissionsCount = pengajuan.filter(p => p.id_penduduk === Number(idPenduduk) && (p.status === 'MENUNGGU' || p.status === 'DIPROSES')).length;
    if (activeSubmissionsCount >= 2) {
      setOracleError("ORA-20041: Oracle Validasi Bisnis Gagal: TIDAK_BOLEH: Penduduk sedang memiliki 2 berkas yang aktif menunggu/diproses!");
      return;
    }

    // Simulated pre-flight check mimicking Oracle Function cek_layanan_aktif(id_layanan)
    const selectedServiceObj = layanan.find(l => l.id_layanan === Number(idLayanan));
    if (selectedServiceObj?.status_aktif === 'N') {
      setOracleError("ORA-20042: Oracle Validasi Bisnis Gagal: VALIDASI GAGAL: Layanan yang dipilih sedang tidak aktif/ditangguhkan oleh Desa.");
      return;
    }

    const res = onAddPengajuan(Number(idPenduduk), Number(idLayanan), catatan);
    if (typeof res === 'string') {
      setOracleError(res);
    } else {
      setViewState('list');
    }
  };

  const handleUpdate = (id_status: number, statusStr: 'MENUNGGU' | 'DIPROSES' | 'SELESAI' | 'DITOLAK' | 'KADALUARSA') => {
    if (!selectedId) return;
    if (!catatanStatus) {
      alert("Masukkan catatan tindak lanjut laporan berkas!");
      return;
    }
    onUpdateStatus(selectedId, id_status, statusStr, catatanStatus);
    setCatatanStatus('');
    
    // Log inspection
    onSetInspection(
      `Melakukan Mutasi Status berkas #${selectedId} -> ${statusStr}`,
      `UPDATE pengajuan SET id_status = ${id_status}, catatan_status = '${catatanStatus}' WHERE id_pengajuan = ${selectedId};\nINSERT INTO riwayat_status_pengajuan ...;`,
      `-- PL/SQL Procedure: update_status_pengajuan\nCREATE OR REPLACE PROCEDURE update_status_pengajuan (\n   p_id_pengajuan IN NUMBER,\n   p_id_status IN NUMBER,\n   p_id_petugas IN NUMBER,\n   p_catatan IN VARCHAR2\n) IS\nBEGIN\n   UPDATE pengajuan SET id_status = p_id_status, catatan_status = p_catatan WHERE id_pengajuan = p_id_pengajuan;\n   INSERT INTO riwayat_status_pengajuan (id_pengajuan, id_status, id_petugas, catatan)\n   VALUES (p_id_pengajuan, p_id_status, p_id_petugas, p_catatan);\n   COMMIT;\nEND;`,
      `# routes/pengajuan_routes.py\n@pengajuan_bp.route('/pengajuan/update-status/<int:id_pengajuan>', methods=['POST'])\ndef update_status(id_pengajuan):\n    PengajuanService.update_status(id_pengajuan, id_status, session['id_petugas'], catatan)`
    );
  };

  const filteredPengajuan = pengajuan.filter((p: Pengajuan) => {
  const keyword = search.toLowerCase();

  return (
    (p.nama_penduduk || '').toLowerCase().includes(keyword) ||
    (p.nik_penduduk || '').includes(search) ||
    (p.layanan || '').toLowerCase().includes(keyword)
  );
});

  const activeDetail = selectedId ? pengajuan.find(p => p.id_pengajuan === selectedId) : null;
  const activeRiwayat = selectedId ? riwayat.filter(r => r.id_pengajuan === selectedId) : [];

  return (
    <div className="space-y-6 text-xs">
      {/* HEADER */}
      <div className="flex bg-white p-6 rounded-2xl border border-slate-100 shadow-sm justify-between items-center">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-800">Pelayanan & Kependudukan (Transaksi)</h1>
          <p className="text-slate-400 mt-1">Registrasi berkas administrasi dan tracking workflow disposisi surat desa.</p>
        </div>
        {viewState === 'list' && (user?.nama_role === Role.ADMIN || user?.nama_role === Role.PETUGAS) && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-700 to-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:from-purple-800 hover:to-indigo-800 cursor-pointer transition-all"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Mulai Registrasi Berkas</span>
          </button>
        )}
      </div>

      {viewState === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* SEARCH */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex">
            <div className="w-full max-w-md relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari berkas berdasarkan nama kepala/pemohon, NIK, jenis layanan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold tracking-wider text-[10px] uppercase">
                  <th className="p-4 text-center">ID</th>
                  <th className="p-4">Tanggal Pengajuan</th>
                  <th className="p-4">Pemohon</th>
                  <th className="p-4">Jenis Layanan</th>
                  <th className="p-4">Status Dokumen</th>
                  <th className="p-4">Petugas Pengampu</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredPengajuan.map((row: Pengajuan) => (
                  <tr key={row.id_pengajuan} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all font-medium">
                    <td className="p-4 text-center font-mono text-slate-500">#{row.id_pengajuan}</td>
                    <td className="p-4 text-slate-500">{row.tanggal_pengajuan}</td>
                    <td className="p-4">
                      <span className="block text-slate-800 font-bold">{row.nama_penduduk}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold tracking-wider">{row.nik_penduduk}</span>
                    </td>
                    <td className="p-4 text-slate-700 font-bold">{row.layanan}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
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
                        onClick={() => handleOpenDetail(row.id_pengajuan)}
                        className="bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 p-2 rounded-lg cursor-pointer transition-all"
                        title="Tindak Lanjut & Pelacakan"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPengajuan.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-slate-400">Belum ada pengajuan berkas terdaftar.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW FORM TAMBAH STRUKTUR PENGAJUAN */}
      {viewState === 'add' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-xl space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewState('list')}
              className="p-1 px-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" /> Kembali
            </button>
            <h2 className="text-sm font-bold text-slate-800">Registrasikan Pengajuan Berkas Baru</h2>
          </div>

          {oracleError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-2 font-mono">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
              <div>
                <strong className="block text-rose-900">Oracle PL/SQL Business Constraint Rejection</strong>
                <span className="text-xs">{oracleError}</span>
              </div>
            </div>
          )}

          <form onSubmit={submitAdd} className="space-y-4">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Pilih Pemohon (Penduduk terdaftar)*</label>
              <select
                required
                value={idPenduduk}
                onChange={(e) => setIdPenduduk(e.target.value)}
                className="w-full border border-slate-200 px-3 py-2.5 rounded-xl bg-white text-slate-700 font-bold"
              >
                <option value="">-- Cari / Pilih Penduduk Pemohon --</option>
                {penduduk.map((p) => (
                  <option key={p.id_penduduk} value={p.id_penduduk}>{p.nama} ({p.nik})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Jenis Layanan Administratif (Layanan Aktif)*</label>
              <select
                required
                value={idLayanan}
                onChange={(e) => setIdLayanan(e.target.value)}
                className="w-full border border-slate-200 px-3 py-2.5 rounded-xl bg-white text-slate-700"
              >
                <option value="">-- Pilih Layanan Urusan --</option>
                {layanan.map((l) => (
                  <option key={l.id_layanan} value={l.id_layanan}>
                    {l.nama_layanan} {l.status_aktif === 'N' ? '(TANGGUH / TIDAK AKTIF)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Catatan Keperluan Pembuat Dokumen</label>
              <textarea
                rows={3}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full border border-slate-200 px-3 py-2.5 rounded-xl bg-white text-slate-700"
                placeholder="Misal: KTP hilang karena kecelakaan, memohon surat pengantar cetak ulang"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold p-3 rounded-xl cursor-pointer hover:from-purple-800 text-xs transition-all"
            >
              Simpan Berkas Transaksi 
            </button>
          </form>
        </div>
      )}

      {/* DETAIL DOSSIER & WORKFLOW TRANSITIONS */}
      {viewState === 'detail' && activeDetail && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* LEFT: INFORMATION DETAIL */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <button
                onClick={() => setViewState('list')}
                className="p-1 px-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 inline mr-1" /> Kembali
              </button>
              <span className="font-mono text-slate-400 font-bold uppercase tracking-wider">Berkas ID: #{activeDetail.id_pengajuan}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Jenis Layanan</label>
                <span className="text-sm font-bold text-slate-800 block mt-1">{activeDetail.layanan}</span>
              </div>
              <div>
                <label className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Tanggal Pengajuan</label>
                <span className="text-sm font-mono font-bold text-slate-700 block mt-1">{activeDetail.tanggal_pengajuan}</span>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <label className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Nama Pemohon (NIK)</label>
                <span className="text-sm font-bold text-slate-700 block mt-1">{activeDetail.nama_penduduk}</span>
                <span className="text-xs font-mono text-slate-400 block mt-0.5">{activeDetail.nik_penduduk}</span>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <label className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">No. Kartu Keluarga (Domisili)</label>
                <span className="text-sm font-mono font-bold text-slate-700 block mt-1">{activeDetail.no_kk_penduduk}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{activeDetail.alamat_penduduk}</span>
              </div>
              <div className="col-span-2 border-t border-slate-100 pt-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block">Catatan Tambahan Berkas</label>
                <span className="text-xs text-slate-700 font-bold block mt-1 italic">"{activeDetail.catatan_status}"</span>
              </div>
            </div>

            {/* CHRONOLOGY TRACK TABLE */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="font-bold text-slate-700 flex items-center gap-1.5 font-display text-sm">
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                <span>Pelacakan Kronologi Dokumen (riwayat_status_pengajuan)</span>
              </h3>
              <div className="relative pl-6 space-y-4">
                {/* Horizontal progress indicators */}
                <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-purple-200" />
                {activeRiwayat.map((step, idx) => (
                  <div key={idx} className="relative flex items-start gap-4">
                    <div className="absolute -left-[20px] bg-purple-600 rounded-full w-2.5 h-2.5 ring-4 ring-purple-100 top-1" />
                    <div className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 border text-[9px] rounded font-bold uppercase ${
                          step.status === 'MENUNGGU' ? 'status-menunggu' :
                          step.status === 'DIPROSES' ? 'status-diproses' :
                          step.status === 'SELESAI' ? 'status-selesai' :
                          step.status === 'DITOLAK' ? 'status-ditolak' :
                          'status-kadaluarsa'
                        }`}>
                          {step.status}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400">{step.tanggal_update}</span>
                      </div>
                      <p className="text-slate-700 text-xs font-semibold mt-2">"{step.catatan}"</p>
                      <div className="text-[9px] text-slate-400 mt-1">Disahkan Oleh Petugas: <strong className="text-slate-500">{step.petugas}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: MUTATION DISPOSITIONS */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold font-display text-slate-800 flex items-center gap-1">
              <span>Mutasikan Berkas</span>
            </h2>
            <p className="text-[11px] text-slate-400">Pilih disposisi status di bawah untuk melanjutkan mutasi berkas ke dalam instansi selanjutnya.</p>
            
            {/* ALERT */}
            {activeDetail.status === 'SELESAI' || activeDetail.status === 'DITOLAK' || activeDetail.status === 'KADALUARSA' ? (
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl text-center text-slate-500">
                Berkas telah ditutup dengan status final <span className="font-bold font-mono">"{activeDetail.status}"</span>. Tidak dapat dimutasikan lagi.
              </div>
            ) : (user?.nama_role === Role.ADMIN || user?.nama_role === Role.PETUGAS) ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Catatan Tindak Lanjut Pemutakhiran*</label>
                  <textarea
                    required
                    rows={3}
                    value={catatanStatus}
                    onChange={(e) => setCatatanStatus(e.target.value)}
                    placeholder="Contoh: Berkas dikirim ke camat untuk ditandatangani basah"
                    className="w-full border border-slate-250 px-3 py-2 rounded-lg bg-white text-slate-700 focus:outline-none"
                  />
                </div>
                
                <div className="flex flex-col gap-2 pt-2">
                  {/* Selesai */}
                  <button
                    onClick={() => handleUpdate(3, 'SELESAI')}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold p-2.5 rounded-lg text-xs cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Sahkan Selesai (SELESAI)</span>
                  </button>

                  {/* Proses */}
                  {activeDetail.status === 'MENUNGGU' && (
                    <button
                      onClick={() => handleUpdate(2, 'DIPROSES')}
                      className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold p-2.5 rounded-lg text-xs cursor-pointer"
                    >
                      <Play className="w-4 h-4" />
                      <span>Verifikasi Diproses (DIPROSES)</span>
                    </button>
                  )}

                  {/* Tolak */}
                  <button
                    onClick={() => handleUpdate(4, 'DITOLAK')}
                    className="w-full flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-bold p-2.5 rounded-lg text-xs cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Tolak Berkas (DITOLAK)</span>
                  </button>

                  {/* Kadaluarsa */}
                  <button
                    onClick={() => handleUpdate(5, 'KADALUARSA')}
                    className="w-full flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white font-bold p-2.5 rounded-lg text-xs cursor-pointer"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Set Kadaluarsa (KADALUARSA)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-rose-50 p-4 border border-rose-200 text-rose-800 rounded-xl text-center">
                User Anda (pimpinan) tidak berhak mengubah disposisi status dokumen. Hanya Admin/Petugas yang berhak memutasikan.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
