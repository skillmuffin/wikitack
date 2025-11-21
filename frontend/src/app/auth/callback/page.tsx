'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        router.push('/login?error=' + encodeURIComponent(error));
        return;
      }

      if (token) {
        try {
          await login(token);

          // Check if user has a workspace
          const workspacesResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/workspaces/`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (workspacesResponse.ok) {
            const workspaces = await workspacesResponse.json();
            // If user has no workspaces, redirect to setup
            if (workspaces.length === 0) {
              router.push('/workspace/setup');
            } else {
              router.push('/dashboard');
            }
          } else {
            // If we can't check workspaces, just go to dashboard
            router.push('/dashboard');
          }
        } catch (err) {
          console.error('Login failed:', err);
          router.push('/login?error=authentication_failed');
        }
      } else {
        router.push('/login?error=no_token');
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-lg text-gray-700">Completing sign in...</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
