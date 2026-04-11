// Formatea a moneda local (ej: $1,234.50)
export const formatCurrency = (value: number | string): string =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value));

// Formatea fecha legible
export const formatDate = (date: string | Date): string =>
  new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));

// Trunca texto largo
export const truncate = (text: string, max = 40): string =>
  text.length > max ? `${text.slice(0, max)}…` : text;
