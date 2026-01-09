import { useNavigate } from "@tanstack/react-router";
import { ShieldX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Unauthorized() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">{t("errors.accessDenied")}</CardTitle>
          <CardDescription>
            {t("errors.noPermission")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button onClick={() => navigate("/")} className="w-full">
            {t("common.backToHome")}
          </Button>
          <Button variant="outline" onClick={() => navigate("/login")} className="w-full">
            {t("auth.loginWithAnotherAccount")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
