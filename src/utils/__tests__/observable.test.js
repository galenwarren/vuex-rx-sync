import { EMPTY } from "rxjs";
import { toArray } from "rxjs/operators";

import { observeKeys } from "../observable";

describe("observeKeys", () => {
  test("properly handles populated map", async () => {
    const keys = await observeKeys({ a: 1, b: 2 })
      .pipe(toArray())
      .toPromise();
    expect(keys).toEqual(["a", "b"]);
  });

  test("properly handles empty map", async () => {
    const keys = await observeKeys({})
      .pipe(toArray())
      .toPromise();
    expect(keys).toEqual([]);
  });

  test("properly handles null map", () => {
    expect(observeKeys(null)).toBe(EMPTY);
  });
});
