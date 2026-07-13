# -*- coding: utf-8 -*-
"""
rollback_paud.py
=====================================================================
Script rollback: hapus semua dokumen di /programs/revitpaud2026/schools/
yang dibuat oleh import_paud.py (run sebelumnya).

Jalankan SATU KALI saja untuk membatalkan import terakhir.
Setelah rollback, jalankan import_paud.py (versi yang sudah difix).
=====================================================================
"""

import json, os, sys
from datetime import datetime, timezone

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "firebase-admin"])
    import firebase_admin
    from firebase_admin import credentials, firestore

PROGRAM_ID = "revitpaud2026"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
KEY_FILE   = os.path.normpath(os.path.join(SCRIPT_DIR, "..", "serviceAccountKey.json"))

def init_firebase():
    if not os.path.exists(KEY_FILE):
        print("[ERROR] serviceAccountKey.json tidak ditemukan: " + KEY_FILE)
        sys.exit(1)
    cred = credentials.Certificate(KEY_FILE)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    with open(KEY_FILE, encoding="utf-8") as f:
        project = json.load(f).get("project_id", "?")
    print("[OK] Firebase -> project: " + project)
    return db

if __name__ == "__main__":
    print("=" * 60)
    print("  ROLLBACK: Hapus schools di " + PROGRAM_ID)
    print("=" * 60)
    print()

    db          = init_firebase()
    schools_col = db.collection("programs").document(PROGRAM_ID).collection("schools")

    docs = list(schools_col.stream())
    print("[INFO] Ditemukan {} dokumen di Firestore schools.".format(len(docs)))

    if not docs:
        print("[INFO] Tidak ada dokumen untuk dihapus. Selesai.")
        sys.exit(0)

    # Konfirmasi
    print()
    ans = input("Yakin hapus {} dokumen? (ketik 'ya' untuk lanjut): ".format(len(docs)))
    if ans.strip().lower() != "ya":
        print("[BATAL] Rollback dibatalkan.")
        sys.exit(0)

    print()
    deleted = 0
    for doc in docs:
        nama = doc.to_dict().get("nama_sekolah", doc.id)
        doc.reference.delete()
        deleted += 1
        print("  [{:02d}] DELETED  {}  {}".format(deleted, doc.id, nama))

    print()
    print("=" * 60)
    print("  ROLLBACK SELESAI! {} dokumen dihapus.".format(deleted))
    print("=" * 60)
