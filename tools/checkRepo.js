const execSync = require('child_process').execSync;

function run (cmd) {
  return execSync(cmd).toString();
}

// Check if local git repo is synchronized
if (run('git diff') !== '') {
  throw new Error('Need to commit changed files');
}

const localRev = run('git rev-parse @');
const remoteRev = run('git rev-parse @{u}');

if (localRev !== remoteRev) {

  const baseRev = run('git merge-base @ @{u}');

  if (localRev === baseRev) {
    throw new Error('Need to run \'git pull\'');
  } else if (remoteRev === baseRev) {
    throw new Error('Need to run \'git push\'');
  } else {
    throw new Error(`Invalid revisions \
                    (local=${localRev}, remote=${remoteRev}, base=${baseRev})`);
  }
}
