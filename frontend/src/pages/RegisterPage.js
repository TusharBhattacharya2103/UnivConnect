import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { BookOpen } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', department: '', rollNumber: '' });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill required fields');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, position: 'relative', overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%', width: 600, height: 600,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,106,245,0.07) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: 460, animation: 'slideUp 0.3s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 52, height: 52, background: 'var(--accent-dim)', borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(124,106,245,0.3)', marginBottom: 14 }}>
            <BookOpen size={24} color="var(--accent)" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', marginBottom: 6 }}>Create Account</h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14 }}>Join your university's collaboration platform</p>
        </div>

        <div className="card" style={{ padding: '28px 28px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Role selector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {['student', 'professor'].map(r => (
                <button key={r} type="button" onClick={() => set('role', r)} style={{
                  padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid',
                  borderColor: form.role === r ? 'var(--accent)' : 'var(--border)',
                  background: form.role === r ? 'var(--accent-dim)' : 'var(--bg-3)',
                  color: form.role === r ? 'var(--accent)' : 'var(--text-2)',
                  cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
                  textTransform: 'capitalize'
                }}>
                  {r === 'student' ? '👨‍🎓' : '👨‍🏫'} {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Full name *</label>
              <input className="input" placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email address *</label>
              <input className="input" type="email" placeholder="you@university.edu" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input className="input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => set('password', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="input" placeholder="e.g. Computer Science" value={form.department} onChange={e => set('department', e.target.value)} />
              </div>
              {form.role === 'student' && (
                <div className="form-group">
                  <label className="form-label">Roll Number</label>
                  <input className="input" placeholder="e.g. CS2021001" value={form.rollNumber} onChange={e => set('rollNumber', e.target.value)} />
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ marginTop: 4, justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <div style={{ marginTop: 20, textAlign: 'center' }}>
  <p style={{ fontSize: 14, color: '#a0a0b0', marginBottom: 10 }}>Already have an account?</p>
  <Link
    to="/login"
    style={{
      display: 'block',
      padding: '10px 18px',
      border: '1px solid #7c6af5',
      borderRadius: '8px',
      color: '#7c6af5',
      textDecoration: 'none',
      fontWeight: 500,
      fontSize: 14,
      textAlign: 'center',
      transition: 'background 0.15s'
    }}
  >
    Sign In Instead
  </Link>
</div>
          <Link
            to="/login"
            className="btn btn-ghost w-full"
            style={{ justifyContent: 'center', borderColor: 'var(--accent)', color: 'var(--accent)' }}
          >
            Sign In Instead
          </Link>
        </div>
      </div>
    </div>
  );
}
