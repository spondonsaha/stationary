import { CartProvider } from "@/components/cart/CartProvider";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { MobileNav } from "@/components/storefront/MobileNav";

/** Storefront chrome: header, footer, mobile bottom nav and cart drawer. */
export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main-content"
        className="sr-only rounded-md bg-ink px-4 py-2 text-sm text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to content
      </a>
      <CartProvider>
        <Header />
        <main id="main-content" className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
        <Footer />
        <MobileNav />
      </CartProvider>
    </div>
  );
}
