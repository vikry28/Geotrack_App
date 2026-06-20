# 🏛️ Dokumentasi Arsitektur GeoTrack

## Daftar Isi

- [Gambaran Umum](#gambaran-umum)
- [Prinsip Clean Architecture](#prinsip-clean-architecture)
- [Layer Breakdown](#layer-breakdown)
  - [Domain Layer](#1-domain-layer)
  - [Data Layer](#2-data-layer)
  - [Presentation Layer](#3-presentation-layer)
  - [Core Layer](#4-core-layer)
- [Dependency Flow Diagram](#dependency-flow-diagram)
- [Alur Data End-to-End](#alur-data-end-to-end)
- [Pola Desain yang Digunakan](#pola-desain-yang-digunakan)
- [Database Schema](#database-schema)
- [Strategi Offline-First & Sinkronisasi](#strategi-offline-first--sinkronisasi)
- [Background Tracking & Geofencing](#background-tracking--geofencing)
- [Retry Queue dengan Exponential Backoff](#retry-queue-dengan-exponential-backoff)

---

## Gambaran Umum

GeoTrack dibangun menggunakan **Clean Architecture** yang dipelopori oleh Robert C. Martin ("Uncle Bob"). Tujuannya adalah memisahkan *business logic* dari *framework*, *UI*, dan *infrastruktur*, sehingga kode menjadi:

- **Testable** — business logic dapat diuji tanpa UI atau database
- **Independent of Frameworks** — domain tidak bergantung pada Expo, Redux, atau SQLite
- **Maintainable** — setiap layer memiliki tanggung jawab tunggal
- **Scalable** — fitur baru dapat ditambahkan tanpa menyentuh layer lain

---

## Prinsip Clean Architecture

```
╔══════════════════════════════════════════╗
║           PRESENTATION LAYER             ║
║   (React Components, Redux, Hooks)       ║
╠══════════════════════════════════════════╣
║              DOMAIN LAYER                ║
║   (Entities, Use Cases, Repositories)   ║  ← Inti aplikasi, murni TypeScript
╠══════════════════════════════════════════╣
║               DATA LAYER                 ║
║   (Models, DataSources, Repo Impl.)      ║
╚══════════════════════════════════════════╝
         ↑ Dependency arah KE DALAM ↑
```

**Aturan Dependensi (Dependency Rule):**
> *"Source code dependencies can only point inwards."*
> Layer luar boleh bergantung ke layer dalam, tetapi TIDAK sebaliknya.

---

## Layer Breakdown

### 1. Domain Layer

**Lokasi:** `src/features/{feature}/domain/`

Layer paling dalam dan paling penting. Tidak boleh mengimpor apa pun dari layer lain.

#### Entities

Merepresentasikan objek bisnis inti:

```typescript
// src/features/auth/domain/entities/User.ts
export interface User {
  id: string;
  username: string;
  email: string;
}
```

```typescript
// src/features/tracking/domain/entities/Location.ts
export interface Location {
  id?: number;
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  synced?: boolean;
}
```

#### Repository Interfaces (Contracts)

Mendefinisikan *kontrak* yang harus dipenuhi oleh Data Layer:

```typescript
// src/features/auth/domain/repositories/IAuthRepository.ts
export interface IAuthRepository {
  login(email: string, password: string): Promise<User>;
  register(username: string, email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}
```

```typescript
// src/features/tracking/domain/repositories/ILocationRepository.ts
export interface ILocationRepository {
  saveLocation(location: Omit<Location, 'id'>): Promise<Location>;
  getLocationsByUserId(userId: string): Promise<Location[]>;
  getUnsyncedLocations(userId: string): Promise<Location[]>;
  markAsSynced(id: number): Promise<void>;
}
```

#### Use Cases

Mengandung *business logic* spesifik satu aksi:

| Use Case | Deskripsi |
|---|---|
| `LoginUseCase` | Validasi kredensial + kembalikan User entity |
| `RegisterUseCase` | Buat akun baru dengan validasi |
| `TrackLocationUseCase` | Simpan koordinat GPS ke repository |

```typescript
// src/features/auth/domain/usecases/LoginUseCase.ts
export class LoginUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(email: string, password: string): Promise<User> {
    if (!email || !password) throw new Error('Email dan password wajib diisi');
    return this.authRepository.login(email, password);
  }
}
```

---

### 2. Data Layer

**Lokasi:** `src/features/{feature}/data/`

Implementasi konkret dari kontrak Domain. Bertanggung jawab atas akses data (SQLite, Network).

#### Models (DTO + Mapper)

Konversi antara struktur database dan Domain Entity:

```typescript
// src/features/auth/data/models/UserModel.ts
export interface UserModel {
  id: number;
  username: string;
  email: string;
  password: string;
}

export const UserModelMapper = {
  toEntity(model: UserModel): User {
    return {
      id: String(model.id),
      username: model.username,
      email: model.email,
    };
  },
};
```

#### DataSources

Akses langsung ke sumber data (SQLite):

```
LocalAuthDatasource.ts      ← CRUD users table
LocalLocationDatasource.ts  ← CRUD locations table
```

#### Repository Implementations

Mengimplementasikan interface dari Domain Layer:

```
AuthRepositoryImpl.ts       ← implements IAuthRepository
LocationRepositoryImpl.ts   ← implements ILocationRepository
```

#### Background Tasks

```
LocationBackgroundTask.ts   ← expo-task-manager background location
```

---

### 3. Presentation Layer

**Lokasi:** `src/features/{feature}/presentation/` & `app/`

Bertanggung jawab atas UI dan state management. Menggunakan Redux Toolkit + custom hooks.

#### Hooks (Interface antara UI dan Domain)

```typescript
// src/features/auth/presentation/hooks/useAuth.ts
export function useAuth() {
  const dispatch = useAppDispatch();
  // ...
  return {
    user, isAuthenticated, isLoading, error,
    login, register, logout, clearAuthError,
  };
}
```

```typescript
// src/features/tracking/presentation/hooks/useTracking.ts
export function useTracking() {
  // ...
  return {
    isTracking, locations, isLoading, error,
    startTracking, stopTracking, fetchHistory,
    fetchRoute, getLocations, clearError,
  };
}
```

#### Redux Slices

```
authSlice.ts      ← State: user, token, isLoading, error
```

#### Screens (via Expo Router)

| Screen | Path | Deskripsi |
|---|---|---|
| Login | `app/login.tsx` | Form login dengan validasi |
| Register | `app/register.tsx` | Form registrasi |
| Home/Tracking | `app/(tabs)/index.tsx` | Start/stop tracking, koordinat live |
| History | `app/(tabs)/history.tsx` | Daftar riwayat lokasi |
| Map | `app/(tabs)/map.tsx` | Peta dengan polyline rute |
| Profile | `app/(tabs)/profile.tsx` | Info user + statistik |

---

### 4. Core Layer

**Lokasi:** `src/core/`

Konfigurasi dan utilitas global yang digunakan seluruh fitur.

| File | Fungsi |
|---|---|
| `core/database/database.ts` | Inisialisasi SQLite, create tables |
| `core/network/SyncService.ts` | WebSocket sync + retry backoff |
| `core/store/` | Redux root store + typed hooks |
| `core/config/` | Constants (task names, intervals) |

---

## Dependency Flow Diagram

```
┌─────────────────────────────────────────────────┐
│                 PRESENTATION                     │
│  app/(tabs)/index.tsx                           │
│       │                                         │
│       ▼                                         │
│  useTracking() Hook                             │
│       │                                         │
│       ▼                                         │
│  Redux (authSlice)                              │
└──────────────────┬──────────────────────────────┘
                   │ calls
                   ▼
┌─────────────────────────────────────────────────┐
│                   DOMAIN                        │
│  TrackLocationUseCase                           │
│       │ uses interface                          │
│       ▼                                         │
│  ILocationRepository (interface)                │
└──────────────────┬──────────────────────────────┘
                   │ implements
                   ▼
┌─────────────────────────────────────────────────┐
│                    DATA                         │
│  LocationRepositoryImpl                         │
│       │                                         │
│       ▼                                         │
│  LocalLocationDatasource                        │
│       │                                         │
│       ▼                                         │
│  expo-sqlite (database.ts)                      │
└─────────────────────────────────────────────────┘
```

---

## Alur Data End-to-End

### Skenario: User Memulai Tracking

```
1. User tap "Start Tracking" di Home screen (index.tsx)
      │
2. useTracking().startTracking() dipanggil
      │
3. expo-location.startLocationUpdatesAsync() diaktifkan
      │ setiap 10 detik
4. LocationBackgroundTask menerima koordinat baru
      │
5. TrackLocationUseCase.execute(location) dipanggil
      │
6. ILocationRepository.saveLocation() → LocationRepositoryImpl
      │
7. LocalLocationDatasource.insert() → expo-sqlite
      │
8. Data tersimpan di tabel `locations` (synced = 0)
      │
9. SyncService mendeteksi koneksi → kirim ke WebSocket server
      │ (jika offline → masuk retry queue)
10. markAsSynced(id) → update synced = 1
```

### Skenario: Login

```
1. User isi email + password → tap Login
      │
2. useAuth().login(email, password)
      │
3. LoginUseCase.execute(email, password)
      │
4. AuthRepositoryImpl.login()
      │
5. LocalAuthDatasource.findByEmailAndPassword()
      │ → query SQLite tabel `users`
6. UserModelMapper.toEntity() → kembalikan User entity
      │
7. Token disimpan di expo-secure-store
      │
8. Redux authSlice.setUser(user, token)
      │
9. Expo Router redirect ke (tabs)
```

---

## Pola Desain yang Digunakan

| Pola | Digunakan Di | Tujuan |
|---|---|---|
| **Repository Pattern** | Domain/Data | Abstraksi akses data |
| **Use Case / Interactor** | Domain | Enkapsulasi business logic |
| **DTO + Mapper** | Data Models | Konversi data antar layer |
| **Observer (Redux)** | Presentation | Reaktif state management |
| **Custom Hook** | Presentation | Isolasi logika dari UI |
| **Strategy** | SyncService | Ganti strategi sync (WS/REST/mock) |
| **Retry + Backoff** | SyncService | Fault tolerance jaringan |

---

## Database Schema

```sql
-- Inisialisasi di: src/core/database/database.ts

CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  username   TEXT    NOT NULL UNIQUE,
  email      TEXT    NOT NULL UNIQUE,
  password   TEXT    NOT NULL,
  created_at TEXT    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS locations (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  userId    TEXT    NOT NULL,
  latitude  REAL    NOT NULL,
  longitude REAL    NOT NULL,
  timestamp TEXT    NOT NULL,
  synced    INTEGER DEFAULT 0
);
```

**Indeks implisit:** `userId` pada tabel `locations` digunakan untuk query berdasarkan pengguna.

---

## Strategi Offline-First & Sinkronisasi

GeoTrack menggunakan strategi **"Write-Through Local, Sync Async"**:

```
┌────────────────────────────────────────────────────┐
│              OFFLINE-FIRST STRATEGY                │
│                                                    │
│  WRITE: lokasi → SQLite DULU (synced=0)            │
│         → coba kirim ke server                     │
│         → jika berhasil: synced=1                  │
│         → jika gagal: masuk retry queue            │
│                                                    │
│  READ:  selalu dari SQLite (tidak butuh internet)  │
│                                                    │
│  SYNC:  NetInfo listener deteksi online            │
│         → ambil semua records dengan synced=0      │
│         → kirim batch ke WebSocket server          │
│         → update synced=1 per record               │
└────────────────────────────────────────────────────┘
```

**SyncService** (`src/core/network/SyncService.ts`):
- Terhubung ke WebSocket `ws://localhost:3001`
- Fallback ke **mock mode** jika server tidak tersedia
- Mendengarkan perubahan konektivitas via `@react-native-community/netinfo`

---

## Background Tracking & Geofencing

### Background Tracking

Menggunakan `expo-task-manager` + `expo-location`:

```typescript
// src/features/tracking/data/tasks/LocationBackgroundTask.ts
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  const { locations } = data as LocationTaskData;
  // Simpan ke SQLite via TrackLocationUseCase
});
```

**Konfigurasi:**
- `timeInterval`: 10.000 ms (10 detik)
- `distanceInterval`: 0 (tidak minimum jarak)
- `accuracy`: `Location.Accuracy.High`

### Geofencing

```typescript
// src/features/tracking/domain/services/GeofenceService.ts
export class GeofenceService {
  checkGeofence(current: Location, center: GeofenceConfig): boolean {
    const distance = this.calculateDistance(current, center);
    return distance <= center.radius;
  }
}
```

Menggunakan formula **Haversine** untuk menghitung jarak dua koordinat di permukaan bumi.

---

## Retry Queue dengan Exponential Backoff

```typescript
// src/core/network/SyncService.ts
private async syncWithRetry(
  data: LocationPayload,
  attempt: number = 0
): Promise<void> {
  try {
    await this.sendToWebSocket(data);
  } catch (error) {
    if (attempt >= MAX_RETRIES) throw error;              // maks 5 percobaan
    const delay = BASE_DELAY * Math.pow(2, attempt);     // 1s, 2s, 4s, 8s, 16s
    await new Promise(resolve => setTimeout(resolve, delay));
    return this.syncWithRetry(data, attempt + 1);
  }
}
```

**Konfigurasi:**

| Parameter | Nilai |
|---|---|
| `MAX_RETRIES` | 5 |
| `BASE_DELAY` | 1000 ms |
| Delay percobaan 1 | 1 detik |
| Delay percobaan 2 | 2 detik |
| Delay percobaan 3 | 4 detik |
| Delay percobaan 4 | 8 detik |
| Delay percobaan 5 | 16 detik |
