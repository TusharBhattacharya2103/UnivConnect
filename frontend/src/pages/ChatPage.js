import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { Send, MessageSquare, Search, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const getInitials = (n = '') => n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
const roleColors = { dean: '#f54baf', professor: '#22d3a0', student: '#7c6af5' };

function getRoomName(room, user) {
  if (room.type === 'direct') {
    const other = room.participants?.find(p => p._id !== user._id);
    return other?.name || 'Direct Message';
  }
  return room.name || 'Group Chat';
}

export default function ChatPage() {
  const { user } = useAuth();
  const { joinRoom, leaveRoom, on, onlineUsers } = useSocket();
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState([]);
  const [search, setSearch] = useState('');
  const [requesting, setRequesting] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  // Track which message IDs we've already added to avoid duplicates
  const seenMsgIds = useRef(new Set());
  const activeRoomRef = useRef(null);

  useEffect(() => { fetchRooms(); }, []);

  // Keep ref in sync with state for use in socket callbacks
  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  useEffect(() => {
    if (!on) return;
    const u1 = on('new_message', (msg) => {
      const currentRoom = activeRoomRef.current;
      if (msg.chatRoom === currentRoom?._id) {
        // Avoid duplicate: if we sent it ourselves via REST, it's already in state
        if (!seenMsgIds.current.has(msg._id)) {
          seenMsgIds.current.add(msg._id);
          setMessages(prev => [...prev, msg]);
        }
      }
      setRooms(prev =>
        prev
          .map(r => r._id === msg.chatRoom ? { ...r, lastMessage: msg, lastActivity: msg.createdAt } : r)
          .sort((a, b) => new Date(b.lastActivity || 0) - new Date(a.lastActivity || 0))
      );
    });
    const u2 = on('user_typing', ({ userId, name, isTyping }) => {
      if (userId === user._id) return;
      setTyping(prev =>
        isTyping
          ? [...prev.filter(t => t.userId !== userId), { userId, name }]
          : prev.filter(t => t.userId !== userId)
      );
    });
    return () => { u1?.(); u2?.(); };
  }, [on, user._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchRooms = async () => {
    try {
      const { data } = await axios.get('/api/messages/rooms');
      setRooms(data);
    } catch { toast.error('Failed to load chats'); }
    finally { setLoading(false); }
  };

  const openRoom = async (room) => {
    if (activeRoomRef.current?._id === room._id) return;
    if (activeRoomRef.current) leaveRoom(activeRoomRef.current._id);
    setActiveRoom(room);
    joinRoom(room._id);
    setMessages([]);
    seenMsgIds.current = new Set();
    setTyping([]);
    setMsgsLoading(true);
    try {
      const { data } = await axios.get(`/api/messages/rooms/${room._id}`);
      // Seed seen IDs from loaded messages
      data.forEach(m => seenMsgIds.current.add(m._id));
      setMessages(data);
    } catch { toast.error('Failed to load messages'); }
    finally { setMsgsLoading(false); }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMsg = async () => {
    if (!input.trim() || !activeRoomRef.current || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);
    try {
      const { data: msg } = await axios.post('/api/messages/send', { roomId: activeRoomRef.current._id, content });
      // Add our own message immediately (socket will also fire but seenMsgIds prevents duplicate)
      seenMsgIds.current.add(msg._id);
      setMessages(prev => [...prev, msg]);
      setRooms(prev =>
        prev
          .map(r => r._id === msg.chatRoom ? { ...r, lastMessage: msg, lastActivity: msg.createdAt } : r)
          .sort((a, b) => new Date(b.lastActivity || 0) - new Date(a.lastActivity || 0))
      );
    } catch { toast.error('Failed to send'); setInput(content); }
    finally { setSending(false); }
  };

  const requestProfChat = async () => {
    setRequesting(true);
    try {
      const { data: g } = await axios.get('/api/groups/my-group');
      if (!g || g.enrollmentStatus !== 'enrolled') {
        toast.error('You must be enrolled under a professor first');
        return;
      }
      const { data: room } = await axios.post('/api/messages/rooms/professor-group', { groupId: g._id });
      // Refresh rooms list so the new room appears in the sidebar
      const { data: updatedRooms } = await axios.get('/api/messages/rooms');
      setRooms(updatedRooms);
      openRoom(room);
      toast.success('Group chat opened!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setRequesting(false); }
  };

  const filteredRooms = rooms.filter(r =>
    getRoomName(r, user).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Page Header */}
      <div className="page-header" style={{ position: 'relative', top: 'unset' }}>
        <div>
          <h2>Messages</h2>
        </div>
        {(user.role === 'student' || user.role === 'professor') && (
          <button className="btn btn-primary btn-sm" onClick={requestProfChat} disabled={requesting}>
            <Plus size={14} />{requesting ? 'Opening...' : 'Open Group Chat'}
          </button>
        )}
      </div>

      {/* Chat Layout - fills remaining space */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Sidebar */}
        <div className="chat-sidebar">
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
              <input
                className="input"
                style={{ paddingLeft: 30, fontSize: 13, padding: '8px 10px 8px 30px' }}
                placeholder="Search chats..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div className="loading-center"><div className="spinner" /></div>
            ) : filteredRooms.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <MessageSquare size={30} />
                <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No chats yet</p>
              </div>
            ) : filteredRooms.map(room => {
              const isActive = activeRoom?._id === room._id;
              const name = getRoomName(room, user);
              const other = room.type === 'direct' ? room.participants?.find(p => p._id !== user._id) : null;
              const isOnline = other ? onlineUsers?.has(other._id) : false;

              return (
                <div
                  key={room._id}
                  onClick={() => openRoom(room)}
                  style={{
                    padding: '11px 14px', cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                    background: isActive ? 'var(--accent-dim)' : 'transparent',
                    borderLeft: `3px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                    transition: 'background 0.12s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {other ? (
                        <div
                          className="avatar avatar-sm"
                          style={{ background: roleColors[other.role] + '20', color: roleColors[other.role] }}
                        >
                          {getInitials(other.name)}
                        </div>
                      ) : (
                        <div style={{
                          width: 32, height: 32,
                          background: room.type === 'professor_group' ? 'var(--green-dim)' : 'var(--accent-dim)',
                          borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
                        }}>
                          {room.type === 'professor_group' ? '👨‍🏫' : '#'}
                        </div>
                      )}
                      {isOnline && (
                        <span style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, background: 'var(--green)', borderRadius: '50%', border: '1.5px solid var(--bg-2)' }} />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isActive ? 'var(--accent)' : 'var(--text)' }}>
                        {name}
                      </div>
                      {room.lastMessage && (
                        <div style={{ fontSize: 11, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
                          {room.lastMessage.content}
                        </div>
                      )}
                    </div>

                    {room.lastActivity && (
                      <div style={{ fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>
                        {formatDistanceToNow(new Date(room.lastActivity), { addSuffix: false })
                          .replace('about ', '').replace(' minutes', 'm').replace(' hours', 'h')
                          .replace(' days', 'd').replace(' minute', 'm').replace(' hour', 'h').replace(' day', 'd')
                          .slice(0, 6)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main area */}
        <div className="chat-main">
          {!activeRoom ? (
            <div className="empty-state" style={{ flex: 1, height: '100%' }}>
              <MessageSquare size={48} />
              <h3 style={{ color: 'var(--text-2)' }}>Select a conversation</h3>
              <p style={{ fontSize: 14, color: 'var(--text-3)', maxWidth: 280 }}>
                Pick a chat from the sidebar to start messaging
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={{
                padding: '12px 20px', borderBottom: '1px solid var(--border)',
                background: 'var(--bg-2)', display: 'flex', alignItems: 'center', gap: 12,
                flexShrink: 0,
              }}>
                <div style={{
                  width: 34, height: 34, flexShrink: 0,
                  background: activeRoom.type === 'professor_group' ? 'var(--green-dim)' : 'var(--accent-dim)',
                  borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
                }}>
                  {activeRoom.type === 'direct' ? '💬' : activeRoom.type === 'professor_group' ? '👨‍🏫' : '#'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getRoomName(activeRoom, user)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {activeRoom.participants?.length} participants
                    {activeRoom.type === 'professor_group' ? ' · Private' : ''}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {msgsLoading ? (
                  <div className="loading-center"><div className="spinner" /></div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 13, padding: '40px 0' }}>
                    No messages yet. Say hello! 👋
                  </div>
                ) : messages.map((msg, i) => {
                  const isOwn = msg.sender?._id === user._id;
                  const prevSame = i > 0 && messages[i - 1]?.sender?._id === msg.sender?._id;
                  return (
                    <div key={msg._id} style={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', gap: 2 }}>
                      {!isOwn && !prevSame && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <div
                            className="avatar"
                            style={{ width: 20, height: 20, fontSize: 8, flexShrink: 0, background: roleColors[msg.sender?.role] + '20', color: roleColors[msg.sender?.role] }}
                          >
                            {getInitials(msg.sender?.name)}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: roleColors[msg.sender?.role] }}>
                            {msg.sender?.name}
                          </span>
                          <span className="badge" style={{ fontSize: 10, padding: '1px 6px', background: 'var(--bg-4)', color: 'var(--text-3)' }}>
                            {msg.sender?.role}
                          </span>
                        </div>
                      )}
                      <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
                        <div className="bubble-content">{msg.content}</div>
                        <div className="message-meta" style={{ textAlign: isOwn ? 'right' : 'left' }}>
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {typing.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 3, padding: '8px 12px', background: 'var(--bg-4)', borderRadius: 16 }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 5, height: 5, background: 'var(--text-3)', borderRadius: '50%', animation: `pulse 1s ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{typing[0]?.name} is typing...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="chat-input-area">
                <input
                  ref={inputRef}
                  className="input"
                  style={{ flex: 1, borderRadius: 'var(--radius)' }}
                  placeholder="Type a message..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                />
                <button
                  className="btn btn-primary"
                  onClick={sendMsg}
                  disabled={!input.trim() || sending}
                  style={{ padding: '10px 16px', flexShrink: 0 }}
                >
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
