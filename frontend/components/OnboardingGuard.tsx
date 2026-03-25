import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/LoadingSpinner';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export const OnboardingGuard: React.FC<OnboardingGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Don't redirect if on auth pages
      if (router.pathname.startsWith('/auth')) {
        return;
      }
      
      // If user is not onboarded, redirect to onboarding
      if (!user.isOnboarded) {
        // Don't redirect if already on onboarding pages
        if (!router.pathname.startsWith('/onboarding')) {
          router.push('/onboarding/avatar');
        }
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Don't apply onboarding guard to auth pages
  if (router.pathname.startsWith('/auth')) {
    return <>{children}</>;
  }

  // If user is not onboarded and not on onboarding pages, show loading
  if (user && !user.isOnboarded && !router.pathname.startsWith('/onboarding')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return <>{children}</>;
};