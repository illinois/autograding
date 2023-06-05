import * as artifact from '@actions/artifact'
import * as core from '@actions/core'
import * as github from '@actions/github'
import fs from 'fs'
import path from 'path'
import {Report} from './Test'

const artifactClient = artifact.create()

/**
 * Uploads a JSON file containing information about the test suite run
 * as an artifact to GitHub.
 * 
 * @param json Dict containing artifact data.
 * @param cwd Filepath to write JSON artifact to. 
 */
export async function uploadArtifact (artifactName: string, report: Report, cwd: string): Promise<void> {
  const filepath = path.join(cwd, report.testSuite + '.json')
  fs.writeFileSync(filepath, JSON.stringify(report))
  await artifactClient.uploadArtifact(artifactName, [filepath], cwd, {continueOnError: false})
}

/**
 * Sends check run data to GitHub.
 * 
 * @param text The text to be written in the check run
 */
export async function setCheckRunOutput (text: string): Promise<void> {
  // If we have nothing to output, then bail
  if (text === '') return

  // Our action will need to API access the repository so we require a token
  // This will need to be set in the calling workflow, otherwise we'll exit
  const token = process.env['GITHUB_TOKEN'] || core.getInput('token')
  if (!token || token === '') return

  // Create the octokit client
  const octokit = github.getOctokit(token)
  if (!octokit) return

  // The environment contains a variable for current repository. The repository
  // will be formatted as a name with owner (`nwo`); e.g., jeffrafter/example
  // We'll split this into two separate variables for later use
  const nwo = process.env['GITHUB_REPOSITORY'] || '/'
  const [owner, repo] = nwo.split('/')
  if (!owner) return
  if (!repo) return

  // We need the workflow run id
  const runId = parseInt(process.env['GITHUB_RUN_ID'] || '')
  if (Number.isNaN(runId)) return

  // Fetch the workflow run
  const workflowRunResponse = await octokit.rest.actions.getWorkflowRun({
    owner,
    repo,
    run_id: runId,
  })

  // Find the check suite run
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const checkSuiteUrl = (workflowRunResponse.data as any).check_suite_url
  const checkSuiteId = parseInt(checkSuiteUrl.match(/[0-9]+$/)[0], 10)
  const checkRunsResponse = await octokit.rest.checks.listForSuite({
    owner,
    repo,
    check_name: 'Autograding',
    check_suite_id: checkSuiteId,
  })
  const checkRun = checkRunsResponse.data.total_count === 1 && checkRunsResponse.data.check_runs[0]
  if (!checkRun) return

  // Update the checkrun, we'll assign the title, summary and text even though we expect
  // the title and summary to be overwritten by GitHub Actions (they are required in this call)
  // We'll also store the total in an annotation to future-proof
  await octokit.rest.checks.update({
    owner,
    repo,
    check_run_id: checkRun.id,
    output: {
      title: 'Autograding',
      summary: text,
      text: text,
      annotations: [
        {
          // Using the `.github` path is what GitHub Actions does
          path: '.github',
          start_line: 1,
          end_line: 1,
          annotation_level: 'notice',
          message: text,
          title: 'Autograding complete',
        },
      ],
    },
  })
}
