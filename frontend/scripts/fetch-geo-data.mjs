import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { Country, State, City } from "country-state-city";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.resolve(__dirname, "../src/lib/data/geo");
const MANIFEST_PATH = path.join(OUTPUT_DIR, "manifest.json");

const COUNTRIES = [
  { code: "ID", name: "Indonesia" },
  { code: "MY", name: "Malaysia" },
  { code: "SG", name: "Singapore" },
  { code: "TH", name: "Thailand" },
  { code: "PH", name: "Philippines" },
  { code: "VN", name: "Vietnam" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
];

const slugify = (text, prefix) => {
  if (!text) return "";
  const slug = text
    .toString()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return `${prefix.toLowerCase()}-${slug}`;
};

const collectGeoData = async () => {
  const availableCountries = new Map(
    Country.getAllCountries().map((c) => [c.isoCode, c]),
  );

  await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: "country-state-city",
    countries: [],
  };

  for (const country of COUNTRIES) {
    const countryMeta = availableCountries.get(country.code);
    if (!countryMeta) {
      continue;
    }

    const stateEntries = [];
    const countryStates = State.getStatesOfCountry(country.code);
    let cityCount = 0;

    for (const state of countryStates) {
      const stateCode = state.isoCode || state.state_code || "";
      const stateValue =
        stateCode && stateCode.trim().length <= 6
          ? `${country.code.toLowerCase()}-${stateCode.toLowerCase()}`
          : slugify(state.name, country.code);

      const cityEntries = City.getCitiesOfState(country.code, stateCode).map((city) => ({
        value: slugify(city.name, stateValue),
        label: city.name,
      }));
      cityCount += cityEntries.length;

      stateEntries.push({
        value: stateValue,
        label: state.name,
        state_code: stateCode,
        cities: cityEntries,
      });
    }

    const countryPayload = {
      code: country.code,
      name: countryMeta.name || country.name,
      states: stateEntries,
    };

    await fs.writeFile(
      path.join(OUTPUT_DIR, `${country.code}.json`),
      JSON.stringify(countryPayload, null, 2),
      "utf8",
    );

    manifest.countries.push({
      code: country.code,
      name: countryMeta.name || country.name,
      states: stateEntries.length,
      cities: cityCount,
    });

    console.log(`Geo data saved for ${country.code}`);
  }

  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Manifest saved to ${MANIFEST_PATH}`);
};

collectGeoData().catch((error) => {
  console.error("Geo data generation failed:", error);
  process.exitCode = 1;
});

