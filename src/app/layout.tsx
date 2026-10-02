import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ทรัพย์อนันต์ Sub Anan — จัดการเงินให้เป็นเรื่องง่าย",
  description: "ทรัพย์อนันต์ Sub Anan · ภาพรวมการเงิน รายรับรายจ่าย และเป้าหมายการออมของคุณ",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
