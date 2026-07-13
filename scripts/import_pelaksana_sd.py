# -*- coding: utf-8 -*-
"""
import_pelaksana_sd.py
=====================================================================
Script Python untuk:
  1. Seed data sekolah dari initialSchools.js ke Firestore (jika belum ada)
  2. Import data pelaksana dari datapelaksana.csv:
       - kepala_sekolah, hp_kepala_sekolah -> field di dokumen sekolah
       - Perencana -> koleksi 'contacts' + link perencanaId di sekolah
       - Pengawas  -> koleksi 'contacts' + link pengawasId di sekolah

Struktur Firestore:
  /programs/revitsd2026/schools/{npsn}
  /programs/revitsd2026/contacts/{contact-id}

Cara pakai:
  py import_pelaksana_sd.py
=====================================================================
"""

import csv
import re
import json
import os
import sys
from datetime import datetime, timezone

# ─────────────────────────────────────────────────────────────────
# UTF-8 stdout untuk Windows
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
PROGRAM_ID = "revitsd2026"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE   = os.path.join(SCRIPT_DIR, "datapelaksana.csv")
KEY_FILE   = os.path.join(SCRIPT_DIR, "serviceAccountKey.json")

# ─────────────────────────────────────────────────────────────────
# Data sekolah awal (dari initialSchools.js) — NPSN sebagai key
# ─────────────────────────────────────────────────────────────────
INITIAL_SCHOOLS = [
    {"npsn": "30104982", "nama_sekolah": "SD Negeri 19 Tanjung Tengang",   "kabupaten": "Melawi",        "koordinat": "-0.3568557, 111.6858073",  "fasilitatorId": "hartanto-wahyu-sasongko"},
    {"npsn": "30105005", "nama_sekolah": "SD Negeri 01 Pemuar",             "kabupaten": "Melawi",        "koordinat": "-0.3037705, 111.6430775",  "fasilitatorId": "hartanto-wahyu-sasongko"},
    {"npsn": "30104987", "nama_sekolah": "SD Negeri 02 Keberak",            "kabupaten": "Melawi",        "koordinat": "-0.3937609, 111.5528948",  "fasilitatorId": "hartanto-wahyu-sasongko"},
    {"npsn": "30104971", "nama_sekolah": "SD Negeri 01 Pinoh Utara",        "kabupaten": "Melawi",        "koordinat": "-0.3269568, 111.7405406",  "fasilitatorId": "hartanto-wahyu-sasongko"},
    {"npsn": "30104991", "nama_sekolah": "SD Negeri 01 Ella Hilir",         "kabupaten": "Melawi",        "koordinat": "-0.4039258, 112.0040536",  "fasilitatorId": "hartanto-wahyu-sasongko"},
    {"npsn": "30102754", "nama_sekolah": "SD Negeri 18 Nanga Toran",        "kabupaten": "Sintang",       "koordinat": "-0.0809356, 112.0531695",  "fasilitatorId": "hartanto-wahyu-sasongko"},
    {"npsn": "30102686", "nama_sekolah": "SD Negeri 23 Periang",            "kabupaten": "Sintang",       "koordinat": "-0.1984112, 111.978483",   "fasilitatorId": "hartanto-wahyu-sasongko"},
    {"npsn": "30105740", "nama_sekolah": "SD Negeri 17 Mungguk",            "kabupaten": "Sekadau",       "koordinat": "0.016222, 110.888708",     "fasilitatorId": "achmad-idris-setianto"},
    {"npsn": "30105938", "nama_sekolah": "SD Negeri 44 Sungai Akar",        "kabupaten": "Sekadau",       "koordinat": "0.0615154, 110.9152151",   "fasilitatorId": "achmad-idris-setianto"},
    {"npsn": "30104282", "nama_sekolah": "SD Negeri 27 Tengkook",           "kabupaten": "Landak",        "koordinat": "0.4975883, 110.1792795",   "fasilitatorId": "rizal"},
    {"npsn": "30104275", "nama_sekolah": "SD Negeri 26 Raba Bayur",         "kabupaten": "Landak",        "koordinat": "0.4248151, 110.1370506",   "fasilitatorId": "rizal"},
    {"npsn": "30103866", "nama_sekolah": "SD Negeri 10 Sandai",             "kabupaten": "Ketapang",      "koordinat": "-1.185844, 110.6127813",   "fasilitatorId": "ahmad-maulana-iqbal"},
    {"npsn": "30103918", "nama_sekolah": "SD Negeri 11 Sandai",             "kabupaten": "Ketapang",      "koordinat": "-1.2320019, 110.5323589",  "fasilitatorId": "ahmad-maulana-iqbal"},
    {"npsn": "30105665", "nama_sekolah": "SD Negeri 12 Nyonak",             "kabupaten": "Sekadau",       "koordinat": "-0.5597113, 110.7106499",  "fasilitatorId": "achmad-idris-setianto"},
    {"npsn": "30102233", "nama_sekolah": "SD Negeri 10 Melugai",            "kabupaten": "Sanggau",       "koordinat": "0.0595149, 110.1292712",   "fasilitatorId": "achmad-idris-setianto"},
    {"npsn": "30102127", "nama_sekolah": "SD Negeri 04 Kampung Baru",       "kabupaten": "Sanggau",       "koordinat": "-0.2557582, 109.9552944",  "fasilitatorId": "achmad-idris-setianto"},
    {"npsn": "30101565", "nama_sekolah": "SD Negeri 03 Jongkat",            "kabupaten": "Mempawah",      "koordinat": "0.0611956, 109.205726",    "fasilitatorId": "dewi-ria-indriana"},
    {"npsn": "30107886", "nama_sekolah": "SD Negeri 34 Suka Ramai",         "kabupaten": "Landak",        "koordinat": "0.3395486, 109.2885831",   "fasilitatorId": "rizal"},
    {"npsn": "30104701", "nama_sekolah": "SD Negeri 20 Pakato",             "kabupaten": "Landak",        "koordinat": "0.6108689, 109.4006361",   "fasilitatorId": "rizal"},
    {"npsn": "30104522", "nama_sekolah": "SD Negeri 07 Raba",               "kabupaten": "Landak",        "koordinat": "0.5069986, 109.3209128",   "fasilitatorId": "rizal"},
    {"npsn": "30104241", "nama_sekolah": "SD Negeri 31 Begantung",          "kabupaten": "Landak",        "koordinat": "0.5957468, 109.6749375",   "fasilitatorId": "rizal"},
    {"npsn": "30104510", "nama_sekolah": "SD Negeri 04 Setolo",             "kabupaten": "Landak",        "koordinat": "0.589868, 109.6292702",    "fasilitatorId": "rizal"},
    {"npsn": "30104344", "nama_sekolah": "SD Negeri 10 Ampadan",            "kabupaten": "Landak",        "koordinat": "0.648987, 109.581097",     "fasilitatorId": "rizal"},
    {"npsn": "30100855", "nama_sekolah": "SD Negeri 10 Segedong",           "kabupaten": "Mempawah",      "koordinat": "0.2004961, 109.194505",    "fasilitatorId": "dewi-ria-indriana"},
    {"npsn": "30101553", "nama_sekolah": "SD Negeri 08 Sungai Pinyuh",      "kabupaten": "Mempawah",      "koordinat": "0.284531, 109.056833",     "fasilitatorId": "dewi-ria-indriana"},
    {"npsn": "30105395", "nama_sekolah": "SD Negeri 27 Pontianak Timur",    "kabupaten": "Pontianak",     "koordinat": "-0.0308226, 109.370654",   "fasilitatorId": "dian-perwita-sari"},
    {"npsn": "30105415", "nama_sekolah": "SD Negeri 06 Pontianak Timur",    "kabupaten": "Pontianak",     "koordinat": "-0.0423343, 109.3617344",  "fasilitatorId": "dian-perwita-sari"},
    {"npsn": "30105277", "nama_sekolah": "SD Negeri 04 Pontianak Timur",    "kabupaten": "Pontianak",     "koordinat": "-0.026315, 109.368782",    "fasilitatorId": "dian-perwita-sari"},
    {"npsn": "30104187", "nama_sekolah": "SD Negeri 10 Senangak",           "kabupaten": "Bengkayang",    "koordinat": "1.2560577, 109.721553",    "fasilitatorId": "dewi-ria-indriana"},
    {"npsn": "30103967", "nama_sekolah": "SD Negeri 20 Pakucing II",        "kabupaten": "Bengkayang",    "koordinat": "0.8629606, 109.1288207",   "fasilitatorId": "dewi-ria-indriana"},
    {"npsn": "30105386", "nama_sekolah": "SD Negeri 32 Pontianak Tenggara", "kabupaten": "Pontianak",     "koordinat": "-0.077876, 109.35169",     "fasilitatorId": "dian-perwita-sari"},
    {"npsn": "69888560", "nama_sekolah": "SD Negeri 21 Tempapan Hulu",      "kabupaten": "Sambas",        "koordinat": "1.6429109, 109.3327156",   "fasilitatorId": "ahmad-maulana-iqbal"},
    {"npsn": "30100435", "nama_sekolah": "SD Negeri 04 Tanjung Putat",      "kabupaten": "Sambas",        "koordinat": "1.2648035, 109.1909486",   "fasilitatorId": "ahmad-maulana-iqbal"},
    {"npsn": "30105548", "nama_sekolah": "SD Negeri 62 Singkawang",         "kabupaten": "Singkawang",    "koordinat": "0.8683758, 109.093837",    "fasilitatorId": "dewi-ria-indriana"},
    {"npsn": "30102503", "nama_sekolah": "SD Panca Setya 01 Sintang",       "kabupaten": "Sintang",       "koordinat": "0.0756384, 111.4995285",   "fasilitatorId": "hartanto-wahyu-sasongko"},
    {"npsn": "30103248", "nama_sekolah": "SD Negeri 06 Nanga Seberuang",    "kabupaten": "Kapuas Hulu",   "koordinat": "0.4673148, 111.8861909",   "fasilitatorId": "dian-perwita-sari"},
    {"npsn": "30102820", "nama_sekolah": "SD Negeri 15 UPT III Silat",      "kabupaten": "Kapuas Hulu",   "koordinat": "0.3309103, 111.7724729",   "fasilitatorId": "dian-perwita-sari"},
    {"npsn": "30102240", "nama_sekolah": "SD Negeri 09 Selayang",           "kabupaten": "Sanggau",       "koordinat": "-0.1822944, 110.0044647",  "fasilitatorId": "achmad-idris-setianto"},
    {"npsn": "30105876", "nama_sekolah": "SD Negeri 02 Belitang",           "kabupaten": "Sekadau",       "koordinat": "0.443353, 111.205574",     "fasilitatorId": "achmad-idris-setianto"},
    {"npsn": "30103889", "nama_sekolah": "SD Negeri 08 Benua Kayong",       "kabupaten": "Ketapang",      "koordinat": "-1.8547038, 110.0160641",  "fasilitatorId": "ahmad-maulana-iqbal"},
    {"npsn": "30102041", "nama_sekolah": "SD Negeri 07 Mangkau",            "kabupaten": "Sanggau",       "koordinat": "1.0340079, 110.2278471",   "fasilitatorId": "achmad-idris-setianto"},
]
# Buat lookup: npsn -> school dict
SCHOOLS_BY_NPSN = {s["npsn"]: s for s in INITIAL_SCHOOLS}


# ─────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────
def slugify(text):
    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"\s+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")

def clean_hp(hp):
    return hp.strip() if hp else ""

# ─────────────────────────────────────────────────────────────────
# Inisialisasi Firebase
# ─────────────────────────────────────────────────────────────────
def init_firebase():
    if not os.path.exists(KEY_FILE):
        print("\n[ERROR] File tidak ditemukan: " + KEY_FILE)
        print("  Download dari Firebase Console -> Project Settings -> Service Accounts")
        sys.exit(1)

    cred = credentials.Certificate(KEY_FILE)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)

    db = firestore.client()
    with open(KEY_FILE, encoding="utf-8") as f:
        project = json.load(f).get("project_id", "unknown")
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
# Proses & Upload
# ─────────────────────────────────────────────────────────────────
def process_and_upload(db, rows):
    program_ref  = db.collection("programs").document(PROGRAM_ID)
    contacts_col = program_ref.collection("contacts")
    schools_col  = program_ref.collection("schools")
    now_ts       = datetime.now(timezone.utc)

    # ── 1. Kumpulkan kontak unik dari CSV ──────────────────────────
    contacts_map = {}  # nama.lower() -> {id, nama, hp}

    for row in rows:
        for prefix, role_suffix in [("Nama Perencana", "p"), ("Nama Pengawas", "w")]:
            hp_key = "No Hp Perencana" if role_suffix == "p" else "No Hp Pengawas"
            nama   = row.get(prefix, "").strip()
            hp     = clean_hp(row.get(hp_key, ""))
            if nama:
                key = nama.lower()
                if key not in contacts_map:
                    contacts_map[key] = {
                        "id"  : "contact-{}-{}".format(slugify(nama), role_suffix),
                        "nama": nama,
                        "hp"  : hp,
                    }

    print("\n[INFO] {} kontak unik ditemukan".format(len(contacts_map)))

    # ── 2. Upload kontak ke Firestore ──────────────────────────────
    print("\n[UPLOAD] Menyimpan kontak ke Firestore...\n")
    for i, contact in enumerate(contacts_map.values(), 1):
        contacts_col.document(contact["id"]).set(
            {"id": contact["id"], "nama": contact["nama"], "hp": contact["hp"], "_updatedAt": now_ts},
            merge=True
        )
        print("  [{:02d}] OK  {:<30}  HP: {}".format(i, contact["nama"], contact["hp"]))

    print("\n  -> {} kontak tersimpan.".format(len(contacts_map)))

    # ── 3. Bangun data sekolah gabungan (initialSchools + CSV) ─────
    # Mulai dari data base initialSchools, lalu patch dengan data CSV
    # key: npsn -> merged school dict
    merged_schools = {}

    # Inisialisasi dari INITIAL_SCHOOLS
    for s in INITIAL_SCHOOLS:
        merged_schools[s["npsn"]] = dict(s)
        merged_schools[s["npsn"]]["id"]          = s["npsn"]  # doc ID = npsn
        merged_schools[s["npsn"]]["alamat"]      = ""
        merged_schools[s["npsn"]]["progres_fisik"] = 0
        merged_schools[s["npsn"]]["_updatedAt"]  = now_ts

    # Patch dari CSV
    for row in rows:
        npsn    = (row.get("NSPN") or row.get("NPSN") or "").strip()
        nama_ks = row.get("Nama Kepala Sekolah", "").strip()
        hp_ks   = clean_hp(row.get("No Hp Kepala Sekolah", ""))
        nama_p  = row.get("Nama Perencana", "").strip()
        nama_w  = row.get("Nama Pengawas", "").strip()

        if not npsn or npsn not in merged_schools:
            continue

        if nama_ks:
            merged_schools[npsn]["kepala_sekolah"]    = nama_ks
        if hp_ks:
            merged_schools[npsn]["hp_kepala_sekolah"] = hp_ks
        if nama_p:
            pid = contacts_map.get(nama_p.lower(), {}).get("id", "")
            if pid:
                merged_schools[npsn]["perencanaId"] = pid
        if nama_w:
            wid = contacts_map.get(nama_w.lower(), {}).get("id", "")
            if wid:
                merged_schools[npsn]["pengawasId"] = wid

    # ── 4. Cek sekolah yang sudah ada di Firestore ─────────────────
    print("\n[INFO] Mengecek koleksi schools di Firestore...")
    existing_npsns = set()
    for sdoc in schools_col.stream():
        data = sdoc.to_dict()
        npsn_val = str(data.get("npsn", sdoc.id)).strip()
        existing_npsns.add(npsn_val)
        existing_npsns.add(sdoc.id)

    print("[INFO] {} dokumen sekolah sudah ada di Firestore.".format(len(existing_npsns)))

    # ── 5. Upsert semua sekolah ke Firestore ───────────────────────
    print("\n[UPLOAD] Mengupload {} sekolah ke Firestore...\n".format(len(merged_schools)))

    created = 0
    updated = 0

    for npsn, school_data in merged_schools.items():
        doc_ref    = schools_col.document(npsn)
        is_new     = npsn not in existing_npsns
        doc_ref.set(school_data, merge=True)

        action = "BARU" if is_new else "UPDATE"
        if is_new:
            created += 1
        else:
            updated += 1

        ks   = school_data.get("kepala_sekolah", "-")
        p_id = school_data.get("perencanaId", "-")
        w_id = school_data.get("pengawasId", "-")

        print(
            "  [{}] {}  {:<40}  KS: {:<20}  P: {:<36}  W: {}".format(
                action,
                npsn,
                school_data.get("nama_sekolah", "")[:40],
                ks[:20] if ks else "-",
                p_id,
                w_id,
            )
        )

    # ── Ringkasan ──────────────────────────────────────────────────
    print("\n" + "=" * 70)
    print("  IMPORT SELESAI!")
    print("  Sekolah baru dibuat : {}".format(created))
    print("  Sekolah diperbarui  : {}".format(updated))
    print("  Kontak terupload    : {}".format(len(contacts_map)))
    print("=" * 70 + "\n")


# ─────────────────────────────────────────────────────────────────
# Entry Point
# ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 70)
    print("  IMPORT DATA PELAKSANA SD 2026 -> FIRESTORE")
    print("  Program ID : " + PROGRAM_ID)
    print("  CSV File   : " + CSV_FILE)
    print("=" * 70)
    print()

    db   = init_firebase()
    rows = read_csv()
    process_and_upload(db, rows)
