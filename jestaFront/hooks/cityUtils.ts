import { cityAliases } from './cityAliases';

export function normalizeCityName(city: string): string {
  const cleaned = city.toLowerCase().replace(/[^\w\s]/gi, '').trim();
  return cityAliases[cleaned] || city;
}
