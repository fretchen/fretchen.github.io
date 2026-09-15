import { describe, it, expect, vi, beforeEach } from "vitest";
import { createLocalStorageStore } from "../utils/localStorageStore";

describe("createLocalStorageStore", () => {
  beforeEach(() => window.localStorage.clear());

  it("reads back what it wrote, and null for an untouched key", () => {
    const store = createLocalStorageStore("test-key");

    expect(store.read()).toBeNull();
    store.write("value");
    expect(store.read()).toBe("value");
  });

  // The part the `storage` event does NOT do: it fires in *other* tabs only, so without the
  // explicit notify a write in this tab would never reach useSyncExternalStore and the UI would
  // keep rendering the previous value until something else re-rendered it.
  it("notifies subscribers in the writing tab", () => {
    const store = createLocalStorageStore("test-key");
    const onChange = vi.fn();
    store.subscribe(onChange);

    store.write("value");

    expect(onChange).toHaveBeenCalledOnce();
  });

  it("stops notifying after unsubscribe", () => {
    const store = createLocalStorageStore("test-key");
    const onChange = vi.fn();
    const unsubscribe = store.subscribe(onChange);

    unsubscribe();
    store.write("value");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps two stores on different keys independent", () => {
    const a = createLocalStorageStore("key-a");
    const b = createLocalStorageStore("key-b");
    const onB = vi.fn();
    b.subscribe(onB);

    a.write("only-a");

    expect(b.read()).toBeNull();
    expect(onB).not.toHaveBeenCalled();
  });
});
