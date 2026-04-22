import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (user && token) {
      const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      socketRef.current = socket;

      socket.on('connect', () => setConnected(true));
      socket.on('disconnect', () => setConnected(false));
      socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        setConnected(false);
      });
      socket.on('user_online', ({ userId, online }) => {
        setOnlineUsers(prev => {
          const next = new Set(prev);
          online ? next.add(userId) : next.delete(userId);
          return next;
        });
      });

      return () => {
        socket.disconnect();
        socketRef.current = null;
        setConnected(false);
      };
    }
  }, [user, token]);

  const joinRoom = useCallback((roomId) => {
    socketRef.current?.emit('join_room', roomId);
  }, []);

  const leaveRoom = useCallback((roomId) => {
    socketRef.current?.emit('leave_room', roomId);
  }, []);

  const sendMessage = useCallback((roomId, content) => {
    socketRef.current?.emit('send_message', { roomId, content });
  }, []);

  const emitTyping = useCallback((roomId, isTyping) => {
    socketRef.current?.emit('typing', { roomId, isTyping });
  }, []);

  // Stable `on` function - registers listener on the current socket
  const on = useCallback((event, cb) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on(event, cb);
    return () => socket.off(event, cb);
  }, [connected]); // re-run when connection state changes to pick up new socket

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, onlineUsers, joinRoom, leaveRoom, sendMessage, emitTyping, on }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
