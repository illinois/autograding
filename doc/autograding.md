# illinois/autograding
The `illinois/autograding` is a GitHub action based on GitHub CI workflow for running testcases and generating grading report.

## Setup:
Create a JSON file that defines behavior of the autograder located at `.github/classroom/autograding.json` of the repository to be graded.

### Example for C++ testcases
```autograding.json
{
  "tests": [
    {
      "name": "Test1",
      "setup": "make test",
      "run": "./test -w NoTests 'Test1'",
      "comparison": "included",
      "timeout": 0.5,
      "points": 10
    },
    {
      "name": "Test2",
      "setup": "make test",
      "run": "./test -w NoTests 'Test2'",
      "comparison": "included",
      "timeout": 0.2,
      "points": 20
    }
  ]
}
```
The JSON file specified above will guide the autograder to do the following:
- Setup test1 by commencing `make test`. Test will terminate if the command failed.
- Run unit test Test1 via running `./test -w NoTests 'Test1'` and 10 points will be awarded if the testcase passed.
- Conclude Test1 and repeat similar process for Test2.

[More details about the parameters.](https://docs.github.com/en/education/manage-coursework-with-github-classroom/teach-with-github-classroom/use-autograding#grading-methods)
## Basic usage:
Below is an example of a short workflow module that runs `illinois/autograding` integrated with `actions/checkout`.
```
steps:
- name: Checkout student repository
      id: student-checkout
      uses: actions/checkout@v3

- name: Autograding
      id: autograding
      uses: illinois/autograding@v3
      with:
        path: dir_to_test/
        test_suite: autograding
        step_summary: true
```
The workflow above will do the following:
- Checkout out the default branch of the repository triggering the CI workflow.
- Run the setup command and testcases based on the in `dir_to_test/.github/classroom/autograding.json`.
- Generate the grading ouputs that can be capture by `steps.autograding.outputs`.

|Parameter|Required?|Description|Default|
|--------------------|--------|-----------|-------|
|`token`|No|GitHub token used to check repository content and provide feedback. By default, this uses the repository token provided by GitHub Actions. You can customize thisby replacing this token with a user token which has write-access to your repository. Note that the token will be accessible to all repository collaborators.|Repository token provided by GitHub Actions|
|`path`|No|An assignment path within the repository|Current directory|
|`test_suite`|No|A test_suite name within the repository|`'autograding'`|
|`step_summary`|No|Boolean describing if a step summary should be generated|`'false'`|

