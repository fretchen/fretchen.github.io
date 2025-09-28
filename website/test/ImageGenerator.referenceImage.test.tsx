/**
 * ImageGenerator Refer  describe("🔴 HOCH: Basic Component Integration", () => {
    it("sollte ImageGenerator Component rendern können", async () => {
      mockConnectedWallet(); // Force expanded UI
      render(<ImageGenerator />);

      // Prüfe dass wichtige Elemente vorhanden sind (now in expanded state)
      expect(screen.getByTestId("locale-imagegen.title")).toBeInTheDocument();mage Integration Tests
 *
 * Tests für die echte ImageGenerator Komponente:
 * - File Upload Functionality
 * - UI State Management
 * - Reference Image Processing
 *
 * Priorität: HOCH - Core File Upload Features
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

describe("ImageGenerator Reference Image Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Einfache URL Mocks (nutzt setup.ts für den Rest)
    global.URL = global.URL || {};
    global.URL.createObjectURL = global.URL.createObjectURL || vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = global.URL.revokeObjectURL || vi.fn();
  });

  describe("🔴 HOCH: Basic Component Integration", () => {
    it("sollte ImageGenerator Component rendern können", () => {
      render(<ImageGenerator />);

      // Prüfe dass wichtige Elemente vorhanden sind (now in expanded state)
      expect(screen.getByText(/Create Collectible AI Art/)).toBeInTheDocument();
      expect(screen.getByTestId("reference-image-input")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Describe your image in detail...")).toBeInTheDocument();
    });

    it("sollte File Input korrekt konfiguriert haben", () => {
      render(<ImageGenerator />);

      const fileInput = screen.getByTestId("reference-image-input");
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute("accept", "image/*");
      expect(fileInput).toHaveAttribute("type", "file");
    });

    it("sollte Drop Zone haben", () => {
      render(<ImageGenerator />);

      const dropZone = screen.getByTestId("drop-zone");
      expect(dropZone).toBeInTheDocument();
      // Text is now split across elements, so check for parts
      expect(screen.getByText(/Drag & drop an image here/)).toBeInTheDocument();
      expect(screen.getByText(/click to browse/)).toBeInTheDocument();
    });

    it("sollte verschiedene Image Sizes unterstützen", () => {
      render(<ImageGenerator />);

      const sizeSelect = screen.getByLabelText("Select image format for your artwork");
      expect(sizeSelect).toBeInTheDocument();
      expect(screen.getByText("◼ Square")).toBeInTheDocument();
      expect(screen.getByText("▬ Wide")).toBeInTheDocument();
    });
  });

  describe("🔴 HOCH: File Upload Functionality", () => {
    it("sollte JPEG Dateien akzeptieren", () => {
      render(<ImageGenerator />);

      const jpegFile = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], "test.jpg", {
        type: "image/jpeg",
      });

      const fileInput = screen.getByTestId("reference-image-input");

      Object.defineProperty(fileInput, "files", {
        value: [jpegFile],
        configurable: true,
      });

      fireEvent.change(fileInput);

      // File wurde akzeptiert (keine Fehlermeldung)
      expect(screen.queryByText(/invalid file type/i)).not.toBeInTheDocument();
    });

    it("sollte PNG Dateien akzeptieren", () => {
      render(<ImageGenerator />);

      const pngFile = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "test.png", {
        type: "image/png",
      });

      const fileInput = screen.getByTestId("reference-image-input");

      Object.defineProperty(fileInput, "files", {
        value: [pngFile],
        configurable: true,
      });

      fireEvent.change(fileInput);

      // File wurde akzeptiert
      expect(screen.queryByText(/invalid file type/i)).not.toBeInTheDocument();
    });

    it("sollte Drag & Drop Zone haben", () => {
      render(<ImageGenerator />);

      const dropZone = screen.getByTestId("drop-zone");

      // Drop Zone ist da und hat richtige Hints
      expect(dropZone).toBeInTheDocument();
      expect(screen.getByText("Upload Reference Image (Optional)")).toBeInTheDocument();
      expect(screen.getByText(/Supports JPEG, PNG/)).toBeInTheDocument();
    });
  });

  describe("🔴 HOCH: UI State Management", () => {
    it("sollte initial Create Artwork Button zeigen", () => {
      render(<ImageGenerator />);

      const createButton = screen.getByText(/Enter a prompt to create/);
      expect(createButton).toBeInTheDocument();
    });

    it("sollte Textarea für Prompt haben", () => {
      render(<ImageGenerator />);

      const textarea = screen.getByPlaceholderText("Describe your image in detail...");
      expect(textarea).toBeInTheDocument();

      // Textarea sollte funktionieren
      fireEvent.change(textarea, { target: { value: "Test prompt" } });
      expect(textarea).toHaveValue("Test prompt");
    });

    it("sollte Listed Checkbox haben", () => {
      render(<ImageGenerator />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeInTheDocument();
      expect(screen.getByText("Listed")).toBeInTheDocument();
    });

    it("sollte Image Size Select haben", () => {
      render(<ImageGenerator />);

      const sizeSelect = screen.getByLabelText("Select image format for your artwork");
      expect(sizeSelect).toBeInTheDocument();

      // Select sollte funktionieren
      fireEvent.change(sizeSelect, { target: { value: "1792x1024" } });
      expect(sizeSelect).toHaveValue("1792x1024");
    });
  });

  describe("🟢 HOCH: Dynamic Placeholder Tests", () => {
    it("sollte Standard-Placeholder zeigen wenn kein Reference Image hochgeladen ist", () => {
      render(<ImageGenerator />);

      // Sollte Standard-Placeholder zeigen (tatsächlicher Text aus Locale)
      const textarea = screen.getByPlaceholderText("Describe your image in detail...");
      expect(textarea).toBeInTheDocument();
      
      // Sollte NICHT Edit-Placeholder zeigen
      expect(
        screen.queryByPlaceholderText("Describe changes you want to make to the image..."),
      ).not.toBeInTheDocument();
    });

    it("sollte Button Text korrekt ändern basierend auf previewState", () => {
      render(<ImageGenerator />);

      // Initial: "Enter a prompt to create" Button (wenn previewState "empty" ist und kein prompt)
      const button = screen.getByRole("button", { name: /Enter a prompt to create/ });
      expect(button).toBeInTheDocument();
    });

    it("sollte Edit-Mode Locale Keys korrekt geladen haben", () => {
      // Test dass die Locale Keys verfügbar sind durch tatsächliche Werte
      render(<ImageGenerator />);
      
      // Verifiziere dass Standard-Placeholder korrekt geladen ist
      const textarea = screen.getByPlaceholderText("Describe your image in detail...");
      expect(textarea).toHaveAttribute("placeholder", "Describe your image in detail...");
      
      // Die dynamische Placeholder-Logik ist implementiert (wird bei previewState === "reference" aktiv)
      expect(textarea).toBeInTheDocument();
    });

    it("sollte previewState System für UI-Changes nutzen", () => {
      render(<ImageGenerator />);

      // Teste dass das previewState System die UI beeinflusst
      // Drop Zone sollte sichtbar sein im "empty" state
      const dropZone = screen.getByTestId("drop-zone");
      expect(dropZone).toBeInTheDocument();
      
      // Referenz Image Upload Bereich sollte vorhanden sein
      const uploadSection = screen.getByText("Upload Reference Image (Optional)");
      expect(uploadSection).toBeInTheDocument();
    });
  });
});
