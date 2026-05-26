from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from routes.auth_routes import login_required, role_required
from services.keluarga_service import KeluargaService
from services.penduduk_service import PendudukService

keluarga_bp = Blueprint('keluarga', __name__)

@keluarga_bp.route('/keluarga')
@login_required
def index():
    """Lists all Family Units."""
    try:
        items = KeluargaService.get_all()
        return render_template('keluarga/index.html', items=items)
    except Exception as e:
        flash(f"Error memuat data keluarga: {str(e)}", "danger")
        return render_template('keluarga/index.html', items=[])

@keluarga_bp.route('/keluarga/tambah', methods=['GET', 'POST'])
@login_required
@role_required(['ADMIN'])
def create():
    """Form to add a family unit. Calls stored procedure tambah_keluarga."""
    if request.method == 'POST':
        no_kk = request.form.get('no_kk', '').strip()
        alamat = request.form.get('alamat', '').strip()
        
        if not no_kk or not alamat:
            flash("Nomor KK dan alamat wajib diisi!", "warning")
            return render_template('keluarga/create.html')
            
        if len(no_kk) != 16 or not no_kk.isdigit():
            flash("Nomor KK harus berukuran tepat 16 digit angka!", "warning")
            return render_template('keluarga/create.html')
            
        try:
            new_id = KeluargaService.create(no_kk, alamat)
            flash(f"Kartu Keluarga No. {no_kk} berhasil disimpan! (ID: {new_id})", "success")
            return redirect(url_for('keluarga.index'))
        except Exception as e:
            flash(f"Gagal menambahkan keluarga: {str(e)}", "danger")
            
    return render_template('keluarga/create.html')

@keluarga_bp.route('/keluarga/detail/<int:id_keluarga>')
@login_required
def detail(id_keluarga):
    """Lists bio details and active family members list."""
    try:
        kk = KeluargaService.get_by_id(id_keluarga)
        if not kk:
            flash("Kartu keluarga tidak ditemukan!", "danger")
            return redirect(url_for('keluarga.index'))
            
        members = KeluargaService.get_members(id_keluarga)
        return render_template('keluarga/edit.html', kk=kk, members=members, is_view=True)
    except Exception as e:
        flash(f"Gagal mengambil detail keluarga: {str(e)}", "danger")
        return redirect(url_for('keluarga.index'))

@keluarga_bp.route('/keluarga/edit/<int:id_keluarga>', methods=['GET', 'POST'])
@login_required
@role_required(['ADMIN'])
def edit(id_keluarga):
    """Edits biographic metadata. Calls stored procedure update_keluarga."""
    try:
        kk = KeluargaService.get_by_id(id_keluarga)
        if not kk:
            flash("Kartu keluarga tidak ditemukan!", "danger")
            return redirect(url_for('keluarga.index'))
            
        members = KeluargaService.get_members(id_keluarga)
        
        if request.method == 'POST':
            no_kk = request.form.get('no_kk', '').strip()
            alamat = request.form.get('alamat', '').strip()
            id_kepala = request.form.get('id_kepala_keluarga', '')
            
            if not no_kk or not alamat:
                flash("Nomor KK dan alamat wajib diisi!", "warning")
                return render_template('keluarga/edit.html', kk=kk, members=members, is_view=False)
                
            try:
                KeluargaService.update(id_keluarga, no_kk, alamat, id_kepala)
                flash(f"Kartu Keluarga {no_kk} berhasil diperbarui!", "success")
                return redirect(url_for('keluarga.index'))
            except Exception as e:
                flash(f"Gagal menyimpan pembaruan keluarga: {str(e)}", "danger")
                
        return render_template('keluarga/edit.html', kk=kk, members=members, is_view=False)
    except Exception as e:
        flash(f"Kesalahan memuat form edit keluarga: {str(e)}", "danger")
        return redirect(url_for('keluarga.index'))

@keluarga_bp.route('/keluarga/hapus/<int:id_keluarga>', methods=['POST'])
@login_required
@role_required(['ADMIN'])
def delete(id_keluarga):
    """Deletes the entire family record."""
    try:
        KeluargaService.delete(id_keluarga)
        flash("Satu berkas Kartu Keluarga berhasil dihapus dari sistem.", "success")
    except Exception as e:
        flash(f"Gagal menghapus kartu keluarga: {str(e)}", "danger")
    return redirect(url_for('keluarga.index'))

@keluarga_bp.route('/api/keluarga')
def api_keluarga():
    try:
        items = KeluargaService.get_all()
        return jsonify(items)
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Gagal mengambil data keluarga: {str(e)}"
        }), 500