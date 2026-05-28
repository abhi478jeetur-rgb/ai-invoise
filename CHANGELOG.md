# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1] - 2026-05-28

### Added
- **Testing Ecosystem:** Introduced Vitest and React Testing Library for fast Unit and Component testing.
- **CI/CD Pipeline:** Added GitHub Actions workflow (`.github/workflows/test-ecosystem.yml`) to automatically run Vitest and Playwright tests on push and pull requests.
- **Security Check:** Added a new Database constraint to strictly validate ISO currency codes on Invoices.

### Changed
- **Test Restructuring:** Organized test files into `unit`, `component`, `integration`, and `e2e` directories to follow the Testing Pyramid.
- **Security Posture:** Hardened the `/api/cron/reminders` endpoint to return `401 Unauthorized` instead of `500 Server Error` when authentication fails or `CRON_SECRET` is missing.
- **Environment Handling:** Updated Vercel configuration instructions and CI pipelines to require `CRON_SECRET`.

### Removed
- **Security Risk:** Deleted test files (`test-api.mjs`, `test-fetch.mjs`, `test-fetch-openai.mjs`) that accidentally contained hardcoded raw API keys.
