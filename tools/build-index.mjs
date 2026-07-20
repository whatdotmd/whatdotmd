name: Build entries index

on:
  push:
    branches: [main]
    paths: ["entries/**"]
  workflow_dispatch: {}

permissions:
  contents: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      # Full history, not the default shallow clone — build-index.mjs shells
      # out to `git log` per entry file to stamp submitted_at, which needs
      # each file's actual commit history, not just the tip commit.
      - uses: actions/checkout@v7
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v7
        with:
          node-version: 24

      - run: node tools/build-index.mjs

      # Only commits if index.json actually changed. Because this workflow's
      # path filter is entries/** and this commit only touches index.json,
      # the bot's own push doesn't re-trigger the workflow — no loop guard
      # needed beyond the path filter already being narrow.
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore: rebuild index.json"
          file_pattern: index.json
