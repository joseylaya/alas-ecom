export function formatPeso(centavos: number): string { return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(centavos / 100); }
