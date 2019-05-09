workflow "Verify the module" {
  on = "push"
  resolves = ["verify_all"]
}

action "install" {
  uses = "actions/npm@master"
  args = "ci"
}

action "peer_install" {
  uses = "actions/npm@master"
  args = "install --no-save @google-cloud/dlp"
}

action "verify_all" {
  needs = "peer_install"
  uses = "actions/npm@master"
  args = "run verify_all"
}

# TODO configure auto publish in CI  
# - script: npm publish || true
#   condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/master'))
#   displayName: attempt_publish
