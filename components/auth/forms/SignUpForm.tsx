import React from 'react';
import { formatPhoneInput } from '@/lib/services/auth-service';

interface SignUpFormProps {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  password: string;
  isLoading: boolean;
  onFirstNameChange: (name: string) => void;
  onLastNameChange: (name: string) => void;
  onPhoneChange: (phone: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchToLogin: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({
  firstName,
  lastName,
  phoneNumber,
  password,
  isLoading,
  onFirstNameChange,
  onLastNameChange,
  onPhoneChange,
  onPasswordChange,
  onSubmit,
  onSwitchToLogin,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            required
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="First name"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            required
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Last name"
          />
        </div>
      </div>

      <div>
        <label htmlFor="signupPhone" className="block text-sm font-medium text-gray-700 mb-2">
          Mobile Number <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">+91</span>
          </div>
          <input
            id="signupPhone"
            type="tel"
            required
            value={formatPhoneInput(phoneNumber)}
            onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, ''))}
            className="block w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter Phone Number"
            maxLength={11}
          />
        </div>
      </div>

      <div>
        <label htmlFor="signupPassword" className="block text-sm font-medium text-gray-700 mb-2">
          Password <span className="text-red-500">*</span>
        </label>
        <input
          id="signupPassword"
          type="password"
          required
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Create a strong password"
        />
      </div>

      <button
        type="submit"
        disabled={
          isLoading || 
          phoneNumber.length !== 10 || 
          !firstName.trim() || 
          !lastName.trim() || 
          !password
        }
        className="w-full flex justify-center py-3 px-6 border-2 border-black rounded-none text-sm font-semibold uppercase tracking-wider text-black bg-white hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
      >
        {isLoading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-sm text-black hover:text-gray-600 font-medium"
        >
          Already have an account? Login
        </button>
      </div>
    </form>
  );
};
