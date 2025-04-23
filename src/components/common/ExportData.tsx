/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/common/ExportData.tsx
import React from 'react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import './exportData.css';

interface ExportDataProps {
  data: any[];
  columns: {
    header: string;
    accessor: string;
    formatFn?: (value: any) => string;
  }[];
  fileName: string;
  title?: string;
  showCSV?: boolean;
  showExcel?: boolean;
  showPDF?: boolean;
}

const ExportData: React.FC<ExportDataProps> = ({
  data,
  columns,
  fileName,
  title = 'Exportar datos',
  showCSV = true,
  showExcel = true,
  showPDF = true,
}) => {
  // Prepara los datos para exportar según las columnas especificadas
  const prepareData = () => {
    return data.map(item => {
      const row: Record<string, any> = {};
      
      columns.forEach(column => {
        let value;
        
        // Manejar accesores simples (strings) o complejos (con puntos)
        if (column.accessor.includes('.')) {
          const accessorPath = column.accessor.split('.');
          value = accessorPath.reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : null, item);
        } else {
          value = item[column.accessor];
        }
        
        // Aplicar función de formato si existe
        row[column.header] = column.formatFn ? column.formatFn(value) : value;
      });
      
      return row;
    });
  };

  // Exporta los datos a formato CSV
  const exportToCSV = () => {
    const preparedData = prepareData();
    const headers = columns.map(col => col.header);
    
    // Crear contenido del CSV
    let csvContent = headers.join(',') + '\n';
    
    preparedData.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] === null || row[header] === undefined ? '' : row[header];
        // Escapar comillas y valores que contienen comas
        const formattedValue = typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        return formattedValue;
      });
      
      csvContent += values.join(',') + '\n';
    });
    
    // Crear y descargar el archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${fileName}.csv`);
  };

  // Exporta los datos a formato Excel
  const exportToExcel = () => {
    const preparedData = prepareData();
    const worksheet = XLSX.utils.json_to_sheet(preparedData);
    const workbook = XLSX.utils.book_new();
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
    
    // Escribir a buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Crear blob y descargar
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `${fileName}.xlsx`);
  };

  // Exporta los datos a formato PDF
  const exportToPDF = () => {
    const preparedData = prepareData();
    const headers = columns.map(col => col.header);
    
    // Crear documento PDF
    const doc = new jsPDF();
    
    // Añadir título si existe
    if (title) {
      doc.setFontSize(16);
      doc.text(title, 14, 15);
      doc.setFontSize(10);
    }
    
    // Preparar datos para la tabla
    const tableData = preparedData.map(row => 
      headers.map(header => row[header])
    );
    
    // Agregar tabla
    (doc as any).autoTable({
      head: [headers],
      body: tableData,
      startY: title ? 25 : 15,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [13, 148, 136], // Color teal-600 para encabezados
      },
    });
    
    // Descargar PDF
    doc.save(`${fileName}.pdf`);
  };

  return (
    <div className="export-data-container">
      {title && <div className="export-title">{title}</div>}
      <div className="export-buttons">
        {showCSV && (
          <button className="export-button csv" onClick={exportToCSV}>
            CSV
          </button>
        )}
        {showExcel && (
          <button className="export-button excel" onClick={exportToExcel}>
            Excel
          </button>
        )}
        {showPDF && (
          <button className="export-button pdf" onClick={exportToPDF}>
            PDF
          </button>
        )}
      </div>
    </div>
  );
};

export default ExportData;