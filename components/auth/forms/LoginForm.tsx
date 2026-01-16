'use client';
import React from 'react';
import { formatPhoneInput } from '@/lib/utils/phone-utils';

interface LoginFormProps {
  phoneNumber: string;
  password: string;
  isLoading: boolean;
  onPhoneChange: (phone: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onForgotPassword: () => void;
  onSwitchToSignup: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  phoneNumber,
  password,
  isLoading,
  onPhoneChange,
  onPasswordChange,
  onSubmit,
  onForgotPassword,
  onSwitchToSignup,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
          Mobile Number <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">+91</span>
          </div>
          <input
            id="phone"
            type="tel"
            required
            value={formatPhoneInput(phoneNumber)}
            onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, ''))}
            className="block w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="98765 43210"
            maxLength={11}
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password <span className="text-red-500">*</span>
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your password"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || phoneNumber.length !== 10 || !password}
        className="w-full flex justify-center py-3 px-6 border-2 border-black rounded-none text-sm font-semibold uppercase tracking-wider text-black bg-white hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
      >
        {isLoading ? 'LOGGING IN...' : 'LOGIN'}
      </button>

      <div className="text-center space-y-2">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm text-black hover:text-gray-600 font-medium"
        >
          Forgot Password?
        </button>
        <div>
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="text-sm text-black hover:text-gray-600 font-medium"
          >
            Don't have an account? Sign up
          </button>
        </div>
      </div>
    </form>
  );
};
