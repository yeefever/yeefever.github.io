
export const metadata = {
  title: "Projects",
  description: 'My Projects',
  generator: 'Next.js',
  applicationName: 'Kevin Liu\'s Personal Website',
  referrer: 'origin-when-cross-origin',
  keywords: ['Next.js', 'React', 'JavaScript', 'Website'],
  colorScheme: 'light',
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
      <body>{children}</body>
    </html>
  )
}
