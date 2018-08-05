import { EMPTY } from "rxjs";
import { observeKeys } from "../observable";

describe("observeKeys", () => {
  test("properly handles null map", () => {
    expect(observeKeys(null)).toBe(EMPTY);
  });
});
