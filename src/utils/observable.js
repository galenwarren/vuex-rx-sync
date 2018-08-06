import { EMPTY, from } from "rxjs";

export function observeKeys(obj) {
  return obj ? from(Object.keys(obj)) : EMPTY;
}
