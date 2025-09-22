import type { Metadata } from 'next';
import { AuthProvider } from '../components/AuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'DataAccessHub',
  description: 'Data Access Permission Management System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}