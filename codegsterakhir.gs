// Konfigurasi Token Keamanan (Sesuaikan token ini dengan pengaturan di aplikasi)
const API_TOKEN = "REVITSD2026_SECURE_TOKEN"; 
const FOLDER_NAME = "RevitalisasiSD_Files";

// Header Kolom untuk masing-masing sheet (Gabungan Skema Deployed + Fitur Baru)
const SCHEMAS = {
  settings: ["projectStartDate", "projectEndDate", "simulatedToday"],
  users: ["id", "nama", "jabatanKepegawaian", "jabatanTim", "coordinatorId", "pendidikan", "statusPegawai", "role", "password", "taxPct", "defaultTripDays"],
  schools: ["npsn", "nama", "kabupaten", "kecamatan", "desa", "kepalaSekolah", "fasilitatorId", "koordinat", "perencanaId", "pengawasId", "progres_fisik"],
  contacts: ["id", "nama", "peran", "email", "telp", "perusahaan", "kabupaten"],
  tasks: ["id", "schoolId", "title", "status"],
  trips: [
    "id", "userId", "sekolahId", "schoolId", "userRoleTim", "kunjunganKe", 
    "tanggalMulai", "date", "tanggalSelesai", "durasiHari", "duration", 
    "statusPekerjaanSaatKunjungan", "laporanHasil", "reason", "simDate", 
    "statusPersetujuan", "status", "approvedBySuperAdmin", "approvedAt", "approvedBy", "isPaid"
  ],
  logs: ["id", "userId", "tanggal", "aktivitas", "foto", "createdAt"],
  reports: ["id", "userId", "bulanKe", "fileName", "fileData", "submittedAt", "status", "note", "reviewedAt", "reviewedBy"],
  duty_reports: ["userId", "dutyIndex", "completed", "month", "id"],
  expenses: ["id", "date", "amount", "description", "notedBy"],
  payments: ["id", "type", "amount", "date", "userId", "details"],
  school_docs: ["id", "sekolahId", "category", "fileName", "fileSize", "fileData", "uploadedBy", "uploadedAt"],
  personnel_docs: ["id", "userId", "type", "fileName", "fileSize", "fileData", "uploadedBy", "uploadedAt"],
  meeting_docs: ["id", "meetingId", "fileName", "fileSize", "fileData", "uploadedBy", "uploadedAt"],
  trip_docs: ["id", "tripId", "category", "fileName", "fileSize", "fileData", "uploadedBy", "uploadedAt"],
  meetings: ["id", "judul", "tanggal", "jam", "lokasi", "keterangan", "pesertaIds", "fotoKegiatan"],
  activity_logs: ["id", "userId", "timestamp", "actionType", "description", "fileRef_id", "fileRef_type", "fileRef_fileName", "fileRef_fileData"]
};

// Pastikan semua Sheet ada dan memiliki header yang sesuai
function bootstrapSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  for (const sheetName in SCHEMAS) {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(SCHEMAS[sheetName]);
    } else {
      // Deteksi & tambahkan otomatis kolom baru yang belum ada di spreadsheet Anda
      const lastCol = sheet.getLastColumn();
      const currentHeaders = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
      const expectedHeaders = SCHEMAS[sheetName];
      
      expectedHeaders.forEach(h => {
        if (currentHeaders.indexOf(h) === -1) {
          const nextCol = sheet.getLastColumn() + 1;
          sheet.getRange(1, nextCol).setValue(h);
          Logger.log("Menambahkan kolom baru '" + h + "' ke sheet '" + sheetName + "'");
        }
      });
    }
  }
}

// Dapatkan atau buat folder di Google Drive
function getOrCreateFolder() {
  const folders = DriveApp.getFoldersByName(FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  const folder = DriveApp.createFolder(FOLDER_NAME);
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return folder;
}

// Simpan file Base64 ke Google Drive dan kembalikan URL unduhan publik
function saveBase64ToDrive(base64Data, fileName) {
  try {
    const folder = getOrCreateFolder();
    const parts = base64Data.split(",");
    const mimeType = parts[0].match(/:(.*?);/)[1];
    const rawData = parts[1];
    const decoded = Utilities.base64Decode(rawData);
    const blob = Utilities.newBlob(decoded, mimeType, fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getDownloadUrl();
  } catch (err) {
    Logger.log("Gagal mengunggah file ke Drive: " + err.message);
    return base64Data;
  }
}

// Response helper
function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// GET Endpoint: Mengambil seluruh data dalam database Sheets
function doGet(e) {
  const token = e.parameter.token;
  if (token !== API_TOKEN) {
    return jsonResponse({ error: "Unauthorized" });
  }

  bootstrapSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const result = {};

  for (const sheetName in SCHEMAS) {
    const sheet = ss.getSheetByName(sheetName);
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    if (lastRow <= 1) {
      result[sheetName] = [];
      continue;
    }

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const dataRows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

    const list = dataRows.map(row => {
      const obj = {};
      headers.forEach((h, index) => {
        let val = row[index];
        if (val === "true") val = true;
        if (val === "false") val = false;
        obj[h] = val;
      });
      return obj;
    });

    if (sheetName === "settings") {
      result[sheetName] = list[0] || { projectStartDate: "2026-06-12", projectEndDate: "2026-12-12", simulatedToday: "2026-09-14" };
    } else {
      result[sheetName] = list;
    }
  }

  return jsonResponse(result);
}

// POST Endpoint: Sinkronisasi data dari Client & Upload File
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const token = payload.token;

    if (token !== API_TOKEN) {
      return jsonResponse({ error: "Unauthorized" });
    }

    bootstrapSheets();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const clientState = payload.state;

    for (const sheetName in SCHEMAS) {
      const sheet = ss.getSheetByName(sheetName);
      const headers = SCHEMAS[sheetName];

      let clientData = clientState[sheetName];
      if (sheetName === "settings") {
        clientData = [clientState[sheetName]];
      }

      if (!Array.isArray(clientData)) continue;

      // 1. Proses upload file otomatis ke Drive jika ada field Base64
      const processedData = clientData.map(item => {
        const newItem = { ...item };
        
        if (sheetName === "logs" && newItem.foto && newItem.foto.indexOf("data:") === 0) {
          newItem.foto = saveBase64ToDrive(newItem.foto, "log-" + newItem.id + ".jpg");
        }
        
        if (sheetName === "reports" && newItem.fileData && newItem.fileData.indexOf("data:") === 0) {
          newItem.fileData = saveBase64ToDrive(newItem.fileData, newItem.fileName || ("report-" + newItem.id + ".pdf"));
        }

        if (sheetName === "school_docs" && newItem.fileData && newItem.fileData.indexOf("data:") === 0) {
          newItem.fileData = saveBase64ToDrive(newItem.fileData, newItem.fileName || ("doc-" + newItem.id));
        }

        if (sheetName === "personnel_docs" && newItem.fileData && newItem.fileData.indexOf("data:") === 0) {
          newItem.fileData = saveBase64ToDrive(newItem.fileData, newItem.fileName || ("persdoc-" + newItem.id));
        }

        if (sheetName === "meeting_docs" && newItem.fileData && newItem.fileData.indexOf("data:") === 0) {
          newItem.fileData = saveBase64ToDrive(newItem.fileData, newItem.fileName || ("meetdoc-" + newItem.id));
        }

        if (sheetName === "trip_docs" && newItem.fileData && newItem.fileData.indexOf("data:") === 0) {
          newItem.fileData = saveBase64ToDrive(newItem.fileData, newItem.fileName || ("tripdoc-" + newItem.id));
        }

        if (sheetName === "meetings" && newItem.fotoKegiatan && newItem.fotoKegiatan.indexOf("data:") === 0) {
          newItem.fotoKegiatan = saveBase64ToDrive(newItem.fotoKegiatan, "meeting-" + newItem.id + ".jpg");
        }

        if (sheetName === "activity_logs" && newItem.fileRef_fileData && newItem.fileRef_fileData.indexOf("data:") === 0) {
          newItem.fileRef_fileData = saveBase64ToDrive(newItem.fileRef_fileData, newItem.fileRef_fileName || ("actdoc-" + newItem.id));
        }

        return newItem;
      });

      // 2. Bersihkan isi tabel lama dan tulis ulang semua baris
      sheet.clearContents();
      sheet.appendRow(headers);

      if (processedData.length > 0) {
        const rowsToWrite = processedData.map(item => {
          return headers.map(h => {
            let val = item[h];
            if (val === undefined || val === null) return "";
            if (typeof val === "boolean") return val.toString();
            return val;
          });
        });
        sheet.getRange(2, 1, rowsToWrite.length, headers.length).setValues(rowsToWrite);
      }
    }

    return jsonResponse({ success: true, message: "Sinkronisasi berhasil!" });
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}
