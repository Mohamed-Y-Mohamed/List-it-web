# List It

List It is a Next.js task and note management application with public account pages and an authenticated application for organising lists, collections, tasks and notes.

## Features

- Create and manage lists and collections.
- Organise tasks and notes within the application.
- Use dedicated views for current and upcoming work.
- Register, sign in and recover an account through the public authentication pages.
- View productivity information and charts in the application interface.
- Use a responsive interface built with React and Tailwind CSS.
- Generate a sitemap as part of the production build.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 |
| UI | React 19, Tailwind CSS 4, DaisyUI |
| Backend client | Supabase JavaScript client |
| Animation | Framer Motion |
| Charts | Recharts |
| Tests | Jest |
| Code quality | ESLint, Prettier, Husky |

## Requirements

- Node.js `22.14.0`.
- npm `11.2.0` as declared by the repository.
- Backend configuration for the Supabase services used by the application.

## Installation

```bash
git clone https://github.com/Mohamed-Y-Mohamed/List-it-web.git
cd List-it-web
npm install
```

`npm install` runs the repository's `prepare` script, which installs Husky hooks.

## Running locally

```bash
npm run dev
```

The development command is `next dev --turbopack`.

## Building

```bash
npm run build
```

The `postbuild` script then runs `next-sitemap`.

## Testing and checks

```bash
npm test
npm run type-check
npm run format
npm run audit
```

The repository contains Jest configuration and setup files. A Husky pre-commit hook is also committed.

## Licence

This repository is licensed under GNU GPL v3. See [LICENSE](LICENSE).

The licence has not been changed automatically because the repository README identifies the project as jointly authored. Changing a shared project's licence requires agreement from all relevant copyright holders.

## Authors

The existing project documentation credits Mohamed Yusuf Mohamed and Abdul (`A-Moiz`) as authors.
