import * as core from '@actions/core'
import * as github from '@actions/github'
import {MoveCardsByDateTimeUsecase} from '../../../usecases/MoveCardsByDateTimeUsecase'
import {OctokitGithubRepository} from '../../gateways/repositoeirs/OctokitGithubRepository'
import {SystemDatetimeRepository} from '../../gateways/repositoeirs/SystemDatetimeRepository'

export class Handler {
  run = async (): Promise<void> => {
    try {
      const projectName = core.getInput('project_name')
      const waitingColumnName = core.getInput('waiting_column_name')
      const toColumnName = core.getInput('to_column_name')
      const prefixForDatetime = core.getInput('prefix_for_datetime')
      const labelsToIgnoreText = core.getInput('labels_to_ignore')
      const numberOfDaysToIgnoreLabel = core.getInput(
        'number_of_days_to_ignore_label'
      )

      const labelsToIgnore = JSON.parse(labelsToIgnoreText)
      if (
        numberOfDaysToIgnoreLabel &&
        isNaN(parseInt(numberOfDaysToIgnoreLabel))
      )
        throw new Error(
          `number_of_days_to_ignore_label should be number. input: ${numberOfDaysToIgnoreLabel}`
        )

      const githubToken = core.getInput('github_token')
      let githubRepository: OctokitGithubRepository
      githubRepository = new OctokitGithubRepository(
        github.context.repo.owner,
        github.context.repo.repo,
        githubToken,
        Number.parseInt(core.getInput('howManyColumnsToGet')) || 5,
        Number.parseInt(core.getInput('howManyCardsToGet')) || 15,
        Number.parseInt(core.getInput('howManyLabelsToGet')) || 3
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
    } catch (error) {
      core.setFailed(error.message)
    }
  }
}
