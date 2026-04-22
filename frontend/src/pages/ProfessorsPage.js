import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Search, Users, Send, ChevronDown, ChevronUp } from 'lucide-react';

const getInitials = (n = '') => n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();

export default function ProfessorsPage() {
  const { user } = useAuth();
  const [professors, setProfessors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [myGroup, setMyGroup] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [enrollingId, setEnrollingId] = useState(null);

  useEffect(() => {
    fetchProfessors();
    if (user.role === 'student') fetchMyGroup();
  }, []);

  const fetchProfessors = async () => {
    try {
      const { data } = await axios.get('/api/professors');
      setProfessors(data);
    } catch { toast.error('Failed to load professors'); }
    finally { setLoading(false); }
  };

  const fetchMyGroup = async () => {
    try {
      const { data } = await axios.get('/api/groups/my-group');
      setMyGroup(data);
    } catch {}
  };

  const enroll = async (professorId) => {
    if (!myGroup) return toast.error('Create a group first');
    if (myGroup.enrollmentStatus === 'enrolled') return toast.error('Already enrolled');
    setEnrollingId(professorId);
    try {
      await axios.post('/api/groups/enroll', { groupId: myGroup._id, professorId });
      toast.success('Enrollment request sent!');
      fetchMyGroup();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setEnrollingId(null); }
  };

  const filtered = professors.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.department?.toLowerCase().includes(search.toLowerCase()) ||
    p.profile?.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-root">
      <div className="page-header">
        <div>
          <h2>Professors</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 3 }}>{professors.length} faculty members</p>
        </div>
        <div style={{ position: 'relative', width: 260, flexShrink: 0 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
          <input className="input" placeholder="Search professors..." style={{ paddingLeft: 34 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="page-body">
        {user.role === 'student' && myGroup && myGroup.enrollmentStatus === 'forming' && (
          <div style={{ background: 'var(--accent-dim)', border: '1px solid rgba(124,106,245,0.2)', borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 20, fontSize: 14, color: 'var(--accent)' }}>
            Your group <strong>"{myGroup.name}"</strong> has {myGroup.members?.length} member(s). Click "Request Enrollment" on a professor to apply.
          </div>
        )}

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><Users size={48} /><h3>No professors found</h3></div>
        ) : (
          <div className="grid grid-2" style={{ alignItems: 'start' }}>
            {filtered.map(prof => {
              const cap = prof.profile?.currentStudents || 0;
              const max = prof.profile?.maxStudents || 50;
              const pct = Math.min(100, Math.round((cap / max) * 100));
              const isFull = cap >= max;
              const isExpanded = expandedId === prof._id;
              const isMyProf = myGroup?.professor?.toString() === prof._id || myGroup?.professor?._id === prof._id;

              return (
                <div key={prof._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13 }}>
                    <div className="avatar avatar-lg" style={{ background: 'var(--green-dim)', color: 'var(--green)', flexShrink: 0 }}>
                      {getInitials(prof.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prof.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prof.department || '—'}</div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {!prof.profile?.acceptingStudents && <span className="badge badge-red">Closed</span>}
                        {prof.profile?.acceptingStudents && !isFull && <span className="badge badge-green">Accepting</span>}
                        {isFull && <span className="badge badge-amber">Full</span>}
                        {prof.profile?.projectTypes?.slice(0, 2).map(t => (
                          <span key={t} className="badge badge-muted">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Capacity */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)', marginBottom: 5 }}>
                      <span>Student capacity</span>
                      <span style={{ fontWeight: 500, color: isFull ? 'var(--red)' : 'var(--text-2)' }}>{cap}/{max}</span>
                    </div>
                    <div className="capacity-bar">
                      <div className="capacity-fill" style={{ width: `${pct}%`, background: pct > 80 ? 'var(--red)' : pct > 60 ? 'var(--amber)' : 'var(--green)' }} />
                    </div>
                  </div>

                  {/* Group size */}
                  <div style={{ background: 'var(--bg-3)', padding: '8px 12px', borderRadius: 8, fontSize: 12, color: 'var(--text-3)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span>👥 Group: {prof.profile?.minGroupSize || 3}–{prof.profile?.maxGroupSize || 5} students</span>
                    {prof.profile?.officeHours && <span>⏰ {prof.profile.officeHours}</span>}
                  </div>

                  {/* Expand */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : prof._id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: 'var(--text-3)', fontSize: 13, cursor: 'pointer', padding: 0 }}
                  >
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {isExpanded ? 'Less info' : 'More info'}
                  </button>

                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {prof.profile?.specialization && (
                        <div style={{ fontSize: 13 }}><span style={{ color: 'var(--text-3)' }}>Specialization: </span>{prof.profile.specialization}</div>
                      )}
                      {prof.profile?.bio && (
                        <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.55 }}>{prof.profile.bio}</p>
                      )}
                      <div style={{ fontSize: 13 }}><span style={{ color: 'var(--text-3)' }}>Email: </span><span style={{ color: 'var(--accent)' }}>{prof.email}</span></div>
                    </div>
                  )}

                  {/* Enroll (students only) */}
                  {user.role === 'student' && (
                    <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                      {isMyProf ? (
                        <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                          ✓ Your group is enrolled here
                        </div>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm w-full"
                          disabled={
                            !prof.profile?.acceptingStudents ||
                            isFull ||
                            !myGroup ||
                            !['forming'].includes(myGroup?.enrollmentStatus) ||
                            enrollingId === prof._id
                          }
                          onClick={() => enroll(prof._id)}
                        >
                          <Send size={13} />
                          {enrollingId === prof._id
                            ? 'Sending...'
                            : !myGroup
                              ? 'Create group first'
                              : myGroup.enrollmentStatus !== 'forming'
                                ? 'Already applied'
                                : 'Request Enrollment'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
