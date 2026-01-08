import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { useConciergeChat } from "@/hooks/useConciergeChat";
import { useTranslation } from "react-i18next";

interface ConciergeChatProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  hotelId: string;
  roomId: string | null;
  roomNumber: string;
  hotelName: string;
  initialMessage?: string | null;
}

export function ConciergeChat({
  isOpen,
  onClose,
  sessionId,
  hotelId,
  roomId,
  roomNumber,
  hotelName,
  initialMessage,
}: ConciergeChatProps) {
  const { t } = useTranslation();
  const { messages, isLoading, error, sendMessage } = useConciergeChat(
    sessionId,
    hotelId,
    roomId,
    roomNumber
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialMessageSentRef = useRef(false);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send initial message when chat opens with one
  useEffect(() => {
    if (isOpen && initialMessage && !initialMessageSentRef.current && messages.length === 0) {
      initialMessageSentRef.current = true;
      sendMessage(initialMessage);
    }
    
    // Reset when chat closes
    if (!isOpen) {
      initialMessageSentRef.current = false;
    }
  }, [isOpen, initialMessage, messages.length, sendMessage]);

  const quickActions = [
    { label: t("chat.quickActions.roomService"), message: t("chat.quickActions.roomServiceMsg") },
    { label: t("chat.quickActions.housekeeping"), message: t("chat.quickActions.housekeepingMsg") },
    { label: t("chat.quickActions.taxi"), message: t("chat.quickActions.taxiMsg") },
    { label: t("chat.quickActions.recommendations"), message: t("chat.quickActions.recommendationsMsg") },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed inset-0 z-50 flex flex-col bg-background"
        >
          {/* Header */}
          <header className="flex items-center justify-between px-4 py-3 border-b bg-primary text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold">{hotelName} {t("chat.title")}</h2>
                <p className="text-xs opacity-80">{t("header.room")} {roomNumber}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {t("chat.welcomeTitle", { hotelName })}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {t("chat.welcomeMessage")}
                  </p>
                </div>
                
                {/* Quick actions */}
                <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(action.message)}
                      className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded-full transition-colors"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
                
                {isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">{t("chat.thinking")}</span>
                  </div>
                )}

                {error && (
                  <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                    {error}
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <ChatInput
            onSend={sendMessage}
            disabled={isLoading}
            placeholder={t("chat.placeholder")}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
