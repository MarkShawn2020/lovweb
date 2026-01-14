import { downloadTemplate } from 'giget'
import type { ProjectConfig } from './prompts'

const TEMPLATE_REPO = 'github:markshawn2020/lovweb'

export async function download(dest: string, _config: ProjectConfig): Promise<void> {
  await downloadTemplate(TEMPLATE_REPO, {
    dir: dest,
    force: true,
    // Can specify ref: 'v1.0.0' to lock version
  })
}
