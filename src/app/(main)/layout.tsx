import BottomNav from "@/components/layout/BottomNav";
import { ScanProvider } from "@/contexts/ScanContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ScanProvider>
      <div className="min-h-screen max-w-lg mx-auto relative">
        <main className="pb-safe">{children}</main>
        <BottomNav />
      </div>
    </ScanProvider>
  );
}
