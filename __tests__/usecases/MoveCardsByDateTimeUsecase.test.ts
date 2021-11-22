import {
  CardWithDate,
  DatetimeRepository,
  GithubRepository,
  MoveCardsByDateTimeUsecase
} from '../../src/usecases/MoveCardsByDateTimeUsecase'
import {Card} from '../../src/domains/Card'
describe('CardWithDate', () => {
  describe('convertToDate', () => {
    test.each`
      text                  | expectDatetime
      ${'0101'}             | ${'2006-01-01T00:00:00Z'}
      ${'01-01'}            | ${'2006-01-01T00:00:00Z'}
      ${'01/01'}            | ${'2006-01-01T00:00:00Z'}
      ${'1/1'}              | ${'2006-01-01T00:00:00Z'}
      ${'1-1'}              | ${'2006-01-01T00:00:00Z'}
      ${'0102'}             | ${'2006-01-02T00:00:00Z'}
      ${'1231'}             | ${'2005-12-31T00:00:00Z'}
      ${'0101 01:02'}       | ${'2006-01-01T01:02:00Z'}
      ${'1231 01:02'}       | ${'2005-12-31T01:02:00Z'}
      ${'2006-01-02'}       | ${'2006-01-02T00:00:00Z'}
      ${'2006/01/02'}       | ${'2006-01-02T00:00:00Z'}
      ${'2006-01/02'}       | ${'2006-01-02T00:00:00Z'}
      ${'2006-1-2'}         | ${'2006-01-02T00:00:00Z'}
      ${'2006/1/2'}         | ${'2006-01-02T00:00:00Z'}
      ${'2006-1/2'}         | ${'2006-01-02T00:00:00Z'}
      ${'2006-01-02 15:04'} | ${'2006-01-02T15:04:00Z'}
      ${'2006/01/02 15:04'} | ${'2006-01-02T15:04:00Z'}
      ${'2006/01/02 15:4'}  | ${'2006-01-02T15:04:00Z'}
      ${'20060102'}         | ${'2006-01-02T00:00:00Z'}
      ${'01/02'}            | ${'2006-01-02T00:00:00Z'}
      ${'01-02'}            | ${'2006-01-02T00:00:00Z'}
      ${'0102'}             | ${'2006-01-02T00:00:00Z'}
    `(
      'returns $expectDatetime when text is $text',
      ({text, expectDatetime}) => {
        const card = new CardWithDate(
          new Card(
            'id',
            'test-repository',
            '1',
            `wait till ${text}/title`,
            [],
            new Date(`2000-01-01T00:00:00Z`)
          ),
          new RegExp('^wait till ([0-9\\/\\- :]+)/', 'g'),
          new Date(`2006-01-02T15:04:05Z`)
        )
        expect(card.date).toEqual(new Date(expectDatetime))
      }
    )
  })
})
describe('MoveCardsByDateTimeUsecase', () => {
  describe('execute', () => {
    const datetimeRepo: DatetimeRepository = {
      now: jest.fn((): Date => new Date(`2000-01-01T00:00:00Z`)),
      dateBeforeDays: jest.fn(
        (days: number): Date => new Date(`1999-12-29T00:00:00Z`)
      )
    }
    const githubRepo = {
      getCards: jest.fn(
        (projectName: string, columnName: string): Promise<Card[]> =>
          Promise.resolve([
            new Card(
              `id1`,
              'test-repository',
              '1',
              `waiting till 01/01/should move`,
              [],
              new Date(`1999-12-01T00:00:00Z`)
            )
          ])
      ),
      moveCard: jest.fn(
        (card: Card, projectName: string, columnName: string): Promise<void> =>
          Promise.resolve()
      ),
      commentToTheCard: jest.fn(
        (card: Card, comment: string): Promise<void> => Promise.resolve()
      )
    }
    beforeEach(() => {
      jest.clearAllMocks()
    })
    test.each`
      title                                                                    | label                               | datetime                  | expectMove | expectComment
      ${`waiting till 0101/should move`}                                       | ${null}                             | ${`1999-12-01T00:00:00Z`} | ${true}    | ${null}
      ${`waiting till 01-01/should move`}                                      | ${null}                             | ${`1999-12-01T00:00:00Z`} | ${true}    | ${null}
      ${`waiting till 01/01/should move`}                                      | ${null}                             | ${`1999-12-01T00:00:00Z`} | ${true}    | ${null}
      ${`waiting till 0101/should move`}                                       | ${null}                             | ${`1999-12-01T00:00:00Z`} | ${true}    | ${null}
      ${`waiting till 1231 01:01/should move`}                                 | ${null}                             | ${`1999-12-01T00:00:00Z`} | ${true}    | ${null}
      ${`waiting till 12-31 01:01/should move`}                                | ${null}                             | ${`1999-12-01T00:00:00Z`} | ${true}    | ${null}
      ${`waiting till 12/31 01:01/should move`}                                | ${null}                             | ${`1999-12-01T00:00:00Z`} | ${true}    | ${null}
      ${`waiting till 0101 01:01/should not move`}                             | ${null}                             | ${`1999-12-01T00:00:00Z`} | ${false}   | ${null}
      ${`waiting till 0102/should not move`}                                   | ${null}                             | ${`1999-12-01T00:00:00Z`} | ${false}   | ${null}
      ${`waiting till 2000101/should move with comment for invalid format`}    | ${null}                             | ${`1999-12-01T00:00:00Z`} | ${true}    | ${'Please use MMDD or MMDD HH:mm format.'}
      ${`with label/updated at 1231/should not move`}                          | ${'will close automatically by PR'} | ${`1999-12-31T00:00:00Z`} | ${false}   | ${null}
      ${`with label/updated at 1229 00:01/should not move`}                    | ${'will close automatically by PR'} | ${`1999-12-29T00:01:00Z`} | ${false}   | ${null}
      ${`with label/updated at 1229/should move with comment because too old`} | ${'will close automatically by PR'} | ${`1999-12-29T00:00:00Z`} | ${true}    | ${'Please check this issue. 3 days have passed since the last update.'}
      ${`with label/updated at 1226/should move with comment because too old`} | ${'will close automatically by PR'} | ${`1999-12-26T00:00:00Z`} | ${true}    | ${'Please check this issue. 3 days have passed since the last update.'}
      ${`with other label/should move with comment`}                           | ${'some label'}                     | ${`1999-12-31T00:00:00Z`} | ${true}    | ${`add label will close automatically by PR,convenience store or add prefix waiting till DATETIME/ to move this 'In waiting'.`}
    `(
      '$title with $label created at $datetime, expectMove: $expectMove, expectComment: $expectComment',
      async ({title, label, datetime, expectMove, expectComment}) => {
        githubRepo.getCards = jest.fn(
          (projectName: string, columnName: string): Promise<Card[]> =>
            Promise.resolve([
              new Card(
                `id1`,
                'test-repository',
                '1',
                title,
                label ? [label] : [],
                new Date(datetime)
              )
            ])
        )

        const usecase = new MoveCardsByDateTimeUsecase(datetimeRepo, githubRepo)
        await usecase.execute(
          `projectName`,
          `In waiting`,
          `To do`,
          `waiting till DATETIME/`,
          [`will close automatically by PR`, `convenience store`],
          3
        )
        if (expectMove) {
          expect(githubRepo.moveCard.mock.calls.length).toEqual(1)
          expect(githubRepo.moveCard.mock.calls[0][0].title).toEqual(title)
          expect(githubRepo.moveCard.mock.calls[0][1]).toEqual(`projectName`)
          expect(githubRepo.moveCard.mock.calls[0][2]).toEqual(`To do`)
        } else {
          expect(githubRepo.moveCard.mock.calls.length).toEqual(0)
        }
        if (expectComment) {
          expect(githubRepo.commentToTheCard.mock.calls.length).toEqual(1)
          expect(githubRepo.commentToTheCard.mock.calls[0][0].title).toEqual(
            title
          )
          expect(githubRepo.commentToTheCard.mock.calls[0][1]).toEqual(
            expectComment
          )
        } else {
          expect(githubRepo.commentToTheCard.mock.calls.length).toEqual(0)
        }
      }
    )
  })
})
