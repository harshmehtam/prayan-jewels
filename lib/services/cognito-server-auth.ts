// Server-side Cognito authentication using AWS SDK
import { 
  CognitoIdentityProviderClient, 
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  AdminGetUserCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand
} from '@aws-sdk/client-cognito-identity-provider';

// Get configuration from amplify_outputs.json
import outputs from '@/amplify_outputs.json';

const cognitoClient = new CognitoIdentityProviderClient({
  region: outputs.auth.aws_region,
});

const USER_POOL_ID = outputs.auth.user_pool_id;
const CLIENT_ID = outputs.auth.user_pool_client_id;

interface SendOTPResponse {
  success: boolean;
  message?: string;
  error?: string;
  isNewUser?: boolean;
  session?: string;
  userStatus?: string; // Add user status to help with verification
}

interface VerifyOTPResponse {
  success: boolean;
  message?: string;
  error?: string;
  isNewUser?: boolean;
  userId?: string;
}

export class CognitoServerAuthService {
  /**
   * Send OTP to phone number (handles both new and existing users)
   */
  static async sendOTPSimple(phoneNumber: string): Promise<SendOTPResponse> {
    try {
      const formattedPhone = this.formatPhoneForCognito(phoneNumber);
      
      // First check if user exists
      try {
        const userResponse = await cognitoClient.send(new AdminGetUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: formattedPhone,
        }));
        
        // User exists - check if they're confirmed
        const userStatus = userResponse.UserStatus;
        
        if (userStatus === 'CONFIRMED') {
          // User exists and is confirmed - use forgot password flow for OTP
          await cognitoClient.send(new ForgotPasswordCommand({
            ClientId: CLIENT_ID,
            Username: formattedPhone,
          }));
          
          return {
            success: true,
            message: 'OTP sent to your phone',
            isNewUser: false,
            userStatus: 'CONFIRMED', // Add user status to help with verification
          };
        } else if (userStatus === 'UNCONFIRMED') {
          // User exists but not confirmed - resend confirmation code
          await cognitoClient.send(new ResendConfirmationCodeCommand({
            ClientId: CLIENT_ID,
            Username: formattedPhone,
          }));
          
          return {
            success: true,
            message: 'OTP sent to your phone',
            isNewUser: false,
            userStatus: 'UNCONFIRMED', // Add user status to help with verification
          };
        }
      } catch (userNotFoundError: any) {
        if (userNotFoundError.name === 'UserNotFoundException') {
          // User doesn't exist - create new account
          await cognitoClient.send(new SignUpCommand({
            ClientId: CLIENT_ID,
            Username: formattedPhone,
            Password: this.generateTempPassword(),
            UserAttributes: [
              {
                Name: 'phone_number',
                Value: formattedPhone,
              },
            ],
          }));
          
          return {
            success: true,
            message: 'OTP sent to your phone',
            isNewUser: true,
          };
        } else {
          throw userNotFoundError;
        }
      }
      
      // Fallback
      return {
        success: false,
        error: 'Unable to process request. Please try again.',
      };
    } catch (error: any) {
      console.error('Send OTP error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Resend OTP (handles both new and existing users with correct method)
   */
  static async resendOTPSimple(phoneNumber: string, isNewUser: boolean): Promise<SendOTPResponse> {
    try {
      const formattedPhone = this.formatPhoneForCognito(phoneNumber);
      
      if (isNewUser) {
        // For new users, resend confirmation code
        await cognitoClient.send(new ResendConfirmationCodeCommand({
          ClientId: CLIENT_ID,
          Username: formattedPhone,
        }));
        
        return {
          success: true,
          message: 'OTP resent successfully',
          isNewUser: true,
        };
      } else {
        // For existing users, check their status to use the correct resend method
        try {
          const userResponse = await cognitoClient.send(new AdminGetUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: formattedPhone,
          }));
          
          const userStatus = userResponse.UserStatus;
          
          if (userStatus === 'CONFIRMED') {
            // User is confirmed, use forgot password flow
            await cognitoClient.send(new ForgotPasswordCommand({
              ClientId: CLIENT_ID,
              Username: formattedPhone,
            }));
            
            return {
              success: true,
              message: 'OTP resent successfully',
              isNewUser: false,
              userStatus: 'CONFIRMED',
            };
          } else {
            // User is unconfirmed, resend confirmation code
            await cognitoClient.send(new ResendConfirmationCodeCommand({
              ClientId: CLIENT_ID,
              Username: formattedPhone,
            }));
            
            return {
              success: true,
              message: 'OTP resent successfully',
              isNewUser: false,
              userStatus: 'UNCONFIRMED',
            };
          }
        } catch (userError: any) {
          console.error('Error checking user status for resend:', userError);
          throw userError;
        }
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Verify OTP (handles both new and existing users with correct verification method)
   */
  static async verifyOTPSimple(
    phoneNumber: string, 
    otp: string, 
    isNewUser: boolean,
    userStatus?: string, // Add user status parameter
    firstName?: string,
    lastName?: string
  ): Promise<VerifyOTPResponse> {
    try {
      const formattedPhone = this.formatPhoneForCognito(phoneNumber);
      
      if (isNewUser) {
        // For new users, confirm signup
        await cognitoClient.send(new ConfirmSignUpCommand({
          ClientId: CLIENT_ID,
          Username: formattedPhone,
          ConfirmationCode: otp,
        }));
        
        return {
          success: true,
          message: 'Account created successfully',
          isNewUser: true,
          userId: formattedPhone,
        };
      } else {
        // For existing users, use the correct verification method based on how OTP was sent
        if (userStatus === 'CONFIRMED') {
          // User was confirmed, OTP was sent via ForgotPassword, so use ConfirmForgotPassword
          const newPassword = this.generateTempPassword();
          
          await cognitoClient.send(new ConfirmForgotPasswordCommand({
            ClientId: CLIENT_ID,
            Username: formattedPhone,
            ConfirmationCode: otp,
            Password: newPassword,
          }));
          
          return {
            success: true,
            message: 'Login successful',
            isNewUser: false,
            userId: formattedPhone,
          };
        } else {
          // User was unconfirmed, OTP was sent via ResendConfirmationCode, so use ConfirmSignUp
          await cognitoClient.send(new ConfirmSignUpCommand({
            ClientId: CLIENT_ID,
            Username: formattedPhone,
            ConfirmationCode: otp,
          }));
          
          return {
            success: true,
            message: 'Account verified successfully',
            isNewUser: false,
            userId: formattedPhone,
          };
        }
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
   * Send OTP to phone number (either signup or signin)
   */
  static async sendOTP(phoneNumber: string): Promise<SendOTPResponse> {
    try {
      const formattedPhone = this.formatPhoneForCognito(phoneNumber);
      
      // First try to check if user exists
      try {
        await cognitoClient.send(new AdminGetUserCommand({
          UserPoolId: USER_POOL_ID,
          Username: formattedPhone,
        }));
        
        // User exists, initiate custom auth flow for signin
        const authResponse = await cognitoClient.send(new InitiateAuthCommand({
          ClientId: CLIENT_ID,
          AuthFlow: 'CUSTOM_AUTH',
          AuthParameters: {
            USERNAME: formattedPhone,
          },
        }));
        
        return {
          success: true,
          message: 'OTP sent to your phone',
          isNewUser: false,
          session: authResponse.Session,
        };
      } catch (userNotFoundError: any) {
        if (userNotFoundError.name === 'UserNotFoundException') {
          // User doesn't exist, create new account
          await cognitoClient.send(new SignUpCommand({
            ClientId: CLIENT_ID,
            Username: formattedPhone,
            Password: this.generateTempPassword(),
            UserAttributes: [
              {
                Name: 'phone_number',
                Value: formattedPhone,
              },
            ],
          }));
          
          return {
            success: true,
            message: 'OTP sent to your phone',
            isNewUser: true,
          };
        } else {
          throw userNotFoundError;
        }
      }
    } catch (error: any) {
      console.error('Send OTP error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error),
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
    session?: string,
    firstName?: string,
    lastName?: string
  ): Promise<VerifyOTPResponse> {
    try {
      const formattedPhone = this.formatPhoneForCognito(phoneNumber);
      
      if (isNewUser) {
        // Confirm signup for new users
        await cognitoClient.send(new ConfirmSignUpCommand({
          ClientId: CLIENT_ID,
          Username: formattedPhone,
          ConfirmationCode: otp,
        }));
        
        return {
          success: true,
          message: 'Account created successfully',
          isNewUser: true,
          userId: formattedPhone,
        };
      } else {
        // For existing users, respond to auth challenge
        if (!session) {
          return {
            success: false,
            error: 'Session required for existing user verification.',
          };
        }
        
        const challengeResponse = await cognitoClient.send(new RespondToAuthChallengeCommand({
          ClientId: CLIENT_ID,
          ChallengeName: 'CUSTOM_CHALLENGE',
          Session: session,
          ChallengeResponses: {
            USERNAME: formattedPhone,
            ANSWER: otp,
          },
        }));
        
        return {
          success: true,
          message: 'Login successful',
          isNewUser: false,
          userId: formattedPhone,
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
        await cognitoClient.send(new ResendConfirmationCodeCommand({
          ClientId: CLIENT_ID,
          Username: formattedPhone,
        }));
      } else {
        // For existing users, initiate auth again
        const authResponse = await cognitoClient.send(new InitiateAuthCommand({
          ClientId: CLIENT_ID,
          AuthFlow: 'CUSTOM_AUTH',
          AuthParameters: {
            USERNAME: formattedPhone,
          },
        }));
        
        return {
          success: true,
          message: 'OTP resent successfully',
          session: authResponse.Session,
        };
      }
      
      return {
        success: true,
        message: 'OTP resent successfully',
      };
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error),
      };
    }
  }

  /**
   * Format phone number for Cognito (E.164 format: +91XXXXXXXXXX)
   * Following AWS Amplify best practices for phone number formatting
   */
  static formatPhoneForCognito(phoneNumber: string): string {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // If it's a 10-digit number, add +91 prefix
    if (cleanPhone.length === 10) {
      return `+91${cleanPhone}`;
    } 
    // If it's a 12-digit number starting with 91, add + prefix
    else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      return `+${cleanPhone}`;
    }
    // If it already has + prefix, return as is
    else if (phoneNumber.startsWith('+91') && cleanPhone.length === 12) {
      return phoneNumber;
    }
    
    // Fallback: assume it's a 10-digit number and add +91
    return `+91${cleanPhone}`;
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
   * Validate Indian phone number according to AWS Amplify best practices
   * Supports both 10-digit format and E.164 format
   * Reference: AWS Amplify requires E.164 format for phone numbers
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return false;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid 10-digit Indian mobile number (6-9 as first digit)
    if (cleanPhone.length === 10) {
      return /^[6-9]\d{9}$/.test(cleanPhone);
    }
    
    // Check if it's a valid 12-digit number with country code 91
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      const number = cleanPhone.slice(2);
      return /^[6-9]\d{9}$/.test(number);
    }
    
    // Check if it's already in E.164 format (+919999999999)
    if (phoneNumber.startsWith('+91') && cleanPhone.length === 12) {
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