/**
 * This file contains interfaces/typedefs for 
 * tests and the test suite. 
 */

/**
 * Short union typedef for describing exactly how a test should be graded:
 * 
 *  exact:    Test output (given by the test process' stdout) should exactly
 *            exactly match the expected output (given a Test object's `output` 
 *            key) in order to pass.
 * 
 *  regex:    Test output (given by the test process' stdout) should fully match
 *            a regex pattern (given in a Test object's `output` key) to pass.
 * 
 *  included: Tests are done by the user e.g. via some external unit
 *            unit testing framework. With this option we
 *            effectively defer to the user. If the process fails it is
 *            assumed that the student did not pass a test case.
 * 
 */
export type TestComparison = 'exact' | 'included' | 'regex' | null

/**
 * Typedef for a single test. 
 */
export interface Test {
  /** Test name */
  readonly name: string
  /** Shell command used to run the test */
  readonly run: string
  /** Shell command ran prior to `run` to set up test case, for steps like compiling */
  readonly setup?: string
  /** Number of milliseconds for test to time out */
  readonly timeout: number
  /** Any input needed for the test, via stdin */
  readonly input?: string
  /** The expected output of the test, via stdout */
  readonly output?: string
  /** Number of points given if the test case is passed */
  readonly points?: number
  /** Method of comparison against the answer, described in the typedef above */
  readonly comparison?: TestComparison
}

/**
 * Typedef for an entire test suite, as read in from some .json file.
 */
export interface TestSuite {
  readonly tests: Array<Test>
  /**
   * Option to specify if the suite should use all-or-nothing grading.
   * If true, points will be set to 0 if a single test is failed.
   */
  readonly allOrNothing?: boolean
  readonly microProject?: {
    readonly title: string
    readonly image: string
    readonly link: string
  }
}

/**
 * Typedef recording a single test result.
 */
export interface TestResult {
  /** Test name */
  test: string
  /** Number of points earned */
  points: number
  /** Number of possible points to earn */
  availablePoints: number
  /** True if test succeeded, false otherwise */
  success: boolean
}

/**
 * Typedef containing the test report, effectively just an array of TestResults
 * with some additional information on top. Sent to GitHub as an artifact
 * and used in the `report` output variable.
 */
export interface Report {
  /** Name of the test suite */
  testSuite: string
  /** Number of total points earned */
  points: number
  /** Number of points available through the whole test suite */
  availablePoints: number
  testsPassed: number
  testsFailed: number
  /** TestResult for each test run in the suite */
  log: Array<TestResult>
}

/**
 * Custom error classes for tests, used to delineate between output and timeout
 * errors.
 */
export class TestError extends Error {
  public payload: any
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
    // If the user fails, we should tell them what the expected output is
    super(`${message}\nExpected:\n${expected}\nActual:\n${actual}`)
    this.expected = expected
    this.actual = actual
    Error.captureStackTrace(this, TestOutputError)
  }
}
