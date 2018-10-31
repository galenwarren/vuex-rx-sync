import { VuexRxSyncConfig } from '../config';
import { DEFAULT_DISPOSE_DELAY } from '../constants';
import { SET_MUTATION, DELETE_MUTATION } from '../store';

describe('VuexRxSyncConfig', () => {
  let config = null;

  const path = ['property1'];
  const path2 = ['property2'];
  const value = 3;

  beforeEach(() => {
    const store = {
      state: {
        [path]: value,
      },
      commit: jest.fn(),
      watch: jest.fn((access, send) => send(access())),
    };
    config = new VuexRxSyncConfig({
      store,
      createDataObservable: jest.fn(),
    });
  });

  describe('constructor', () => {
    it('should fail if store not supplied', () => {
      expect(() => {
        new VuexRxSyncConfig({ createDataObservable: () => {} });
      }).toThrow('store is required');
    });

    it('should fail if createDataObservable not supplied', () => {
      expect(() => {
        new VuexRxSyncConfig({ store: {} });
      }).toThrow('createDataObservable is required');
    });

    it('should store properties on object', () => {
      const store = {};
      const createDataObservable = () => {};
      const config = new VuexRxSyncConfig({ store, createDataObservable });
      expect(config.store).toEqual(store);
      expect(config.createDataObservable).toEqual(createDataObservable);
    });
  });

  describe('disposeDelay', () => {
    it('should return the expected value', () => {
      expect(config.disposeDelay).toEqual(DEFAULT_DISPOSE_DELAY);
    });
  });

  describe('getStoreValue', () => {
    it('should return the defined value', () => {
      expect(config.getStoreValue(path)).toEqual(value);
    });

    it('should return undefined for missing immediate property', () => {
      expect(config.getStoreValue(path2)).toEqual(undefined);
    });

    it('should return undefined for missing immediate property', () => {
      expect(config.getStoreValue(path.concat(path2))).toEqual(undefined);
    });
  });

  describe('setStoreValue', () => {
    it('should generate the proper mutation', () => {
      config.setStoreValue(path, value);
      expect(config.store.commit).toHaveBeenCalledWith(SET_MUTATION, {
        path,
        value,
      });
    });
  });

  describe('deleteStoreValue', () => {
    it('should generate the proper mutation', () => {
      config.deleteStoreValue(path, value);
      expect(config.store.commit).toHaveBeenCalledWith(DELETE_MUTATION, {
        path,
      });
    });
  });

  describe('createStoreObservable', () => {
    it('should properly create observable', async () => {
      config.getStoreValue = jest.fn(() => value);
      config.setStoreValue = jest.fn();

      const o$ = config.createStoreObservable(path);

      expect(config.getStoreValue).toHaveBeenCalledWith(path);
      expect(config.setStoreValue).toHaveBeenCalledWith(path, value);

      config.getStoreValue.mockClear();
      config.setStoreValue.mockClear();

      await new Promise(resolve => {
        o$.subscribe(v => {
          expect(v).toEqual(value);
          expect(config.getStoreValue).toHaveBeenCalledWith(path);
          resolve();
        });
      });
    });
  });

  describe('shouldDeleteStoreValue', () => {
    it('should return true if value is undefined', () => {
      expect(config.shouldDeleteStoreValue(path, undefined)).toEqual(true);
    });

    it('should return false if value is defined', () => {
      expect(config.shouldDeleteStoreValue(path, 1)).toEqual(false);
      expect(config.shouldDeleteStoreValue(path, null)).toEqual(false);
      expect(config.shouldDeleteStoreValue(path, '')).toEqual(false);
      expect(config.shouldDeleteStoreValue(path, false)).toEqual(false);
    });
  });

  describe('updateStore', () => {
    it('should properly update value', () => {
      config.shouldDeleteStoreValue = jest.fn(() => false);
      config.setStoreValue = jest.fn();
      config.deleteStoreValue = jest.fn();

      config.updateStore(path, value);

      expect(config.shouldDeleteStoreValue).toHaveBeenCalledWith(path, value);
      expect(config.deleteStoreValue).toHaveBeenCalledTimes(0);
      expect(config.setStoreValue).toHaveBeenCalledWith(path, value);
    });

    it('should properly delete value', () => {
      config.shouldDeleteStoreValue = jest.fn(() => true);
      config.setStoreValue = jest.fn();
      config.deleteStoreValue = jest.fn();

      config.updateStore(path, value);

      expect(config.shouldDeleteStoreValue).toHaveBeenCalledWith(path, value);
      expect(config.setStoreValue).toHaveBeenCalledTimes(0);
      expect(config.deleteStoreValue).toHaveBeenCalledWith(path);
    });
  });

  describe('resetStore', () => {
    it('should delete the store value', () => {
      config.deleteStoreValue = jest.fn();
      config.resetStore(path);
      expect(config.deleteStoreValue).toHaveBeenCalledWith(path);
    });
  });
});
