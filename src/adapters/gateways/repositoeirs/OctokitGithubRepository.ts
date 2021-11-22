import {graphql, GraphQlQueryResponseData} from '@octokit/graphql'
import {Octokit} from 'octokit'
import {GithubRepository} from '../../../usecases/MoveCardsByDateTimeUsecase'
import {Card} from '../../../domains/Card'

export class OctokitGithubRepository implements GithubRepository {
  private readonly graphqlWithAuth: typeof graphql
  private readonly url: string
  private readonly octokit: Octokit
  private projectColumns: Map<String, Map<string, string>>

  constructor(
    private readonly ownerName: string,
    private readonly repositoryName: string,
    private readonly githubToken: string
  ) {
    this.url = `https://github.com/${ownerName}/${repositoryName}`
    this.graphqlWithAuth = graphql.defaults({
      headers: {
        authorization: `token ${githubToken}`,
        accept: 'application/vnd.github.inertia-preview+json'
      }
    })
    this.octokit = new Octokit({auth: this.githubToken})
    this.projectColumns = new Map<String, Map<string, string>>()
  }

  getCards = async (
    projectName: string,
    columnName: string
  ): Promise<Card[]> => {
    type PJ = {
      name: string
      columns: {
        nodes: Column[]
      }
    }
    type Column = {
      name: string
      databaseId: string
      cards: {
        nodes: [
          {
            databaseId: string
            createdAt: string
            content?: {
              title: string
              repository: {
                name: string
              }
              number: string
              labels: {
                nodes: [{name: string}]
              }
              timelineItems: {
                nodes: [{createdAt: string}]
              }
            }
          }
        ]
      }
    }

    const query = this.buildQueryForSearchCards(this.url, projectName)

    const res: GraphQlQueryResponseData = await this.graphqlWithAuth(query)
    const pjs: PJ[] = [].concat(
      res.resource.projects.nodes,
      res.resource.owner.projects.nodes
    )
    this.addPjColumns(pjs)
    const cards = pjs
      .filter((pj: PJ) => pj.name === projectName)
      .map((pj: PJ) => pj.columns.nodes)
      .reduce((acc, cur) => acc.concat(cur), [])
      .filter((column: Column) => column.name === columnName)
      .map((column: Column) =>
        column.cards.nodes.map(
          card =>
            new Card(
              card.databaseId,
              card.content && card.content.repository
                ? card.content.repository.name
                : '',
              card.content ? card.content.number : '',
              card.content ? card.content.title : '',
              card.content ? card.content.labels.nodes.map(c => c.name) : [],
              card.content &&
              card.content.timelineItems.nodes.length > 0 &&
              card.content.timelineItems.nodes[0].createdAt
                ? new Date(card.content.timelineItems.nodes[0].createdAt)
                : new Date(card.createdAt)
            )
        )
      )
      .reduce((acc, cur) => acc.concat(cur), [])
    return cards
  }

  moveCard = async (
    card: Card,
    projectName: string,
    toColumnName: string
  ): Promise<void> => {
    const toColumnId = await this.findColumnId(projectName, toColumnName)
    if (!toColumnId)
      throw new Error(`column ${toColumnName} on ${projectName} is not found.`)
    const res = await this.octokit.request(
      `POST /projects/columns/cards/${card.cardId}/moves`,
      {
        card_id: card.cardId,
        column_id: toColumnId,
        position: 'top',
        mediaType: {
          previews: ['inertia']
        }
      }
    )
    if (res.status === 201 || res.status === 304) return
    throw new Error(`failed to move ${card.cardId}: ${card.title}. ${res.data}`)
  }

  commentToTheCard = async (card: Card, comment: string): Promise<void> => {
    const res = await this.octokit.request(
      `POST /repos/${this.ownerName}/${card.repositoryName}/issues/${card.issueNumber}/comments`,
      {
        owner: this.ownerName,
        repo: card.repositoryName,
        issue_number: card.issueNumber,
        body: comment
      }
    )
    if (res.status === 201) return
    throw new Error(`failed to comment issue:${card.issueNumber}. ${res.data}`)
  }
  private findColumnId = async (
    projectName: string,
    columnName: string
  ): Promise<string | undefined> => {
    const findColumnIdFromMap = (): string | undefined => {
      const columns = this.projectColumns.get(projectName)
      if (columns) {
        return columns.get(columnName)
      }
    }
    const columnId = findColumnIdFromMap()
    if (columnId) return columnId

    const query = this.buildQueryForGetColumns(this.url, projectName)
    const res: GraphQlQueryResponseData = await this.graphqlWithAuth(query)
    const pjs: Project[] = [].concat(
      res.resource.projects.nodes,
      res.resource.owner.projects.nodes
    )
    this.addPjColumns(pjs)
    return findColumnIdFromMap()
  }
  private addPjColumns = (pjs: Project[]): void => {
    for (const pj of pjs) {
      const columnMap = pj.columns.nodes.reduce(
        (map: Map<string, string>, column: Column) =>
          map.set(column.name, column.databaseId),
        new Map<string, string>()
      )
      this.projectColumns.set(pj.name, columnMap)
    }
  }

  private buildQueryForSearchCards = (
    url: string,
    projectName: string
  ): string => `
  {
  resource(url: "${url}") {
    ... on Repository {
      name
      projects(search: "${projectName}", first: 10, states: [OPEN]) {
        nodes {
          name
          columns(first: 20) {
            nodes {
              url
              databaseId
              name
              cards(first: 100, archivedStates: [NOT_ARCHIVED]) {
                nodes {
                  url
                  databaseId
                  createdAt
                  content {
                    ... on Issue {
                      title
                      number
                      labels(first: 10) {
                        nodes {
                          name
                        }
                      }
                      timelineItems(last: 1) {
                        nodes {
                          ... on IssueComment {
                            createdAt
                          }
                        }
                      }
                    }
                    ... on PullRequest {
                      title
                      number
                      labels(first: 10) {
                        nodes {
                          name
                        }
                      }
                      timelineItems(last: 1) {
                        nodes {
                          ... on IssueComment {
                            createdAt
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      owner {
        ... on ProjectOwner {
          projects(search: "${projectName}", first: 10, states: [OPEN]) {
            nodes {
              name
              columns(first: 20) {
                nodes {
                  databaseId
                  url
                  name
                  cards(first: 100, archivedStates: [NOT_ARCHIVED]) {
                    nodes {
                      url
                      databaseId
                      createdAt
                      content {
                        ... on Issue {
                          title
                          number
                          labels(first: 10) {
                            nodes {
                              name
                            }
                          }
                          timelineItems(last: 1) {
                            nodes {
                              ... on IssueComment {
                                createdAt
                              }
                            }
                          }
                        }
                        ... on PullRequest {
                          title
                          number
                          labels(first: 10) {
                            nodes {
                              name
                            }
                          }
                          timelineItems(last: 1) {
                            nodes {
                              ... on IssueComment {
                                createdAt
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
    `
  private buildQueryForGetColumns = (
    url: string,
    projectName: string
  ): string => `
  {
  resource(url: "${url}") {
    ... on Repository {
      name
      projects(search: "${projectName}", first: 10, states: [OPEN]) {
        nodes {
          name
          columns(first: 20) {
            nodes {
              url
              databaseId
              name
            }
          }
        }
      }
      owner {
        ... on ProjectOwner {
          projects(search: "${projectName}", first: 10, states: [OPEN]) {
            nodes {
              name
              columns(first: 10) {
                nodes {
                  name
                  databaseId
                }
              }
            }
          }
        }
      }
    }
  }
}
`
}

type Project = {
  name: string
  columns: {
    nodes: Column[]
  }
}
type Column = {
  name: string
  databaseId: string
}
