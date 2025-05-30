import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe("NFTList Simple Test", () => {
  it("should load test framework correctly", () => {
    render(
      <TestWrapper>
        <div>Test Component</div>
      </TestWrapper>,
    );

    expect(screen.getByText("Test Component")).toBeInTheDocument();
  });
});
