#!/usr/bin/env node

process.stdin.setEncoding('utf8');

function error() {
  console.log.apply(console, arguments);
  process.exit(1);
}
var data = '';
process.stdin.on('readable', () => {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    data += chunk;
  }
});


process.stdin.on('end', function () {
  var firstLine = data.split('\n')[0];
  if (!firstLine.match(/^\w{7} (feat|fix|docs|chore|ci|style|refactor|test)(\([^)]+\))?: .*/gi)) {
    error('commit message didn\'t match expectation, see cz-conventional-changelog');
  }
})
