// Map Supabase/technical errors to user-friendly messages

const ERROR_MAP: Record<string, string> = {
  // Auth errors
  'Invalid login credentials': 'Incorrect email or password. Please try again.',
  'invalid_credentials': 'Incorrect email or password. Please try again.',
  'Email not confirmed': 'Please check your email to confirm your account.',
  'User already registered': 'An account with this email already exists. Try signing in.',
  'Password should be at least 6 characters': 'Password must be at least 6 characters.',
  'Unable to validate email address: invalid format': 'Please enter a valid email address.',
  'Email rate limit exceeded': 'Too many attempts. Please wait a few minutes.',
  'For security purposes, you can only request this once every 60 seconds': 'Please wait before trying again.',

  // Network errors
  'Failed to fetch': "Couldn't connect to server. Please check your internet connection.",
  'NetworkError': "Couldn't connect to server. Please check your internet connection.",
  'Network request failed': "Couldn't connect to server. Please check your internet connection.",

  // Storage errors
  'permission denied': 'Please sign in to save patterns.',
  'JWT expired': 'Your session has expired. Please sign in again.',
  'invalid JWT': 'Your session has expired. Please sign in again.',
};

// Patterns to match (for errors that contain certain text)
const ERROR_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /duplicate key/i, message: 'This pattern name already exists.' },
  { pattern: /network/i, message: "Couldn't connect. Please check your internet connection." },
  { pattern: /timeout/i, message: 'Request timed out. Please try again.' },
  { pattern: /rate limit/i, message: 'Too many requests. Please wait a moment.' },
];

export function translateError(error: string | Error | unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Check exact matches first
  if (ERROR_MAP[errorMessage]) {
    return ERROR_MAP[errorMessage];
  }

  // Check pattern matches
  for (const { pattern, message } of ERROR_PATTERNS) {
    if (pattern.test(errorMessage)) {
      return message;
    }
  }

  // Return original message if no translation found
  // But clean up technical details
  if (errorMessage.includes(':')) {
    const simplified = errorMessage.split(':')[0].trim();
    if (simplified.length > 10 && simplified.length < 100) {
      return simplified;
    }
  }

  return errorMessage;
}

// Specific error messages for storage operations
export function getStorageErrorMessage(operation: 'save' | 'load' | 'delete' | 'share'): string {
  const messages: Record<string, string> = {
    save: "Couldn't save pattern. It's been saved locally.",
    load: "Couldn't load pattern. Please try again.",
    delete: "Couldn't delete pattern. Please try again.",
    share: "Couldn't share pattern. Please try again.",
  };
  return messages[operation];
}
