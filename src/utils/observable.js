import Vue from "vue";
import { EMPTY, from, of, concat, fromEventPattern } from "rxjs";
import { switchMap } from "rxjs/operators";

export const mappable = (observableFactory, operator) => {
  return (...args) => {
    if (args.length === observableFactory.length) {
      return observableFactory(...args);
    } else if (args.length === observableFactory.length + 1) {
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

export const switchMappable = observableFactory =>
  mappable(observableFactory, switchMap);

export const observeKeys = switchMappable(obj => {
  return obj ? from(Object.keys(obj)) : EMPTY;
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
      handler => vm.$watch("value", handler),
      (handler, unsubscribe) => unsubscribe()
    )
  );
});
