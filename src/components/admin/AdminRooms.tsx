import { useState, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, QrCode, Copy, Key, RefreshCw, Printer, MessageCircle, Download } from "lucide-react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface AdminRoomsProps {
  hotelId: string | null;
  hotelWhatsapp?: string | null;
}

const roomTypes = [
  { value: "standard", label: "Standard" },
  { value: "superior", label: "Superior" },
  { value: "deluxe", label: "Deluxe" },
  { value: "suite", label: "Suíte" },
  { value: "master_suite", label: "Master Suíte" },
];

export function AdminRooms({ hotelId, hotelWhatsapp }: AdminRoomsProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [printingRoom, setPrintingRoom] = useState<any>(null);
  const [regeneratingPinId, setRegeneratingPinId] = useState<string | null>(null);

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms", hotelId],
    queryFn: async () => {
      if (!hotelId) return [];
      const data = await api.get<any[]>(`/api/admin/rooms?hotelId=${hotelId}`);
      return data;
    },
    enabled: !!hotelId,
  });

  const handleSave = async (room: any) => {
    try {
      if (room.id) {
        await api.patch(`/api/admin/rooms/${room.id}`, {
          roomNumber: room.room_number,
          roomType: room.room_type,
          floor: room.floor,
        });
      } else {
        await api.post("/api/admin/rooms", { ...room, hotelId });
      }
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setEditing(null);
      setIsAdding(false);
      toast.success("Quarto salvo!");
    } catch (error) {
      toast.error("Erro ao salvar");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este quarto?")) return;
    try {
      await api.delete(`/api/admin/rooms/${id}`);
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Excluído!");
    } catch (error) {
      toast.error("Erro ao excluir");
    }
  };

  const copyQrLink = (qrCode: string) => {
    const url = `${window.location.origin}/?room=${qrCode}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  const copyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    toast.success("PIN copiado!");
  };

  const sendPinWhatsapp = (room: any) => {
    if (!hotelWhatsapp) {
      toast.error("Configure o WhatsApp do hotel primeiro");
      return;
    }
    
    const message = `🏨 Bem-vindo ao quarto ${room.room_number}!\n\n🔐 Seu PIN de acesso é: *${room.access_pin}*\n\n📱 Use este PIN para acessar os serviços do hotel pelo link:\n${window.location.origin}/?room=${room.qr_code}\n\nBoa estadia!`;
    
    // Copy message to clipboard for easy sharing
    navigator.clipboard.writeText(message);
    toast.success("Mensagem copiada! Cole no WhatsApp para enviar ao hóspede.");
  };

  // Regenerate PIN mutation
  const regeneratePin = useMutation({
    mutationFn: async (roomId: string) => {
      setRegeneratingPinId(roomId);
      const data = await api.post<{ pin: string }>(`/api/admin/rooms/${roomId}/regenerate-pin`, {});
      return data.pin;
    },
    onSuccess: (newPin) => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success(`Novo PIN: ${newPin}`);
      setRegeneratingPinId(null);
    },
    onError: () => {
      toast.error("Erro ao regenerar PIN");
      setRegeneratingPinId(null);
    },
  });

  if (!hotelId) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhum hotel selecionado
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Quartos</CardTitle>
            <CardDescription>Gerencie os quartos, QR codes e PINs de acesso</CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room: any) => (
              <Card key={room.id} className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-lg font-bold">{room.room_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {roomTypes.find(t => t.value === room.room_type)?.label || room.room_type}
                        {room.floor && ` • ${room.floor}º andar`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(room)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(room.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* PIN Section */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">PIN:</span>
                    <Badge variant="secondary" className="font-mono text-lg tracking-wider">
                      {room.access_pin || "----"}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7" 
                      onClick={() => copyPin(room.access_pin)}
                      title="Copiar PIN"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7" 
                      onClick={() => regeneratePin.mutate(room.id)}
                      disabled={regeneratingPinId === room.id}
                      title="Regenerar PIN"
                    >
                      <RefreshCw className={`h-3 w-3 ${regeneratingPinId === room.id ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>

                  {/* QR Code Section */}
                  <div className="flex items-center gap-2 mt-2">
                    <QrCode className="h-4 w-4 text-muted-foreground" />
                    <code className="text-xs bg-background px-2 py-1 rounded flex-1 truncate">
                      {room.qr_code}
                    </code>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyQrLink(room.qr_code)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setPrintingRoom(room)}
                    >
                      <Printer className="h-3 w-3 mr-1" />
                      QR Code
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => sendPinWhatsapp(room)}
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Enviar PIN
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {rooms.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Nenhum quarto cadastrado</p>
          )}
        </CardContent>
      </Card>

      {/* Edit/Add Dialog */}
      <Dialog open={!!editing || isAdding} onOpenChange={(open) => { if (!open) { setEditing(null); setIsAdding(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar" : "Novo"} Quarto</DialogTitle>
          </DialogHeader>
          <RoomForm
            room={editing || { room_number: "", room_type: "standard", floor: null, qr_code: "" }}
            onSave={handleSave}
            onCancel={() => { setEditing(null); setIsAdding(false); }}
          />
        </DialogContent>
      </Dialog>

      {/* Print QR Code Dialog */}
      <Dialog open={!!printingRoom} onOpenChange={(open) => { if (!open) setPrintingRoom(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - Quarto {printingRoom?.room_number}</DialogTitle>
          </DialogHeader>
          <RoomQRCode room={printingRoom} onClose={() => setPrintingRoom(null)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RoomForm({ room, onSave, onCancel }: { room: any; onSave: (r: any) => void; onCancel: () => void }) {
  const [data, setData] = useState({
    ...room,
    qr_code: room.qr_code || `room-${Date.now()}`,
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Número do Quarto</Label>
          <Input value={data.room_number} onChange={(e) => setData({ ...data, room_number: e.target.value })} placeholder="101" />
        </div>
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select value={data.room_type} onValueChange={(v) => setData({ ...data, room_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {roomTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Andar</Label>
          <Input type="number" value={data.floor || ""} onChange={(e) => setData({ ...data, floor: e.target.value ? parseInt(e.target.value) : null })} />
        </div>
        <div className="space-y-2">
          <Label>QR Code</Label>
          <Input value={data.qr_code} onChange={(e) => setData({ ...data, qr_code: e.target.value })} placeholder="Identificador único" />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={() => onSave(data)}>Salvar</Button>
      </div>
    </div>
  );
}

function RoomQRCode({ room, onClose }: { room: any; onClose: () => void }) {
  const qrRef = useRef<HTMLDivElement>(null);
  
  if (!room) return null;

  const guestUrl = `${window.location.origin}/?room=${room.qr_code}`;
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(guestUrl)}`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code - Quarto ${room.room_number}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: system-ui, sans-serif;
              padding: 20px;
            }
            .container {
              text-align: center;
              border: 2px solid #e5e7eb;
              border-radius: 16px;
              padding: 32px;
              max-width: 400px;
            }
            h1 { margin: 0 0 8px; font-size: 24px; }
            .room-number { font-size: 48px; font-weight: bold; margin: 16px 0; }
            .qr-code { margin: 24px 0; }
            .qr-code img { width: 250px; height: 250px; }
            .pin-section {
              background: #f3f4f6;
              border-radius: 12px;
              padding: 16px;
              margin-top: 24px;
            }
            .pin-label { font-size: 14px; color: #6b7280; margin-bottom: 8px; }
            .pin-value { font-size: 36px; font-weight: bold; letter-spacing: 0.3em; font-family: monospace; }
            .instructions { font-size: 12px; color: #9ca3af; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🏨 Bem-vindo!</h1>
            <div class="room-number">Quarto ${room.room_number}</div>
            <div class="qr-code">
              <img src="${qrApiUrl}" alt="QR Code" />
            </div>
            <p>Escaneie o QR Code para acessar os serviços do hotel</p>
            <div class="pin-section">
              <div class="pin-label">Seu PIN de acesso:</div>
              <div class="pin-value">${room.access_pin}</div>
            </div>
            <p class="instructions">Use este PIN na primeira vez que acessar</p>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(qrApiUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrcode-quarto-${room.room_number}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("QR Code baixado!");
    } catch (error) {
      toast.error("Erro ao baixar QR Code");
    }
  };

  return (
    <div className="space-y-4">
      <div ref={qrRef} className="text-center p-4 border rounded-lg">
        <p className="text-3xl font-bold mb-4">Quarto {room.room_number}</p>
        <img 
          src={qrApiUrl} 
          alt="QR Code" 
          className="mx-auto w-48 h-48"
        />
        <p className="text-sm text-muted-foreground mt-4">
          Escaneie para acessar os serviços
        </p>
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground">PIN de Acesso:</p>
          <p className="text-2xl font-mono font-bold tracking-widest">{room.access_pin}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handlePrint} className="flex-1">
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
        <Button variant="outline" onClick={handleDownload} className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          Baixar
        </Button>
      </div>
    </div>
  );
}
