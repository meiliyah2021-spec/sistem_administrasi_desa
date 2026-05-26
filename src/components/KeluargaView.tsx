import React, { useState } from 'react';
import { Home, Plus, Search, Edit, Trash2, Eye, ArrowLeft, Users } from 'lucide-react';
import { Keluarga, Penduduk, User, Role } from '../types';

interface KeluargaViewProps {
  keluarga: Keluarga[];
  penduduk: Penduduk[];
  user: User | null;
  onAddKeluarga: (no_kk: string, alamat: string) => void;
  onEditKeluarga: (id: number, no_kk: string, alamat: string, h_id: number | null) => void;
  onDeleteKeluarga: (id: number) => void;
  onSetInspection: (action: string, sql: string, plsql: string, flask: string) => void;
}

export default function KeluargaView({
  keluarga,
  penduduk,
  user,
  onAddKeluarga,
  onEditKeluarga,
  onDeleteKeluarga,
  onSetInspection
}: KeluargaViewProps) {
  const [viewState, setViewState] = useState<'list' | 'add' | 'edit' | 'members'>('list');
  const [selectedKK, setSelectedKK] = useState<Keluarga | null>(null);
  const [search, setSearch] = useState('');

  // Form states
  const [noKK, setNoKK] = useState('');
  const [alamat, setAlamat] = useState('');
  const [kepalaId, setKepalaId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setNoKK('');
    setAlamat('');
    setViewState('add');
    onSetInspection(
      "Membuka formulir Pendaftaran Kartu Keluarga",
      "INSERT INTO keluarga (no_kk, alamat) VALUES ('...', '...');",
      `-- PL/SQL Stored Procedure: tambah_keluarga\nCREATE OR REPLACE PROCEDURE tambah_keluarga (\n   p_no_kk IN VARCHAR2,\n   p_alamat IN VARCHAR2,\n   p_id_new OUT NUMBER\n) IS\nBEGIN\n   -- Validasi duplikasi ditangkap di block EXCEPTION\n   INSERT INTO keluarga (no_kk, alamat) VALUES (p_no_kk, p_alamat)\n   RETURNING id_keluarga INTO p_id_new;\n   COMMIT;\nEXCEPTION\n   WHEN DUP_VAL_ON_INDEX THEN\n      ROLLBACK;\n      RAISE_APPLICATION_ERROR(-20021, 'PROSEDUR GAGAL: Nomor KK tersebut sudah terdaftar!');\nEND;`,
      `# routes/keluarga_routes.py\n@keluarga_bp.route('/keluarga/tambah', methods=['POST'])\ndef create():\n    no_kk = request.form.get('no_kk')\n    alamat = request.form.get('alamat')\n    new_id = KeluargaService.create(no_kk, alamat)`
    );
  };

  const handleOpenEdit = (kk: Keluarga) => {
    setSelectedKK(kk);
    setNoKK(kk.no_kk);
    setAlamat(kk.alamat);
    setKepalaId(kk.id_kepala_keluarga ? String(kk.id_kepala_keluarga) : '');
    setViewState('edit');
    onSetInspection(
      `Membuka formulir Edit Kartu Keluarga: KK ${kk.no_kk}`,
      `SELECT * FROM keluarga WHERE id_keluarga = ${kk.id_keluarga};\nSELECT id_penduduk, nama FROM penduduk WHERE id_keluarga = ${kk.id_keluarga};`,
      `-- PL/SQL Stored Procedure: update_keluarga\nCREATE OR REPLACE PROCEDURE update_keluarga (\n   p_id_keluarga IN NUMBER,\n   p_no_kk IN VARCHAR2,\n   p_alamat IN VARCHAR2,\n   p_kepala_keluarga IN NUMBER\n) IS\nBEGIN\n   UPDATE keluarga\n   SET no_kk = p_no_kk,\n       alamat = p_alamat,\n       id_kepala_keluarga = p_kepala_keluarga\n   WHERE id_keluarga = p_id_keluarga;\n   COMMIT;\nEND;`,
      `# services/keluarga_service.py\n@staticmethod\ndef update(id_keluarga, no_kk, alamat, id_kepala_keluarga):\n    call_procedure("update_keluarga", [id_keluarga, no_kk, alamat, id_kepala_keluarga])`
    );
  };

  const handleOpenMembers = (kk: Keluarga) => {
    setSelectedKK(kk);
    setViewState('members');
    onSetInspection(
      `Membaca daftar anggota dalam KK ${kk.no_kk}`,
      `SELECT * FROM penduduk WHERE id_keluarga = ${kk.id_keluarga};`,
      `-- Query dinamis dari database/oracle_helper.py\nSELECT id_penduduk, nik, nama, jenis_kelamin, tanggal_lahir FROM penduduk WHERE id_keluarga = :id_keluarga;`,
      `# services/keluarga_service.py\n@staticmethod\ndef get_members(id_keluarga):\n    return execute_query("SELECT * FROM penduduk WHERE id_keluarga = :id_keluarga", {"id_keluarga": id_keluarga})`
    );
  };

  {errorMessage && (
  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
    {errorMessage}
  </div>
  )}

  const submitAdd = (e: React.FormEvent) => {
  e.preventDefault();
  setErrorMessage(null);

  if (!noKK || !alamat) {
    setErrorMessage("Nomor KK dan alamat wajib diisi");
    return;
  }

  if (noKK.length !== 16) {
    setErrorMessage("Nomor KK harus 16 digit angka");
    return;
  }

  onAddKeluarga(noKK, alamat);
  setViewState('list');
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKK || !noKK || !alamat) return;
    onEditKeluarga(
      selectedKK.id_keluarga, 
      noKK, 
      alamat, 
      kepalaId ? Number(kepalaId) : null
    );
    setViewState('list');
  };

  const filteredKK = keluarga.filter(k => 
    k.no_kk.includes(search) || 
    k.alamat.toLowerCase().includes(search.toLowerCase()) ||
    (k.nama_kepala_keluarga && k.nama_kepala_keluarga.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm justify-between items-center">
        <div>
          <h1 className="text-xl font-black font-display text-slate-950 tracking-tight">Master Data Keluarga</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Gunakan tab ini untuk mengelola Kartu Keluarga (KK) dan data kepala keluarga.</p>
        </div>
        {viewState === 'list' && user?.nama_role === Role.ADMIN && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md cursor-pointer hover:brightness-110 transition-all border border-purple-600/30"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Tambah KK Baru</span>
          </button>
        )}
      </div>

      {viewState === 'list' && (
        <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
          {/* SEARCH */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex">
            <div className="w-full max-w-md relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="Cari KK berdasarkan No KK, alamat, kepala keluarga..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs bg-white border border-slate-205 pl-10 pr-4 py-3 rounded-xl text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold tracking-wider uppercase text-[10px]">
                  <th className="p-4 text-center">ID</th>
                  <th className="p-4">Nomor KK</th>
                  <th className="p-4">Alamat Domisili</th>
                  <th className="p-4">Kepala Keluarga</th>
                  <th className="p-4 text-center">Anggota</th>
                  <th className="p-4 text-center">Aksi Operasi (Oracle SP)</th>
                </tr>
              </thead>
              <tbody>
                {filteredKK.map((row) => (
                  <tr key={row.id_keluarga} className="border-b border-slate-100 hover:bg-slate-50/40 transition-all font-medium">
                    <td className="p-4 text-center font-mono text-slate-500">#{row.id_keluarga}</td>
                    <td className="p-4 text-slate-950 font-bold tracking-wider font-mono text-[13px]">{row.no_kk}</td>
                    <td className="p-4 text-slate-650 font-medium max-w-xs truncate">{row.alamat}</td>
                    <td className="p-4">
                      {row.id_kepala_keluarga ? (
                        <span className="text-slate-950 font-bold bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-[11px] shadow-sm">
                          {row.nama_kepala_keluarga}
                        </span>
                      ) : (
                        <span className="text-amber-600 font-semibold bg-amber-50 px-3 py-1 rounded-full border border-amber-200 text-[11px] select-none">
                          Belum Ditentukan
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-purple-50 border border-purple-100 text-[#6D28D9] px-3 py-1 rounded-full font-bold text-[10px] shadow-sm">
                        {row.jumlah_anggota} Warga
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenMembers(row)}
                          className="bg-purple-50 text-[#6D28D9] hover:bg-[#6D28D9] hover:text-white border border-purple-100 p-2 rounded-xl cursor-pointer transition-all"
                          title="Anggota Keluarga"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {user?.nama_role === Role.ADMIN && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(row)}
                              className="bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white border border-amber-200 p-2 rounded-xl cursor-pointer transition-all"
                              title="Edit Data KK"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm("Hapus KK ini? Seluruh data penduduk di dalamnya akan ikut dihapus (ON DELETE CASCADE)")) {
                                  onDeleteKeluarga(row.id_keluarga);
                                }
                              }}
                              className="bg-rose-50 text-rose-600 hover:bg-rose-650 hover:text-white border border-rose-200 p-2 rounded-xl cursor-pointer transition-all"
                              title="Hapus KK"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FORM TAMBAH (ADD) */}
      {viewState === 'add' && (
        <div className="bg-white rounded-[28px] border border-slate-200 shadow-md p-6 max-w-xl">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setViewState('list')}
              className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 cursor-pointer transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-display">Daftarkan Kartu Keluarga Baru</h2>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Oracle PL/SQL Stored Procedure</span>
            </div>
          </div>
          {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
          </div>
          )}
          <form onSubmit={submitAdd} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Nomor Kartu Keluarga (KK) (16 Digit)*</label>
              <input
                type="text"
                maxLength={16}
                required
                value={noKK}
                onChange={(e) => setNoKK(e.target.value.replace(/\D/g, ''))}
                className="w-full border border-slate-200 px-3.5 py-3 rounded-xl bg-white text-slate-800 font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium text-sm"
                placeholder="Contoh: 3201234567890001"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Alamat Domisili Keluarga*</label>
              <textarea
                required
                rows={3}
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                className="w-full border border-slate-200 px-3.5 py-3 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium text-sm"
                placeholder="Contoh: Jalan Merdeka No. 10, RT 01 RW 02"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white font-bold py-3.5 rounded-xl cursor-pointer hover:brightness-110 transition-all text-xs shadow-md mt-2"
            >
              Simpan Keluarga
            </button>
          </form>
        </div>
      )}

      {/* FORM EDIT */}
      {viewState === 'edit' && selectedKK && (
        <div className="bg-white rounded-[28px] border border-slate-200 shadow-md p-6 max-w-xl">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setViewState('list')}
              className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 cursor-pointer transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-slate-900 font-display">Edit Kartu Keluarga #{selectedKK.id_keluarga}</h2>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Oracle DB UPDATE_KELUARGA</span>
            </div>
          </div>

          <form onSubmit={submitEdit} className="space-y-4 text-xs font-semibold text-slate-700">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Nomor Kartu Keluarga (KK)*</label>
              <input
                type="text"
                maxLength={16}
                required
                value={noKK}
                onChange={(e) => setNoKK(e.target.value.replace(/\D/g, ''))}
                className="w-full border border-slate-200 px-3.5 py-3 rounded-xl bg-white text-slate-800 font-mono tracking-wider focus:outline-none font-medium text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Alamat Domisili*</label>
              <textarea
                required
                rows={3}
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
                className="w-full border border-slate-200 px-3.5 py-3 rounded-xl bg-white text-slate-800 focus:outline-none font-medium text-sm"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Kepala Keluarga (Penduduk terdaftar di KK ini)</label>
              <select
                value={kepalaId}
                onChange={(e) => setKepalaId(e.target.value)}
                className="w-full border border-slate-200 px-3.5 py-3 rounded-xl bg-white text-slate-800 focus:outline-none font-medium text-sm"
              >
                <option value="">-- Tentukan Kepala Keluarga --</option>
                {membersInKK(selectedKK.id_keluarga).map((m) => (
                  <option key={m.id_penduduk} value={m.id_penduduk}>{m.nama} ({m.nik})</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white font-bold py-3.5 rounded-xl cursor-pointer hover:brightness-110 transition-all text-xs shadow-md mt-2"
            >
              Simpan Perubahan (Call update_keluarga)
            </button>
          </form>
        </div>
      )}

      {/* ANGGOTA KELUARGA DETAIL SCREEN */}
      {viewState === 'members' && selectedKK && (
        <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewState('list')}
                className="p-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 cursor-pointer transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-sm font-bold text-slate-900 font-display">
                  Anggota Keluarga (KK No. {selectedKK.no_kk})
                </h2>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Oracle Relational View</span>
              </div>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Alamat: <span className="font-bold text-slate-905">{selectedKK.alamat}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold tracking-wider uppercase text-[10px]">
                  <th className="p-4">ID Penduduk</th>
                  <th className="p-4">NIK</th>
                  <th className="p-4">Nama Lengkap</th>
                  <th className="p-4">Jenis Kelamin</th>
                  <th className="p-4">Tanggal Lahir</th>
                </tr>
              </thead>
              <tbody>
                {membersInKK(selectedKK.id_keluarga).map((m) => (
                  <tr key={m.id_penduduk} className="border-b border-slate-100 hover:bg-slate-50/40 transition-all font-medium">
                    <td className="p-4 font-mono text-slate-400">#{m.id_penduduk}</td>
                    <td className="p-4 font-mono text-slate-950 font-bold text-[13px]">{m.nik}</td>
                    <td className="p-4 font-bold text-slate-800">{m.nama}</td>
                    <td className="p-4">
                      {m.jenis_kelamin === 'L' ? (
                        <span className="bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-bold">Laki-laki</span>
                      ) : (
                        <span className="bg-pink-50 border border-pink-100 text-pink-700 px-3 py-1 rounded-full text-[10px] font-bold">Perempuan</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-600 font-mono">{m.tanggal_lahir}</td>
                  </tr>
                ))}
                {membersInKK(selectedKK.id_keluarga).length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-slate-400">Belum ada penduduk terdaftar di KK ini.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  function membersInKK(id: number) {
    return penduduk.filter(p => p.id_keluarga === id);
  }
}
