import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

// Primary font - Modern geometric sans-serif
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

// Mono font for numbers and data
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "FinBoard | Real-Time Finance Dashboard",
  description:
    "Build your own real-time finance monitoring dashboard with customizable widgets and live market data.",
  keywords: ["finance", "dashboard", "stocks", "real-time", "widgets"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`
          ${spaceGrotesk.variable} 
          ${jetbrainsMono.variable} 
          font-sans antialiased
          bg-zinc-950 text-zinc-100
          min-h-screen
        `}
      >
        <Providers>
          {/* Background gradient effect */}
          <div className="fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-[40%] -left-[20%] w-[70%] h-[70%] rounded-full bg-emerald-500/5 blur-[120px]" />
            <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] rounded-full bg-blue-500/5 blur-[120px]" />
          </div>
          {children}
        </Providers>
      </body>
    </html>
  );
}
