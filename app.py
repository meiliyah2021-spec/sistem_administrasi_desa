import os
from flask import Flask, redirect, url_for, session
from config import Config
from flask_cors import CORS

def create_app():
    """Application factory for Flask, loading configurations and registering routes/blueprints."""
    app = Flask(__name__) 
    CORS(app)
    app.config.from_object(Config)
    
    # Register blueprints for routes separation
    from routes.auth_routes import auth_bp
    from routes.dashboard_routes import dashboard_bp
    from routes.keluarga_routes import keluarga_bp
    from routes.penduduk_routes import penduduk_bp
    from routes.layanan_routes import layanan_bp
    from routes.pengajuan_routes import pengajuan_bp
    from routes.audit_routes import audit_bp
    from routes.laporan_routes import laporan_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(keluarga_bp)
    app.register_blueprint(penduduk_bp)
    app.register_blueprint(layanan_bp)
    app.register_blueprint(pengajuan_bp)
    app.register_blueprint(audit_bp)
    app.register_blueprint(laporan_bp)
    
    # Global root route routing inside login/dashboard
    @app.route('/')
    def root():
        if 'id_petugas' in session:
            return redirect(url_for('dashboard.index'))
        return redirect(url_for('auth.login'))
        
    # Global template context processors to inject logged in user's state
    @app.context_processor
    def inject_user_meta():
        return {
            'logged_user': {
                'id_petugas': session.get('id_petugas'),
                'nama_petugas': session.get('nama_petugas'),
                'username': session.get('username'),
                'jabatan': session.get('jabatan'),
                'nama_role': session.get('nama_role')
            } if 'id_petugas' in session else None
        }
        
    # Register shutdown event listener to safely clear connection pool
    @app.teardown_appcontext
    def shutdown_session(exception=None):
        pass # Oracle connections are allocated on-demand and auto-returned during with statements or close statements
        
    return app

app = create_app()

@app.errorhandler(404)
def page_not_found(e):
    return "Halaman tidak ditemukan", 404

if __name__ == '__main__':
    # Bind to port 5000 as configured for internal ingress
    # We set host to 0.0.0.0
    app.run(host='0.0.0.0', port=5000, debug=True)
