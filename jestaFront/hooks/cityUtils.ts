import { cityAliases } from './cityAliases';
import { hebrewToEnglishCities } from './hebrewToEnglishCities';

export function normalizeCityName(city) {
  if (!city || typeof city !== 'string') return city;

  const trimmed = city.trim();

  const fromHebrew = hebrewToEnglishCities[trimmed];

  const base = fromHebrew ?? city;

  const cleaned = base
    .toLowerCase()
    .replace(/[^\w\s]|_/g, '')   
    .replace(/\s+/g, ' ')         
    .trim();

  const cityAliasOverrides={ //: Record<string, string> = {
    "tel aviv yafo": "tel aviv",
    "tel avivyafo": "tel aviv",
    "telavivyafo": "tel aviv",
    "telaviv yafo": "tel aviv",
    "tel aviv-yafo": "tel aviv",
    "tel-aviv": "tel aviv",

    "bs": "be'er sheva",
    "ב''ש": "be'er sheva",
    "ב״ש": "be'er sheva",
    "בארשבע": "be'er sheva",
    "beer sheva": "be'er sheva",

    "yafo": "tel aviv",
    "יפו": "tel aviv",

    "modiin": "modi'in",
    "modiin macabim reut": "modi'in",
    "מודיעין מכבים רעות": "modi'in",
  };

  const aliasKey = cityAliasOverrides[cleaned] || cleaned;

  return cityAliases[aliasKey] || aliasKey;
}
