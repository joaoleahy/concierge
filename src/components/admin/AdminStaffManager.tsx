import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { UserPlus, Mail, Trash2, Clock, CheckCircle, Users, Shield } from "lucide-react";

interface AdminStaffManagerProps {
  hotelId: string;
}

interface Invitation {
  id: string;
  email: string;
  role: "admin" | "staff";
  accepted_at: string | null;
  expires_at: string;
  created_at: string;
}

interface StaffMember {
  id: string;
  user_id: string;
  role: "admin" | "staff";
  created_at: string;
  profile?: {
    email: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function AdminStaffManager({ hotelId }: AdminStaffManagerProps) {
  const queryClient = useQueryClient();
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "staff">("staff");

  // Fetch current staff members
  const { data: staffMembers, isLoading: loadingStaff } = useQuery({
    queryKey: ["staff-members", hotelId],
    queryFn: async () => {
      const data = await api.get<StaffMember[]>(`/api/admin/staff?hotelId=${hotelId}`);
      return data;
    },
  });

  // Fetch pending invitations
  const { data: invitations, isLoading: loadingInvitations } = useQuery({
    queryKey: ["staff-invitations", hotelId],
    queryFn: async () => {
      const data = await api.get<Invitation[]>(`/api/admin/staff/invitations?hotelId=${hotelId}`);
      return data;
    },
  });

  // Create invitation mutation
  const createInvitation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: "admin" | "staff" }) => {
      const data = await api.post<Invitation & { token: string }>("/api/admin/staff/invitations", {
        hotelId,
        email,
        role,
      });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["staff-invitations", hotelId] });
      setNewEmail("");

      // Copy invitation link
      const inviteUrl = `${window.location.origin}/login?invite=${data.token}`;
      navigator.clipboard.writeText(inviteUrl);

      toast.success("Convite enviado!", {
        description: `Email enviado para ${data.email}. Link também copiado para área de transferência.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar convite", { description: error.message });
    },
  });

  // Delete invitation mutation
  const deleteInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      await api.delete(`/api/admin/staff/invitations/${invitationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-invitations", hotelId] });
      toast.success("Convite removido");
    },
  });

  // Remove staff member mutation
  const removeStaffMember = useMutation({
    mutationFn: async (roleId: string) => {
      await api.delete(`/api/admin/staff/${roleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-members", hotelId] });
      toast.success("Membro removido da equipe");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast.error("Email inválido");
      return;
    }

    createInvitation.mutate({ email: newEmail, role: newRole });
  };

  const pendingInvitations = invitations?.filter((i) => !i.accepted_at && new Date(i.expires_at) > new Date()) || [];
  const expiredInvitations = invitations?.filter((i) => !i.accepted_at && new Date(i.expires_at) <= new Date()) || [];

  return (
    <div className="space-y-6">
      {/* Invite Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Convidar Membro da Equipe
          </CardTitle>
          <CardDescription>
            Envie convites para novos membros. Eles receberão um link para criar conta e acessar o sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-40 space-y-2">
              <Label>Função</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as "admin" | "staff")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={createInvitation.isPending}>
                <Mail className="w-4 h-4 mr-2" />
                {createInvitation.isPending ? "Enviando..." : "Convidar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Current Staff */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Equipe Atual
          </CardTitle>
          <CardDescription>
            Membros com acesso ao painel de administração e staff.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStaff ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : staffMembers?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum membro na equipe ainda. Envie convites acima.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membro</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffMembers?.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {member.profile?.display_name || "Sem nome"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {member.profile?.email || "Email não disponível"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                        {member.role === "admin" ? (
                          <><Shield className="w-3 h-3 mr-1" /> Admin</>
                        ) : (
                          "Staff"
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(member.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStaffMember.mutate(member.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Convites Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell>{invitation.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{invitation.role}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(invitation.expires_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteInvitation.mutate(invitation.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}