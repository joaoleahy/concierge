import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/client";
import { Shield, Lock, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PinVerificationModalProps {
  isOpen: boolean;
  roomId: string;
  roomNumber: string;
  hotelName: string;
  onVerified: (sessionData: { hotelId: string; roomId: string }) => void;
}

export function PinVerificationModal({
  isOpen,
  roomId,
  roomNumber,
  hotelName,
  onVerified,
}: PinVerificationModalProps) {
  const { t } = useTranslation();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError(t("pinVerification.invalidLength", "O PIN deve ter 4 dígitos"));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await api.post<{
        success: boolean;
        error?: string;
        message?: string;
        hotelId?: string;
        roomId?: string;
        sessionId?: string;
      }>("/api/custom-auth/verify-pin", {
        roomId,
        pin,
      });

      if (result.success) {
        onVerified({
          hotelId: result.hotelId!,
          roomId: result.roomId!,
        });
      } else {
        setError(result.message || t("pinVerification.invalidPin", "PIN inválido"));
      }
    } catch (err: any) {
      if (err.message?.includes("Invalid PIN")) {
        setError(t("pinVerification.invalidPin", "PIN inválido"));
        return;
      }
      console.error("Verification error:", err);
      setError(t("pinVerification.errorOccurred", "Erro ao verificar PIN. Tente novamente."));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (value: string) => {
    // Only allow numbers and max 4 digits
    const cleaned = value.replace(/\D/g, "").slice(0, 4);
    setPin(cleaned);
    if (error) setError(null);
  };

  return (
    <Dialog open={isOpen} modal>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">
            {t("pinVerification.title", "Verificação de Acesso")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t("pinVerification.description", "Digite o PIN de 4 dígitos fornecido no check-in para acessar os serviços do hotel.")}
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{t("pinVerification.room", "Quarto")}</p>
            <p className="text-2xl font-bold">{roomNumber}</p>
            <p className="text-sm text-muted-foreground">{hotelName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {t("pinVerification.pinLabel", "PIN de Acesso")}
            </Label>
            <Input
              id="pin"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              placeholder="• • • •"
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              className="text-center text-2xl tracking-[0.5em] font-mono"
              autoFocus
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={pin.length !== 4 || isLoading}>
            {isLoading
              ? t("pinVerification.verifying", "Verificando...")
              : t("pinVerification.verify", "Verificar e Acessar")}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            {t("pinVerification.helpText", "O PIN foi fornecido no momento do check-in. Em caso de dúvidas, contate a recepção.")}
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}