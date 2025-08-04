import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BigModel Chatbot Tester",
  description: "Test BigModel API connections",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Completely block any MetaMask or Web3 related code
              if (typeof window !== 'undefined') {
                window.ethereum = undefined;
                window.web3 = undefined;
                
                // Override any MetaMask detection
                Object.defineProperty(window, 'ethereum', {
                  get: () => undefined,
                  set: () => {},
                  configurable: false
                });
                
                // Suppress MetaMask errors globally
                const originalAddEventListener = window.addEventListener;
                window.addEventListener = function(type, listener, options) {
                  if (type === 'unhandledrejection') {
                    const wrappedListener = function(event) {
                      if (event.reason && (
                        event.reason.message?.includes('MetaMask') ||
                        event.reason.toString?.().includes('MetaMask') ||
                        JSON.stringify(event.reason).includes('MetaMask')
                      )) {
                        console.warn('Blocked MetaMask error:', event.reason);
                        event.preventDefault();
                        event.stopPropagation();
                        return false;
                      }
                      return listener.call(this, event);
                    };
                    return originalAddEventListener.call(this, type, wrappedListener, options);
                  }
                  return originalAddEventListener.call(this, type, listener, options);
                };
              }
            `,
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
