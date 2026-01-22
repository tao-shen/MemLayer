# Contributing Guide

## Development Setup

1. Fork the repository
2. Clone your fork
3. Install dependencies: `pnpm install`
4. Start infrastructure: `pnpm docker:up`
5. Create a branch: `git checkout -b feature/my-feature`

## Code Standards

### TypeScript
- Use strict mode
- Define explicit types
- Avoid `any` type
- Use interfaces for public APIs

### Naming Conventions
- Files: kebab-case (e.g., `tacit-service.ts`)
- Classes: PascalCase (e.g., `TacitService`)
- Functions: camelCase (e.g., `storeTacit`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_RETRIES`)

### Code Style
- Use Prettier for formatting
- Use ESLint for linting
- Run `pnpm lint` before committing
- Run `pnpm format` to auto-format

## Testing

- Write tests for new features
- Maintain test coverage > 80%
- Run tests: `pnpm test`
- Test types: Unit, Integration, E2E

## Commit Messages

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance

Example: `feat: add episodic tacit knowledge filtering`

## Pull Requests

1. Update documentation
2. Add tests
3. Ensure CI passes
4. Request review
5. Address feedback

## Project Structure

```
packages/     - Shared libraries
services/     - Microservices
scripts/      - Utility scripts
docs/         - Documentation
```

## Questions?

Open an issue or discussion on GitHub.
