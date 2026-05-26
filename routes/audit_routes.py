from flask import Blueprint, render_template, request, flash, session, jsonify
from routes.auth_routes import login_required, role_required
from database.oracle_helper import execute_query

audit_bp = Blueprint('audit', __name__)

@audit_bp.route('/audit-log')
@login_required
@role_required(['ADMIN'])
def audit_log():
    """Renders table logs containing universal transactions (audit_log). Includes filters."""
    try:
        nama_tabel = request.args.get('nama_tabel', '').strip()
        aksi = request.args.get('aksi', '').strip()
        
        sql = "SELECT * FROM audit_log WHERE 1=1"
        params = {}
        
        if nama_tabel:
            sql += " AND UPPER(nama_tabel) = :nama_tabel"
            params["nama_tabel"] = nama_tabel.upper()
            
        if aksi:
            sql += " AND UPPER(aksi) = :aksi"
            params["aksi"] = aksi.upper()
            
        sql += " ORDER BY waktu_aksi DESC, id_log DESC"
        
        logs = execute_query(sql, params)
        return render_template('audit/index.html', logs=logs, tbl_filter=nama_tabel, aks_filter=aksi)
    except Exception as e:
        flash(f"Error memuat sistem audit_log: {str(e)}", "danger")
        return render_template('audit/index.html', logs=[], tbl_filter="", aks_filter="")

@audit_bp.route('/log-penduduk')
@login_required
def log_penduduk():
    """Renders table log_penduduk1, loaded dynamically from resident mutations."""
    try:
        sql = "SELECT * FROM log_penduduk1 ORDER BY waktu_log DESC, id_log DESC"
        logs = execute_query(sql)
        return render_template('audit/log_penduduk.html', logs=logs)
    except Exception as e:
        flash(f"Error memuat log_penduduk1: {str(e)}", "danger")
        return render_template('audit/log_penduduk.html', logs=[])

@audit_bp.route('/api/audit')
def api_audit_log():
    try:
        sql = """
            SELECT
                id_log,
                nama_tabel,
                id_data,
                aksi,
                waktu_aksi,
                nama_user,
                keterangan
            FROM audit_log
            ORDER BY waktu_aksi DESC, id_log DESC
        """

        items = execute_query(sql)

        return jsonify(items)

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Gagal mengambil data audit log: {str(e)}"
        }), 500