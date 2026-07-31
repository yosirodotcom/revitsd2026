/**
 * googleSheetsService.js
 * Service read-only untuk mengambil data monitoring dari Google Sheets (CSV public endpoint)
 */

// Helper CSV parser yang menangani kutip dan baris baru di dalam sel
function parseCSV(text) {
  const lines = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const nextC = text[i + 1];

    if (c === '"') {
      if (inQuotes && nextC === '"') {
        cell += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && nextC === '\n') {
        i++;
      }
      row.push(cell.trim());
      if (row.some(field => field.length > 0)) {
        lines.push(row);
      }
      row = [];
      cell = '';
    } else {
      cell += c;
    }
  }

  if (cell || row.length > 0) {
    row.push(cell.trim());
    if (row.some(field => field.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

// Clean percentage number string (e.g. "0.639", "0,639", "6,420" -> 0.639)
function parsePct(val) {
  if (val === undefined || val === null) return 0;
  const str = String(val).trim().replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

export const googleSheetsService = {
  /**
   * Fetch data monitoring dari Google Sheets
   * @param {string} spreadsheetId ID spreadsheet Google Sheets
   */
  async fetchMonitoringData(spreadsheetId) {
    const sheetId = spreadsheetId || import.meta.env.VITE_GSHEET_MONITORING_ID || '1vGgWEtjKwVAAOv0gE60PCp57909RabkDZ55pYsODKaU';
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&_t=${Date.now()}`;

    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Gagal mengambil data dari Google Sheets. HTTP ${response.status}`);
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    if (rows.length < 2) {
      throw new Error('Spreadsheet kosong atau format tidak sesuai.');
    }

    // Header ada di baris 0
    const dataRows = rows.slice(1);

    const schoolUpdates = [];
    const weeklyProgressRecords = [];

    for (const row of dataRows) {
      if (row.length < 5) continue;

      // Extract NPSN (kolom index 1)
      const npsn = String(row[1] || '').trim();
      if (!npsn || npsn.toUpperCase() === 'NSPN' || npsn.toUpperCase() === 'NPSN') continue;

      const kepala_sekolah = row[4] || '';
      const hp_kepala_sekolah = row[5] || '';
      const perencanaNama = row[6] || '';
      const perencanaHp = row[7] || '';
      const pengawasNama = row[8] || '';
      const pengawasHp = row[9] || '';
      const dinas_pendidikan_nama = row[10] || '';
      const dinas_pendidikan_hp = row[11] || '';
      const tanggal_pks = row[12] || '';
      const tanggal_dana_tahap1 = row[13] || '';
      const tanggal_mc0 = row[14] || '';
      const kelengkapan_mc0 = row[15] || '';
      const kendala_mc0 = row[16] || '';
      const kendala_pelaksanaan = row[17] || '';

      schoolUpdates.push({
        npsn,
        kepala_sekolah,
        hp_kepala_sekolah,
        perencanaNama,
        perencanaHp,
        pengawasNama,
        pengawasHp,
        dinas_pendidikan_nama,
        dinas_pendidikan_hp,
        tanggal_pks,
        tanggal_dana_tahap1,
        tanggal_mc0,
        kelengkapan_mc0,
        kendala_mc0,
        kendala_pelaksanaan
      });

      // Parse 24 minggu progres mingguan (kolom index 18 s/d 161)
      for (let w = 1; w <= 24; w++) {
        const baseCol = 18 + (w - 1) * 6;
        if (baseCol >= row.length) break;

        const reStr = row[baseCol] || '';
        const koStr = row[baseCol + 1] || '';
        const renStr = row[baseCol + 2] || '';
        const devStr = row[baseCol + 3] || '';
        const kendala = row[baseCol + 4] || '';
        const rekomendasi = row[baseCol + 5] || '';

        // Hanya buat record jika ada data (satu atau lebih kolom terisi)
        const hasValue = reStr !== '' || koStr !== '' || renStr !== '' || kendala !== '' || rekomendasi !== '';
        if (hasValue) {
          const realisasi = parsePct(reStr);
          const kumulatif = parsePct(koStr);
          const rencana = parsePct(renStr);
          const deviasi = parsePct(devStr) || (realisasi - rencana);

          weeklyProgressRecords.push({
            id: `wp-${npsn}-m${w}`,
            schoolId: npsn,
            minggu: w,
            bulan: Math.ceil(w / 4),
            realisasi,
            kumulatif,
            rencana,
            deviasi,
            kendala,
            rekomendasi,
            updatedBy: 'gsheet_sync',
            updatedAt: new Date().toISOString()
          });
        }
      }
    }

    return {
      schoolUpdates,
      weeklyProgressRecords,
      totalSchoolsProcessed: schoolUpdates.length,
      totalWeeklyRecordsProcessed: weeklyProgressRecords.length
    };
  }
};
