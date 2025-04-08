import { cityAliases } from './cityAliases';
import { hebrewToEnglishCities } from './hebrewToEnglishCities';


// export function normalizeCityName(city: string): string {
//   const cleaned = city.toLowerCase().replace(/[^\w\s]/gi, '').trim();
//   return cityAliases[cleaned] || city;
// }

export function normalizeCityName(city: string): string {
  //Try mapping directly if it's Hebrew
  const trimmed = city.trim();
  const fromHebrew = hebrewToEnglishCities[trimmed];

  //Use the mapped English version if available, otherwise use the original
  const base = fromHebrew ?? city;

  const cleaned = base.toLowerCase().replace(/[^\w\s]/gi, '').trim();

  return cityAliases[cleaned] || cleaned;
}