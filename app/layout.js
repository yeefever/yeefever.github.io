import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: "Kevin Liu",
  description: 'My Personal Website',
  generator: 'Next.js',
  applicationName: 'Kevin Liu\'s Personal Website',
  referrer: 'origin-when-cross-origin',
  keywords: ['Next.js', 'React', 'JavaScript', 'Website'],
  creator: 'Kevin Liu',
  publisher: 'Github',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    other: [
      { rel: 'mask-icon' },
      { url: '/safari-pinned-tab.svg', type: 'image/svg+xml'},
    ]
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
       <body className={inter.className}>{children}</body>
    </html>
  )
}
