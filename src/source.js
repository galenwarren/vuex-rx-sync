import memoize from "memoizee";
import { switchMappable } from "./utils";
import { share } from "rxjs/operators";
import { deleteMemoizeRef } from "./transform";

export function sourceFactory({ createObservable, enrichArgs }) {
  return options => {
    const enrich = enrichArgs(options);
    const memoizedFactory = memoize(
      (...enrichedArgs) => createObservable(...enrichedArgs).pipe(share()),
      { length: createObservable.length }
    );

    return switchMappable(
      (...args) =>
        memoizedFactory(...enrich(...args)).pipe(
          deleteMemoizeRef(memoizedFactory, ...args)
        ),
      enrich.length
    );
  };
}
