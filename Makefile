default:
	mkdir -p build
	browserify main.js > build/webvr-polyfill.js
	# Temporary, for testing only.
	cp build/webvr-polyfill.js ../webvr-boilerplate/js

clean:
	rm build/webvr-polyfill.js
	rmdir build
