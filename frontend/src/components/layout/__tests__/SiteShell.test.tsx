import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { SiteShell } from "../site-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: { alt: string; [key: string]: unknown }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />
  ),
}));

vi.mock("@/components/providers/auth-provider", () => ({
  useAuth: () => ({ user: null, logout: vi.fn() }),
}));

vi.mock("@/components/wallet/NearWalletConnect", () => ({
  NearWalletConnect: () => <div data-testid="near-wallet-connect" />,
}));

vi.mock("@/lib/nav-config", () => ({
  NAV_LINKS: [
    { href: "/", label: "Home" },
    { href: "/game", label: "Game" },
  ],
  isActivePath: (pathname: string, href: string) => pathname === href,
}));

vi.mock("@/hooks/useFocusTrap", () => ({
  useFocusTrap: vi.fn(),
}));

describe("SiteShell", () => {
  describe("layout structure", () => {
    it("renders a skip-to-content link", () => {
      render(<SiteShell><p>content</p></SiteShell>);
      const skipLink = screen.getByRole("link", { name: /skip to content/i });
      expect(skipLink).toBeDefined();
      expect(skipLink.getAttribute("href")).toBe("#main");
    });

    it("skip link uses fixed positioning on focus (no CLS from absolute overflow)", () => {
      render(<SiteShell><p>content</p></SiteShell>);
      const skipLink = screen.getByRole("link", { name: /skip to content/i });
      expect(skipLink.className).toContain("focus:fixed");
      expect(skipLink.className).not.toContain("focus:absolute");
    });

    it("renders the main landmark with correct id", () => {
      render(<SiteShell><p>content</p></SiteShell>);
      const main = screen.getByRole("main");
      expect(main.id).toBe("main");
    });

    it("main element has tabIndex -1 for skip-link focus target", () => {
      render(<SiteShell><p>content</p></SiteShell>);
      const main = screen.getByRole("main");
      expect(main.tabIndex).toBe(-1);
    });

    it("main element has min-h-0 class to prevent flex overflow CLS", () => {
      render(<SiteShell><p>content</p></SiteShell>);
      const main = screen.getByRole("main");
      expect(main.className).toContain("min-h-0");
    });

    it("main element has scroll-mt-16 to align with sticky header height", () => {
      render(<SiteShell><p>content</p></SiteShell>);
      const main = screen.getByRole("main");
      expect(main.className).toContain("scroll-mt-16");
    });

    it("renders children inside main", () => {
      render(<SiteShell><p data-testid="child">hello</p></SiteShell>);
      expect(screen.getByTestId("child")).toBeDefined();
    });

    it("renders outer shell with min-h-dvh flex column", () => {
      const { container } = render(<SiteShell><p>x</p></SiteShell>);
      const shell = container.firstChild as HTMLElement;
      expect(shell.className).toContain("flex");
      expect(shell.className).toContain("min-h-dvh");
      expect(shell.className).toContain("flex-col");
    });
  });

  describe("performance budget", () => {
    it("does not render any images in the shell wrapper itself", () => {
      const { container } = render(<SiteShell><p>x</p></SiteShell>);
      // Images belong to Navbar/Footer children, not directly to the shell div
      const shellDiv = container.firstChild as HTMLElement;
      const directImgs = Array.from(shellDiv.children).filter(
        (c) => c.tagName === "IMG"
      );
      expect(directImgs).toHaveLength(0);
    });

    it("renders a footer landmark", () => {
      render(<SiteShell><p>x</p></SiteShell>);
      expect(screen.getByRole("contentinfo")).toBeDefined();
    });
  });
});
