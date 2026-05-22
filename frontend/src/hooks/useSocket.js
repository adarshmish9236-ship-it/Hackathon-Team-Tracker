// src/hooks/useSocket.js — Socket.IO hook
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useStore } from '../store/useStore';

let socketInstance = null;

export const useSocket = () => {
  const { user, currentTeam, setOnlineUsers } = useStore();

  useEffect(() => {
    if (!user) return;
    if (!socketInstance) {
      socketInstance = io('http://localhost:5000', {
        transports: ['websocket'],
        auth: { token: localStorage.getItem('ss_token') },
      });
    }
    if (currentTeam) {
      socketInstance.emit('join-team', {
        teamId: currentTeam.id,
        userId: user.id,
        username: user.username,
      });
      socketInstance.on('online-users', setOnlineUsers);
    }
    return () => {
      if (socketInstance && currentTeam) {
        socketInstance.off('online-users', setOnlineUsers);
      }
    };
  }, [user, currentTeam]);

  return socketInstance;
};

export const getSocket = () => socketInstance;
