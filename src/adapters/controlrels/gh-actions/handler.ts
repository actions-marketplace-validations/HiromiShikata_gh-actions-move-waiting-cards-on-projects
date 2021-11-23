import * as core from '@actions/core'
import * as github from '@actions/github'
import {MoveCardsByDateTimeUsecase} from '../../../usecases/move-cards-by-date-time-usecase'
import {OctokitGithubRepository} from '../../gateways/repositoeirs/octokit-github-repository'
import {SystemDatetimeRepository} from '../../gateways/repositoeirs/system-datetime-repository'

export class Handler {
  run = async (): Promise<void> => {
    const githubRepository = new OctokitGithubRepository(
      github.context.repo.owner,
      github.context.repo.repo,
      this.getInputString('github_token', undefined, core),
      this.getInputNumber('how_many_columns_to_get', 5, core),
      this.getInputNumber('how_many_cards_to_get', 15, core),
      this.getInputNumber('how_many_labels_to_get', 3, core)
    )
    const usecase = new MoveCardsByDateTimeUsecase(
      new SystemDatetimeRepository(),
      githubRepository,
      {
        show: core.info
      }
    )
    await usecase.execute(
      this.getInputString('project_name', undefined, core),
      this.getInputString('waiting_column_name', undefined, core),
      this.getInputString('to_column_name', undefined, core),
      this.getInputString('prefix_for_datetime', undefined, core),
      this.getInputArray('labels_to_ignore', '[]', core),
      this.getInputNumber('number_of_days_to_ignore_label', undefined, core),
      this.getInputBoolean(
        'dont_move_issues_that_has_no_information_why_waiting',
        false,
        core
      )
    )
  }
  getInputString = (
    paramName: string,
    defaultValue: string | undefined,
    params: {getInput(name: string): string}
  ): string => {
    const strValue = params.getInput(paramName)
    if (!strValue) {
      if (!defaultValue) {
        throw new Error(`${paramName} is required.`)
      }
      return defaultValue
    }
    return strValue
  }
  getInputArray = (
    paramName: string,
    defaultValue: string | undefined,
    params: {getInput(name: string): string}
  ): [] => {
    const strValue = this.getInputString(paramName, defaultValue, params)
    return JSON.parse(strValue)
  }

  getInputNumber = (
    paramName: string,
    defaultValue: number | undefined,
    params: {getInput(name: string): string}
  ): number => {
    const strValue = params.getInput(paramName)
    if (!strValue) {
      if (!defaultValue) {
        throw new Error(`${paramName} is required.`)
      }
      return defaultValue
    }
    if (isNaN(parseInt(strValue))) {
      throw new Error(`${paramName} should be number. input: ${strValue}`)
    }
    return parseInt(strValue)
  }
  getInputBoolean = (
    paramName: string,
    defaultValue: boolean | undefined,
    params: {getInput(name: string): string}
  ): boolean => {
    const strValue = params.getInput(paramName)
    if (!strValue) {
      if (defaultValue === undefined) {
        throw new Error(`${paramName} is required.`)
      }
      return defaultValue
    }
    const boolStrValue = strValue.toLowerCase()
    if (boolStrValue !== 'true' && boolStrValue !== 'false') {
      throw new Error(`${paramName} should be true/false. input: ${strValue}`)
    }
    return boolStrValue === 'true'
  }
}
