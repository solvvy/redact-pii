workflow "Verify the module" {
  on = "push"
  resolves = ["verify_all"]
}

action "install" {
  uses = "actions/npm@1.0.0"
  args = "ci"
}

action "verify_all" {
  needs = "install"
  uses = "actions/npm@1.0.0"
  args = "run verify_all"
}

# TODO configure auto publish in CI  
# - script: npm publish || true
#   condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/master'))
#   displayName: attempt_publish
