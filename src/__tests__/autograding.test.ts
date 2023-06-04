import * as core from '@actions/core'
import * as output from '../output'
import run from '../autograding'

const LANGUAGE: string = 'dummy'

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
      case 'all_or_nothing':
        return 'true'
      case 'step_summary':
        return 'false'
      case 'path':
        return `${LANGUAGE}`
      case 'test_suite':
        return 'autograding'
      default:
        return ''
    }
  }
}

/**
 * MAIN TEST SUITE
 */
describe('run tests', () => {
  // Do dummy mock implementations for all output.ts functions, we don't care
  // about these right now
  jest.spyOn(core, 'setOutput').mockImplementation(() => { return })
  jest.spyOn(output, 'writeResultJSONFile').mockImplementation(async () => { return })
  beforeEach(() => {
    process.env['GITHUB_WORKSPACE'] = __dirname
  })
  afterEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
  })

  test('Complete run from scratch can complete without error', async () => {
    const setOutputSpy = jest.spyOn(core, 'setOutput')
    jest.spyOn(core, 'getInput').mockImplementation(
      createMockGetInput()
    )
    await expect(run()).resolves.not.toThrow()
    expect(setOutputSpy).toHaveBeenCalledWith('Points', '1/1')
  })

  test('Fails gracefully with empty GITHUB_WORKSPACE', async () => {
    const setFailedSpy = jest.spyOn(core, 'setFailed')
    process.env['GITHUB_WORKSPACE'] = ''
    jest.spyOn(core, 'getInput').mockImplementation(
      createMockGetInput()
    )
    await expect(run()).resolves.not.toThrow()
    expect(setFailedSpy).toHaveBeenCalled()
  })

  test('Fails gracefully with bad path input', async () => {
    const setFailedSpy = jest.spyOn(core, 'setFailed')
    jest.spyOn(core, 'getInput').mockImplementation(
      (inputName) => {
        switch (inputName) {
          case 'all_or_nothing':
            return 'true'
          case 'step_summary':
            return 'false'
          case 'path':
            return 'rubbish/file/path' // the bad fp in question
          case 'test_suite':
            return 'autograding'
          default:
            return ''
        }
      }
    )
    await expect(run()).resolves.not.toThrow()
    expect(setFailedSpy).toHaveBeenCalled()
  })
})
