"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(email, password, displayName);
      router.push("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold text-gradient-ig">Socialize</h1>
        <p className="text-sm text-ig-muted">Crie sua conta</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-sm bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <Input
          label="Nome"
          type="text"
          placeholder="Seu nome"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />

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
          placeholder="Minimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />

        <Button type="submit" loading={loading} className="w-full">
          Criar conta
        </Button>
      </form>

      <p className="text-center text-sm text-ig-muted">
        Ja tem conta?{" "}
        <Link href="/login" className="font-semibold text-primary-500 hover:text-primary-600">
          Entrar
        </Link>
      </p>
    </div>
  );
}
