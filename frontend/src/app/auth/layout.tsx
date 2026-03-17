export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth pages should NOT have sidebar/navbar, just clean layout
  return <>{children}</>;
}
