export { default } from "next-auth/middleware"

export const config = {
    // matcher: ["/((?!api|login|public|_next/static|_next/image|favicon.ico).*)"],
    matcher: ["/"], // Protege a home por enquanto, pode expandir conforme necessário
}
