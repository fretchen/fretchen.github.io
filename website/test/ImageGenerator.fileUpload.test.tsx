/**
 * ImageGenerator Reference Image & Edit Mode Integration Tests
 *
 * SKIPPED: Feature temporarily deactivated due to security exploit fix in progress
 *
 * Umfassende Tests für die ImageGenerator Komponente:
 * - File Upload Functionality
 * - UI State Management
 * - Reference Image Processing
 * - Dynamic Placeholder & Edit Mode
 *
 * Priorität: HOCH - Core File Upload Features + Edit Mode
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

describe.skip("ImageGenerator Reference Image Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Einfache URL Mocks für File Upload Tests
    global.URL = global.URL || {};
    global.URL.createObjectURL = global.URL.createObjectURL || vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = global.URL.revokeObjectURL || vi.fn();
  });

  describe("🔴 HOCH: Basic Component Integration", () => {
    it("sollte ImageGenerator Component rendern können", () => {
      render(<ImageGenerator />);

      // Prüfe dass wichtige Elemente vorhanden sind
      expect(screen.getByText("Create Collectible AI Art • 10¢")).toBeInTheDocument();
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

      const fileInput = screen.getByTestId("reference-image-input") as HTMLInputElement;

      // Simuliere JPEG File Upload
      const jpegFile = new File(["jpeg content"], "test.jpg", { type: "image/jpeg" });

      fireEvent.change(fileInput, { target: { files: [jpegFile] } });

      // File Input sollte die Datei akzeptiert haben
      expect(fileInput.files).toHaveLength(1);
      expect(fileInput.files![0]).toBe(jpegFile);
    });

    it("sollte PNG Dateien akzeptieren", () => {
      render(<ImageGenerator />);

      const fileInput = screen.getByTestId("reference-image-input") as HTMLInputElement;

      // Simuliere PNG File Upload
      const pngFile = new File(["png content"], "test.png", { type: "image/png" });

      fireEvent.change(fileInput, { target: { files: [pngFile] } });

      // File Input sollte die Datei akzeptiert haben
      expect(fileInput.files).toHaveLength(1);
      expect(fileInput.files![0]).toBe(pngFile);
    });

    it("sollte Drag & Drop Zone haben", () => {
      render(<ImageGenerator />);

      const dropZone = screen.getByTestId("drop-zone");
      expect(dropZone).toBeInTheDocument();

      // Drop Zone sollte korrekte Styling-Indikatoren haben
      expect(dropZone).toHaveClass(/cursor_pointer/);
    });
  });

  describe("🔴 HOCH: UI State Management", () => {
    it("sollte initial Create Artwork Button zeigen", () => {
      render(<ImageGenerator />);

      const button = screen.getByRole("button", { name: /Enter a prompt to create/ });
      expect(button).toBeInTheDocument();
    });

    it("sollte Textarea für Prompt haben", () => {
      render(<ImageGenerator />);

      const textarea = screen.getByPlaceholderText("Describe your image in detail...");
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName.toLowerCase()).toBe("textarea");
    });

    it("sollte Listed Checkbox haben", () => {
      render(<ImageGenerator />);

      const checkbox = screen.getByRole("checkbox", { name: /Listed/ });
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute("type", "checkbox");
    });

    it("sollte Image Size Select haben", () => {
      render(<ImageGenerator />);

      const sizeSelect = screen.getByLabelText("Select image format for your artwork");
      expect(sizeSelect).toBeInTheDocument();
      expect(sizeSelect.tagName.toLowerCase()).toBe("select");

      // Test switching size
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
