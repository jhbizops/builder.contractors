import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JobFormDialog } from "../JobFormDialog";

describe("JobFormDialog", () => {
  it("submits a sanitized payload", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <JobFormDialog
        open
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText("Title"), "  New fitout  ");
    await user.type(screen.getByLabelText("Trade"), "  Electrical  ");
    await user.type(screen.getByLabelText("Region"), "   ");
    await user.type(screen.getByLabelText("Country"), "  AU  ");
    await user.type(screen.getByLabelText("Public summary"), "  Install lighting  ");
    await user.type(screen.getByLabelText("Private details"), "  Alarm code  ");

    await user.click(screen.getByRole("button", { name: "Post job" }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: "New fitout",
      trade: "Electrical",
      region: undefined,
      country: "AU",
      description: "Install lighting",
      privateDetails: "Alarm code",
    });
  });

  it("blocks submission when required fields are blank", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <JobFormDialog
        open
        onOpenChange={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Post job" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Title is required")).toBeInTheDocument();
    expect(screen.getByText("Trade is required")).toBeInTheDocument();
  });
});
