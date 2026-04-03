"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      router.push("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold text-gradient-ig">Socialize</h1>
        <p className="text-sm text-ig-muted">Entre na sua conta</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-sm bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label="Senha"
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button type="submit" loading={loading} className="w-full">
          Entrar
        </Button>
      </form>

      <div className="space-y-3 text-center text-sm">
        <Link href="/forgot-password" className="block font-semibold text-ig-text hover:text-ig-muted">
          Esqueci minha senha
        </Link>
        <p className="text-ig-muted">
          Nao tem conta?{" "}
          <Link href="/register" className="font-semibold text-primary-500 hover:text-primary-600">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
