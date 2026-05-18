/** No request/response noise in the terminal during HTTP tests. */
jest.mock('pino-http', () => ({
  __esModule: true,
  default: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

/** JWT authRequired middleware: skip Postgres status lookup in HTTP tests. */
jest.mock('../../src/modules/auth/auth.repository', () => {
  const actual = jest.requireActual('../../src/modules/auth/auth.repository') as object;
  return {
    ...actual,
    findUserAccountStatusById: jest.fn().mockResolvedValue('active'),
  };
});
