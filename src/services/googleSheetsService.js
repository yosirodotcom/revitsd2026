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

// Clean percentage number string (e.g. "0.639", "0,639", "6,420", "28.5979%" -> 28.5979)
function parsePct(val) {
  if (val === undefined || val === null) return 0;
  let str = String(val).trim();
  if (!str || str === '-' || str === '""') return 0;
  str = str.replace('%', '').replace(',', '.').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

// Normalisasi tanggal (e.g. "25-May-2026", "8-Jun-2026", "2026-05-25" -> "25 Mei 2026")
function formatDateGSheet(val) {
  if (!val || typeof val !== 'string') return '';
  const str = val.trim();
  if (!str) return '';

  const monthNamesId = {
    jan: 'Januari', feb: 'Februari', mar: 'Maret', apr: 'April',
    may: 'Mei', mei: 'Mei', jun: 'Juni', jul: 'Juli',
    aug: 'Agustus', agu: 'Agustus', ags: 'Agustus', sep: 'September',
    oct: 'Oktober', okt: 'Oktober', nov: 'November', dec: 'Desember', des: 'Desember'
  };

  const mmmMatch = str.match(/^(\d{1,2})[-/\s]([a-zA-Z]{3,4})[-/\s](\d{4})$/);
  if (mmmMatch) {
    const day = parseInt(mmmMatch[1], 10);
    const mKey = mmmMatch[2].toLowerCase().substring(0, 3);
    const year = mmmMatch[3];
    const mName = monthNamesId[mKey] || mmmMatch[2];
    return `${day} ${mName} ${year}`;
  }

  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = isoMatch[1];
    const monthIndex = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const mNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${day} ${mNames[monthIndex] || isoMatch[2]} ${year}`;
  }

  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const monthIndex = parseInt(dmyMatch[2], 10) - 1;
    const year = dmyMatch[3];
    const mNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${day} ${mNames[monthIndex] || dmyMatch[2]} ${year}`;
  }

  return str;
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
    const headerRow = rows[0] || [];
    const findCol = (predicate) => headerRow.findIndex(h => predicate(String(h || '').toLowerCase().trim()));

    const npsnCol = findCol(h => h.includes('nspn') || h.includes('npsn')) >= 0 ? findCol(h => h.includes('nspn') || h.includes('npsn')) : 2;
    const kepalaSekolahCol = findCol(h => h.includes('kepala sekolah')) >= 0 ? findCol(h => h.includes('kepala sekolah')) : 5;
    const hpKepalaSekolahCol = 6;
    const perencanaNamaCol = findCol(h => h.includes('perencana nama')) >= 0 ? findCol(h => h.includes('perencana nama')) : 7;
    const perencanaHpCol = 8;
    const pengawasNamaCol = findCol(h => h.includes('pengawas nama')) >= 0 ? findCol(h => h.includes('pengawas nama')) : 9;
    const pengawasHpCol = 10;
    const dinasNamaCol = findCol(h => h.includes('dinas pendidikan')) >= 0 ? findCol(h => h.includes('dinas pendidikan')) : 11;
    const dinasHpCol = 12;

    const pksCol = findCol(h => h.includes('tanggal pks')) >= 0 ? findCol(h => h.includes('tanggal pks')) : 13;
    const danaTahap1Col = findCol(h => h.includes('tanggal dana tahap 1')) >= 0 ? findCol(h => h.includes('tanggal dana tahap 1')) : 14;
    const mc0Col = findCol(h => (h.includes('tanggal') && h.includes('mc')) || h.includes('mc0')) >= 0 ? findCol(h => (h.includes('tanggal') && h.includes('mc')) || h.includes('mc0')) : 15;
    const kelengkapanMc0Col = findCol(h => h.includes('kelengkapan') && h.includes('mc0')) >= 0 ? findCol(h => h.includes('kelengkapan') && h.includes('mc0')) : 16;
    const kendalaMc0Col = findCol(h => h.includes('kendala') && h.includes('mc0')) >= 0 ? findCol(h => h.includes('kendala') && h.includes('mc0')) : 17;
    const kendalaPelaksanaanCol = findCol(h => h.includes('kendala') && h.includes('pelaksanaan')) >= 0 ? findCol(h => h.includes('kendala') && h.includes('pelaksanaan')) : 18;

    const m1Col = findCol(h => h.includes('m-1 realisasi') || h.includes('m1 realisasi')) >= 0 ? findCol(h => h.includes('m-1 realisasi') || h.includes('m1 realisasi')) : 19;

    const dataRows = rows.slice(1);

    const schoolUpdates = [];
    const weeklyProgressRecords = [];

    for (const row of dataRows) {
      if (row.length < 3) continue;

      // Extract NPSN 8-digit
      const npsn = String(row[npsnCol] || row[2] || '').trim();
      if (!npsn || npsn.toUpperCase() === 'NSPN' || npsn.toUpperCase() === 'NPSN' || !/^\d{6,10}$/.test(npsn)) continue;

      const kepala_sekolah = row[kepalaSekolahCol] || row[5] || '';
      const hp_kepala_sekolah = row[hpKepalaSekolahCol] || row[6] || '';
      const perencanaNama = row[perencanaNamaCol] || row[7] || '';
      const perencanaHp = row[perencanaHpCol] || row[8] || '';
      const pengawasNama = row[pengawasNamaCol] || row[9] || '';
      const pengawasHp = row[pengawasHpCol] || row[10] || '';
      const dinas_pendidikan_nama = row[dinasNamaCol] || row[11] || '';
      const dinas_pendidikan_hp = row[dinasHpCol] || row[12] || '';

      const rawPks = pksCol >= 0 ? (row[pksCol] || '') : '';
      const rawDanaTahap1 = danaTahap1Col >= 0 ? (row[danaTahap1Col] || '') : '';
      const rawMc0 = mc0Col >= 0 ? (row[mc0Col] || '') : '';

      const tanggal_pks = formatDateGSheet(rawPks);
      const tanggal_dana_tahap1 = formatDateGSheet(rawDanaTahap1);
      const tanggal_mc0 = formatDateGSheet(rawMc0);
      const kelengkapan_mc0 = row[kelengkapanMc0Col] || row[16] || '';
      const kendala_mc0 = row[kendalaMc0Col] || row[17] || '';
      const kendala_pelaksanaan = row[kendalaPelaksanaanCol] || row[18] || '';

      let maxKumulatifForSchool = 0;

      // Parse 24 minggu progres mingguan (dimulai dari m1Col = 19)
      for (let w = 1; w <= 24; w++) {
        const baseCol = m1Col + (w - 1) * 6;
        if (baseCol >= row.length) break;

        const reStr = (row[baseCol] || '').trim();
        const koStr = (row[baseCol + 1] || '').trim();
        const renStr = (row[baseCol + 2] || '').trim();
        const devStr = (row[baseCol + 3] || '').trim();
        const kendala = (row[baseCol + 4] || '').trim();
        const rekomendasi = (row[baseCol + 5] || '').trim();

        const isRealInput = reStr !== '' || renStr !== '' || devStr !== '' || (kendala !== '' && kendala !== '-') || (rekomendasi !== '' && rekomendasi !== '-');
        const hasValue = isRealInput || koStr !== '';

        if (hasValue) {
          const realisasi = parsePct(reStr);
          const kumulatif = parsePct(koStr);
          const rencana = parsePct(renStr);
          const deviasi = devStr !== '' ? parsePct(devStr) : Math.round((kumulatif - rencana) * 100) / 100;

          if (kumulatif > maxKumulatifForSchool) {
            maxKumulatifForSchool = kumulatif;
          }

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
            hasRealInput: isRealInput,
            updatedBy: 'gsheet_sync',
            updatedAt: new Date().toISOString()
          });
        }
      }

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
        kendala_pelaksanaan,
        progres_fisik: maxKumulatifForSchool > 0 ? maxKumulatifForSchool : undefined
      });
    }

    return {
      schoolUpdates,
      weeklyProgressRecords,
      totalSchoolsProcessed: schoolUpdates.length,
      totalWeeklyRecordsProcessed: weeklyProgressRecords.length
    };
  }
};
