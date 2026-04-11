export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center lg:bg-none lg:min-h-screen">
      <div className="w-full max-w-md lg:max-w-full lg:h-screen lg:flex lg:items-center lg:justify-center">
        {children}
      </div>
    </div>
  );
}
