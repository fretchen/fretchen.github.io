/**
 * ParamTable — renders an API parameter reference **from an OpenAPI schema**.
 *
 * Spec-driven by design: there is intentionally no prop for hand-written rows. If you want an
 * endpoint documented here, publish a spec for it. That keeps the docs from drifting away
 * from the API (the failure mode of hand-maintained tables) and nudges every service toward
 * being properly spec-described.
 *
 * Styling mirrors the local table recipe in `pages/x402/+Page.tsx` so that page can adopt
 * this component once its service publishes a spec.
 */
import React from "react";
import { css } from "../styled-system/css";
import type { OpenApiSchema } from "../hooks/useOpenApiSpec";

const table = css({
  width: "100%",
  borderCollapse: "collapse",
  marginBottom: "4",
  fontSize: "sm",
  "& th, & td": {
    padding: "8px 12px",
    borderBottom: "1px solid token(colors.border, #e5e7eb)",
    textAlign: "left",
    verticalAlign: "top",
  },
  "& th": {
    fontWeight: "semibold",
    backgroundColor: "codeBg",
  },
  "& tr:last-child td": { borderBottom: "none" },
});

const fieldName = css({ fontFamily: "mono", fontSize: "xs", fontWeight: "semibold", color: "gray.800" });
const typeCell = css({ fontFamily: "mono", fontSize: "xs", color: "brand", whiteSpace: "nowrap" });
const requiredYes = css({ fontSize: "xs", fontWeight: "semibold", color: "red.600" });
const requiredNo = css({ fontSize: "xs", color: "gray.400" });
const descCell = css({ fontSize: "xs", color: "gray.600", lineHeight: "normal" });
const nestedList = css({ mt: "1", pl: "3", borderLeft: "2px solid token(colors.border, #e5e7eb)" });
const nestedRow = css({ fontSize: "xs", color: "gray.600", lineHeight: "relaxed" });
const enumValue = css({ fontFamily: "mono", fontSize: "xs", color: "gray.700" });

/** Human-readable type for a schema node, e.g. `string`, `object[]`, `integer`. */
function typeLabel(schema: OpenApiSchema): string {
  if (schema.type === "array") {
    const inner = schema.items?.type ?? "any";
    return `${inner}[]`;
  }
  return schema.type ?? "any";
}

/** The nested object whose properties we should list under a row, if any. */
function nestedProperties(schema: OpenApiSchema): {
  props: Record<string, OpenApiSchema>;
  required: string[];
} | null {
  const target = schema.type === "array" ? schema.items : schema;
  if (!target?.properties || Object.keys(target.properties).length === 0) return null;
  return { props: target.properties, required: target.required ?? [] };
}

function NestedFields({ schema }: { schema: OpenApiSchema }) {
  const nested = nestedProperties(schema);
  if (!nested) return null;
  return (
    <div className={nestedList}>
      {Object.entries(nested.props).map(([name, child]) => (
        <div key={name} className={nestedRow}>
          <span className={fieldName}>{name}</span> <span className={typeCell}>{typeLabel(child)}</span>
          {nested.required.includes(name) && <span className={requiredYes}> required</span>}
          {child.description ? ` — ${child.description}` : null}
          {/* One extra level is plenty for readable docs (e.g. choices[].message.content). */}
          <NestedFieldsLeaf schema={child} required={child.required ?? []} />
        </div>
      ))}
    </div>
  );
}

/** Renders one final level of nesting inline, without recursing further. */
function NestedFieldsLeaf({ schema, required }: { schema: OpenApiSchema; required: string[] }) {
  const nested = nestedProperties(schema);
  if (!nested) return null;
  return (
    <div className={nestedList}>
      {Object.entries(nested.props).map(([name, child]) => (
        <div key={name} className={nestedRow}>
          <span className={fieldName}>{name}</span> <span className={typeCell}>{typeLabel(child)}</span>
          {(nested.required.includes(name) || required.includes(name)) && (
            <span className={requiredYes}> required</span>
          )}
          {child.description ? ` — ${child.description}` : null}
        </div>
      ))}
    </div>
  );
}

export interface ParamTableProps {
  /** An OpenAPI object schema (from `components.schemas.*`). */
  schema: OpenApiSchema | null | undefined;
  /** Optional caption rendered above the table. */
  caption?: string;
}

export function ParamTable({ schema, caption }: ParamTableProps) {
  const properties = schema?.properties;
  if (!properties || Object.keys(properties).length === 0) return null;
  const required = schema?.required ?? [];

  return (
    <div>
      {caption && <p className={css({ fontSize: "xs", color: "gray.500", mb: "1" })}>{caption}</p>}
      <table className={table}>
        <thead>
          <tr>
            <th>Field</th>
            <th>Type</th>
            <th>Required</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(properties).map(([name, prop]) => (
            <tr key={name}>
              <td className={fieldName}>{name}</td>
              <td className={typeCell}>{typeLabel(prop)}</td>
              <td>
                {required.includes(name) ? (
                  <span className={requiredYes}>yes</span>
                ) : (
                  <span className={requiredNo}>no</span>
                )}
              </td>
              <td className={descCell}>
                {prop.description}
                {prop.enum && prop.enum.length > 0 && (
                  <div className={css({ mt: "1" })}>
                    One of:{" "}
                    {prop.enum.map((v, i) => (
                      <React.Fragment key={String(v)}>
                        {i > 0 && ", "}
                        <span className={enumValue}>{JSON.stringify(v)}</span>
                      </React.Fragment>
                    ))}
                  </div>
                )}
                <NestedFields schema={prop} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ParamTable;
