-- =============================================================================
-- UAS BASIS DATA LANJUT - SISTEM ADMINISTRASI KEPENDUDUKAN DESA
-- DBMS: Oracle Database (XE/Enterprise)
-- SQL Script: Schema DDL, Constraints, Stored Procedures, Functions, and Triggers
-- =============================================================================

-- =============================================================================
-- 1. PEMBERSIHAN TABEL & OBJEK JIKA SUDAH ADA (Untuk Memudahkan Reset)
-- =============================================================================
DECLARE
  v_exists NUMBER;
BEGIN
  -- Hapus Triggers
  FOR r IN (SELECT trigger_name FROM user_triggers) LOOP
    EXECUTE IMMEDIATE 'DROP TRIGGER ' || r.trigger_name;
  END LOOP;
  -- Hapus Views
  FOR r IN (SELECT view_name FROM user_views) LOOP
    EXECUTE IMMEDIATE 'DROP VIEW ' || r.view_name;
  END LOOP;
  -- Hapus Sequences
  FOR r IN (SELECT sequence_name FROM user_sequences) LOOP
    EXECUTE IMMEDIATE 'DROP SEQUENCE ' || r.sequence_name;
  END LOOP;
  -- Hapus Tables
  FOR r IN (SELECT table_name FROM user_tables WHERE table_name IN (
    'LOG_PENDUDUK1', 'AUDIT_LOG', 'RIWAYAT_STATUS_PENGAJUAN', 'PENGAJUAN_LAYANAN',
    'PENGAJUAN', 'LAYANAN', 'STATUS_PENGAJUAN', 'PETUGAS', 'ROLE_PETUGAS', 'PENDUDUK', 'KELUARGA'
  )) LOOP
    EXECUTE IMMEDIATE 'DROP TABLE ' || r.table_name || ' CASCADE CONSTRAINTS';
  END LOOP;
END;
/

-- =============================================================================
-- 2. PEMBUATAN SEQUENCES UNTUK AUTO-INCREMENT ID
-- =============================================================================
CREATE SEQUENCE seq_keluarga START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_penduduk START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_role START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_petugas START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_layanan START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_status START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_pengajuan START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_riwayat START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_audit START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_log_pend START WITH 1 INCREMENT BY 1;

-- =============================================================================
-- 3. PEMBUATAN TABEL DATA MASTER & TRANSAKSI
-- =============================================================================

-- 3.1. Tabel Keluarga
CREATE TABLE keluarga (
    id_keluarga ORACLE_ID_PLACEHOLDER NUMBER DEFAULT seq_keluarga.NEXTVAL NOT NULL,
    no_kk VARCHAR2(16) NOT NULL,
    alamat VARCHAR2(255) NOT NULL,
    id_kepala_keluarga NUMBER, -- FK ditambahkan nanti setelah penduduk didefinisikan
    CONSTRAINT pk_keluarga PRIMARY KEY (id_keluarga),
    CONSTRAINT uq_no_kk UNIQUE (no_kk),
    CONSTRAINT chk_no_kk_len CHECK (LENGTH(no_kk) = 16)
);

-- 3.2. Tabel Penduduk
CREATE TABLE penduduk (
    id_penduduk NUMBER DEFAULT seq_penduduk.NEXTVAL NOT NULL,
    nik VARCHAR2(16) NOT NULL,
    nama VARCHAR2(100) NOT NULL,
    jenis_kelamin CHAR(1) NOT NULL,
    tanggal_lahir DATE NOT NULL,
    id_keluarga NUMBER NOT NULL,
    CONSTRAINT pk_penduduk PRIMARY KEY (id_penduduk),
    CONSTRAINT uq_nik UNIQUE (nik),
    CONSTRAINT chk_nik_len CHECK (LENGTH(nik) = 16),
    CONSTRAINT chk_jk CHECK (jenis_kelamin IN ('L', 'P')),
    CONSTRAINT fk_penduduk_keluarga FOREIGN KEY (id_keluarga) REFERENCES keluarga(id_keluarga) ON DELETE CASCADE
);

-- Tambah FK kepala keluarga ke tabel keluarga setelah tabel penduduk terbuat
ALTER TABLE keluarga ADD CONSTRAINT fk_keluarga_kepala FOREIGN KEY (id_kepala_keluarga) REFERENCES penduduk(id_penduduk) ON DELETE SET NULL;

-- 3.3. Tabel Role Petugas
CREATE TABLE role_petugas (
    id_role NUMBER DEFAULT seq_role.NEXTVAL NOT NULL,
    nama_role VARCHAR2(20) NOT NULL,
    CONSTRAINT pk_role_petugas PRIMARY KEY (id_role),
    CONSTRAINT uq_nama_role UNIQUE (nama_role),
    CONSTRAINT chk_role_val CHECK (nama_role IN ('ADMIN', 'PETUGAS', 'PIMPINAN'))
);

-- 3.4. Tabel Petugas
CREATE TABLE petugas (
    id_petugas NUMBER DEFAULT seq_petugas.NEXTVAL NOT NULL,
    nama_petugas VARCHAR2(100) NOT NULL,
    username VARCHAR2(50) NOT NULL,
    password_hash VARCHAR2(255) NOT NULL,
    jabatan VARCHAR2(50) NOT NULL,
    id_role NUMBER NOT NULL,
    CONSTRAINT pk_petugas PRIMARY KEY (id_petugas),
    CONSTRAINT uq_petugas_username UNIQUE (username),
    CONSTRAINT fk_petugas_role FOREIGN KEY (id_role) REFERENCES role_petugas(id_role) ON DELETE CASCADE
);

-- 3.5. Tabel Layanan
CREATE TABLE layanan (
    id_layanan NUMBER DEFAULT seq_layanan.NEXTVAL NOT NULL,
    nama_layanan VARCHAR2(100) NOT NULL,
    deskripsi VARCHAR2(255),
    status_aktif CHAR(1) DEFAULT 'Y' NOT NULL,
    CONSTRAINT pk_layanan PRIMARY KEY (id_layanan),
    CONSTRAINT uq_nama_layanan UNIQUE (nama_layanan),
    CONSTRAINT chk_layanan_aktif CHECK (status_aktif IN ('Y', 'N'))
);

-- 3.6. Tabel Status Pengajuan
CREATE TABLE status_pengajuan (
    id_status NUMBER DEFAULT seq_status.NEXTVAL NOT NULL,
    nama_status VARCHAR2(20) NOT NULL,
    CONSTRAINT pk_status_pengajuan PRIMARY KEY (id_status),
    CONSTRAINT uq_nama_status UNIQUE (nama_status),
    CONSTRAINT chk_status_val CHECK (nama_status IN ('MENUNGGU', 'DIPROSES', 'SELESAI', 'DITOLAK', 'KADALUARSA'))
);

-- 3.7. Tabel Pengajuan
CREATE TABLE pengajuan (
    id_pengajuan NUMBER DEFAULT seq_pengajuan.NEXTVAL NOT NULL,
    id_penduduk NUMBER NOT NULL,
    id_petugas NUMBER NOT NULL,
    id_status NUMBER NOT NULL,
    tanggal_pengajuan DATE DEFAULT SYSDATE NOT NULL,
    catatan_status VARCHAR2(255),
    CONSTRAINT pk_pengajuan PRIMARY KEY (id_pengajuan),
    CONSTRAINT fk_pengajuan_penduduk FOREIGN KEY (id_penduduk) REFERENCES penduduk(id_penduduk) ON DELETE CASCADE,
    CONSTRAINT fk_pengajuan_petugas FOREIGN KEY (id_petugas) REFERENCES petugas(id_petugas) ON DELETE CASCADE,
    CONSTRAINT fk_pengajuan_status FOREIGN KEY (id_status) REFERENCES status_pengajuan(id_status)
);

-- 3.8. Tabel Pengajuan Layanan (Relasi many-to-many pengajuan dan layanan)
CREATE TABLE pengajuan_layanan (
    id_pengajuan NUMBER NOT NULL,
    id_layanan NUMBER NOT NULL,
    CONSTRAINT pk_pengajuan_layanan PRIMARY KEY (id_pengajuan, id_layanan),
    CONSTRAINT fk_pl_pengajuan FOREIGN KEY (id_pengajuan) REFERENCES pengajuan(id_pengajuan) ON DELETE CASCADE,
    CONSTRAINT fk_pl_layanan FOREIGN KEY (id_layanan) REFERENCES layanan(id_layanan) ON DELETE CASCADE
);

-- 3.9. Tabel Riwayat Status Pengajuan
CREATE TABLE riwayat_status_pengajuan (
    id_riwayat NUMBER DEFAULT seq_riwayat.NEXTVAL NOT NULL,
    id_pengajuan NUMBER NOT NULL,
    id_status NUMBER NOT NULL,
    id_petugas NUMBER NOT NULL,
    tanggal_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    catatan VARCHAR2(255),
    CONSTRAINT pk_riwayat_status PRIMARY KEY (id_riwayat),
    CONSTRAINT fk_riwayat_pengajuan FOREIGN KEY (id_pengajuan) REFERENCES pengajuan(id_pengajuan) ON DELETE CASCADE,
    CONSTRAINT fk_riwayat_status FOREIGN KEY (id_status) REFERENCES status_pengajuan(id_status),
    CONSTRAINT fk_riwayat_petugas FOREIGN KEY (id_petugas) REFERENCES petugas(id_petugas) ON DELETE CASCADE
);

-- 3.10. Tabel Audit Log (Sistem global logging audit trail)
CREATE TABLE audit_log (
    id_log NUMBER DEFAULT seq_audit.NEXTVAL NOT NULL,
    nama_tabel VARCHAR2(50) NOT NULL,
    id_data NUMBER NOT NULL,
    aksi VARCHAR2(20) NOT NULL, -- INSERT, UPDATE, DELETE
    waktu_aksi TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    nama_user VARCHAR2(100) NOT NULL, -- User database atau username petugas web-side
    keterangan VARCHAR2(2000),
    CONSTRAINT pk_audit_log PRIMARY KEY (id_log)
);

-- 3.11. Tabel Log Penduduk (Trigger Log Khusus Penduduk)
CREATE TABLE log_penduduk1 (
    id_log NUMBER DEFAULT seq_log_pend.NEXTVAL NOT NULL,
    aksi VARCHAR2(10) NOT NULL, -- INSERT, UPDATE, DELETE
    id_penduduk NUMBER NOT NULL,
    nik VARCHAR2(16) NOT NULL,
    nama_lama VARCHAR2(100),
    nama_baru VARCHAR2(100),
    jenis_kelamin CHAR(1),
    waktu_log TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    keterangan VARCHAR2(1000),
    CONSTRAINT pk_log_penduduk1 PRIMARY KEY (id_log)
);


-- =============================================================================
-- 4. SEED DATA / DATA AWAL
-- =============================================================================

-- 4.1. Seed Role Petugas
INSERT INTO role_petugas (id_role, nama_role) VALUES (1, 'ADMIN');
INSERT INTO role_petugas (id_role, nama_role) VALUES (2, 'PETUGAS');
INSERT INTO role_petugas (id_role, nama_role) VALUES (3, 'PIMPINAN');

-- 4.2. Seed Petugas (Password adalah hash pbkdf2:sha256 dari 'admin', 'petugas', 'pimpinan')
-- Kita isi default hash dari python werkzeug.security:
-- 'admin' -> pbkdf2:sha256:600000$admin_hash_placeholder
-- Agar aman dan valid di Flask, service kami menyamakan verifikasi atau menyimpan password hash standard
-- Untuk keperluan seed, kita simpan string hash python:
INSERT INTO petugas (id_petugas, nama_petugas, username, password_hash, jabatan, id_role) 
VALUES (1, 'Administrator Desa', 'admin', 'scrypt:32768:8:1$uDoz5Uq1NbyY31g3$efb0df04ca9f0744fb867e6da8f251d54ba4ff7841cffd64fbe3f6da64c71db682ef17dfd1fe9be530bc4a0e911295b23e85faad011666ff48ff7e4fe33ec3ea', 'Kepala Bidang IT', 1);

INSERT INTO petugas (id_petugas, nama_petugas, username, password_hash, jabatan, id_role) 
VALUES (2, 'Budi Santoso', 'petugas', 'scrypt:32768:8:1$iunb2nreSSTshVwT$895b6c8ba876dd8f73b64bcab9d95cf104cb10e5f58ea09d7ddb61d67098eaba77cdcf99222b404fa3e91da54e3d64c01d4a0f4439c362dbe7fc2bc047dbb7e5', 'Staf Administrasi', 2);

INSERT INTO petugas (id_petugas, nama_petugas, username, password_hash, jabatan, id_role) 
VALUES (3, 'Hj. Siti Aminah, S.E.', 'pimpinan', 'scrypt:32768:8:1$6mE6bX7NreDdfghY$ec5ce9af7548f072481fe1048b6f3fa17de38ff408cf8b5cf3607214e21daaba265cffd6622b429fa2e16da45ebd24c01ca8fa9369c363daeefbc3bc27ea1ab4', 'Kepala Desa', 3);

-- 4.3. Seed Status Pengajuan
INSERT INTO status_pengajuan (id_status, nama_status) VALUES (1, 'MENUNGGU');
INSERT INTO status_pengajuan (id_status, nama_status) VALUES (2, 'DIPROSES');
INSERT INTO status_pengajuan (id_status, nama_status) VALUES (3, 'SELESAI');
INSERT INTO status_pengajuan (id_status, nama_status) VALUES (4, 'DITOLAK');
INSERT INTO status_pengajuan (id_status, nama_status) VALUES (5, 'KADALUARSA');

-- 4.4. Seed Layanan
INSERT INTO layanan (id_layanan, nama_layanan, deskripsi, status_aktif) 
VALUES (1, 'Kartu Tanda Penduduk (KTP) Baru', 'Pengajuan pembuatan KTP pertama kali maupun penggantian KTP rusak/hilang', 'Y');
INSERT INTO layanan (id_layanan, nama_layanan, deskripsi, status_aktif) 
VALUES (2, 'Kartu Keluarga (KK) Baru/Revisi', 'Pengajuan penerbitan Kartu Keluarga karena pernikahan, kelahiran, atau perubahan data', 'Y');
INSERT INTO layanan (id_layanan, nama_layanan, deskripsi, status_aktif) 
VALUES (3, 'Surat Keterangan Catatan Kepolisian (SKCK)', 'Surat pengantar dari desa untuk pembuatan SKCK di Polsek/Polres', 'Y');
INSERT INTO layanan (id_layanan, nama_layanan, deskripsi, status_aktif) 
VALUES (4, 'Surat Keterangan Kematian', 'Surat keterangan meninggal dunia untuk mengurus akta kematian', 'Y');
INSERT INTO layanan (id_layanan, nama_layanan, deskripsi, status_aktif) 
VALUES (5, 'Surat Keterangan Usaha (SKU)', 'Surat keterangan kepemilikan usaha untuk pengajuan kredit bank atau legalitas', 'Y');
INSERT INTO layanan (id_layanan, nama_layanan, deskripsi, status_aktif) 
VALUES (6, 'Layanan Darurat Ambulans Desa', 'Layanan peminjaman ambulans desa untuk kegawatdaruratan warga (Layanan Nonaktif)', 'N');

-- 4.5. Seed Keluarga
INSERT INTO keluarga (id_keluarga, no_kk, alamat) 
VALUES (1, '3201234567890001', 'Jl. Merdeka No. 10, RT 01 RW 02, Desa Sukamakmur');
INSERT INTO keluarga (id_keluarga, no_kk, alamat) 
VALUES (2, '3201234567890002', 'Dusun Harapan Indah RT 03 RW 05, Desa Sukamakmur');

-- 4.6. Seed Penduduk
INSERT INTO penduduk (id_penduduk, nik, nama, jenis_kelamin, tanggal_lahir, id_keluarga)
VALUES (1, '3201231204850001', 'Ahmad Hartono', 'L', TO_DATE('1985-04-12', 'YYYY-MM-DD'), 1);
INSERT INTO penduduk (id_penduduk, nik, nama, jenis_kelamin, tanggal_lahir, id_keluarga)
VALUES (2, '3201234509880002', 'Lilis Setyowati', 'P', TO_DATE('1988-09-05', 'YYYY-MM-DD'), 1);
INSERT INTO penduduk (id_penduduk, nik, nama, jenis_kelamin, tanggal_lahir, id_keluarga)
VALUES (3, '3201232112100003', 'Rahmat Hartono', 'L', TO_DATE('2010-12-21', 'YYYY-MM-DD'), 1);

INSERT INTO penduduk (id_penduduk, nik, nama, jenis_kelamin, tanggal_lahir, id_keluarga)
VALUES (4, '3201231508780004', 'Deni Setiawan', 'L', TO_DATE('1978-08-15', 'YYYY-MM-DD'), 2);
INSERT INTO penduduk (id_penduduk, nik, nama, jenis_kelamin, tanggal_lahir, id_keluarga)
VALUES (5, '3201236101820005', 'Ratna Sari', 'P', TO_DATE('1982-01-21', 'YYYY-MM-DD'), 2);

-- Update Kepala Keluarga setelah data penduduk masuk
UPDATE keluarga SET id_kepala_keluarga = 1 WHERE id_keluarga = 1;
UPDATE keluarga SET id_kepala_keluarga = 4 WHERE id_keluarga = 2;

-- 4.7. Seed Pengajuan
INSERT INTO pengajuan (id_pengajuan, id_penduduk, id_petugas, id_status, tanggal_pengajuan, catatan_status)
VALUES (1, 1, 2, 3, SYSDATE - 10, 'KTP baru sudah diserahkan ke kepala keluarga');
INSERT INTO pengajuan_layanan (id_pengajuan, id_layanan) VALUES (1, 1);
INSERT INTO riwayat_status_pengajuan(id_riwayat, id_pengajuan, id_status, id_petugas, tanggal_update, catatan)
VALUES (1, 1, 1, 2, SYSDATE - 10, 'Berkas KTP diterima lengkap');
INSERT INTO riwayat_status_pengajuan(id_riwayat, id_pengajuan, id_status, id_petugas, tanggal_update, catatan)
VALUES (2, 1, 2, 2, SYSDATE - 9, 'KTP dalam proses cetak di Kecamatan');
INSERT INTO riwayat_status_pengajuan(id_riwayat, id_pengajuan, id_status, id_petugas, tanggal_update, catatan)
VALUES (3, 1, 3, 2, SYSDATE - 8, 'Selesai dan terdistribusi');

INSERT INTO pengajuan (id_pengajuan, id_penduduk, id_petugas, id_status, tanggal_pengajuan, catatan_status)
VALUES (2, 2, 2, 1, SYSDATE - 8, 'Menunggu berkas foto copy buku nikah dilegalisir');
INSERT INTO pengajuan_layanan (id_pengajuan, id_layanan) VALUES (2, 2);
INSERT INTO riwayat_status_pengajuan(id_riwayat, id_pengajuan, id_status, id_petugas, tanggal_update, catatan)
VALUES (4, 2, 1, 2, SYSDATE - 8, 'Draft pengajuan keluarga baru diterima');

INSERT INTO pengajuan (id_pengajuan, id_penduduk, id_petugas, id_status, tanggal_pengajuan, catatan_status)
VALUES (3, 4, 1, 2, SYSDATE - 1, 'Sedang divalidasi kepemilikan bangunan usaha fisiknya');
INSERT INTO pengajuan_layanan (id_pengajuan, id_layanan) VALUES (3, 5);
INSERT INTO riwayat_status_pengajuan(id_riwayat, id_pengajuan, id_status, id_petugas, tanggal_update, catatan)
VALUES (5, 3, 1, 1, SYSDATE - 1, 'Pengajuan SKU diterima');
INSERT INTO riwayat_status_pengajuan(id_riwayat, id_pengajuan, id_status, id_petugas, tanggal_update, catatan)
VALUES (6, 3, 2, 1, SYSDATE, 'Proses verifikasi lapangan');

-- Pengajuan Menunggu lebih dari 7 hari untuk didemo update kadalauarsa otomatis kependudukan
-- Kita ubah tanggal_pengajuannya ke 15 hari yang lalu
INSERT INTO pengajuan (id_pengajuan, id_penduduk, id_petugas, id_status, tanggal_pengajuan, catatan_status)
VALUES (4, 5, 2, 1, SYSDATE - 15, 'Pengajuan SKCK lama ditinggal pemohon');
INSERT INTO pengajuan_layanan (id_pengajuan, id_layanan) VALUES (4, 3);
INSERT INTO riwayat_status_pengajuan(id_riwayat, id_pengajuan, id_status, id_petugas, tanggal_update, catatan)
VALUES (7, 4, 1, 2, SYSDATE - 15, 'Berkas masuk, pemohon belum melengkapi surat pengantar RT');


-- =============================================================================
-- 5. PEMBUATAN PL/SQL TRIGGERS UNTUK VALIDASI OTOMATIS & AUDIT TRAIL
-- =============================================================================

-- 5.1. BEFORE TRIGGER: Validasi Data Penduduk Sebelum INSERT / UPDATE
CREATE OR REPLACE TRIGGER trg_penduduk_validate
BEFORE INSERT OR UPDATE ON penduduk
FOR EACH ROW
DECLARE
  v_future_date EXCEPTION;
  v_empty_nik EXCEPTION;
  v_short_nik EXCEPTION;
  v_empty_nama EXCEPTION;
  v_invalid_jk EXCEPTION;
BEGIN
  -- Validasi NIK tidak boleh kosong
  IF :NEW.nik IS NULL OR TRIM(:NEW.nik) = '' THEN
     RAISE_APPLICATION_ERROR(-20001, 'VALIDASI GAGAL: Nomor NIK tidak boleh kosong!');
  END IF;

  -- Validasi NIK harus 16 digit
  IF LENGTH(TRIM(:NEW.nik)) != 16 THEN
     RAISE_APPLICATION_ERROR(-20002, 'VALIDASI GAGAL: Nomor NIK harus tepat 16 digit angka!');
  END IF;

  -- Validasi nama tidak boleh kosong
  IF :NEW.nama IS NULL OR TRIM(:NEW.nama) = '' THEN
     RAISE_APPLICATION_ERROR(-20003, 'VALIDASI GAGAL: Nama penduduk tidak boleh kosong!');
  END IF;

  -- Validasi Jenis Kelamin
  IF :NEW.jenis_kelamin NOT IN ('L', 'P') THEN
     RAISE_APPLICATION_ERROR(-20004, 'VALIDASI GAGAL: Jenis kelamin penduduk harus L (Laki-laki) atau P (Perempuan)!');
  END IF;

  -- Validasi Tanggal Lahir (Tidak boleh mendahului hari ini / masa depan)
  IF TRUNC(:NEW.tanggal_lahir) > TRUNC(SYSDATE) THEN
     RAISE_APPLICATION_ERROR(-20005, 'VALIDASI GAGAL: Tanggal lahir tidak boleh di masa depan!');
  END IF;
END;
/

-- 5.2. BEFORE TRIGGER: Validasi Pengajuan
CREATE OR REPLACE TRIGGER trg_pengajuan_validate
BEFORE INSERT ON pengajuan
FOR EACH ROW
BEGIN
  -- Validasi ID Penduduk wajib ada
  IF :NEW.id_penduduk IS NULL THEN
     RAISE_APPLICATION_ERROR(-20011, 'VALIDASI GAGAL: ID Penduduk pemohon wajib ditentukan!');
  END IF;

  -- Validasi ID Status wajib ditentukan
  IF :NEW.id_status IS NULL THEN
     RAISE_APPLICATION_ERROR(-20012, 'VALIDASI GAGAL: ID Status pengajuan awal harus ditentukan!');
  END IF;

  -- Validasi Tanggal Pengajuan tidak boleh lebih kecil dari hari ini (toleransi tanggal/jam)
  IF TRUNC(:NEW.tanggal_pengajuan) < TRUNC(SYSDATE) THEN
     RAISE_APPLICATION_ERROR(-20013, 'VALIDASI GAGAL: Tanggal pengajuan tidak boleh mundur ke masa lalu!');
  END IF;
END;
/

-- 5.3. AFTER TRIGGER: Menulis Log Perubahan Data Penduduk ke log_penduduk1
CREATE OR REPLACE TRIGGER trg_penduduk_log
AFTER INSERT OR UPDATE OR DELETE ON penduduk
FOR EACH ROW
DECLARE
  v_id_log NUMBER;
BEGIN
  IF INSERTING THEN
    INSERT INTO log_penduduk1 (aksi, id_penduduk, nik, nama_lama, nama_baru, jenis_kelamin, keterangan)
    VALUES ('INSERT', :NEW.id_penduduk, :NEW.nik, NULL, :NEW.nama, :NEW.jenis_kelamin, 'Menambahkan penduduk baru: ' || :NEW.nama);
  ELSIF UPDATING THEN
    INSERT INTO log_penduduk1 (aksi, id_penduduk, nik, nama_lama, nama_baru, jenis_kelamin, keterangan)
    VALUES ('UPDATE', :NEW.id_penduduk, :NEW.nik, :OLD.nama, :NEW.nama, :NEW.jenis_kelamin, 'Mengubah data penduduk ' || :OLD.nama || ' menjadi ' || :NEW.nama);
  ELSIF DELETING THEN
    INSERT INTO log_penduduk1 (aksi, id_penduduk, nik, nama_lama, nama_baru, jenis_kelamin, keterangan)
    VALUES ('DELETE', :OLD.id_penduduk, :OLD.nik, :OLD.nama, NULL, :OLD.jenis_kelamin, 'Menghapus data kependudukan ' || :OLD.nama);
  END IF;
END;
/

-- 5.4. AFTER AUDIT TRIGGER: Log Audit Trail Ke Table Global audit_log
-- Audit Penduduk
CREATE OR REPLACE TRIGGER trg_audit_penduduk
AFTER INSERT OR UPDATE OR DELETE ON penduduk
FOR EACH ROW
BEGIN
  IF INSERTING THEN
    INSERT INTO audit_log(nama_tabel, id_data, aksi, nama_user, keterangan)
    VALUES ('PENDUDUK', :NEW.id_penduduk, 'INSERT', USER, 'Operasi INSERT penduduk baru. NIK: ' || :NEW.nik || ', Nama: ' || :NEW.nama);
  ELSIF UPDATING THEN
    INSERT INTO audit_log(nama_tabel, id_data, aksi, nama_user, keterangan)
    VALUES ('PENDUDUK', :NEW.id_penduduk, 'UPDATE', USER, 'Operasi UPDATE penduduk. Perubahan nama lama(' || :OLD.nama || ') -> baru(' || :NEW.nama || ')');
  ELSIF DELETING THEN
    INSERT INTO audit_log(nama_tabel, id_data, aksi, nama_user, keterangan)
    VALUES ('PENDUDUK', :OLD.id_penduduk, 'DELETE', USER, 'Operasi DELETE penduduk. NIK lama: ' || :OLD.nik || ', Nama lama: ' || :OLD.nama);
  END IF;
END;
/

-- Audit Pengajuan
CREATE OR REPLACE TRIGGER trg_audit_pengajuan
AFTER INSERT OR UPDATE ON pengajuan
FOR EACH ROW
BEGIN
  IF INSERTING THEN
    INSERT INTO audit_log(nama_tabel, id_data, aksi, nama_user, keterangan)
    VALUES ('PENGAJUAN', :NEW.id_pengajuan, 'INSERT', USER, 'Pembuatan berkas pengajuan baru untuk Penduduk ID: ' || :NEW.id_penduduk || ' dengan Status ID: ' || :NEW.id_status);
  ELSIF UPDATING THEN
    INSERT INTO audit_log(nama_tabel, id_data, aksi, nama_user, keterangan)
    VALUES ('PENGAJUAN', :NEW.id_pengajuan, 'UPDATE', USER, 'Perubahan status pengajuan berkas dari Status lama ID(' || :OLD.id_status || ') -> baru ID(' || :NEW.id_status || ')');
  END IF;
END;
/

-- Audit Layanan
CREATE OR REPLACE TRIGGER trg_audit_layanan
AFTER INSERT OR UPDATE ON layanan
FOR EACH ROW
BEGIN
  IF INSERTING THEN
    INSERT INTO audit_log(nama_tabel, id_data, aksi, nama_user, keterangan)
    VALUES ('LAYANAN', :NEW.id_layanan, 'INSERT', USER, 'Penambahan master layanan kependudukan baru: ' || :NEW.nama_layanan);
  ELSIF UPDATING THEN
    INSERT INTO audit_log(nama_tabel, id_data, aksi, nama_user, keterangan)
    VALUES ('LAYANAN', :NEW.id_layanan, 'UPDATE', USER, 'Perubahan data layanan ' || :OLD.nama_layanan || '. Aktif: ' || :OLD.status_aktif || ' -> ' || :NEW.status_aktif);
  END IF;
END;
/


-- =============================================================================
-- 6. PEMBUATAN PL/SQL FUNCTIONS (BUSINESS LOGIC ENGINE)
-- =============================================================================

-- 6.1. Function: Cek Apakah Penduduk Berhak Mengajukan Berkas Baru
-- Syarat: penduduk tidak memiliki status transaksi 'MENUNGGU' / 'DIPROSES' pada layanan yang sama
CREATE OR REPLACE FUNCTION boleh_mengajukan (
   p_id_penduduk IN NUMBER
) RETURN VARCHAR2 IS
   v_count NUMBER;
BEGIN
   SELECT COUNT(*)
   INTO v_count
   FROM pengajuan p
   WHERE p.id_penduduk = p_id_penduduk
     AND p.id_status IN (1, 2); -- MENUNGGU atau DIPROSES

   IF v_count >= 2 THEN
      RETURN 'TIDAK_BOLEH: Penduduk sedang memiliki 2 berkas yang aktif menunggu/diproses!';
   ELSE
      RETURN 'BOLEH';
   END IF;
EXCEPTION
   WHEN OTHERS THEN
      RETURN 'TERJADI_KESALAHAN: Gagal memvalidasi status hak pengajuan kependudukan.';
END;
/

-- 6.2. Function: Cek Layanan Apakah Aktif
CREATE OR REPLACE FUNCTION cek_layanan_aktif (
   p_id_layanan IN NUMBER
) RETURN NUMBER IS
   v_aktif CHAR(1);
BEGIN
   SELECT status_aktif
   INTO v_aktif
   FROM layanan
   WHERE id_layanan = p_id_layanan;

   IF v_aktif = 'Y' THEN
      RETURN 1;
   ELSE
      RETURN 0;
   END IF;
EXCEPTION
   WHEN NO_DATA_FOUND THEN
      RETURN 0;
   WHEN OTHERS THEN
      RETURN 0;
END;
/

-- 6.3. Function: Total Pengajuan Masuk Berdasarkan Status Tertentu
CREATE OR REPLACE FUNCTION total_pengajuan_by_status (
   p_nama_status IN VARCHAR2
) RETURN NUMBER IS
   v_count NUMBER := 0;
BEGIN
   SELECT COUNT(*)
   INTO v_count
   FROM pengajuan p
   JOIN status_pengajuan s ON p.id_status = s.id_status
   WHERE UPPER(s.nama_status) = UPPER(p_nama_status);
   
   RETURN v_count;
EXCEPTION
   WHEN OTHERS THEN
      RETURN 0;
END;
/

-- 6.4. Function: Total Pengajuan Masuk Untuk Penduduk Tertentu
CREATE OR REPLACE FUNCTION total_pengajuan_penduduk (
   p_id_penduduk IN NUMBER
) RETURN NUMBER IS
   v_count NUMBER := 0;
BEGIN
   SELECT COUNT(*)
   INTO v_count
   FROM pengajuan
   WHERE id_penduduk = p_id_penduduk;

   RETURN v_count;
EXCEPTION
   WHEN OTHERS THEN
      RETURN 0;
END;
/

-- 6.5. Function: Total Pengajuan yang Mengalami Kadaluarsa Keaktifan (> 7 Hari Tanpa Update)
CREATE OR REPLACE FUNCTION total_pengajuan_kadaluarsa RETURN NUMBER IS
   v_count NUMBER := 0;
BEGIN
   -- Status MENUNGGU = 1
   SELECT COUNT(*)
   INTO v_count
   FROM pengajuan
   WHERE id_status = 1
     AND tanggal_pengajuan < (SYSDATE - 7);

   RETURN v_count;
EXCEPTION
   WHEN OTHERS THEN
      RETURN 0;
END;
/

-- 6.6. Function: Hitung Banyak Layanan Aktif
CREATE OR REPLACE FUNCTION total_layanan_aktif RETURN NUMBER IS
   v_count NUMBER := 0;
BEGIN
   SELECT COUNT(*)
   INTO v_count
   FROM layanan
   WHERE status_aktif = 'Y';

   RETURN v_count;
EXCEPTION
   WHEN OTHERS THEN
      RETURN 0;
END;
/

-- 6.7. Function: Hitung Total Pengajuan Hari Ini
CREATE OR REPLACE FUNCTION total_pengajuan_hari_ini RETURN NUMBER IS
   v_count NUMBER := 0;
BEGIN
   SELECT COUNT(*)
   INTO v_count
   FROM pengajuan
   WHERE TRUNC(tanggal_pengajuan) = TRUNC(SYSDATE);

   RETURN v_count;
EXCEPTION
   WHEN OTHERS THEN
      RETURN 0;
END;
/

-- 6.8. Function: Hitung Total Pengajuan pada Tanggal Tertentu
CREATE OR REPLACE FUNCTION total_pengajuan_per_tanggal (
   p_tanggal IN DATE
) RETURN NUMBER IS
   v_count NUMBER := 0;
BEGIN
   SELECT COUNT(*)
   INTO v_count
   FROM pengajuan
   WHERE TRUNC(tanggal_pengajuan) = TRUNC(p_tanggal);

   RETURN v_count;
EXCEPTION
   WHEN OTHERS THEN
      RETURN 0;
END;
/

-- 6.9. Function: Hitung Total Pengajuan Bulanan (Bulan, Tahun)
CREATE OR REPLACE FUNCTION total_pengajuan_bulanan (
   p_bulan IN NUMBER,
   p_tahun IN NUMBER
) RETURN NUMBER IS
   v_count NUMBER := 0;
BEGIN
   SELECT COUNT(*)
   INTO v_count
   FROM pengajuan
   WHERE EXTRACT(MONTH FROM tanggal_pengajuan) = p_bulan
     AND EXTRACT(YEAR FROM tanggal_pengajuan) = p_tahun;

   RETURN v_count;
EXCEPTION
   WHEN OTHERS THEN
      RETURN 0;
END;
/

-- 6.10. Function: Total Pengajuan Berdasarkan Jenis Layanan
CREATE OR REPLACE FUNCTION total_pengajuan_by_layanan (
   p_id_layanan IN NUMBER
) RETURN NUMBER IS
   v_count NUMBER := 0;
BEGIN
   SELECT COUNT(*)
   INTO v_count
   FROM pengajuan_layanan
   WHERE id_layanan = p_id_layanan;

   RETURN v_count;
EXCEPTION
   WHEN OTHERS THEN
      RETURN 0;
END;
/

-- 6.11. Function: Cek Apakah Pengajuan Sudah Melebihi Batas Kadaluarsa (True/1 / False/0)
CREATE OR REPLACE FUNCTION cek_status_kadaluarsa (
   p_id_pengajuan IN NUMBER
) RETURN NUMBER IS
   v_status_id NUMBER;
   v_tanggal DATE;
BEGIN
   SELECT id_status, tanggal_pengajuan
   INTO v_status_id, v_tanggal
   FROM pengajuan
   WHERE id_pengajuan = p_id_pengajuan;

   IF v_status_id = 1 AND v_tanggal < (SYSDATE - 7) THEN
      RETURN 1; -- Benar Kadaluarsa
   ELSE
      RETURN 0; -- Masih valid / sudah berganti status
   END IF;
EXCEPTION
   WHEN NO_DATA_FOUND THEN
      RETURN 0;
   WHEN OTHERS THEN
      RETURN 0;
END;
/


-- =============================================================================
-- 7. PEMBUATAN PL/SQL STORED PROCEDURES (PROSES TRANSAKSI UTAMA)
-- =============================================================================

-- 7.1. Procedure: Tambah Data Keluarga Baru
CREATE OR REPLACE PROCEDURE tambah_keluarga (
   p_no_kk IN VARCHAR2,
   p_alamat IN VARCHAR2,
   p_id_new OUT NUMBER
) IS
BEGIN
   INSERT INTO keluarga (no_kk, alamat)
   VALUES (p_no_kk, p_alamat)
   RETURNING id_keluarga INTO p_id_new;
   COMMIT;
EXCEPTION
   WHEN DUP_VAL_ON_INDEX THEN
      ROLLBACK;
      RAISE_APPLICATION_ERROR(-20021, 'PROSEDUR GAGAL: Nomor KK (' || p_no_kk || ') sudah terdaftar di sistem!');
   WHEN OTHERS THEN
      ROLLBACK;
      RAISE_APPLICATION_ERROR(-20022, 'PROSEDUR GAGAL: Kesalahan sistem saat mendaftarkan Kartu Keluarga baru.');
END;
/

-- 7.2. Procedure: Update Data Keluarga
CREATE OR REPLACE PROCEDURE update_keluarga (
   p_id_keluarga IN NUMBER,
   p_no_kk IN VARCHAR2,
   p_alamat IN VARCHAR2,
   p_kepala_keluarga IN NUMBER
) IS
BEGIN
   UPDATE keluarga
   SET no_kk = p_no_kk,
       alamat = p_alamat,
       id_kepala_keluarga = p_kepala_keluarga
   WHERE id_keluarga = p_id_keluarga;
   COMMIT;
EXCEPTION
   WHEN DUP_VAL_ON_INDEX THEN
      ROLLBACK;
      RAISE_APPLICATION_ERROR(-20023, 'PROSEDUR GAGAL: Perubahan dibatalkan. Nomor KK (' || p_no_kk || ') menyamai KK keluarga lain!');
   WHEN OTHERS THEN
      ROLLBACK;
      RAISE_APPLICATION_ERROR(-20024, 'PROSEDUR GAGAL: Gagal menyimpan data keluarga.');
END;
/

-- 7.3. Procedure: Tambah Penduduk Baru
CREATE OR REPLACE PROCEDURE tambah_penduduk (
   p_nik IN VARCHAR2,
   p_nama IN VARCHAR2,
   p_jenis_kelamin IN CHAR,
   p_tanggal_lahir IN DATE,
   p_id_keluarga IN NUMBER,
   p_id_new OUT NUMBER
) IS
BEGIN
   INSERT INTO penduduk (nik, nama, jenis_kelamin, tanggal_lahir, id_keluarga)
   VALUES (p_nik, p_nama, p_jenis_kelamin, p_tanggal_lahir, p_id_keluarga)
   RETURNING id_penduduk INTO p_id_new;
   COMMIT;
EXCEPTION
   WHEN DUP_VAL_ON_INDEX THEN
      ROLLBACK;
      RAISE_APPLICATION_ERROR(-20025, 'PROSEDUR GAGAL: Nomor NIK (' || p_nik || ') sudah digunakan oleh penduduk lain!');
   WHEN OTHERS THEN
      ROLLBACK;
      -- Trigger error handling otomatis didorong ke atas bila triggervalidasi gagal
      RAISE;
END;
/

-- 7.4. Procedure: Update Penduduk
CREATE OR REPLACE PROCEDURE update_penduduk (
   p_id_penduduk IN NUMBER,
   p_nik IN VARCHAR2,
   p_nama IN VARCHAR2,
   p_jenis_kelamin IN CHAR,
   p_tanggal_lahir IN DATE,
   p_id_keluarga IN NUMBER
) IS
BEGIN
   UPDATE penduduk
   SET nik = p_nik,
       nama = p_nama,
       jenis_kelamin = p_jenis_kelamin,
       tanggal_lahir = p_tanggal_lahir,
       id_keluarga = p_id_keluarga
   WHERE id_penduduk = p_id_penduduk;
   COMMIT;
EXCEPTION
   WHEN DUP_VAL_ON_INDEX THEN
      ROLLBACK;
      RAISE_APPLICATION_ERROR(-20026, 'PROSEDUR GAGAL: Nomor NIK (' || p_nik || ') menyamai NIK penduduk lain!');
   WHEN OTHERS THEN
      ROLLBACK;
      RAISE;
END;
/

-- 7.5. Procedure: Tambah Layanan Baru
CREATE OR REPLACE PROCEDURE tambah_layanan (
   p_nama_layanan IN VARCHAR2,
   p_deskripsi IN VARCHAR2,
   p_id_new OUT NUMBER
) IS
BEGIN
   INSERT INTO layanan (nama_layanan, deskripsi, status_aktif)
   VALUES (p_nama_layanan, p_deskripsi, 'Y')
   RETURNING id_layanan INTO p_id_new;
   COMMIT;
EXCEPTION
   WHEN DUP_VAL_ON_INDEX THEN
      ROLLBACK;
      RAISE_APPLICATION_ERROR(-20027, 'PROSEDUR GAGAL: Nama jenis layanan (' || p_nama_layanan || ') sudah terdaftar!');
   WHEN OTHERS THEN
      ROLLBACK;
      RAISE_APPLICATION_ERROR(-20028, 'PROSEDUR GAGAL: Gagal menyimpan data layanan.');
END;
/

-- 7.6. Update Layanan
CREATE OR REPLACE PROCEDURE update_layanan (
   p_id_layanan IN NUMBER,
   p_nama_layanan IN VARCHAR2,
   p_deskripsi IN VARCHAR2,
   p_status_aktif IN VARCHAR2
) IS
BEGIN
   UPDATE layanan
   SET nama_layanan = p_nama_layanan,
       deskripsi = p_deskripsi,
       status_aktif = p_status_aktif
   WHERE id_layanan = p_id_layanan;
   COMMIT;
EXCEPTION
   WHEN DUP_VAL_ON_INDEX THEN
      ROLLBACK;
      RAISE_APPLICATION_ERROR(-20029, 'PROSEDUR GAGAL: Nama jenis layanan sudah digunakan.');
   WHEN OTHERS THEN
      ROLLBACK;
      RAISE_APPLICATION_ERROR(-20030, 'PROSEDUR GAGAL: Gagal memperbarui status layanan kependudukan.');
END;
/

-- 7.7. Nonaktifkan Layanan (Mengubah status_aktif ke 'N')
CREATE OR REPLACE PROCEDURE nonaktifkan_layanan (
   p_id_layanan IN NUMBER
) IS
BEGIN
   UPDATE layanan
   SET status_aktif = 'N'
   WHERE id_layanan = p_id_layanan;
   COMMIT;
EXCEPTION
   WHEN OTHERS THEN
      ROLLBACK;
      RAISE_APPLICATION_ERROR(-20031, 'PROSEDUR GAGAL: Gagal melumpuhkan layanan.');
END;
/

-- 7.8. Procedure: Tambah Petugas (Dan Update)
CREATE OR REPLACE PROCEDURE update_petugas (
   p_id_petugas IN NUMBER,
   p_nama_petugas IN VARCHAR2,
   p_jabatan IN VARCHAR2,
   p_username IN VARCHAR2,
   p_id_role IN NUMBER
) IS
BEGIN
   UPDATE petugas
   SET nama_petugas = p_nama_petugas,
       jabatan = p_jabatan,
       username = p_username,
       id_role = p_id_role
   WHERE id_petugas = p_id_petugas;
   COMMIT;
EXCEPTION
   WHEN DUP_VAL_ON_INDEX THEN
      ROLLBACK;
      RAISE_APPLICATION_ERROR(-20032, 'PROSEDUR GAGAL: Username yang diinput sudah diambil petugas lain!');
   WHEN OTHERS THEN
      ROLLBACK;
      RAISE_APPLICATION_ERROR(-20033, 'PROSEDUR GAGAL: Gagal mengupdate data biografi petugas.');
END;
/

-- 7.9. Update Password Petugas (Disimpan hash python-side)
CREATE OR REPLACE PROCEDURE update_password_petugas (
   p_id_petugas IN NUMBER,
   p_password_hash IN VARCHAR2
) IS
BEGIN
   UPDATE petugas
   SET password_hash = p_password_hash
   WHERE id_petugas = p_id_petugas;
   COMMIT;
EXCEPTION
   WHEN OTHERS THEN
      ROLLBACK;
      RAISE_APPLICATION_ERROR(-20034, 'PROSEDUR GAGAL: Gagal set password baru untuk petugas.');
END;
/

-- 7.10. Procedure: Tambah Pengajuan Berkas Beserta Detail Layanan
CREATE OR REPLACE PROCEDURE tambah_pengajuan_dengan_layanan (
   p_id_penduduk IN NUMBER,
   p_id_petugas IN NUMBER,
   p_id_layanan IN NUMBER,
   p_catatan IN VARCHAR2,
   p_id_new OUT NUMBER
) IS
   v_boleh VARCHAR2(100);
   v_aktif_layanan NUMBER;
   v_id_status_awal NUMBER := 1; -- Status MENUNGGU
BEGIN
   -- 1. Evaluasi Kelayakan Pemohon via Function boleh_mengajukan
   v_boleh := boleh_mengajukan(p_id_penduduk);
   IF v_boleh != 'BOLEH' THEN
      RAISE_APPLICATION_ERROR(-20041, v_boleh);
   END IF;
   
   -- 2. Evaluasi Keaktifan Layanan via Function cek_layanan_aktif
   v_aktif_layanan := cek_layanan_aktif(p_id_layanan);
   IF v_aktif_layanan = 0 THEN
      RAISE_APPLICATION_ERROR(-20042, 'VALIDASI GAGAL: Layanan yang dipilih sedang tidak aktif/ditangguhkan oleh Desa.');
   END IF;

   -- 3. Insert ke Tabel Transaksi Utama: Pengajuan
   INSERT INTO pengajuan (id_penduduk, id_petugas, id_status, tanggal_pengajuan, catatan_status)
   VALUES (p_id_penduduk, p_id_petugas, v_id_status_awal, SYSDATE, p_catatan)
   RETURNING id_pengajuan INTO p_id_new;

   -- 4. Insert ke Tabel Relasi Many-to-Many: Pengajuan Layanan
   INSERT INTO pengajuan_layanan (id_pengajuan, id_layanan)
   VALUES (p_id_new, p_id_layanan);

   -- 5. Tambah Riwayat Pertama Kali status pengajuan (MENUNGGU)
   INSERT INTO riwayat_status_pengajuan (id_pengajuan, id_status, id_petugas, catatan)
   VALUES (p_id_new, v_id_status_awal, p_id_petugas, 'Pengajuan berkas kependudukan dibuat. ' || p_catatan);

   COMMIT;
EXCEPTION
   WHEN OTHERS THEN
      ROLLBACK;
      RAISE;
END;
/

-- 7.11. Procedure: Update Status Pengajuan Berkas (DAN Catat ke Riwayat Status)
CREATE OR REPLACE PROCEDURE update_status_pengajuan (
   p_id_pengajuan IN NUMBER,
   p_id_status IN NUMBER,
   p_id_petugas IN NUMBER,
   p_catatan IN VARCHAR2
) IS
BEGIN
   -- 1. Update status pada tabel pengajuan
   UPDATE pengajuan
   SET id_status = p_id_status,
       catatan_status = p_catatan
   WHERE id_pengajuan = p_id_pengajuan;

   -- 2. Tambahkan track history ke riwayat_status_pengajuan
   INSERT INTO riwayat_status_pengajuan (id_pengajuan, id_status, id_petugas, tanggal_update, catatan)
   VALUES (p_id_pengajuan, p_id_status, p_id_petugas, CURRENT_TIMESTAMP, p_catatan);

   COMMIT;
EXCEPTION
   WHEN OTHERS THEN
      ROLLBACK;
      RAISE_APPLICATION_ERROR(-20051, 'PROSEDUR GAGAL: Gagal melakukan transisi status pengajuan. Keterangan: ' || SQLERRM);
END;
/

-- 7.12. Procedure: Update Status Otomatis untuk Pengajuan yang Tertahan > 7 Hari (status MENUNGGU -> KADALUARSA)
CREATE OR REPLACE PROCEDURE update_status_otomatis (
   p_rows_updated OUT NUMBER
) IS
   v_count NUMBER := 0;
BEGIN
   -- Hitung berapa baris yang akan terupdate
   SELECT COUNT(*) INTO v_count
   FROM pengajuan
   WHERE id_status = 1 -- MENUNGGU
     AND tanggal_pengajuan < (SYSDATE - 7);

   p_rows_updated := v_count;

   IF v_count > 0 THEN
      -- Update status di pengajuan ke KADALUARSA (ID: 5)
      FOR r IN (
         SELECT id_pengajuan, id_petugas 
         FROM pengajuan 
         WHERE id_status = 1 
           AND tanggal_pengajuan < (SYSDATE - 7)
      ) LOOP
         -- Update status pengajuan
         UPDATE pengajuan
         SET id_status = 5,
             catatan_status = 'Dibatalkan otomatis oleh sistem karena kadaluarsa keaktifan (Melebihi batas 7 hari).'
         WHERE id_pengajuan = r.id_pengajuan;
         
         -- Masukkan historis riwayat
         INSERT INTO riwayat_status_pengajuan (id_pengajuan, id_status, id_petugas, tanggal_update, catatan)
         VALUES (r.id_pengajuan, 5, r.id_petugas, CURRENT_TIMESTAMP, 'Ubah otomatis: Status kadaluarsa setelah 7 hari tanpa respon berkas.');
      END LOOP;
   END IF;
   
   COMMIT;
EXCEPTION
   WHEN OTHERS THEN
      ROLLBACK;
      RAISE_APPLICATION_ERROR(-20061, 'PROSEDUR GAGAL: Eksekusi otomatisasi status kadaluarsa gagal.');
END;
/


-- =============================================================================
-- 8. PEMBUATAN DATABASE VIEWS SEBAGAI SUMBER ENGINE LAPORAN (REPORTING VIEW)
-- =============================================================================
CREATE OR REPLACE VIEW laporan_pengajuan_layanan AS
SELECT 
    p.id_pengajuan,
    p.tanggal_pengajuan,
    p.catatan_status AS catatan,
    pn.id_penduduk,
    pn.nik,
    pn.nama AS nama_penduduk,
    k.no_kk,
    k.alamat,
    s.id_status,
    s.nama_status AS status,
    l.id_layanan,
    l.nama_layanan AS layanan,
    pt.id_petugas,
    pt.nama_petugas AS petugas
FROM pengajuan p
JOIN penduduk pn ON p.id_penduduk = pn.id_penduduk
JOIN keluarga k ON pn.id_keluarga = k.id_keluarga
JOIN status_pengajuan s ON p.id_status = s.id_status
JOIN pengajuan_layanan pl ON p.id_pengajuan = pl.id_pengajuan
JOIN layanan l ON pl.id_layanan = l.id_layanan
JOIN petugas pt ON p.id_petugas = pt.id_petugas;

-- =============================================================================
-- SELESAI
-- Script PL/SQL Oracle berhasil dibuat untuk Sistem Kependudukan Desa Sukamakmur.
-- =============================================================================
