import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import ora from 'ora'
import pc from 'picocolors'
import { promptProjectConfig } from './prompts'
import { download } from './template'
import { processTemplate } from './postprocess'
import { getInstallCommand } from './utils/package-manager'
import { banner, logger, printNextSteps } from './utils/logger'

interface CreateOptions {
  skipInstall?: boolean
  useNpm?: boolean
  usePnpm?: boolean
  useYarn?: boolean
  useBun?: boolean
}

export async function create(projectName?: string, options?: CreateOptions): Promise<void> {
  banner()

  // Get project configuration
  const config = await promptProjectConfig(projectName)
  if (!config)
    return

  // Override package manager if specified via CLI
  if (options?.useNpm)
    config.packageManager = 'npm'
  if (options?.usePnpm)
    config.packageManager = 'pnpm'
  if (options?.useYarn)
    config.packageManager = 'yarn'
  if (options?.useBun)
    config.packageManager = 'bun'

  const projectPath = path.resolve(process.cwd(), config.projectName)

  // Check if directory already exists
  if (fs.existsSync(projectPath)) {
    const files = fs.readdirSync(projectPath)
    if (files.length > 0) {
      logger.error(`Directory ${pc.bold(config.projectName)} is not empty.`)
      process.exit(1)
    }
  }

  console.log()

  // 1. Download template
  const downloadSpinner = ora('Downloading template...').start()
  try {
    await download(projectPath, config)
    downloadSpinner.succeed('Downloaded template')
  }
  catch (error) {
    downloadSpinner.fail('Failed to download template')
    logger.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }

  // 2. Process template
  const processSpinner = ora('Processing template...').start()
  try {
    await processTemplate(projectPath, config)
    processSpinner.succeed('Processed template')
  }
  catch (error) {
    processSpinner.fail('Failed to process template')
    logger.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }

  // 3. Install dependencies
  if (!options?.skipInstall) {
    const installSpinner = ora(`Installing dependencies with ${config.packageManager}...`).start()
    try {
      const installCmd = getInstallCommand(config.packageManager)
      execSync(installCmd, {
        cwd: projectPath,
        stdio: 'pipe',
      })
      installSpinner.succeed('Installed dependencies')
    }
    catch (error) {
      installSpinner.fail('Failed to install dependencies')
      logger.warn('You can try installing manually later.')
    }
  }

  // 4. Initialize git repository
  if (config.initGit) {
    const gitSpinner = ora('Initializing git repository...').start()
    try {
      execSync('git init', { cwd: projectPath, stdio: 'pipe' })
      execSync('git add -A', { cwd: projectPath, stdio: 'pipe' })
      execSync('git commit -m "Initial commit from create-lovstudio-app"', {
        cwd: projectPath,
        stdio: 'pipe',
      })
      gitSpinner.succeed('Initialized git repository')
    }
    catch {
      gitSpinner.fail('Failed to initialize git repository')
    }
  }

  // 5. Print success message
  printNextSteps(config.projectName, config.packageManager)
}
