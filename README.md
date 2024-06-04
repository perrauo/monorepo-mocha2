# Monorepo - Mocha

General purpose test runner for Mocha

This extension is primarily for integrating codelens test running into a monorepo (lerna, etc) with seperate packages.
It will also however work with standard repository layouts and single packages as well.
It is primarily designed for Typescript tests, and the features are geared round running them, but with correct configuration it will also work for standard javascript tests as well.

## Features

* Configure different test runner arguments based on sub directory paths.
* Utilise VS Codes built in test sute manager
* Parse and understand locations and expectations from mocha (Experimental)
* Automatically reparent test runner based on location of tsconfig.json

## Install
```
npm install --global yarn
yarn add --dev @vscode/vsce
# cd into extension project (monorepo-mocha2)
yarn install
yarn compile
yarn vsce package
code --install-extension monorepo-mocha-1.1.x.vsix
```

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
* `monorepo-mocha.trackResultsInline`: Use in-built test explorer to track results, if false will be done in terminal.

## Known Issues
  
## Release Notes

### 1.0.0

Initial release

-----------------------------------------------------------------------------------------------------------
### 1.1.0

* Made only one terminal open per test
* Add facility to track test results using test explorer

-----------------------------------------------------------------------------------------------------------

### 1.1.1

* Fixed issue with test runner not identifying that some suites had finished
* Added inline diffs and code locating


-----------------------------------------------------------------------------------------------------------
