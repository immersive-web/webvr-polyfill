const fs = require('fs');
const join = require('path').join;
const execSync = require('child_process').execSync;

const semver = require('semver');

const release = process.argv[2] || 'patch';
const metaPath = join(__dirname, '..', 'package.json');

// Bump version
const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
const newVersion = semver.inc(meta.version, release);
meta.version = newVersion;
console.log(`Bumping ${release} version to ${newVersion}...`);
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

// Build with latest version
console.log('Building latest...');
execSync('npm run build');

console.log('Committing changes...');
execSync('git add .');
execSync(`git commit -m ${newVersion}`);

// Create tag
console.log(`Creating v${newVersion} git tag...`);
execSync(`git tag -a v${newVersion} -m "v${newVersion}"`);

console.log('Publishing to npm...');
execSync(`npm publish`);

// This is separate incase working from a fork, since we'll need
// to push upstream for example
console.log('All done! Be sure to push changes via `git push --tags`');
