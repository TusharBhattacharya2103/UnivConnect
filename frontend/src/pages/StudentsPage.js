import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Search, GraduationCap } from 'lucide-react';

const getInitials = (n = '') => n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();

export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    user.role === 'dean' ? fetchDeanStudents() : fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data } = await axios.get('/api/users/students');
      setStudents(data);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  };

  const fetchDeanStudents = async () => {
    try {
      const { data } = await axios.get('/api/dean/users?role=student');
      setStudents(data);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  };

  const toggleStatus = async (id) => {
    try {
      const { data } = await axios.patch(`/api/dean/users/${id}/toggle-status`);
      toast.success(data.message);
      fetchDeanStudents();
    } catch { toast.error('Failed'); }
  };

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase()) ||
    s.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
    s.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-root">
      <div className="page-header">
        <div>
          <h2>Students</h2>
          <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 3 }}>{students.length} registered students</p>
        </div>
        <div style={{ position: 'relative', width: 260, flexShrink: 0 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
          <input className="input" placeholder="Search students..." style={{ paddingLeft: 34 }} value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>
      <div className="page-body">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll No.</th>
                  <th>Department</th>
                  <th>Email</th>
                  {user.role === 'dean' && <th>Status</th>}
                  {user.role === 'dean' && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', flexShrink: 0 }}>
                          {getInitials(s.name)}
                        </div>
                        <span style={{ fontWeight: 500 }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{s.rollNumber || '—'}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{s.department || '—'}</td>
                    <td style={{ color: 'var(--text-3)', fontSize: 13 }}>{s.email}</td>
                    {user.role === 'dean' && (
                      <td>
                        <span className={`badge badge-${s.isActive ? 'green' : 'red'}`}>
                          {s.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                    )}
                    {user.role === 'dean' && (
                      <td>
                        <button
                          className={`btn btn-sm ${s.isActive ? 'btn-danger' : 'btn-success'}`}
                          onClick={() => toggleStatus(s._id)}
                        >
                          {s.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={user.role === 'dean' ? 6 : 4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>
                      <GraduationCap size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
                      No students found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
