/**
 * The site-wide currency choice: EURe is the default (the sellers prefer it — deployed
 * `STABLECOIN_PREFERENCE`), EURC and USDC are one toggle away, and a stored choice always wins,
 * so the default only ever applies to a visitor with no stored preference yet.
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
  CURRENCY_DECIMALS,
  DEFAULT_CURRENCY,
  PAYMENT_CURRENCIES,
  networksForCurrency,
  offeredCurrencies,
  preferCurrency,
  readCurrency,
  selectFundedCurrency,
  storeCurrency,
  type PaymentCurrency,
} from "../hooks/x402Currency";

const BASE_EURE = "0xbf6e2966A9C3D99C9E4D069E04f7Bdb9C8aa762C" as const;
const BASE_EURC = "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42" as const;
const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;

const ALL_NETWORKS = ["eip155:10", "eip155:11155420", "eip155:8453", "eip155:84532"];

/** A minimal `accepts` entry — the selector only reads `network` and `asset`. */
const accept = (network: string, asset: string) => ({ network, asset });

describe("readCurrency / storeCurrency", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to EURe when nothing is stored — the sellers' preferred token", () => {
    expect(DEFAULT_CURRENCY).toBe("EURe");
    expect(readCurrency()).toBe("EURe");
  });

  it("returns a stored choice unchanged — existing visitors never see the default flip", () => {
    window.localStorage.setItem("x402-currency", "EURC");
    expect(readCurrency()).toBe("EURC");
    storeCurrency("USDC");
    expect(readCurrency()).toBe("USDC");
  });

  it("falls back to the default for a stored value this site does not pay with", () => {
    window.localStorage.setItem("x402-currency", "DOGE");
    expect(readCurrency()).toBe("EURe");
  });

  it("lists the currencies in preference order", () => {
    expect(PAYMENT_CURRENCIES).toEqual(["EURe", "EURC", "USDC"]);
  });
});

describe("CURRENCY_DECIMALS", () => {
  it("knows each token's decimals — EURe is 18, the others 6", () => {
    expect(CURRENCY_DECIMALS).toEqual({ EURe: 18, EURC: 6, USDC: 6 });
  });
});

describe("networksForCurrency", () => {
  it("narrows EURe and EURC to the Base networks, keeps USDC everywhere", () => {
    expect(networksForCurrency("EURe", ALL_NETWORKS)).toEqual(["eip155:8453", "eip155:84532"]);
    expect(networksForCurrency("EURC", ALL_NETWORKS)).toEqual(["eip155:8453", "eip155:84532"]);
    expect(networksForCurrency("USDC", ALL_NETWORKS)).toEqual(ALL_NETWORKS);
  });

  it("keeps a caller's order", () => {
    expect(networksForCurrency("EURe", ["eip155:84532", "eip155:8453", "eip155:10"])).toEqual([
      "eip155:84532",
      "eip155:8453",
    ]);
  });
});

describe("preferCurrency selector", () => {
  it("picks the EURe entry out of a mixed offer", () => {
    const accepts = [
      accept("eip155:8453", BASE_EURE),
      accept("eip155:8453", BASE_EURC),
      accept("eip155:8453", BASE_USDC),
    ];
    expect(preferCurrency("EURe")(2, accepts)).toMatchObject({ asset: BASE_EURE });
  });

  it("falls back to the seller's own first entry when the preferred currency is not offered", () => {
    const accepts = [accept("eip155:10", "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85")];
    expect(preferCurrency("EURe")(2, accepts)).toBe(accepts[0]);
  });

  it("reports the currency actually paid via onPick — the fallback names the paid token", () => {
    const accepts = [accept("eip155:8453", BASE_EURE), accept("eip155:8453", BASE_USDC)];
    let paid: string | null | undefined;
    // EURC is not offered: the selector falls back to the seller's first entry and reports
    // THAT currency — the label must name what was paid, not what was preferred.
    preferCurrency("EURC", (p) => (paid = p))(2, accepts);
    expect(paid).toBe("EURe");
    preferCurrency("EURe", (p) => (paid = p))(2, accepts);
    expect(paid).toBe("EURe");
  });
});

describe("selectFundedCurrency", () => {
  /** `fundable` answers "can this token's wallet balance cover the deposit floor". */
  const funded = (...held: PaymentCurrency[]) => (c: PaymentCurrency) => held.includes(c);
  const all = ["EURe", "EURC", "USDC"] as const;

  it("keeps the paid currency when it can fund the deposit", () => {
    expect(selectFundedCurrency("EURe", all, () => true)).toEqual({ currency: "EURe", fellBack: false });
  });

  it("falls back to the first funded candidate in preference order — EURC before USDC", () => {
    expect(selectFundedCurrency("EURe", all, funded("EURC", "USDC"))).toEqual({ currency: "EURC", fellBack: true });
  });

  it("skips an unfunded candidate to the next funded one", () => {
    expect(selectFundedCurrency("EURe", all, funded("USDC"))).toEqual({ currency: "USDC", fellBack: true });
  });

  it("keeps today's behavior when nothing is fundable — the failure wording is then honest advice", () => {
    expect(selectFundedCurrency("EURe", all, () => false)).toEqual({ currency: "EURe", fellBack: false });
  });

  it("keeps the paid currency when no candidates are offered", () => {
    expect(selectFundedCurrency("USDC", [], () => true)).toEqual({ currency: "USDC", fellBack: false });
  });

  it("never picks a currency the seller does not offer, even when its balance would fund it", () => {
    expect(selectFundedCurrency("EURe", ["USDC"], funded("EURe", "USDC"))).toEqual({ currency: "USDC", fellBack: true });
  });
});

describe("offeredCurrencies", () => {
  it("lists the seller's offered tokens on the network, in preference order", () => {
    const accepts = [
      accept("eip155:8453", BASE_USDC),
      accept("eip155:8453", BASE_EURE),
      accept("eip155:8453", BASE_EURC),
    ];
    expect(offeredCurrencies(accepts, "eip155:8453")).toEqual(["EURe", "EURC", "USDC"]);
  });

  it("ignores offers on other networks and tokens this site does not pay with", () => {
    const accepts = [
      accept("eip155:10", BASE_USDC),
      accept("eip155:8453", "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85"), // not a settlement token
    ];
    expect(offeredCurrencies(accepts, "eip155:8453")).toEqual([]);
  });

  it("is empty for an unreadable offer — no candidates, no fallback", () => {
    expect(offeredCurrencies(null, "eip155:8453")).toEqual([]);
  });
});
