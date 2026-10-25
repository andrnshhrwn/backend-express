PANDUAN SETUP BACKEND — PAM TIRTA KAMUNING
============================================

Dokumen ini berisi panduan untuk menyiapkan dan menjalankan backend di komputer baru.
Stack proyek: Node.js, Express.js, TypeScript, Prisma ORM 7, MySQL, dan Laragon.

PENTING
-------
- Jalankan perintah dari folder root proyek (folder yang memiliki package.json).
- Sesuaikan nama file .env dan nama script dengan konfigurasi repository aktual.
- Jangan membagikan file .env, password database, JWT secret, atau token ke Git/public.
- Panduan ini memakai Windows PowerShell untuk contoh perintah.
- Jika perintah proyek berbeda, cek bagian "Memeriksa scripts yang tersedia".

1. PERANGKAT LUNAK YANG DIPERLUKAN
----------------------------------
Install:
1. Node.js versi LTS yang kompatibel dengan proyek.
2. Git.
3. Laragon atau MySQL Server.
4. Editor kode, misalnya Visual Studio Code.
5. Postman (opsional, untuk menguji API).

Cek instalasi Node.js dan npm:
    node -v
    npm -v

Cek Git:
    git --version

Pastikan MySQL dari Laragon berjalan sebelum menjalankan migrasi.

2. MENGAMBIL SOURCE CODE
------------------------
Jika menggunakan Git:
    git clone <URL_REPOSITORY>
    cd <NAMA_FOLDER_PROYEK>

Jika source code diberikan sebagai ZIP:
1. Ekstrak ZIP.
2. Buka terminal di folder root proyek.
3. Pastikan file package.json ada di folder tersebut.

3. INSTALL DEPENDENCIES
-----------------------
Gunakan package lock yang disimpan di repository jika tersedia:
    npm ci

Jika repository tidak memiliki package-lock.json:
    npm install

Jangan menjalankan npm install secara sembarangan untuk memperbarui versi paket pada proyek bersama.
Jika npm ci gagal, baca pesan error terlebih dahulu.

4. MENYIAPKAN DATABASE MYSQL
----------------------------
1. Buka Laragon.
2. Start MySQL.
3. Buka HeidiSQL/phpMyAdmin atau klien database lain.
4. Buat database kosong sesuai nama yang dipakai di konfigurasi proyek.

Contoh SQL (ganti nama database jika berbeda):
    CREATE DATABASE pam_tirta_kamuning
      CHARACTER SET utf8mb4
      COLLATE utf8mb4_unicode_ci;

Jangan menjalankan CREATE DATABASE jika database dengan nama tersebut sudah ada.
Pastikan username dan password MySQL sesuai konfigurasi lokal.

5. MENYIAPKAN FILE ENVIRONMENT
------------------------------
1. Cari file contoh seperti .env.example atau dokumentasi konfigurasi.
2. Salin file contoh menjadi .env:
   PowerShell:
       Copy-Item .env.example .env

   Jika file contoh tidak tersedia, buat .env berdasarkan variabel yang dibaca
   oleh src/config/env.ts. Jangan menebak nama variabel; cek file tersebut.

3. Isi konfigurasi sesuai nama variabel yang benar-benar digunakan proyek.
   Konfigurasi yang umumnya diperlukan:
   - Port aplikasi
   - API prefix
   - Host MySQL
   - Port MySQL
   - Username dan password MySQL
   - Nama database
   - JWT secret
   - Masa berlaku token (jika digunakan)

CATATAN PRISMA 7:
- Proyek menggunakan Prisma ORM 7.
- Konfigurasi koneksi dapat dikelola di konfigurasi aplikasi/adapter, bukan selalu
  hanya melalui datasource URL pada schema.prisma.
- Periksa prisma.config.ts, src/config/env.ts, dan src/lib/prisma.ts untuk mengetahui
  sumber konfigurasi koneksi yang benar.
- Adapter yang digunakan proyek ini adalah @prisma/adapter-mariadb.
- Jangan menyalin contoh DATABASE_URL generik sebelum memastikan proyek membacanya.

6. MEMERIKSA SCRIPTS NPM
------------------------
Lihat bagian "scripts" pada package.json:
    Get-Content package.json

Atau tampilkan script yang tersedia:
    npm run

Gunakan script yang sudah didefinisikan di package.json. Nama script dev/build/start
dapat berbeda pada setiap proyek.

7. GENERATE PRISMA CLIENT
-------------------------
Setelah dependencies terpasang dan konfigurasi Prisma tersedia, jalankan:
    npx prisma generate

Generator proyek menghasilkan client ke:
    src/generated/prisma

Jika generate gagal:
1. Baca error lengkapnya.
2. Pastikan schema.prisma dan prisma.config.ts benar.
3. Pastikan versi Prisma CLI dan package Prisma sesuai dengan package.json.
4. Jangan menghapus folder generated secara manual kecuali memang diperlukan.

8. MIGRASI DATABASE
-------------------
Periksa folder prisma/migrations terlebih dahulu. Migrasi harus berasal dari
repository agar struktur database konsisten dengan tim.

Untuk membuat/menerapkan migrasi development yang baru:
    npx prisma migrate dev --name nama_perubahan

Gunakan perintah tersebut hanya ketika memang membuat perubahan schema baru
di lingkungan development.

Untuk menerapkan migrasi yang sudah tersimpan di repository pada database baru:
    npx prisma migrate deploy

Setelah migrasi:
    npx prisma generate

Catatan:
- Jangan memakai migrate reset pada database yang berisi data penting karena dapat
  menghapus data.
- Jangan mengedit migration yang sudah diterapkan bersama tanpa koordinasi tim.
- Jangan menggunakan db push sebagai pengganti migration workflow tim kecuali
  memang sudah disepakati.
- Jika proyek menggunakan konfigurasi khusus Prisma 7, pastikan perintah Prisma
  membaca prisma.config.ts dan environment yang benar.
- Jika database lama sudah berisi tabel tetapi migration history tidak cocok,
  hentikan proses dan koordinasikan sebelum menjalankan reset atau baseline.

9. VALIDASI SCHEMA DAN TYPESCRIPT
---------------------------------
Jalankan pemeriksaan berikut:
    npx prisma validate
    npx prisma generate
    npx tsc --noEmit

Jika proyek memiliki script pemeriksaan sendiri, gunakan juga:
    npm run

Selesaikan error sebelum menjalankan aplikasi atau mengirim perubahan ke tim.

10. MENJALANKAN BACKEND
-----------------------
Lihat scripts yang tersedia:
    npm run

Jika package.json mendefinisikan script dev, jalankan:
    npm run dev

Jika script dev tidak ada, gunakan nama script yang tersedia di package.json.
Jangan mengasumsikan npm start atau npm run dev pasti terkonfigurasi.

Base URL lokal yang digunakan selama pengembangan:
    http://localhost:8000/api/v1

URL ini berlaku jika PORT dan API_PREFIX pada environment memang menggunakan
nilai tersebut.

11. MENGUJI API DENGAN POSTMAN
------------------------------
1. Pastikan server berjalan.
2. Import collection Postman jika repository menyediakannya.
3. Login menggunakan endpoint login yang benar dari route proyek.
4. Salin token dari response login.
5. Pada request yang memerlukan autentikasi, pilih:
   Authorization > Bearer Token
6. Uji endpoint berdasarkan API Specification proyek.

Urutan pengujian alur bisnis yang disarankan:
1. Login.
2. Ambil data master (unit, tipe tarif, merk WM, pelanggan, user).
3. Buat SPK/penugasan menggunakan role admin yang berhak.
4. Login sebagai teknisi yang ditugaskan.
5. Buat BAP untuk SPK tersebut.
6. Login sebagai admin pusat dan uji validasi/penolakan sesuai endpoint yang
   benar-benar tersedia.
7. Periksa status SPK, status BAP, dan nomor seri WM aktif pelanggan.

Gunakan ID yang dikembalikan API, bukan ID contoh yang belum tentu ada.

12. ROLE DAN ALUR BISNIS
------------------------
Role aplikasi:
- admin_pusat
- admin_cabang
- teknisi

Aturan bisnis yang diketahui:
- SPK/penugasan dibuat untuk pelanggan dan teknisi tertentu.
- Satu pelanggan hanya boleh memiliki satu SPK aktif pada satu waktu.
- Status SPK aktif: pending dan proses.
- Status SPK akhir: selesai atau dibatalkan.
- BAP harus terkait dengan SPK yang valid.
- BAP baru tidak boleh dibuat jika SPK sudah selesai/dibatalkan.
- Maksimal satu BAP berstatus menunggu untuk SPK yang sama.
- Jika sudah ada BAP disetujui, pengajuan BAP baru untuk SPK tersebut ditolak.
- Jika BAP ditolak, teknisi dapat mengajukan BAP baru untuk SPK yang sama sesuai
  aturan service.
- Persetujuan BAP seharusnya memperbarui nomor seri WM aktif pelanggan dan
  menyelesaikan SPK secara konsisten/transaksional.

Pastikan aturan ini tetap sesuai dengan implementasi backend terbaru.

13. STRUKTUR FOLDER PENTING
---------------------------
- src/config/env.ts              konfigurasi environment
- src/lib/prisma.ts              inisialisasi Prisma client/adapter
- src/middlewares/               autentikasi, otorisasi, validasi
- src/modules/                   routes, controllers, services, repositories
- src/shared/errors/app-error.ts error aplikasi
- src/shared/http/response.ts    helper response HTTP
- prisma/schema.prisma           schema database
- prisma/migrations/             riwayat migrasi
- src/generated/prisma/          Prisma Client hasil generate

Struktur dapat berubah; gunakan struktur terbaru di repository.

14. WORKFLOW GIT UNTUK KERJA TIM
-------------------------------
Sebelum mulai bekerja:
    git pull

Buat branch fitur:
    git checkout -b feat/nama-fitur

Setelah perubahan:
    npx prisma validate
    npx tsc --noEmit
    git status
    git add .
    git commit -m "feat: deskripsi perubahan"
    git push -u origin feat/nama-fitur

Jangan commit:
- .env
- token atau secret
- node_modules/
- file log lokal
- file hasil build atau file generated yang dikecualikan oleh aturan repository

Periksa .gitignore sebelum commit. Ikuti kebijakan tim mengenai generated Prisma Client.

Jika perubahan menyentuh schema:
1. Buat migration dengan nama yang jelas.
2. Commit schema dan folder migration bersama-sama.
3. Beri tahu anggota tim bahwa migration baru perlu diterapkan.
4. Jangan membuat migration berbeda untuk perubahan schema yang sama tanpa koordinasi.

15. TROUBLESHOOTING SINGKAT
---------------------------
A. Database connection refused
- Pastikan MySQL/Laragon sudah berjalan.
- Periksa host dan port.
- Periksa username, password, dan nama database di environment/config.

B. Prisma Client belum ditemukan atau tipe Prisma error
    npx prisma generate

C. Migration gagal
- Baca pesan error.
- Periksa konfigurasi database dan status migration.
- Jangan langsung menjalankan migrate reset pada database penting.

D. Port sudah digunakan
- Periksa proses yang menggunakan port atau ubah PORT melalui konfigurasi yang
  didukung proyek.

E. Token selalu 401
- Login ulang.
- Pastikan header Authorization menggunakan format:
  Authorization: Bearer <TOKEN>
- Periksa JWT secret dan masa berlaku token pada environment.

F. Request mendapat 403
- Periksa role akun dan authorize middleware.
- Periksa pembatasan akses berdasarkan unit atau teknisi.

G. Request mendapat 422
- Periksa detail field pada response VALIDATION_FAILED.
- Cocokkan payload dengan schema Zod endpoint tersebut.

16. CHECKLIST KOMPUTER BARU
---------------------------
[ ] Node.js dan Git terpasang.
[ ] Repository sudah di-clone/diekstrak.
[ ] npm ci berhasil.
[ ] MySQL/Laragon berjalan.
[ ] Database kosong sudah dibuat.
[ ] File .env lokal sudah diisi dengan benar.
[ ] Prisma Client berhasil di-generate.
[ ] Migration repository berhasil diterapkan.
[ ] npx prisma validate berhasil.
[ ] npx tsc --noEmit berhasil.
[ ] Backend berhasil dijalankan.
[ ] Login dan endpoint dasar berhasil diuji lewat Postman.

17. SEBELUM DOKUMEN INI DIJADIKAN PANDUAN FINAL
------------------------------------------------
Pemilik repository perlu memastikan dan mengisi informasi berikut dari kode aktual:
- URL repository Git.
- Versi Node.js yang disarankan (.nvmrc atau engines di package.json jika ada).
- Nama database lokal yang disepakati.
- Nama variabel environment yang persis sesuai src/config/env.ts dan prisma.config.ts.
- Nama script npm yang benar.
- Endpoint login yang benar.
- Endpoint validasi/penolakan BAP yang benar.
- Apakah migration deploy berjalan mulus pada database kosong.
- Apakah .env.example sudah tersedia dan tidak mengandung secret.

Dokumen ini sengaja tidak mengarang nilai konfigurasi atau endpoint yang belum
diverifikasi. Perbarui panduan ini jika perintah, schema, atau struktur proyek berubah.
