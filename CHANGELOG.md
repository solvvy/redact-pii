# Changelog
All notable changes to this project from 3.x.x onward will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

# Changelog
 
## [Unreleased][]
 
- This version is an almost complete rewrite from prior versions and **breaks** the prior API contract. In summary the changes are:
- Library is now written in TypeScript
- Introduces seperate API for sync and async redaction via seperate `SyncRedactor` and `AsyncRedactor` classes and seperate `.redact` and `.redactAsync` methods.
- **Important Breaking Change:** The `redact` and `redactSync` methods now always expect a `string`. Passing anything else causes undefined behaviour and *may* cause an exception. Prior versions of the library used to simply return the original value "untouched" if it wasn't a `string`.
- Google Cloud DLP redaction is now a seperate redaction class that has to be explicitly imported and instantiated (`new GoogleDLPRedactor()`)
  in order to use it.
- Google Cloud DLP redaction does not have an implicit, hard-coded 5000ms timeout anymore. If you want to set a timeout for DLP calls you have to implement it yourself. In case you're using `bluebird` as promise library consider using `.timeout`.
 