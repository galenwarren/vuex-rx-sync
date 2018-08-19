import { defaultReset } from '../sync';

describe('sync', () => {
  describe('defaultReset', () => {
    it('should set the value at path to undefined', () => {
      const storeSet = jest.fn();
      const path = ['users', 123];
      defaultReset(path, { storeSet });
      expect(storeSet).toHaveBeenCalledWith(path, undefined);
    });
  });
});
