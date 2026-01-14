import pc from 'picocolors'

export const logger = {
  info: (msg: string) => console.log(pc.cyan(msg)),
  success: (msg: string) => console.log(pc.green(`✔ ${msg}`)),
  warn: (msg: string) => console.log(pc.yellow(`⚠ ${msg}`)),
  error: (msg: string) => console.log(pc.red(`✖ ${msg}`)),
  log: (msg: string) => console.log(msg),
  blank: () => console.log(),
}

export function banner() {
  console.log()
  console.log(pc.cyan('╭────────────────────────────────────────╮'))
  console.log(pc.cyan('│') + pc.bold('  🏠 Create Lovstudio App               ') + pc.cyan('│'))
  console.log(pc.cyan('│') + pc.dim('     Next.js 15 + TypeScript            ') + pc.cyan('│'))
  console.log(pc.cyan('╰────────────────────────────────────────╯'))
  console.log()
}

export function printNextSteps(projectName: string, packageManager: string) {
  const pmRun = packageManager === 'npm' ? 'npm run' : packageManager

  console.log()
  console.log(pc.green('🎉 Success!') + ` Created ${pc.bold(projectName)}`)
  console.log()
  console.log(pc.dim('Next steps:'))
  console.log()
  console.log(`  ${pc.cyan('cd')} ${projectName}`)
  console.log(`  ${pc.cyan('cp')} .env.example .env.local`)
  console.log(`  ${pc.cyan(pmRun)} dev`)
  console.log()
  console.log(pc.dim('📚 Documentation: https://github.com/markshawn2020/lovweb'))
  console.log()
}
