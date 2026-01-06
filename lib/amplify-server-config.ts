// Server-side Amplify configuration for API routes
import { Amplify } from 'aws-amplify';
import outputs from '@/amplify_outputs.json';

// Configure Amplify for server-side usage
if (!Amplify.getConfig().Auth?.Cognito) {
  Amplify.configure(outputs, { ssr: true });
}

export { Amplify };