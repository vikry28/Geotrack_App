# 🎯 Technical Review Questions — GeoTrack

Dokumen ini menjawab lima pertanyaan teknis terkait keputusan desain, skalabilitas, dan rencana peningkatan pada aplikasi GeoTrack.

---

## 1. Mengapa memilih arsitektur tersebut?

**Jawaban: Clean Architecture**

Alasan pemilihan Clean Architecture untuk GeoTrack:

### a. Testability Tinggi

Business logic (Use Cases) tidak bergantung pada framework, database, atau UI. Ini memungkinkan pengujian unit tanpa mocking framework besar:

```typescript
// Bisa ditest tanpa SQLite atau Redux!
const mockRepo = { login: jest.fn().mockResolvedValue(mockUser) };
const useCase = new LoginUseCase(mockRepo);
await useCase.execute('test@email.com', 'password');
```

Hasilnya: **17 unit test** dapat berjalan murni dengan Jest, tanpa emulator.

### b. Separation of Concerns

Setiap layer memiliki satu tanggung jawab:
- **Domain**: *"Apa yang dilakukan aplikasi?"* (business rules)
- **Data**: *"Dari mana data berasal?"* (SQLite, network)
- **Presentation**: *"Bagaimana data ditampilkan?"* (React, Redux)

### c. Maintainability & Scalability

Ketika server backend akhirnya diimplementasikan, hanya `AuthRepositoryImpl` yang perlu diubah — tidak ada yang menyentuh UI atau business logic.

### d. Kesesuaian dengan React Native Ecosystem

Expo Router cocok sebagai **Presentation Layer**, Redux Toolkit sebagai state container, dan expo-sqlite sebagai **Data Layer**. Clean Architecture mengkodifikasi pemisahan ini secara formal.

---

## 2. Jika user menjadi 100.000 user aktif, apa yang akan diubah?

Dengan 100.000 pengguna aktif, bottleneck utama ada di **backend & infrastruktur**, bukan di mobile app. Namun ada beberapa hal yang perlu diubah:

### Backend (Prioritas Tinggi)

| Komponen | Perubahan |
|---|---|
| **WebSocket Server** | Ganti dari single-node ke **Socket.IO cluster** dengan Redis adapter untuk horizontal scaling |
| **Database Server** | Migrasi dari SQLite (lokal) ke PostgreSQL/TimescaleDB (optimal untuk time-series GPS data) |
| **API Gateway** | Tambahkan rate limiting per user (maks 1 request/10 detik per user) |
| **Message Queue** | Gunakan **RabbitMQ** atau **Kafka** untuk buffer data lokasi sebelum disimpan ke DB |
| **CDN** | Tile map dari server CDN sendiri (tidak bergantung Google Maps quota) |

### Mobile App

| Komponen | Perubahan |
|---|---|
| **Batching** | Kirim data lokasi dalam batch (5-10 titik sekaligus) vs satu per satu untuk mengurangi overhead network |
| **Compression** | Kompres payload JSON dengan gzip/brotli sebelum dikirim ke WebSocket |
| **Token Refresh** | Implementasi JWT refresh token (saat ini hanya mock token) |
| **Database Cleanup** | Auto-purge data lokasi > 30 hari di SQLite lokal untuk mencegah bloat |

### Infrastruktur

```
Load Balancer (nginx/HAProxy)
        │
    ┌───┴───┐
   WS-1   WS-2   ← Socket.IO cluster (auto-scale)
    │       │
  Redis Pub/Sub (state sharing)
        │
   PostgreSQL (primary + replicas)
        │
  TimescaleDB (time-series hypertables untuk lokasi)
```

---

## 3. Bagian mana yang ingin direfactor?

### Prioritas Tinggi

#### a. `SyncService.ts` — God Class
File ini melakukan terlalu banyak hal: manajemen WebSocket, retry logic, queue management, dan koneksi monitoring. Perlu dipecah menjadi:

```
SyncService.ts         → orchestrator saja
WebSocketClient.ts     → koneksi WS
RetryQueue.ts          → antrian retry + backoff
ConnectivityMonitor.ts → pemantauan jaringan
```

#### b. `authSlice.ts` — Redux Slice terlalu tebal
Slice berisi logika yang sebaiknya ada di Use Case. Perlu memindahkan validasi ke `LoginUseCase` dan `RegisterUseCase`, slice hanya menyimpan state.

#### c. Tidak ada Error Boundary
Saat ini error handling dilakukan per-komponen. Sebaiknya tambahkan React Error Boundary global di `app/_layout.tsx`.

### Prioritas Menengah

#### d. Model Mapper — Tidak Konsisten
`UserModelMapper` dan `LocationModelMapper` menggunakan pendekatan object literal (`{ toEntity() }`), bukan class. Lebih baik menggunakan interface `Mapper<TModel, TEntity>` yang konsisten.

#### e. Hardcoded Constants
Interval tracking (10 detik), max retries (5), base delay (1000ms) tersebar di beberapa file. Semua perlu dipindahkan ke `src/core/config/constants.ts` terpusat.

---

## 4. Apa bottleneck terbesar?

### Bottleneck Teknis Saat Ini

#### 1. SQLite Query tanpa Indeks (Bottleneck Teratas)
Query `getLocationsByUserId` melakukan full table scan. Dengan ribuan lokasi tersimpan, ini akan memperlambat History screen secara signifikan.

**Solusi:**
```sql
CREATE INDEX idx_locations_userId ON locations(userId);
CREATE INDEX idx_locations_synced ON locations(synced, userId);
```

#### 2. Tidak Ada Pagination pada History
`getLocationsByUserId` mengambil **semua** data sekaligus. Jika user memiliki 10.000 titik lokasi, ini akan crash karena memory pressure.

**Solusi:** Implementasi cursor-based pagination:
```typescript
getLocationsByUserId(userId: string, limit: number, offset: number): Promise<Location[]>
```

#### 3. WebSocket Tanpa Reconnection Logic
Jika koneksi WebSocket terputus di tengah sesi, tidak ada mekanisme reconnect otomatis saat ini. Data akan gagal sync tanpa notifikasi.

**Solusi:** Tambahkan heartbeat + auto-reconnect dengan exponential backoff di `WebSocketClient`.

#### 4. Mock Authentication
Tidak ada JWT atau session expiry. Siapapun yang tahu struktur data SQLite lokal dapat memanipulasi auth state.

**Solusi:** Implementasi real authentication dengan backend + JWT.

---

## 5. Jika diberi tambahan 2 hari, apa yang akan di-improve?

### Hari 1: Backend + Auth Real

**Pagi (4 jam): Setup Backend Minimal**
- Buat Express.js + Socket.IO server sederhana
- Endpoint: `POST /auth/login`, `POST /auth/register`
- WebSocket event: `location:sync`
- Database: PostgreSQL dengan tabel `users` + `locations`

**Siang (4 jam): Implementasi JWT Auth**
- Ganti mock auth dengan HTTP call ke backend
- Simpan JWT token di `expo-secure-store`
- Tambahkan interceptor untuk token refresh otomatis
- Implementasi logout yang benar-benar invalidate token

### Hari 2: Polish & Performance

**Pagi (4 jam): Performance & UX**
- Tambahkan indeks database SQLite
- Implementasi pagination di History screen (infinite scroll)
- Tambahkan loading skeleton di semua screen
- Implementasi pull-to-refresh di History & Map

**Siang (4 jam): Testing & Monitoring**
- Tambahkan integration test untuk `AuthRepositoryImpl`
- Tambahkan E2E test dasar dengan Detox (login → tracking → history)
- Implementasi Sentry untuk error monitoring di production
- Tambahkan analytics event (tracking started, sync success/fail)

### Ringkasan Prioritas 2 Hari

```
Hari 1: [ Backend ] → [ JWT Auth ]
Hari 2: [ Pagination + Indeks ] → [ E2E Test + Monitoring ]
```

Dengan 2 hari tambahan, aplikasi akan berpindah dari **prototype** menjadi **MVP yang production-ready** dengan autentikasi nyata, performa lebih baik, dan observability dasar.

---

*Dokumen ini dibuat sebagai bagian dari deliverable teknis GeoTrack v1.0*
