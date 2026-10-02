import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kinn — จัดการเงินให้เป็นเรื่องง่าย",
  description: "ภาพรวมการเงิน รายรับรายจ่าย และเป้าหมายการออมของคุณ",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="th"><body>{children}</body></html>;
}
