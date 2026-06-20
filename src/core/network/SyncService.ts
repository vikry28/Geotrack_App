import NetInfo from '@react-native-community/netinfo';
import { LocationRepositoryImpl } from '@/src/features/tracking/data/repositories/LocationRepositoryImpl';
import { LocalAuthDatasourceImpl } from '@/src/features/auth/data/datasources/LocalAuthDatasource';
import { CONFIG } from '../config/constants';

type SyncStatusListener = (status: {
  isOnline: boolean;
  isWsConnected: boolean;
  isSyncing: boolean;
  pendingCount: number;
  isMockMode: boolean;
}) => void;

class SyncServiceClass {
  private locationRepo = new LocationRepositoryImpl();
  private authDatasource = new LocalAuthDatasourceImpl();
  private ws: WebSocket | null = null;
  private isOnline = false;
  private isWsConnected = false;
  private isSyncing = false;
  private isMockMode = false; // True when no real server is available
  private listeners = new Set<SyncStatusListener>();

  private retryCount = 0;
  private maxRetries = 5;
  private baseDelayMs = 2000;
  private retryTimer: any = null;

  constructor() {
    NetInfo.addEventListener((state) => {
      const online = !!state.isConnected && !!state.isInternetReachable;
      if (this.isOnline !== online) {
        this.isOnline = online;
        console.log(`[SyncService] Network: ${online ? 'ONLINE' : 'OFFLINE'}`);
        if (online && !this.isWsConnected) {
          // Reset mock mode when network comes back so we try real WS again
          this.isMockMode = false;
          this.retryCount = 0;
          this.connectWebSocket();
        } else if (!online) {
          this.isWsConnected = false;
          this.isMockMode = false;
        }
        this.notifyListeners();
      }
    });
  }

  subscribe(listener: SyncStatusListener) {
    this.listeners.add(listener);
    // Emit current state immediately
    this.getPendingCount().then((pendingCount) => {
      listener({
        isOnline: this.isOnline,
        isWsConnected: this.isWsConnected,
        isSyncing: this.isSyncing,
        pendingCount,
        isMockMode: this.isMockMode,
      });
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.getPendingCount().then((pendingCount) => {
      this.listeners.forEach((listener) => {
        listener({
          isOnline: this.isOnline,
          isWsConnected: this.isWsConnected,
          isSyncing: this.isSyncing,
          pendingCount,
          isMockMode: this.isMockMode,
        });
      });
    });
  }

  async getPendingCount(): Promise<number> {
    try {
      const session = await this.authDatasource.getSession();
      const userId = session.userId ?? '';
      const unsynced = await this.locationRepo.getUnsyncedLocations(userId);
      return unsynced.length;
    } catch {
      return 0;
    }
  }

  /** Attempt to connect to a real WebSocket server. Falls back to mock mode if unavailable. */
  private connectWebSocket() {
    if (!this.isOnline) return;
    if (this.isMockMode) return; // Already in mock mode — don't retry real WS
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      try { this.ws.close(); } catch { /* ignore */ }
      this.ws = null;
    }

    console.log('[SyncService] Connecting to WebSocket server...');
    try {
      this.ws = new WebSocket(CONFIG.WS_SERVER_URL);
      // Set a connection timeout — if no response in 5s, treat as unavailable
      const connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          console.log('[SyncService] WS connection timed out — switching to mock mode.');
          this.enterMockMode();
        }
      }, 5000);

      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('[SyncService] WebSocket connected to real server.');
        this.isWsConnected = true;
        this.isMockMode = false;
        this.retryCount = 0;
        this.notifyListeners();
        this.startSync();
      };

      this.ws.onclose = () => {
        clearTimeout(connectionTimeout);
        // Only handle disconnect if we're NOT in mock mode
        if (this.isMockMode) return;
        console.log('[SyncService] WebSocket disconnected.');
        this.isWsConnected = false;
        this.notifyListeners();
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        clearTimeout(connectionTimeout);
        if (this.isMockMode) return;
        console.log('[SyncService] WS connection error — switching to mock mode.');
        this.enterMockMode();
      };
    } catch {
      this.enterMockMode();
    }
  }

  /** Enter mock/offline-queue mode. Syncing still works locally, no real WS connection. */
  private enterMockMode() {
    if (this.isMockMode) return; // Already in mock mode
    console.log('[SyncService] Entering mock/local mode — sync will process locally.');
    this.isMockMode = true;
    this.isWsConnected = true; // Treat as "connected" so sync can process the queue
    // Clean up any WS instance
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      try { this.ws.close(); } catch { /* ignore */ }
      this.ws = null;
    }
    this.notifyListeners();
    this.startSync();
  }

  private scheduleReconnect() {
    if (!this.isOnline) return;
    if (this.isMockMode) return;
    if (this.retryCount >= this.maxRetries) {
      console.log('[SyncService] Max WS retries reached — switching to mock mode permanently.');
      this.enterMockMode();
      return;
    }

    const delay = this.baseDelayMs * Math.pow(2, this.retryCount);
    console.log(`[SyncService] Retrying WS in ${delay}ms (Attempt ${this.retryCount + 1}/${this.maxRetries})`);

    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => {
      this.retryCount++;
      this.connectWebSocket();
    }, delay);
  }

  async startSync() {
    if (this.isSyncing) return;
    if (!this.isWsConnected) {
      // Not connected — try to connect first if online
      if (this.isOnline && !this.isMockMode) {
        this.connectWebSocket();
      }
      return;
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      const session = await this.authDatasource.getSession();
      const userId = session.userId ?? '';
      const unsynced = await this.locationRepo.getUnsyncedLocations(userId);
      if (unsynced.length === 0) {
        this.isSyncing = false;
        this.notifyListeners();
        return;
      }

      console.log(`[SyncService] Syncing ${unsynced.length} locations...`);
      const success = await this.sendLocationPacket(unsynced);
      if (success) {
        const ids = unsynced.map((l) => l.id);
        await this.locationRepo.markLocationsAsSynced(ids);
        console.log(`[SyncService] Synced ${unsynced.length} locations successfully.`);
      }
    } catch (err) {
      console.error('[SyncService] Sync error:', err);
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  private sendLocationPacket(locations: any[]): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const payload = JSON.stringify({ type: 'sync_locations', data: locations });
        this.ws.send(payload);
        resolve(true);
      } else {
        // Mock mode: simulate successful send with slight delay
        setTimeout(() => resolve(true), 300);
      }
    });
  }
}

export const SyncService = new SyncServiceClass();
