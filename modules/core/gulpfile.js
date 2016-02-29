const pkg = require('./package.json');
const execSync = require('child_process').execSync;

require('../../gulp/lib')({
  prefix: pkg.name.split('/')[1],
  // onBuildComplete() {
  //   console.log('jspm linking...');
  //   execSync('npm run link:jspm', { stdio: 'inherit' });
  // }
});
