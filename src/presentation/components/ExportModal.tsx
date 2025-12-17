import React from "react";

interface ExportModalProps {
  onClose: () => void;
  onExportVCF: () => void;
  onExportCSV: () => void;
  onExportExcel: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({
  onClose,
  onExportVCF,
  onExportCSV,
  onExportExcel,
}) => {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
        <h3 className="text-xl font-bold mb-4 text-center">
          Exportar contactos seleccionados
        </h3>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded w-full"
            onClick={onExportVCF}
          >
            Exportar a VCF
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded w-full"
            onClick={onExportCSV}
          >
            Exportar a CSV
          </button>
          <button
            className="bg-purple-600 text-white px-4 py-2 rounded w-full"
            onClick={onExportExcel}
          >
            Exportar a Excel
          </button>
        </div>
        <button
          className="mt-4 bg-gray-300 text-gray-800 px-4 py-2 rounded w-full"
          onClick={onClose}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default ExportModal;
