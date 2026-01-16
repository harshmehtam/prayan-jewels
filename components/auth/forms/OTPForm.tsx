'use client';
import React from 'react';
import { formatPhoneForDisplay } from '@/lib/utils/phone-utils';

interface OTPFormProps {
  otp: string;
  phoneNumber: string;
  isLoading: boolean;
  countdown: number;
  onOtpChange: (otp: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onResend: () => void;
  onBack: () => void;
  submitButtonText?: string;
}

export const OTPForm: React.FC<OTPFormProps> = ({
  otp,
  phoneNumber,
  isLoading,
  countdown,
  onOtpChange,
  onSubmit,
  onResend,
  onBack,
  submitButtonText = 'VERIFY',
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
          Enter OTP <span className="text-red-500">*</span>
        </label>
        <input
          id="otp"
          type="text"
          required
          value={otp}
          onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
          placeholder="000000"
          maxLength={6}
        />
        <p className="text-xs text-gray-500 mt-1 text-center">
          OTP sent to {formatPhoneForDisplay(phoneNumber)}
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading || otp.length !== 6}
        className="w-full flex justify-center py-3 px-6 border-2 border-black rounded-none text-sm font-semibold uppercase tracking-wider text-black bg-white hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
      >
        {isLoading ? 'VERIFYING...' : submitButtonText}
      </button>

      <div className="text-center space-y-2">
        {countdown > 0 ? (
          <p className="text-sm text-gray-500">
            Resend code in {countdown}s
          </p>
        ) : (
          <button
            type="button"
            onClick={onResend}
            disabled={isLoading}
            className="text-sm text-black hover:text-gray-600 font-medium disabled:opacity-50"
          >
            Resend OTP
          </button>
        )}
        <div>
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-black hover:text-gray-600 font-medium"
          >
            ← Back
          </button>
        </div>
      </div>
    </form>
  );
};
