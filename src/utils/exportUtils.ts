import { YearData } from '../types/investment';
import { getAllFlattenedMonths } from './calculations';

// Export JSON file reliably across mobile browsers, WebViews and desktop
export const exportJSONFile = async (yearsData: YearData[]): Promise<{ success: boolean; message: string }> => {
  try {
    const jsonString = JSON.stringify(yearsData, null, 2);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `cartera_inversiones_${dateStr}.json`;
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });

    // Try web share API on mobile if available and supports files
    if (navigator.canShare && navigator.share) {
      try {
        const file = new File([blob], filename, { type: 'application/json' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Copia de Cartera de Inversiones',
            text: `Copia de seguridad en formato JSON generada el ${dateStr}`,
          });
          return { success: true, message: 'Archivo compartido correctamente' };
        }
      } catch (shareErr) {
        // Fallback to normal download if share was dismissed or failed
        console.log('Native share declined or failed, falling back to download link', shareErr);
      }
    }

    // Standard Blob object URL download
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.style.display = 'none';
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();

    setTimeout(() => {
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    }, 1500);

    return { success: true, message: 'Archivo JSON descargado con éxito' };
  } catch (error) {
    console.error('Error exporting JSON:', error);
    return { success: false, message: 'No se pudo descargar el archivo JSON' };
  }
};

// Export CSV / Excel file with UTF-8 BOM for Spanish Excel compatibility
export const exportCSVFile = async (yearsData: YearData[]): Promise<{ success: boolean; message: string }> => {
  try {
    const flattened = getAllFlattenedMonths(yearsData, { includeInCourse: true });
    const rows = [
      ['Año', 'Mes', 'Estado', 'Plataforma', 'Categoría', 'Invertido (€)', 'Valoración (€)', 'Profit (€)', 'Profit (%)'],
    ];

    for (const f of flattened) {
      for (const p of f.rawMonth.platforms) {
        const profit = p.valuation - p.invested;
        const pct = p.invested > 0 ? ((profit / p.invested) * 100).toFixed(2) : '0';
        rows.push([
          String(f.year),
          f.monthName,
          f.isClosed ? 'Cerrado' : 'En Curso',
          `"${(p.name || '').replace(/"/g, '""')}"`,
          `"${(p.category || 'Otros').replace(/"/g, '""')}"`,
          String(p.invested).replace('.', ','),
          String(p.valuation).replace('.', ','),
          String(profit).replace('.', ','),
          pct.replace('.', ','),
        ]);
      }
    }

    // Add UTF-8 Byte Order Mark (\uFEFF) so Excel opens UTF-8 characters without encoding issues
    const csvContent = '\uFEFF' + rows.map((e) => e.join(';')).join('\r\n');
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `cartera_inversiones_${dateStr}.csv`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // Try web share API on mobile
    if (navigator.canShare && navigator.share) {
      try {
        const file = new File([blob], filename, { type: 'text/csv' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Exportación de Cartera Excel/CSV',
            text: `Reporte de inversiones generado el ${dateStr}`,
          });
          return { success: true, message: 'Archivo CSV compartido' };
        }
      } catch (shareErr) {
        console.log('Native share fallback to download', shareErr);
      }
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.style.display = 'none';
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();

    setTimeout(() => {
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    }, 1500);

    return { success: true, message: 'Archivo CSV descargado con éxito' };
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return { success: false, message: 'No se pudo exportar el archivo CSV' };
  }
};

// Copy JSON data to clipboard as text backup
export const copyJSONToClipboard = async (yearsData: YearData[]): Promise<boolean> => {
  try {
    const jsonString = JSON.stringify(yearsData, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(jsonString);
      return true;
    }
    // Fallback for older webviews
    const textArea = document.createElement('textarea');
    textArea.value = jsonString;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  } catch (e) {
    console.error('Clipboard copy failed:', e);
    return false;
  }
};
