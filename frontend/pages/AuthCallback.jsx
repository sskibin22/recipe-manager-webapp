import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isSignInWithEmailLink } from 'firebase/auth';

export default function AuthCallback() {
  const { completeEmailSignIn } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const email = localStorage.getItem('emailForSignIn');
      const emailLink = window.location.href;

      if (email && isSignInWithEmailLink(auth, emailLink)) {
        try {
          await completeEmailSignIn(email, emailLink);
          navigate('/');
        } catch (err) {
          setError(err.message);
        }
      } else {
        navigate('/');
      }
    };

    handleCallback();
  }, [completeEmailSignIn, navigate]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl">Completing sign-in...</div>
    </div>
  );
}
