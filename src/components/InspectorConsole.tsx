import React, { useState } from 'react';
import { Database, Code, ShieldAlert, Cpu } from 'lucide-react';

interface InspectorConsoleProps {
  currentTab: string;
  actionName?: string;
  sqlSnippet?: string;
  plsqlSnippet?: string;
  flaskSnippet?: string;
}

export default function InspectorConsole({
  currentTab,
  actionName = "Mengakses Menu",
  sqlSnippet = "",
  plsqlSnippet = "",
  flaskSnippet = ""
}: InspectorConsoleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'plsql' | 'flask' | 'sql'>('plsql');

  // Load default fallback code based on current tab if specific snippets aren't passed
  const getFallbackSnippets = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: "Dashboard Statistics (PL/SQL Function Calls)",
          sql: `SELECT total_pengajuan_hari_ini() FROM DUAL;\nSELECT total_layanan_aktif() FROM DUAL;\nSELECT total_pengajuan_by_status('MENUNGGU') FROM DUAL;`,
          plsql: `-- PL/SQL Function: total_pengajuan_by_status\nCREATE OR REPLACE FUNCTION total_pengajuan_by_status (\n   p_status IN VARCHAR2\n) RETURN NUMBER IS\n   v_count NUMBER := 0;\nBEGIN\n   SELECT COUNT(*)\n   INTO v_count\n   FROM pengajuan p\n   JOIN status_pengajuan s ON p.id_status = s.id_status\n   WHERE UPPER(s.nama_status) = UPPER(p_status);\n   RETURN v_count;\nEND;`,
          flask: `# routes/dashboard_routes.py\n@dashboard_bp.route('/dashboard')\ndef index():\n    stats = DashboardService.get_statistics()\n    recents = DashboardService.get_recent_submissions()\n    return render_template('dashboard/index.html', stats=stats, recents=recents)`
        };
      case 'keluarga':
        return {
          title: "CRUD Keluarga (PL/SQL Procedures)",
          sql: `SELECT k.*, (SELECT COUNT(*) FROM penduduk r WHERE r.id_keluarga = k.id_keluarga) FROM keluarga k;`,
          plsql: `-- PL/SQL Procedure: tambah_keluarga\nCREATE OR REPLACE PROCEDURE tambah_keluarga (\n   p_no_kk IN VARCHAR2,\n   p_alamat IN VARCHAR2,\n   p_id_new OUT NUMBER\n) IS\nBEGIN\n   INSERT INTO keluarga (no_kk, alamat) VALUES (p_no_kk, p_alamat)\n   RETURNING id_keluarga INTO p_id_new;\n   COMMIT;\nEND;`,
          flask: `# services/keluarga_service.py\n@staticmethod\ndef create(no_kk, alamat):\n    cursor = conn.cursor()\n    id_new = cursor.var(oracledb.NUMBER)\n    cursor.callproc("tambah_keluarga", [no_kk, alamat, id_new])\n    return int(id_new.getvalue()[0])`
        };
      case 'penduduk':
        return {
          title: "CRUD Penduduk & Trigger Validasi",
          sql: `SELECT p.*, k.no_kk FROM penduduk p JOIN keluarga k ON p.id_keluarga = k.id_keluarga;`,
          plsql: `-- BEFORE INSERT/UPDATE Trigger for validation\nCREATE OR REPLACE TRIGGER trg_penduduk_validate\nBEFORE INSERT OR UPDATE ON penduduk FOR EACH ROW\nBEGIN\n  IF LENGTH(TRIM(:NEW.nik)) != 16 THEN\n     RAISE_APPLICATION_ERROR(-20002, 'NIK harus tepat 16 digit');\n  END IF;\n  IF TRUNC(:NEW.tanggal_lahir) > TRUNC(SYSDATE) THEN\n     RAISE_APPLICATION_ERROR(-20005, 'Tanggal lahir tidak boleh di masa depan!');\n  END IF;\nEND;`,
          flask: `# routes/penduduk_routes.py\ntry:\n    new_id = PendudukService.create(nik, nama, jk, tgl, id_kk)\nexcept Exception as e:\n    if "VALIDASI GAGAL" in str(e):\n        flash(str(e).split(":")[-1].strip(), "warning")`
        };
      case 'layanan':
        return {
          title: "CRUD Layanan & Soft Deletion",
          sql: `SELECT * FROM layanan ORDER BY status_aktif DESC;`,
          plsql: `-- PL/SQL Procedure: nonaktifkan_layanan\nCREATE OR REPLACE PROCEDURE nonaktifkan_layanan (\n   p_id_layanan IN NUMBER\n) IS\nBEGIN\n   UPDATE layanan SET status_aktif = 'N' WHERE id_layanan = p_id_layanan;\n   COMMIT;\nEND;`,
          flask: `# routes/layanan_routes.py\n@layanan_bp.route('/layanan/deaktivasi/<int:id_layanan>', methods=['POST'])\ndef deactivate(id_layanan):\n    LayananService.deactivate(id_layanan)\n    flash("Layanan dinonaktifkan dengan aman", "success")`
        };
      case 'pengajuan':
        return {
          title: "Transaksi Pengajuan Berkas (Dua-Preflight-Check)",
          sql: `SELECT p.*, l.nama_layanan FROM pengajuan p JOIN pengajuan_layanan pl ON p.id_pengajuan = pl.id_pengajuan JOIN layanan l ON pl.id_layanan = l.id_layanan;`,
          plsql: `-- Stored Procedure with Multiple Function Calls\nCREATE OR REPLACE PROCEDURE tambah_pengajuan_dengan_layanan (\n   p_id_penduduk IN NUMBER, p_id_petugas IN NUMBER, p_id_layanan IN NUMBER, p_catatan IN VARCHAR2, p_id_new OUT NUMBER\n) IS\nBEGIN\n   IF boleh_mengajukan(p_id_penduduk) != 'BOLEH' THEN\n      RAISE_APPLICATION_ERROR(-20041, 'Terlalu banyak pengajuan aktif!');\n   END IF;\n   INSERT INTO pengajuan (id_penduduk, id_petugas, id_status, catatan_status)\n   VALUES (p_id_penduduk, p_id_petugas, 1, p_catatan) RETURNING id_pengajuan INTO p_id_new;\n   INSERT INTO pengajuan_layanan VALUES (p_id_new, p_id_layanan);\n   COMMIT;\nEND;`,
          flask: `# services/pengajuan_service.py\n@staticmethod\ndef create(id_penduduk, id_petugas, id_layanan, catatan):\n    auth_res = call_function("boleh_mengajukan", oracledb.STRING, [id_penduduk])\n    if auth_res != "BOLEH":\n        raise ValueError(auth_res)\n    # Proceed with transaction`
        };
      case 'audit-log':
      case 'log-penduduk':
        return {
          title: "Trigger Log & Audit Trail",
          sql: `SELECT * FROM audit_log ORDER BY waktu_aksi DESC;\nSELECT * FROM log_penduduk1 ORDER BY waktu_log DESC;`,
          plsql: `-- AFTER TRIGGER logging penduduk changes\nCREATE OR REPLACE TRIGGER trg_penduduk_log\nAFTER INSERT OR UPDATE OR DELETE ON penduduk FOR EACH ROW\nBEGIN\n  IF INSERTING THEN\n    INSERT INTO log_penduduk1 (aksi, id_penduduk, nik, nama_baru, keterangan)\n    VALUES ('INSERT', :NEW.id_penduduk, :NEW.nik, :NEW.nama, 'Menambahkan penduduk baru');\n  END IF;\nEND;`,
          flask: `# routes/audit_routes.py\n@audit_bp.route('/log-penduduk')\ndef log_penduduk():\n    logs = execute_query("SELECT * FROM log_penduduk1 ORDER BY waktu_log DESC")\n    return render_template('audit/log_penduduk.html', logs=logs)`
        };
      case 'laporan':
        return {
          title: "Reporting View & Excel Streaming",
          sql: `SELECT * FROM laporan_pengajuan_layanan WHERE tanggal_pengajuan >= :tgl;`,
          plsql: `-- Database View definition for reporting\nCREATE OR REPLACE VIEW laporan_pengajuan_layanan AS\nSELECT p.id_pengajuan, pn.nama, k.no_kk, s.nama_status as status, l.nama_layanan as layanan\nFROM pengajuan p\nJOIN penduduk pn ON p.id_penduduk = pn.id_penduduk\nJOIN keluarga k ON pn.id_keluarga = k.id_keluarga\nJOIN status_pengajuan s ON p.id_status = s.id_status\nJOIN pengajuan_layanan pl ON p.id_pengajuan = pl.id_pengajuan\nJOIN layanan l ON pl.id_layanan = l.id_layanan;`,
          flask: `# services/laporan_service.py export Excel\nwb = openpyxl.Workbook()\nws = wb.active\nfor r_idx, rec in enumerate(records):\n    ws.cell(row=r_idx, column=1, value=rec['nama'])\noutput = BytesIO()\nwb.save(output)\nreturn output`
        };
      default:
        return {
          title: "Sistem Administrasi Kependudukan Desa",
          sql: `SELECT * FROM role_petugas;`,
          plsql: `-- PL/SQL DB Object Setup\n-- Tables, Triggers, Procedures and Functions defined in database/schema.sql`,
          flask: `# app.py Main Flask setup\napp = Flask(__name__)\napp.config.from_object(Config)`
        };
    }
  };

  const fallbacks = getFallbackSnippets();
  const title = fallbacks.title;
  const sql = sqlSnippet || fallbacks.sql;
  const plsql = plsqlSnippet || fallbacks.plsql;
  const flask = flaskSnippet || fallbacks.flask;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Console Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-900 border border-slate-700 text-purple-400 font-mono text-xs font-semibold px-4 py-3 rounded-full shadow-2xl hover:bg-slate-800 hover:text-purple-300 transition-all cursor-pointer"
        id="btn_db_inspector"
      >
        <Database className="w-4 h-4 animate-pulse" />
        <span>Oracle & Flask Inspector</span>
        <span className="bg-purple-900/50 text-purple-300 text-[10px] px-1.5 py-0.5 rounded-full border border-purple-700">UAS BD Lanjut</span>
      </button>

      {/* Console Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[550px] max-w-[90vw] h-[450px] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-mono text-xs">
          {/* Header */}
          <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200">
              <Cpu className="w-4 h-4 text-purple-500" />
              <div className="flex flex-col">
                <span className="font-bold">Live Oracle DB Simulator Console</span>
                <span className="text-[10px] text-slate-400">Context: {title}</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-100 font-bold"
            >
              ✕
            </button>
          </div>

          {/* Action Log Header */}
          <div className="bg-purple-950/40 border-b border-purple-900/30 px-4 py-2 flex items-center gap-2 text-[10px] text-purple-300">
            <span className="bg-purple-900 text-purple-100 font-bold px-1.5 py-0.5 rounded">EVENT:</span>
            <span>{actionName}</span>
          </div>

          {/* Code Selection Tabs */}
          <div className="bg-slate-900/50 flex border-b border-slate-800">
            <button
              onClick={() => setActiveCodeTab('plsql')}
              className={`flex-1 py-2 text-center border-b transition-all cursor-pointer ${
                activeCodeTab === 'plsql'
                  ? 'border-purple-500 text-purple-400 font-bold bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              PL/SQL (Trigger/Proc)
            </button>
            <button
              onClick={() => setActiveCodeTab('flask')}
              className={`flex-1 py-2 text-center border-b transition-all cursor-pointer ${
                activeCodeTab === 'flask'
                  ? 'border-purple-500 text-purple-400 font-bold bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Python Flask Routines
            </button>
            <button
              onClick={() => setActiveCodeTab('sql')}
              className={`flex-1 py-2 text-center border-b transition-all cursor-pointer ${
                activeCodeTab === 'sql'
                  ? 'border-purple-500 text-purple-400 font-bold bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              Oracle SQL Query
            </button>
          </div>

          {/* Code Screen */}
          <div className="flex-1 p-4 bg-slate-950 overflow-auto text-slate-300 custom-scrollbar whitespace-pre text-[11px] leading-relaxed">
            {activeCodeTab === 'plsql' && (
              <code className="text-emerald-400">{plsql}</code>
            )}
            {activeCodeTab === 'flask' && (
              <code className="text-sky-400">{flask}</code>
            )}
            {activeCodeTab === 'sql' && (
              <code className="text-amber-400">{sql}</code>
            )}
          </div>

          {/* Footer Info */}
          <div className="bg-slate-900 border-t border-slate-800 p-2 text-center text-[10px] text-slate-500 flex items-center justify-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
            <span>Simulasi runtime Python Flask + Oracle DB terhubung di PORT 3000</span>
          </div>
        </div>
      )}
    </div>
  );
}
