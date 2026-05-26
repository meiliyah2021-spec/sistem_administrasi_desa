from database.connection import get_connection

class DashboardService:
    @staticmethod
    def get_summary():
        conn = get_connection()
        cursor = conn.cursor()

        try:
            data = {}

            cursor.execute("SELECT COUNT(*) FROM penduduk")
            data["total_penduduk"] = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM keluarga")
            data["total_keluarga"] = cursor.fetchone()[0]

            cursor.execute("SELECT total_layanan_aktif FROM dual")
            data["total_layanan_aktif"] = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM pengajuan")
            data["total_pengajuan"] = cursor.fetchone()[0]

            cursor.execute("SELECT total_pengajuan_by_status('DIPROSES') FROM dual")
            data["total_diproses"] = cursor.fetchone()[0]

            cursor.execute("SELECT total_pengajuan_by_status('MENUNGGU') FROM dual")
            data["total_diproses"] = cursor.fetchone()[0]

            cursor.execute("SELECT total_pengajuan_by_status('DITOLAK') FROM dual")
            data["total_diproses"] = cursor.fetchone()[0]

            cursor.execute("SELECT total_pengajuan_by_status('SELESAI') FROM dual")
            data["total_diproses"] = cursor.fetchone()[0]

            cursor.execute("SELECT total_pengajuan_by_status('KADALUARSA') FROM dual")
            data["total_diproses"] = cursor.fetchone()[0]


            return data

        finally:
            cursor.close()
            conn.close()