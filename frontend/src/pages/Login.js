import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { auth, useAuth } from '../services/firebase';
import { Mail, Lock, AlertTriangle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err) {
      // More generic error handling, can be customized
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-primary p-4 sm:p-8 rounded-xl shadow-lg border border-border">
        <h1 className="text-2xl sm:text-3xl font-bold text-accent mb-4 text-center">{isSignUp ? 'Register' : 'Login'}</h1>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="relative">
            <Mail className="absolute top-1/2 left-3 -translate-y-1/2 text-text-secondary" size={20} />
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg focus:ring-accent focus:border-accent"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <Lock className="absolute top-1/2 left-3 -translate-y-1/2 text-text-secondary" size={20} />
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg focus:ring-accent focus:border-accent"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-danger bg-danger/10 p-3 rounded-lg border border-danger/20">
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              className="w-full py-2 sm:py-3 px-4 font-semibold rounded-lg text-background bg-accent hover:bg-accent-hover transition-colors text-base sm:text-lg"
            >
              {isSignUp ? 'Register' : 'Login'}
            </button>
          </div>
        </form>
        <div className="text-center mt-4">
          {isSignUp ? (
            <>
              <span className="text-text-secondary">Already have an account?</span>
              <button
                type="button"
                className="ml-2 text-accent font-semibold hover:underline"
                onClick={() => setIsSignUp(false)}
              >
                Login
              </button>
            </>
          ) : (
            <>
              <span className="text-text-secondary">Don't have an account?</span>
              <button
                type="button"
                className="ml-2 text-accent font-semibold hover:underline"
                onClick={() => setIsSignUp(true)}
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login; 