import Image from "next/image";
import Link from "next/link";
import { signUp } from "@/lib/actions/auth";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-yakana border border-linen bg-offwhite p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/brand/yakana-logo.png"
            alt="Yakana — Tejido Artesanal"
            width={64}
            height={64}
            className="rounded-full"
          />
          <h1 className="mt-3 font-heading text-2xl italic text-navy">
            Crear cuenta
          </h1>
          <p className="text-sm text-charcoal/60">Yakana Studio</p>
        </div>

        {params.error ? (
          <p className="mb-4 rounded-yakana border border-terracotta/30 bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
            {params.error}
          </p>
        ) : null}

        <form action={signUp} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-navy" htmlFor="name">
              Nombre
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-navy" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-navy" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full rounded-yakana border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-terracotta"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-yakana bg-terracotta px-4 py-2.5 text-sm font-medium text-offwhite transition-colors hover:bg-terracotta-dark"
          >
            Crear cuenta
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-charcoal/70">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-medium text-terracotta">
            Ingresá acá
          </Link>
        </p>
      </div>
    </div>
  );
}
