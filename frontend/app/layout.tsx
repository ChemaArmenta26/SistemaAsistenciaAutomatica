import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Toaster } from "sonner";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Sistema de Asistencia ITSON',
  description: 'Sistema para pase de lista automatizado',
  icons: {
    icon: [
      {
        url: '/itson-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/itson-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/itson-32x32.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/itson-32x32.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  )
}
