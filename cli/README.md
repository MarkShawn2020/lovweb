# create-lovstudio-app

Create a new Lovstudio Next.js project with one command.

## Usage

```bash
npx create-lovstudio-app my-app
```

Or with your preferred package manager:

```bash
pnpm create lovstudio-app my-app
yarn create lovstudio-app my-app
bun create lovstudio-app my-app
```

## Features

The CLI creates a project based on the [Lovstudio Next.js template](https://github.com/markshawn2020/lovweb) with:

- ⚡️ **Next.js 15** with App Router
- 🔒 **Supabase Auth** with cookie-based sessions
- 🗄️ **DrizzleORM** with PostgreSQL
- 🎨 **Tailwind CSS v4** + shadcn/ui
- 🌐 **i18n** with next-intl (Chinese/English)
- 📊 **Monitoring** with Sentry + PostHog
- 🛡️ **Security** with Arcjet

## Options

```bash
create-lovstudio-app [project-name] [options]

Options:
  --skip-install    Skip dependency installation
  --use-npm         Use npm as package manager
  --use-pnpm        Use pnpm as package manager
  --use-yarn        Use yarn as package manager
  --use-bun         Use bun as package manager
  -h, --help        Display help
  -v, --version     Display version
```

## Interactive Mode

When you run `create-lovstudio-app`, it will prompt you to:

1. Enter project name
2. Select features to include:
   - Supabase Auth (default: yes)
   - i18n support (default: yes)
   - Storybook (default: no)
   - Monitoring (default: yes)
3. Choose package manager
4. Initialize git repository

## License

MIT
