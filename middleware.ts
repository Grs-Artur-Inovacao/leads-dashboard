export { default } from "next-auth/middleware"

export const config = {
    // matcher: ["/((?!api|login|public|_next/static|_next/image|favicon.ico).*)"],
    matcher: ["/((?!api|login|public|_next/static|_next/image|favicon.ico).*)"],
}
