import { store } from '../app/store';
import { addMessage, markMessagesRead, setTyping } from '../features/messaging/messagingSlice';
import { addNotification } from '../features/notifications/notificationsSlice';

type WebSocketType = 'notification' | 'chat';

class WebSocketManager {
  private static instance: WebSocketManager;
  private sockets: Map<string, WebSocket> = new Map();
  private reconnectTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private connectionTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private isConnecting: Map<string, boolean> = new Map();
  private retryCounts: Map<string, number> = new Map();
  private activeThreadId: string | null = null;

  private constructor() {}

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  public connect(type: WebSocketType, url: string, threadId?: string) {
    const key = type === 'chat' && threadId ? `chat_${threadId}` : 'notification';

    if (this.sockets.has(key) || this.isConnecting.get(key)) {
      return;
    }

    this.isConnecting.set(key, true);
    
    // 100ms delay to handle rapid React remounts
    const timer = setTimeout(() => {
      this.connectionTimers.delete(key);
      
      // Check if already handled or cancelled while we were waiting
      if (this.sockets.has(key) || !this.isConnecting.get(key)) {
        this.isConnecting.set(key, false);
        return;
      }

      console.log(`[WSManager] Connecting to ${key}...`);
      const socket = new WebSocket(url);

      socket.onopen = () => {
        console.log(`[WSManager] Connected to ${key}`);
        this.isConnecting.set(key, false);
        this.retryCounts.set(key, 0); // Reset backoff on successful connect
        if (type === 'chat' && threadId) {
          this.activeThreadId = threadId;
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(type, data, threadId);
        } catch (err) {
          console.error('[WSManager] Failed to parse message', err);
        }
      };

      socket.onclose = (event) => {
        console.log(`[WSManager] Closed ${key}: ${event.reason}`);
        this.sockets.delete(key);
        this.isConnecting.set(key, false);
        
        // Exponential Backoff with Jitter
        const retries = this.retryCounts.get(key) || 0;
        const maxRetries = 10;
        
        if (retries < maxRetries) {
          // Base delay ranges: 1s, 2s, 4s, 8s, 16s, 30s max
          const baseDelay = Math.min(1000 * Math.pow(2, retries), 30000);
          // Add up to 30% jitter to prevent thundering herd
          const jitter = baseDelay * 0.3 * Math.random();
          const nextDelay = baseDelay + jitter;
          
          console.log(`[WSManager] Reconnecting ${key} in ${Math.round(nextDelay)}ms (Attempt ${retries + 1})`);
          
          this.retryCounts.set(key, retries + 1);
          const timer = setTimeout(() => this.connect(type, url, threadId), nextDelay);
          this.reconnectTimers.set(key, timer);
        } else {
          console.error(`[WSManager] Max retries reached for ${key}. Giving up.`);
        }
      };

      socket.onerror = (error) => {
        console.error(`[WSManager] Error in ${key}`, error);
        socket.close();
      };

      this.sockets.set(key, socket);
    }, 100);

    this.connectionTimers.set(key, timer);
  }

  public disconnect(type: WebSocketType, threadId?: string) {
    const key = type === 'chat' && threadId ? `chat_${threadId}` : 'notification';
    
    if (this.reconnectTimers.has(key)) {
      clearTimeout(this.reconnectTimers.get(key)!);
      this.reconnectTimers.delete(key);
    }

    if (this.connectionTimers.has(key)) {
      clearTimeout(this.connectionTimers.get(key)!);
      this.connectionTimers.delete(key);
    }

    const socket = this.sockets.get(key);
    if (socket) {
      socket.onclose = null; // Prevent reconnect loop
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
      this.sockets.delete(key);
      console.log(`[WSManager] Disconnected ${key}`);
    }
    
    this.isConnecting.set(key, false);
    this.retryCounts.set(key, 0); // Reset retries on manual disconnect
    
    if (type === 'chat' && this.activeThreadId === threadId) {
      this.activeThreadId = null;
    }
  }

  public sendMessage(threadId: string, content: string) {
    const socket = this.sockets.get(`chat_${threadId}`);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'message', message: content }));
    }
  }

  public sendTyping(threadId: string, isTyping: boolean) {
    const socket = this.sockets.get(`chat_${threadId}`);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'typing', is_typing: isTyping }));
    }
  }

  public sendReadReceipt(threadId: string, messageIds: string[]) {
    const socket = this.sockets.get(`chat_${threadId}`);
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'read_receipt', message_ids: messageIds }));
    }
  }

  private handleMessage(type: WebSocketType, data: any, threadId?: string) {
    const state = store.getState();
    const currentUserId = state.auth.user?.id;

    switch (data.type) {
      case 'notification':
        store.dispatch(addNotification(data.data));
        break;
      
      case 'new_message':
        const msgThreadId = data.data.thread;
        const isActiveThread = this.activeThreadId === msgThreadId;
        
        if (data.data.sender.id !== currentUserId) {
          store.dispatch(addMessage({ 
            threadId: msgThreadId, 
            message: data.data, 
            isMine: false 
          }));
          
          if (isActiveThread) {
             this.sendReadReceipt(msgThreadId, [data.data.id]);
          }
        }
        break;
        
      case 'typing':
        if (threadId) {
          store.dispatch(setTyping({ threadId, userId: data.user_id, isTyping: data.is_typing }));
        }
        break;
        
      case 'read':
        if (threadId) {
          store.dispatch(markMessagesRead({ threadId, messageIds: data.message_ids }));
        }
        break;
    }
  }
}

export default WebSocketManager.getInstance();
