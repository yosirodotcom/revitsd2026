# -*- coding: utf-8 -*-
"""
import_paud.py
=====================================================================
Script Python untuk mengupdate data PAUD 2026 ke Firestore.

Field yang diupdate (HANYA jika ada nilainya di CSV):
  - alamat            -> field 'alamat'
  - kelurahan (CSV)   -> field 'desa'
  - kecamatan         -> field 'kecamatan'
  - kepala_sekolah    -> field 'kepala_sekolah'
  - hp_kepala_sekolah -> field 'hp_kepala_sekolah'

Field yang TIDAK disentuh:
  - nama_sekolah, kabupaten, koordinat, fasilitatorId,
    progres_fisik, dan semua field lainnya

Mode: UPDATE ONLY (merge=True).
  - Jika sekolah belum ada di Firestore -> SKIP (tidak dibuat baru).

Struktur Firestore:
  /programs/revitpaud2026/schools/{doc_id}

Cara pakai:
  py import_paud.py

Syarat:
  - serviceAccountKey.json ada di folder parent (d:/repos/revitsd2026/)
  - firebase-admin terinstall
=====================================================================
"""

import csv
import json
import os
import sys
from datetime import datetime, timezone

# ─────────────────────────────────────────────────────────────────
# UTF-8 stdout
# ─────────────────────────────────────────────────────────────────
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

# ─────────────────────────────────────────────────────────────────
# Import firebase_admin
# ─────────────────────────────────────────────────────────────────
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except ImportError:
    print("[INFO] firebase-admin belum terinstall. Menginstall...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "firebase-admin"])
    import firebase_admin
    from firebase_admin import credentials, firestore
    print("[OK] firebase-admin terinstall.\n")

# ─────────────────────────────────────────────────────────────────
# Konfigurasi
# ─────────────────────────────────────────────────────────────────
PROGRAM_ID = "revitpaud2026"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
KEY_FILE   = os.path.normpath(os.path.join(SCRIPT_DIR, "..", "serviceAccountKey.json"))
CSV_FILE   = os.path.join(SCRIPT_DIR, "datapaudtemp.csv")

# ─────────────────────────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────────────────────────
def clean(val):
    return val.strip() if val else ""

# ─────────────────────────────────────────────────────────────────
# Inisialisasi Firebase
# ─────────────────────────────────────────────────────────────────
def init_firebase():
    if not os.path.exists(KEY_FILE):
        print("[ERROR] File tidak ditemukan: " + KEY_FILE)
        sys.exit(1)
    cred = credentials.Certificate(KEY_FILE)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    with open(KEY_FILE, encoding="utf-8") as f:
        project = json.load(f).get("project_id", "?")
    print("[OK] Firebase terhubung -> project: " + project)
    return db

# ─────────────────────────────────────────────────────────────────
# Baca CSV
# ─────────────────────────────────────────────────────────────────
def read_csv():
    rows = []
    with open(CSV_FILE, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append({k.strip(): v.strip() for k, v in row.items()})
    print("[OK] Membaca {} baris dari {}".format(len(rows), os.path.basename(CSV_FILE)))
    return rows

# ─────────────────────────────────────────────────────────────────
# Proses & Upload ke Firestore
# ─────────────────────────────────────────────────────────────────
def process_and_upload(db, rows):
    program_ref = db.collection("programs").document(PROGRAM_ID)
    schools_col = program_ref.collection("schools")
    now_ts      = datetime.now(timezone.utc)

    # ── 1. Bangun index NPSN -> Firestore doc_id ──────────────────
    print("\n[INFO] Mengambil daftar sekolah PAUD dari Firestore...")
    npsn_index = {}  # npsn_str -> {doc_id, nama_sekolah}

    for sdoc in schools_col.stream():
        data      = sdoc.to_dict()
        npsn_val  = str(data.get("npsn", "")).strip()
        nama      = data.get("nama_sekolah", "")
        if npsn_val:
            npsn_index[npsn_val] = {"doc_id": sdoc.id, "nama": nama}
        # fallback: doc ID mungkin = npsn
        if sdoc.id not in npsn_index:
            npsn_index[sdoc.id] = {"doc_id": sdoc.id, "nama": nama}

    print("[INFO] {} sekolah ditemukan di Firestore.\n".format(len(npsn_index)))

    # ── 2. Update tiap baris CSV ───────────────────────────────────
    print("[UPLOAD] Memproses update...\n")

    updated = 0
    skipped = 0

    for row in rows:
        npsn      = clean(row.get("npsn", ""))
        alamat    = clean(row.get("alamat", ""))
        kelurahan = clean(row.get("kelurahan", ""))   # -> field 'desa'
        kecamatan = clean(row.get("kecamatan", ""))
        ks_nama   = clean(row.get("kepala_sekolah", ""))
        ks_hp     = clean(row.get("hp_kepala_sekolah", ""))

        if not npsn:
            print("  [SKIP] Baris tanpa NPSN dilewati.")
            skipped += 1
            continue

        # Cek apakah sekolah ada di Firestore
        entry = npsn_index.get(npsn)
        if not entry:
            print("  [SKIP] NPSN {} tidak ditemukan di Firestore (bukan sekolah baru).".format(npsn))
            skipped += 1
            continue

        doc_id       = entry["doc_id"]
        nama_sekolah = entry["nama"]

        # Build payload — HANYA field yang diminta, TIDAK termasuk nama_sekolah
        payload = {"_updatedAt": now_ts}
        if alamat:
            payload["alamat"] = alamat
        if kelurahan:
            payload["desa"] = kelurahan
        if kecamatan:
            payload["kecamatan"] = kecamatan
        if ks_nama:
            payload["kepala_sekolah"] = ks_nama
        if ks_hp:
            payload["hp_kepala_sekolah"] = ks_hp

        # merge=True -> hanya update field di payload, sisanya tidak diubah
        schools_col.document(doc_id).set(payload, merge=True)
        updated += 1

        print(
            "  [{:02d}] OK  {}  {:<45}  KS: {:<22}  Alamat: {}".format(
                updated,
                npsn,
                nama_sekolah[:45],
                ks_nama[:22] if ks_nama else "-",
                alamat[:30] if alamat else "-",
            )
        )

    # ── Ringkasan ─────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("  UPDATE PAUD SELESAI!")
    print("  Sekolah berhasil diupdate : {}".format(updated))
    print("  Dilewati (tidak ditemukan): {}".format(skipped))
    print("  NOTE: nama_sekolah dan field lain TIDAK diubah.")
    print("=" * 70 + "\n")


# ─────────────────────────────────────────────────────────────────
# Entry Point
# ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 70)
    print("  UPDATE DATA PAUD 2026 -> FIRESTORE  [UPDATE ONLY / NO CREATE]")
    print("  Program ID : " + PROGRAM_ID)
    print("  CSV File   : " + CSV_FILE)
    print("=" * 70)
    print()

    db   = init_firebase()
    rows = read_csv()
    process_and_upload(db, rows)
