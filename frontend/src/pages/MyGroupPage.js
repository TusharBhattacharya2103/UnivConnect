import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Users, Plus, Search, Send, Crown, CheckCircle, XCircle, Layers, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const getInitials = (n = '') => n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();

export default function MyGroupPage() {
  const { user } = useAuth();
  return user.role === 'professor' ? <ProfessorGroups /> : <StudentGroup />;
}

function StudentGroup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => { fetchGroup(); }, []);

  const fetchGroup = async () => {
    try {
      const { data } = await axios.get('/api/groups/my-group');
      setGroup(data);
    } catch {}
    finally { setLoading(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>;

  return (
    <div className="page-root">
      <div className="page-header">
        <div>
          <h2>My Group</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 4 }}>
            {group ? `${group.members?.length} members • ${group.enrollmentStatus.replace('_', ' ')}` : 'Not in a group yet'}
          </p>
        </div>
        {!group && <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} />Create Group</button>}
        {group && group.leader?._id === user._id && group.members?.length < 5 && (
          <button className="btn btn-primary" onClick={() => setShowInvite(true)}><Plus size={16} />Invite Member</button>
        )}
      </div>

      <div className="page-body">
        {!group ? (
          <>
            <div className="empty-state" style={{ marginTop: 40 }}>
              <Layers size={56} style={{ color: 'var(--text-3)' }} />
              <h3>You are not in a group</h3>
              <p style={{ color: 'var(--text-2)', maxWidth: 360 }}>Create a group, invite classmates, then enroll under a professor to start your project.</p>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={16} />Create Group</button>
            </div>
          </>
        ) : (
          <div className="grid grid-2" style={{ alignItems: 'start', gap: 20 }}>
            <div>
              <div className="card mb-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, background: 'var(--accent-dim)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={22} color="var(--accent)" />
                  </div>
                  <div>
                    <h3 style={{ marginBottom: 4 }}>{group.name}</h3>
                    <span className={`badge badge-${group.enrollmentStatus === 'enrolled' ? 'green' : group.enrollmentStatus === 'pending_approval' ? 'amber' : 'muted'}`}>
                      {group.enrollmentStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                {group.projectTitle && <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 12 }}>{group.projectTitle}</p>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
                  <div style={{ background: 'var(--bg-3)', padding: '10px 12px', borderRadius: 8 }}>
                    <div style={{ color: 'var(--text-3)', fontSize: 11, marginBottom: 2 }}>PROJECT TYPE</div>
                    <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{group.projectType}</div>
                  </div>
                  {group.professor && (
                    <div style={{ background: 'var(--bg-3)', padding: '10px 12px', borderRadius: 8 }}>
                      <div style={{ color: 'var(--text-3)', fontSize: 11, marginBottom: 2 }}>PROFESSOR</div>
                      <div style={{ fontWeight: 500 }}>{group.professor.name}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <h4 style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={16} /> Members ({group.members?.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {group.members?.map(m => (
                  <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="avatar avatar-md" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                      {getInitials(m.name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{m.rollNumber || m.email}</div>
                    </div>
                    {group.leader?._id === m._id && <span className="badge badge-accent"><Crown size={11} /> Leader</span>}
                  </div>
                ))}
              </div>
              {group.enrollmentStatus === 'enrolled' && (
                <button className="btn btn-ghost btn-sm w-full" style={{ marginTop: 14, justifyContent: 'center' }} onClick={() => navigate('/chat')}>
                  <MessageSquare size={14} /> Open Group Chat
                </button>
              )}
            </div>
          </div>
        )}
        <PendingInvites onAccept={fetchGroup} />
      </div>

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={(g) => { setGroup(g); setShowCreate(false); }} />}
      {showInvite && group && <InviteModal group={group} onClose={() => setShowInvite(false)} onInvited={fetchGroup} />}
    </div>
  );
}

function PendingInvites({ onAccept }) {
  const [invites, setInvites] = useState([]);
  useEffect(() => { fetchInvites(); }, []);
  const fetchInvites = async () => {
    try {
      const { data } = await axios.get('/api/users/notifications');
      setInvites(data.filter(n => n.type === 'group_invite' && !n.read));
    } catch {}
  };
  const respond = async (groupId, action, notifId) => {
    try {
      await axios.post('/api/groups/respond-invite', { groupId, action });
      await axios.patch(`/api/users/notifications/${notifId}/read`);
      toast.success(action === 'accept' ? 'Joined group!' : 'Invite declined');
      fetchInvites();
      onAccept();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };
  if (invites.length === 0) return null;
  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ marginBottom: 14 }}>Group Invitations</h3>
      {invites.map(inv => (
        <div key={inv._id} className="card card-sm mb-2" style={{ background: 'var(--accent-dim)', borderColor: 'rgba(124,106,245,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 4 }}>{inv.message}</p>
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{new Date(inv.createdAt).toLocaleDateString()}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-success btn-sm" onClick={() => respond(inv.relatedId, 'accept', inv._id)}><CheckCircle size={14} /> Accept</button>
              <button className="btn btn-danger btn-sm" onClick={() => respond(inv.relatedId, 'reject', inv._id)}><XCircle size={14} /> Decline</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CreateGroupModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', projectTitle: '', projectType: 'major', semester: '' });
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Group name is required');
    setLoading(true);
    try {
      const { data } = await axios.post('/api/groups', form);
      toast.success('Group created!');
      onCreated(data);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 20 }}>Create New Group</h3>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group"><label className="form-label">Group Name *</label><input className="input" placeholder="e.g. Team Alpha" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Project Title</label><input className="input" placeholder="e.g. AI-based Traffic System" value={form.projectTitle} onChange={e => setForm(p => ({ ...p, projectTitle: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group"><label className="form-label">Project Type</label><select className="select" value={form.projectType} onChange={e => setForm(p => ({ ...p, projectType: e.target.value }))}><option value="major">Major</option><option value="minor">Minor</option><option value="research">Research</option><option value="other">Other</option></select></div>
            <div className="form-group"><label className="form-label">Semester</label><input className="input" placeholder="e.g. Sem 6 2024" value={form.semester} onChange={e => setForm(p => ({ ...p, semester: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" className="btn btn-ghost flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary flex-1" disabled={loading} style={{ justifyContent: 'center' }}>{loading ? 'Creating...' : 'Create Group'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InviteModal({ group, onClose, onInvited }) {
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(null);
  const searchStudents = async () => {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/users/students?search=${search}`);
      setStudents(data.filter(s => !group.members?.some(m => m._id === s._id)));
    } catch { toast.error('Search failed'); }
    finally { setLoading(false); }
  };
  const invite = async (studentId) => {
    setInviting(studentId);
    try {
      await axios.post('/api/groups/invite', { groupId: group._id, studentId, message: `You have been invited to join group "${group.name}"` });
      toast.success('Invitation sent!');
      onInvited();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setInviting(null); }
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 4 }}>Invite Member</h3>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>Capacity: {group.members?.length}/5 members</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input className="input" placeholder="Search by name, email or roll number..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchStudents()} />
          <button className="btn btn-primary" onClick={searchStudents} disabled={loading}><Search size={16} /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
          {students.map(s => (
            <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)' }}>
              <div className="avatar avatar-sm" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>{getInitials(s.name)}</div>
              <div style={{ flex: 1 }}><div style={{ fontWeight: 500, fontSize: 14 }}>{s.name}</div><div style={{ fontSize: 12, color: 'var(--text-3)' }}>{s.rollNumber || s.email}</div></div>
              <button className="btn btn-primary btn-sm" onClick={() => invite(s._id)} disabled={inviting === s._id}><Send size={13} />{inviting === s._id ? '...' : 'Invite'}</button>
            </div>
          ))}
          {students.length === 0 && search && !loading && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No students found</div>}
        </div>
        <button className="btn btn-ghost w-full" style={{ marginTop: 14, justifyContent: 'center' }} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function ProfessorGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    try {
      const { data } = await axios.get('/api/professors/my-groups');
      setGroups(data);
    } catch { toast.error('Failed to load groups'); }
    finally { setLoading(false); }
  };

  const review = async (groupId, action, notes) => {
    try {
      await axios.post('/api/professors/review-enrollment', { groupId, action, notes });
      toast.success(action === 'approve' ? 'Group enrolled!' : 'Request rejected');
      setReviewing(null);
      fetchGroups();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const filtered = filter === 'all' ? groups : groups.filter(g => g.enrollmentStatus === filter);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>My Groups</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 14, marginTop: 4 }}>{groups.length} total groups</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'pending_approval', 'enrolled'].map(f => (
            <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f.replace('_', ' ')}
              {f === 'pending_approval' && groups.filter(g => g.enrollmentStatus === 'pending_approval').length > 0 && (
                <span style={{ background: 'var(--amber)', color: '#111', borderRadius: 10, padding: '0 6px', fontSize: 11, marginLeft: 4 }}>
                  {groups.filter(g => g.enrollmentStatus === 'pending_approval').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="page-body">
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(group => (
              <div key={group._id} className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <h3 style={{ fontSize: 16 }}>{group.name}</h3>
                      <span className={`badge badge-${group.enrollmentStatus === 'enrolled' ? 'green' : group.enrollmentStatus === 'pending_approval' ? 'amber' : 'muted'}`}>{group.enrollmentStatus.replace('_', ' ')}</span>
                      <span className="badge badge-blue">{group.projectType}</span>
                    </div>
                    {group.projectTitle && <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 10 }}>{group.projectTitle}</p>}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {group.members?.map(m => (
                        <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-3)', padding: '4px 10px', borderRadius: 20, fontSize: 12 }}>
                          <div className="avatar" style={{ width: 20, height: 20, fontSize: 9, background: 'var(--accent-dim)', color: 'var(--accent)' }}>{getInitials(m.name)}</div>
                          {m.name}
                          {group.leader?._id === m._id && <Crown size={11} color="var(--amber)" />}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {group.enrollmentStatus === 'pending_approval' && (
                      <>
                        <button className="btn btn-success btn-sm" onClick={() => review(group._id, 'approve', '')}><CheckCircle size={14} /> Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setReviewing({ group })}><XCircle size={14} /> Reject</button>
                      </>
                    )}
                    {group.enrollmentStatus === 'enrolled' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/chat')}><MessageSquare size={14} /> Chat</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="empty-state"><Layers size={48} /><h3>No groups</h3><p style={{ color: 'var(--text-2)' }}>Students will request to enroll under you</p></div>
            )}
          </div>
        )}
      </div>
      {reviewing && (
        <div className="modal-overlay" onClick={() => setReviewing(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 8 }}>Reject Enrollment</h3>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 16 }}>Group: <strong>{reviewing.group.name}</strong></p>
            <div className="form-group" style={{ marginBottom: 16 }}><label className="form-label">Reason (optional)</label><textarea className="textarea" placeholder="Provide a reason..." id="reject-notes" /></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost flex-1" onClick={() => setReviewing(null)}>Cancel</button>
              <button className="btn btn-danger flex-1" style={{ justifyContent: 'center' }} onClick={() => review(reviewing.group._id, 'reject', document.getElementById('reject-notes').value)}>Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
