import {MoveCardsByDateTimeUsecase} from '../src/usecases/move-cards-by-date-time-usecase'
import {SystemDatetimeRepository} from '../src/adapters/gateways/repositoeirs/system-datetime-repository'
import {OctokitGithubRepository} from '../src/adapters/gateways/repositoeirs/octokit-github-repository'

describe('ConsumerExpectation Test', () => {
  test('execute', async () => {
    const githubRepo = new OctokitGithubRepository(
      'HiromiShikata',
      'gh-actions-move-waiting-cards-on-projects',
      process.env.GH_TOKEN || '',
      5,
      15,
      3
    )
    const usecase = new MoveCardsByDateTimeUsecase(
      new SystemDatetimeRepository(),
      githubRepo,
      {
        show: (log: string) => {
          console.log(log)
        }
      }
    )
    await usecase.execute(
      'test-project',
      'In' + ' waiting',
      'To do',
      'waiting till DATETIME/',
      [],
      20,
      false
    )
    const todoCards = await githubRepo.getCards('test-project', 'To do')
    await githubRepo.moveCard(todoCards[0], 'test-project', 'In waiting')
  })
})
