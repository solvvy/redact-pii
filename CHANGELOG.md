# Changelog

All notable changes to this project from 3.x.x onward will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

# Changelog

## [3.4.0][] - 2022-07-29

- npm package updates including @google-cloud/dlp

## [3.3.0][] - 2022-06-27

- Updating dependent libraries to latest

## [3.2.3][] - 2019-09-12

- Downgrade @google-cloud/dlp to avoid memory leak in recent versions

## [3.2.2][] - 2019-08-12

- Fix bug in Google DLP Redactor with tokens overlapping and repeating
- Update dependencies to get security fixes

## [3.2.1][] - 2019-06-20

- Tweak the built-in US SSN regex to work better on large input by removing the optional delimters (the digits regex will already cover this situation)

## [3.2.0][] - 2019-05-21

- Add enhancement to automatically split Google DLP input that is too large into smaller batches. This can be disabled with the `disableAutoBatchWhenContentSizeExceedsLimit` option.

## [3.1.0][] - 2019-05-04

- BREAKING: rename `replacementValue` param of built-in redaction config to `replaceWith` for consistency

## [3.0.2][] - 2019-05-04

- fix parameter typo in docs (`enable` -> `enabled`)
- fix `TypeError` when attempting to disable built-in redactors

## [3.0.1][] - 2019-04-29

- Fix `Cannot find module './well-known-names.json'` error by making sure the file gets properly packaged

## [3.0.0][] - 2019-04-21

- This version is an almost complete rewrite from prior versions and **breaks** the prior API contract. In summary the changes are:
- Library is now written in TypeScript
- Introduces seperate API for sync and async redaction via seperate `SyncRedactor` and `AsyncRedactor` classes and seperate `.redact` and `.redactAsync` methods.
- **Important Breaking Change:** The `redact` and `redactSync` methods now always expect a `string`. Passing anything else causes undefined behaviour and _may_ cause an exception. Prior versions of the library used to simply return the original value "untouched" if it wasn't a `string`.
- Google Cloud DLP redaction is now a seperate redaction class that has to be explicitly imported and instantiated (`new GoogleDLPRedactor()`)
  in order to use it.
- Google Cloud DLP redaction does not have an implicit, hard-coded 5000ms timeout anymore. If you want to set a timeout for DLP calls you have to implement it yourself. In case you're using `bluebird` as promise library consider using `.timeout`.

[unreleased]: https://github.com/solvvy/redact-pii/compare/v3.2.3...HEAD
[3.2.3]: https://github.com/solvvy/redact-pii/compare/v3.2.2...v3.2.3
[3.2.2]: https://github.com/solvvy/redact-pii/compare/v3.2.1...v3.2.2
[3.2.1]: https://github.com/solvvy/redact-pii/compare/v3.2.0...v3.2.1
[3.2.0]: https://github.com/solvvy/redact-pii/compare/v3.1.0...v3.2.0
[3.1.0]: https://github.com/solvvy/redact-pii/compare/v3.0.1...v3.1.0
[3.0.1]: https://github.com/solvvy/redact-pii/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/solvvy/redact-pii/tree/v3.0.0
[unreleased]: https://github.com/solvvy/redact-pii/compare/v3.3.0-beta.1...HEAD
[3.3.0-beta.1]: https://github.com/solvvy/redact-pii/tree/v3.3.0-beta.1
