import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource for silver mangalsutra ecommerce
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  groups: ['admin', 'super_admin'],
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
    givenName: {
      required: false,
      mutable: true,
    },
    familyName: {
      required: false,
      mutable: true,
    },
    phoneNumber: {
      required: false,
      mutable: true,
    },
  },
  accountRecovery: 'EMAIL_ONLY',
});
