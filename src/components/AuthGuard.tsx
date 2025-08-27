"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

const publicPaths = ['/login', '/signup'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      const pathIsPublic = publicPaths.includes(pathname);

      if (!user && !pathIsPublic) {
        router.push('/login');
      } else if (user && pathIsPublic) {
        router.push('/');
      }
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center">Chargement...</div>;
  }

  const isPublicPage = publicPaths.includes(pathname);
  if (!user && isPublicPage) {
    return <>{children}</>;
  }
  if(user && !isPublicPage) {
     return <>{children}</>;
  }

  return null;
}
