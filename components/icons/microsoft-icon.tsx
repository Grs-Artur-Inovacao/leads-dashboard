import * as React from "react"

export function MicrosoftIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            role="img"
            viewBox="0 0 23 23"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <title>Microsoft</title>
            <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" fill="currentColor" />
            <path d="M0 0h11.4v11.4H0V0zm12.6 0H24v11.4H12.6V0zM0 12.6h11.4V24H0V12.6zm12.6 0H24V24H12.6V12.6z" fill="#fff" opacity=".1" />
            <rect x="0" y="0" width="10.9" height="10.9" fill="#f25022" />
            <rect x="11.8" y="0" width="10.9" height="10.9" fill="#7fba00" />
            <rect x="0" y="11.8" width="10.9" height="10.9" fill="#00a4ef" />
            <rect x="11.8" y="11.8" width="10.9" height="10.9" fill="#ffb900" />
        </svg>
    )
}
