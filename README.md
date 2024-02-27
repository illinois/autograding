# Github University: A Language-Agnostic Automated Grading Solution

Illinois Github University is an autograding toolset that leverages Github's Actions platform to create a stable, secure, and modular autograding platform that can easily be configured as a drop-in solution for any course regardless of core language or toolset of choice.

## Actions Suite

Github university implements a number of configurable grading actions that cover all parts of grading workflows, including pre and post-grading checks:

### :rocket: [@illinois/autograding](https://github.com/illinois/autograding/blob/main/doc/autograding.md) 

Lightweight and language-agnostic autograder implementation. Runs student code against a test suite, logs student grades as an artifact, and provides a detailed grading summary.

### :page_facing_up: [@illinois/local-copy](https://github.com/illinois/local-copy)

Replaces files in a cloned student repository with files from a reference repository prior to autograding. Removes any student changes to files necessary for autograding.

### :ballot_box_with_check: [@illinois/verify-policy](https://github.com/illinois/verify-policy)

Performs pre-grading checks to verify that a student's submission adheres to assignment policy. Verifies that required files exist, cross-references files against a reference to make sure that they have not been altered, and stops workflows if they are run after a set due date.

### :signal_strength: [@illinois/autograding-telemetry](https://github.com/illinois/autograding-telemetry)

Logs workflow and autograding data to a remote server or an artifact. Useful for instructors wanting a data-driven approach to grading.

## Usage

A full workflow utilizing all of the current Github University actions suite is provided below as reference:
```yaml
autograding:
  name: autograding
  runs-on: ubuntu-latest
  timeout-minutes: 5
  steps:
  - name: Checkout student repository
    id: sr-checkout
    uses: actions/checkout@v4
  - name: Checkout release repository
    id: release-checkout
    uses: actions/checkout@v4
  - name: Copy reference files
    id: local-copy
    uses: illinois/local-copy@v2
    with:
      src_path: release
      dst_path: .
      copy: >
        autograding-files.txt : autograding-file.txt,
        Makefile : Makefile
  - name: Verify assignment policy
    id: verify-policy
    uses: illinois/verify-policy@v3
    with:
      due_date: '2022-06-21T00:00:00+00:00'
      required_files: 'mp1/Makefile, .github/workflows/mp1-autograder-action.yml'
      reference_files: 'mp1/tests/test-file.cpp : reference/tests/test-file.cpp, mp1/Makefile : reference/Makefile'
  - name: Autograding
    id: autograding
    uses: illinois/autograding@v5
    with:
      path: mp1/
      test_suite: autograding
      step_summary: true
  - name: Log telemetry data
    if: ${{ always() }}
    uses: illinois/telemetry@v1
    with:
      endpoint: "http://arbitrary.remote.server:5000/"
      create_artifact: true
      log_date: true
      user: ${{ github.actor }}
      autograding_status: ${{ steps.autograding.outcome }}
      points: ${{ steps.autograding.outputs.Points }}
      assignment: 'mp1-autograding'
```

## Example Repositories

A number of example repositories are provided below as reference:

- [Example C/C++ repository](https://github.com/cs340-illinois/Example-Classroom-Repo-Default-)

- [Example Python repository](https://github.com/cs340-illinois/fa22_cs340_kennel2)




