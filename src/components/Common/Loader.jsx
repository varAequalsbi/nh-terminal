// Loader Component
export default function Loader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-primary">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-color-gold animate-spin" />
        </div>
        <p className="text-text-secondary">Loading...</p>
      </div>
    </div>
  );
}