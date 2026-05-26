from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from routes.auth_routes import login_required, role_required
from services.penduduk_service import PendudukService
from services.keluarga_service import KeluargaService

penduduk_bp = Blueprint('penduduk', __name__)

@penduduk_bp.route('/penduduk')
@login_required
def index():
    """Renders citizen roster with linked family metadata."""
    try:
        items = PendudukService.get_all()
        return render_template('penduduk/index.html', items=items)
    except Exception as e:
        flash(f"Gagal memuat daftar penduduk: {str(e)}", "danger")
        return render_template('penduduk/index.html', items=[])

@penduduk_bp.route('/penduduk/tambah', methods=['GET', 'POST'])
@login_required
@role_required(['ADMIN'])
def create():
    """Form to register a citizen. Invokes stored procedure tambah_penduduk."""
    try:
        families = KeluargaService.get_all()
        
        if request.method == 'POST':
            nik = request.form.get('nik', '').strip()
            nama = request.form.get('nama', '').strip()
            jenis_kelamin = request.form.get('jenis_kelamin', '')
            tanggal_lahir = request.form.get('tanggal_lahir', '')
            id_keluarga = request.form.get('id_keluarga', '')
            
            if not nik or not nama or not jenis_kelamin or not tanggal_lahir or not id_keluarga:
                flash("Semua kolom isian wajib dilengkapi!", "warning")
                return render_template('penduduk/create.html', families=families)
                
            try:
                # Calls SP: tambah_penduduk. Any trigger errors thrown will bubble up
                new_id = PendudukService.create(nik, nama, jenis_kelamin, tanggal_lahir, id_keluarga)
                flash(f"Penduduk baru berhasil disimpan! Nama: {nama} (ID: {new_id})", "success")
                return redirect(url_for('penduduk.index'))
            except Exception as e:
                # Catch Oracle application error raised by trigger or constraint
                err_msg = str(e)
                if "VALIDASI GAGAL" in err_msg or "ORA-200" in err_msg:
                    # Clean up standard code ORA-200XX to show user-friendly message
                    clean_msg = err_msg.split(":")[-1].strip() if ":" in err_msg else err_msg
                    flash(f"Gagal memvalidasi (Validasi Oracle Trigger): {clean_msg}", "warning")
                else:
                    flash(f"Error Database Oracle: {err_msg}", "danger")
                    
        return render_template('penduduk/create.html', families=families)
    except Exception as e:
        flash(f"Kesalahan memuat data keluarga pendukung: {str(e)}", "danger")
        return redirect(url_for('penduduk.index'))

@penduduk_bp.route('/penduduk/detail/<int:id_penduduk>')
@login_required
def detail(id_penduduk):
    """View static resident dossier details."""
    try:
        item = PendudukService.get_by_id(id_penduduk)
        if not item:
            flash("Detail penduduk tidak ditemukan!", "danger")
            return redirect(url_for('penduduk.index'))
        return render_template('penduduk/detail.html', item=item)
    except Exception as e:
        flash(f"Gagal memuat riwayat kependudukan: {str(e)}", "danger")
        return redirect(url_for('penduduk.index'))

@penduduk_bp.route('/penduduk/edit/<int:id_penduduk>', methods=['GET', 'POST'])
@login_required
@role_required(['ADMIN'])
def edit(id_penduduk):
    """Edit form processing. Invokes stored procedure update_penduduk."""
    try:
        item = PendudukService.get_by_id(id_penduduk)
        if not item:
            flash("Data penduduk tidak ditemukan!", "danger")
            return redirect(url_for('penduduk.index'))
            
        families = KeluargaService.get_all()
        
        if request.method == 'POST':
            nik = request.form.get('nik', '').strip()
            nama = request.form.get('nama', '').strip()
            jenis_kelamin = request.form.get('jenis_kelamin', '')
            tanggal_lahir = request.form.get('tanggal_lahir', '')
            id_keluarga = request.form.get('id_keluarga', '')
            
            if not nik or not nama or not jenis_kelamin or not tanggal_lahir or not id_keluarga:
                flash("Semua formulir isian wajib dilengkapi!", "warning")
                # Reload edit state
                item['nik'] = nik
                item['nama'] = nama
                item['jenis_kelamin'] = jenis_kelamin
                item['tanggal_lahir'] = tanggal_lahir
                item['id_keluarga'] = id_keluarga
                return render_template('penduduk/edit.html', item=item, families=families)
                
            try:
                # Call SP
                PendudukService.update(id_penduduk, nik, nama, jenis_kelamin, tanggal_lahir, id_keluarga)
                flash(f"Profil kependudukan {nama} berhasil dimutakhirkan!", "success")
                return redirect(url_for('penduduk.index'))
            except Exception as e:
                err_msg = str(e)
                if "VALIDASI GAGAL" in err_msg or "ORA-200" in err_msg:
                    clean_msg = err_msg.split(":")[-1].strip() if ":" in err_msg else err_msg
                    flash(f"Modifikasi Dibatalkan (Validasi Trigger): {clean_msg}", "warning")
                else:
                    flash(f"Gagal memutakhirkan data: {err_msg}", "danger")
                    
        return render_template('penduduk/edit.html', item=item, families=families)
    except Exception as e:
        flash(f"Sistem gagal mengakses data edit: {str(e)}", "danger")
        return redirect(url_for('penduduk.index'))

@penduduk_bp.route('/penduduk/hapus/<int:id_penduduk>', methods=['POST'])
@login_required
@role_required(['ADMIN'])
def delete(id_penduduk):
    """Deletes citizen record. Triggers audit_log and log_penduduk deletion records."""
    try:
        PendudukService.delete(id_penduduk)
        flash("Satu berkas kependudukan berhasil dihapus. Data audit telah direkam.", "success")
    except Exception as e:
        flash(f"Gagal menghapus data kependudukan: {str(e)}", "danger")
    return redirect(url_for('penduduk.index'))

@penduduk_bp.route('/api/penduduk/<int:id_penduduk>', methods=['PUT'])
def api_update_penduduk(id_penduduk):
    try:
        data = request.get_json()

        PendudukService.update(
            id_penduduk,
            data.get('nik'),
            data.get('nama'),
            data.get('jenis_kelamin'),
            data.get('tanggal_lahir'),
            data.get('id_keluarga')
        )

        return jsonify({
            "success": True,
            "message": "Data penduduk berhasil diperbarui"
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
    
@penduduk_bp.route('/api/penduduk', methods=['GET'])
def api_get_penduduk():
    try:
        data = PendudukService.get_all()
        return jsonify(data)
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500