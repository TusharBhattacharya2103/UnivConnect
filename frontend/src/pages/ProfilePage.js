import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Save, Settings } from 'lucide-react';

const getInitials = (n = '') => n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
const roleColors = { dean: '#f54baf', professor: '#22d3a0', student: '#7c6af5' };
const roleLabels = { dean: 'Dean', professor: 'Professor', student: 'Student' };

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', department: user?.department || '', rollNumber: user?.rollNumber || '' });
  const [profForm, setProfForm] = useState({ specialization: '', bio: '', minGroupSize: 3, maxGroupSize: 5, maxStudents: 50, acceptingStudents: true, officeHours: '', semester: '' });
  const [saving, setSaving] = useState(false);
  const [profSaving, setProfSaving] = useState(false);

  useEffect(() => {
    if (user?.role === 'professor') fetchProfProfile();
  }, [user]);

  const fetchProfProfile = async () => {
    try {
      const { data } = await axios.get(`/api/professors/${user._id}`);
      if (data.profile) {
        setProfForm({
          specialization: data.profile.specialization || '',
          bio: data.profile.bio || '',
          minGroupSize: data.profile.minGroupSize ?? 3,
          maxGroupSize: data.profile.maxGroupSize ?? 5,
          maxStudents: data.profile.maxStudents ?? 50,
          acceptingStudents: data.profile.acceptingStudents !== false,
          officeHours: data.profile.officeHours || '',
          semester: data.profile.semester || '',
        });
      }
    } catch {}
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const { data } = await axios.patch('/api/users/profile', form);
      updateUser(data);
      toast.success('Profile saved!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const saveProfProfile = async (e) => {
    e.preventDefault();
    if (profForm.minGroupSize > profForm.maxGroupSize) return toast.error('Min group size cannot exceed max');
    setProfSaving(true);
    try {
      await axios.patch('/api/professors/profile', profForm);
      toast.success('Settings saved!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setProfSaving(false); }
  };

  return (
    <div className="page-root">
      <div className="page-header">
        <h2>Profile</h2>
      </div>
      <div className="page-body" style={{ maxWidth: 680 }}>

        {/* Identity card */}
        <div className="card mb-6">
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
            <div
              className="avatar avatar-xl"
              style={{ background: roleColors[user?.role] + '20', color: roleColors[user?.role], flexShrink: 0 }}
            >
              {getInitials(user?.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</h3>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 6 }}>
                <span className={`badge badge-${user?.role === 'dean' ? 'pink' : user?.role === 'professor' ? 'green' : 'accent'}`}>
                  {roleLabels[user?.role]}
                </span>
                {user?.department && <span className="badge badge-muted">{user.department}</span>}
                {user?.rollNumber && <span className="badge badge-muted">{user.rollNumber}</span>}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{user?.email}</div>
            </div>
          </div>

          <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
              Basic Info
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: user?.role === 'student' ? '1fr 1fr 1fr' : '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="input" placeholder="e.g. Computer Science" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} />
              </div>
              {user?.role === 'student' && (
                <div className="form-group">
                  <label className="form-label">Roll Number</label>
                  <input className="input" placeholder="e.g. CS2021001" value={form.rollNumber} onChange={e => setForm(p => ({ ...p, rollNumber: e.target.value }))} />
                </div>
              )}
            </div>
            <div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Professor settings */}
        {user?.role === 'professor' && (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <Settings size={17} color="var(--accent)" />
              <h3 style={{ margin: 0 }}>Professor Settings</h3>
            </div>
            <form onSubmit={saveProfProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Specialization</label>
                <input className="input" placeholder="e.g. Machine Learning, Web Development" value={profForm.specialization} onChange={e => setProfForm(p => ({ ...p, specialization: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea className="textarea" placeholder="Brief description about yourself and your research interests..." value={profForm.bio} onChange={e => setProfForm(p => ({ ...p, bio: e.target.value }))} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Max Students</label>
                  <input className="input" type="number" min={1} max={500} value={profForm.maxStudents} onChange={e => setProfForm(p => ({ ...p, maxStudents: +e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Min Group Size</label>
                  <input className="input" type="number" min={1} max={20} value={profForm.minGroupSize} onChange={e => setProfForm(p => ({ ...p, minGroupSize: +e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Group Size</label>
                  <input className="input" type="number" min={1} max={20} value={profForm.maxGroupSize} onChange={e => setProfForm(p => ({ ...p, maxGroupSize: +e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Office Hours</label>
                  <input className="input" placeholder="e.g. Mon–Wed 2–4 PM" value={profForm.officeHours} onChange={e => setProfForm(p => ({ ...p, officeHours: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Semester</label>
                  <input className="input" placeholder="e.g. Even Sem 2024" value={profForm.semester} onChange={e => setProfForm(p => ({ ...p, semester: e.target.value }))} />
                </div>
              </div>

              {/* Accepting toggle */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                padding: '12px 14px', borderRadius: 'var(--radius-sm)',
                background: profForm.acceptingStudents ? 'var(--green-dim)' : 'var(--bg-3)',
                border: `1px solid ${profForm.acceptingStudents ? 'rgba(34,211,160,0.25)' : 'var(--border)'}`,
                transition: 'all 0.2s',
              }}>
                <input
                  type="checkbox"
                  checked={profForm.acceptingStudents}
                  onChange={e => setProfForm(p => ({ ...p, acceptingStudents: e.target.checked }))}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>Accepting students</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Toggle to open or close enrollment for this semester</div>
                </div>
                <span className={`badge badge-${profForm.acceptingStudents ? 'green' : 'red'}`}>
                  {profForm.acceptingStudents ? 'Open' : 'Closed'}
                </span>
              </label>

              <div>
                <button type="submit" className="btn btn-primary" disabled={profSaving}>
                  <Save size={14} /> {profSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
