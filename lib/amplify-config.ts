'use client';

import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json';

// Configure Amplify once
let isConfigured = false;

export function configureAmplify() {
  if (!isConfigured) {
    Amplify.configure(outputs);
    isConfigured = true;
  }
}

// Auto-configure on import
configureAmplify();