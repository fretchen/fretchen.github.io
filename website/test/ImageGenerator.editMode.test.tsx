/**
 * ImageGenerator Edit Mode Integratio  describe("🟡 MITTEL: Ba    it("sollte File Upload Input haben", () => {
      render(<ImageGenerator />); Integration Tests", () => {
    it("sollte Component rendern können", async () => {
      mockConnectedWallet(); // Force expanded UI
      render(<ImageGenerator />);

      // Prüfe dass wichtige Elemente vorhanden sind (now in expanded state)
      expect(screen.getByText(/Create Collectible AI Art/)).toBeInTheDocument();s
 *
 * Tests für die I    it("sollte Component ohne Fehler rendern", async () => {
      mockConnectedWallet(); // Force expanded UI
      const onError = vi.fn();
      render(<ImageGenerator onError={onError} />);

      // Prüfe dass Komponente korrekt rendert ohne onError aufzurufen
      expect(screen.getByTestId("locale-imagegen.title")).toBeInTheDocument();ner    it("sollte Textarea Eingabe handhaben können", async () => {
      mockConnectedWallet(); // Force expanded UI
      render(<ImageGenerator />);or Komponente im Edit-Modus:
 * - File Upload → API Integration
 * - Edit Mode vs Generate Mode
 * - UI State Management
 *
 * Priorität: MITTEL - Component Integration
 * Nutzt setup.ts Mocks für wagmi, useLocale etc.
 */

import React from "react";
import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ImageGenerator } from "../components/ImageGenerator";
import { useAccount } from "wagmi";

// Override wagmi mock for this file to force connected state for all tests
beforeAll(() => {
  vi.mocked(useAccount).mockReturnValue({
    address: "0x1234567890123456789012345678901234567890" as `0x${string}`,
    isConnected: true,
    status: "connected",
    isConnecting: false,
    isDisconnected: false,
    isReconnecting: false,
  } as ReturnType<typeof useAccount>);
});

describe("ImageGenerator Edit Mode Integration", () => {
  const mockApiResponse = {
    metadata_url: "https://example.com/metadata.json",
    image_url: "https://example.com/image.jpg",
    mintPrice: "10000000000000000",
    message: "Success",
    transaction_hash: "0xabc123",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock fetch für API-Aufrufe
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockApiResponse),
    });

    // Einfache URL Mocks
    global.URL = global.URL || {};
    global.URL.createObjectURL = global.URL.createObjectURL || vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = global.URL.revokeObjectURL || vi.fn();
  });

  describe("🟡 MITTEL: Basic Integration Tests", () => {
    it("sollte Component rendern können", () => {
      render(<ImageGenerator />);

      // Prüfe dass wichtige Elemente vorhanden sind
      expect(screen.getByText("Create Collectible AI Art • 10¢")).toBeInTheDocument();
      expect(screen.getByTestId("reference-image-input")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Describe your image in detail...")).toBeInTheDocument();
    });

    it("sollte File Upload Input haben", async () => {
      render(<ImageGenerator />);

      const fileInput = screen.getByTestId("reference-image-input");
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute("accept", "image/*");
      expect(fileInput).toHaveAttribute("type", "file");
    });

    it("sollte Button zum Erstellen haben", () => {
      render(<ImageGenerator />);

      const createButton = screen.getByText(/Enter a prompt to create/);
      expect(createButton).toBeInTheDocument();
      expect(createButton.tagName.toLowerCase()).toBe("button");
    });
  });

  describe("🟡 MITTEL: Error Handling", () => {
    it("sollte Component ohne Fehler rendern", () => {
      const onError = vi.fn();
      render(<ImageGenerator onError={onError} />);

      // Prüfe dass Komponente korrekt rendert ohne onError aufzurufen
      expect(screen.getByText("Create Collectible AI Art • 10¢")).toBeInTheDocument();
      expect(onError).not.toHaveBeenCalled();
    });

    it("sollte Textarea Eingabe handhaben können", () => {
      render(<ImageGenerator />);

      const textarea = screen.getByPlaceholderText("Describe your image in detail...");

      fireEvent.change(textarea, { target: { value: "Test prompt" } });

      expect(textarea).toHaveValue("Test prompt");
    });
  });
});
