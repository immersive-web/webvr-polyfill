## Developing

If you're interested in developing and contributing on the polyfill itself, you'll need to
have [npm] installed and familiarize yourself with some commands below. For full list
of commands available, see `package.json` scripts.

```
$ git clone git@github.com:immersive-web/webvr-polyfill.git
$ cd webvr-polyfill/

# Install dependencies
$ npm install

# Build uncompressed JS file
$ npm run build

# Run tests
$ npm test

# Watch src/* directory and auto-rebuild on changes
$ npm watch
```

### Testing

Right now there are some unit tests in the configuration and logic for how things get polyfilled.
Be sure to run tests before submitting any PRs, and bonus points for having new tests!

```
$ npm test
```

Due to the nature of the polyfill, be also sure to test the examples with your changes where appropriate.

### Releasing a new version

For maintainers only, to cut a new release for npm, use the [npm version] command. The `preversion`, `version` and `postversion` npm scripts will run tests, build, add built files and tag to git, push to github, and publish the new npm version.

`npm version <semverstring>`

## License

This program is free software for both commercial and non-commercial use,
distributed under the [Apache 2.0 License](LICENSE).

[rollup]: https://rollupjs.org
