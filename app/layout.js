import './globals.css'
import { Source_Serif_4 } from 'next/font/google'

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata = {
  title: "Kevin Liu",
  description: "My Personal Website",
  applicationName: "Kevin Liu's Personal Website",
  keywords: ['Next.js', 'React', 'JavaScript', 'Website'],
  creator: 'Kevin Liu',
  publisher: 'Github',
  referrer: 'origin-when-cross-origin',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/icon/favicon-32x32.png',
    shortcut: '/favicon.ico',
    apple: '/icon/apple-touch-icon.png',
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        type: 'image/svg+xml',
        color: '#5bbad5'
      }
    ]
  },
  manifest: '/site.webmanifest'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
       <body className="font-serif">{children}</body>
    </html>
  )
}
