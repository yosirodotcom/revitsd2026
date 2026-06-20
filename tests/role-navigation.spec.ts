import { test, expect } from '@playwright/test';

test.describe('Role Navigation and Session Management', () => {

  test.beforeEach(async ({ page }) => {
    // Bersihkan localStorage sebelum setiap tes agar state kembali default
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    await page.goto('/');
  });

  test('Fasilitator (Rizal) - Akses Langsung Tanpa Password & Verifikasi Sidebar', async ({ page }) => {
    // Klik kartu profil Rizal
    await page.locator('text=Rizal').click();

    // Verifikasi menu khusus Fasilitator muncul
    await expect(page.locator('text=Semua Sekolah')).toBeVisible();
    await expect(page.locator('text=Log Harian')).toBeVisible();
    await expect(page.locator('text=Laporan Bulanan')).toBeVisible();

    // Verifikasi menu terlarang (Super Admin / Keuangan) tidak muncul
    await expect(page.locator('text=Kelola Tim')).not.toBeVisible();
    await expect(page.locator('text=Payroll & Keuangan')).not.toBeVisible();
  });

  test('Super Admin (Yosi Ronadi) - Login Dengan Password & Verifikasi Sidebar', async ({ page }) => {
    // Klik kartu profil Yosi Ronadi
    await page.locator('text=Yosi Ronadi').click();

    // Pastikan modal input password muncul
    await expect(page.locator('text=Masukkan Password')).toBeVisible();

    // Isi password yang salah dan submit
    await page.fill('input[placeholder="Password"]', 'salah_password');
    await page.click('button:has-text("Masuk")');

    // Verifikasi pesan kesalahan muncul
    await expect(page.locator('text=Password salah!')).toBeVisible();

    // Isi password yang benar ("4051")
    await page.fill('input[placeholder="Password"]', '4051');
    await page.click('button:has-text("Masuk")');

    // Verifikasi masuk ke dashboard
    await expect(page.locator('text=Kelola Tim')).toBeVisible();
    await expect(page.locator('text=Pengaturan & Linimasa')).toBeVisible();
  });

  test('Alur Log Out - Kembali ke Halaman Pilih Akun', async ({ page }) => {
    // Login sebagai Rizal
    await page.locator('text=Rizal').click();
    await expect(page.locator('text=Semua Sekolah')).toBeVisible();

    // Klik tombol Keluar Sesi di sidebar
    await page.click('text=Keluar Sesi');

    // Verifikasi aplikasi kembali ke halaman Pilih Akun
    await expect(page.locator('text=Pilih Akun')).toBeVisible();
  });

});
