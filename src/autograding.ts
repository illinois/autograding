import * as core from '@actions/core'
import fs from 'fs'
import path from 'path'
import {runAll} from './runner'
import {TestSuite} from './Test'

/**
 * Main autograding function. Runs the entire test suite as specified in
 * `.github/classroom/<testSuite>.json
 */
const run = async (): Promise<void> => {
  try {
    let cwd = process.env['GITHUB_WORKSPACE']
    if (!cwd) {
      core.setFailed(`Autograding failure: The GITHUB_WORKSPACE environment variable
                     could not be located. Please verify that you are using this 
                     action on a supported platform.`)
      return
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
    const json = JSON.parse(data.toString()) as TestSuite
    await runAll(json, cwd, testSuite)
  } catch (error: any) {
    // If there is any error we'll fail the action with the error message
    console.error(error.message)
    core.setFailed(`Autograding failure: ${error}`)
  }
}

// Don't auto-execute in the test environment
if (process.env['NODE_ENV'] !== 'test') {
  run()
}

export default run
