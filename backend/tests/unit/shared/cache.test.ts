import * as cache from '../../../src/shared/cache';

describe('shared/cache', () => {
  beforeEach(async () => {
    await cache.delByPrefix('test:');
  });

  it('wrap stores and returns cached values in memory', async () => {
    let calls = 0;
    const loader = async () => {
      calls += 1;
      return { items: [1], total: 1 };
    };

    const key = cache.buildListCacheKey('test:list:', { page: 1, pageSize: 8 });
    const first = await cache.wrap(key, 60, loader);
    const second = await cache.wrap(key, 60, loader);

    expect(first).toEqual({ items: [1], total: 1 });
    expect(second).toEqual(first);
    expect(calls).toBe(1);
  });

  it('del removes a single key', async () => {
    await cache.set('test:single', { ok: true }, 60);
    expect(await cache.get('test:single')).toEqual({ ok: true });
    await cache.del('test:single');
    expect(await cache.get('test:single')).toBeNull();
  });

  it('delByPrefix clears matching list keys', async () => {
    await cache.set('test:list:a', { n: 1 }, 60);
    await cache.set('test:list:b', { n: 2 }, 60);
    await cache.set('test:other', { n: 3 }, 60);

    await cache.delByPrefix('test:list:');

    expect(await cache.get('test:list:a')).toBeNull();
    expect(await cache.get('test:list:b')).toBeNull();
    expect(await cache.get('test:other')).toEqual({ n: 3 });
  });

  it('buildListCacheKey ignores empty filter fields', () => {
    const key = cache.buildListCacheKey('pets:list:', {
      page: 1,
      pageSize: 8,
      species: '',
      status: undefined,
    });
    expect(key).toBe('pets:list:{"page":1,"pageSize":8}');
  });
});
