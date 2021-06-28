import {DatetimeRepository} from '../../../usecases/MoveCardsByDateTimeUsecase'

export class SystemDatetimeRepository implements DatetimeRepository {
  dateBeforeDays = (days: number): Date =>
    new Date(this.now().getTime() + 1000 * 60 * 60 * 24 * days)

  now = (): Date => new Date()
}
