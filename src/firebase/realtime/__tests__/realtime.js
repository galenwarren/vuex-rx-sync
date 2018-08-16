import Vue from "vue";
import { Observable } from "rxjs";
import { transformValue, firebaseRealtimeSource } from "../realtime";

describe("firebase realtime", () => {
  describe("transformValue", () => {
    it("should transform null to undefined", () => {
      expect(transformValue(null)).toBe(undefined);
    });

    it("should not transform non-null values", () => {
      expect(transformValue(1)).toBe(1);
      expect(transformValue("test")).toBe("test");

      const obj = { foo: "bar " };
      expect(transformValue(obj)).toBe(obj);
    });
  });

  describe("firebaseRealtimeSource", () => {
    it("should properly deliver values", callback => {
      const value = {
        val() {
          return 12;
        }
      };

      const firebase = {
        database() {
          return {
            ref() {
              return {
                on(eventName, valueHandler) {
                  expect(eventName).toBe("value");
                  Vue.nextTick(() => valueHandler(value));
                },
                off() {
                  expect(valueHandler).toHaveBeenCalledTimes(1);
                  expect(errorHandler).toHaveBeenCalledTimes(0);
                  callback();
                }
              };
            }
          };
        }
      };

      const path = "/users/123";
      const value$ = firebaseRealtimeSource(path, firebase);

      const valueHandler = jest.fn(receivedValue => {
        expect(receivedValue).toBe(value);
        subscription.unsubscribe();
      });
      const errorHandler = jest.fn();

      const subscription = value$.subscribe(valueHandler, errorHandler);
    });

    it("should properly handle errors", callback => {
      const firebase = {
        database() {
          return {
            ref() {
              return {
                on(eventName, valueHandler, errorHandler) {
                  expect(eventName).toBe("value");
                  Vue.nextTick(() => errorHandler(new Error("failure")));
                },
                off() {
                  expect(valueHandler).toHaveBeenCalledTimes(0);
                  expect(errorHandler).toHaveBeenCalledTimes(1);
                  callback();
                }
              };
            }
          };
        }
      };

      const path = "/users/123";
      const value$ = firebaseRealtimeSource(path, firebase);

      const valueHandler = jest.fn();
      const errorHandler = jest.fn(error => {
        expect(error.message).toBe("failure");
      });

      value$.subscribe(valueHandler, errorHandler);
    });

    it("should not require firebase to be passed", () => {
      const path = "/users/123";
      const value$ = firebaseRealtimeSource(path);
      expect(value$).toBeInstanceOf(Observable);
    });
  });
});
