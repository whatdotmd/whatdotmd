#!/usr/bin/env node
// Posts (or updates) the lint-report PR comment. Runs ONLY in
// .github/workflows/pr-comment.yml — the trusted, write-permission half of
// the two-workflow split described in project/gh_backend/PR_CHECK.md. This
// script never touches anything checked out from the PR/fork; it only
// reads the two artifacts pr-check.yml uploaded (lint-report.json,
// pr-number.txt) and calls the GitHub REST API with the default
// GITHUB_TOKEN. Dependency-free — Node 20's built-in fetch is enough for
// two REST calls, no @octokit needed.
//
// Env vars (set by the workflow): GITHUB_TOKEN, GITHUB_REPOSITORY
// (owner/repo, GitHub sets this automatically).

import { readFileSync } from 'node:fs'
import { formatReport, MARKER } from './markdown.js'

const token = process.env.GITHUB_TOKEN
const repo = process.env.GITHUB_REPOSITORY
const prNumber = readFileSync('pr-number.txt', 'utf8').trim()
const report = JSON.parse(readFileSync('lint-report.json', 'utf8'))

const api = `https://api.github.com/repos/${repo}/issues/${prNumber}/comments`
const headers = {
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
}

async function main() {
  const body = formatReport(report)

  const existing = await fetch(api, { headers }).then((r) => r.json())
  const prior = existing.find?.((c) => c.body?.includes(MARKER))

  const res = await fetch(prior ? prior.url : api, {
    method: prior ? 'PATCH' : 'POST',
    headers,
    body: JSON.stringify({ body }),
  })

  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${await res.text()}`)
  }
}

main()
