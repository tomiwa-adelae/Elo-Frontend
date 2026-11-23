// ISO 3166-1 alpha-2 codes. Names come from Intl.DisplayNames so they're
// always spelled the way the shopper's browser expects.
const CODES =
  "AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CD CF CG CH CI CK CL CM CN CO CR CU CV CW CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW".split(
    " "
  )

let displayNames: Intl.DisplayNames | null = null

export function countryName(code: string): string {
  try {
    displayNames ??= new Intl.DisplayNames(["en"], { type: "region" })
    return displayNames.of(code) ?? code
  } catch {
    return code
  }
}

/**
 * Countries to offer at checkout: Nigeria first, then every country ELO
 * ships to, alphabetically. With a rest-of-world zone, that's everywhere.
 */
export function shippingCountries(available: { worldwide: boolean; countries: string[] }) {
  const codes = available.worldwide ? CODES : available.countries
  return [
    { code: "NG", name: countryName("NG") },
    ...codes
      .filter((c) => c !== "NG")
      .map((code) => ({ code, name: countryName(code) }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  ]
}
