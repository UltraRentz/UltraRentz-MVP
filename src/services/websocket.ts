// WebSocket service for real-time updates
// This will be implemented in Phase 3 after basic REST API integration

import { io, Socket } from "socket.io-client";

const WEBSOCKET_URL =
  import.meta.env.VITE_WEBSOCKET_URL || "http://localhost:5000";

export class WebSocketService {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  // Connect to WebSocket server
  public connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(WEBSOCKET_URL, {
      transports: ["websocket"],
      autoConnect: true,
    });

    this.socket.on("connect", () => {
      console.log("WebSocket connected");
    });

    this.socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
    });

    this.socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
    });
  }

  // Disconnect from WebSocket server
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Subscribe to deposit updates
  public subscribeToDeposit(depositId: number): void {
    if (this.socket) {
      this.socket.emit("subscribe:deposit", depositId);
    }
  }

  // Unsubscribe from deposit updates
  public unsubscribeFromDeposit(depositId: number): void {
    if (this.socket) {
      this.socket.emit("unsubscribe:deposit", depositId);
    }
  }

  // Subscribe to yield updates
  public subscribeToYields(userAddress: string): void {
    if (this.socket) {
      this.socket.emit("subscribe:yields", userAddress);
    }
  }

  // Unsubscribe from yield updates
  public unsubscribeFromYields(userAddress: string): void {
    if (this.socket) {
      this.socket.emit("unsubscribe:yields", userAddress);
    }
  }

  // Add event listener
  public on(event: string, callback: (data: any) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove event listener
  public off(event: string, callback?: (data: any) => void): void {
    if (callback) {
      const listeners = this.listeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    } else {
      this.listeners.delete(event);
    }

    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.removeAllListeners(event);
      }
    }
  }

  // Check if connected
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const websocketService = WebSocketService.getInstance();

// WebSocket event types
export interface WebSocketEvents {
  "deposit:created": {
    depositId: number;
    tenant: string;
    landlord: string;
    amount: string;
    txHash: string;
  };
  "deposit:updated": {
    depositId: number;
    status: string;
    txHash: string;
  };
  "vote:cast": {
    depositId: number;
    signatory: string;
    choice: string;
    txHash: string;
  };
  "dispute:triggered": {
    depositId: number;
    triggeredBy: string;
    txHash: string;
  };
  "dispute:resolved": {
    depositId: number;
    tenantAmount: string;
    landlordAmount: string;
    txHash: string;
  };
  "yield:claimed": {
    depositId: number;
    user: string;
    amount: string;
    txHash: string;
  };
}



