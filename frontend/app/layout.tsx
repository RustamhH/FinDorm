import type { Metadata } from "next";
import "./globals.css";
import Footer from "./Footer";

export const metadata: Metadata = {
  title: "FinDorm",
  description: "Tələbələr üçün universitetə ən yaxın və büdcəyə uyğun ev axtarışı",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="az" data-theme="dark">
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}
