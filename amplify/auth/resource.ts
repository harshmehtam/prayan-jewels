import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource for silver mangalsutra ecommerce
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    phone: true,
    email: true, // Keep email as backup for admin users
  },
  groups: ['admin', 'super_admin'],
  userAttributes: {
    phoneNumber: {
      required: true,
      mutable: true,
    },
    email: {
      required: false,
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
    birthdate: {
      required: false,
      mutable: true,
    },
    // Custom attributes for our application
    'custom:role': {
      dataType: 'String',
      mutable: true,
    },
    'custom:newsletter': {
      dataType: 'Boolean',
      mutable: true,
    },
    'custom:smsUpdates': {
      dataType: 'Boolean',
      mutable: true,
    },
    'custom:preferredCategories': {
      dataType: 'String', // JSON string array
      mutable: true,
    },
  },
  accountRecovery: 'PHONE_ONLY_WITHOUT_MFA',
});
