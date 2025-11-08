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
      <body className={cn(inter.className, "bg-[var(--bg)] text-[var(--text)] antialiased")}>
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
