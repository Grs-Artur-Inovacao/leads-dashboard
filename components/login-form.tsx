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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MicrosoftIcon } from "@/components/icons/microsoft-icon"
import { signIn } from "next-auth/react"
import { Loader2 } from "lucide-react"

export function LoginForm({
    className,
    ...props
}: React.ComponentPropsWithoutRef<"div">) {
    const [isLoading, setIsLoading] = React.useState<boolean>(false)

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
                    <CardTitle className="text-xl text-white">Bem-vindo de volta</CardTitle>
                    <CardDescription className="text-zinc-400">
                        Entre com sua conta Microsoft Alltech
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6">
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
