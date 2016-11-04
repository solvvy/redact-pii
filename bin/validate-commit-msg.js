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
  console.log('parsing commit log:\n', data, '\n');
  var firstLine = data.split('\n').filter(l => l && !l.match(/^\s*Merge/))[0];
  console.log('evaluating commit message:\t', firstLine);
  if (!firstLine.match(/^\w{7} (feat|fix|docs|chore|ci|style|refactor|test|perf)(\([^)]+\))?: .*/gi)) {
    error('commit message didn\'t match expectation, see cz-conventional-changelog');
  }
})
