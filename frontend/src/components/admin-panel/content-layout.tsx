import TopBar from "@/components/layout/top-bar";

interface ContentLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function ContentLayout({ title: _title, children }: ContentLayoutProps) {
  return (
    <div>
      {/* Navbar removed - using modern EnhancedNavbar instead */}
      <div className="w-full pt-6 sm:pt-8 pb-6 sm:pb-8 px-3 sm:px-6 lg:px-8">
        <TopBar />
        <div className="mt-3 sm:mt-4 max-w-screen-2xl mx-auto">{children}</div>
      </div>
    </div>
  );
}
