import oracledb
from database.oracle_helper import execute_query, execute_non_query, call_procedure

class PendudukService:
    """Invokes CRUD actions on the penduduk table, calling Oracle PL/SQL procedures."""

    @staticmethod
    def get_all():
        """Lists all residents, joining on keluarga to retrieve KK No and address."""
        sql = """
            SELECT p.id_penduduk, p.nik, p.nama, p.jenis_kelamin, p.tanggal_lahir, p.id_keluarga,
                   k.no_kk, k.alamat
            FROM penduduk p
            JOIN keluarga k ON p.id_keluarga = k.id_keluarga
            ORDER BY p.id_penduduk DESC
        """
        return execute_query(sql)

    @staticmethod
    def get_by_id(id_penduduk):
        """Fetches a single resident's details by ID."""
        sql = """
            SELECT p.id_penduduk, p.nik, p.nama, p.jenis_kelamin, p.tanggal_lahir, p.id_keluarga,
                   k.no_kk, k.alamat
            FROM penduduk p
            JOIN keluarga k ON p.id_keluarga = k.id_keluarga
            WHERE p.id_penduduk = :id_penduduk
        """
        return execute_query(sql, {"id_penduduk": id_penduduk}, fetch_all=False)

    @staticmethod
    def create(nik, nama, jenis_kelamin, tanggal_lahir_str, id_keluarga):
        """
        Registers a new citizen using standard procedure:
        tambah_penduduk(p_nik, p_nama, p_jenis_kelamin, p_tanggal_lahir, p_id_keluarga, OUT p_id_new)
        """
        conn = None
        try:
            from database.connection import get_connection
            conn = get_connection()
            cursor = conn.cursor()
            
            # Format birthday String as Oracle Date Type
            import datetime
            birthday = datetime.datetime.strptime(tanggal_lahir_str, "%Y-%m-%d").date()
            
            id_new_var = cursor.var(oracledb.NUMBER)
            
            # Call Proc
            cursor.callproc("tambah_penduduk", [
                nik, nama, jenis_kelamin, birthday, int(id_keluarga), id_new_var
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

    staticmethod
    def update(id_penduduk, nik, nama, jenis_kelamin, tanggal_lahir_str, id_keluarga):
        """
        Modifies a citizen using procedure:
        update_penduduk(p_id_penduduk, p_nik, p_nama, p_jenis_kelamin, p_tanggal_lahir, p_id_keluarga)
        """
        import datetime
        birthday = datetime.datetime.strptime(tanggal_lahir_str, "%Y-%m-%d").date()
        
        call_procedure("update_penduduk", [
            int(id_penduduk), nik, nama, jenis_kelamin, birthday, int(id_keluarga)
        ])
        return True

    @staticmethod
    def delete(id_penduduk):
        """Removes a citizen row. Standard row execution."""
        sql = "DELETE FROM penduduk WHERE id_penduduk = :id_penduduk"
        execute_non_query(sql, {"id_penduduk": id_penduduk})
        return True
