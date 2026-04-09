import React from "react";

interface PaginationProps {
  paginaActual: number;
  totalPaginas: number;
  cambiarPagina: (pagina: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  paginaActual,
  totalPaginas,
  cambiarPagina,
}) => {
  if (totalPaginas <= 1) return null;

  const paginas: number[] = [];
  for (let i = 1; i <= totalPaginas; i++) {
    paginas.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        onClick={() => cambiarPagina(paginaActual - 1)}
        disabled={paginaActual === 1}
        className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-100"
      >
        &laquo;
      </button>

      {paginas.map((p) => (
        <button
          key={p}
          onClick={() => cambiarPagina(p)}
          className={`px-3 py-1 rounded border text-sm ${
            p === paginaActual
              ? "bg-red-500 text-white border-red-500"
              : "hover:bg-gray-100"
          }`}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => cambiarPagina(paginaActual + 1)}
        disabled={paginaActual === totalPaginas}
        className="px-3 py-1 rounded border text-sm disabled:opacity-40 hover:bg-gray-100"
      >
        &raquo;
      </button>
    </div>
  );
};

export default Pagination;
