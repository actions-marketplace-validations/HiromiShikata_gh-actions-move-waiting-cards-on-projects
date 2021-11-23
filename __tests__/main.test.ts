import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import {OctokitGithubRepository} from '../src/adapters/gateways/repositoeirs/octokit-github-repository'

test('test runs', async () => {
  process.env['INPUT_PROJECT_NAME'] = 'test-project'
  process.env['INPUT_WAITING_COLUMN_NAME'] = 'In waiting'
  process.env['INPUT_TO_COLUMN_NAME'] = 'To do'
  process.env['INPUT_PREFIX_FOR_DATETIME'] = 'waiting till DATETIME/'
  process.env['INPUT_LABELS_TO_IGNORE'] = '["will close automatically by PR"]'
  process.env['INPUT_NUMBER_OF_DAYS_TO_IGNORE_LABEL'] = '16'
  process.env['INPUT_GITHUB_TOKEN'] = process.env['GH_TOKEN']
  process.env['INPUT_DONT_MOVE_ISSUES_THAT_HAS_NO_INFORMATION_WHY_WAITING'] =
    'false'
  process.env['GITHUB_REPOSITORY'] =
    'HiromiShikata/gh-actions-move-waiting-cards-on-projects'
  const np = process.execPath
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  const options: cp.ExecFileSyncOptions = {
    env: process.env
  }
  try {
    cp.execFileSync(np, [ip], options).toString()
  } catch (error) {
    console.log(error.stdout.toString())
  }
  console.log(cp.execFileSync(np, [ip], options).toString())
  const githubRepo = new OctokitGithubRepository(
    'HiromiShikata',
    'gh-actions-move-waiting-cards-on-projects',
    process.env.GH_TOKEN || '',
    5,
    15,
    3
  )
  const todoCards = await githubRepo.getCards('test-project', 'To do')
  await githubRepo.moveCard(todoCards[0], 'test-project', 'In waiting')
})
