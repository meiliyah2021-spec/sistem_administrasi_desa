from flask import Blueprint, render_template, jsonify, session, flash, redirect, url_for, jsonify
from routes.auth_routes import login_required
from services.dashboard_service import DashboardService
from services.pengajuan_service import PengajuanService

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/')
@dashboard_bp.route('/dashboard')
@login_required
def index():
    """Main system landing page, showing cards, recent submissions, and Chart data."""
    try:
        stats = DashboardService.get_statistics()
        recents = DashboardService.get_recent_submissions(limit=5)
        return render_template('dashboard/index.html', stats=stats, recents=recents)
    except Exception as e:
        flash(f"Error memuat dashboard: {str(e)}", "danger")
        return render_template('dashboard/index.html', stats={}, recents=[])

@dashboard_bp.route('/api/chart-data')
@login_required
def chart_data():
    """Retrieves JSON payloads to render Chart.js graphs client-side."""
    try:
        data = DashboardService.get_chart_data()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@dashboard_bp.route('/dashboard/update-kadaluarsa-otomatis', methods=['POST'])
@login_required
def update_kadaluarsa():
    """Triggers PL/SQL update_status_otomatis() to mark stale waiting records."""
    try:
        rows_processed = PengajuanService.run_automatic_expiry()
        flash(f"Status otomatis berhasil diperbarui! Sebanyak {rows_processed} pengajuan lawas berhasil diset KADALUARSA.", "success")
    except Exception as e:
        flash(f"Gagal mengeksekusi otomatisasi status: {str(e)}", "danger")
    return redirect(url_for('dashboard.index'))

@dashboard_bp.route('/api/dashboard')
def api_dashboard():
    try:
        data = DashboardService.get_summary()
        return jsonify(data)
    except Exception as e:
        print("ERROR API DASHBOARD:", str(e))
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500