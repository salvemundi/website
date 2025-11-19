import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

export default function LoginPagina() {
  const navigate = useNavigate();
  const { loginWithMicrosoft, isLoading } = useAuth();
  
  const [error, setError] = useState('');

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

            <div className="mt-8 p-4 bg-geel/20 border-2 border-geel rounded-xl">
              <p className="text-sm text-paars">
                <strong>For Salve Mundi members:</strong> Use "Login with Microsoft" with your Fontys account.
              </p>
              <p className="text-sm text-paars mt-2">
                Having trouble logging in? Contact the Salve Mundi board for support.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
