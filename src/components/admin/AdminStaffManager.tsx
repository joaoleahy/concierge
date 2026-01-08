import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
      const { data, error } = await supabase
        .from("user_roles")
        .select(`
          id,
          user_id,
          role,
          created_at
        `)
        .eq("hotel_id", hotelId);

      if (error) throw error;

      // Fetch profiles for each user
      const userIds = data.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, display_name, avatar_url")
        .in("user_id", userIds);

      return data.map((member) => ({
        ...member,
        profile: profiles?.find((p) => p.user_id === member.user_id),
      })) as StaffMember[];
    },
  });

  // Fetch pending invitations
  const { data: invitations, isLoading: loadingInvitations } = useQuery({
    queryKey: ["staff-invitations", hotelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_invitations")
        .select("*")
        .eq("hotel_id", hotelId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Invitation[];
    },
  });

  // Create invitation mutation
  const createInvitation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: "admin" | "staff" }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("staff_invitations")
        .insert({
          hotel_id: hotelId,
          email,
          role,
          invited_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Send invitation email
      try {
        await supabase.functions.invoke("send-invitation-email", {
          body: { invitationId: data.id },
        });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Continue even if email fails - link is copied
      }

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
    onError: (error) => {
      toast.error("Erro ao criar convite", { description: error.message });
    },
  });

  // Delete invitation mutation
  const deleteInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from("staff_invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-invitations", hotelId] });
      toast.success("Convite removido");
    },
  });

  // Remove staff member mutation
  const removeStaffMember = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;
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