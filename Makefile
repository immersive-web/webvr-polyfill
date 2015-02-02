default:
	mkdir -p build
	browserify src/main.js > build/webvr-polyfill.js

clean:
	rm build/webvr-polyfill.js
	rmdir build
