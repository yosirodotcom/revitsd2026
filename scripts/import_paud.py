# -*- coding: utf-8 -*-
"""
import_paud.py
=====================================================================
Script Python untuk mengimport/mengupdate data PAUD 2026 ke Firestore.

Logika Cerdas:
1. Ambil semua dokumen sekolah yang saat ini ada di Firestore (revitpaud2026).
2. Jika dokumen sekolah BELUM ADA di Firestore:
   - Kita buat dokumen baru (seeding) menggunakan data dasar dari 
     initialPaudSchools.js (termasuk nama_sekolah asli, koordinat, dll) 
     ditambah data update dari CSV (alamat, kelurahan/desa, kecamatan, kepala sekolah, hp).
3. Jika dokumen sekolah SUDAH ADA di Firestore:
   - Kita HANYA mengupdate field: alamat, desa, kecamatan, kepala_sekolah, dan hp_kepala_sekolah.
   - Kita TIDAK akan menimpa nama_sekolah atau field operasional lainnya.

Struktur Firestore:
  /programs/revitpaud2026/schools/{npsn}

Cara pakai:
  py scripts/import_paud.py
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
    print("[INFO] Modul firebase-admin belum terinstall. Menginstall...")
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
# Data sekolah awal PAUD (dari initialPaudSchools.js)
# ─────────────────────────────────────────────────────────────────
INITIAL_PAUD_SCHOOLS = [
    {"npsn": "30108692", "nama_sekolah": "TK Angkasa",                              "kabupaten": "Bengkayang",    "kecamatan": "Sanggau Ledo",          "desa": "Desa Bange",               "koordinat": "1.0915387, 109.690889",  "fasilitatorId": None},
    {"npsn": "69958516", "nama_sekolah": "PAUD Darul Fikri",                        "kabupaten": "Bengkayang",    "kecamatan": "Ledo",                  "desa": "Desa Lesabela", "koordinat": "1.0372196, 109.6118399", "fasilitatorId": None},
    {"npsn": "70039851", "nama_sekolah": "KB Berkah Sungai Danti",                  "kabupaten": "Bengkayang",    "kecamatan": "Sanggau Ledo",          "desa": "Desa Danti",               "koordinat": "1.1773596, 109.5491819", "fasilitatorId": None},
    {"npsn": "30108240", "nama_sekolah": "TK Negeri Pembina Kecamatan Seberuang",   "kabupaten": "Kapuas Hulu",   "kecamatan": "Seberuang",             "desa": "Desa Sejiram",             "koordinat": "0.4269799, 112.0041068", "fasilitatorId": None},
    {"npsn": "30109422", "nama_sekolah": "TK Dharma Wanita",                        "kabupaten": "Kayong Utara",  "kecamatan": "Simpang Hilir",         "desa": "Desa Teluk Melano",        "koordinat": "-1.5476083, 110.0380213","fasilitatorId": None},
    {"npsn": "69870769", "nama_sekolah": "TK Kasih Bunda",                          "kabupaten": "Kayong Utara",  "kecamatan": "Seponti",               "desa": "Desa Podo Rukun",          "koordinat": "-1.6889027, 110.4241019","fasilitatorId": None},
    {"npsn": "69870771", "nama_sekolah": "KB Miftahul Huda",                        "kabupaten": "Kayong Utara",  "kecamatan": "Teluk Batang",          "desa": "Desa Alur Bandung",        "koordinat": "-1.6297578, 110.0947949","fasilitatorId": None},
    {"npsn": "69870772", "nama_sekolah": "PAUD Terpadu Pelita Hati",                "kabupaten": "Kayong Utara",  "kecamatan": "Seponti",               "desa": "Desa Wonorejo",            "koordinat": "-1.6744282, 110.2908993","fasilitatorId": None},
    {"npsn": "69871074", "nama_sekolah": "TK Pembina Simpang Hilir",                "kabupaten": "Kayong Utara",  "kecamatan": "Simpang Hilir",         "desa": "Desa Pulau Kumbang",       "koordinat": "-1.3880895, 110.0316499","fasilitatorId": None},
    {"npsn": "69871076", "nama_sekolah": "TK Sartika 01",                           "kabupaten": "Kayong Utara",  "kecamatan": "Simpang Hilir",         "desa": "Desa Rantau Panjang",      "koordinat": "-1.3985949, 110.0384066","fasilitatorId": None},
    {"npsn": "69871079", "nama_sekolah": "TK Pembina Teluk Batang",                 "kabupaten": "Kayong Utara",  "kecamatan": "Teluk Batang",          "desa": "Desa Sungai Paduan",       "koordinat": "-1.5975826, 110.0194803","fasilitatorId": None},
    {"npsn": "69871080", "nama_sekolah": "TK Babussa Adah",                         "kabupaten": "Kayong Utara",  "kecamatan": "Teluk Batang",          "desa": "Desa Sungai Paduan",       "koordinat": "-1.604278, 110.0247099", "fasilitatorId": None},
    {"npsn": "69871085", "nama_sekolah": "TK Pembina Seponti",                      "kabupaten": "Kayong Utara",  "kecamatan": "Seponti",               "desa": "Desa Seponti Jaya",        "koordinat": "-1.7049747, 110.2680551","fasilitatorId": None},
    {"npsn": "69871090", "nama_sekolah": "KB Mentari",                              "kabupaten": "Kayong Utara",  "kecamatan": "Sukadana",              "desa": "Desa Sejahtera",           "koordinat": "-1.2590569, 110.1258219","fasilitatorId": None},
    {"npsn": "69871092", "nama_sekolah": "KB Kasih Ibu",                            "kabupaten": "Kayong Utara",  "kecamatan": "Sukadana",              "desa": "Desa Sedahan Jaya",        "koordinat": "-1.2588617, 110.0028939","fasilitatorId": None},
    {"npsn": "69871101", "nama_sekolah": "KB At Taubah",                            "kabupaten": "Kayong Utara",  "kecamatan": "Teluk Batang",          "desa": "Desa Teluk Batang Utara",  "koordinat": "-1.5745578, 110.0286117","fasilitatorId": None},
    {"npsn": "69938526", "nama_sekolah": "PAUD Terpadu Asmaul Husnah",              "kabupaten": "Kayong Utara",  "kecamatan": "Pulau Maya",            "desa": "Desa Kemboja",             "koordinat": "-1.1625847, 109.7491855","fasilitatorId": None},
    {"npsn": "69938528", "nama_sekolah": "PAUD Terpadu Maya Permai",                "kabupaten": "Kayong Utara",  "kecamatan": "Pulau Maya",            "desa": "Desa Dusun Besar",         "koordinat": "-1.2072459, 109.7455637","fasilitatorId": None},
    {"npsn": "69948059", "nama_sekolah": "TKIT Permata Kayong",                     "kabupaten": "Kayong Utara",  "kecamatan": "Sukadana",              "desa": "Desa Sutera",              "koordinat": "-1.2612804, 110.0005007","fasilitatorId": None},
    {"npsn": "69977534", "nama_sekolah": "TK Mutiara Pelapis",                      "kabupaten": "Kayong Utara",  "kecamatan": "Kepulauan Karimata",    "desa": "Desa Pelapis",             "koordinat": "-1.6616447, 108.9012476","fasilitatorId": None},
    {"npsn": "69836503", "nama_sekolah": "TK Aisyiyah Bustanul Athfal 09",          "kabupaten": "Ketapang",      "kecamatan": "Matan Hilir Selatan",   "desa": "Desa Sungai Bakau",        "koordinat": "-1.7819271, 109.8756264","fasilitatorId": None},
    {"npsn": "69836508", "nama_sekolah": "TK Aisyiyah Bustanul Atfhal 08",          "kabupaten": "Ketapang",      "kecamatan": "Matan Hilir Selatan",   "desa": "Desa Sungai Jawi",         "koordinat": "-1.7877567, 109.8773955","fasilitatorId": None},
    {"npsn": "69836551", "nama_sekolah": "KB Kedaung Jaya",                         "kabupaten": "Ketapang",      "kecamatan": "Benua Kayong",          "desa": "Desa Baru",                "koordinat": "-1.8467124, 109.9710737","fasilitatorId": None},
    {"npsn": "69836553", "nama_sekolah": "TK Usaha Bersama",                        "kabupaten": "Ketapang",      "kecamatan": "Benua Kayong",          "desa": "Desa Suka Baru",           "koordinat": "-1.8519741, 110.0092926","fasilitatorId": None},
    {"npsn": "69836555", "nama_sekolah": "KB Ar Rahim",                             "kabupaten": "Ketapang",      "kecamatan": "Matan Hilir Utara",     "desa": "Desa Tanjung Baik Budi",   "koordinat": "-1.7048569, 109.9337566","fasilitatorId": None},
    {"npsn": "69866567", "nama_sekolah": "KB PMS",                                  "kabupaten": "Ketapang",      "kecamatan": "Matan Hilir Utara",     "desa": "Desa Kuala Satong",        "koordinat": "-1.6440044, 109.9671474","fasilitatorId": None},
    {"npsn": "69896600", "nama_sekolah": "KB Al Jannah",                            "kabupaten": "Ketapang",      "kecamatan": "Matan Hilir Utara",     "desa": "Desa Kuala Tolak",         "koordinat": "-1.6274128, 109.8930895","fasilitatorId": None},
    {"npsn": "69896971", "nama_sekolah": "KB Tanjung Ria",                          "kabupaten": "Ketapang",      "kecamatan": "Benua Kayong",          "desa": "Desa Suka Baru",           "koordinat": "-1.8519741, 110.0092926","fasilitatorId": None},
    {"npsn": "69953389", "nama_sekolah": "TK Aisyiyah Bustanul Athfal 03",          "kabupaten": "Ketapang",      "kecamatan": "Singkup",               "desa": "Desa Suka Sari",           "koordinat": "-1.7574685, 110.1555432","fasilitatorId": None},
    {"npsn": "30109326", "nama_sekolah": "TK Aisyiah BA IV",                        "kabupaten": "Pontianak",     "kecamatan": "Pontianak Barat",       "desa": "Kel. Sungai Jawi Dalam",   "koordinat": "-0.0626843, 109.3207124","fasilitatorId": None},
    {"npsn": "30109338", "nama_sekolah": "TK Ananda",                               "kabupaten": "Pontianak",     "kecamatan": "Pontianak Barat",       "desa": "Kel. Sungai Beliung",      "koordinat": "-0.0692697, 109.3124819","fasilitatorId": None},
    {"npsn": "30109362", "nama_sekolah": "TK IGTK I PGRI",                          "kabupaten": "Pontianak",     "kecamatan": "Pontianak Kota",        "desa": "Kel. Sungai Bangkong",     "koordinat": "-0.0534673, 109.3469019","fasilitatorId": None},
    {"npsn": "30108354", "nama_sekolah": "TK Torsina III",                          "kabupaten": "Singkawang",    "kecamatan": "Singkawang Selatan",    "desa": "Kel. Sedau",               "koordinat": "0.8559753, 109.0167736", "fasilitatorId": None},
    {"npsn": "69909579", "nama_sekolah": "TK Tunas Cendikia",                       "kabupaten": "Kubu Raya",     "kecamatan": "Rasau Jaya",            "desa": "Desa Pematang Tujuh",      "koordinat": "-0.2165547, 109.3218085","fasilitatorId": None},
    {"npsn": "69975317", "nama_sekolah": "TK Negeri Pembina Kecamatan Telok Pakedai","kabupaten": "Kubu Raya",    "kecamatan": "Telok Pakedai",         "desa": "Desa Selat Remis",         "koordinat": "-0.1248748, 109.2126543","fasilitatorId": None},
    {"npsn": "70006018", "nama_sekolah": "TK Terpadu Methodist Immanuel",            "kabupaten": "Kubu Raya",    "kecamatan": "Sungai Kakap",          "desa": "Desa Sungai Kakap",        "koordinat": "-0.1576764, 109.2799866","fasilitatorId": None},
    {"npsn": "70028237", "nama_sekolah": "KB Darul Mukhtar",                        "kabupaten": "Kubu Raya",     "kecamatan": "Sungai Raya",           "desa": "Desa Tebang Kacang",       "koordinat": "-0.0822396, 109.4295765","fasilitatorId": None},
    {"npsn": "30107751", "nama_sekolah": "TK Budi Mulia",                           "kabupaten": "Mempawah",      "kecamatan": "Mempawah Hulu",         "desa": "Desa Karangan",            "koordinat": "0.3285817, 109.2706471", "fasilitatorId": None},
    {"npsn": "30108645", "nama_sekolah": "TK Negeri Satu Atap Pesayangan",          "kabupaten": "Landak",        "kecamatan": "Ngabang",               "desa": "Desa Raja",                "koordinat": "0.3706264, 109.9629753", "fasilitatorId": None},
    {"npsn": "69850397", "nama_sekolah": "TK Satu Atap 03 Ngabang",                 "kabupaten": "Landak",        "kecamatan": "Ngabang",               "desa": "Desa Raja",                "koordinat": "0.3706264, 109.9629753", "fasilitatorId": None},
    {"npsn": "69935736", "nama_sekolah": "PAUD Elsadai Setolo",                     "kabupaten": "Landak",        "kecamatan": "Menyuke",               "desa": "Desa Darit",               "koordinat": "0.5408506, 109.7980048", "fasilitatorId": None},
    {"npsn": "69949601", "nama_sekolah": "TK Nurul Yaqin",                          "kabupaten": "Landak",        "kecamatan": "Menjalin",              "desa": "Desa Menjalin",            "koordinat": "0.3823003, 109.7108574", "fasilitatorId": None},
    {"npsn": "69989340", "nama_sekolah": "KB Anugerah Bunda",                       "kabupaten": "Landak",        "kecamatan": "Menyuke",               "desa": "Desa Ansang",              "koordinat": "0.5408506, 109.7980048", "fasilitatorId": None},
    {"npsn": "70006056", "nama_sekolah": "TK Perintis",                             "kabupaten": "Landak",        "kecamatan": "Sompak",                "desa": "Desa Sompak",              "koordinat": "0.4249565, 109.6802979", "fasilitatorId": None},
    {"npsn": "69911791", "nama_sekolah": "KB Permata Ummi",                         "kabupaten": "Mempawah",      "kecamatan": "Jongkat",               "desa": "Desa Jungkat",             "koordinat": "0.1217073, 109.1696539", "fasilitatorId": None},
    {"npsn": "70002643", "nama_sekolah": "TK Negeri Pembina Toho",                  "kabupaten": "Mempawah",      "kecamatan": "Toho",                  "desa": "Desa Pak Laheng",          "koordinat": "0.4167618, 109.3564093", "fasilitatorId": None},
    {"npsn": "30108401", "nama_sekolah": "TK Negeri Satu Atap SDN 13 Kubung",       "kabupaten": "Sambas",        "kecamatan": "Teluk Keramat",         "desa": "Desa Kubangga",            "koordinat": "1.4474434, 109.2818337", "fasilitatorId": None},
    {"npsn": "69935654", "nama_sekolah": "TK Dharma Asih",                          "kabupaten": "Sanggau",       "kecamatan": "Balai",                 "desa": "Desa Hilir",               "koordinat": "-0.2022157, 110.5580119","fasilitatorId": None},
    {"npsn": "69949242", "nama_sekolah": "TK Pelita Desa Amiati Jaya",              "kabupaten": "Sanggau",       "kecamatan": "Meliau",                "desa": "Desa Sungai Kembayau",     "koordinat": "-0.2617534, 110.3527126","fasilitatorId": None},
    {"npsn": "30107518", "nama_sekolah": "TK As Syakirin",                          "kabupaten": "Sintang",       "kecamatan": "Sintang",               "desa": "Desa Sungai Ana",          "koordinat": "0.0637217, 111.4913516", "fasilitatorId": None},
    {"npsn": "30107557", "nama_sekolah": "TK Negeri 1 Sepauk",                      "kabupaten": "Sintang",       "kecamatan": "Sepauk",                "desa": "Desa Mait Hilir",          "koordinat": "0.0237975, 111.7297312", "fasilitatorId": None},
    {"npsn": "69903667", "nama_sekolah": "Cerdas",                                  "kabupaten": "Sintang",       "kecamatan": "Sintang",               "desa": "Kel. Baning Kota",         "koordinat": "0.0637217, 111.4913516", "fasilitatorId": None},
    {"npsn": "69968784", "nama_sekolah": "KB Pelita Yerusalem Lalang",              "kabupaten": "Sintang",       "kecamatan": "Kayan Hilir",           "desa": "Desa Lalang Ingar",        "koordinat": "-0.2012327, 111.8034847","fasilitatorId": None},
    {"npsn": "69985561", "nama_sekolah": "TPA Cahaya Bunda",                        "kabupaten": "Sintang",       "kecamatan": "Sintang",               "desa": "Kel. Ladang",              "koordinat": "0.0637217, 111.4913516", "fasilitatorId": None},
    {"npsn": "70053136", "nama_sekolah": "TK Aku Anak Saleh",                       "kabupaten": "Sintang",       "kecamatan": "Sintang",               "desa": "Desa Sungai Ana",          "koordinat": "0.0637217, 111.4913516", "fasilitatorId": None},
]
SCHOOLS_BY_NPSN = {s["npsn"]: s for s in INITIAL_PAUD_SCHOOLS}

# ─────────────────────────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────────────────────────
def clean(val):
    return val.strip() if val else ""

# ─────────────────────────────────────────────────────────────────
# Inisialisasi Firebase
# ─────────────────────────────────────────────────────────────────
def init_firebase():
    key_path = os.path.normpath(KEY_FILE)
    if not os.path.exists(key_path):
        print("\n[ERROR] File tidak ditemukan: " + key_path)
        print("  Letakkan serviceAccountKey.json di folder parent.")
        sys.exit(1)

    cred = credentials.Certificate(key_path)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)

    db = firestore.client()
    with open(key_path, encoding="utf-8") as f:
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

    # ── 1. Ambil daftar sekolah PAUD di Firestore saat ini ──────────
    print("\n[INFO] Mengambil daftar sekolah PAUD dari Firestore...")
    existing = {}  # npsn_str -> firestore doc_id
    for sdoc in schools_col.stream():
        data     = sdoc.to_dict()
        npsn_val = str(data.get("npsn", sdoc.id)).strip()
        existing[npsn_val] = sdoc.id
        existing.setdefault(sdoc.id, sdoc.id)
    print("[INFO] {} dokumen sekolah ditemukan di Firestore.\n".format(len(existing)))

    # ── 2. Proses update/seeding secara cerdas ─────────────────────
    print("[UPLOAD] Memproses update/seeding data sekolah...\n")

    updated = 0
    created = 0
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

        # Build payload update
        payload = {
            "_updatedAt": now_ts
        }
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

        # Cek apakah sudah ada di Firestore
        if npsn in existing:
            # 1. JIKA SUDAH ADA: Hanya update field yang diubah (TIDAK sentuh nama_sekolah dll)
            doc_id  = existing[npsn]
            doc_ref = schools_col.document(doc_id)
            doc_ref.set(payload, merge=True)
            updated += 1
            print("  [UPDATE] {}  KS: {}".format(npsn, ks_nama or "-"))
        else:
            # 2. JIKA BELUM ADA (Firestore kosong): 
            #    Buat dokumen baru dengan menggabungkan data default (initialPaudSchools) + CSV.
            #    Ini menjamin nama_sekolah asli tetap aman, tidak rusak/ditimpa teks aneh.
            base = SCHOOLS_BY_NPSN.get(npsn)
            if not base:
                print("  [SKIP]   {} tidak terdaftar di initialPaudSchools.".format(npsn))
                skipped += 1
                continue

            # Buat dokumen utuh baru
            doc_data = {
                "id"             : npsn,
                "npsn"           : npsn,
                "nama_sekolah"   : base.get("nama_sekolah", ""),
                "kabupaten"      : base.get("kabupaten", ""),
                "kecamatan"      : kecamatan or base.get("kecamatan", ""),
                "desa"           : kelurahan or base.get("desa", ""),
                "alamat"         : alamat,
                "koordinat"      : base.get("koordinat", ""),
                "fasilitatorId"  : base.get("fasilitatorId", None),
                "kepala_sekolah" : ks_nama,
                "hp_kepala_sekolah": ks_hp,
                "progres_fisik"  : 0,
                "_updatedAt"     : now_ts,
            }
            schools_col.document(npsn).set(doc_data, merge=True)
            created += 1
            print("  [SEED]   {}  {:<40}  KS: {}".format(npsn, base["nama_sekolah"][:40], ks_nama or "-"))

    # ── Ringkasan ─────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("  PROSES SELESAI!")
    print("  Sekolah baru (di-seed)  : {}".format(created))
    print("  Sekolah lama (di-update): {}".format(updated))
    print("  Dilewati / Lewat        : {}".format(skipped))
    print("  *Nama sekolah aman dan menggunakan database initialPaudSchools*")
    print("=" * 70 + "\n")


# ─────────────────────────────────────────────────────────────────
# Entry Point
# ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 70)
    print("  SMART UPDATE & SEED DATA PAUD 2026 -> FIRESTORE")
    print("  Program ID : " + PROGRAM_ID)
    print("  CSV File   : " + CSV_FILE)
    print("=" * 70)
    print()

    db   = init_firebase()
    rows = read_csv()
    process_and_upload(db, rows)
