import oracledb
from database.oracle_helper import execute_query, execute_non_query, call_procedure

class KeluargaService:
    """Invokes CRUD actions on the keluarga table, calling Oracle PL/SQL procedures."""

    @staticmethod
    def get_all():
        """Lists all KKs, including head of household (kepala keluarga) if populated."""
        sql = """
            SELECT k.id_keluarga, k.no_kk, k.alamat, k.kepala_keluarga,
            p.nama AS nama_kepala_keluarga,
            (SELECT COUNT(*) FROM penduduk r WHERE r.id_keluarga = k.id_keluarga) AS jumlah_anggota
            FROM keluarga k
            LEFT JOIN penduduk p ON k.kepala_keluarga = p.id_penduduk
            ORDER BY k.id_keluarga DESC
        """
        return execute_query(sql)

    @staticmethod
    def get_by_id(id_keluarga):
        """Fetches a single KK's details by ID."""
        sql = """
            SELECT k.id_keluarga, k.no_kk, k.alamat, k.id_kepala_keluarga,
                   p.nama AS nama_kepala_keluarga
            FROM keluarga k
            LEFT JOIN penduduk p ON k.id_kepala_keluarga = p.id_penduduk
            WHERE k.id_keluarga = :id_keluarga
        """
        return execute_query(sql, {"id_keluarga": id_keluarga}, fetch_all=False)

    @staticmethod
    def get_members(id_keluarga):
        """Retrieves list of residents mapped to this specific KK."""
        sql = """
            SELECT id_penduduk, nik, nama, jenis_kelamin, tanggal_lahir
            FROM penduduk
            WHERE id_keluarga = :id_keluarga
            ORDER BY id_penduduk ASC
        """
        return execute_query(sql, {"id_keluarga": id_keluarga})

    @staticmethod
    def create(no_kk, alamat):
        """
        Registers a new KK using stored procedure:
        tambah_keluarga(p_no_kk, p_alamat, OUT p_id_new)
        """
        conn = None
        try:
            from database.connection import get_connection
            conn = get_connection()
            cursor = conn.cursor()
            
            id_new_var = cursor.var(oracledb.NUMBER)
            cursor.callproc("tambah_keluarga", [no_kk, alamat, id_new_var])
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
    def update(id_keluarga, no_kk, alamat, id_kepala_keluarga):
        """
        Modifies KK using stored procedure:
        update_keluarga(p_id_keluarga, p_no_kk, p_alamat, p_kepala_keluarga)
        """
        kepala_id = int(id_kepala_keluarga) if id_kepala_keluarga else None
        call_procedure("update_keluarga", [int(id_keluarga), no_kk, alamat, kepala_id])
        return True

    @staticmethod
    def delete(id_keluarga):
        """Deletes a family card row."""
        sql = "DELETE FROM keluarga WHERE id_keluarga = :id_keluarga"
        execute_non_query(sql, {"id_keluarga": id_keluarga})
        return True

    from database.connection import get_connection

