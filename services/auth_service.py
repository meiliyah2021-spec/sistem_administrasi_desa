from werkzeug.security import generate_password_hash, check_password_hash
from database.oracle_helper import execute_query, call_procedure

class AuthService:
    """Handles authorization, role lookup, and password hashing for petugas."""

    @staticmethod
    def authenticate(username, password):
        """
        Validates username and password hash.
        Triggers inner join on role_petugas.
        """
        sql = """
            SELECT p.id_petugas, p.nama_petugas, p.username, p.password_hash, p.jabatan, r.nama_role
            FROM petugas p
            JOIN role_petugas r ON p.id_role = r.id_role
            WHERE p.username = :username
        """
        # Execute query
        user = execute_query(sql, {"username": username}, fetch_all=False)
        
        if user and check_password_hash(user['password_hash'], password):
            # Login Success, return user metadata
            return {
                "id_petugas": user['id_petugas'],
                "nama_petugas": user['nama_petugas'],
                "username": user['username'],
                "jabatan": user['jabatan'],
                "nama_role": user['nama_role']
            }
        
        return None

    @staticmethod
    def change_password(id_petugas, new_password):
        """Hashes new password and calls standard PL/SQL procedure update_password_petugas."""
        hashed = generate_password_hash(new_password)
        # Procedure update_password_petugas(id_petugas, password_hash)
        call_procedure("update_password_petugas", [id_petugas, hashed])
        return True
