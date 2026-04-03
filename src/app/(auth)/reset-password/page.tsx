"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.resetPassword(token, newPassword);
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao redefinir senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900">Socialize</h1>
        <p className="text-slate-500">Redefinir senha</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <Input
          label="Codigo de verificacao"
          type="text"
          placeholder="123456"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          maxLength={6}
          required
        />

        <Input
          label="Nova senha"
          type="password"
          placeholder="Minimo 8 caracteres"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
          required
        />

        <Button type="submit" loading={loading} className="w-full">
          Redefinir senha
        </Button>
      </form>

      <Link href="/login" className="text-sm text-primary-600 hover:text-primary-700 block text-center">
        Voltar ao login
      </Link>
    </div>
  );
}
