/* eslint-disable @typescript-eslint/no-explicit-any */
// src/types/common.ts
export interface ExportColumn {
    header: string;
    accessor: string;
    formatFn?: (value: any, row?: any) => string;
  }