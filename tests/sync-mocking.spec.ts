import { test, expect } from '@playwright/test';

test.describe('Google Sheets Synchronization & Mocking', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    await page.goto('/');
  });

  test('Sinkronisasi Sukses - Mencegat & Menguji Pengiriman State Lokal', async ({ page }) => {
    const targetUrl = 'https://script.google.com/macros/s/AKfycbz_mock_id/exec';
    
    // Mencegat request POST ke mock URL google apps script
    let hasSentPayload = false;
    let payloadData: any = null;

    await page.route(targetUrl, async (route) => {
      if (route.request().method() === 'POST') {
        hasSentPayload = true;
        payloadData = JSON.parse(route.request().postData() || '{}');
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Data successfully synchronized!' })
        });
      } else {
        await route.continue();
      }
    });

    // 1. Login sebagai Super Admin Yosi Ronadi
    await page.locator('text=Yosi Ronadi').click();
    await page.fill('input[placeholder="Password"]', '4051');
    await page.click('button:has-text("Masuk")');

    // 2. Isi URL Google Apps Script di Konfigurasi Linimasa Global (Right Sidebar)
    await page.fill('input[placeholder="https://script.google.com/macros/s/.../exec"]', targetUrl);
    await page.fill('input[placeholder="REVITSD2026_SECURE_TOKEN"]', 'TEST_TOKEN_123');

    // Mencegat dialog alert sukses simpan konfigurasi
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Konfigurasi linimasa global berhasil disimpan!');
      await dialog.accept();
    });

    // Klik Simpan Konfigurasi untuk memicu pembaruan setings & sinkronisasi awal
    await page.click('button:has-text("Simpan Konfigurasi")');

    // Verifikasi bahwa request POST terkirim ke targetUrl
    await expect.poll(() => hasSentPayload).toBe(true);

    // Verifikasi payload yang dikirim mengandung data token & state penting
    expect(payloadData.token).toBe('TEST_TOKEN_123');
    expect(payloadData.state).toBeDefined();
    expect(payloadData.state.users).toBeDefined();
    expect(payloadData.state.settings).toBeDefined();
  });

  test('Sinkronisasi Gagal - Menangani Gangguan Server HTTP 500', async ({ page }) => {
    const targetUrl = 'https://script.google.com/macros/s/AKfycbz_mock_id/exec';

    // Mencegat request POST dan paksa kembalikan error HTTP 500
    await page.route(targetUrl, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error: Google Sheets Quota Exceeded' })
      });
    });

    // Login sebagai Super Admin Yosi Ronadi
    await page.locator('text=Yosi Ronadi').click();
    await page.fill('input[placeholder="Password"]', '4051');
    await page.click('button:has-text("Masuk")');

    // Mencegat dialog simpan sukses
    page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Isi URL Google Apps Script dan Simpan
    await page.fill('input[placeholder="https://script.google.com/macros/s/.../exec"]', targetUrl);
    await page.click('button:has-text("Simpan Konfigurasi")');

    // Pastikan di state/localStorage, flag 'revit_is_dirty' bernilai true (karena gagal push, data harus tetap kotor)
    const isDirty = await page.evaluate(() => window.localStorage.getItem('revit_is_dirty'));
    expect(isDirty).toBe('true');
  });

});
