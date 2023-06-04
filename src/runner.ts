import {spawn, ChildProcess} from 'child_process'
import kill from 'tree-kill'
import {v4 as uuidv4} from 'uuid'
import * as core from '@actions/core'
import {setCheckRunOutput, writeResultJSONFile} from './output'
import * as os from 'os'
import chalk from 'chalk'

export type TestComparison = 'exact' | 'included' | 'regex'

/**
 * 
 */
export interface Test {
  readonly name: string
  readonly setup?: string
  readonly run: string
  readonly input?: string
  readonly output?: string
  readonly timeout: number
  readonly points?: number
  readonly comparison?: TestComparison
}

export class TestError extends Error {
  constructor(message: string) {
    super(message)
    Error.captureStackTrace(this, TestError)
  }
}

export class TestTimeoutError extends TestError {
  constructor(message: string) {
    super(message)
    Error.captureStackTrace(this, TestTimeoutError)
  }
}

export class TestOutputError extends TestError {
  expected: string
  actual: string

  constructor(message: string, expected: string, actual: string) {
    super(`${message}\nExpected:\n${expected}\nActual:\n${actual}`)
    this.expected = expected
    this.actual = actual

    Error.captureStackTrace(this, TestOutputError)
  }
}

/**
 * UTILITY FUNCTIONS
 */
/** Writes `text` to stdout. */
const log = (text: string): void => {
  process.stdout.write(text + os.EOL)
}
/** Trims `text` and reduces \r\n to \.n */
const normalizeLineEndings = (text: string): string => {
  return text.replace(/\r\n/gi, '\n').trim()
}
const indent = (text: any): string => {
  let str = '' + new String(text)
  str = str.replace(/\r\n/gim, '\n').replace(/\n/gim, '\n  ')
  return str
}

/**
 * Sets a timer for `child` to complete. If `child` does not complete in
 * `timeout` minutes, the process is killed and the test case auto-fails.
 * 
 * @param child Process being timed
 * @param timeout The timeout for the process, in milliseconds
 * @returns A resolved promise if the process completes in time, a rejected
 * promise otherwise.
 */
const waitForExit = async (child: ChildProcess, timeout: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    let timedOut = false
    log(`Waiting for ${child.pid} to complete (timeout=${timeout}).`)

    const exitTimeout = setTimeout(() => {
      timedOut = true
      kill(child.pid!)
      reject(new TestTimeoutError(`Setup timed out in ${timeout} milliseconds`))
    }, timeout)

    child.once('exit', (code: number, signal: string) => {
      if (timedOut) return
      clearTimeout(exitTimeout)

      if (code === 0) {
        resolve(undefined)
      } else {
        reject(new TestError(`Error: Exit with code: ${code} and signal: ${signal}`))
      }
    })

    child.once('error', (error: Error) => {
      if (timedOut) return
      clearTimeout(exitTimeout)
      reject(error)
    })
  })
}

/**
 * Spawns a process that runs the command specified in `test.setup`. If the
 * process does not complete in `timeout` milliseconds, the test auto-fails and
 * the function returns a rejected promise.
 * 
 * @param test Test for which setup is being run
 * @param cwd The current working directory
 * @param timeout The timeout for the process, in milliseconds
 * @returns 
 */
const runSetup = async (test: Test, cwd: string, timeout: number): Promise<void> => {
  if (!test.setup || test.setup === '') {
    return
  }
  const setup = spawn(test.setup, {
    cwd,
    shell: true,
    timeout: timeout + 1000,
    env: {
      PATH: process.env['PATH'],
      FORCE_COLOR: 'true',
    },
  })
  /** Write newline to stdout to flush output */
  process.stdout.write(indent('\n'))

  /** Configure event handlers for stdout and stderr */
  setup.stdout.on('data', chunk => {
    process.stdout.write(indent(chunk))
  })
  setup.stderr.on('data', chunk => {
    process.stderr.write(indent(chunk))
  })
  await waitForExit(setup, timeout)
}

/**
 * Runs the command used to run `test`.  If the process does not complete in 
 * `timeout` milliseconds, the test auto-fails.
 * 
 * @param test Test being run
 * @param cwd The current working directory
 * @param timeout The timeout for the process, in milliseconds
 * @returns 
 */
const runCommand = async (test: Test, cwd: string, timeout: number): Promise<void> => {
  const child = spawn(test.run, {
    cwd,
    shell: true,
    timeout: timeout + 1000,
    env: {
      PATH: process.env['PATH'],
      FORCE_COLOR: 'true',
    },
  })

  let output = ''

  // Start with a single new line
  process.stdout.write(indent('\n'))

  child.stdout.on('data', chunk => {
    process.stdout.write(indent(chunk))
    output += chunk
  })

  child.stderr.on('data', chunk => {
    process.stderr.write(indent(chunk))
  })

  // Preload the inputs
  if (test.input && test.input !== '') {
    child.stdin.write(test.input)
    child.stdin.end()
  }

  await waitForExit(child, timeout)

  // If the test has no input or output, we know it isn't matching against
  // any user-provided input, so exit early
  if ((!test.output || test.output == '') && (!test.input || test.input == '')) {
    return
  }

  const expected = normalizeLineEndings(test.output || '')
  const actual = normalizeLineEndings(output)

  switch (test.comparison) {
    case 'exact':
      if (actual != expected) {
        throw new TestOutputError(`The output for test ${test.name} did not match`, expected, actual)
      }
      break
    case 'regex':
      // Note: do not use expected here
      if (!actual.match(new RegExp(test.output || ''))) {
        throw new TestOutputError(`The output for test ${test.name} did not match`, test.output || '', actual)
      }
      break
    default:
      // The default comparison mode is 'included'
      if (!actual.includes(expected)) {
        throw new TestOutputError(`The output for test ${test.name} did not match`, expected, actual)
      }
      break
  }
}

/**
 * Wrapper function for running a single test. Runs test setup
 * and executes the test command.
 * 
 * @param test Test being run
 * @param cwd Current working directory
 */
export const run = async (test: Test, cwd: string): Promise<void> => {
  // Timeouts are in minutes, but need to be in ms
  let timeout = Math.floor((test.timeout || 1) * 60 * 1000 || 30000)
  const start = process.hrtime()
  await runSetup(test, cwd, timeout)
  const elapsed = process.hrtime(start)
  // Subtract the elapsed seconds (0) and nanoseconds (1) to find the remaining timeout
  timeout -= Math.floor(elapsed[0] * 1000 + elapsed[1] / 1000000)
  await runCommand(test, cwd, timeout)
}

export const runAll = async (tests: Array<Test>, cwd: string, testSuite = 'autograding'): Promise<void> => {
  let points: number = 0
  let availablePoints: number = 0
  let hasPoints: boolean = false
  let jsonScoreLog: Array<any> = []

  // https://help.github.com/en/actions/reference/development-tools-for-github-actions#stop-and-start-log-commands-stop-commands
  const token = uuidv4()
  log('')
  log(`::stop-commands::${token}`)
  log('')

  let failed = false

  var summaryTable:any[][] = [[{data: 'Test name', header: true},
                               {data: 'Points', header: true},
                               {data: 'Passed?', header: true}]]

  /** Fetch YAML inputs from the workflow. */
  const step_summary = core.getInput('step_summary') == 'true'
  const allOrNothing = core.getInput("all_or_nothing", {required: false}) == 'true'

  for (const test of tests) {
    let scoreLog = {
      test: test.name,
      success: false,
      points: 0,
      availablePoints: test.points,
    }

    let scoreString = '-'
    let scoreStatus = '❌'

    try {
      if (test.points) {
        hasPoints = true
        availablePoints += test.points
      }
      log(chalk.cyan(`📝 ${test.name}`))
      log('')
      await run(test, cwd)
      log('')
      log(chalk.green(`✅ ${test.name}`))
      log(``)
      if (test.points) {
        points += test.points
        scoreLog.points = test.points
      }
      scoreLog.success = true
      scoreStatus = '✅'
      if (!allOrNothing) {
        scoreString = points ? points.toString() : "-"
      }
    } catch (error: any) {
      failed = true
      log('')
      log(chalk.red(`❌ ${test.name}`))
      scoreStatus = '❌'
      if (!allOrNothing) {
        scoreString = '0'
      }
      core.setFailed(error.message)
    }

    if (step_summary) {
      summaryTable.push([test.name, scoreString, scoreStatus])
    }

    jsonScoreLog.push(scoreLog)
  }

  // Restart command processing
  log('')
  log(`::${token}::`)

  if (failed) {
    // We need a good failure experience
  } else {
    log('')
    log(chalk.green('All tests passed'))
    log('')
    log('✨🌟💖💎🦄💎💖🌟✨🌟💖💎🦄💎💖🌟✨')
    log('')
  }

  if (allOrNothing) {
    points = points == availablePoints ? availablePoints : 0
  }

  if (step_summary) {
    let pointsReport = `Total points: ${points}/${availablePoints}`
    if (allOrNothing) {
      if (failed) {
        pointsReport = `0% - Not all tests passed`
      } else {
        pointsReport = `100% - All tests passed! 🎉`
      }
    }
    core.summary
    .addHeading('Grading summary :microscope:')
    .addTable(summaryTable)
    .addRaw(pointsReport)
    .write()
  }

  // Set the number of points
  if (hasPoints) {
    const text = `Points ${points}/${availablePoints}`
    log(chalk.bold.bgCyan.black(text))
    core.setOutput('Points', `${points}/${availablePoints}`)

    await setCheckRunOutput(text)
  }

  await writeResultJSONFile(
    {
      points: hasPoints ? points : failed ? 0 : 1,
      availablePoints: hasPoints ? availablePoints : 1,
      testSuite: testSuite,
      log: jsonScoreLog,
    },
    cwd,
  )
}
