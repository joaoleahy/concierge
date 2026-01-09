import { useState, useCallback } from "react";
import { useLanguage } from "@/hooks/useLanguage";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
}

interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
  result?: { success: boolean; message: string };
}

interface UseConciergeChat {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || "";

export function useConciergeChat(
  sessionId: string,
  hotelId: string,
  roomId: string | null,
  roomNumber: string
): UseConciergeChat {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeToolCall = useCallback(
    async (
      toolName: string,
      args: Record<string, unknown>
    ): Promise<{ success: boolean; message: string }> => {
      const response = await fetch(`${API_URL}/api/chat/execute-tool`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toolName,
          arguments: args,
          sessionId,
          hotelId,
          roomId,
        }),
      });

      if (!response.ok) {
        return { success: false, message: "Failed to execute action" };
      }

      return response.json();
    },
    [sessionId, hotelId, roomId]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        // Build message history for API
        const messageHistory = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch(`${API_URL}/api/chat/message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: messageHistory,
            sessionId,
            hotelId,
            roomNumber,
            guestLanguage: language,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to get response");
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        // Stream processing
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";
        let assistantContent = "";
        let toolCalls: { id: string; name: string; arguments: string }[] = [];

        const updateAssistantMessage = (content: string, tools?: ToolCall[]) => {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content, toolCalls: tools } : m
              );
            }
            return [
              ...prev,
              {
                id: crypto.randomUUID(),
                role: "assistant" as const,
                content,
                timestamp: new Date(),
                toolCalls: tools,
              },
            ];
          });
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const choice = parsed.choices?.[0];

              // Handle content delta
              const contentDelta = choice?.delta?.content;
              if (contentDelta) {
                assistantContent += contentDelta;
                updateAssistantMessage(assistantContent);
              }

              // Handle tool calls
              const toolCallDelta = choice?.delta?.tool_calls;
              if (toolCallDelta) {
                for (const tc of toolCallDelta) {
                  if (tc.index !== undefined) {
                    if (!toolCalls[tc.index]) {
                      toolCalls[tc.index] = { id: tc.id || "", name: "", arguments: "" };
                    }
                    if (tc.function?.name) {
                      toolCalls[tc.index].name = tc.function.name;
                    }
                    if (tc.function?.arguments) {
                      toolCalls[tc.index].arguments += tc.function.arguments;
                    }
                  }
                }
              }

              // Check for finish reason
              if (choice?.finish_reason === "tool_calls") {
                // Execute tool calls and get results
                const executedTools: ToolCall[] = [];
                for (const tc of toolCalls) {
                  if (tc.name && tc.arguments) {
                    try {
                      const args = JSON.parse(tc.arguments);
                      const result = await executeToolCall(tc.name, args);
                      executedTools.push({ name: tc.name, arguments: args, result });

                      // Add tool result to assistant message
                      if (result.success) {
                        assistantContent += (assistantContent ? "\n\n" : "") + result.message;
                      }
                    } catch (e) {
                      console.error("Error executing tool:", e);
                    }
                  }
                }
                updateAssistantMessage(assistantContent, executedTools);
              }
            } catch {
              // Incomplete JSON, put it back
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        // Final flush
        if (assistantContent) {
          updateAssistantMessage(assistantContent);
        }
      } catch (e) {
        console.error("Chat error:", e);
        setError(e instanceof Error ? e.message : "Failed to send message");
      } finally {
        setIsLoading(false);
      }
    },
    [messages, sessionId, hotelId, roomNumber, language, executeToolCall]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearMessages };
}
