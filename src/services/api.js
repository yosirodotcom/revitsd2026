/**
 * Service untuk sinkronisasi data dengan Google Sheets & Google Drive
 */
export const syncService = {
  getApiConfig() {
    const prefix = localStorage.getItem('active_program_prefix') || 'revit';
    const settings = localStorage.getItem(`${prefix}_settings`);
    if (settings) {
      const parsed = JSON.parse(settings);
      return {
        url: parsed.googleAppsScriptUrl || '',
        token: parsed.googleAppsScriptToken || (prefix === 'revitpaud' ? 'REVITPAUD2026_SECURE_TOKEN' : 'REVITSD2026_SECURE_TOKEN')
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
  async pushData(state, dirtyTables = {}) {
    const { url, token } = this.getApiConfig();
    if (!url) throw new Error('API URL belum dikonfigurasi di Pengaturan.');

    // Petakan state lokal ke format tabel Google Sheet jika ditandai kotor (atau jika tidak ada tracking kotor)
    const payload = {
      token: token,
      dirtyTables: dirtyTables,
      state: {
        settings: (dirtyTables && dirtyTables.settings === false) ? null : (() => {
          const prefix = localStorage.getItem('active_program_prefix') || 'revit';
          const isPaud = prefix === 'revitpaud';
          const fallbackContract = isPaud ? 800000000 : 1500000000;
          const fallbackHonorKetuaTim = isPaud ? 6000000 : 7000000;
          const fallbackHonorKoordinator = isPaud ? 5000000 : 6000000;
          const fallbackHonorFasilitator = isPaud ? 4000000 : 5000000;
          const fallbackHonorAdministrasi = isPaud ? 4000000 : 5000000;
          const fallbackTax = isPaud ? 10 : 15;
          const fallbackLembaga = isPaud ? 5 : 10;

          const hasVal = (val) => val !== undefined && val !== null && val !== '';

          return {
            projectStartDate: state.settings.projectStartDate,
            projectEndDate: state.settings.projectEndDate,
            googleAppsScriptUrl: state.settings.googleAppsScriptUrl || '',
            googleAppsScriptToken: state.settings.googleAppsScriptToken || '',
            totalProjectContract: hasVal(state.settings.totalProjectContract) ? state.settings.totalProjectContract : fallbackContract,
            honorKetuaTim: hasVal(state.settings.honorKetuaTim) ? state.settings.honorKetuaTim : fallbackHonorKetuaTim,
            honorKoordinator: hasVal(state.settings.honorKoordinator) ? state.settings.honorKoordinator : fallbackHonorKoordinator,
            honorFasilitator: hasVal(state.settings.honorFasilitator) ? state.settings.honorFasilitator : fallbackHonorFasilitator,
            honorAdministrasi: hasVal(state.settings.honorAdministrasi) ? state.settings.honorAdministrasi : fallbackHonorAdministrasi,
            deductionTaxPct: hasVal(state.settings.deductionTaxPct) ? state.settings.deductionTaxPct : fallbackTax,
            deductionLembagaPct: hasVal(state.settings.deductionLembagaPct) ? state.settings.deductionLembagaPct : fallbackLembaga,
            biayaOperasional: hasVal(state.settings.biayaOperasional) ? state.settings.biayaOperasional : 0,
            danaTahap1Diterima: state.settings.danaTahap1Diterima || false,
            danaTahap2Diterima: state.settings.danaTahap2Diterima || false,
            danaTahap3Diterima: state.settings.danaTahap3Diterima || false,
            simulatedToday: ''
          };
        })(),
        users: (dirtyTables && dirtyTables.users === false) ? null : state.users,
        schools: (dirtyTables && dirtyTables.schools === false) ? null : (state.schools || []).map(s => ({
          ...s,
          nama: s.nama_sekolah || s.nama || '',
          kepalaSekolah: s.kepala_sekolah || s.kepalaSekolah || '',
          alamat: s.alamat || '',
          // Strip Base64 foto_banner jika sudah berupa URL Drive (mengurangi ukuran payload)
          foto_banner: (s.foto_banner && s.foto_banner.startsWith('http')) ? s.foto_banner : (s.foto_banner || '')
        })),
        contacts: (dirtyTables && dirtyTables.contacts === false) ? null : state.contacts,
        tasks: (dirtyTables && dirtyTables.tasks === false) ? null : (state.tasks || []).map(t => ({
          ...t,
          sekolahId: t.sekolahId || t.schoolId || '',
          schoolId: t.sekolahId || t.schoolId || ''
        })),
        trips: (dirtyTables && dirtyTables.trips === false) ? null : (state.trips || []).map(t => ({
          ...t,
          schoolId: t.sekolahId || t.schoolId || '',
          date: t.tanggalMulai || t.date || '',
          duration: t.durasiHari || t.duration || 1,
          status: (() => {
            if (t.isPaid || t.status === 'paid') return 'paid';
            if (t.statusPersetujuan === 'approved') {
              const todayStr = new Date().toISOString().split('T')[0];
              const today = new Date(todayStr);
              const end = new Date(t.tanggalSelesai || t.tanggalMulai || t.date);
              if (today >= end) {
                return 'completed';
              }
            }
            return 'planned';
          })()
        })),
        logs: (dirtyTables && dirtyTables.logs === false) ? null : (state.logs || []).map(l => ({
          ...l,
          // Strip Base64 foto jika sudah berupa URL Drive (mengurangi ukuran payload)
          foto: (l.foto && l.foto.startsWith('http')) ? l.foto : (l.foto || '')
        })),
        reports: (dirtyTables && dirtyTables.reports === false) ? null : (state.reports || []).map(r => ({
          ...r,
          // Strip Base64 fileData jika sudah berupa URL Drive
          fileData: (r.fileData && r.fileData.startsWith('http')) ? r.fileData : (r.fileData || '')
        })),
        duty_reports: (dirtyTables && dirtyTables.duty_reports === false) ? null : (state.dutyReports || []),
        expenses: (dirtyTables && dirtyTables.expenses === false) ? null : state.expenses,
        payments: (dirtyTables && dirtyTables.payments === false) ? null : state.payments,
        school_docs: (dirtyTables && dirtyTables.school_docs === false) ? null : (state.schoolDocs || []).map(d => ({
          ...d,
          fileData: (d.fileData && d.fileData.startsWith('http')) ? d.fileData : (d.fileData || '')
        })),
        personnel_docs: (dirtyTables && dirtyTables.personnel_docs === false) ? null : (state.personnelDocs || []).map(d => ({
          ...d,
          fileData: (d.fileData && d.fileData.startsWith('http')) ? d.fileData : (d.fileData || '')
        })),
        meeting_docs: (dirtyTables && dirtyTables.meeting_docs === false) ? null : (state.meetingDocs || []).map(d => ({
          ...d,
          fileData: (d.fileData && d.fileData.startsWith('http')) ? d.fileData : (d.fileData || '')
        })),
        trip_docs: (dirtyTables && dirtyTables.trip_docs === false) ? null : (state.tripDocs || []).map(d => ({
          ...d,
          fileData: (d.fileData && d.fileData.startsWith('http')) ? d.fileData : (d.fileData || '')
        })),
        meetings: (dirtyTables && dirtyTables.meetings === false) ? null : (state.meetings || []).map(m => ({
          ...m,
          pesertaIds: Array.isArray(m.pesertaIds) ? m.pesertaIds.join(',') : (m.pesertaIds || ''),
          // Strip Base64 fotoKegiatan jika sudah berupa URL Drive
          fotoKegiatan: (m.fotoKegiatan && m.fotoKegiatan.startsWith('http')) ? m.fotoKegiatan : (m.fotoKegiatan || '')
        })),
        activity_logs: (dirtyTables && dirtyTables.activity_logs === false) ? null : (state.activityLogs || []).map(l => ({
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
        })),
        kendala: (dirtyTables && dirtyTables.kendala === false) ? null : (state.kendala || []),
        kendala_comments: (dirtyTables && dirtyTables.kendala_comments === false) ? null : (state.kendalaComments || []),
        kendala_docs: (dirtyTables && dirtyTables.kendala_docs === false) ? null : (state.kendalaDocs || []).map(d => ({
          ...d,
          fileData: (d.fileData && d.fileData.startsWith('http')) ? d.fileData : (d.fileData || '')
        })),
        warnings: (dirtyTables && dirtyTables.warnings === false) ? null : (state.warnings || []).map(w => ({
          ...w,
          dismissed: w.dismissed ? 'true' : 'false'
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
