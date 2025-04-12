/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import './dataTable.css';

interface DataTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  title?: string;
  pageSize?: number;
  filterPlaceholder?: string;
}

function DataTable<T>({
  columns,
  data,
  title,
  pageSize = 5,
  filterPlaceholder = 'Buscar...'
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  return (
    <div className="datatable-container mt-3">
      {title && <h2 className="datatable-title">{title}</h2>}
      
      <div className="datatable-header">
        <div className="datatable-filter">
          <input
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder={filterPlaceholder}
            className="filter-input"
          />
        </div>
        <div className="page-size-selector">
          <span>Mostrar</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={e => {
              table.setPageSize(Number(e.target.value));
            }}
            className="page-size-select"
          >
            {[5, 10, 20, 30, 50].map(size => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>registros</span>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="datatable">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={header.column.getCanSort() ? 'sortable' : ''}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {header.column.getIsSorted() ? (
                      header.column.getIsSorted() === 'asc' ? (
                        <span className="sort-icon"> 🔼</span>
                      ) : (
                        <span className="sort-icon"> 🔽</span>
                      )
                    ) : (
                      header.column.getCanSort() && <span className="sort-icon"> ⇅</span>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        {table.getRowModel().rows.length === 0 && (
          <div className="no-data">No hay datos disponibles</div>
        )}
      </div>

      {/* Actualización de la paginación */}
      <div className="pagination">
        <div className="pagination-info">
          Página <span className="current-page">{table.getState().pagination.pageIndex + 1}</span> de <span className="total-pages">{table.getPageCount()}</span>
        </div>
        
        <div className="pagination-controls">
          <button
            className="pagination-button first-page"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            title="Primera página"
          >
            {'<<'}
          </button>
          <button
            className="pagination-button prev-page"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            title="Página anterior"
          >
            {'<'}
          </button>
          
          {/* Mostrar números de página */}
          <div className="pagination-numbers">
            {Array.from({ length: table.getPageCount() }, (_, i) => {
              // Mostrar solo un número limitado de páginas
              const pageCount = table.getPageCount();
              const currentPage = table.getState().pagination.pageIndex;
              
              // Mostrar siempre la primera, última y páginas cercanas a la actual
              if (
                i === 0 || 
                i === pageCount - 1 || 
                (i >= currentPage - 1 && i <= currentPage + 1)
              ) {
                return (
                  <button
                    key={i}
                    className={`pagination-number ${i === currentPage ? 'active' : ''}`}
                    onClick={() => table.setPageIndex(i)}
                  >
                    {i + 1}
                  </button>
                );
              }
              
              // Mostrar elipsis para páginas omitidas
              if (
                i === currentPage - 2 ||
                i === currentPage + 2
              ) {
                return <span key={i} className="pagination-ellipsis">...</span>;
              }
              
              return null;
            }).filter(Boolean)}
          </div>
          
          <button
            className="pagination-button next-page"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            title="Página siguiente"
          >
            {'>'}
          </button>
          <button
            className="pagination-button last-page"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            title="Última página"
          >
            {'>>'}
          </button>
        </div>
        
        <div className="goto-page">
          <span>Ir a la página:</span>
          <input
            type="number"
            min={1}
            max={table.getPageCount()}
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              table.setPageIndex(page);
            }}
            className="goto-page-input"
          />
        </div>
      </div>
    </div>
  );
}

export default DataTable;