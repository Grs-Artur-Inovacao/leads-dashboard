"use client"

import { Button } from "@/components/ui/button"
import { ShieldAlert, LogOut, ArrowLeft } from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import Link from "next/link"

export default function UnauthorizedPage() {
    const { data: session } = useSession()

    return (
        <div className="bg-zinc-950 flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 text-white">
            <div className="flex w-full max-w-md flex-col gap-8 text-center">
                <div className="flex flex-col gap-2 items-center">
                    <div className="bg-red-500/10 p-4 rounded-full border border-red-500/20 mb-4">
                        <ShieldAlert className="size-12 text-red-500" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Acesso Restrito</h1>
                    <p className="text-zinc-400 text-balance">
                        Olá <strong>{session?.user?.name || "usuário"}</strong> (<em>{session?.user?.email}</em>), sua conta está vinculada ao departamento
                        <span className="text-white bg-zinc-800 px-2 py-0.5 rounded ml-1">
                            {((session?.user as any)?.department) || "Geral"}
                        </span>.
                    </p>
                    <p className="text-zinc-400 text-sm mt-2">
                        Somente colaboradores dos setores de <strong>Atendimento, Inovação, TI e Marketing</strong> possuem acesso a este dashboard de Lead.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
                        onClick={() => signOut({ callbackUrl: '/login' })}
                    >
                        <LogOut className="mr-2 size-4" />
                        Entrar com outra conta
                    </Button>

                    <Link href="https://alltech.com.br" target="_blank" className="w-full">
                        <Button
                            variant="ghost"
                            className="w-full text-zinc-400 hover:text-white"
                        >
                            <ArrowLeft className="mr-2 size-4" />
                            Voltar para o site Alltech
                        </Button>
                    </Link>
                </div>

                <p className="text-xs text-zinc-600">
                    Se você acredita que isso é um erro, entre em contato com o time de TI.
                </p>
            </div>
        </div>
    )
}
