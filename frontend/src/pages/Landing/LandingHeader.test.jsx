import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LandingHeader from "./LandingHeader";

vi.mock("../../components/auth", () => ({
  AuthButton: () => <div data-testid="auth-button">Auth</div>,
}));

describe("LandingHeader", () => {
  it("renders actions and invokes handlers", () => {
    const onOpenRandom = vi.fn();
    const onNavigateCollections = vi.fn();
    const onNavigateSettings = vi.fn();

    render(
      <LandingHeader
        onOpenRandom={onOpenRandom}
        onNavigateCollections={onNavigateCollections}
        onNavigateSettings={onNavigateSettings}
      />,
    );

    fireEvent.click(screen.getByTitle("Random Recipe"));
    fireEvent.click(screen.getByTitle("My Collections"));
    fireEvent.click(screen.getByTitle("Account Settings"));

    expect(onOpenRandom).toHaveBeenCalledTimes(1);
    expect(onNavigateCollections).toHaveBeenCalledTimes(1);
    expect(onNavigateSettings).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("auth-button")).toBeInTheDocument();
  });
});
