import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLanguage, translations } from "./useLanguage";

describe("useLanguage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal("navigator", {
      language: "en-US",
    });
  });

  it("should default to English when no language is stored", () => {
    const { result } = renderHook(() => useLanguage());
    expect(result.current.language).toBe("en");
  });

  it("should use stored language from localStorage", () => {
    localStorage.setItem("concierge-language", "pt");
    const { result } = renderHook(() => useLanguage());
    expect(result.current.language).toBe("pt");
  });

  it("should change language when setLanguage is called", () => {
    const { result } = renderHook(() => useLanguage());

    act(() => {
      result.current.setLanguage("es");
    });

    expect(result.current.language).toBe("es");
    expect(localStorage.getItem("concierge-language")).toBe("es");
  });

  it("should translate keys correctly", () => {
    const { result } = renderHook(() => useLanguage());

    expect(result.current.t("welcome")).toBe("Welcome");

    act(() => {
      result.current.setLanguage("pt");
    });

    expect(result.current.t("welcome")).toBe("Bem-vindo");
  });

  it("should return key if translation is not found", () => {
    const { result } = renderHook(() => useLanguage());
    expect(result.current.t("nonexistent_key")).toBe("nonexistent_key");
  });

  it("should detect browser language", () => {
    vi.stubGlobal("navigator", {
      language: "pt-BR",
    });

    const { result } = renderHook(() => useLanguage());
    expect(result.current.language).toBe("pt");
  });

  it("should fall back to English for unsupported browser language", () => {
    vi.stubGlobal("navigator", {
      language: "ja-JP",
    });

    const { result } = renderHook(() => useLanguage());
    expect(result.current.language).toBe("en");
  });
});

describe("translations", () => {
  it("should have all required keys for all supported languages", () => {
    const supportedLanguages = ["en", "pt", "es", "de", "fr", "it"] as const;
    const requiredKeys = ["welcome", "howCanWeHelp", "roomService", "cancel"];

    requiredKeys.forEach((key) => {
      supportedLanguages.forEach((lang) => {
        expect(translations[key]?.[lang]).toBeDefined();
        expect(typeof translations[key][lang]).toBe("string");
      });
    });
  });
});
