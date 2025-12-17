export default function DeletingOverlay({
  open,
  progress,
}: {
  open: boolean;
  progress: number;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 w-80 text-center shadow-xl">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-red-500" />
        <p className="font-semibold mb-3">Eliminando contactos…</p>
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">{progress}%</p>
      </div>
    </div>
  );
}
