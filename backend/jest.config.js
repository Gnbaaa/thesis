/** @type {import('jest').Config} */
const coreServiceGlobs = [
  'src/modules/auth/auth.service.ts',
  'src/modules/auth/userStatus.ts',
  'src/modules/auth/auth.jwt.ts',
  'src/modules/pets/pets.service.ts',
  'src/modules/adoption/adoption.service.ts',
  'src/modules/donations/donations.service.ts',
  'src/modules/volunteer/volunteer.service.ts',
  'src/modules/users/admin/admin.service.ts',
  'src/modules/ngo/ngo.service.ts',
  'src/modules/users/users.service.ts',
  'src/modules/notifications/notifications.service.ts',
  'src/modules/uploads/uploads.service.ts',
  'src/shared/cache.ts',
];

/** @type {Record<string, { lines: number; statements: number }>} */
const coverageThreshold = {};
for (const file of coreServiceGlobs) {
  coverageThreshold[file] = { lines: 70, statements: 70 };
}

const shared = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'js', 'json'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  // Integration tests intentionally hit 401/403/404 — do not treat HTTP logs as failures.
  silent: true,
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
};

/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      ...shared,
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
    },
    {
      ...shared,
      displayName: 'integration',
      testMatch: [
        '<rootDir>/tests/integration/**/*.test.ts',
        '<rootDir>/tests/auth.*.test.ts',
        '<rootDir>/tests/health.test.ts',
      ],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts', '<rootDir>/tests/integration/setup.ts'],
    },
  ],
  collectCoverageFrom: coreServiceGlobs,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold,
};
