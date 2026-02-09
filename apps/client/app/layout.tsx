import './globals.css'

export const metadata = {
  title: 'Travelagent - AI 여행 플래너',
  description: 'Claude 3 Opus 기반 지능형 여행 일정 자동화 서비스',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
