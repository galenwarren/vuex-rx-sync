export function toSortedArray(obj, sortPredicate, keyName = "id") {
  return Object.entries(obj)
    .map(([key, value]) => Object.assign({}, value, { [keyName]: key }))
    .sort(sortPredicate);
}
