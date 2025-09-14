import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Provider } from "./provider";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	metadataBase: new URL('https://zneus.space'),
	title: 'Twitter X',
	description: 'Zenus is inspired by the Twitter',
	authors: [{ name: 'Behzod Odiljonov', url: 'https://zneus.space' }],
	 icons: { icon: "/images/x.svg" },
	openGraph: {
		title: 'Zenus',
		description: "Zenus is Best One",
		type: 'website',
		url: 'https://zneus.space',
		locale: 'uz_UZ',
		images: 'https://www.canva.com/design/DAGwgyuutR4/qUG_4Rr2AEuBGiWtaGRuQQ/view?utm_content=DAGwgyuutR4&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=hcb2b8f3567',
		countryName: 'Uzbekistan',
		siteName: 'Zenus',
		emails: 'behosh304@gmail.com',
	},
	keywords: "Twitter, Twitter web, twitter clone, twitter web application, Ilon, Ilon Mask, behzod odiljonov"
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </Provider>
        <Analytics />
      </body>
    </html>
  );
}
