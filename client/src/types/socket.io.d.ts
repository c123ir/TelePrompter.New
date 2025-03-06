// Type definitions for socket.io-client v4.x
import { Socket as IoSocket } from 'socket.io-client';

declare module 'socket.io-client' {
  // Re-export the Socket type
  export interface Socket extends IoSocket {}
  
  // Re-export the io function
  export const io: any;
} 