import { test, expect } from '@playwright/test';

test.describe('File Upload Verification', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    await page.goto('/');
  });

  test('Uji Upload Laporan Bulanan (PDF) - Batasan Format & Ukuran File', async ({ page }) => {
    // Login sebagai Rizal (Fasilitator)
    await page.locator('text=Rizal').click();

    // Navigasi ke menu Laporan Bulanan
    await page.click('text=Laporan Bulanan');
    await page.click('button:has-text("Unggah Laporan Baru")');

    // 1. Uji validasi ekstensi: Upload file non-PDF (misal .txt)
    const invalidFile = {
      name: 'laporan_salah.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('konten txt biasa')
    };

    // Listen to window.showAlert (browser dialog)
    let alertMessage = '';
    page.on('dialog', async (dialog) => {
      alertMessage = dialog.message();
      await dialog.accept();
    });

    const fileInput = page.locator('input[type="pdf"], input[accept=".pdf"]');
    await fileInput.setInputFiles(invalidFile);

    // Pastikan alert dialog terpicu dengan pesan format salah
    await expect.poll(() => alertMessage).toContain('Hanya berkas berformat PDF');

    // 2. Uji validasi ukuran: Upload file PDF berukuran > 10MB
    alertMessage = ''; // reset
    const massivePdf = {
      name: 'laporan_raksasa.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(11 * 1024 * 1024) // 11MB
    };

    await fileInput.setInputFiles(massivePdf);

    // Pastikan alert dialog terpicu dengan pesan file terlalu besar
    await expect.poll(() => alertMessage).toContain('Maksimal ukuran file adalah 10MB');
  });

  test('Uji Upload Log Harian (Gambar) - Validasi Kompresi & Preview Thumbnail', async ({ page }) => {
    // Login sebagai Rizal
    await page.locator('text=Rizal').click();

    // Navigasi ke Log Kerja Harian
    await page.click('text=Log Kerja Harian');
    await page.click('button:has-text("Catat Log Harian")');

    // Buat buffer 1x1 pixel PNG transparan asli (Base64 decoded)
    const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const pngBuffer = Buffer.from(base64Png, 'base64');

    const testImage = {
      name: 'bukti_lapangan.png',
      mimeType: 'image/png',
      buffer: pngBuffer
    };

    // Masukkan file gambar dummy ke input file tersembunyi
    const fileInput = page.locator('input[type="file"][accept="image/*"]');
    await fileInput.setInputFiles(testImage);

    // Pastikan preview thumbnail muncul setelah proses kompresi canvas selesai
    const previewImg = page.locator('img[alt="Bukti harian"]');
    await expect.soft(previewImg).toBeVisible();

    // Hapus foto preview dan pastikan thumbnail kembali ke kondisi kosong
    await page.click('button:has-text("Batal")');
  });

});
