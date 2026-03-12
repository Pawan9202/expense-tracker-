import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext.jsx';
import { Eye, EyeOff, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await login(data.username, data.password);
      if (result.success) {
        toast.success('Login successful!');
        navigate('/');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative ambient background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[800px] max-h-[800px] -z-10 pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
        <div className="absolute top-[30%] right-[20%] w-96 h-96 bg-fuchsia-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[20%] left-[40%] w-96 h-96 bg-emerald-500/20 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000"></div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-md w-full space-y-8 glass-card p-10 border border-white/10 relative z-10"
      >
        <motion.div variants={itemVariants} className="text-center">
          <div className="mx-auto h-14 w-14 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6">
            <Wallet className="text-white w-7 h-7" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Sign up today
            </Link>
          </p>
        </motion.div>

        <motion.form variants={itemVariants} className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-5">
            <div>
              <label htmlFor="username" className="form-label text-gray-300">
                Username
              </label>
              <input
                id="username"
                type="text"
                {...register('username', {
                  required: 'Username is required',
                  minLength: {
                    value: 3,
                    message: 'Username must be at least 3 characters',
                  },
                })}
                className={`form-input bg-black/20 border-white/10 text-white placeholder-gray-500 focus:border-indigo-500/50 focus:ring-indigo-500/20 ${errors.username ? 'border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/20' : ''}`}
                placeholder="Enter your username"
              />
              {errors.username && (
                <p className="mt-2 text-sm text-rose-400">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="form-label text-gray-300">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  className={`form-input bg-black/20 border-white/10 text-white placeholder-gray-500 focus:border-indigo-500/50 focus:ring-indigo-500/20 pr-10 ${errors.password ? 'border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/20' : ''}`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-rose-400">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-3 text-sm font-semibold rounded-xl relative group overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center">
                {isLoading ? (
                  <>
                    <div className="spinner border-t-white/80 border-white/20 mr-2 h-4 w-4"></div>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </div>
            </button>
          </div>

          <div className="text-center mt-6">
            <div className="inline-block px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400">
              <span className="font-semibold text-gray-300">Demo:</span> demo / demo123
            </div>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default Login; 