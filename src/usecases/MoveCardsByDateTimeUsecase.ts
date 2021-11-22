import {Card} from '../domains/Card'

export class MoveCardsByDateTimeUsecase {
  constructor(
    private readonly datetimeRepository: DatetimeRepository,
    private readonly githubRepository: GithubRepository
  ) {}

  execute = async (
    projectName: string,
    waitingColumnName: string,
    toColumnName: string,
    prefixForDatetime: string,
    labelsToIgnore: string[],
    numberOfDaysToIgnoreWithLabel: number
  ): Promise<void> => {
    const regex = this.createRegex(prefixForDatetime)
    const now = this.datetimeRepository.now()
    const dateToIgnoreWithLabel = this.datetimeRepository.dateBeforeDays(
      numberOfDaysToIgnoreWithLabel
    )
    const cards = (
      await this.githubRepository.getCards(projectName, waitingColumnName)
    ).map((card): CardWithDate => new CardWithDate(card, regex, now))

    for (const card of cards) {
      if (card.hasOneLabelAtLeast(labelsToIgnore)) {
        if (card.lastUpdated.getTime() > dateToIgnoreWithLabel.getTime()) {
          continue
        }
        await this.githubRepository.moveCard(card, projectName, toColumnName)
        await this.githubRepository.commentToTheCard(
          card,
          `Please check this issue. ${numberOfDaysToIgnoreWithLabel} days have passed since the last update.`
        )
      } else if (card.date) {
        if (card.date.getTime() > now.getTime()) {
          continue
        }
        await this.githubRepository.moveCard(card, projectName, toColumnName)
      } else if (card.datePrefixText) {
        await this.githubRepository.moveCard(card, projectName, toColumnName)
        await this.githubRepository.commentToTheCard(
          card,
          `Please use MMDD or MMDD HH:mm format.`
        )
      } else {
        await this.githubRepository.moveCard(card, projectName, toColumnName)
        await this.githubRepository.commentToTheCard(
          card,
          `add label ${labelsToIgnore.join(
            ','
          )} or add prefix ${prefixForDatetime} to move this '${waitingColumnName}'.`
        )
      }
    }
  }
  private createRegex = (regexForDateConfig: string): RegExp => {
    const regexText = regexForDateConfig.replace('DATETIME', '([0-9\\/\\- :]+)')
    return new RegExp(`^${regexText}`, 'g')
  }
}

export class CardWithDate extends Card {
  date?: Date
  datePrefixText?: string

  constructor(card: Card, regex: RegExp, now: Date) {
    super(
      card.cardId,
      card.repositoryName,
      card.issueNumber,
      card.title,
      card.labels,
      card.lastUpdated
    )
    const res = regex.exec(card.title)
    if (!res) return
    this.datePrefixText = res[0]
    this.date = this.convertToDate(res[1], now)
  }

  private convertToDate = (text: string, now: Date): Date | undefined => {
    const dateTimeArray = text.split(' ')
    let dateText = dateTimeArray[0]
    const timeText = dateTimeArray[1] || '00:00'
    if (dateText.match(/^\d{8}$/g)) {
      dateText = `${dateText.substr(0, 4)}/${dateText.substr(
        4,
        2
      )}/${dateText.substr(6, 2)}`
    } else if (dateText.match(/^\d{4}$/g)) {
      dateText = `${now.getFullYear()}/${dateText.substr(
        0,
        2
      )}/${dateText.substr(2, 2)}`
    } else if (dateText.length < 8) {
      dateText = `${now.getFullYear()}-${dateText}`
    }
    const datetimeText = `${dateText} ${timeText}`
    if (isNaN(Date.parse(datetimeText))) return
    const datetime = new Date(datetimeText)

    if (
      Math.abs(now.getTime() - datetime.getTime()) >
      (1000 * 60 * 60 * 24 * 365) / 2
    ) {
      datetime.setFullYear(datetime.getFullYear() - 1)
    }
    return datetime
  }
}

export interface GithubRepository {
  getCards(projectName: string, columnName: string): Promise<Card[]>

  moveCard(card: Card, projectName: string, columnName: string): Promise<void>

  commentToTheCard(card: Card, comment: string): Promise<void>
}

export interface DatetimeRepository {
  now(): Date

  dateBeforeDays(days: number): Date
}
