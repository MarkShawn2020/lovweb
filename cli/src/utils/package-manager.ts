import { execSync } from 'node:child_process'

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

export function detectPackageManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent || ''

  if (userAgent.startsWith('pnpm'))
    return 'pnpm'
  if (userAgent.startsWith('yarn'))
    return 'yarn'
  if (userAgent.startsWith('bun'))
    return 'bun'

  return 'npm'
}

export function isPackageManagerInstalled(pm: PackageManager): boolean {
  try {
    execSync(`${pm} --version`, { stdio: 'ignore' })
    return true
  }
  catch {
    return false
  }
}

export function getInstallCommand(pm: PackageManager): string {
  switch (pm) {
    case 'pnpm':
      return 'pnpm install'
    case 'yarn':
      return 'yarn'
    case 'bun':
      return 'bun install'
    default:
      return 'npm install'
  }
}

export function getRunCommand(pm: PackageManager): string {
  switch (pm) {
    case 'npm':
      return 'npm run'
    default:
      return pm
  }
}
