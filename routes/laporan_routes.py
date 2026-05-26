from flask import Blueprint, render_template, request, flash, send_file, redirect, url_for, jsonify
from routes.auth_routes import login_required
from services.laporan_service import LaporanService
from services.layanan_service import LayananService
from database.oracle_helper import execute_query
import io
from datetime import datetime

laporan_bp = Blueprint('laporan', __name__)

@laporan_bp.route('/laporan')
@login_required
def index():
    """Renders tabular reports, binding select fields to active filters."""
    try:
        tgl_awal = request.args.get('tgl_awal', '').strip()
        tgl_akhir = request.args.get('tgl_akhir', '').strip()
        id_status = request.args.get('id_status', '').strip()
        id_layanan = request.args.get('id_layanan', '').strip()
        search = request.args.get('search_name_nik', '').strip()
        
        # Pull lists to populate selects
        statuses = execute_query("SELECT id_status, nama_status FROM status_pengajuan ORDER BY id_status ASC")
        services = LayananService.get_all()
        
        # Run report view
        records = LaporanService.get_laporan(
            tgl_awal=tgl_awal if tgl_awal else None,
            tgl_akhir=tgl_akhir if tgl_akhir else None,
            id_status=id_status if id_status else None,
            id_layanan=id_layanan if id_layanan else None,
            search_name_nik=search if search else None
        )
        
        return render_template(
            'laporan/index.html', 
            records=records, 
            statuses=statuses, 
            services=services,
            tgl_awal=tgl_awal, 
            tgl_akhir=tgl_akhir, 
            id_status=id_status, 
            id_layanan=id_layanan, 
            search=search
        )
    except Exception as e:
        flash(f"Gagal merangkum laporan: {str(e)}", "danger")
        return render_template('laporan/index.html', records=[], statuses=[], services=[])

@laporan_bp.route('/laporan/export/excel')
@login_required
def export_excel():
    """Compiles and streams Excel files representing filtered report definitions."""
    try:
        tgl_awal = request.args.get('tgl_awal', '').strip()
        tgl_akhir = request.args.get('tgl_akhir', '').strip()
        id_status = request.args.get('id_status', '').strip()
        id_layanan = request.args.get('id_layanan', '').strip()
        search = request.args.get('search_name_nik', '').strip()
        
        excel_stream = LaporanService.export_excel(
            tgl_awal=tgl_awal if tgl_awal else None,
            tgl_akhir=tgl_akhir if tgl_akhir else None,
            id_status=id_status if id_status else None,
            id_layanan=id_layanan if id_layanan else None,
            search_name_nik=search if search else None
        )
        
        filename = f"Laporan_Kependudukan_Desa_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        return send_file(
            excel_stream,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        flash(f"Gagal mengekspor berkas Excel: {str(e)}", "danger")
        return redirect(url_for('laporan.index'))

@laporan_bp.route('/api/laporan')
def api_laporan():
    try:
        items = LaporanService.get_laporan()
        return jsonify(items)
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Gagal mengambil data laporan: {str(e)}"
        }), 500