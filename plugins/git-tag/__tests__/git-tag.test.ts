import * as Auto from '@auto-it/core';
import { makeHooks } from '@auto-it/core/dist/utils/make-hooks';

import GitTag from '../src';

const exec = jest.fn();
jest.spyOn(Auto, 'execPromise').mockImplementation(exec);

const setup = (mockGit?: { getLatestTagInBranch(): string }) => {
  const plugin = new GitTag();
  const hooks = makeHooks();

  plugin.apply(({ hooks, git: mockGit } as unknown) as Auto.Auto);

  return hooks;
};

describe('Git Tag Plugin', () => {
  beforeEach(() => {
    exec.mockClear();
  });

  describe('getPreviousVersion', () => {
    test('should error without git', async () => {
      const hooks = setup();
      await expect(
        hooks.getPreviousVersion.promise(r => r)
      ).rejects.toBeInstanceOf(Error);
    });

    test('should get previous version', async () => {
      const hooks = setup({ getLatestTagInBranch: () => 'v1.0.0' });
      const previousVersion = await hooks.getPreviousVersion.promise(r => r);
      expect(previousVersion).toBe('v1.0.0');
    });
  });

  describe('version', () => {
    test('should do nothing without git', async () => {
      const hooks = setup();
      await hooks.version.promise(Auto.SEMVER.patch);
      expect(exec).not.toHaveBeenCalled();
    });

    test('should do nothing with a bad version bump', async () => {
      const hooks = setup({ getLatestTagInBranch: () => 'v1.0.0' });
      await hooks.version.promise('wrong' as Auto.SEMVER);
      expect(exec).not.toHaveBeenCalled();
    });

    test('should tag next version', async () => {
      const hooks = setup({ getLatestTagInBranch: () => 'v1.0.0' });
      await hooks.version.promise(Auto.SEMVER.patch);
      expect(exec).toHaveBeenCalledWith('git', ['tag', '1.0.1']);
    });
  });
});
