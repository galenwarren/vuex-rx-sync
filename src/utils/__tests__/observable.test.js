import Vue from "vue";
import { EMPTY } from "rxjs";
import { toArray } from "rxjs/operators";
import deepEqual from "deep-equal";

import { observeKeys, observeValues, observeArray, watch } from "../observable";

describe("observeKeys", () => {
  it("properly handles populated map", async () => {
    const keys = await observeKeys({ a: 1, b: 2 })
      .pipe(toArray())
      .toPromise();
    expect(keys).toEqual(["a", "b"]);
  });

  it("properly handles empty map", async () => {
    const keys = await observeKeys({})
      .pipe(toArray())
      .toPromise();
    expect(keys).toEqual([]);
  });

  it("properly handles null map", () => {
    expect(observeKeys(null)).toBe(EMPTY);
  });
});

describe("observeValues", () => {
  it("properly handles populated map", async () => {
    const keys = await observeValues({ a: 1, b: 2 })
      .pipe(toArray())
      .toPromise();
    expect(keys).toEqual([1, 2]);
  });

  it("properly handles empty map", async () => {
    const keys = await observeValues({})
      .pipe(toArray())
      .toPromise();
    expect(keys).toEqual([]);
  });

  it("properly handles null map", () => {
    expect(observeValues(null)).toBe(EMPTY);
  });
});

describe("observeArray", () => {
  it("properly handles populated map", async () => {
    const keys = await observeArray([1, 2])
      .pipe(toArray())
      .toPromise();
    expect(keys).toEqual([1, 2]);
  });

  it("properly handles empty map", async () => {
    const keys = await observeArray([])
      .pipe(toArray())
      .toPromise();
    expect(keys).toEqual([]);
  });

  it("properly handles null map", () => {
    expect(observeArray(null)).toBe(EMPTY);
  });
});

describe("watch", () => {
  it("properly watches changes", done => {
    const vm = new Vue({ data: { x: 0 } });

    let callbackCount = 0;
    const values = [];

    const subscription = watch(() => vm.x).subscribe(value => {
      callbackCount++;
      values.push(value);

      if (callbackCount === 3) {
        if (deepEqual(values, [0, 1, 2])) {
          subscription.unsubscribe();
          done();
        }
      }
    });

    vm.x = 1;
    Vue.nextTick(() => {
      vm.x = 2;
    });
  });
});
