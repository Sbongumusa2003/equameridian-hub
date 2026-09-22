import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a date in South Africa Standard Time (Africa/Johannesburg, UTC+2).
 * Usage: {{ value | sastDate }} or {{ value | sastDate:'datetime' }}
 */
@Pipe({ name: 'sastDate', standalone: false })
export class SastDatePipe implements PipeTransform {
  private readonly timeZone = 'Africa/Johannesburg';

  transform(value: string | Date | null | undefined, mode: 'date' | 'datetime' | 'time' = 'datetime'): string {
    if (value == null || value === '') return '';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);

    let options: Intl.DateTimeFormatOptions;
    switch (mode) {
      case 'date':
        options = { year: 'numeric', month: 'short', day: '2-digit' };
        break;
      case 'time':
        options = { hour: '2-digit', minute: '2-digit', hour12: false };
        break;
      default:
        options = {
          year: 'numeric', month: 'short', day: '2-digit',
          hour: '2-digit', minute: '2-digit', hour12: false
        };
    }

    const formatted = new Intl.DateTimeFormat('en-ZA', { ...options, timeZone: this.timeZone }).format(d);
    return mode === 'date' ? formatted : `${formatted} SAST`;
  }
}
