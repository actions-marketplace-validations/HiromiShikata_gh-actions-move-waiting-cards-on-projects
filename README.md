<p align="center">
  <a href="https://github.com/HiromiShikata/gh-actions-move-waiting-cards-on-projects/actions"><img alt="typescript-action status" src="https://github.com/HiromiShikata/gh-actions-move-waiting-cards-on-projects/workflows/build-test/badge.svg"></a>
</p>

# Github Actions move waiting cards on project

## Use Case
- Move cards which has `waiting till mm/dd` as prefix on title in 'In waiting' column if the date in title is today.
- Move cards which has `depends on #nnn` as prefix on title in 'In waiting' column if the dependant issue closed.
- Move cards which don't have any prefix or specific labels in 'In waiting' column to keep 'In waiting' column keep clean.

## Usage
```yaml
name: Check and move cards in 'In waiting' column
on:
  schedule:
    - cron: '0 0 * * *'

jobs:
  check-inwaiting-column:
    runs-on: ubuntu-latest
    steps:
      - uses: HiromiShikata/gh-actions-move-waiting-cards-on-projects@v1.0.0
        with:
          project_name: Current
          waiting_column_name: In waiting
          to_column_name: Inbox
          prefix_for_datetime: waiting till DATETIME/
          labels_to_ignore: '["will close automatically by PR", "will do at convenience store"]'
          number_of_days_to_ignore_label: 14
          github_token: ${{ secrets.GITHUB_TOKEN }}
          how_many_columns_to_get: 5
          how_many_cards_to_get: 15
          how_many_labels_to_get: 3
```

### Parameters
#### DATETIME
- YYYY/MM/DD
- MM/DD
- MM-DD
- YYYYMMDD
- MMDD
- M/d
- M/d hh:mm
#### ISSUE(wip)
- \#issuenumber
- repo#issuenumber
- owner/repo#issuenumber

#### how_many_*_to_get (optional)
- Due to the limitation of graphql api on github, the lowest possible value is preferable.
- However, it can be increased according to the condition.
- [see more](https://github.com/HiromiShikata/gh-actions-move-waiting-cards-on-projects/blob/main/src/adapters/gateways/repositoeirs/OctokitGithubRepository.ts#L182)

## Development

> First, you'll need to have a reasonably modern version of `node` handy. This won't work with versions older than 9, for instance.

Install the dependencies  
```bash
$ npm install
```

Build the typescript and package it for distribution
```bash
$ npm run build && npm run package
```

Run the tests :heavy_check_mark:  
```bash
$ npm test

 PASS  __tests__/ConsumerExpectation.test.ts
  ConsumerExpectation Test
    ✓ execute (2616 ms)
...
```

