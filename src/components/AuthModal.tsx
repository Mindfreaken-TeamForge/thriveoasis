import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Calendar, X } from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');

  const shinyBlackButtonStyle: React.CSSProperties = {
    background: 'linear-gradient(145deg, #2c3e50, #1a2533)',
    color: '#fff',
    textShadow: '0 0 5px rgba(255,255,255,0.5)',
    boxShadow: '0 0 10px rgba(0,0,0,0.5), inset 0 0 5px rgba(255,255,255,0.2)',
    border: 'none',
    transition: 'all 0.1s ease',
    width: '100%',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.875rem',
    fontWeight: '500',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
      } else {
        if (!agreeToTerms) {
          setError('You must agree to the terms of service.');
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await updateProfile(userCredential.user, { displayName: displayName });
        await sendEmailVerification(userCredential.user);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          displayName,
          username,
          email,
          dateOfBirth,
          createdAt: new Date(),
          isVerified: false,
        });
        onClose();
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-md mx-4"
      >
        <div className="bg-gradient-to-br from-sky-400 via-sky-300 to-blue-400 p-8 rounded-lg shadow-xl backdrop-blur-lg border border-white/20">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              {isLogin ? 'Welcome Back' : 'Join Us'}
            </h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-white text-lg mb-2">
                Email
              </Label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-900"
                  size={22}
                />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 text-lg bg-white/30 border-white/30 text-blue-900 placeholder:text-blue-900/70 focus:border-blue-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>
            {!isLogin && (
              <>
                <div>
                  <Label
                    htmlFor="displayName"
                    className="text-white text-lg mb-2"
                  >
                    Display Name
                  </Label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-900"
                      size={22}
                    />
                    <Input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-12 h-12 text-lg bg-white/30 border-white/30 text-blue-900 placeholder:text-blue-900/70 focus:border-blue-500"
                      placeholder="Choose a display name"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="username" className="text-white text-lg mb-2">
                    Username
                  </Label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-900"
                      size={22}
                    />
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-12 h-12 text-lg bg-white/30 border-white/30 text-blue-900 placeholder:text-blue-900/70 focus:border-blue-500"
                      placeholder="Choose a username"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label
                    htmlFor="dateOfBirth"
                    className="text-white text-lg mb-2"
                  >
                    Date of Birth
                  </Label>
                  <div className="relative pl-12">
                    <Calendar
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-900"
                      size={22}
                    />
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full h-12 text-lg bg-white/30 border-white/30 text-blue-900 focus:border-blue-500 px-6"
                      required
                      style={{
                        width: 'calc(100% + 48px)',
                        marginLeft: '-48px',
                        paddingLeft: '60px',
                      }}
                    />
                  </div>
                </div>
              </>
            )}
            <div>
              <Label htmlFor="password" className="text-white text-lg mb-2">
                Password
              </Label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-900"
                  size={22}
                />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-12 text-lg bg-white/30 border-white/30 text-blue-900 placeholder:text-blue-900/70 focus:border-blue-500"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>
            {!isLogin && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="w-5 h-5 rounded border-white/30 bg-white/30 text-blue-500 focus:ring-blue-500"
                />
                <Label htmlFor="agreeToTerms" className="text-base text-white">
                  I agree to the Terms of Service
                </Label>
              </div>
            )}
            {error && (
              <p className="text-red-500 text-base bg-white/30 p-3 rounded">
                {error}
              </p>
            )}
            <Button
              type="submit"
              style={shinyBlackButtonStyle}
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
          <p className="mt-6 text-center text-lg text-white">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-blue-100 hover:text-white font-semibold"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AuthModal;