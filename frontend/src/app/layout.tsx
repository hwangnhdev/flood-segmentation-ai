import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "FloodSeg AI – Flood Segmentation Analyzer",
  description:
    "ConvNeXt-Tiny ViT-UNet powered flood scene segmentation. Upload aerial images and get instant mask predictions with IoU, Dice and Accuracy metrics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
