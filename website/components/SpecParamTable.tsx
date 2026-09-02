/**
 * SpecParamTable — fetches one schema from a live openapi.json and renders it via
 * ParamTable, with a graceful loading/error state.
 *
 * The shared unit between pages/agent-onboarding and pages/x402/sellers is exactly
 * this: fetch a spec, pick one schema, render one table, degrade gracefully if the
 * fetch fails. How many of these a page renders, and whether it groups them or
 * interleaves them with its own prose, is layout — that stays local to each page.
 * Multiple instances pointed at the same specUrl share one cached fetch
 * (useOpenApiSpec keys on the URL with staleTime: Infinity), so using this more than
 * once per page costs nothing extra.
 */
import React from "react";
import { css } from "../styled-system/css";
import { useOpenApiSpec } from "../hooks/useOpenApiSpec";
import { ParamTable } from "./ParamTable";

export interface SpecParamTableProps {
  specUrl: string;
  schemaName: string;
  caption?: string;
  /** Extra sentence appended to the fallback message, for a page-specific caveat
   *  (e.g. "the service scales to zero, so it may be waking up"). */
  notLoadedHint?: string;
}

export function SpecParamTable({ specUrl, schemaName, caption, notLoadedHint }: SpecParamTableProps) {
  const { spec, isLoading, error } = useOpenApiSpec(specUrl);
  const schema = spec?.components?.schemas?.[schemaName];

  if (isLoading) {
    return <p className={css({ fontSize: "sm", color: "gray.500" })}>Loading the live spec…</p>;
  }

  if (error || !schema) {
    return (
      <p className={css({ fontSize: "sm", color: "gray.600" })}>
        Couldn&apos;t load the live spec right now{notLoadedHint ? ` (${notLoadedHint})` : ""}. Read it directly at{" "}
        <a href={specUrl} target="_blank" rel="noopener noreferrer">
          {specUrl}
        </a>
        .
      </p>
    );
  }

  return <ParamTable schema={schema} caption={caption} />;
}
