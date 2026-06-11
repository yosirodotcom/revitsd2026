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

    const fetchUrl = `${url}?token=${encodeURIComponent(token)}`;
    const response = await fetch(fetchUrl);
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
          deductionAdminFlat: state.settings.deductionAdminFlat || 100000,
          deductionAdminKetuaTim: state.settings.deductionAdminKetuaTim || 100000,
          deductionAdminKoordinator: state.settings.deductionAdminKoordinator || 100000,
          deductionAdminFasilitator: state.settings.deductionAdminFasilitator || 100000,
          deductionAdminAdministrasi: state.settings.deductionAdminAdministrasi || 100000,
          deductionTaxPct: state.settings.deductionTaxPct || 15,
          deductionLembagaPct: state.settings.deductionLembagaPct || 10
        },
        users: state.users,
        schools: state.schools,
        contacts: state.contacts,
        tasks: state.tasks,
        trips: state.trips,
        logs: state.logs,
        reports: state.reports,
        duty_reports: state.dutyReports || [],
        expenses: state.expenses,
        payments: state.payments,
        school_docs: state.schoolDocs || [],
        personnel_docs: state.personnelDocs || [],
        meetings: (state.meetings || []).map(m => ({
          ...m,
          pesertaIds: Array.isArray(m.pesertaIds) ? m.pesertaIds.join(',') : (m.pesertaIds || '')
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
          fileRef_fileData: l.fileRef ? l.fileRef.fileData : ''
        }))
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    
    return data;
  }
};
