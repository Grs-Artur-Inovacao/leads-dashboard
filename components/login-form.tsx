"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { MicrosoftIcon } from "@/components/icons/microsoft-icon"
import { signIn } from "next-auth/react"
import { Loader2, AlertCircle } from "lucide-react"
import { useSearchParams } from "next/navigation"

export function LoginForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    const [isLoading, setIsLoading] = React.useState<boolean>(false)
    const searchParams = useSearchParams()
    const error = searchParams.get("error")

    const handleMicrosoftLogin = async () => {
        setIsLoading(true)
        try {
            await signIn("azure-ad", { callbackUrl: "/" })
        } catch (error) {
            console.error(error)
            setIsLoading(false)
        }
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card className="bg-zinc-900 border-zinc-800 text-white">
                <CardHeader className="text-center">
                    <CardTitle className="text-xl text-white">Bem-vindo</CardTitle>
                    <CardDescription className="text-zinc-400">
                        Entre com sua conta Microsoft Alltech
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6">
                        {error && (
                            <div className="flex items-center gap-2 p-3 rounded-md bg-red-900/30 border border-red-500/50 text-red-200 text-sm">
                                <AlertCircle className="size-4 shrink-0" />
                                <span>
                                    {error === "AccessDenied"
                                        ? "Seu e-mail não está na lista de acesso permitido. Entre em contato com o administrador."
                                        : `Erro de login (${error}). Verifique suas credenciais ou contate o suporte.`}
                                </span>
                            </div>
                        )}
                        <div className="flex flex-col gap-4">
                            <Button
                                variant="outline"
                                className="w-full flex items-center justify-center gap-2 bg-zinc-950 border-zinc-700 text-white hover:bg-zinc-800 hover:text-white"
                                onClick={handleMicrosoftLogin}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <MicrosoftIcon className="w-5 h-5 fill-current" />
                                )}
                                Entrar com Microsoft
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className="text-balance text-center text-xs text-zinc-500 [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-white">
                Ao clicar em continuar, você concorda com nossos <a href="#">Termos de Serviço</a>{" "}
                e <a href="#">Política de Privacidade</a>.
            </div>
        </div>
    )
}
