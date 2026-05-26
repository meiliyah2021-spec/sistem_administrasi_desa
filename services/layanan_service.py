import oracledb
from database.oracle_helper import execute_query, call_procedure

class LayananService:
    """Manages village services, mapping operations to PL/SQL Procedures."""

    @staticmethod
    def get_all(only_active=False):
        """Lists all services. Optionally filters only active ones ('Y')."""
        if only_active:
            sql = "SELECT * FROM layanan WHERE status_aktif = 'Y' ORDER BY nama_layanan ASC"
        else:
            sql = "SELECT * FROM layanan ORDER BY id_layanan DESC"
        return execute_query(sql)

    @staticmethod
    def get_by_id(id_layanan):
        """Fetches a single service by ID."""
        sql = "SELECT * FROM layanan WHERE id_layanan = :id_layanan"
        return execute_query(sql, {"id_layanan": id_layanan}, fetch_all=False)

    @staticmethod
    def create(nama_layanan, deskripsi):
        """
        Registers a new service using procedure:
        tambah_layanan(p_nama_layanan, p_deskripsi, OUT p_id_new)
        """
        conn = None
        try:
            from database.connection import get_connection
            conn = get_connection()
            cursor = conn.cursor()
            
            id_new_var = cursor.var(oracledb.NUMBER)
            cursor.callproc("tambah_layanan", [nama_layanan, deskripsi, id_new_var])
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
    def update(id_layanan, nama_layanan, deskripsi, status_aktif):
        """
        Modifies a service using procedure:
        update_layanan(p_id_layanan, p_nama_layanan, p_deskripsi, p_status_aktif)
        """
        call_procedure("update_layanan", [int(id_layanan), nama_layanan, deskripsi, status_aktif])
        return True

    @staticmethod
    def deactivate(id_layanan):
        """
        Gracefully deactivates a service (sets status_aktif = 'N' rather than deleting)
        using procedure: nonaktifkan_layanan(p_id_layanan)
        """
        call_procedure("nonaktifkan_layanan", [int(id_layanan)])
        return True
