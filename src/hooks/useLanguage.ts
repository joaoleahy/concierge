import { useState, useEffect, useCallback } from "react";

export type SupportedLanguage = "en" | "pt" | "es" | "de" | "fr" | "it";

interface Translations {
  [key: string]: {
    [lang in SupportedLanguage]: string;
  };
}

// Core translations for the guest app
export const translations: Translations = {
  welcome: {
    en: "Welcome",
    pt: "Bem-vindo",
    es: "Bienvenido",
    de: "Willkommen",
    fr: "Bienvenue",
    it: "Benvenuto",
  },
  howCanWeHelp: {
    en: "How can we help you today?",
    pt: "Como podemos ajudá-lo hoje?",
    es: "¿Cómo podemos ayudarte hoy?",
    de: "Wie können wir Ihnen heute helfen?",
    fr: "Comment pouvons-nous vous aider aujourd'hui?",
    it: "Come possiamo aiutarti oggi?",
  },
  roomService: {
    en: "Room Service",
    pt: "Serviço de Quarto",
    es: "Servicio de Habitación",
    de: "Zimmerservice",
    fr: "Service en chambre",
    it: "Servizio in camera",
  },
  housekeeping: {
    en: "Housekeeping",
    pt: "Limpeza",
    es: "Limpieza",
    de: "Housekeeping",
    fr: "Ménage",
    it: "Pulizie",
  },
  lateCheckout: {
    en: "Late Checkout",
    pt: "Checkout Tardio",
    es: "Salida Tardía",
    de: "Später Check-out",
    fr: "Départ tardif",
    it: "Check-out tardivo",
  },
  taxi: {
    en: "Taxi",
    pt: "Táxi",
    es: "Taxi",
    de: "Taxi",
    fr: "Taxi",
    it: "Taxi",
  },
  wifi: {
    en: "WiFi",
    pt: "WiFi",
    es: "WiFi",
    de: "WLAN",
    fr: "WiFi",
    it: "WiFi",
  },
  localGuide: {
    en: "Local Guide",
    pt: "Guia Local",
    es: "Guía Local",
    de: "Lokaler Führer",
    fr: "Guide Local",
    it: "Guida Locale",
  },
  weather: {
    en: "Weather",
    pt: "Clima",
    es: "Clima",
    de: "Wetter",
    fr: "Météo",
    it: "Meteo",
  },
  hiddenGems: {
    en: "Hidden Gems",
    pt: "Tesouros Escondidos",
    es: "Joyas Ocultas",
    de: "Geheimtipps",
    fr: "Pépites Cachées",
    it: "Gemme Nascoste",
  },
  myItinerary: {
    en: "My Itinerary",
    pt: "Meu Roteiro",
    es: "Mi Itinerario",
    de: "Mein Reiseplan",
    fr: "Mon Itinéraire",
    it: "Il Mio Itinerario",
  },
  askConcierge: {
    en: "Ask Concierge",
    pt: "Pergunte ao Concierge",
    es: "Consulta al Conserje",
    de: "Concierge fragen",
    fr: "Demandez au Concierge",
    it: "Chiedi al Concierge",
  },
  menu: {
    en: "Menu",
    pt: "Cardápio",
    es: "Menú",
    de: "Speisekarte",
    fr: "Menu",
    it: "Menu",
  },
  sendRequest: {
    en: "Send Request",
    pt: "Enviar Solicitação",
    es: "Enviar Solicitud",
    de: "Anfrage senden",
    fr: "Envoyer la demande",
    it: "Invia richiesta",
  },
  room: {
    en: "Room",
    pt: "Quarto",
    es: "Habitación",
    de: "Zimmer",
    fr: "Chambre",
    it: "Camera",
  },
  confirmRequest: {
    en: "Confirm Request",
    pt: "Confirmar Solicitação",
    es: "Confirmar Solicitud",
    de: "Anfrage bestätigen",
    fr: "Confirmer la demande",
    it: "Conferma richiesta",
  },
  cancel: {
    en: "Cancel",
    pt: "Cancelar",
    es: "Cancelar",
    de: "Abbrechen",
    fr: "Annuler",
    it: "Annulla",
  },
  typeMessage: {
    en: "Type your message...",
    pt: "Digite sua mensagem...",
    es: "Escribe tu mensaje...",
    de: "Nachricht eingeben...",
    fr: "Tapez votre message...",
    it: "Scrivi il tuo messaggio...",
  },
  breakfast: {
    en: "Breakfast",
    pt: "Café da Manhã",
    es: "Desayuno",
    de: "Frühstück",
    fr: "Petit-déjeuner",
    it: "Colazione",
  },
  checkout: {
    en: "Checkout",
    pt: "Checkout",
    es: "Salida",
    de: "Check-out",
    fr: "Départ",
    it: "Check-out",
  },
  password: {
    en: "Password",
    pt: "Senha",
    es: "Contraseña",
    de: "Passwort",
    fr: "Mot de passe",
    it: "Password",
  },
  copied: {
    en: "Copied!",
    pt: "Copiado!",
    es: "¡Copiado!",
    de: "Kopiert!",
    fr: "Copié!",
    it: "Copiato!",
  },
  openingWhatsApp: {
    en: "Opening WhatsApp...",
    pt: "Abrindo WhatsApp...",
    es: "Abriendo WhatsApp...",
    de: "WhatsApp öffnen...",
    fr: "Ouverture de WhatsApp...",
    it: "Apertura WhatsApp...",
  },
};

function detectBrowserLanguage(): SupportedLanguage {
  const browserLang = navigator.language.split("-")[0].toLowerCase();
  const supported: SupportedLanguage[] = ["en", "pt", "es", "de", "fr", "it"];
  
  if (supported.includes(browserLang as SupportedLanguage)) {
    return browserLang as SupportedLanguage;
  }
  
  return "en";
}

export function useLanguage() {
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    // Check localStorage first
    const stored = localStorage.getItem("concierge-language");
    if (stored && ["en", "pt", "es", "de", "fr", "it"].includes(stored)) {
      return stored as SupportedLanguage;
    }
    return detectBrowserLanguage();
  });

  useEffect(() => {
    localStorage.setItem("concierge-language", language);
  }, [language]);

  const t = useCallback(
    (key: string): string => {
      return translations[key]?.[language] || translations[key]?.en || key;
    },
    [language]
  );

  return { language, setLanguage, t };
}
