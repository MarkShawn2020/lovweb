import fs from 'node:fs'
import path from 'node:path'
import type { ProjectConfig } from './prompts'

// Files to always remove from the template
const ALWAYS_REMOVE = [
  'cli',
  '.changeset',
  '.github',
  'CHANGELOG.md',
  '.coderabbit.yaml',
  'crowdin.yml',
  'codecov.yml',
  'checkly.config.ts',
  'unlighthouse.config.ts',
  '.claude',
  'CLAUDE.md',
  'AGENTS.md',
]

// Files to remove when Storybook is not selected
const STORYBOOK_FILES = [
  '.storybook',
]

// Patterns to match for Storybook removal
const STORYBOOK_PATTERNS = ['.stories.tsx', '.stories.ts']

// Files to remove when i18n is not selected
const I18N_FILES = [
  'src/locales',
  'crowdin.yml',
]

// Files to remove when monitoring is not selected
const MONITORING_FILES = [
  'src/instrumentation.ts',
  'src/instrumentation-client.ts',
  'sentry.client.config.ts',
  'sentry.server.config.ts',
  'sentry.edge.config.ts',
]

export async function processTemplate(projectPath: string, config: ProjectConfig): Promise<void> {
  // 1. Always remove these files/folders
  for (const file of ALWAYS_REMOVE) {
    await removeIfExists(path.join(projectPath, file))
  }

  // 2. Remove Storybook files if not selected
  if (!config.features.storybook) {
    for (const file of STORYBOOK_FILES) {
      await removeIfExists(path.join(projectPath, file))
    }
    // Remove all .stories.tsx files
    await removeMatchingFiles(projectPath, STORYBOOK_PATTERNS)
  }

  // 3. Remove i18n files if not selected
  if (!config.features.i18n) {
    for (const file of I18N_FILES) {
      await removeIfExists(path.join(projectPath, file))
    }
  }

  // 4. Remove monitoring files if not selected
  if (!config.features.monitoring) {
    for (const file of MONITORING_FILES) {
      await removeIfExists(path.join(projectPath, file))
    }
  }

  // 5. Update package.json
  await updatePackageJson(projectPath, config)

  // 6. Create/update .env.example if needed
  await ensureEnvExample(projectPath, config)
}

async function removeIfExists(filePath: string): Promise<void> {
  try {
    const stat = await fs.promises.stat(filePath)
    if (stat.isDirectory()) {
      await fs.promises.rm(filePath, { recursive: true, force: true })
    }
    else {
      await fs.promises.unlink(filePath)
    }
  }
  catch {
    // File doesn't exist, ignore
  }
}

async function removeMatchingFiles(dir: string, patterns: string[]): Promise<void> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      // Skip node_modules and .git
      if (entry.name === 'node_modules' || entry.name === '.git')
        continue
      await removeMatchingFiles(fullPath, patterns)
    }
    else if (patterns.some(pattern => entry.name.endsWith(pattern))) {
      await fs.promises.unlink(fullPath)
    }
  }
}

async function updatePackageJson(projectPath: string, config: ProjectConfig): Promise<void> {
  const pkgPath = path.join(projectPath, 'package.json')
  const pkg = JSON.parse(await fs.promises.readFile(pkgPath, 'utf-8'))

  // Update basic info
  pkg.name = config.projectName
  pkg.version = '0.1.0'
  pkg.private = true

  // Remove template-specific fields
  delete pkg.repository
  delete pkg.bugs
  delete pkg.homepage

  // Remove storybook scripts and dependencies if not selected
  if (!config.features.storybook) {
    delete pkg.scripts?.storybook
    delete pkg.scripts?.['build-storybook']
    delete pkg.devDependencies?.['@chromatic-com/storybook']
    delete pkg.devDependencies?.['@storybook/addon-essentials']
    delete pkg.devDependencies?.['@storybook/addon-interactions']
    delete pkg.devDependencies?.['@storybook/addon-onboarding']
    delete pkg.devDependencies?.['@storybook/blocks']
    delete pkg.devDependencies?.['@storybook/nextjs']
    delete pkg.devDependencies?.['@storybook/react']
    delete pkg.devDependencies?.['@storybook/test']
    delete pkg.devDependencies?.storybook
  }

  // Remove monitoring dependencies if not selected
  if (!config.features.monitoring) {
    delete pkg.dependencies?.['@sentry/nextjs']
    delete pkg.dependencies?.['posthog-js']
    delete pkg.dependencies?.['@logtape/logtape']
    delete pkg.dependencies?.['@logtape/otel']
    delete pkg.dependencies?.['@better-stack/browser-sdk']
  }

  // Update package manager field
  if (config.packageManager !== 'pnpm') {
    delete pkg.packageManager
  }

  await fs.promises.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}

async function ensureEnvExample(projectPath: string, config: ProjectConfig): Promise<void> {
  const envExamplePath = path.join(projectPath, '.env.example')

  let envContent = `# Database
DATABASE_URL=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
`

  if (config.features.monitoring) {
    envContent += `
# Monitoring (optional)
SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
BETTER_STACK_SOURCE_TOKEN=
`
  }

  envContent += `
# Security (optional)
ARCJET_KEY=
`

  await fs.promises.writeFile(envExamplePath, envContent)
}
