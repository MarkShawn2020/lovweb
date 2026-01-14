import prompts from 'prompts'
import pc from 'picocolors'
import { detectPackageManager, isPackageManagerInstalled, type PackageManager } from './utils/package-manager'

export interface ProjectConfig {
  projectName: string
  features: {
    supabase: boolean
    i18n: boolean
    storybook: boolean
    monitoring: boolean
  }
  packageManager: PackageManager
  initGit: boolean
}

export async function promptProjectConfig(defaultName?: string): Promise<ProjectConfig | null> {
  const detectedPm = detectPackageManager()

  const response = await prompts(
    [
      {
        type: 'text',
        name: 'projectName',
        message: 'Project name:',
        initial: defaultName || 'my-lovstudio-app',
        validate: (value: string) => {
          if (!value)
            return 'Project name is required'
          if (!/^[a-z0-9-_]+$/i.test(value))
            return 'Project name can only contain letters, numbers, hyphens and underscores'
          return true
        },
      },
      {
        type: 'multiselect',
        name: 'features',
        message: 'Select features:',
        instructions: pc.dim('(space to select, enter to confirm)'),
        choices: [
          { title: 'Supabase Auth', value: 'supabase', selected: true },
          { title: 'i18n (Chinese/English)', value: 'i18n', selected: true },
          { title: 'Storybook', value: 'storybook', selected: false },
          { title: 'Monitoring (Sentry + PostHog)', value: 'monitoring', selected: true },
        ],
      },
      {
        type: 'select',
        name: 'packageManager',
        message: 'Package manager:',
        choices: [
          { title: `pnpm ${detectedPm === 'pnpm' ? pc.dim('(detected)') : pc.dim('(recommended)')}`, value: 'pnpm' },
          { title: `npm ${detectedPm === 'npm' ? pc.dim('(detected)') : ''}`, value: 'npm' },
          { title: `yarn ${detectedPm === 'yarn' ? pc.dim('(detected)') : ''}`, value: 'yarn' },
          { title: `bun ${detectedPm === 'bun' ? pc.dim('(detected)') : ''}`, value: 'bun' },
        ],
        initial: detectedPm === 'pnpm' ? 0 : detectedPm === 'npm' ? 1 : detectedPm === 'yarn' ? 2 : 3,
      },
      {
        type: 'confirm',
        name: 'initGit',
        message: 'Initialize a git repository?',
        initial: true,
      },
    ],
    {
      onCancel: () => {
        console.log(pc.red('\nOperation cancelled'))
        process.exit(0)
      },
    },
  )

  // Check if package manager is installed
  if (!isPackageManagerInstalled(response.packageManager)) {
    console.log(pc.yellow(`\n⚠ ${response.packageManager} is not installed. Falling back to npm.`))
    response.packageManager = 'npm'
  }

  const featureSet = new Set(response.features || [])

  return {
    projectName: response.projectName,
    features: {
      supabase: featureSet.has('supabase'),
      i18n: featureSet.has('i18n'),
      storybook: featureSet.has('storybook'),
      monitoring: featureSet.has('monitoring'),
    },
    packageManager: response.packageManager,
    initGit: response.initGit,
  }
}
