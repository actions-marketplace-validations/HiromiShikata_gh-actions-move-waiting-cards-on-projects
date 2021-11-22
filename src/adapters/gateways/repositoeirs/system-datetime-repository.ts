import {DatetimeRepository} from '../../../usecases/move-cards-by-date-time-usecase'

export class SystemDatetimeRepository implements DatetimeRepository {
  dateBeforeDays = (days: number): Date =>
    new Date(this.now().getTime() - 1000 * 60 * 60 * 24 * days)

  now = (): Date => new Date()
}
