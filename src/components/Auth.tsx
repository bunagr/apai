import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

interface AuthError {
  message: string;
  type: 'email' | 'password' | 'general';
}

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const { signIn, signUp } = useAuthStore();

  const validateForm = () => {
    if (!email) {
      setError({ message: 'Email is required', type: 'email' });
      return false;
    }
    if (!email.includes('@')) {
      setError({ message: 'Invalid email format', type: 'email' });
      return false;
    }
    if (!password) {
      setError({ message: 'Password is required', type: 'password' });
      return false;
    }
    if (isSignUp && password.length < 6) {
      setError({ message: 'Password must be at least 6 characters', type: 'password' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError({
        message: error instanceof Error ? error.message : 'An error occurred',
        type: 'general'
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900 rounded-xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-white">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-zinc-400">
              {isSignUp
                ? 'Sign up to start chatting with AI'
                : 'Sign in to continue your conversations'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500 bg-opacity-10 text-red-400 p-4 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error.message}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-5 w-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className={`w-full pl-10 pr-4 py-2 bg-zinc-800 text-white border-2 border-transparent rounded-lg focus:outline-none focus:ring-0 transition-colors ${
                    error?.type === 'email'
                      ? 'border-red-500'
                      : 'focus:border-white'
                  }`}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-5 w-5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  className={`w-full pl-10 pr-4 py-2 bg-zinc-800 text-white border-2 border-transparent rounded-lg focus:outline-none focus:ring-0 transition-colors ${
                    error?.type === 'password'
                      ? 'border-red-500'
                      : 'focus:border-white'
                  }`}
                  placeholder={isSignUp ? 'Create a password' : 'Enter your password'}
                />
              </div>
              {isSignUp && (
                <p className="text-xs text-zinc-400 mt-1">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black py-2 px-4 rounded-lg hover:bg-zinc-200 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-10"
            >
              {isLoading ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          {/* Toggle Sign In/Up */}
          <div className="pt-4 text-center border-t border-zinc-800">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setEmail('');
                setPassword('');
              }}
              className="text-sm text-white hover:text-zinc-300 transition-colors"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-zinc-500 text-sm mt-8">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}