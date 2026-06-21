# 🌍 GeoTrack

> **Real-Time Location Tracking App** — Offline-First, Clean Architecture, React Native (Expo)

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue?logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.x-black?logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Redux Toolkit](https://img.shields.io/badge/Redux%20Toolkit-2.x-purple?logo=redux)](https://redux-toolkit.js.org/)
[![SQLite](https://img.shields.io/badge/SQLite-expo--sqlite-green?logo=sqlite)](https://docs.expo.dev/versions/latest/sdk/sqlite/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Running & Testing](#-running--testing)
- [Tech Stack](#-tech-stack)
- [API & Configuration](#-api--configuration)

---

## 🔭 Overview

**GeoTrack** adalah aplikasi mobile berbasis React Native (Expo) yang melacak lokasi pengguna secara real-time setiap 10 detik. Aplikasi ini dirancang dengan pendekatan **Offline-First**, menyimpan semua data ke SQLite lokal dan melakukan sinkronisasi otomatis ke server saat koneksi tersedia.

---

## ✅ Features

### Fitur Wajib

| Fitur                       | Status | Keterangan                                           |
| --------------------------- | ------ | ---------------------------------------------------- |
| 🔐 Mock Login / Logout      | ✅     | Auth berbasis SQLite lokal + SecureStore             |
| 📍 Tracking lokasi 10 detik | ✅     | Menggunakan `expo-location` dengan interval 10 detik |
| 💾 Simpan ke local database | ✅     | `expo-sqlite` — tabel `locations`                    |
| 📶 Offline First            | ✅     | Semua operasi berjalan tanpa koneksi internet        |
| 🔄 Auto sync saat online    | ✅     | `NetInfo` listener + `SyncService`                   |
| 🔌 WebSocket / Socket.IO    | ✅     | `SyncService` dengan mode mock fallback              |
| 📜 Halaman Riwayat Lokasi   | ✅     | Screen `history.tsx` dengan daftar + timestamp       |
| 🗺️ Halaman Map              | ✅     | `react-native-maps` dengan polyline rute             |

### Bonus Point

| Fitur                                | Status | Keterangan                                       |
| ------------------------------------ | ------ | ------------------------------------------------ |
| 🏃 Background Tracking               | ✅     | `expo-task-manager` + `expo-location` background |
| 📐 Geofencing                        | ✅     | `GeofenceService` dengan radius alert            |
| 🔁 Retry Queue + Exponential Backoff | ✅     | `SyncService` retry dengan backoff berlapis      |
| 🧪 Unit Test                         | ✅     | 17 test cases (Jest + jest-expo)                 |
| 🏛️ Clean Architecture                | ✅     | Domain / Data / Presentation layers              |

---

## 🏛️ Architecture

GeoTrack menggunakan **Clean Architecture** dengan pemisahan layer yang ketat:

```
Presentation Layer  →  Domain Layer  →  Data Layer
(React/Redux/Hooks)    (Entities/UseCases/Repos)  (SQLite/Network)
```

Lihat dokumentasi lengkap di [`doc/Architecture.md`](doc/Architecture.md).

---

## 📁 Project Structure

```
GeoTrack/
├── app/                          # Expo Router — Routing & Screens
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab navigator config
│   │   ├── index.tsx             # Home / Tracking screen
│   │   ├── history.tsx           # Riwayat Lokasi
│   │   ├── map.tsx               # Map dengan polyline
│   │   └── profile.tsx           # Profil pengguna
│   ├── _layout.tsx               # Root layout + auth guard
│   ├── login.tsx                 # Halaman login
│   └── register.tsx              # Halaman registrasi
│
├── src/
│   ├── core/                     # Konfigurasi global
│   │   ├── config/               # Constants (task names, intervals)
│   │   ├── database/             # database.ts — SQLite init
│   │   ├── network/              # SyncService.ts — WebSocket + retry
│   │   └── store/                # Redux root store
│   │
│   └── features/
│       ├── auth/                 # Fitur Autentikasi
│       │   ├── domain/
│       │   │   ├── entities/     # User.ts
│       │   │   ├── repositories/ # IAuthRepository.ts
│       │   │   └── usecases/     # LoginUseCase, RegisterUseCase
│       │   ├── data/
│       │   │   ├── models/       # UserModel.ts (DTO + Mapper)
│       │   │   ├── datasources/  # LocalAuthDatasource.ts
│       │   │   └── repositories/ # AuthRepositoryImpl.ts
│       │   └── presentation/
│       │       ├── hooks/        # useAuth.ts
│       │       └── redux/        # authSlice.ts
│       │
│       └── tracking/             # Fitur Tracking Lokasi
│           ├── domain/
│           │   ├── entities/     # Location.ts
│           │   ├── repositories/ # ILocationRepository.ts
│           │   ├── services/     # GeofenceService.ts
│           │   └── usecases/     # TrackLocationUseCase
│           ├── data/
│           │   ├── models/       # LocationModel.ts (DTO + Mapper)
│           │   ├── datasources/  # LocalLocationDatasource.ts
│           │   ├── repositories/ # LocationRepositoryImpl.ts
│           │   └── tasks/        # LocationBackgroundTask.ts
│           └── presentation/
│               └── hooks/        # useTracking.ts
│
├── doc/
│   ├── Architecture.md           # Dokumentasi arsitektur lengkap
│   └── TechnicalReview.md        # Jawaban technical review questions
│
├── assets/                       # Icons, splash screen, images
├── jest.config.js
├── tsconfig.json
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **Expo CLI** (via `npx`)
- **Android Studio** (untuk emulator Android) atau perangkat fisik
- **Expo Go** app (opsional, untuk development cepat)

### Installation

```bash
# 1. Clone repositori
git clone https://github.com/your-username/GeoTrack.git
cd GeoTrack

# 2. Install dependencies
npm install

# 3. Jalankan aplikasi
npx expo start
```

---

## 🧪 Running & Testing

### Menjalankan Aplikasi

```bash
# Development server
npx expo start

# Jalankan di Android emulator
npx expo run:android

# Jalankan di iOS simulator (Mac only)
npx expo run:ios
```

### Menjalankan Unit Test

```bash
# Jalankan semua test
npm test

# Jalankan dengan coverage report
npm test -- --coverage

# Jalankan test spesifik
npm test LoginUseCase
npm test RegisterUseCase
npm test TrackLocationUseCase
```

### Hasil Test

```
 PASS  src/features/auth/domain/usecases/LoginUseCase.test.ts
 PASS  src/features/auth/domain/usecases/RegisterUseCase.test.ts
 PASS  src/features/auth/data/models/UserModel.test.ts
 PASS  src/features/tracking/domain/usecases/TrackLocationUseCase.test.ts
 PASS  src/features/tracking/data/models/LocationModel.test.ts

Test Suites: 5 passed, 5 total
Tests:       17 passed, 17 total
```

---

## 🛠️ Tech Stack

| Kategori         | Library                         | Versi         |
| ---------------- | ------------------------------- | ------------- |
| Framework        | React Native                    | 0.81.5        |
| Toolchain        | Expo                            | ~54.0.x       |
| Language         | TypeScript                      | ~5.9          |
| Routing          | Expo Router                     | ~6.0          |
| State Management | Redux Toolkit                   | ^2.12         |
| Local Database   | expo-sqlite                     | ~16.0         |
| Secure Storage   | expo-secure-store               | ~15.0         |
| Location         | expo-location                   | ~19.0         |
| Background Task  | expo-task-manager               | ~14.0         |
| Map              | react-native-maps               | 1.20.1        |
| Network Status   | @react-native-community/netinfo | 11.4.1        |
| Testing          | Jest + jest-expo                | ~29.7 / ~54.0 |

---

## ⚙️ API & Configuration

### Environment

Saat ini aplikasi berjalan dalam **mock mode** — tidak memerlukan backend server. `SyncService` akan mencoba koneksi WebSocket ke `ws://localhost:3001` dan jatuh ke mode mock jika tidak tersedia.

### Database Schema

```sql
-- Tabel Users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email    TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Locations
CREATE TABLE IF NOT EXISTS locations (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  userId    TEXT NOT NULL,
  latitude  REAL NOT NULL,
  longitude REAL NOT NULL,
  timestamp TEXT NOT NULL,
  synced    INTEGER DEFAULT 0
);
```

### Konfigurasi Tracking

| Parameter               | Nilai                    |
| ----------------------- | ------------------------ |
| Interval tracking       | 10 detik                 |
| Background task name    | `LOCATION_TRACKING_TASK` |
| Geofence radius default | 100 meter                |
| Sync retry max attempts | 5                        |
| Backoff base delay      | 1000 ms                  |

---

## 📄 License

MIT © 2026 GeoTrack
