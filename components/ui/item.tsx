import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const itemVariants = cva(
    "relative flex w-full items-center gap-4 rounded-lg border p-4 transition-all hover:bg-accent hover:text-accent-foreground",
    {
        variants: {
            variant: {
                default: "bg-background",
                outline: "border bg-transparent shadow-sm",
                ghost: "border-transparent hover:bg-accent/50",
            },
            size: {
                default: "p-4",
                sm: "p-3",
                xs: "p-2",
                lg: "p-6",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

const Item = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof itemVariants>
>(({ className, variant, size, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(itemVariants({ variant, size }), className)}
        {...props}
    />
))
Item.displayName = "Item"

const mediaVariants = cva(
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground",
    {
        variants: {
            variant: {
                default: "",
                icon: "bg-background shadow-sm border",
                primary: "bg-primary/10 text-primary",
                destructive: "bg-destructive/10 text-destructive",
                warning: "bg-yellow-500/10 text-yellow-600",
            },
            size: {
                default: "h-10 w-10 [&>svg]:h-5 [&>svg]:w-5",
                sm: "h-8 w-8 [&>svg]:h-4 [&>svg]:w-4",
                xs: "h-6 w-6 [&>svg]:h-3 [&>svg]:w-3",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

const ItemMedia = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof mediaVariants>
>(({ className, variant, size, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(mediaVariants({ variant, size }), className)}
        {...props}
    />
))
ItemMedia.displayName = "ItemMedia"

const ItemContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex-1 space-y-1", className)} {...props} />
))
ItemContent.displayName = "ItemContent"

const ItemTitle = React.forwardRef<
    HTMLHeadingElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h3
        ref={ref}
        className={cn("font-medium leading-none tracking-tight", className)}
        {...props}
    />
))
ItemTitle.displayName = "ItemTitle"

const ItemDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={cn("text-sm text-muted-foreground leading-snug", className)}
        {...props}
    />
))
ItemDescription.displayName = "ItemDescription"

export { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle }
