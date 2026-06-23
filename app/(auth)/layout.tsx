export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-full flex">
      {/* LEFT SIDE (branding) */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-blue-950 to-blue-800 text-white items-center justify-center p-10">
        <div>
          <h1 className="text-4xl font-bold">VACT</h1>
          <p className="mt-3 text-blue-100 max-w-md">
            AI-powered VNUHCM competency test preparation platform.
          </p>

          <div className="mt-10 text-blue-200 text-sm">
            “Learn smarter, not harder.”
          </div>
        </div>
      </div>

      {/* RIGHT SIDE (form) */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50">
        {children}
      </div>
    </div>
  );
}