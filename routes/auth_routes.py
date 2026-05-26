from flask import Blueprint, render_template, request, redirect, url_for, session, flash, current_app, jsonify
from services.auth_service import AuthService
from database.oracle_helper import execute_query

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """Handles logins, verifying password hashes and parsing roles in sessions."""
    # If user already logged in, skip login page
    if 'id_petugas' in session:
        return redirect(url_for('dashboard.index'))
        
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        
        if not username or not password:
            flash("Username dan password wajib diisi!", "warning")
            return render_template('auth/login.html')
            
        try:
            user = AuthService.authenticate(username, password)
            if user:
                # Store user info inside login session
                session['id_petugas'] = user['id_petugas']
                session['nama_petugas'] = user['nama_petugas']
                session['username'] = user['username']
                session['jabatan'] = user['jabatan']
                session['nama_role'] = user['nama_role']
                
                flash(f"Selamat datang kembali, {user['nama_petugas']} ({user['nama_role']})!", "success")
                return redirect(url_for('dashboard.index'))
            else:
                flash("Username atau password salah. Cek kembali kredensial Anda.", "danger")
        except Exception as e:
            flash(f"Gagal melakukan proses login: {str(e)}", "danger")
            
    return render_template('auth/login.html')

@auth_bp.route('/logout')
def logout():
    """Wipes session credentials and routes back to login page."""
    session.clear()
    flash("Anda berhasil keluar dari sistem.", "success")
    return redirect(url_for('auth.login'))

def login_required(f):
    """Decorator ensuring a user session is active before allowing access to a route."""
    import functools
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        if 'id_petugas' not in session:
            flash("Silakan login terlebih dahulu untuk mengakses sistem.", "warning")
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function

def role_required(allowed_roles):
    """Decorator validating that the user's logged-in role permits access to a specific route."""
    import functools
    def decorator(f):
        @functools.wraps(f)
        def decorated_function(*args, **kwargs):
            if 'id_petugas' not in session:
                flash("Silakan login terlebih dahulu.", "warning")
                return redirect(url_for('auth.login'))
            user_role = session.get('nama_role', '')
            if user_role not in allowed_roles:
                flash(f"Akses ditolak! Anda (Role: {user_role}) tidak memiliki hak untuk menu ini.", "danger")
                return redirect(url_for('dashboard.index'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@auth_bp.route('/api/login', methods=['POST'])
def api_login():
    try:
        data = request.get_json()

        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({
                "success": False,
                "message": "Username dan password wajib diisi"
            }), 400

        sql = """
            SELECT 
                p.id_petugas,
                p.nama_petugas,
                p.username,
                p.jabatan,
                r.nama_role
            FROM petugas p
            JOIN role_petugas r ON p.id_role = r.id_role
            WHERE p.username = :username
              AND p.password_hash = :password
        """

        result = execute_query(sql, {
            "username": username,
            "password": password
        })

        if not result:
            return jsonify({
                "success": False,
                "message": "Username atau password salah"
            }), 401

        user = result[0]

        return jsonify({
            "success": True,
            "user": user
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500