// Velike črke, strešice in odvečni presledki ne štejejo kot napaka
const normalizeName = (name: string) =>
  name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export const isAcceptedCountryName = (answer: string, acceptedNames: string[]) =>
  acceptedNames.some((name) => normalizeName(name) === normalizeName(answer));
