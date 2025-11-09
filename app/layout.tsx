import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import { NoiseBackground } from "@/components/backgrounds/noise-background"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Storyboard - Social Media Management",
  description: "Manage multiple brand content workflows",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "bg-[var(--bg)] text-[var(--text)] antialiased")}>
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08)_0%,_rgba(15,15,15,0.65)_55%,_rgba(5,5,5,0.95)_100%)]" />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#ff0033]/10 via-transparent to-transparent blur-3xl opacity-70" />
          <NoiseBackground className="opacity-35" />
        </div>
        <div className="flex min-h-screen w-full">
          <Sidebar />
          <main className="relative flex-1 px-4 py-8 sm:px-8 lg:px-10">
            <div className="mx-auto w-full max-w-6xl space-y-10">{children}</div>
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  )
}
