import BottomNav from "@/components/layout/BottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen max-w-lg mx-auto relative">
      {/* Page content */}
      <main className="pb-safe">{children}</main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
