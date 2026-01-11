import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'prayan-jewels-storage',
  access: (allow) => ({
    'product-images/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read']),
      allow.groups(['admin']).to(['read', 'write']),
      allow.groups(['super_admin']).to(['read', 'write', 'delete'])
    ],
    'user-uploads/*': [
      allow.authenticated.to(['read', 'write', 'delete'])
    ]
  })
});