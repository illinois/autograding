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

## Usage:
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
        test_suite: jklmnop
        step_summary: true
```
