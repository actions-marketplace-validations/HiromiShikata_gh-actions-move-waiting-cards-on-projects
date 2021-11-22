import {OctokitGithubRepository} from '../../../../src/adapters/gateways/repositoeirs/octokit-github-repository'

describe('OctokitGithubRepository', () => {
  const repo = new OctokitGithubRepository(
    'HiromiShikata',
    'gh-actions-move-waiting-cards-on-projects',
    String(process.env.GH_TOKEN),
    5,
    15,
    3
  )
  const moveAllCardToInWaiting = async () => {
    const all = await repo.getCards('test-project', 'To do')
    for (const card of all) {
      await repo.moveCard(card, 'test-project', 'In waiting')
    }
  }
  beforeAll(async () => {
    await moveAllCardToInWaiting()
  })
  afterAll(async () => {
    await moveAllCardToInWaiting()
  })
  test('getCards and move and comment', async () => {
    const cards = await repo.getCards('test-project', 'In waiting')
    expect(cards.length).toEqual(1)
    await repo.moveCard(cards[0], 'test-project', 'To do')
    await repo.commentToTheCard(cards[0], 'test comment')
    const cardsAfterMove = await repo.getCards('test-project', 'In waiting')
    expect(cardsAfterMove.length).toEqual(0)
    const todoCards = await repo.getCards('test-project', 'To do')
    expect(todoCards[0].lastUpdated.getTime()).toBeGreaterThan(
      cards[0].lastUpdated.getTime()
    )
    await repo.moveCard(todoCards[0], 'test-project', 'In waiting')
  })
})
