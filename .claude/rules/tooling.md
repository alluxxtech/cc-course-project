# Tooling Rules

## Context7

When writing code that uses any third-party library or framework (NestJS, Next.js, Prisma, TypeORM, Passport.js, BullMQ, socket.io, React, etc.) — use Context7 to fetch up-to-date documentation before implementing.

Use Context7 when:
- Implementing a feature with a library API you are not 100% certain about
- Installing or configuring a new package
- Encountering a type error or unexpected behavior from a library
- The library may have changed its API between versions

Do not rely on training data for library APIs — they go stale. Fetch the current docs via Context7 instead.
