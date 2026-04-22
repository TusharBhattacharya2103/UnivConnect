import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Search, Layers, Crown } from 'lucide-react';

const getInitials = (n = '') => n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
const statusBadge = { forming: 'badge-muted', pending_approval: 'badge-amber', enrolled: 'badge-green', rejected: 'badge-red' };

export default function GroupsAdminPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    try {
      const { data } = await axios.get('/api/dean/groups');
      setGroups(data);
    } catch { toast.error('Failed to load groups'); }
    finally { setLoading(false); }
  };

  const statusCount = s => groups.filter(g => g.enrollmentStatus === s).length;

  const filtered = groups.filter(g => {
    const matchSearch =
      g.name?.toLowerCase().includes(search.toLowerCase()) ||
      g.leader?.name?.toLowerCase().includes(search.toLowerCase()) ||
      g.professor?.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || g.enrollmentStatus === filter;
    return matchSearch && matchFilter;
  });

  const filterTabs = [
    { key: 'all', label: 'All', count: groups.length },
    { key: 'forming', label: 'Forming', count: statusCount('forming') },
    { key: 'pending_approval', label: 'Pending', count: statusCount('pending_approval') },
    { key: 'enrolled', label: 'Enrolled', count: statusCount('enrolled') },
  ];

  return (
    <div className="page-root">
      <div className="page-header">
        <div>
          <h2>All Groups</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 3 }}>{groups.length} total groups</p>
        </div>
        <div style={{ position: 'relative', width: 240, flexShrink: 0 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
          <input className="input" placeholder="Search groups..." style={{ paddingLeft: 34 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="page-body">
        {/* Stats + filter tabs */}
        <div className="grid grid-4 mb-6">
          {filterTabs.map(t => (
            <div
              key={t.key}
              className="stat-card"
              style={{ cursor: 'pointer', borderColor: filter === t.key ? 'var(--accent)' : 'var(--border)', transition: 'border-color 0.15s' }}
              onClick={() => setFilter(t.key)}
            >
              <div className="stat-value" style={{ color: filter === t.key ? 'var(--accent)' : 'var(--text)', fontSize: '1.7rem' }}>{t.count}</div>
              <div className="stat-label">{t.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(group => (
              <div key={group._id} className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Title row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6, flexWrap: 'wrap' }}>
                      <div style={{ width: 34, height: 34, background: 'var(--bg-4)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Layers size={15} color="var(--text-3)" />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{group.name}</span>
                      <span className={`badge ${statusBadge[group.enrollmentStatus] || 'badge-muted'}`}>
                        {group.enrollmentStatus.replace('_', ' ')}
                      </span>
                      <span className="badge badge-blue">{group.projectType}</span>
                    </div>

                    {group.projectTitle && (
                      <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 8, marginLeft: 43 }}>{group.projectTitle}</p>
                    )}

                    {/* Meta */}
                    <div style={{ display: 'flex', gap: 14, fontSize: 13, color: 'var(--text-3)', flexWrap: 'wrap', marginBottom: 10, marginLeft: 43 }}>
                      {group.leader && <span>👑 {group.leader.name}</span>}
                      {group.professor && <span>👨‍🏫 {group.professor.name}</span>}
                      {group.semester && <span>📅 {group.semester}</span>}
                    </div>

                    {/* Members */}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 43 }}>
                      {group.members?.map(m => (
                        <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--bg-3)', padding: '3px 9px', borderRadius: 12, fontSize: 12 }}>
                          <div className="avatar" style={{ width: 18, height: 18, fontSize: 8, background: 'var(--accent-dim)', color: 'var(--accent)', flexShrink: 0 }}>
                            {getInitials(m.name)}
                          </div>
                          {m.name}
                          {group.leader?._id === m._id && <Crown size={10} color="var(--amber)" />}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {new Date(group.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="empty-state">
                <Layers size={44} />
                <h3>No groups found</h3>
                <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Try a different filter or search</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
