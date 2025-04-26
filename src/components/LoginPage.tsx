import React from 'react';
import { Palmtree, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginPageProps {
  onAuthSuccess?: () => void;
}

const LoginPage = ({ onAuthSuccess }: LoginPageProps) => {
  const [isLogin, setIsLogin] = React.useState(true);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = isLogin
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

      if (error) throw error;

      if (data.user) {
        onAuthSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="logo-container">
          <Palmtree size={32} className="logo-icon" />
          <span className="logo-text">Tree</span>
        </div>
        <h2 className="tagline">Ask anything. Watch your data come to life...</h2>
      </div>
      <div className="login-right">
        <div className="login-content">
          <h1>Get Started</h1>
          <form onSubmit={handleAuth} className="auth-form">
            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? <Loader2 className="spin" size={20} /> : (isLogin ? 'Login' : 'Sign Up')}
            </button>
          </form>
          <button 
            className="switch-mode" 
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
          </button>
        </div>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          background: var(--background-darker);
        }

        .login-left {
          flex: 1;
          background-image: url('https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?q=80&w=2574&auto=format&fit=crop');
          background-size: cover;
          background-position: center;
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 2rem;
          color: white;
        }

        .login-left::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          pointer-events: none;
        }

        .logo-container {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .logo-icon {
          color: white;
        }

        .logo-text {
          font-size: 2rem;
          font-weight: 500;
        }

        .tagline {
          position: relative;
          z-index: 1;
          font-size: 1.5rem;
          font-weight: 400;
          margin-top: 2rem;
          color: #45B619;
          max-width: 80%;
        }

        .login-right {
          width: 480px;
          background: var(--background-darker);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .login-content {
          width: 100%;
          max-width: 360px;
        }

        .login-content h1 {
          color: white;
          font-size: 2rem;
          font-weight: 500;
          margin-bottom: 2rem;
          text-align: center;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-group {
          width: 100%;
        }

        .form-group input {
          width: 100%;
          padding: 0.75rem;
          background: var(--background-dark);
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          color: white;
          font-size: 1rem;
          outline: none;
          transition: all 0.2s;
        }

        .form-group input:focus {
          border-color: #45B619;
          background: rgba(69, 182, 25, 0.1);
        }

        .error-message {
          color: #ef4444;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .submit-button {
          width: 100%;
          padding: 0.75rem;
          background: #45B619;
          border: 1px solid #45B619;
          color: white;
          border-radius: 0.375rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .submit-button:hover {
          background: #3da316;
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .switch-mode {
          width: 100%;
          background: transparent;
          border: none;
          color: #45B619;
          font-size: 0.875rem;
          cursor: pointer;
          padding: 0.5rem;
        }

        .switch-mode:hover {
          text-decoration: underline;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;