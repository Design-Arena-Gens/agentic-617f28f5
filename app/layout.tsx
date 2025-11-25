import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Aurora Studio | Produção Audiovisual Inteligente",
  description:
    "Suite profissional de produção audiovisual com síntese de voz premium e editor de vídeo visual inspirado em estúdios cinematográficos."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${poppins.variable}`}>
      <body className="bg-surface text-slate-100">
        {children}
      </body>
    </html>
  );
}
