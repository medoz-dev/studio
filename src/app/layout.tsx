
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/context/AuthContext';
import AuthGuard from '@/components/AuthGuard';
import { ThemeProvider } from '@/components/ThemeProvider';
import { UserFontProvider } from '@/context/UserFontContext';


export const metadata: Metadata = {
  title: "Inventaire Pro | Gestion d'Inventaire & Aide à la Décision",
  description: "Conception et Réalisation d'un Système Informatisé pour la Gestion d'Inventaire et l'Aide à la Décision en Restauration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=Roboto:wght@400;700&family=Lobster&family=Merriweather:wght@400;700&family=Playfair+Display:wght@400;700&family=Lato:wght@400;700&family=Poppins:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <AuthProvider>
              <UserFontProvider>
                <AuthGuard>
                    {children}
                </AuthGuard>
              </UserFontProvider>
            </AuthProvider>
            <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
