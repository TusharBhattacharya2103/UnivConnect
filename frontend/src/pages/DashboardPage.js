import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, Layers, GraduationCap, CheckCircle, AlertCircle, Megaphone, Crown } from 'lucide-react';

const getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

function AnnouncementCard({ a }) {
  const borderColor = { high: 'var(--red)', medium: 'var(--amber)', low: 'var(--blue)' }[a.priority] || 'var(--border)';
  const badge = { high: 'badge-red', medium: 'badge-amber', low: 'badge-blue' }[a.priority] || 'badge-muted';
  return (
    <div className="card card-sm mb-2" style={{ borderLeft: `3px solid ${borderColor}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>{a.title}</span>
            <span className={`badge ${badge}`}>{a.priority}</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>{a.content}</p>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
            By {a.author?.name} · {new Date(a.createdAt).toLocaleDateString()}
          </div>
        </div>
        {a.pinned && <span style={{ fontSize: 14, flexShrink: 0 }}>📌</span>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [user]);

  const fetchData = async () => {
    try {
      if (user.role === 'dean') {
        const { data: stats } = await axios.get('/api/dean/stats');
        setData(stats);
      } else if (user.role === 'professor') {
        const [g, a] = await Promise.all([
          axios.get('/api/professors/my-groups'),
          axios.get('/api/announcements'),
        ]);
        setData({ groups: g.data, announcements: a.data.slice(0, 4) });
      } else {
        const [g, p, a] = await Promise.all([
          axios.get('/api/groups/my-group'),
          axios.get('/api/professors'),
          axios.get('/api/announcements'),
        ]);
        setData({ group: g.data, professors: p.data, announcements: a.data.slice(0, 4) });
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="loading-center">
      <div className="spinner" />
    </div>
  );

  return (
    <div className="page-root">
      <div className="page-header">
        <div>
          <h2>Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 3 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
      <div className="page-body">
        {user.role === 'dean' && <DeanDashboard data={data} navigate={navigate} />}
        {user.role === 'professor' && <ProfessorDashboard data={data} navigate={navigate} />}
        {user.role === 'student' && <StudentDashboard data={data} navigate={navigate} />}
      </div>
    </div>
  );
}

function DeanDashboard({ data, navigate }) {
  if (!data) return null;
  const stats = [
    { label: 'Total Students', value: data.totalStudents, icon: GraduationCap, color: 'var(--accent)', bg: 'var(--accent-dim)' },
    { label: 'Professors', value: data.totalProfessors, icon: Users, color: 'var(--green)', bg: 'var(--green-dim)' },
    { label: 'Active Groups', value: data.totalGroups, icon: Layers, color: 'var(--amber)', bg: 'var(--amber-dim)' },
    { label: 'Enrolled', value: data.enrolledGroups, icon: CheckCircle, color: 'var(--blue)', bg: 'var(--blue-dim)' },
  ];
  return (
    <>
      <div className="grid grid-4 mb-6">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ width: 38, height: 38, background: s.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {data.pendingGroups > 0 && (
        <div style={{ background: 'var(--amber-dim)', border: '1px solid rgba(245,166,35,0.25)', borderRadius: 'var(--radius)', padding: '13px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <AlertCircle size={17} color="var(--amber)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 14, color: 'var(--amber)', flex: 1 }}>
            <strong>{data.pendingGroups}</strong> group(s) pending enrollment approval
          </span>
          <button className="btn btn-sm" onClick={() => navigate('/groups')} style={{ background: 'var(--amber)', color: '#111', border: 'none' }}>
            View Groups
          </button>
        </div>
      )}

      <h3 style={{ marginBottom: 14 }}>Recent Groups</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(data.recentGroups || []).map(g => (
          <div key={g._id} className="card card-sm" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: 'var(--bg-4)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Layers size={16} color="var(--text-3)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {g.leader?.name}{g.professor ? ` · ${g.professor.name}` : ''}
              </div>
            </div>
            <span className={`badge badge-${g.enrollmentStatus === 'enrolled' ? 'green' : g.enrollmentStatus === 'pending_approval' ? 'amber' : 'muted'}`}>
              {g.enrollmentStatus.replace('_', ' ')}
            </span>
          </div>
        ))}
        {(!data.recentGroups || data.recentGroups.length === 0) && (
          <div className="empty-state" style={{ padding: 32 }}>
            <Layers size={36} />
            <p style={{ color: 'var(--text-2)', fontSize: 14 }}>No groups created yet</p>
          </div>
        )}
      </div>
    </>
  );
}

function ProfessorDashboard({ data, navigate }) {
  if (!data) return null;
  const enrolled = data.groups?.filter(g => g.enrollmentStatus === 'enrolled') || [];
  const pending = data.groups?.filter(g => g.enrollmentStatus === 'pending_approval') || [];
  const totalStudents = enrolled.reduce((s, g) => s + (g.members?.length || 0), 0);

  return (
    <>
      <div className="grid grid-3 mb-6">
        {[
          { label: 'Enrolled Groups', value: enrolled.length, color: 'var(--green)' },
          { label: 'Pending Approval', value: pending.length, color: 'var(--amber)' },
          { label: 'Total Students', value: totalStudents, color: 'var(--accent)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <div style={{ background: 'var(--amber-dim)', border: '1px solid rgba(245,166,35,0.25)', borderRadius: 'var(--radius)', padding: '13px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <AlertCircle size={17} color="var(--amber)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 14, color: 'var(--amber)', flex: 1 }}>
            <strong>{pending.length}</strong> enrollment request(s) awaiting your review
          </span>
          <button className="btn btn-sm" onClick={() => navigate('/my-groups')} style={{ background: 'var(--amber)', color: '#111', border: 'none' }}>
            Review
          </button>
        </div>
      )}

      <h3 style={{ marginBottom: 14 }}>My Groups</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
        {(data.groups || []).slice(0, 6).map(g => (
          <div key={g._id} className="card card-sm" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{g.members?.length || 0} members · {g.projectType}</div>
            </div>
            <span className={`badge badge-${g.enrollmentStatus === 'enrolled' ? 'green' : g.enrollmentStatus === 'pending_approval' ? 'amber' : 'muted'}`}>
              {g.enrollmentStatus.replace('_', ' ')}
            </span>
          </div>
        ))}
        {(!data.groups || data.groups.length === 0) && (
          <div className="empty-state" style={{ padding: 32 }}>
            <Layers size={36} />
            <p style={{ color: 'var(--text-2)', fontSize: 14 }}>No groups yet</p>
          </div>
        )}
      </div>

      {data.announcements?.length > 0 && (
        <>
          <h3 style={{ marginBottom: 14 }}>Announcements</h3>
          {data.announcements.map(a => <AnnouncementCard key={a._id} a={a} />)}
        </>
      )}
    </>
  );
}

function StudentDashboard({ data, navigate }) {
  if (!data) return null;
  const { group, professors, announcements } = data;
  const available = (professors || []).filter(p => p.profile?.acceptingStudents);

  return (
    <>
      {/* Group status */}
      {group ? (
        <div className="card mb-6" style={{
          borderColor: group.enrollmentStatus === 'enrolled' ? 'rgba(34,211,160,0.3)' : 'var(--border)',
          background: group.enrollmentStatus === 'enrolled' ? 'linear-gradient(135deg, rgba(34,211,160,0.06) 0%, transparent 60%)' : 'var(--surface)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                <h3>{group.name}</h3>
                <span className={`badge badge-${group.enrollmentStatus === 'enrolled' ? 'green' : group.enrollmentStatus === 'pending_approval' ? 'amber' : 'muted'}`}>
                  {group.enrollmentStatus.replace('_', ' ')}
                </span>
              </div>
              {group.projectTitle && <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 8 }}>{group.projectTitle}</p>}
              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-3)', flexWrap: 'wrap' }}>
                <span>{group.members?.length || 0} members</span>
                {group.professor && <span>· Prof. {group.professor.name}</span>}
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/my-group')}>View Group →</button>
          </div>
        </div>
      ) : (
        <div className="card mb-6" style={{ borderStyle: 'dashed', background: 'transparent', textAlign: 'center', padding: '36px 24px' }}>
          <Layers size={32} style={{ margin: '0 auto 12px', color: 'var(--text-3)' }} />
          <h3 style={{ marginBottom: 8 }}>You're not in a group yet</h3>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginBottom: 20 }}>Create a group with classmates, then enroll under a professor</p>
          <button className="btn btn-primary" onClick={() => navigate('/my-group')}>Create Group</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-3 mb-6">
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--accent)' }}>{available.length}</div>
          <div className="stat-label">Available Professors</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--green)' }}>{group?.members?.length || 0}</div>
          <div className="stat-label">Group Members</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: 'var(--amber)' }}>{announcements?.length || 0}</div>
          <div className="stat-label">Announcements</div>
        </div>
      </div>

      {/* Quick professors */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3>Available Professors</h3>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/professors')}>View all →</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
        {available.slice(0, 3).map(p => {
          const cap = p.profile?.currentStudents || 0;
          const max = p.profile?.maxStudents || 50;
          const pct = Math.min(100, Math.round((cap / max) * 100));
          return (
            <div key={p._id} className="card card-sm" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="avatar avatar-sm" style={{ background: 'var(--green-dim)', color: 'var(--green)', flexShrink: 0 }}>
                {getInitials(p.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{p.department}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>{cap}/{max}</div>
                <div className="capacity-bar" style={{ width: 72 }}>
                  <div className="capacity-fill" style={{ width: `${pct}%`, background: pct > 80 ? 'var(--red)' : pct > 60 ? 'var(--amber)' : 'var(--green)' }} />
                </div>
              </div>
            </div>
          );
        })}
        {available.length === 0 && (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>No professors accepting students right now</div>
        )}
      </div>

      {/* Announcements */}
      {announcements?.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3>Recent Announcements</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/announcements')}>View all →</button>
          </div>
          {announcements.map(a => <AnnouncementCard key={a._id} a={a} />)}
        </>
      )}
    </>
  );
}
