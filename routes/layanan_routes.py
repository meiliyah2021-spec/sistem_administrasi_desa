from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from routes.auth_routes import login_required, role_required
from services.layanan_service import LayananService

layanan_bp = Blueprint('layanan', __name__)

@layanan_bp.route('/layanan')
@login_required
def index():
    """Lists services."""
    try:
        items = LayananService.get_all()
        return render_template('layanan/index.html', items=items)
    except Exception as e:
        flash(f"Error memuat data layanan: {str(e)}", "danger")
        return render_template('layanan/index.html', items=[])

@layanan_bp.route('/layanan/tambah', methods=['GET', 'POST'])
@login_required
@role_required(['ADMIN'])
def create():
    """Add form. Invokes SP: tambah_layanan."""
    if request.method == 'POST':
        nama = request.form.get('nama_layanan', '').strip()
        deskripsi = request.form.get('deskripsi', '').strip()
        
        if not nama:
            flash("Nama layanan wajib ditentukan!", "warning")
            return render_template('layanan/create.html')
            
        try:
            new_id = LayananService.create(nama, deskripsi)
            flash(f"Layanan kependudukan '{nama}' berhasil dirilis! (ID: {new_id})", "success")
            return redirect(url_for('layanan.index'))
        except Exception as e:
            flash(f"Gagal menyimpan layanan baru: {str(e)}", "danger")
            
    return render_template('layanan/create.html')

@layanan_bp.route('/layanan/edit/<int:id_layanan>', methods=['GET', 'POST'])
@login_required
@role_required(['ADMIN'])
def edit(id_layanan):
    """Edit form. Invokes SP: update_layanan."""
    try:
        item = LayananService.get_by_id(id_layanan)
        if not item:
            flash("Layanan tidak ditemukan!", "danger")
            return redirect(url_for('layanan.index'))
            
        if request.method == 'POST':
            nama = request.form.get('nama_layanan', '').strip()
            deskripsi = request.form.get('deskripsi', '').strip()
            status_aktif = request.form.get('status_aktif', 'Y')
            
            if not nama:
                flash("Nama layanan kependudukan wajib diisi!", "warning")
                return render_template('layanan/edit.html', item=item)
                
            try:
                LayananService.update(id_layanan, nama, deskripsi, status_aktif)
                flash(f"Layanan '{nama}' berhasil dimutakhirkan!", "success")
                return redirect(url_for('layanan.index'))
            except Exception as e:
                flash(f"Gagal menyimpan pembaruan layanan: {str(e)}", "danger")
                
        return render_template('layanan/edit.html', item=item)
    except Exception as e:
        flash(f"Sistem gagal mengakses berkas edit: {str(e)}", "danger")
        return redirect(url_for('layanan.index'))

@layanan_bp.route('/layanan/deaktivasi/<int:id_layanan>', methods=['POST'])
@login_required
@role_required(['ADMIN'])
def deactivate(id_layanan):
    """Logically archives the service, calling procedure: nonaktifkan_layanan."""
    try:
        LayananService.deactivate(id_layanan)
        flash("Layanan di-nonaktifkan dengan aman. Data riwayat transaksi tetap terjaga.", "success")
    except Exception as e:
        flash(f"Gagal menonaktifkan layanan: {str(e)}", "danger")
    return redirect(url_for('layanan.index'))

@layanan_bp.route('/api/layanan')
def api_layanan():
    try:
        items = LayananService.get_all()
        return jsonify(items)
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Gagal mengambil data layanan: {str(e)}"
        }), 500