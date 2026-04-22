import { AppProvider } from '@/lib/context/AppContext';
import AppShell from '@/components/AppShell';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AppShell>{children}</AppShell>
    </AppProvider>
  );
}
