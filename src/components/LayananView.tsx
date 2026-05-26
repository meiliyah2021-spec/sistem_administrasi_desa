import React, { useState } from 'react';
import { Server, Plus, Search, Edit, Power, ArrowLeft } from 'lucide-react';
import { Layanan, User, Role } from '../types';

interface LayananViewProps {
  layanan: Layanan[];
  user: User | null;
  onAddLayanan: (nama: string, deskripsi: string) => void;
  onEditLayanan: (id: number, nama: string, deskripsi: string, status: 'Y' | 'N') => void;
  onDeactivateLayanan: (id: number) => void;
  onSetInspection: (action: string, sql: string, plsql: string, flask: string) => void;
}

export default function LayananView({
  layanan,
  user,
  onAddLayanan,
  onEditLayanan,
  onDeactivateLayanan,
  onSetInspection
}: LayananViewProps) {
  const [viewState, setViewState] = useState<'list' | 'add' | 'edit'>('list');
  const [selectedLayanan, setSelectedLayanan] = useState<Layanan | null>(null);
  const [search, setSearch] = useState('');

  // Form states
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [status, setStatus] = useState<'Y' | 'N'>('Y');

  const handleOpenAdd = () => {
    setNama('');
    setDeskripsi('');
    setViewState('add');
    onSetInspection(
      "Membuka formulir Pendaftaran Jenis Layanan Baru",
      "INSERT INTO layanan (nama_layanan, deskripsi, status_aktif) VALUES ('...', '...', 'Y');",
      `-- PL/SQL Stored Procedure: tambah_layanan\nCREATE OR REPLACE PROCEDURE tambah_layanan (\n   p_nama_layanan IN VARCHAR2,\n   p_deskripsi IN VARCHAR2,\n   p_id_new OUT NUMBER\n) IS\nBEGIN\n   INSERT INTO layanan (nama_layanan, deskripsi, status_aktif) VALUES (p_nama_layanan, p_deskripsi, 'Y')\n   RETURNING id_layanan INTO p_id_new;\n   COMMIT;\nEXCEPTION\n   WHEN DUP_VAL_ON_INDEX THEN\n      ROLLBACK;\n      RAISE_APPLICATION_ERROR(-20027, 'PROSEDUR GAGAL: Nama layanan sudah terdaftar!');\nEND;`,
      `# routes/layanan_routes.py\n@layanan_bp.route('/layanan/tambah', methods=['POST'])\ndef create():\n    nama = request.form.get('nama_layanan')\n    deskripsi = request.form.get('deskripsi')\n    new_id = LayananService.create(nama, deskripsi)`
    );
  };

  const handleOpenEdit = (l: Layanan) => {
    setSelectedLayanan(l);
    setNama(l.nama_layanan);
    setDeskripsi(l.deskripsi);
    setStatus(l.status_aktif);
    setViewState('edit');
    onSetInspection(
      `Membuka formulir Edit Layanan kependudukan: ${l.nama_layanan}`,
      `SELECT * FROM layanan WHERE id_layanan = ${l.id_layanan};`,
      `-- PL/SQL Stored Procedure: update_layanan\nCREATE OR REPLACE PROCEDURE update_layanan (\n   p_id_layanan IN NUMBER,\n   p_nama_layanan IN VARCHAR2,\n   p_deskripsi IN VARCHAR2,\n   p_status_aktif IN VARCHAR2\n) IS\nBEGIN\n   UPDATE layanan\n   SET nama_layanan = p_nama_layanan,\n       deskripsi = p_deskripsi,\n       status_aktif = p_status_aktif\n   WHERE id_layanan = p_id_layanan;\n   COMMIT;\nEND;`,
      `# services/layanan_service.py\n@staticmethod\ndef update(id, nama, desc, status):\n    call_procedure("update_layanan", [id, nama, desc, status])`
    );
  };

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama) return;
    onAddLayanan(nama, deskripsi);
    setViewState('list');
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLayanan || !nama) return;
    onEditLayanan(selectedLayanan.id_layanan, nama, deskripsi, status);
    setViewState('list');
  };

  const filteredLayanan = layanan.filter(l =>
    l.nama_layanan.toLowerCase().includes(search.toLowerCase()) ||
    l.deskripsi.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm justify-between items-center text-xs">
        <div>
          <h1 className="text-xl font-black font-display text-slate-950 tracking-tight text-slate-900">Master Layanan Publik</h1>
          <p className="text-slate-500 mt-1 font-medium">Daftar layanan kependudukan legalitas yang dikeluarkan instansi Kantor Desa.</p>
        </div>
        {viewState === 'list' && user?.nama_role === Role.ADMIN && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md cursor-pointer hover:brightness-110 transition-all border border-purple-600/30"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Tambah Layanan Baru</span>
          </button>
        )}
      </div>

      {viewState === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {filteredLayanan.map((row) => (
            <div key={row.id_layanan} className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm flex flex-col justify-between hover:border-purple-300 transition-all">
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] text-slate-400 font-bold">ID LAYANAN: #{row.id_layanan}</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                    row.status_aktif === 'Y' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm' 
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {row.status_aktif === 'Y' ? "AKTIF" : "NONAKTIF"}
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-950 font-display">{row.nama_layanan}</h3>
                <p className="text-slate-600 text-xs leading-relaxed font-medium">{row.deskripsi}</p>
              </div>

              {/* ACTIONS */}
              {user?.nama_role === Role.ADMIN && (
                <div className="border-t border-slate-100 pt-4 mt-6 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(row)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl hover:bg-amber-100 cursor-pointer transition-all shadow-sm"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Ubah Info</span>
                  </button>
                  {row.status_aktif === 'Y' && (
                    <button
                      onClick={() => {
                        if (window.confirm("Batal mengaktifkan layanan ini? Transaksi berjalan akan diarsipkan secara logis tanpa didelete")) {
                          onDeactivateLayanan(row.id_layanan);
                          onSetInspection(
                            `Menonaktifkan layanan: ${row.nama_layanan}`,
                            `UPDATE layanan SET status_aktif = 'N' WHERE id_layanan = ${row.id_layanan};`,
                            `-- PL/SQL Stored Procedure: nonaktifkan_layanan\nCREATE OR REPLACE PROCEDURE nonaktifkan_layanan (\n   p_id_layanan IN NUMBER\n) IS\nBEGIN\n   UPDATE layanan\n   SET status_aktif = 'N'\n   WHERE id_layanan = p_id_layanan;\n   COMMIT;\nEND;`,
                            `# routes/layanan_routes.py\n@layanan_bp.route('/layanan/deaktivasi/<int:id_layanan>', methods=['POST'])\ndef deactivate(id_layanan):\n    LayananService.deactivate(id_layanan)`
                          );
                        }
                      }}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl hover:bg-rose-100 cursor-pointer transition-all shadow-sm"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>Nonaktifkan</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FORM ADD LAYANAN */}
      {viewState === 'add' && (
        <div className="bg-white rounded-[28px] border border-slate-200 shadow-md p-6 max-w-xl text-xs space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => setViewState('list')}
              className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 cursor-pointer transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-slate-950 font-display">Rilis Layanan Baru (Oracle DB Insertion)</h2>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Oracle PL/SQL TAMBAH_LAYANAN</span>
            </div>
          </div>

          <form onSubmit={submitAdd} className="space-y-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Nama Jenis Layanan Kependudukan*</label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full border border-slate-205 px-3.5 py-3 rounded-xl bg-white text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Contoh: Surat Pengantar SKCK Desa"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Deskripsi & Syarat Prasyarat Administratif*</label>
              <textarea
                required
                rows={4}
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                className="w-full border border-slate-205 px-3.5 py-3 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                placeholder="Tuliskan kelengkapan berkas yang diperlukan..."
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white font-bold py-3.5 rounded-xl cursor-pointer hover:brightness-110 text-xs transition-all shadow-md"
            >
              Publikasikan Layanan (Call SP: tambah_layanan)
            </button>
          </form>
        </div>
      )}

      {/* FORM EDIT LAYANAN */}
      {viewState === 'edit' && selectedLayanan && (
        <div className="bg-white rounded-[28px] border border-slate-200 shadow-md p-6 max-w-xl text-xs space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => setViewState('list')}
              className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 cursor-pointer transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-slate-950 font-display">Modifikasi Parameter Layanan #{selectedLayanan.id_layanan}</h2>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Oracle PL/SQL UPDATE_LAYANAN</span>
            </div>
          </div>

          <form onSubmit={submitEdit} className="space-y-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Nama Jenis Layanan*</label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full border border-slate-205 px-3.5 py-3 rounded-xl bg-white text-slate-800 font-bold focus:outline-none font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Deskripsi dan Persyaratan*</label>
              <textarea
                required
                rows={4}
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                className="w-full border border-slate-205 px-3.5 py-3 rounded-xl bg-white text-slate-800 focus:outline-none font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Status Keaktifan Publikasi*</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Y' | 'N')}
                className="w-full border border-slate-205 px-3.5 py-3 rounded-xl bg-white text-slate-800 focus:outline-none font-medium"
              >
                <option value="Y">Aktif / Dapat Diakses Penduduk (Y)</option>
                <option value="N">Nonaktif / Ditangguhkan Sementara (N)</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white font-bold py-3.5 rounded-xl cursor-pointer hover:brightness-110 text-xs transition-all shadow-md"
            >
              Simpan Pemutakhiran (Call update_layanan)
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
