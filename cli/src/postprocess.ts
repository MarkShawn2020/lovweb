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

  // 7. Replace branding (Lovweb -> projectName)
  await replaceBranding(projectPath, config)
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

// Files that need branding replacement
const BRANDING_FILES = [
  'src/utils/AppConfig.ts',
  'src/components/layout/Header.tsx',
  'src/components/layout/Footer.tsx',
  'src/components/LovwebIcon.tsx',
  'src/components/LovwebLogo.tsx',
  'src/components/auth/ProfessionalAuthLayout.tsx',
  'src/app/[locale]/layout.tsx',
  'src/locales/en.json',
  'src/locales/zh.json',
]

function toTitleCase(str: string): string {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

async function replaceBranding(projectPath: string, config: ProjectConfig): Promise<void> {
  const brandName = toTitleCase(config.projectName)
  const brandNameLower = config.projectName.toLowerCase()

  for (const file of BRANDING_FILES) {
    const filePath = path.join(projectPath, file)
    try {
      let content = await fs.promises.readFile(filePath, 'utf-8')

      // Replace branding variations
      content = content.replace(/Lovweb/g, brandName)
      content = content.replace(/lovweb/g, brandNameLower)
      content = content.replace(/LOVWEB/g, brandName.toUpperCase())

      // Replace GitHub URLs with placeholder
      content = content.replace(
        /https:\/\/github\.com\/markshawn2020\/lovweb/g,
        `https://github.com/your-org/${brandNameLower}`,
      )
      content = content.replace(
        /https:\/\/github\.com\/lovstudio\/lovweb/g,
        `https://github.com/your-org/${brandNameLower}`,
      )

      // Replace domain
      content = content.replace(/lovweb\.ai/g, `${brandNameLower}.com`)

      await fs.promises.writeFile(filePath, content)
    }
    catch {
      // File doesn't exist, skip
    }
  }

  // Rename LovwebIcon.tsx and LovwebLogo.tsx
  await renameComponent(projectPath, 'LovwebIcon', `${brandName}Icon`)
  await renameComponent(projectPath, 'LovwebLogo', `${brandName}Logo`)
}

async function renameComponent(projectPath: string, oldName: string, newName: string): Promise<void> {
  const oldPath = path.join(projectPath, `src/components/${oldName}.tsx`)
  const newPath = path.join(projectPath, `src/components/${newName}.tsx`)

  try {
    // Read and update content
    let content = await fs.promises.readFile(oldPath, 'utf-8')
    content = content.replace(new RegExp(oldName, 'g'), newName)
    await fs.promises.writeFile(oldPath, content)

    // Rename file
    await fs.promises.rename(oldPath, newPath)

    // Update imports in other files
    await updateImports(projectPath, oldName, newName)
  }
  catch {
    // File doesn't exist, skip
  }
}

async function updateImports(projectPath: string, oldName: string, newName: string): Promise<void> {
  const srcPath = path.join(projectPath, 'src')
  await updateImportsRecursive(srcPath, oldName, newName)
}

async function updateImportsRecursive(dir: string, oldName: string, newName: string): Promise<void> {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git')
        continue
      await updateImportsRecursive(fullPath, oldName, newName)
    }
    else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
      try {
        let content = await fs.promises.readFile(fullPath, 'utf-8')
        if (content.includes(oldName)) {
          content = content.replace(new RegExp(oldName, 'g'), newName)
          await fs.promises.writeFile(fullPath, content)
        }
      }
      catch {
        // Skip
      }
    }
  }
}
