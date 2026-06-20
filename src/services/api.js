/**
 * Service untuk sinkronisasi data dengan Google Sheets & Google Drive
 */
export const syncService = {
  getApiConfig() {
    const settings = localStorage.getItem('revit_settings');
    if (settings) {
      const parsed = JSON.parse(settings);
      return {
        url: parsed.googleAppsScriptUrl || '',
        token: parsed.googleAppsScriptToken || 'REVITSD2026_SECURE_TOKEN'
      };
    }
    return { url: '', token: '' };
  },

  isConfigured() {
    const config = this.getApiConfig();
    return !!config.url;
  },

  /**
   * Mengunduh seluruh data tabel dari Google Sheets
   */
  async fetchData() {
    const { url, token } = this.getApiConfig();
    if (!url) throw new Error('API URL belum dikonfigurasi di Pengaturan.');

    const fetchUrl = `${url}?token=${encodeURIComponent(token)}&_t=${Date.now()}`;
    const response = await fetch(fetchUrl, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    
    return data;
  },

  /**
   * Mengirim data lokal ke Google Sheets dan memicu upload file ke Drive
   */
  async pushData(state) {
    const { url, token } = this.getApiConfig();
    if (!url) throw new Error('API URL belum dikonfigurasi di Pengaturan.');

    // Petakan state lokal ke format tabel Google Sheet
    const payload = {
      token: token,
      state: {
        settings: {
          projectStartDate: state.settings.projectStartDate,
          projectEndDate: state.settings.projectEndDate,
          googleAppsScriptUrl: state.settings.googleAppsScriptUrl || '',
          googleAppsScriptToken: state.settings.googleAppsScriptToken || '',
          totalProjectContract: state.settings.totalProjectContract || 1500000000,
          honorKetuaTim: state.settings.honorKetuaTim || 7000000,
          honorKoordinator: state.settings.honorKoordinator || 6000000,
          honorFasilitator: state.settings.honorFasilitator || 5000000,
          honorAdministrasi: state.settings.honorAdministrasi || 5000000,
          deductionTaxPct: state.settings.deductionTaxPct || 15,
          deductionLembagaPct: state.settings.deductionLembagaPct || 10,
          biayaOperasional: state.settings.biayaOperasional || 0,
          danaTahap1Diterima: state.settings.danaTahap1Diterima || false,
          danaTahap2Diterima: state.settings.danaTahap2Diterima || false,
          danaTahap3Diterima: state.settings.danaTahap3Diterima || false,
          simulatedToday: state.settings.simulatedToday || ''
        },
        users: state.users,
        schools: (state.schools || []).map(s => ({
          ...s,
          nama: s.nama_sekolah || s.nama || '',
          kepalaSekolah: s.kepala_sekolah || s.kepalaSekolah || ''
        })),
        contacts: state.contacts,
        tasks: (state.tasks || []).map(t => ({
          ...t,
          sekolahId: t.sekolahId || t.schoolId || '',
          schoolId: t.sekolahId || t.schoolId || ''
        })),
        trips: (state.trips || []).map(t => ({
          ...t,
          schoolId: t.sekolahId || t.schoolId || '',
          date: t.tanggalMulai || t.date || '',
          duration: t.durasiHari || t.duration || 1,
          status: t.statusPersetujuan === 'approved' ? 'completed' : 'planned'
        })),
        logs: (state.logs || []).map(l => ({
          ...l,
          // Strip Base64 foto jika sudah berupa URL Drive (mengurangi ukuran payload)
          foto: (l.foto && l.foto.startsWith('http')) ? l.foto : (l.foto || '')
        })),
        reports: (state.reports || []).map(r => ({
          ...r,
          // Strip Base64 fileData jika sudah berupa URL Drive
          fileData: (r.fileData && r.fileData.startsWith('http')) ? r.fileData : (r.fileData || '')
        })),
        duty_reports: state.dutyReports || [],
        expenses: state.expenses,
        payments: state.payments,
        school_docs: (state.schoolDocs || []).map(d => ({
          ...d,
          fileData: (d.fileData && d.fileData.startsWith('http')) ? d.fileData : (d.fileData || '')
        })),
        personnel_docs: (state.personnelDocs || []).map(d => ({
          ...d,
          fileData: (d.fileData && d.fileData.startsWith('http')) ? d.fileData : (d.fileData || '')
        })),
        meeting_docs: (state.meetingDocs || []).map(d => ({
          ...d,
          fileData: (d.fileData && d.fileData.startsWith('http')) ? d.fileData : (d.fileData || '')
        })),
        trip_docs: (state.tripDocs || []).map(d => ({
          ...d,
          fileData: (d.fileData && d.fileData.startsWith('http')) ? d.fileData : (d.fileData || '')
        })),
        meetings: (state.meetings || []).map(m => ({
          ...m,
          pesertaIds: Array.isArray(m.pesertaIds) ? m.pesertaIds.join(',') : (m.pesertaIds || ''),
          // Strip Base64 fotoKegiatan jika sudah berupa URL Drive
          fotoKegiatan: (m.fotoKegiatan && m.fotoKegiatan.startsWith('http')) ? m.fotoKegiatan : (m.fotoKegiatan || '')
        })),
        activity_logs: (state.activityLogs || []).map(l => ({
          id: l.id,
          userId: l.userId,
          timestamp: l.timestamp,
          actionType: l.actionType,
          description: l.description,
          fileRef_id: l.fileRef ? l.fileRef.id : '',
          fileRef_type: l.fileRef ? l.fileRef.type : '',
          fileRef_fileName: l.fileRef ? l.fileRef.fileName : '',
          fileRef_fileData: (l.fileRef && l.fileRef.fileData && l.fileRef.fileData.startsWith('http'))
            ? l.fileRef.fileData : (l.fileRef ? (l.fileRef.fileData || '') : '')
        }))
      }
    };

    const bodyStr = JSON.stringify(payload);
    const payloadSizeMB = (bodyStr.length / (1024 * 1024)).toFixed(2);
    console.log(`[Sync] Mengirim data ke Google Sheets... (ukuran payload: ${payloadSizeMB} MB)`);

    // Google Apps Script Web App menggunakan redirect (302) untuk POST.
    const response = await fetch(url, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: bodyStr
    });

    // Cek apakah response valid
    const responseText = await response.text();
    console.log(`[Sync] Response status: ${response.status}, ukuran: ${responseText.length} chars`);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseErr) {
      console.error('[Sync] Gagal parse JSON response:', responseText.substring(0, 500));
      throw new Error(`Response bukan JSON valid. Status: ${response.status}. Periksa deploy Google Apps Script Anda (pastikan sudah deploy versi terbaru).`);
    }

    if (data.error) {
      console.error('[Sync] Error dari server:', data.error);
      throw new Error(data.error);
    }

    console.log('[Sync] Sinkronisasi berhasil:', data.message);
    return data;
  }
};
