import * as core from '@actions/core'
import fs from 'fs'
import path from 'path'
import {Test, runAll} from './runner'

const run = async (): Promise<void> => {
  try {
    let cwd = process.env['GITHUB_WORKSPACE']
    if (!cwd) {
      throw new Error('No GITHUB_WORKSPACE')
    }

    const assignmentPath = core.getInput('path')
    if (assignmentPath) {
      console.log(`Using assignment path: ${assignmentPath}`)
      cwd = path.join(cwd, assignmentPath)
    }

    let testSuite = core.getInput('test_suite')
    if (!testSuite) {
      testSuite = 'autograding'
    }

    const data = fs.readFileSync(path.resolve(cwd, `.github/classroom/${testSuite}.json`))
    const json = JSON.parse(data.toString())

    await runAll(json.tests as Array<Test>, cwd, testSuite)
  } catch (error) {
    // If there is any error we'll fail the action with the error message
    console.error(error.stack)
    core.setFailed(`Autograding failure: ${error}`)
  }
}

// Don't auto-execute in the test environment
if (process.env['NODE_ENV'] !== 'test') {
  run()
}

export default run
