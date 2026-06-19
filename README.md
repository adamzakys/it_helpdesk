# IT Helpdesk & Manajemen Aset - Backend Framework

Repositori ini berisi kerangka awal backend untuk **Sistem IT Helpdesk & Manajemen Aset** menggunakan Node.js, Express.js, dan Prisma ORM dengan database MariaDB. Proyek ini didesain secara modular dan terstruktur untuk mempermudah pengembangan tugas akhir/skripsi Anda.

## Fitur Utama

- **Rancangan Skema Database Modular**: 4 model relasional utama: `User`, `Asset`, `Ticket`, dan `TicketLog`.
- **Express.js Router & Controller**: Implementasi API CRUD dasar untuk entitas `Ticket`.
- **Database Transaction (Lifecycle Log)**: Setiap perubahan status tiket otomatis dicatat ke `TicketLog` secara aman dalam satu database transaction.
- **Audit Trail & Cascade Delete**: Riwayat status tiket otomatis dihapus saat tiket didelete.

---

## Prasyarat (Prerequisites)

Pastikan sistem Anda sudah terinstall:
- [Node.js](https://nodejs.org/) (Versi >= 18)
- MariaDB Server / MySQL Server yang sedang aktif

---

## Struktur Folder Proyek

```text
├── prisma/
│   └── schema.prisma        # Definis database schema & relations
├── src/
│   ├── config/
│   │   └── database.js      # Konfigurasi Prisma Client singleton instance
│   ├── controllers/
│   │   └── ticketController.js # CRUD & logic status transaction-log
│   ├── routes/
│   │   └── ticketRoutes.js  # Routing REST API untuk ticket
│   ├── app.js               # Konfigurasi Middleware Express.js
│   └── server.js            # Entry point startup HTTP server
├── .env                     # File environment variables (Kredensial database)
├── package.json             # Manifest dependensi NPM
└── README.md                # Dokumentasi petunjuk penggunaan
```

---

## Langkah Instalasi & Konfigurasi

### 1. Kloning / Persiapkan Folder Proyek
Pastikan Anda berada di direktori proyek ini.

### 2. Install Dependensi
Jalankan perintah berikut pada terminal:
```bash
npm install
```

### 3. Konfigurasi Environment Variable (`.env`)
Buka file `.env` di root direktori lalu sesuaikan URL koneksi database MariaDB Anda:
```env
PORT=3000
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME"
```
*Catatan: Prisma menggunakan protokol `mysql://` untuk terhubung ke MariaDB.*

### 4. Sinkronisasi Skema Database & Migrasi
Jalankan perintah berikut untuk membuat tabel dan relasi di database MariaDB Anda secara otomatis berdasarkan `prisma/schema.prisma`:

```bash
# Membuat file migrasi baru dan menerapkannya ke database
npx prisma migrate dev --name init

# Menghasilkan (generate) Prisma Client lokal yang baru
npx prisma generate
```

---

## Struktur Endpoint API (CRUD Tickets)

| Method | Endpoint | Deskripsi | Parameter Body (JSON) |
|---|---|---|---|
| **POST** | `/api/tickets` | Membuat Tiket baru | `reporter_id` (Int), `asset_id` (Int, opsional), `category` (String), `priority` (String) |
| **GET** | `/api/tickets` | Mengambil seluruh tiket | - |
| **GET** | `/api/tickets/:id` | Detail tiket beserta log status | - |
| **PUT** | `/api/tickets/:id` | Update tiket (mengubah status memicu log) | `status` (Enum), `changed_by` (Int - wajib jika status diubah), `log_note` (String, opsional), data lain. |
| **DELETE** | `/api/tickets/:id` | Menghapus tiket & logs otomatis | - |

### Contoh Request UPDATE Ticket (Mengubah Status)
Untuk memperbarui status tiket dari `OPEN` ke `ASSIGNED`, Anda mengirimkan request **PUT** ke `/api/tickets/id-tiket`:

**Request Body:**
```json
{
  "status": "ASSIGNED",
  "changed_by": 2,
  "log_note": "Tiket dialokasikan ke Staff IT Support lapangan"
}
```

---

## Cara Menjalankan Aplikasi

### Mode Pengembangan (Development)
Menjalankan server dengan `nodemon` yang otomatis melakukan restart jika ada perubahan file:
```bash
npm run dev
```

### Mode Produksi (Production)
```bash
npm start
```
