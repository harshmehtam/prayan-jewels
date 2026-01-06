// Phone authentication service using AWS Amplify client
import { signUp, signIn, confirmSignUp, resendSignUpCode, getCurrentUser } from 'aws-amplify/auth';

interface SendOTPResponse {
  success: boolean;
  message?: string;
  error?: string;
  isNewUser?: boolean;
}

interface VerifyOTPResponse {
  success: boolean;
  message?: string;
  error?: string;
  isNewUser?: boolean;
  userId?: string;
}

export class CognitoPhoneAuthService {
  /**
   * Send OTP to phone number (signup for new users)
   */
  static async sendOTP(phoneNumber: string): Promise<SendOTPResponse> {
    try {
      // Format phone number for Cognito
      const formattedPhone = this.formatPhoneForCognito(phoneNumber);
      
      // Always try signup first - Amplify will handle existing users
      try {
        await signUp({
          username: formattedPhone,
          password: this.generateTempPassword(),
          options: {
            userAttributes: {
              phone_number: formattedPhone,
            },
          },
        });
        
        return {
          success: true,
          message: 'OTP sent to your phone',
          isNewUser: true,
        };
      } catch (signUpError: any) {
        // If user already exists, they need to sign in with password
        if (signUpError.name === 'UsernameExistsException') {
          return {
            success: false,
            error: 'An account with this phone number already exists. Please contact support for password reset.',
          };
        } else {
          console.error('SignUp error:', signUpError);
          return {
            success: false,
            error: this.getErrorMessage(signUpError),
          };
        }
      }
    } catch (error: any) {
      console.error('Send OTP error:', error);
      return {
        success: false,
        error: 'Failed to send OTP. Please try again.',
      };
    }
  }

  /**
   * Verify OTP and complete authentication
   */
  static async verifyOTP(
    phoneNumber: string, 
    otp: string, 
    isNewUser: boolean,
    firstName?: string,
    lastName?: string
  ): Promise<VerifyOTPResponse> {
    try {
      const formattedPhone = this.formatPhoneForCognito(phoneNumber);
      
      if (isNewUser) {
        // Confirm signup for new users
        await confirmSignUp({
          username: formattedPhone,
          confirmationCode: otp,
        });
        
        // After confirmation, sign in the user
        await signIn({
          username: formattedPhone,
          password: this.generateTempPassword(),
        });
        
        return {
          success: true,
          message: 'Account created and logged in successfully',
          isNewUser: true,
          userId: formattedPhone,
        };
      } else {
        // For existing users, they would need to sign in with password
        // Since we're using phone-only auth, this shouldn't happen in normal flow
        return {
          success: false,
          error: 'Existing user login not supported in this flow. Please contact support.',
        };
      }
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Resend OTP
   */
  static async resendOTP(phoneNumber: string, isNewUser: boolean): Promise<SendOTPResponse> {
    try {
      const formattedPhone = this.formatPhoneForCognito(phoneNumber);
      
      if (isNewUser) {
        await resendSignUpCode({ username: formattedPhone });
        return {
          success: true,
          message: 'OTP resent successfully',
        };
      } else {
        return {
          success: false,
          error: 'Resend not supported for existing users in this flow.',
        };
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      return {
        success: false,
        error: 'Failed to resend OTP. Please try again.',
      };
    }
  }

  /**
   * Format phone number for Cognito (+91XXXXXXXXXX)
   */
  static formatPhoneForCognito(phoneNumber: string): string {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      return `+91${cleanPhone}`;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      return `+${cleanPhone}`;
    }
    return phoneNumber;
  }

  /**
   * Format phone number for display
   */
  static formatPhoneNumber(phoneNumber: string): string {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      return `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      const number = cleanPhone.slice(2);
      return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
    }
    return phoneNumber;
  }

  /**
   * Validate Indian phone number
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid 10-digit Indian mobile number
    if (cleanPhone.length === 10) {
      return /^[6-9]\d{9}$/.test(cleanPhone);
    }
    
    // Check if it's a valid 12-digit number with country code
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      const number = cleanPhone.slice(2);
      return /^[6-9]\d{9}$/.test(number);
    }
    
    return false;
  }

  /**
   * Generate temporary password for Cognito
   */
  private static generateTempPassword(): string {
    return `TempPass${Date.now()}!${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Get user-friendly error message
   */
  private static getErrorMessage(error: any): string {
    switch (error.name) {
      case 'UserNotFoundException':
        return 'User not found. Please check your phone number.';
      case 'CodeMismatchException':
        return 'Invalid OTP. Please try again.';
      case 'ExpiredCodeException':
        return 'OTP has expired. Please request a new one.';
      case 'LimitExceededException':
        return 'Too many attempts. Please try again later.';
      case 'InvalidParameterException':
        return 'Invalid phone number format.';
      case 'TooManyRequestsException':
        return 'Too many requests. Please wait before trying again.';
      default:
        return error.message || 'An error occurred. Please try again.';
    }
  }
}