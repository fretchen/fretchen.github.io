/**
 * ParamTable tests — the component is spec-driven, so these assert it faithfully reflects an
 * OpenAPI schema: one row per property, required-ness from the schema's `required[]`, enum
 * values surfaced, nested array/object fields listed, and malformed input rendering nothing
 * instead of throwing.
 *
 * The schemas here mirror the real shapes served at llm-agent.fretchen.eu/openapi.json
 * (LLMChatRequest / LLMChatResponse), including the response's *absent* `required` array.
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ParamTable } from "../components/ParamTable";
import type { OpenApiSchema } from "../hooks/useOpenApiSpec";

const requestSchema: OpenApiSchema = {
  type: "object",
  required: ["model", "messages"],
  properties: {
    model: {
      type: "string",
      enum: ["mistral-large-latest"],
      description: "The model to use.",
    },
    messages: {
      type: "array",
      description: "The conversation so far.",
      items: {
        type: "object",
        required: ["role", "content"],
        properties: {
          role: { type: "string", enum: ["system", "user", "assistant"], description: "The speaker's role." },
          content: { type: "string", description: "The message text." },
        },
      },
    },
    useDummyData: { type: "boolean", description: "Vendor extension." },
  },
};

describe("ParamTable", () => {
  it("renders one row per property with its description", () => {
    render(<ParamTable schema={requestSchema} />);
    expect(screen.getByText("model")).toBeTruthy();
    expect(screen.getByText("messages")).toBeTruthy();
    expect(screen.getByText("useDummyData")).toBeTruthy();
    expect(screen.getByText("The model to use.")).toBeTruthy();
  });

  it("marks required fields from the schema's required[] and non-required ones as not", () => {
    render(<ParamTable schema={requestSchema} />);
    // model + messages are required, useDummyData is not.
    expect(screen.getAllByText("yes")).toHaveLength(2);
    expect(screen.getAllByText("no")).toHaveLength(1);
  });

  it("surfaces enum values", () => {
    render(<ParamTable schema={requestSchema} />);
    expect(screen.getByText('"mistral-large-latest"')).toBeTruthy();
  });

  it("renders an array of objects as `type[]` and lists the nested fields", () => {
    render(<ParamTable schema={requestSchema} />);
    expect(screen.getByText("object[]")).toBeTruthy();
    // Nested item fields appear under the messages row.
    expect(screen.getByText("role")).toBeTruthy();
    expect(screen.getByText("content")).toBeTruthy();
  });

  it("handles a schema with no required array (nothing marked required)", () => {
    const responseSchema: OpenApiSchema = {
      type: "object",
      properties: {
        id: { type: "string" },
        usage: {
          type: "object",
          properties: {
            prompt_tokens: { type: "integer", description: "Input tokens." },
            completion_tokens: { type: "integer" },
          },
        },
      },
    };
    render(<ParamTable schema={responseSchema} />);
    expect(screen.getByText("id")).toBeTruthy();
    expect(screen.queryAllByText("yes")).toHaveLength(0);
    // Nested object fields still render.
    expect(screen.getByText("prompt_tokens")).toBeTruthy();
  });

  it("renders the caption when given", () => {
    render(<ParamTable schema={requestSchema} caption="Request body" />);
    expect(screen.getByText("Request body")).toBeTruthy();
  });

  it("renders nothing (no throw) for null, undefined, or an empty schema", () => {
    const { container: a } = render(<ParamTable schema={null} />);
    expect(a.querySelector("table")).toBeNull();

    const { container: b } = render(<ParamTable schema={undefined} />);
    expect(b.querySelector("table")).toBeNull();

    const { container: c } = render(<ParamTable schema={{ type: "object", properties: {} }} />);
    expect(c.querySelector("table")).toBeNull();
  });
});
