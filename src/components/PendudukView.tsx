import React, { useState } from 'react';
import { Users, Plus, Search, Edit, Trash2, Eye, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Penduduk, Keluarga, User, Role } from '../types';

interface PendudukViewProps {
  penduduk: Penduduk[];
  keluarga: Keluarga[];
  user: User | null;
  onAddPenduduk: (nik: string, nama: string, jenis_kelamin: 'L' | 'P', tanggal_lahir: string, id_keluarga: number) => string | boolean;
  onEditPenduduk: (id: number, nik: string, nama: string, jenis_kelamin: 'L' | 'P', tanggal_lahir: string, id_keluarga: number) => Promise<boolean>;
  onDeletePenduduk: (id: number) => void;
  onSetInspection: (action: string, sql: string, plsql: string, flask: string) => void;
}

export default function PendudukView({
  penduduk,
  keluarga,
  user,
  onAddPenduduk,
  onEditPenduduk,
  onDeletePenduduk,
  onSetInspection
}: PendudukViewProps) {
  const [viewState, setViewState] = useState<'list' | 'add' | 'edit' | 'detail'>('list');
  const [selectedPenduduk, setSelectedPenduduk] = useState<Penduduk | null>(null);
  const [search, setSearch] = useState('');
  const [oracleError, setOracleError] = useState<string | null>(null);

  // Form states
  const [nik, setNik] = useState('');
  const [nama, setNama] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState<'L' | 'P'>('L');
  const [tanggalLahir, setTanggalLahir] = useState('');
  const [idKeluarga, setIdKeluarga] = useState('');

  const handleOpenAdd = () => {
    setNik('');
    setNama('');
    setJenisKelamin('L');
    setTanggalLahir('');
    setIdKeluarga('');
    setOracleError(null);
    setViewState('add');
    onSetInspection(
      "Membuka formulir Pendaftaran Penduduk baru",
      "INSERT INTO penduduk (nik, nama, jenis_kelamin, tanggal_lahir, id_keluarga) VALUES ('...', '...', '...', TO_DATE('...', 'YYYY-MM-DD'), ...);",
      `-- PL/SQL BEFORE INSERT TRIGGER (trg_penduduk_validate)\nCREATE OR REPLACE TRIGGER trg_penduduk_validate\nBEFORE INSERT OR UPDATE ON penduduk FOR EACH ROW\nBEGIN\n  IF :NEW.nik IS NULL OR LENGTH(TRIM(:NEW.nik)) != 16 THEN\n     RAISE_APPLICATION_ERROR(-20002, 'VALIDASI GAGAL: Nomor NIK harus tepat 16 digit!');\n  END IF;\n  IF TRUNC(:NEW.tanggal_lahir) > TRUNC(SYSDATE) THEN\n     RAISE_APPLICATION_ERROR(-20005, 'VALIDASI GAGAL: Tanggal lahir tidak boleh di masa depan!');\n  END IF;\nEND;`,
      `# routes/penduduk_routes.py\ntry:\n    new_id = PendudukService.create(nik, nama, jk, tgl_lahir, id_klg)\nexcept Exception as e:\n    # Menampilkan pesan fatal ke user\n    flash(str(e), "danger")`
    );
  };

  const handleOpenEdit = (p: Penduduk) => {
    setSelectedPenduduk(p);
    setNik(p.nik);
    setNama(p.nama);
    setJenisKelamin(p.jenis_kelamin);
    setTanggalLahir(p.tanggal_lahir);
    setIdKeluarga(String(p.id_keluarga));
    setOracleError(null);
    setViewState('edit');
    onSetInspection(
      `Membuka edit data penduduk: ${p.nama}`,
      `SELECT * FROM penduduk WHERE id_penduduk = ${p.id_penduduk};`,
      `-- PL/SQL Stored Procedure: update_penduduk\nCREATE OR REPLACE PROCEDURE update_penduduk (\n   p_id_penduduk IN NUMBER,\n   p_nik IN VARCHAR2,\n   p_nama IN VARCHAR2,\n   p_jenis_kelamin IN CHAR,\n   p_tanggal_lahir IN DATE,\n   p_id_keluarga IN NUMBER\n) IS\nBEGIN\n   UPDATE penduduk\n   SET nik = p_nik, nama = p_nama, jenis_kelamin = p_jenis_kelamin,\n       tanggal_lahir = p_tanggal_lahir, id_keluarga = p_id_keluarga\n   WHERE id_penduduk = p_id_penduduk;\n   COMMIT;\nEND;`,
      `# services/penduduk_service.py\n@staticmethod\ndef update(id, nik, nama, jk, tgl, id_klg):\n    call_procedure("update_penduduk", [id, nik, nama, jk, tgl, id_klg])`
    );
  };

  const handleOpenDetail = (p: Penduduk) => {
    const parentKK = keluarga.find(k => k.id_keluarga === p.id_keluarga);
    setSelectedPenduduk({
      ...p,
      no_kk: parentKK?.no_kk || "Tidak terdaftar",
      alamat: parentKK?.alamat || "Tidak terdaftar"
    });
    setViewState('detail');
    onSetInspection(
      `Membuka profil detail penduduk: ${p.nama}`,
      `SELECT p.*, k.no_kk, k.alamat FROM penduduk p JOIN keluarga k ON p.id_keluarga = k.id_keluarga WHERE p.id_penduduk = ${p.id_penduduk};`,
      `-- Diterbangkan ke view web kependudukan\n-- Membuktikan relasi DB berjalan normal`,
      `# routes/penduduk_routes.py\n@penduduk_bp.route('/penduduk/detail/<int:id_penduduk>')\ndef detail(id_penduduk):\n    item = PendudukService.get_by_id(id_penduduk)\n    return render_template('penduduk/detail.html', item=item)`
    );
  };

  const submitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setOracleError(null);

    // Simulated local validator mimicking AFTER trigger & BEFORE trigger
    if (nik.length !== 16) {
      setOracleError("ORA-20002: VALIDASI GAGAL - Nomor NIK harus tepat 16 digit!");
      return;
    }

    const tglParsed = new Date(tanggalLahir);
    const today = new Date();
    if (tglParsed > today) {
      setOracleError("ORA-20005: VALIDASI GAGAL - Tanggal lahir tidak boleh di masa depan!");
      return;
    }

    const result = onAddPenduduk(nik, nama, jenisKelamin, tanggalLahir, Number(idKeluarga));
    if (typeof result === 'string') {
      setOracleError(result);
    } else {
      setViewState('list');
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOracleError(null);
    if (!selectedPenduduk) return;

    // Simulated local validator mimicking Oracle checks
    if (nik.length !== 16) {
      setOracleError("ORA-20002: VALIDASI GAGAL - Nomor NIK harus tepat 16 digit!");
      return;
    }

    const tglParsed = new Date(tanggalLahir);
    const today = new Date();
    if (tglParsed > today) {
      setOracleError("ORA-20005: VALIDASI GAGAL - Tanggal lahir tidak boleh di masa depan!");
      return;
    }

    const result = await onEditPenduduk(selectedPenduduk.id_penduduk, nik, nama, jenisKelamin, tanggalLahir, Number(idKeluarga));
    if (typeof result === 'string') {
      setOracleError(result);
    } else {
      setViewState('list');
    }
  };

  const filteredPenduduk = penduduk.filter(p => 
    p.nama.toLowerCase().includes(search.toLowerCase()) ||
    p.nik.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex bg-white p-6 rounded-2xl border border-slate-100 shadow-sm justify-between items-center text-xs">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-800">Master Data Kependudukan</h1>
          <p className="text-slate-400 mt-1">Registrasi dan modifikasi data biometrik kependudukan desa.</p>
        </div>
        {viewState === 'list' && user?.nama_role === Role.ADMIN && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-700 to-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm hover:from-purple-800 hover:to-indigo-800 cursor-pointer transition-all"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Tambah Penduduk</span>
          </button>
        )}
      </div>

      {viewState === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-xs">
          {/* SEARCH BAR */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex">
            <div className="w-full max-w-md relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari warga berdasarkan nama, NIK..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="p-4 text-center">ID</th>
                  <th className="p-4">NIK</th>
                  <th className="p-4">Nama Lengkap</th>
                  <th className="p-4 text-center">Gender</th>
                  <th className="p-4">Tanggal Lahir</th>
                  <th className="p-4">KK Afiliasi</th>
                  <th className="p-4 text-center">Aksi Operasi</th>
                </tr>
              </thead>
              <tbody>
                {filteredPenduduk.map((row) => {
                  const correlatedKK = keluarga.find(k => k.id_keluarga === row.id_keluarga);
                  return (
                    <tr key={row.id_penduduk} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all font-medium">
                      <td className="p-4 text-center font-mono text-slate-500">#{row.id_penduduk}</td>
                      <td className="p-4 text-slate-800 font-bold font-mono tracking-wider">{row.nik}</td>
                      <td className="p-4 text-slate-800 font-bold">{row.nama}</td>
                      <td className="p-4 text-center">
                        {row.jenis_kelamin === 'L' ? (
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">L</span>
                        ) : (
                          <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded text-[10px] font-bold">P</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-600">{row.tanggal_lahir}</td>
                      <td className="p-4 text-slate-500 max-w-xs truncate" title={correlatedKK?.alamat}>
                        {correlatedKK ? `KK: ${correlatedKK.no_kk}` : "Tidak Terafiliasi"}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenDetail(row)}
                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 p-2 rounded-lg cursor-pointer transition-all"
                            title="Rincian Profil"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {user?.nama_role === Role.ADMIN && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(row)}
                                className="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 p-2 rounded-lg cursor-pointer transition-all"
                                title="Edit Biodata"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm("Batal pendaftaran kependudukan warga ini? (Trigger audit delete penduduk akan dicatat)")) {
                                    onDeletePenduduk(row.id_penduduk);
                                  }
                                }}
                                className="bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 p-2 rounded-lg cursor-pointer transition-all"
                                title="Hapus Berkas"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW FORM TAMBAH */}
      {viewState === 'add' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-xl text-xs space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewState('list')}
              className="p-1 px-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" /> Kembali
            </button>
            <h2 className="text-sm font-bold text-slate-800">Daftarkan Penduduk Baru (Oracle Procedure)</h2>
          </div>

          {oracleError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-2 font-mono">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
              <div>
                <strong className="block text-rose-900">Oracle Database Constraint Exception</strong>
                <span className="text-xs">{oracleError}</span>
              </div>
            </div>
          )}

          <form onSubmit={submitAdd} className="space-y-4">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Nomor Induk Kependudukan (NIK) (16 Digit)*</label>
              <input
                type="text"
                maxLength={16}
                required
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                className="w-full border border-slate-200 px-3 py-2.5 rounded-xl bg-white text-slate-700 font-mono tracking-wider"
                placeholder="Contoh: 3201231204850001"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Nama Lengkap*</label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full border border-slate-200 px-3 py-2.5 rounded-xl bg-white text-slate-700"
                placeholder="Masukkan nama lengkap"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Jenis Kelamin*</label>
                <select
                  value={jenisKelamin}
                  onChange={(e) => setJenisKelamin(e.target.value as 'L' | 'P')}
                  className="w-full border border-slate-200 px-3 py-2.5 rounded-xl bg-white text-slate-700"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Tanggal Lahir (Validasi Trigger)*</label>
                <input
                  type="date"
                  required
                  value={tanggalLahir}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                  className="w-full border border-slate-200 px-3 py-2.5 rounded-xl bg-white text-slate-700"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Afiliasi No. Kartu Keluarga*</label>
              <select
                required
                value={idKeluarga}
                onChange={(e) => setIdKeluarga(e.target.value)}
                className="w-full border border-slate-200 px-3 py-2.5 rounded-xl bg-white text-slate-700"
              >
                <option value="">-- Tentukan Kartu Keluarga --</option>
                {keluarga.map((k) => (
                  <option key={k.id_keluarga} value={k.id_keluarga}>KK: {k.no_kk} (Alamat: {k.alamat})</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold p-3 rounded-xl cursor-pointer hover:from-purple-800 text-xs transition-all"
            >
              Simpan Tambah Penduduk (SQL Trigger Validation)
            </button>
          </form>
        </div>
      )}

      {/* VIEW FORM EDIT */}
      {viewState === 'edit' && selectedPenduduk && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-xl text-xs space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewState('list')}
              className="p-1 px-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" /> Kembali
            </button>
            <h2 className="text-sm font-bold text-slate-800">Edit Berkas Penduduk #{selectedPenduduk.id_penduduk}</h2>
          </div>

          {oracleError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-2 font-mono">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
              <div>
                <strong className="block text-rose-900">Oracle Database Trigger Interrupted</strong>
                <span className="text-xs">{oracleError}</span>
              </div>
            </div>
          )}

          <form onSubmit={submitEdit} className="space-y-4">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Nomor Induk Kependudukan (NIK)*</label>
              <input
                type="text"
                maxLength={16}
                required
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                className="w-full border border-slate-200 px-3 py-2.5 rounded-xl bg-white text-slate-700 font-mono tracking-wider focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Nama Lengkap*</label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full border border-slate-200 px-3 py-2.5 rounded-xl bg-white text-slate-700 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Jenis Kelamin*</label>
                <select
                  value={jenisKelamin}
                  onChange={(e) => setJenisKelamin(e.target.value as 'L' | 'P')}
                  className="w-full border border-slate-200 px-3 py-2.5 rounded-xl bg-white text-slate-700 focus:outline-none"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Tanggal Lahir (Validasi Trigger)*</label>
                <input
                  type="date"
                  required
                  value={tanggalLahir}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                  className="w-full border border-slate-200 px-3 py-2.5 rounded-xl bg-white text-slate-700 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Afiliasi No. Kartu Keluarga*</label>
              <select
                required
                value={idKeluarga}
                onChange={(e) => setIdKeluarga(e.target.value)}
                className="w-full border border-slate-200 px-3 py-2.5 rounded-xl bg-white text-slate-700 focus:outline-none"
              >
                {keluarga.map((k) => (
                  <option key={k.id_keluarga} value={k.id_keluarga}>KK: {k.no_kk} (Alamat: {k.alamat})</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold p-3 rounded-xl cursor-pointer hover:from-purple-800 text-xs transition-all"
            >
              Simpan Mutasi
            </button>
          </form>
        </div>
      )}

      {/* DETAIL VIEW CARD */}
      {viewState === 'detail' && selectedPenduduk && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 max-w-2xl text-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <button
              onClick={() => setViewState('list')}
              className="p-1 px-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 inline mr-1" /> Kembali
            </button>
            <span className="text-slate-400 font-mono text-[10px]">ID DATA: #{selectedPenduduk.id_penduduk}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <label className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Nomor Induk Kependudukan (NIK)</label>
              <p className="text-sm font-bold text-slate-800 font-mono tracking-wider mt-1">{selectedPenduduk.nik}</p>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Nama Lengkap</label>
              <p className="text-sm font-bold text-slate-800 mt-1">{selectedPenduduk.nama}</p>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Jenis Kelamin (Gender)</label>
              <p className="text-sm font-bold text-slate-700 mt-1">
                {selectedPenduduk.jenis_kelamin === 'L' ? "Laki-laki (L)" : "Perempuan (P)"}
              </p>
            </div>
            <div>
              <label className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Tanggal Lahir</label>
              <p className="text-sm font-bold text-slate-700 mt-1">{selectedPenduduk.tanggal_lahir}</p>
            </div>
            <div className="md:col-span-2 border-t border-slate-100 pt-4">
              <label className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">No. Kartu Keluarga (KK) Terkait</label>
              <p className="text-sm font-bold text-purple-700 mt-1 font-mono tracking-wider">{selectedPenduduk.no_kk}</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Alamat Terdaftar</label>
              <p className="text-sm font-bold text-slate-700 mt-1">{selectedPenduduk.alamat}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
