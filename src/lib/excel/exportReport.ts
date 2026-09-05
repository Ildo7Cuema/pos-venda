/**
 * Exportação de relatórios para Excel (.xlsx)
 */

import * as XLSX from 'xlsx';

export type ExcelSheet = {
    name: string;
    rows: Record<string, string | number | null | undefined>[];
};

/**
 * Gera e faz download de um ficheiro Excel com uma ou mais folhas
 */
export function downloadExcelWorkbook(
    sheets: ExcelSheet[],
    fileName: string
): void {
    const workbook = XLSX.utils.book_new();

    for (const sheet of sheets) {
        const safeName = sheet.name.slice(0, 31) || 'Folha';
        const worksheet = XLSX.utils.json_to_sheet(sheet.rows.length > 0 ? sheet.rows : [{ Info: 'Sem dados' }]);

        // Largura aproximada das colunas
        const keys = sheet.rows[0] ? Object.keys(sheet.rows[0]) : ['Info'];
        worksheet['!cols'] = keys.map((key) => ({
            wch: Math.min(
                40,
                Math.max(
                    key.length + 2,
                    ...sheet.rows.map((row) => String(row[key] ?? '').length + 2)
                )
            ),
        }));

        XLSX.utils.book_append_sheet(workbook, worksheet, safeName);
    }

    const stamp = new Date().toISOString().slice(0, 10);
    const safeFile = fileName.endsWith('.xlsx') ? fileName : `${fileName}_${stamp}.xlsx`;
    XLSX.writeFile(workbook, safeFile);
}

/**
 * Formata valor monetário simples para Excel (número, não texto)
 */
export function excelNumber(value: number | null | undefined): number {
    return Number(value) || 0;
}
