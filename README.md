# Monorepo - Mocha

This extension is primarily for integrating codelens test running into a monorepo (lerna, etc) with seperate packages.
It is primarily designed for Typescript tests, and the features are geared round running them.

## Features

* Configure different test runner arguments based on sub directory paths.

* Automatically reparent test runner based on location of tsconfig.json

## Requirements

## Extension Settings

This extension contributes the following settings:

* `monorepo-mocha.defaultArguments`: default arguments to be added to mocha command
* `monorepo-mocha.extensions`: file suffixes to check for tests
* `monorepo-mocha.useTSConfig`: If true will look for a tsconfig.json file under the path of the current test.
* `monorepo-mocha.testRoots`: Configuration of a particular sub directory. The following properties are supported.
  * `cwd?`: Set the working directory to this path (If not set will default to rootPath)
  * `rootPath`: Sub directory path to use as the root for the tests. Used to match against the test file, and if matches will apply these settings.
  * `additionalArguments`: Additional arguments to append to the mocha command for all test files run under this path.
  * `env?`: Environment variables to set will running tests in this path.

## Known Issues
  * Tests run through the test suite view will not report success / failure back to the view.
## Release Notes

### 1.0.0

Initial release

-----------------------------------------------------------------------------------------------------------
