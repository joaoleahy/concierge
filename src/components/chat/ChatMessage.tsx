import { motion } from "framer-motion";
import { Bot, User, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/hooks/useConciergeChat";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        isUser ? "bg-primary" : "bg-muted"
      )}>
        {isUser ? (
          <User className="h-4 w-4 text-primary-foreground" />
        ) : (
          <Bot className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      <div className={cn(
        "flex max-w-[80%] flex-col gap-1"
      )}>
        <div className={cn(
          "rounded-2xl px-4 py-2.5",
          isUser 
            ? "bg-primary text-primary-foreground rounded-br-md" 
            : "bg-muted text-foreground rounded-bl-md"
        )}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Tool call indicators */}
        {message.toolCalls?.map((tool, idx) => (
          <div 
            key={idx}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <CheckCircle2 className="h-3 w-3 text-concierge-success" />
            <span>
              {tool.name === "create_service_request" && "Solicitação criada"}
              {tool.name === "create_itinerary_item" && "Adicionado ao itinerário"}
            </span>
          </div>
        ))}

        <span className="text-[10px] text-muted-foreground/60 px-1">
          {message.timestamp.toLocaleTimeString([], { 
            hour: "2-digit", 
            minute: "2-digit" 
          })}
        </span>
      </div>
    </motion.div>
  );
}
