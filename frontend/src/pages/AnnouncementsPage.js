import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Megaphone, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const priorityConfig = {
  high:   { border: 'var(--red)',   bg: 'var(--red-dim)',   badge: 'badge-red',   icon: '🔴' },
  medium: { border: 'var(--amber)', bg: 'var(--amber-dim)', badge: 'badge-amber', icon: '🟡' },
  low:    { border: 'var(--blue)',  bg: 'var(--blue-dim)',  badge: 'badge-blue',  icon: '🔵' },
};

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data } = await axios.get('/api/announcements');
      setAnnouncements(data);
    } catch { toast.error('Failed to load announcements'); }
    finally { setLoading(false); }
  };

  const deleteAnnouncement = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await axios.delete(`/api/announcements/${id}`);
      toast.success('Deleted');
      fetchAnnouncements();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="page-root">
      <div className="page-header">
        <div>
          <h2>Announcements</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 3 }}>{announcements.length} announcements</p>
        </div>
        {(user.role === 'dean' || user.role === 'professor') && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> New Announcement
          </button>
        )}
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div style={{ maxWidth: 740, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {announcements.map(a => {
              const pc = priorityConfig[a.priority] || priorityConfig.medium;
              return (
                <div key={a._id} className="card" style={{ borderLeft: `3px solid ${pc.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {/* Icon */}
                    <div style={{ width: 40, height: 40, background: pc.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Megaphone size={17} color={pc.border} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', flex: 1 }}>
                          <span style={{ fontWeight: 600, fontSize: 15 }}>{a.title}</span>
                          {a.pinned && <span style={{ fontSize: 14 }}>📌</span>}
                          <span className={`badge ${pc.badge}`}>{a.priority}</span>
                          <span className="badge badge-muted">{a.targetAudience}</span>
                        </div>
                        {user.role === 'dean' && (
                          <button
                            className="btn btn-icon btn-danger btn-sm"
                            onClick={() => deleteAnnouncement(a._id)}
                            style={{ flexShrink: 0 }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 10 }}>{a.content}</p>

                      <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span>By {a.author?.name}</span>
                        <span>·</span>
                        <span>{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
                        {a.expiresAt && <><span>·</span><span>Expires {new Date(a.expiresAt).toLocaleDateString()}</span></>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {announcements.length === 0 && (
              <div className="empty-state">
                <Megaphone size={44} />
                <h3>No announcements</h3>
                <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Announcements from the dean and professors appear here</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchAnnouncements(); }} />
      )}
    </div>
  );
}

function CreateModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', content: '', targetAudience: 'all', priority: 'medium', pinned: false });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return toast.error('Title and content required');
    setLoading(true);
    try {
      await axios.post('/api/announcements', form);
      toast.success('Announcement posted!');
      onCreated();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>New Announcement</h3>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="input" placeholder="Announcement title" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Content *</label>
            <textarea className="textarea" placeholder="Write your announcement..." value={form.content} onChange={e => set('content', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Audience</label>
              <select className="select" value={form.targetAudience} onChange={e => set('targetAudience', e.target.value)}>
                <option value="all">Everyone</option>
                <option value="students">Students only</option>
                <option value="professors">Professors only</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="select" value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 14, cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={form.pinned} onChange={e => set('pinned', e.target.checked)} />
            Pin this announcement
          </label>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-ghost flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary flex-1" disabled={loading}>{loading ? 'Posting...' : 'Post Announcement'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
