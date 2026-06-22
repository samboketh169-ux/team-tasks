import "./globals.css";

export const metadata = {
  title: "កិច្ចការក្រុម — Team Tasks",
  description: "Dashboard, ការងារត្រូវធ្វើ និងកត់ត្រាការងារ សម្រាប់ក្រុមការងារ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="km">
      <body className="font-body min-h-screen">{children}</body>
    </html>
  );
}
