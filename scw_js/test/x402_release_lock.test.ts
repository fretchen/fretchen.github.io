import { describe, it, expect, vi } from "vitest";
import {
  releaseLock,
  type SdkPaymentPayload,
  type SdkPaymentRequirements,
} from "../x402_server.js";

const payload = { accepted: { network: "eip155:10" } } as unknown as SdkPaymentPayload;
const requirements = {
  network: "eip155:10",
  scheme: "batch-settlement",
} as unknown as SdkPaymentRequirements;

/** Stands in for x402ResourceServer: only the cancellation dispatcher is reached. */
function makeServer(cancel: () => Promise<void>) {
  const createPaymentCancellationDispatcher = vi.fn(() => ({ cancel: vi.fn(cancel) }));
  return {
    server: { createPaymentCancellationDispatcher } as never,
    createPaymentCancellationDispatcher,
  };
}

describe("releaseLock", () => {
  // `handler_failed` is one of the reasons the batch-settlement scheme answers with
  // clearPendingRequest; another reason would leave the lock in place.
  it("cancels the verified payment with a reason the scheme clears the lock for", async () => {
    const { server, createPaymentCancellationDispatcher } = makeServer(async () => {});

    await releaseLock(server, payload, requirements);

    expect(createPaymentCancellationDispatcher).toHaveBeenCalledWith(payload, requirements);
    const dispatcher = createPaymentCancellationDispatcher.mock.results[0].value as {
      cancel: ReturnType<typeof vi.fn>;
    };
    expect(dispatcher.cancel).toHaveBeenCalledWith({ reason: "handler_failed" });
  });

  // Best effort: the caller is already on a failure path and must return its own error response.
  it("never throws, even when the cancellation does", async () => {
    const { server } = makeServer(async () => {
      throw new Error("S3 unavailable");
    });

    await expect(releaseLock(server, payload, requirements)).resolves.toBeUndefined();
  });
});
