import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"

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
      <body className={cn(inter.className, "bg-[#050505] text-white antialiased")}>
        <div className="pointer-events-none fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.08),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(255,42,42,0.18),transparent_55%),radial-gradient(circle_at_50%_90%,rgba(62,91,255,0.12),transparent_60%)]" />
        </div>
        <div className="relative flex min-h-screen w-full">
          <Sidebar />
          <main className="relative ml-64 flex-1 px-4 py-8 sm:px-8 lg:px-10">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  )
}
