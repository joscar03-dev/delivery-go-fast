import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'penCurrency',
  standalone: true,
})
export class PenCurrencyPipe implements PipeTransform {
  transform(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
      return 'S/ 0.00';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return 'S/ 0.00';
    }

    // Formatear con 2 decimales y separadores de miles
    const formatted = numValue.toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return `S/ ${formatted}`;
  }
}
