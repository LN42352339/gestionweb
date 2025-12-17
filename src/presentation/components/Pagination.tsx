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
  return (
    <Pagination
    paginaActual={paginaActual}
    totalPaginas={totalPaginas}
    cambiarPagina={cambiarPagina}
  />
  
  );
};

export default Pagination;
