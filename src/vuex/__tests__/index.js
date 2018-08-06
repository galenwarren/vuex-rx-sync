import { crackStorePath } from "../index";

describe("crackStorePath", () => {
  it("works with a path of length 2", () => {
    expect(crackStorePath(["a", "b"])).toEqual({
      trunkPath: ["a"],
      leafKey: "b"
    });
  });

  it("works with a path of length 1", () => {
    expect(crackStorePath(["a"])).toEqual({ trunkPath: [], leafKey: "a" });
  });

  it("fails with a path of length 0", () => {
    expect(() => crackStorePath([])).toThrow("Invalid path");
  });
});

describe("vuexSyncMutations", () => {});
