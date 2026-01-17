'use client';

import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json';

// Configure Amplify on the client side
Amplify.configure(outputs, {
  ssr: true // Enable SSR support
});

export default function AmplifyConfig() {
  return null;
}
