import oracledb
from database.oracle_helper import execute_query, call_procedure, call_function

class PengajuanService:
    """Manages transactional applicant submittals, combining PL/SQL triggers, procedures, & validations."""

    @staticmethod
    def get_all(search_query=None):
        """Lists transactions with rich metadata joins."""
        sql = """
            SELECT 
                p.id_pengajuan,
                p.tanggal_pengajuan,
                p.catatan AS catatan_status,
                pn.id_penduduk,
                pn.nik,
                pn.nama AS nama_penduduk,
                s.id_status,
                s.nama_status AS status,
                l.id_layanan,
                l.nama_layanan AS layanan,
                pt.id_petugas,
                pt.nama_petugas AS petugas
            FROM pengajuan p
            JOIN penduduk pn 
            ON p.id_penduduk = pn.id_penduduk
            JOIN status_pengajuan s 
            ON p.id_status = s.id_status
            JOIN pengajuan_layanan pl 
            ON p.id_pengajuan = pl.id_pengajuan
            JOIN layanan l 
            ON pl.id_layanan = l.id_layanan
            LEFT JOIN petugas pt 
            ON p.id_petugas = pt.id_petugas
            ORDER BY p.id_pengajuan DESC
        """
        
        params = {}
        if search_query:
            sql += " WHERE UPPER(pn.nama) LIKE :search OR UPPER(pn.nik) LIKE :search OR UPPER(l.nama_layanan) LIKE :search"
            params["search"] = f"%{search_query.upper()}%"
            
    
        return execute_query(sql, params)

    @staticmethod
    def get_by_id(id_pengajuan):
        """Retrieves detailed record of a single transaction."""
        sql = """
            SELECT 
                p.id_pengajuan,
                p.tanggal_pengajuan,
                p.catatan_status,
                pn.id_penduduk,
                pn.nik,
                pn.nama as nama_penduduk,
                k.no_kk,
                k.alamat,
                s.id_status,
                s.nama_status as status,
                l.id_layanan,
                l.nama_layanan as layanan,
                pt.id_petugas,
                pt.nama_petugas as petugas
            FROM pengajuan p
            JOIN penduduk pn ON p.id_penduduk = pn.id_penduduk
            JOIN keluarga k ON pn.id_keluarga = k.id_keluarga
            JOIN status_pengajuan s ON p.id_status = s.id_status
            JOIN pengajuan_layanan pl ON p.id_pengajuan = pl.id_pengajuan
            JOIN layanan l ON pl.id_layanan = l.id_layanan
            JOIN petugas pt ON p.id_petugas = pt.id_petugas
            WHERE p.id_pengajuan = :id_pengajuan
        """
        return execute_query(sql, {"id_pengajuan": id_pengajuan}, fetch_all=False)

    @staticmethod
    def get_riwayat(id_pengajuan):
        """Lists chronological stage changes linked to the transaction."""
        sql = """
            SELECT r.id_riwayat, s.nama_status as status, pt.nama_petugas as petugas, 
                   r.tanggal_update, r.catatan
            FROM riwayat_status_pengajuan r
            JOIN status_pengajuan s ON r.id_status = s.id_status
            JOIN petugas pt ON r.id_petugas = pt.id_petugas
            WHERE r.id_pengajuan = :id_pengajuan
            ORDER BY r.tanggal_update DESC
        """
        return execute_query(sql, {"id_pengajuan": id_pengajuan})

    @staticmethod
    def create(id_penduduk, id_petugas, id_layanan, catatan=""):
        """
        Submits new transaction.
        Performs PL/SQL pre-flight validation calls:
        - boleh_mengajukan
        - cek_layanan_aktif
        Then executes: tambah_pengajuan_dengan_layanan procedure.
        """
        # 1. Preflight Function call: boleh_mengajukan
        status_ijin = call_function("boleh_mengajukan", oracledb.STRING, [int(id_penduduk)])
        if status_ijin != 'BOLEH':
            raise ValueError(f"Oracle Validasi Bisnis Gagal: {status_ijin}")
            
        # 2. Preflight Function call: cek_layanan_aktif
        status_aktif = call_function("cek_layanan_aktif", oracledb.NUMBER, [int(id_layanan)])
        if status_aktif == 0:
            raise ValueError("Oracle Validasi Bisnis Gagal: Layanan kependudukan yang dipilih sedang tidak aktif!")

        # 3. Call standard procedure
        conn = None
        try:
            from database.connection import get_connection
            conn = get_connection()
            cursor = conn.cursor()
            
            id_new_var = cursor.var(oracledb.NUMBER)
            cursor.callproc("tambah_pengajuan_dengan_layanan", [
                int(id_penduduk), int(id_petugas), int(id_layanan), catatan, id_new_var
            ])
            conn.commit()
            return int(id_new_var.getvalue()[0])
        except Exception as e:
            if conn:
                conn.rollback()
            raise e
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()

    @staticmethod
    def update_status(id_pengajuan, id_status, id_petugas, catatan):
        """Transitions status of a submission via stored procedure update_status_pengajuan."""
        call_procedure("update_status_pengajuan", [
            int(id_pengajuan), int(id_status), int(id_petugas), catatan
        ])
        return True

    @staticmethod
    def run_automatic_expiry():
        """Runs the automated batch job to change pending files > 7 days to KADALUARSA."""
        conn = None
        try:
            from database.connection import get_connection
            conn = get_connection()
            cursor = conn.cursor()
            
            rows_updated_var = cursor.var(oracledb.NUMBER)
            cursor.callproc("update_status_otomatis", [rows_updated_var])
            conn.commit()
            return int(rows_updated_var.getvalue()[0])
        except Exception as e:
            if conn:
                conn.rollback()
            raise e
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
