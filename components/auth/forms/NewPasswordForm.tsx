import React from 'react';

interface NewPasswordFormProps {
  newPassword: string;
  confirmPassword: string;
  isLoading: boolean;
  onNewPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (password: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export const NewPasswordForm: React.FC<NewPasswordFormProps> = ({
  newPassword,
  confirmPassword,
  isLoading,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  onBack,
}) => {
  const passwordsMatch = !confirmPassword || newPassword === confirmPassword;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
          New Password <span className="text-red-500">*</span>
        </label>
        <input
          id="newPassword"
          type="password"
          required
          value={newPassword}
          onChange={(e) => onNewPasswordChange(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter new password"
        />
      </div>

      <div>
        <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-2">
          Confirm New Password <span className="text-red-500">*</span>
        </label>
        <input
          id="confirmNewPassword"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            !passwordsMatch
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300'
          }`}
          placeholder="Confirm new password"
        />
        {!passwordsMatch && (
          <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
        )}
      </div>

      <button
        type="submit"
        disabled={
          isLoading || 
          !newPassword || 
          !confirmPassword || 
          !passwordsMatch
        }
        className="w-full flex justify-center py-3 px-6 border-2 border-black rounded-none text-sm font-semibold uppercase tracking-wider text-black bg-white hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
      >
        {isLoading ? 'UPDATING PASSWORD...' : 'UPDATE PASSWORD'}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-black hover:text-gray-600 font-medium"
        >
          ← Back to verification
        </button>
      </div>
    </form>
  );
};
