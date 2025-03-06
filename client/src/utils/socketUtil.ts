// Import socket.io-client directly
import socketIO from 'socket.io-client';

// Create a more complete Socket interface
export interface Socket {
  id: string;
  connected: boolean;
  disconnected: boolean;
  
  // Connection methods
  connect(): Socket;
  disconnect(): Socket;
  
  // Event handlers
  on(event: string, callback: (...args: any[]) => void): Socket;
  off(event: string, callback?: (...args: any[]) => void): Socket;
  once(event: string, callback: (...args: any[]) => void): Socket;
  onAny(callback: (event: string, ...args: any[]) => void): Socket;
  
  // Emitting events
  emit(event: string, ...args: any[]): boolean;
  
  // Other useful methods
  hasListeners(event: string): boolean;
  timeout(timeout: number): Socket;
}

// Default socket options with improved reliability
export const defaultSocketOptions = {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 30000, // increased timeout to 30 seconds for slower connections
  autoConnect: true
};

/**
 * Creates a socket connection with the specified URL and options
 */
export const createSocketConnection = (url: string, options = {}): Socket => {
  console.log('Connecting to socket server at:', url);
  return socketIO(url, { ...defaultSocketOptions, ...options }) as unknown as Socket;
}; 