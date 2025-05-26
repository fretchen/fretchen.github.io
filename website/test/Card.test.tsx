import { describe, it, expect } from "vitest";
import React from "react";
import { Card } from "../components/Card";

// Einfacher Test ohne React Testing Library für erste Versuche
describe("Card Component", () => {
  it("should be importable", () => {
    expect(typeof Card).toBe("function");
  });

  it("should be a React component", () => {
    expect(Card).toBeDefined();
    expect(typeof Card).toBe("function");
  });

  // Test der Props-Interface
  it("should accept the correct props interface", () => {
    const mockProps = {
      title: "Test Title",
      description: "Test Description",
      link: "/test-link",
    };

    // Teste dass keine Fehler beim Erstellen mit korrekten Props auftreten
    expect(() => {
      const element = React.createElement(Card, mockProps);
      expect(element).toBeDefined();
    }).not.toThrow();
  });
});
