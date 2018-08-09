import Vue from "vue";
import { EMPTY, from, of, concat, fromEventPattern } from "rxjs";
import { switchMap, flatMap } from "rxjs/operators";

export const mappable = (operator, observableFactory, argCount) => {
  const baseArgCount =
    argCount !== undefined ? argCount : observableFactory.length;

  return (...args) => {
    if (args.length === baseArgCount) {
      return observableFactory(...args);
    } else if (args.length === baseArgCount + 1) {
      const factoryArgs = args.slice();
      const projection = factoryArgs.pop();
      return observableFactory(...factoryArgs).pipe(operator(projection));
    } else {
      throw new Error(
        `Wrong number of arguments supplied to ${
          observableFactory.name
        }, expected ${observableFactory.length} or ${observableFactory.length +
          1}`
      );
    }
  };
};

export const switchMappable = mappable.bind(null, switchMap);

export const flatMappable = mappable.bind(null, flatMap);

export const observeKeys = flatMappable(obj => {
  return obj ? from(Object.keys(obj)) : EMPTY;
});

export const observeValues = flatMappable(obj => {
  return obj ? from(Object.values(obj)) : EMPTY;
});

export const observeArray = flatMappable(arr => {
  return arr ? from(arr) : EMPTY;
});

export const watch = switchMappable(accessor => {
  const vm = new Vue({
    computed: {
      value() {
        return accessor();
      }
    }
  });

  return concat(
    of(accessor()),
    fromEventPattern(
      handler => vm.$watch("value", value => handler(value)),
      (handler, unsubscribe) => unsubscribe()
    )
  );
});
