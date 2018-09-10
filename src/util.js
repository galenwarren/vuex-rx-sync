export function findObservable(name) {
  if (this.$observables) {
    const observable = this.$observables[name];
    if (observable) {
      return observable;
    }
  }
  if (this.$parent) {
    return findObservable.call(this.$parent, name);
  }
  return null;
}

export function pathIsValid(path) {
  return !path.includes(undefined) && !path.includes(null);
}

export function crackPath(path) {
  if (path.length < 1) {
    throw new Error(`Invalid path ${path}, length must be >= 1`);
  }

  const trunkPath = path.slice();
  const leafKey = trunkPath.pop();
  return { trunkPath, leafKey };
}
