import fs from 'fs'
import path from 'path'
import * as core from '@actions/core'
import {run, runAll} from '../runner'
import * as output from '../output'
import { Test, TestSuite } from '../Test'

/**
 * Creates a mock getInput implementation to replicate a live environemnt.
 * 
 * @param allOrNothing 
 * @returns 
 */
function createMockGetInput():
 (inputName: string) => string {
  return (inputName) => {
    switch (inputName) {
      case 'step_summary':
        return 'false'
      default:
        return ''
    }
  }
}

function fetchTestJSON(fp: string) {
  const data = fs.readFileSync(fp)
  const json = JSON.parse(data.toString())
  return json
}

/**
 * MAIN TEST SUITE
 */

/**
 * Full test suites
 */
let LANGUAGE: string = 'python'

/**
 * C Test -- Running full test suites:
 */
describe(`Full test suites -- running ${LANGUAGE}`, () => {
  // Do dummy mock implementations for all output.ts functions and summary.
  // We don't care about these right now
  jest.spyOn(core, 'setOutput').mockImplementation(() => { return })
  jest.spyOn(output, 'uploadArtifact').mockImplementation(async () => { return })

  afterEach(() => {
    // resetModules allows you to safely change the environment and mock imports
    // separately in each of your tests
    jest.resetModules()
    jest.clearAllMocks()
  })

  const cwd = path.resolve(__dirname, LANGUAGE)
  let suitePath: string = `src/__tests__/${LANGUAGE}/.github/classroom`
  let setOutputSpy = jest.spyOn(core, 'setOutput')
  let setFailedSpy = jest.spyOn(core, 'setFailed')

  test('Run fully passing test suite -- no all-or-nothing', async () => {
    let setOutputSpy = jest.spyOn(core, 'setOutput')
    jest.spyOn(core, 'getInput').mockImplementation(
      createMockGetInput()
    )
    const testJSON = fetchTestJSON(`${suitePath}/fully_passing.json`)

    await expect(runAll(testJSON as TestSuite, cwd)).resolves.not.toThrow()
    expect(setOutputSpy).toHaveBeenCalledWith('Points', '4/4')
    expect(setFailedSpy).not.toHaveBeenCalled()
  })

  test('Run all-or-nothing passing test suite', async () => {
    jest.spyOn(core, 'getInput').mockImplementation(
      createMockGetInput()
    )
    const testJSON = fetchTestJSON(`${suitePath}/fully_passing_aon.json`)

    await expect(runAll(testJSON as TestSuite, cwd)).resolves.not.toThrow()
    expect(setOutputSpy).toHaveBeenCalledWith('Points', '4/4')
    expect(setFailedSpy).not.toHaveBeenCalled()
  })

  test('Run partially passing test suite', async () =>{
    jest.spyOn(core, 'getInput').mockImplementation(
      createMockGetInput()
    )
    const testJSON = fetchTestJSON(`${suitePath}/partially_passing.json`)
    const setOutputSpy = jest.spyOn(core, 'setOutput')
    const setFailedSpy = jest.spyOn(core, 'setFailed')

    await expect(runAll(testJSON as TestSuite, cwd)).resolves.not.toThrow()
    expect(setOutputSpy).toHaveBeenCalledWith('Points', '2/4')
    expect(setFailedSpy).toHaveBeenCalled()
  })

  test('Run partially passing all-or-nothing test suite', async () =>{
    jest.spyOn(core, 'getInput').mockImplementation(
      createMockGetInput()
    )
    const testJSON = fetchTestJSON(`${suitePath}/partially_passing_aon.json`)
    const setOutputSpy = jest.spyOn(core, 'setOutput')
    const setFailedSpy = jest.spyOn(core, 'setFailed')

    await expect(runAll(testJSON as TestSuite, cwd)).resolves.not.toThrow()
    expect(setOutputSpy).toHaveBeenCalledWith('Points', '0/4')
    expect(setFailedSpy).toHaveBeenCalled()
  })

  test('Run completely failing test suite', async () =>{
    jest.spyOn(core, 'getInput').mockImplementation(
      createMockGetInput()
    )
    const testJSON = fetchTestJSON(`${suitePath}/fully_failing.json`)
    const setOutputSpy = jest.spyOn(core, 'setOutput')
    const setFailedSpy = jest.spyOn(core, 'setFailed')

    await expect(runAll(testJSON as TestSuite, cwd)).resolves.not.toThrow()
    expect(setOutputSpy).toHaveBeenCalledWith('Points', '0/4')
    expect(setFailedSpy).toHaveBeenCalled()
  })
})

/**
 * Individual tests, checking
 */
describe('Individual custom tests', () => {
  const cwd = path.resolve(__dirname, 'sh')
  test('Check exact matching test -- passing', async () => {
    let test: Test = {
      name: 'Shell script exact test',
      run: 'sh printstr.sh',
      setup: '',
      timeout: 2,
      comparison: 'exact',
      output: 'Hello world!',
      points: 1
    }
    await expect(run(test, cwd)).resolves.not.toThrow()
  })

  test('Check exact matching test -- failing', async () => {
    let test: Test = {
      name: 'Shell script exact test',
      run: 'sh printstr.sh',
      timeout: 2,
      setup: '',
      comparison: 'exact',
      output: 'Goodbye world!',
      points: 1
    }
    await expect(run(test, cwd)).rejects.toThrow()
  })

  test('Check regex matching test -- passing', async () => {
    let test: Test = {
      name: 'Shell script regex test',
      run: 'sh printstr.sh',
      setup: '',
      timeout: 2,
      comparison: 'regex',
      output: '\\w world!',
      points: 1
    }
    await expect(run(test, cwd)).resolves.not.toThrow()
  })

  test('Check regex matching test -- failing', async () => {
    let test: Test = {
      name: 'Shell script regex test',
      run: 'sh printstr.sh',
      setup: '',
      timeout: 2,
      comparison: 'regex',
      output: 'Goodbye \\w!',
      points: 1
    }
    await expect(run(test, cwd)).rejects.toThrow()
  })
})