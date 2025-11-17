import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

export default function LoginPagina() {
  const navigate = useNavigate();
  const { login, loginWithMicrosoft, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
      navigate('/account');
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      console.error(err);
    }
  };

  const handleMicrosoftLogin = async () => {
    setError('');
    
    try {
      await loginWithMicrosoft();
      navigate('/account');
    } catch (err) {
      setError('Microsoft login failed. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-beige">
      <NavBar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-oranje">
            <h1 className="text-3xl font-bold text-paars mb-2 text-center">
              Welcome Back
            </h1>
            <p className="text-gray-600 text-center mb-8">
              Login to your account
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Microsoft Login Button */}
            <button
              onClick={handleMicrosoftLogin}
              disabled={isLoading}
              className="w-full mb-6 flex items-center justify-center gap-3 px-6 py-3 bg-paars text-beige rounded-full hover:bg-opacity-90 transition-all hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <svg className="w-5 h-5" viewBox="0 0 23 23" fill="none">
                <path fill="#f25022" d="M0 0h11v11H0z"/>
                <path fill="#00a4ef" d="M12 0h11v11H12z"/>
                <path fill="#7fba00" d="M0 12h11v11H0z"/>
                <path fill="#ffb900" d="M12 12h11v11H12z"/>
              </svg>
              <span>
                {isLoading ? 'Logging in...' : 'Login with Microsoft'}
              </span>
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-oranje/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-paars font-semibold">Or continue with email</span>
              </div>
            </div>

            {/* Email/Password Login Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-paars mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-paars/20 rounded-xl focus:ring-2 focus:ring-oranje focus:border-oranje transition-all"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-paars mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border-2 border-paars/20 rounded-xl focus:ring-2 focus:ring-oranje focus:border-oranje transition-all"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-oranje text-beige rounded-full font-semibold hover:bg-opacity-90 transition-all hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <Link to="/signup" className="text-oranje hover:text-paars font-semibold transition-colors">
                  Sign up
                </Link>
              </p>
            </div>

            <div className="mt-8 p-4 bg-geel/20 border-2 border-geel rounded-xl">
              <p className="text-sm text-paars">
                <strong>For Salve Mundi members:</strong> Use "Login with Microsoft" with your Fontys account.
              </p>
              <p className="text-sm text-paars mt-2">
                <strong>Not a member?</strong> Create an account with email and password to sign up for events.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
