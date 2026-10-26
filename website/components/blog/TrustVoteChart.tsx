import React from "react";
import { css } from "../../styled-system/css";
import { widgetCard } from "./widgetCard";
import { SvgLineChart } from "./SvgLineChart";

/**
 * Static two-panel figure for the trust/populism post: representative trust in the
 * Bundestag (top) and the populist second-vote share (bottom), East and West, over
 * the seven Bundestagswahlen 2002–2025. Values are the ESS weighted means and the
 * PopuList-classified vote shares from the notebooks — the same numbers as the table
 * in the post, which stays authoritative for exact values.
 */

export const X_TICKS = ["2002", "2005", "2009", "2013", "2017", "2021", "2025"].map((label, index) => ({
  index,
  label,
}));

// Tableau-10 blue / red — series identity, not brand (see palette.ts).
export const WEST = "#4e79a7";
export const OST = "#e15759";

export const TRUST_WEST = [4.05, 3.6, 3.95, 4.15, 4.6, 4.16, 4.26];
export const TRUST_OST = [3.43, 3.27, 3.5, 3.6, 3.88, 3.66, 3.42];
export const VOTE_WEST = [1.3, 5.2, 8.4, 9.9, 17.9, 11.8, 29.5];
export const VOTE_OST = [16.5, 24.9, 28.0, 27.9, 39.5, 31.3, 58.0];

export default function TrustVoteChart() {
  return (
    <div className={widgetCard()}>
      <h4
        className={css({
          fontSize: "md",
          fontWeight: "semibold",
          textAlign: "center",
          marginBottom: "2",
          color: "gray.700",
        })}
      >
        Vertrauen in den Bundestag (ESS, Skala 0–10)
      </h4>
      <SvgLineChart
        series={[
          { label: "West", values: TRUST_WEST, color: WEST },
          { label: "Ost", values: TRUST_OST, color: OST },
        ]}
        height={190}
        xTicks={X_TICKS}
        yAxisTitle="Vertrauen (0–10)"
        yMin={0}
        yMax={5}
      />
      <h4
        className={css({
          fontSize: "md",
          fontWeight: "semibold",
          textAlign: "center",
          marginTop: "4",
          marginBottom: "2",
          color: "gray.700",
        })}
      >
        Zweitstimmenanteil der Populisten (PopuList-Parteien)
      </h4>
      <SvgLineChart
        series={[
          { label: "West", values: VOTE_WEST, color: WEST },
          { label: "Ost", values: VOTE_OST, color: OST },
        ]}
        height={190}
        xTicks={X_TICKS}
        yAxisTitle="Populisten (%)"
        yMin={0}
        yMax={60}
      />
    </div>
  );
}
