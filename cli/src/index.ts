import { cac } from 'cac'
import { create } from './create'

const cli = cac('create-lovstudio-app')

cli
  .command('[project-name]', 'Create a new Lovstudio Next.js project')
  .option('--skip-install', 'Skip dependency installation')
  .option('--use-npm', 'Use npm as package manager')
  .option('--use-pnpm', 'Use pnpm as package manager')
  .option('--use-yarn', 'Use yarn as package manager')
  .option('--use-bun', 'Use bun as package manager')
  .action(create)

cli.help()
cli.version('1.0.1')

cli.parse()
