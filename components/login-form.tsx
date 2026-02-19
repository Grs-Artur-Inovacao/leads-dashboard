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
            <Card>
                <CardHeader className="text-center">
                    <CardTitle className="text-xl">Bem-vindo de volta</CardTitle>
                    <CardDescription>
                        Entre com sua conta Microsoft Alltech
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6">
                        <div className="flex flex-col gap-4">
                            <Button
                                variant="outline"
                                className="w-full flex items-center justify-center gap-2"
                                onClick={handleMicrosoftLogin}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <MicrosoftIcon className="w-5 h-5" />
                                )}
                                Entrar com Microsoft
                            </Button>
                        </div>
                        {/* 
                        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                            <span className="relative z-10 bg-background px-2 text-muted-foreground">
                                Ou continue com
                            </span>
                        </div>
                        <form onSubmit={(e) => e.preventDefault()}>
                            <div className="grid gap-2 mb-4">
                                <Label htmlFor="email">E-mail</Label>
                                <Input id="email" type="email" placeholder="m@alltech.com.br" required />
                            </div>
                            <div className="grid gap-2 mb-6">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Senha</Label>
                                    <a
                                        href="#"
                                        className="ml-auto text-sm underline-offset-4 hover:underline"
                                    >
                                        Esqueceu a senha?
                                    </a>
                                </div>
                                <Input id="password" type="password" required />
                            </div>
                            <Button type="submit" className="w-full">
                                Login
                            </Button>
                        </form> 
                        */}
                    </div>
                </CardContent>
            </Card>
            <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
                Ao clicar em continuar, você concorda com nossos <a href="#">Termos de Serviço</a>{" "}
                e <a href="#">Política de Privacidade</a>.
            </div>
        </div>
    )
}
