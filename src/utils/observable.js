import { EMPTY, of } from "rxjs";

export function observeKeys(obj) {
  return obj ? of(...Object.keys(obj)) : EMPTY;
}
