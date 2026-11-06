import type { LonLat } from "./geo";

export type QuestionKind = "mesto" | "regija" | "zgodovina";

type Base = {
  id: string;
  prompt: string;
  instruction: string;
  answer: string;
  fact: string;
  curriculum: string;
};

export type PointQuestion = Base & {
  kind: "mesto" | "zgodovina";
  target: LonLat;
};

export type RegionQuestion = Base & {
  kind: "regija";
  // ISO 3166-1 numerične oznake, kot jih uporablja world-atlas
  countryIds: string[];
  labelAt: LonLat;
};

export type Question = PointQuestion | RegionQuestion;

export const KINDS: Record<
  QuestionKind,
  { label: string; plural: string; color: string }
> = {
  mesto: { label: "Mesto", plural: "Mesta", color: "var(--mesto)" },
  regija: { label: "Regija", plural: "Regije", color: "var(--regija)" },
  zgodovina: { label: "Zgodovina", plural: "Zgodovina", color: "var(--zgodovina)" },
};

// Zaenkrat samo tri naloge, da se vidi potek igre. Prava baza pride kasneje.
export const QUESTIONS: Question[] = [
  {
    id: "madrid",
    kind: "mesto",
    prompt: "Glavno mesto Španije",
    instruction: "Klikni na zemljevid čim bližje iskanemu mestu.",
    answer: "Madrid",
    target: [-3.7038, 40.4168],
    fact: "Madrid leži sredi Pirenejskega polotoka na planoti Meseti, približno 650 metrov nad morjem. Ker je daleč od morja, ima bolj celinsko podnebje: poletja so vroča in suha, zime pa precej hladne.",
    curriculum: "Geografija, 7. razred: Južna Evropa",
  },
  {
    id: "skandinavija",
    kind: "regija",
    prompt: "Kje je Skandinavija?",
    instruction: "Klikni kamor koli znotraj regije.",
    answer: "Skandinavija",
    countryIds: ["578", "752", "208"],
    labelAt: [15.5, 63.5],
    fact: "Skandinavijo sestavljajo Norveška, Švedska in Danska. V ledeni dobi so ledeniki poglobili doline ob norveški obali, pozneje pa jih je zalilo morje. Tako so nastali fjordi. Finska in Islandija nista del Skandinavije, spadata pa med nordijske države.",
    curriculum: "Geografija, 7. razred: Severna Evropa",
  },
  {
    id: "francoska-revolucija",
    kind: "zgodovina",
    prompt: "Kje se je začela francoska revolucija?",
    instruction: "Klikni na mesto, kjer se je to zgodilo.",
    answer: "Pariz",
    target: [2.3522, 48.8566],
    fact: "Za začetek revolucije velja 14. julij 1789, ko so prebivalci Pariza zavzeli Bastiljo, utrjeni zapor in simbol absolutne monarhije. Ta dan je danes francoski državni praznik. Geslo revolucije je bilo „Svoboda, enakost, bratstvo“.",
    curriculum: "Zgodovina, 8. razred: Francoska revolucija",
  },
];
