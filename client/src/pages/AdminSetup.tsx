import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandLogo } from "@/components/BrandLogo";
import { bootstrapAdmin } from "@/api/auth";
import { useToast } from "@/hooks/use-toast";

export default function AdminSetup() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBootstrap = async () => {
    setIsSubmitting(true);
    try {
      await bootstrapAdmin({ email, password, token });
      toast({
        title: "Admin ready",
        description: "Admin account created and signed in.",
      });
      window.location.href = "/dashboard/admin";
    } catch (error) {
      toast({
        title: "Bootstrap failed",
        description: error instanceof Error ? error.message : "Unable to bootstrap admin.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <BrandLogo size="sm" className="mx-auto mb-4" alt="Builder.Contractors" />
          <CardTitle className="text-2xl font-bold text-slate-900">Admin Bootstrap</CardTitle>
          <p className="text-slate-600 mt-2">One-time secure bootstrap for initial administrator setup</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Admin email</Label>
            <Input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password">Admin password</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bootstrap-token">Bootstrap token</Label>
            <Input
              id="bootstrap-token"
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
            />
          </div>

          <Button onClick={handleBootstrap} className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Bootstrapping…" : "Create Admin Account"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
