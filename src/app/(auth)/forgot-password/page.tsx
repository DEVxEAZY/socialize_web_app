"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar email");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-ig-text">Email enviado!</h2>
          <p className="text-sm text-ig-muted">
            Se o email estiver cadastrado, voce recebera um codigo de 6 digitos para redefinir sua senha.
          </p>
        </div>
        <div className="space-y-3">
          <Link href="/reset-password">
            <Button className="w-full">Inserir codigo</Button>
          </Link>
          <Link href="/login" className="block text-sm font-semibold text-primary-500 hover:text-primary-600">
            Voltar ao login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold text-gradient-ig">Socialize</h1>
        <p className="text-sm text-ig-muted">Recuperar senha</p>
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

        <Button type="submit" loading={loading} className="w-full">
          Enviar codigo
        </Button>
      </form>

      <Link href="/login" className="block text-center text-sm font-semibold text-primary-500 hover:text-primary-600">
        Voltar ao login
      </Link>
    </div>
  );
}
