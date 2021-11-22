import * as core from '@actions/core'
import * as github from '@actions/github'
import {MoveCardsByDateTimeUsecase} from '../../../usecases/move-cards-by-date-time-usecase'
import {OctokitGithubRepository} from '../../gateways/repositoeirs/octokit-github-repository'
import {SystemDatetimeRepository} from '../../gateways/repositoeirs/system-datetime-repository'

export class Handler {
  run = async (): Promise<void> => {
    const projectName = core.getInput('project_name')
    const waitingColumnName = core.getInput('waiting_column_name')
    const toColumnName = core.getInput('to_column_name')
    const prefixForDatetime = core.getInput('prefix_for_datetime')
    const labelsToIgnoreText = core.getInput('labels_to_ignore')
    const numberOfDaysToIgnoreLabel = core.getInput(
      'number_of_days_to_ignore_label'
    )

    const labelsToIgnore = JSON.parse(labelsToIgnoreText)
    if (numberOfDaysToIgnoreLabel && isNaN(parseInt(numberOfDaysToIgnoreLabel)))
      throw new Error(
        `number_of_days_to_ignore_label should be number. input: ${numberOfDaysToIgnoreLabel}`
      )

    const githubToken = core.getInput('github_token')
    let githubRepository: OctokitGithubRepository
    githubRepository = new OctokitGithubRepository(
      github.context.repo.owner,
      github.context.repo.repo,
      githubToken,
      Number.parseInt(core.getInput('how_many_columns_to_get')) || 5,
      Number.parseInt(core.getInput('how_many_cards_to_get')) || 15,
      Number.parseInt(core.getInput('how_many_labels_to_get')) || 3
    )
    const datetimeRepository = new SystemDatetimeRepository()
    const usecase = new MoveCardsByDateTimeUsecase(
      datetimeRepository,
      githubRepository,
      {
        show: (log: string) => {
          core.info(log)
        }
      }
    )
    await usecase.execute(
      projectName,
      waitingColumnName,
      toColumnName,
      prefixForDatetime,
      labelsToIgnore,
      parseInt(numberOfDaysToIgnoreLabel)
    )
  }
}
