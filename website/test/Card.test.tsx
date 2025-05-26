import { describe, it, expect } from "vitest";
import React from "react";
import { Card } from "../components/Card";

/**
 * Basic component tests for the Card component
 * Tests component importability and props interface
 * 
 * @fileoverview Simple unit tests covering component structure and prop validation
 * for the Card component without complex rendering tests
 */
describe("Card Component", () => {
  /**
   * Tests component importability and function type
   * @test {Function} Card - Component should be importable as function
   */
  it("should be importable", () => {
    expect(typeof Card).toBe("function");
  });

  /**
   * Tests component definition and React component structure
   * @test {Function} Card - Component should be defined as React function
   */
  it("should be a React component", () => {
    expect(Card).toBeDefined();
    expect(typeof Card).toBe("function");
  });

  /**
   * Tests props interface compatibility and React element creation
   * @test {Object} props - Component props interface validation
   * @test {ReactElement} element - React element creation without errors
   */
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
