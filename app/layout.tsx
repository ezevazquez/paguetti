import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Paguetti — Separá gastos sin drama',
  description:
    'Calculadora simple para dividir gastos entre amigos. Cargá quién pagó, cuánto puso, calculá y compartí el resumen.',
  icons: {
    icon: '/small-logo.png',
    apple: '/small-logo.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EFF6FF' },
    { media: '(prefers-color-scheme: dark)', color: '#07111F' },
  ],
}

// Inline script: light by default; respects saved preference before paint.
const themeScript = `(function(){try{var t=localStorage.getItem('paguetti-theme');if(t==='dark'){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){document.documentElement.classList.remove('dark');}})();`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} bg-background`} suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-component */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased min-h-screen">
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  )
}
