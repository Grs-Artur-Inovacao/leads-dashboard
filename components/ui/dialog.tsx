"use client"

import * as React from "react"
// import * as DialogPrimitive from "@radix-ui/react-dialog" // Removendo import para fazer manual
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = ({ children, open, onOpenChange }: any) => {
    // Implementação manual simples enquanto Radix não instala
    const [isOpen, setIsOpen] = React.useState(open || false)

    React.useEffect(() => {
        if (open !== undefined) setIsOpen(open)
    }, [open])

    const handleOpenChange = (val: boolean) => {
        setIsOpen(val)
        onOpenChange?.(val)
    }

    // Context provider mock
    return (
        <DialogContext.Provider value={{ isOpen, setIsOpen: handleOpenChange }}>
            {children}
        </DialogContext.Provider>
    )
}

const DialogContext = React.createContext<{ isOpen: boolean, setIsOpen: (v: boolean) => void } | null>(null)

const DialogTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>(
    ({ className, onClick, children, asChild, ...props }, ref) => {
        const context = React.useContext(DialogContext)
        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            context?.setIsOpen(true)
            onClick?.(e)
        }

        // Se asChild for true, clonamos o filho e passamos onClick
        if (asChild && React.isValidElement(children)) {
            return React.cloneElement(children as React.ReactElement<any>, {
                onClick: handleClick,
                ...props
            })
        }

        return (
            <button ref={ref} className={className} onClick={handleClick} {...props}>
                {children}
            </button>
        )
    }
)
DialogTrigger.displayName = "DialogTrigger"

const DialogContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
        const context = React.useContext(DialogContext)

        if (!context?.isOpen) return null

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                {/* Overlay */}
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
                    onClick={() => context.setIsOpen(false)}
                />

                {/* Content */}
                <div
                    ref={ref}
                    className={cn(
                        "relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 animate-in zoom-in-95 sm:rounded-lg",
                        className
                    )}
                    {...props}
                >
                    {children}
                    <button
                        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                        onClick={() => context.setIsOpen(false)}
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </button>
                </div>
            </div>
        )
    }
)
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col space-y-1.5 text-center sm:text-left",
            className
        )}
        {...props}
    />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
            className
        )}
        {...props}
    />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
    HTMLHeadingElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h2
        ref={ref}
        className={cn(
            "text-lg font-semibold leading-none tracking-tight",
            className
        )}
        {...props}
    />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
))
DialogDescription.displayName = "DialogDescription"

// Exports falsy para compatibilidade com import antigo se existisse
const DialogPortal = ({ children }: any) => <>{children}</>
const DialogOverlay = ({ children }: any) => <>{children}</>
const DialogClose = ({ children }: any) => <>{children}</>

export {
    Dialog,
    DialogPortal,
    DialogOverlay,
    DialogClose,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
}
