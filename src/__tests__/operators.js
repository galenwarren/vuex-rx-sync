import { of } from "rxjs";
import { afterUnsubscribe } from "../operators";

describe("afterUnsubscribe", () => {
  it("should call action after unsubscribe occurs", callback => {
    const action = jest.fn(() => {
      callback();
    });

    const o$ = of(1, 2, 3).pipe(afterUnsubscribe(action, 1000));
    o$.subscribe().unsubscribe();
  });
});
