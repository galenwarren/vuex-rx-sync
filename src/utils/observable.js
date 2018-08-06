import Vue from "vue";
import { EMPTY, from, of, concat, fromEventPattern } from "rxjs";

export function observeKeys(obj) {
  return obj ? from(Object.keys(obj)) : EMPTY;
}

export function watch(accessor) {
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
}
