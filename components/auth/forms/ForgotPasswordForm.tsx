import React from 'react';
import { formatPhoneInput } from '@/lib/services/auth-service';

interface ForgotPasswordFormProps {
  phoneNumber: string;
  isLoading: boolean;
  onPhoneChange: (phone: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  phoneNumber,
  isLoading,
  onPhoneChange,
  onSubmit,
  onBack,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="resetPhone" className="block text-sm font-medium text-gray-700 mb-2">
          Mobile Number <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">+91</span>
          </div>
          <input
            id="resetPhone"
            type="tel"
            required
            value={formatPhoneInput(phoneNumber)}
            onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, ''))}
            className="block w-full pl-12 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="98765 43210"
            maxLength={11}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Enter the phone number associated with your account
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading || phoneNumber.length !== 10}
        className="w-full flex justify-center py-3 px-6 border-2 border-black rounded-none text-sm font-semibold uppercase tracking-wider text-black bg-white hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
      >
        {isLoading ? 'SENDING CODE...' : 'SEND RESET CODE'}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-black hover:text-gray-600 font-medium"
        >
          ← Back to login
        </button>
      </div>
    </form>
  );
};
