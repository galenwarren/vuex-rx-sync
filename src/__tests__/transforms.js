import { from } from "rxjs";
import { toArray } from "rxjs/operators";
import { onUnsubscribe } from "../transforms";

describe("transforms", () => {
  const values = [1, 2, 3];
  const observable = from(values);

  describe("onUnsubscribe", () => {
    it("should properly call action after the observable is unsubscribed", async () => {
      const action = jest.fn();
      const transform = onUnsubscribe(action);

      const result = await observable
        .pipe(
          toArray(),
          transform
        )
        .toPromise();

      expect(result).toEqual(values);
      expect(action).toHaveBeenCalledTimes(1);
      expect(action).toHaveBeenCalledWith();
    });
  });
});
