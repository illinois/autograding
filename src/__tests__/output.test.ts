/* import * as core from '@actions/core'
import {setCheckRunOutput} from '../output'
import nock from 'nock'

beforeEach(() => {
  // resetModules allows you to safely change the environment and mock imports
  // separately in each of your tests
  jest.resetModules()
  jest.restoreAllMocks()
  jest.spyOn(core, 'getInput').mockImplementation((name: string): string => {
    if (name === 'token') return '12345'
    return ''
  })
  jest.spyOn(core, 'setOutput').mockImplementation(() => {
    return
  })
  process.env['GITHUB_REPOSITORY'] = 'example/repository'
  process.env['GITHUB_RUN_ID'] = '98765'
})

afterEach(() => {
  expect(nock.pendingMocks()).toEqual([])
  nock.isDone()
  nock.cleanAll()
})

beforeEach(() => {
  // resetModules allows you to safely change the environment and mock imports
  // separately in each of your tests
  jest.resetModules()
  jest.restoreAllMocks()

  process.env['GITHUB_WORKSPACE'] = path.resolve(__dirname, 'java')
  process.env['GITHUB_REPOSITORY'] = 'example/repository'
  process.env['GITHUB_STEP_SUMMARY'] = ''

  // Create a mock payload for our tests to use
  // https://developer.github.com/v3/activity/events/types/#issuecommentevent
  github.context.payload = {
    ref: 'refs/tags/simple-tag',
    before: '6113728f27ae82c7b1a177c8d03f9e96e0adf246',
    after: '0000000000000000000000000000000000000000',
    commits: [],
    repository: {
      id: 186853002,
      node_id: 'MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=',
      name: 'repository',
      full_name: 'example/repository',
      owner: {
        name: 'Codertocat',
        email: '21031067+Codertocat@users.noreply.github.com',
        login: 'Codertocat',
        id: 21031067,
      },
    },
  } as WebhookPayload
})

describe('output', () => {
  beforeEach(() => {
    // Use nock to mock out the external call to delete the comment
    // Setting this up creates an expectation that must be called and returns a 200 response
    nock('https://api.github.com')
      .get('/repos/example/repository/actions/runs/98765')
      .reply(200, {
        check_suite_url: 'https://api.github.com/repos/example/repository/check-suites/111111',
      })

    nock('https://api.github.com')
      .get('/repos/example/repository/check-suites/111111/check-runs?check_name=Autograding')
      .reply(200, {
        total_count: 1,
        check_runs: [
          {
            id: 222222,
          },
        ],
      })
  })

  it('matches included output', async () => {
    nock('https://api.github.com')
      .patch(`/repos/example/repository/check-runs/222222`, body => {
        if (body.output.text !== 'Dogs on parade') return false
        if (body.output.annotations[0].message !== 'Dogs on parade') return false
        return true
      })
      .reply(200, {})

    await expect(setCheckRunOutput('Dogs on parade')).resolves.not.toThrow()
  }, 10000)
})
 */