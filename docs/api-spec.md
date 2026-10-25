# API Specification — Backend PAM Tirta Kamuning

**Versi dokumen:** 0.1 (draft untuk integrasi UI)  
**Base URL lokal:** `http://localhost:8000/api/v1`  
**Stack:** Express.js, TypeScript, Prisma, MySQL  
**Status:** Disusun dari progres implementasi dan pengujian yang dilaporkan. Endpoint yang belum terkonfirmasi dari definisi route aktual diberi tanda **Perlu verifikasi**.

---

## 1. Tujuan dan cakupan

Dokumen ini menjadi acuan awal untuk menghubungkan UI dengan backend penggantian water meter (WM). Cakupan modul:

- Autentikasi dan otorisasi
- Unit
- Users
- Merk WM
- Tipe Tarif
- Pelanggan, termasuk import Excel
- Pengiriman WM
- Penugasan / Surat Perintah Kerja (SPK)
- Penggantian WM / Berita Acara Pekerjaan (BAP)

> **Catatan penting:** Ini belum merupakan kontrak OpenAPI yang diverifikasi terhadap seluruh file route dan schema Zod. Sebelum dianggap final, cocokkan setiap path, nama field, query, kode status, dan bentuk respons dengan implementasi aktual.

## 2. Konvensi umum

### 2.1 Base URL

```text
http://localhost:8000/api/v1
```

### 2.2 Header

Untuk endpoint terlindungi, kirim token JWT:

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

Untuk upload Excel, gunakan `multipart/form-data` dan field file bernama `file`; jangan mengatur `Content-Type` secara manual agar boundary dibuat oleh HTTP client.

### 2.3 Format respons sukses

Helper respons proyek menggunakan bentuk umum berikut. Field aktual dapat berbeda menurut controller:

```json
{
  "message": "Operasi berhasil",
  "data": {}
}
```

### 2.4 Format error

Bentuk error umum yang digunakan aplikasi:

```json
{
  "message": "Data tidak valid",
  "code": "VALIDATION_FAILED",
  "errors": [{ "field": "nama_field", "message": "Pesan validasi" }]
}
```

Bentuk persis wrapper error harus dikonfirmasi dari error middleware global.

### 2.5 Kode HTTP yang umum

| Status                      | Makna                                                                         |
| --------------------------- | ----------------------------------------------------------------------------- |
| `200 OK`                    | Permintaan berhasil                                                           |
| `201 Created`               | Data berhasil dibuat                                                          |
| `400 Bad Request`           | Request tidak dapat diproses / aturan request gagal (bergantung implementasi) |
| `401 Unauthorized`          | Token tidak ada, tidak valid, atau kedaluwarsa                                |
| `403 Forbidden`             | Role atau cakupan akses tidak diizinkan                                       |
| `404 Not Found`             | Data tidak ditemukan                                                          |
| `409 Conflict`              | Konflik aturan bisnis, misalnya SPK aktif duplikat                            |
| `422 Unprocessable Entity`  | Validasi input gagal; proyek menggunakan `VALIDATION_FAILED`                  |
| `500 Internal Server Error` | Kesalahan server yang tidak tertangani                                        |

---

## 3. Role dan akses

Role yang digunakan backend:

- `admin_pusat`
- `admin_cabang`
- `teknisi`

Matriks akses bisnis yang diharapkan:

| Modul / aksi                | Admin pusat |                       Admin cabang |                                 Teknisi |
| --------------------------- | ----------: | ---------------------------------: | --------------------------------------: |
| Kelola data master          |          Ya | Sesuai kebijakan route; verifikasi |                                   Tidak |
| Import Excel pelanggan      |          Ya |                              Tidak |                                   Tidak |
| Kelola pengiriman WM        |          Ya | Sesuai kebijakan route; verifikasi |                                   Tidak |
| Membuat / mengelola SPK     |          Ya |                       Unit sendiri |                                   Tidak |
| Melihat SPK yang ditugaskan |          Ya |                       Unit sendiri |           SPK yang ditugaskan kepadanya |
| Membuat BAP                 |       Tidak |                              Tidak | Ya, untuk SPK yang ditugaskan kepadanya |
| Validasi BAP                |          Ya | Sesuai kebijakan route; verifikasi |                                   Tidak |

**Keamanan:** UI tidak boleh dianggap sebagai kontrol keamanan. Backend harus memeriksa role dan cakupan data pada setiap request, termasuk endpoint detail berdasarkan ID. Matriks di atas adalah ekspektasi bisnis dan perlu diverifikasi terhadap middleware/service aktual.

---

## 4. Endpoint autentikasi

Path login, logout, dan refresh token **belum dikonfirmasi dari route aktual**. Ambil path dan nama field langsung dari modul autentikasi sebelum integrasi UI.

Token yang berhasil diperiksa middleware memuat informasi pengguna seperti:

```json
{
  "id_user": 10,
  "role": "admin_pusat",
  "id_unit": null
}
```

Objek di atas menjelaskan klaim identitas yang diharapkan, bukan contoh respons login lengkap.

---

## 5. Data master

Endpoint CRUD berikut tersedia sebagai modul backend dan CRUD-nya dilaporkan sudah diuji. **Path detail dan nama field selain yang tercantum perlu dicocokkan dengan file route/controller aktual.** Pola REST di bawah merupakan panduan integrasi, bukan konfirmasi path final.

| Modul      | Operasi yang tersedia/dilaporkan     | Status path      |
| ---------- | ------------------------------------ | ---------------- |
| Unit       | List, detail, create, update, delete | Perlu verifikasi |
| Users      | List, detail, create, update, delete | Perlu verifikasi |
| Merk WM    | List, detail, create, update, delete | Perlu verifikasi |
| Tipe Tarif | List, detail, create, update, delete | Perlu verifikasi |
| Pelanggan  | List, detail, create, update, delete | Perlu verifikasi |

### 5.1 Field penting dari model

#### Unit

- `id_unit`
- `nama_unit`

#### Users

- `id_user`
- `id_unit` (nullable)
- `fullname`
- `username`
- `role`: `admin_pusat`, `admin_cabang`, `teknisi`
- `password` hanya untuk input pembuatan/perubahan kredensial; **jangan pernah menampilkan hash password dalam respons UI**.

#### Merk WM

- `id_merk`
- `merk_wm`
- `wm_digit`

#### Tipe Tarif

- `id_tarif` (string, maksimal 20 karakter menurut model)
- `nama_tarif`

#### Pelanggan

- `id_pelanggan`
- `id_pelanggan_pdam` (unik)
- `id_unit`
- `nama`
- `alamat`
- `id_tarif`
- `wm_no_seri_aktif` (nullable)

---

## 6. Pelanggan — import Excel

### 6.1 Preview import

`POST /pelanggan/import/preview`

- Akses: `admin_pusat`
- Content type: `multipart/form-data`
- Field file: `file`
- Tujuan: membaca file dan memvalidasi baris tanpa menyimpan data final.

Header Excel yang didukung:

| Kolom               | Wajib | Catatan                                         |
| ------------------- | ----- | ----------------------------------------------- |
| `id_pelanggan_pdam` | Ya    | Nomor pelanggan; duplikat file/database ditolak |
| `id_unit`           | Ya    | Harus merujuk unit yang ada                     |
| `nama`              | Ya    | Nama pelanggan                                  |
| `alamat`            | Ya    | Alamat pelanggan                                |
| `id_tarif`          | Ya    | Harus merujuk tipe tarif yang ada               |
| `wm_no_seri_aktif`  | Tidak | Nomor seri WM aktif                             |

Bentuk respons preview yang persis bergantung implementasi; gunakan data preview yang dikembalikan API untuk membangun tabel konfirmasi.

### 6.2 Konfirmasi import

`POST /pelanggan/import/confirm`

- Akses: `admin_pusat`
- Content type: `application/json`

Contoh bentuk request yang telah digunakan:

```json
{
  "confirm": true,
  "rows": [
    {
      "id_pelanggan_pdam": "PDAM-000123",
      "id_unit": 2,
      "nama": "Contoh Pelanggan",
      "alamat": "Jl. Contoh No. 1",
      "id_tarif": "RUMAH_TANGGA",
      "wm_no_seri_aktif": "WM-OLD-123"
    }
  ]
}
```

- Data divalidasi kembali pada saat konfirmasi.
- Proses dilaporkan menggunakan transaksi dan bersifat all-or-none.
- Jika ada duplikasi atau referensi yang tidak valid, konfirmasi harus gagal dan tidak menyimpan sebagian baris.

---

## 7. Pengiriman WM

Base resource yang diketahui: `/pengiriman-wm`.

| Method   | Path                 | Tujuan               | Status                    |
| -------- | -------------------- | -------------------- | ------------------------- |
| `GET`    | `/pengiriman-wm`     | Daftar pengiriman    | Dilaporkan berhasil diuji |
| `POST`   | `/pengiriman-wm`     | Membuat pengiriman   | Dilaporkan berhasil diuji |
| `PATCH`  | `/pengiriman-wm/:id` | Mengubah pengiriman  | Dilaporkan berhasil diuji |
| `GET`    | `/pengiriman-wm/:id` | Detail pengiriman    | Perlu verifikasi          |
| `DELETE` | `/pengiriman-wm/:id` | Menghapus pengiriman | Perlu verifikasi          |

Field model utama:

- Header: `id_pengiriman`, `no_pengiriman`, `id_unit_tujuan`, `tgl_pengiriman`, `total_wm`, `catatan`, `id_user_pusat`, `created_at`.
- Detail: `id_detail`, `id_pengiriman`, `id_merk`, `ukuran_dn`, `jumlah`.
- `no_pengiriman` bersifat unik.

Bentuk body POST/PATCH, cara memasukkan detail, dan apakah total dihitung otomatis harus dikonfirmasi dari schema Zod/controller aktual.

---

## 8. Penugasan / SPK

Base resource: `/penugasan`.

| Method   | Path             | Tujuan                             | Status                                                                      |
| -------- | ---------------- | ---------------------------------- | --------------------------------------------------------------------------- |
| `GET`    | `/penugasan`     | Daftar SPK dengan pembatasan akses | Modul diuji; detail filter perlu verifikasi                                 |
| `POST`   | `/penugasan`     | Membuat SPK                        | `201 Created` dilaporkan berhasil                                           |
| `GET`    | `/penugasan/:id` | Detail SPK                         | Perlu cocokkan definisi route aktual                                        |
| `PATCH`  | `/penugasan/:id` | Memperbarui SPK                    | Operasi diuji; body perlu verifikasi                                        |
| `DELETE` | `/penugasan/:id` | Menghapus SPK                      | Pengujian operasi dilaporkan telah dilakukan; aturan final perlu verifikasi |

### 8.1 Contoh request pembuatan SPK

Contoh berikut menggunakan field yang pernah dipakai saat pengujian:

```http
POST /api/v1/penugasan
Authorization: Bearer <token-admin>
Content-Type: application/json
```

```json
{
  "id_pelanggan": 12,
  "id_unit": 2,
  "alasan": "Water meter macet",
  "id_teknisi": 5
}
```

ID di atas hanya contoh; gunakan ID yang ada di database. `tgl_penugasan` memiliki default pada model, tetapi penerimaan field opsional perlu dicocokkan dengan schema request.

### 8.2 Status SPK

Nilai enum:

- `pending`
- `proses`
- `selesai`
- `dibatalkan`

Aturan bisnis:

- Pelanggan tidak boleh memiliki lebih dari satu SPK aktif.
- Status aktif: `pending` dan `proses`.
- SPK baru dapat dibuat jika SPK sebelumnya berstatus `selesai` atau `dibatalkan`.
- Duplikasi SPK aktif dilaporkan menggunakan konflik `409` dengan kode `ACTIVE_PENUGASAN_EXISTS`.
- `prioritas` tidak digunakan.
- Unit SPK harus konsisten dengan unit pelanggan.
- Admin cabang hanya boleh mengelola SPK pada unitnya; teknisi hanya melihat SPK yang ditugaskan kepadanya, sesuai aturan akses yang diterapkan.

---

## 9. Penggantian WM / BAP

Base resource: `/penggantian-wm`.

| Method            | Path                   | Tujuan                        | Status                                            |
| ----------------- | ---------------------- | ----------------------------- | ------------------------------------------------- |
| `GET`             | `/penggantian-wm`      | Daftar BAP yang sudah dibuat  | Path diketahui; pembatasan akses perlu audit      |
| `POST`            | `/penggantian-wm`      | Teknisi membuat BAP untuk SPK | Dilaporkan berhasil diuji                         |
| `GET`             | `/penggantian-wm/:id`  | Detail BAP                    | Path diketahui; pembatasan akses perlu audit      |
| Endpoint validasi | **Belum dikonfirmasi** | Admin menyetujui/menolak BAP  | Ambil path dari `penggantian-wm.routes.ts` aktual |

> `GET /penggantian-wm` menampilkan data BAP, bukan semua SPK. Untuk melihat SPK yang belum memiliki BAP, gunakan endpoint penugasan yang sesuai hak akses.

### 9.1 Contoh request membuat BAP

```http
POST /api/v1/penggantian-wm
Authorization: Bearer <token-teknisi>
Content-Type: application/json
```

```json
{
  "id_penugasan": 12,
  "no_seri_wm_lama": "WM-LAMA-TEST",
  "stand_wm_lama": 125,
  "kondisi_fisik_wm_lama": "normal",
  "no_seri_wm_baru": "WM-BARU-TEST-001",
  "stand_awal_wm_baru": 0,
  "path_image_wm_baru": "uploads/test-wm-baru.jpg",
  "tgl_penggantian": "2026-10-25T09:00:00.000Z"
}
```

Contoh ini hanya untuk menjelaskan bentuk payload; validasi wajib/opsional harus mengikuti schema Zod aktual. `id_penugasan` harus merujuk SPK nyata yang ditugaskan kepada teknisi pemanggil.

### 9.2 Enum kondisi meter lama

- `normal`
- `macet`
- `kaca_pecah`
- `berembun_parah`
- `bodi_korosi`

### 9.3 Status validasi BAP

- `menunggu`
- `disetujui`
- `ditolak`

### 9.4 Aturan bisnis BAP

- BAP harus terkait ke SPK yang ada.
- Hanya teknisi yang ditugaskan pada SPK tersebut yang boleh membuat BAP.
- SPK `selesai` atau `dibatalkan` tidak menerima BAP baru.
- Satu SPK boleh mempunyai beberapa BAP sebagai riwayat pengajuan.
- Maksimal satu BAP `menunggu` per SPK pada satu waktu.
- Jika sudah ada BAP `disetujui`, BAP baru tidak boleh dibuat untuk SPK tersebut.
- BAP yang ditolak tetap disimpan; teknisi mengajukan BAP baru pada SPK yang sama.
- Saat BAP dibuat untuk SPK `pending`, status SPK berubah menjadi `proses`.
- Saat BAP disetujui, transaksi harus memperbarui status BAP menjadi `disetujui`, `Pelanggan.wm_no_seri_aktif` menjadi nomor seri WM baru, dan status SPK menjadi `selesai`.
- Penolakan harus menyertakan catatan validasi dan tidak menyelesaikan SPK.

### 9.5 Field model BAP yang diketahui

- `id_penggantian`
- `id_penugasan`
- `no_seri_wm_lama` (nullable)
- `stand_wm_lama` (nullable)
- `kondisi_fisik_wm_lama`
- `path_image_wm_lama` (nullable)
- `no_seri_wm_baru`
- `stand_awal_wm_baru` (default `0`)
- `path_image_wm_baru`
- `id_teknisi`
- `tgl_penggantian`
- `status_validasi` (default `menunggu`)
- `catatan_validasi` (nullable)

---

## 10. Query, pagination, dan filter

Beberapa repository mendukung pagination dan filter, tetapi nama query parameter dan nilai default harus diverifikasi dari schema query masing-masing modul. Jangan mengasumsikan nama seperti `page`, `limit`, `search`, `status`, atau `sort` sebelum diperiksa.

Untuk BAP, filter repository yang diketahui meliputi:

- `id_penugasan`
- `status_validasi`
- pagination (nama field perlu verifikasi)

---

## 11. Aturan integrasi UI

1. Simpan token dengan mekanisme yang sesuai threat model aplikasi; hindari menaruh token sensitif di log.
2. Kirim `Authorization: Bearer ...` pada setiap request terlindungi.
3. Tangani `401` dengan alur sesi habis/login ulang.
4. Tangani `403` sebagai akses tidak diizinkan, bukan sebagai data kosong.
5. Untuk `422`, tampilkan error per field jika `errors` tersedia.
6. Untuk `409`, tampilkan pesan konflik bisnis, misalnya pelanggan sudah memiliki SPK aktif.
7. Jangan mengubah status SPK/BAP hanya dengan mengubah state di UI; gunakan endpoint backend yang resmi.
8. Setelah membuat/mengubah data, refresh atau sinkronkan data dari respons API.
9. Jangan menampilkan password atau data sensitif yang tidak diperlukan.
10. Jangan menyimpulkan bahwa SPK tidak ada hanya karena daftar BAP kosong.

---

## 12. Checklist sebelum API spec difinalisasi

- [ ] Cocokkan semua route dengan `src/app.ts` dan file `*.routes.ts`.
- [ ] Cocokkan semua body/query/params dengan schema Zod aktual.
- [ ] Catat contoh respons sukses aktual dari Postman untuk setiap endpoint.
- [ ] Catat bentuk error global yang benar.
- [ ] Konfirmasi endpoint login, logout, dan refresh token (jika ada).
- [ ] Konfirmasi endpoint validasi BAP untuk approve/reject dan request body masing-masing.
- [ ] Audit otorisasi `GET /penggantian-wm` dan `GET /penggantian-wm/:id` untuk mencegah akses lintas teknisi/unit.
- [ ] Uji akses lintas unit, lintas teknisi, token kedaluwarsa, dan ID yang tidak berhak diakses.
- [ ] Jalankan `npx prisma validate`, `npx prisma generate`, dan `npx tsc --noEmit`; catat hasil aktual.
- [ ] Setelah cocok, tandai dokumen sebagai versi 1.0 dan jadikan kontrak resmi frontend-backend.

---

## 13. Ringkasan endpoint yang terkonfirmasi sejauh ini

| Method  | Path                        | Catatan                                                |
| ------- | --------------------------- | ------------------------------------------------------ |
| `POST`  | `/pelanggan/import/preview` | Admin pusat; multipart field `file`                    |
| `POST`  | `/pelanggan/import/confirm` | Admin pusat; JSON `{ "confirm": true, "rows": [...] }` |
| `GET`   | `/pengiriman-wm`            | Dilaporkan berhasil diuji                              |
| `POST`  | `/pengiriman-wm`            | Dilaporkan berhasil diuji                              |
| `PATCH` | `/pengiriman-wm/:id`        | Dilaporkan berhasil diuji                              |
| `GET`   | `/penugasan`                | Daftar SPK; akses harus mengikuti role/cakupan         |
| `POST`  | `/penugasan`                | Membuat SPK; `201` dilaporkan berhasil                 |
| `GET`   | `/penggantian-wm`           | Daftar BAP yang sudah dibuat                           |
| `POST`  | `/penggantian-wm`           | Teknisi membuat BAP untuk SPK                          |
| `GET`   | `/penggantian-wm/:id`       | Detail BAP; audit akses masih diperlukan               |

Semua path di tabel relatif terhadap `/api/v1`.
