/**
 * Authentication Feature Module
 * 
 * Centralized exports for all authentication-related functionality.
 * 
 * @module features/auth
 * 
 * @example
 * ```ts
 * import { useAuth, authService, SignInCard, SignOutButton } from '@/features/auth';
 * 
 * // Use the hook
 * const { isAuthenticated, signIn, signOut } = useAuth();
 * 
 * // Use the service directly
 * await authService.signInWithDiscord();
 * 
 * // Use components
 * <SignInCard />
 * <SignOutButton />
 * ```
 */

// Components
export { SignInCard } from './components/sign-in-card';
export { SignOutButton } from './components/sign-out-button';

// Hooks
export { useAuth } from './hooks/use-auth';

// Services
export { AuthService, authService } from './services/auth-service';

// Types
export type {
  AuthState,
  SignInOptions,
  SignOutOptions,
  DiscordUserMetadata,
} from './types';

export { AuthError, AuthErrorType } from './types';
