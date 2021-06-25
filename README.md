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
          regex_for_date: waiting till {DATETIME}
          regex_for_dependency: waiting for {ISSUE}
          labels_to_ignore: '["will close automatically by PR", "will do at convenience store"]'
          move_invalid_cards_in_waiting_column: True
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Parameters
#### DATETIME
- yyyy/MM/dd
- MMDD
- M/d
- M/d hh:mm
#### ISSUE
- \#issuenumber
- repo#issuenumber
- owner/repo#issuenumber

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

 PASS  ./index.test.js
  ✓ throws invalid number (3ms)
  ✓ wait 500 ms (504ms)
  ✓ test runs (95ms)

...
```

