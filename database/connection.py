import oracledb
import os
from config import Config

# Initialize connection pool as None
_pool = None

def get_connection():
    """
    Establishes and returns a connection to the Oracle Database.
    Utilizes modern python-oracledb Thin Mode (does not require Oracle Instant Client).
    """
    global _pool
    try:
        # Lazy initialization of the Connection Pool for optimal performance
        if _pool is None:
            user = os.getenv('ORACLE_USER', Config.ORACLE_USER)
            password = os.getenv('ORACLE_PASSWORD', Config.ORACLE_PASSWORD)
            dsn = os.getenv('ORACLE_DSN', Config.ORACLE_DSN)
            
            # Start Pool
            _pool = oracledb.create_pool(
                user=user,
                password=password,
                dsn=dsn,
                min=2,
                max=10,
                increment=1
            )
            print("INFO: Oracle Connection Pool bertenaga oracledb berhasil diinisialisasi.")
            
        return _pool.acquire()
    except Exception as e:
        print(f"ERROR KONEKSI DATABASE ORACLE GAGAL: {str(e)}")
        raise RuntimeError(
            "Gagal menghubungkan ke server basis data Oracle. Pastikan kredensial login "
            f"di file .env benar dan server DB aktif. Detail kesalahan: {str(e)}"
        )

def close_pool():
    """Closes the connection pool on application shutdown."""
    global _pool
    if _pool is not None:
        try:
            _pool.close()
            print("INFO: Oracle Connection Pool ditutup dengan aman.")
        except Exception as e:
            print(f"WARNING: Gagal menutup pool: {str(e)}")
