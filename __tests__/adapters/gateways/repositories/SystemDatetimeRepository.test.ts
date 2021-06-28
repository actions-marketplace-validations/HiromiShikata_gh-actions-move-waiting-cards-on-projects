import {SystemDatetimeRepository} from '../../../../src/adapters/gateways/repositoeirs/SystemDatetimeRepository'

describe('SystemDatetimeRepository', () => {
  const repo = new SystemDatetimeRepository()

  test('now', () => {
    const diff = Math.abs(repo.now().getTime() - new Date().getTime())
    expect(diff).toBeLessThan(100)
  })
  test('dateBeforeDays', () => {
    const diff = Math.abs(
      repo.dateBeforeDays(3).getTime() - new Date().getTime()
    )
    expect(diff).toBeLessThan(1000 * 60 * 60 * 24 * 3 + 100)
    expect(diff).toBeGreaterThan(1000 * 60 * 60 * 24 * 3 - 100)
  })
})
