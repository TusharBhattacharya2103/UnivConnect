import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { BookOpen, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 16px',
      position: 'relative',
      overflowY: 'auto',
    }}>

      {/* Background */}
      <div style={{
        position: 'fixed', top: '-20%', right: '-10%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,106,245,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'fixed', bottom: '-20%', left: '-10%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,211,160,0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 56, height: 56,
            background: 'var(--accent-dim)',
            borderRadius: 16,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(124,106,245,0.3)',
            marginBottom: 14
          }}>
            <BookOpen size={26} color="var(--accent)" />
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.7rem',
            marginBottom: 4
          }}>
            UnivConnect
          </h1>

          <p style={{ color: 'var(--text-2)', fontSize: 13 }}>
            Sign in to your university portal
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '28px 24px'
        }}>

          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}>

            {/* Email */}
            <div>
              <label style={{
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--text-2)',
                marginBottom: 4,
                display: 'block'
              }}>
                Email address
              </label>

              <input
                type="email"
                placeholder="you@university.edu"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--bg-3)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 13,
                  outline: 'none'
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label style={{
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--text-2)',
                marginBottom: 4,
                display: 'block'
              }}>
                Password
              </label>

              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 12px',
                    background: 'var(--bg-3)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 13,
                    outline: 'none'
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-3)'
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                width: '100%',
                padding: '11px',
                borderRadius: 8,
                background: '#7c6af5',
                color: '#fff',
                border: 'none',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Accounts */}
          <div style={{
            marginTop: 20,
            padding: 12,
            background: 'var(--bg-3)',
            borderRadius: 8,
            border: '1px solid var(--border)'
          }}>
            <p style={{
              fontSize: 11,
              color: 'var(--text-3)',
              marginBottom: 8,
              fontWeight: 600
            }}>
              DEMO ACCOUNTS
            </p>

            {[
              { role: 'Dean', email: 'dean@univ.edu', pass: 'dean123', color: '#f54baf' },
              { role: 'Professor', email: 'prof@univ.edu', pass: 'prof123', color: '#22d3a0' },
              { role: 'Student', email: 'student@univ.edu', pass: 'student123', color: '#7c6af5' },
            ].map(d => (
              <button
                key={d.role}
                onClick={() => setForm({ email: d.email, password: d.pass })}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '6px 6px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 6
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: d.color }}>
                  {d.role}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                  {d.email}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ marginTop: 18, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 8 }}>
            Don't have an account yet?
          </p>

          <Link
            to="/register"
            style={{
              display: 'inline-block',
              padding: '10px 16px',
              border: '1px solid #7c6af5',
              borderRadius: 8,
              color: '#7c6af5',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 13
            }}
          >
            Create New Account
          </Link>
        </div>

      </div>
    </div>
  );
}