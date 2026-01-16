import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/api";
import { getCurrentUser } from "aws-amplify/auth/server";

import { type Schema } from "@/amplify/data/resource";
import outputs from "@/amplify_outputs.json";

export const { runWithAmplifyServerContext } = createServerRunner({
  config: outputs,
});

// Generate client that handles both authenticated and guest users
export const cookiesClient = generateServerClientUsingCookies<Schema>({
  config: outputs,
  cookies: async () => {
    const { cookies } = await import('next/headers');
    return cookies();
  },
});

export async function AuthGetCurrentUserServer() {
  try {
    const { cookies } = await import('next/headers');
    return await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: (contextSpec) => getCurrentUser(contextSpec),
    });
  } catch (error) {
    // Silently handle authentication errors for guest users
    // This is expected behavior when no user is logged in
    return null;
  }
}