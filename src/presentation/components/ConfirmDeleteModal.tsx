import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export default function ConfirmDeleteModal({
  open,
  title = "¿Eliminar?",
  message,
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  onConfirm,
  onClose,
}: Props) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("overflow-hidden");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    setTimeout(() => cancelBtnRef.current?.focus(), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("overflow-hidden");
    };
  }, [open, onClose]);

  if (!open) return null;

  const onBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onClose();
  };

  return (
    <div
      ref={backdropRef}
      onMouseDown={onBackdropClick}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
    >
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {/* icono advertencia */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7 text-red-600">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.594c.75 1.335-.214 2.992-1.742 2.992H3.48c-1.528 0-2.492-1.657-1.742-2.992L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-.25-6.75a.75.75 0 00-1.5 0v4a.75.75 0 001.5 0v-4z" clipRule="evenodd"/>
          </svg>
        </div>

        <h3 className="text-center text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-center text-sm text-gray-600">{message}</p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            ref={cancelBtnRef}
            onClick={onClose}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
