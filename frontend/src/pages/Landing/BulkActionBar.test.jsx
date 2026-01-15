import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import BulkActionBar from "./BulkActionBar";

const defaultProps = {
  isSelectionMode: true,
  selectedCount: 2,
  totalCount: 5,
  onSelectAll: vi.fn(),
  onClearSelection: vi.fn(),
  onDeleteSelected: vi.fn(),
  onCancel: vi.fn(),
  isDeleting: false,
};

describe("BulkActionBar", () => {
  it("does not render when selection mode is inactive", () => {
    const { container } = render(<BulkActionBar {...defaultProps} isSelectionMode={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders actions and triggers callbacks", () => {
    const handlers = {
      onSelectAll: vi.fn(),
      onClearSelection: vi.fn(),
      onDeleteSelected: vi.fn(),
      onCancel: vi.fn(),
    };

    render(
      <BulkActionBar
        {...defaultProps}
        {...handlers}
      />,
    );

    expect(screen.getByText("2 recipes selected")).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Select All/));
    fireEvent.click(screen.getByText("Clear Selection"));
    fireEvent.click(screen.getByText("Delete Selected"));
    fireEvent.click(screen.getByText("Cancel"));

    expect(handlers.onSelectAll).toHaveBeenCalledTimes(1);
    expect(handlers.onClearSelection).toHaveBeenCalledTimes(1);
    expect(handlers.onDeleteSelected).toHaveBeenCalledTimes(1);
    expect(handlers.onCancel).toHaveBeenCalledTimes(1);
  });
});
