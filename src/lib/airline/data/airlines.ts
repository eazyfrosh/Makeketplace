import type { Airline } from "@/lib/airline/types";

/**
 * Bundled square artwork keeps airline branding deterministic everywhere it
 * is rendered, including Safari's client-side PDF canvas. It also removes a
 * network request from the download path and prevents upstream logo variants
 * from changing shape between bookings.
 */
function airlineLogo(id: string): string {
  return `/airline-logos/${id}.png`;
}

export const airlines: Airline[] = [
  {
    id: "aa",
    logoSrc: airlineLogo("aa"),
    name: "American Airlines",
    code: "AA",
    logoColor: "#0078D2",
    rating: 4.1,
    baggageAllowance: { carryOn: "1 bag + 1 personal item", checked: "1st bag $35, 23kg" },
    aircraftTypes: ["Boeing 777-300ER", "Boeing 787-9", "Airbus A321neo"],
    cabins: ["economy", "premium_economy", "business", "first"],
    founded: 1926,
    hubAirport: "DFW",
  },
  {
    id: "ba",
    logoSrc: airlineLogo("ba"),
    name: "British Airways",
    code: "BA",
    logoColor: "#075AAA",
    rating: 4.3,
    baggageAllowance: { carryOn: "1 bag + 1 personal item", checked: "23kg included in most fares" },
    aircraftTypes: ["Airbus A380", "Boeing 787-9", "Airbus A350-1000"],
    cabins: ["economy", "premium_economy", "business", "first"],
    founded: 1974,
    hubAirport: "LHR",
  },
  {
    id: "dl",
    logoSrc: airlineLogo("dl"),
    name: "Delta Air Lines",
    code: "DL",
    logoColor: "#C01933",
    rating: 4.4,
    baggageAllowance: { carryOn: "1 bag + 1 personal item", checked: "1st bag $35, 23kg" },
    aircraftTypes: ["Airbus A350-900", "Boeing 767-400ER", "Airbus A321"],
    cabins: ["economy", "premium_economy", "business", "first"],
    founded: 1925,
    hubAirport: "ATL",
  },
  {
    id: "ua",
    logoSrc: airlineLogo("ua"),
    name: "United Airlines",
    code: "UA",
    logoColor: "#005DAA",
    rating: 4.0,
    baggageAllowance: { carryOn: "1 bag + 1 personal item", checked: "1st bag $35, 23kg" },
    aircraftTypes: ["Boeing 787-10", "Boeing 777-200", "Airbus A320"],
    cabins: ["economy", "premium_economy", "business", "first"],
    founded: 1926,
    hubAirport: "ORD",
  },
  {
    id: "lh",
    logoSrc: airlineLogo("lh"),
    name: "Lufthansa",
    code: "LH",
    logoColor: "#05164D",
    rating: 4.4,
    baggageAllowance: { carryOn: "1 bag + 1 personal item", checked: "23kg included in most fares" },
    aircraftTypes: ["Airbus A350-900", "Boeing 747-8", "Airbus A321"],
    cabins: ["economy", "premium_economy", "business", "first"],
    founded: 1953,
    hubAirport: "FRA",
  },
  {
    id: "af",
    logoSrc: airlineLogo("af"),
    name: "Air France",
    code: "AF",
    logoColor: "#002157",
    rating: 4.2,
    baggageAllowance: { carryOn: "1 bag + 1 personal item", checked: "23kg included in most fares" },
    aircraftTypes: ["Airbus A350-900", "Boeing 777-300ER", "Airbus A220"],
    cabins: ["economy", "premium_economy", "business", "first"],
    founded: 1933,
    hubAirport: "CDG",
  },
  {
    id: "ek",
    logoSrc: airlineLogo("ek"),
    name: "Emirates",
    code: "EK",
    logoColor: "#D71920",
    rating: 4.7,
    baggageAllowance: { carryOn: "1 bag + 1 personal item", checked: "30kg included in most fares" },
    aircraftTypes: ["Airbus A380", "Boeing 777-300ER", "Boeing 777-200LR"],
    cabins: ["economy", "premium_economy", "business", "first"],
    founded: 1985,
    hubAirport: "DXB",
  },
  {
    id: "qr",
    logoSrc: airlineLogo("qr"),
    name: "Qatar Airways",
    code: "QR",
    logoColor: "#5C0632",
    rating: 4.8,
    baggageAllowance: { carryOn: "1 bag + 1 personal item", checked: "30kg included in most fares" },
    aircraftTypes: ["Airbus A350-1000", "Boeing 787-9", "Airbus A380"],
    cabins: ["economy", "business", "first"],
    founded: 1993,
    hubAirport: "DOH",
  },
  {
    id: "tk",
    logoSrc: airlineLogo("tk"),
    name: "Turkish Airlines",
    code: "TK",
    logoColor: "#E81932",
    rating: 4.5,
    baggageAllowance: { carryOn: "1 bag + 1 personal item", checked: "23kg included in most fares" },
    aircraftTypes: ["Airbus A350-900", "Boeing 787-9", "Airbus A321neo"],
    cabins: ["economy", "business"],
    founded: 1933,
    hubAirport: "IST",
  },
  {
    id: "kl",
    logoSrc: airlineLogo("kl"),
    name: "KLM",
    code: "KL",
    logoColor: "#00A1DE",
    rating: 4.2,
    baggageAllowance: { carryOn: "1 bag + 1 personal item", checked: "23kg included in most fares" },
    aircraftTypes: ["Boeing 787-10", "Airbus A330-300", "Embraer 190"],
    cabins: ["economy", "premium_economy", "business"],
    founded: 1919,
    hubAirport: "AMS",
  },
  {
    id: "vs",
    logoSrc: airlineLogo("vs"),
    name: "Virgin Atlantic",
    code: "VS",
    logoColor: "#DA0530",
    rating: 4.4,
    baggageAllowance: { carryOn: "1 bag + 1 personal item", checked: "23kg included in most fares" },
    aircraftTypes: ["Airbus A350-1000", "Boeing 787-9", "Airbus A330-900"],
    cabins: ["economy", "premium_economy", "business"],
    founded: 1984,
    hubAirport: "LHR",
  },
  {
    id: "sq",
    logoSrc: airlineLogo("sq"),
    name: "Singapore Airlines",
    code: "SQ",
    logoColor: "#F99F1E",
    rating: 4.9,
    baggageAllowance: { carryOn: "1 bag + 1 personal item", checked: "30kg included in most fares" },
    aircraftTypes: ["Airbus A380", "Boeing 777-300ER", "Airbus A350-900"],
    cabins: ["economy", "premium_economy", "business", "first"],
    founded: 1947,
    hubAirport: "SIN",
  },
  {
    id: "ey",
    logoSrc: airlineLogo("ey"),
    name: "Etihad Airways",
    code: "EY",
    logoColor: "#BD8B13",
    rating: 4.5,
    baggageAllowance: { carryOn: "1 bag + 1 personal item", checked: "30kg included in most fares" },
    aircraftTypes: ["Boeing 787-9", "Airbus A350-1000", "Boeing 777-300ER"],
    cabins: ["economy", "business", "first"],
    founded: 2003,
    hubAirport: "AUH",
  },
  {
    id: "cx",
    logoSrc: airlineLogo("cx"),
    name: "Cathay Pacific",
    code: "CX",
    logoColor: "#006564",
    rating: 4.6,
    baggageAllowance: { carryOn: "1 bag + 1 personal item", checked: "30kg included in most fares" },
    aircraftTypes: ["Boeing 777-300ER", "Airbus A350-1000", "Airbus A321neo"],
    cabins: ["economy", "premium_economy", "business", "first"],
    founded: 1946,
    hubAirport: "HKG",
  },
  {
    id: "jl",
    logoSrc: airlineLogo("jl"),
    name: "Japan Airlines",
    code: "JL",
    logoColor: "#C8102E",
    rating: 4.7,
    baggageAllowance: { carryOn: "1 bag + 1 personal item", checked: "23kg included in most fares" },
    aircraftTypes: ["Boeing 787-9", "Boeing 777-300ER", "Airbus A350-900"],
    cabins: ["economy", "premium_economy", "business", "first"],
    founded: 1951,
    hubAirport: "HND",
  },
];

export function findAirline(id: string): Airline | undefined {
  return airlines.find((a) => a.id === id);
}

export function resolveAirline(value: string): Airline | undefined {
  const query = value.trim();
  if (!query) return undefined;

  const knownAirline = airlines.find(
    (airline) =>
      airline.id.toLowerCase() === query.toLowerCase() ||
      airline.code.toLowerCase() === query.toLowerCase() ||
      airline.name.toLowerCase() === query.toLowerCase()
  );
  if (knownAirline) return knownAirline;

  const words = query.split(/\s+/).filter(Boolean);
  const code = (words.length > 1 ? words.map((word) => word[0]).join("") : query.slice(0, 2))
    .replace(/[^a-z]/gi, "")
    .slice(0, 3)
    .toUpperCase() || "FL";

  return {
    id: `custom-${query.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "airline"}`,
    name: query,
    code,
    logoSrc: "",
    logoColor: "#2563EB",
    rating: 4.2,
    baggageAllowance: {
      carryOn: "1 bag + 1 personal item",
      checked: "Standard checked baggage allowance",
    },
    aircraftTypes: ["Boeing 787-9", "Airbus A350-900", "Airbus A321neo"],
    cabins: ["economy", "premium_economy", "business", "first"],
    founded: 0,
    hubAirport: "",
  };
}
