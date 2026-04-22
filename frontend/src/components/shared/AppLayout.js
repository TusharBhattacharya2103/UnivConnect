import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, Users, GraduationCap, MessageSquare,
  BookOpen, Bell, LogOut, User, Menu, X,
  Layers, Megaphone
} from 'lucide-react';

const getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
const roleColors = { dean: '#f54baf', professor: '#22d3a0', student: '#7c6af5' };
const roleBadge = {
  dean: { label: 'Dean', color: 'var(--pink)' },
  professor: { label: 'Professor', color: 'var(--green)' },
  student: { label: 'Student', color: 'var(--accent)' }
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { connected, on } = useSocket();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unread, setUnread] = useState(0);
  const [respondingInvite, setRespondingInvite] = useState(null);
  const notifRef = useRef(null);

  useEffect(() => { fetchNotifications(); }, []);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!on) return;
    const unsub = on('message_notification', () => setUnread(p => p + 1));
    return () => unsub && unsub();
  }, [on]);

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get('/api/users/notifications');
      setNotifications(data.slice(0, 12));
      setUnread(data.filter(n => !n.read).length);
    } catch {}
  };

  const markRead = async (id) => {
    try {
      await axios.patch(`/api/users/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const respondToInvite = async (notif, action) => {
    setRespondingInvite(notif._id);
    try {
      await axios.post('/api/groups/respond-invite', { groupId: notif.relatedId, action });
      await axios.patch(`/api/users/notifications/${notif._id}/read`);
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
      toast.success(action === 'accept' ? '🎉 Joined the group!' : 'Invitation declined');
      fetchNotifications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to respond');
    } finally {
      setRespondingInvite(null);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); toast.success('Logged out'); };

  const navLinks = {
    dean: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/groups', icon: Layers, label: 'All Groups' },
      { to: '/students', icon: GraduationCap, label: 'Students' },
      { to: '/professors', icon: Users, label: 'Professors' },
      { to: '/announcements', icon: Megaphone, label: 'Announcements' },
      { to: '/chat', icon: MessageSquare, label: 'Messages' },
    ],
    professor: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/my-groups', icon: Layers, label: 'My Groups' },
      { to: '/students', icon: GraduationCap, label: 'Students' },
      { to: '/announcements', icon: Megaphone, label: 'Announcements' },
      { to: '/chat', icon: MessageSquare, label: 'Messages' },
    ],
    student: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/professors', icon: Users, label: 'Find Professors' },
      { to: '/my-group', icon: Layers, label: 'My Group' },
      { to: '/announcements', icon: Megaphone, label: 'Announcements' },
      { to: '/chat', icon: MessageSquare, label: 'Messages' },
    ]
  };

  const links = navLinks[user?.role] || [];
  const rb = roleBadge[user?.role] || {};

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 99 }}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, background: 'var(--accent-dim)',
              borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(124,106,245,0.3)', flexShrink: 0
            }}>
              <BookOpen size={16} color="var(--accent)" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--text)', lineHeight: 1.2 }}>UnivConnect</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? 'var(--green)' : 'var(--red)', display: 'inline-block', flexShrink: 0 }} />
                {connected ? 'Live' : 'Offline'}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={16} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom user section */}
        <div style={{ padding: '10px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <NavLink to="/profile" className="nav-link" style={{ marginBottom: 2 }} onClick={() => setSidebarOpen(false)}>
            <User size={16} />
            <span>Profile</span>
          </NavLink>
          <button
            className="nav-link"
            style={{ color: 'var(--red)', marginBottom: 8 }}
            onClick={handleLogout}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
          <div style={{
            padding: '10px', background: 'var(--bg-3)',
            borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 10,
            border: '1px solid var(--border)'
          }}>
            <div
              className="avatar avatar-sm"
              style={{ background: roleColors[user?.role] + '22', color: roleColors[user?.role] }}
            >
              {getInitials(user?.name)}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: 11, color: rb.color, marginTop: 1 }}>{rb.label}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        {/* Top bar */}
        <div className="topbar">
          <button
            className="btn btn-icon btn-ghost hamburger"
            style={{ display: 'none' }}
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} />
          </button>
          <div style={{ flex: 1 }} />

          {/* Notifications */}
          <div style={{ position: 'relative' }} ref={notifRef}>
            <button
              className="btn btn-icon btn-ghost"
              style={{ position: 'relative' }}
              onClick={() => setShowNotifs(!showNotifs)}
            >
              <Bell size={17} />
              {unread > 0 && (
                <span style={{
                  position: 'absolute', top: 5, right: 5, width: 7, height: 7,
                  background: 'var(--red)', borderRadius: '50%', border: '1.5px solid var(--bg)'
                }} />
              )}
            </button>

            {showNotifs && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 340,
                background: 'var(--surface)', border: '1px solid var(--border-hover)',
                borderRadius: 'var(--radius-lg)', boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                zIndex: 200, overflow: 'hidden'
              }}>
                <div style={{
                  padding: '12px 16px', borderBottom: '1px solid var(--border)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
                  {unread > 0 && <span className="badge badge-accent">{unread} new</span>}
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                      No notifications yet
                    </div>
                  ) : notifications.map(n => (
                    <div
                      key={n._id}
                      style={{
                        padding: '12px 16px', borderBottom: '1px solid var(--border)',
                        background: n.read ? 'transparent' : 'var(--accent-dim)',
                      }}
                    >
                      <div
                        onClick={() => !n.read && n.type !== 'group_invite' && markRead(n._id)}
                        style={{ cursor: n.type !== 'group_invite' ? 'pointer' : 'default' }}
                      >
                        <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text)', marginBottom: 4 }}>{n.message}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: n.type === 'group_invite' && !n.read ? 8 : 0 }}>
                          {new Date(n.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {n.type === 'group_invite' && !n.read && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            className="btn btn-success btn-sm"
                            style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
                            disabled={respondingInvite === n._id}
                            onClick={() => respondToInvite(n, 'accept')}
                          >
                            {respondingInvite === n._id ? '...' : '✓ Accept'}
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
                            disabled={respondingInvite === n._id}
                            onClick={() => respondToInvite(n, 'reject')}
                          >
                            {respondingInvite === n._id ? '...' : '✗ Decline'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User chip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px 6px 8px',
            background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)'
          }}>
            <div
              className="avatar"
              style={{ width: 26, height: 26, fontSize: 10, background: roleColors[user?.role] + '22', color: roleColors[user?.role] }}
            >
              {getInitials(user?.name)}
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
              {user?.name?.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* Page content scrolls inside this */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
