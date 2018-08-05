import { Subscription } from "rxjs";
import { syncStoreObservable } from "../observable";

export function syncStoreMixin(defaultOptions = {}) {
  return {
    methods: {
      $syncStore(options) {
        const observable = syncStoreObservable(
          Object.assign(
            {
              store: this.$store
            },
            defaultOptions,
            options
          )
        );

        this.$subscribeTo(observable);
      },

      $addSubscription(subscription) {
        if (!this._subscription) {
          this._subscription = new Subscription();
        }
        this._subscription.add(subscription);
      }
    }
  };
}
