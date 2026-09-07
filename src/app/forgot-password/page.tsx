import Image from "next/image";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/auth";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
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
          <h1 className="mt-3 font-heading text-2xl italic text-navy">Recuperar contraseña</h1>
          <p className="text-sm text-charcoal/60">
            Te mandamos un link a tu email para elegir una contraseña nueva.
          </p>
        </div>

        {params.sent ? (
          <p className="mb-4 rounded-yakana border border-olive/30 bg-olive/10 px-3 py-2 text-sm text-olive">
            Listo — si ese email tiene una cuenta, te va a llegar un mensaje con el link. Revisá
            también la carpeta de spam.
          </p>
        ) : (
          <form action={requestPasswordReset} className="space-y-4">
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
            {params.error ? (
              <p className="rounded-yakana border border-terracotta/30 bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
                {params.error}
              </p>
            ) : null}
            <button
              type="submit"
              className="w-full rounded-yakana bg-terracotta px-4 py-2.5 text-sm font-medium text-offwhite transition-colors hover:bg-terracotta-dark"
            >
              Mandar link
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-charcoal/70">
          <Link href="/login" className="font-medium text-terracotta">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
