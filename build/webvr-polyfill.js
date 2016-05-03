(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process,global){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
 * @version   3.1.2
 */

(function() {
    "use strict";
    function lib$es6$promise$utils$$objectOrFunction(x) {
      return typeof x === 'function' || (typeof x === 'object' && x !== null);
    }

    function lib$es6$promise$utils$$isFunction(x) {
      return typeof x === 'function';
    }

    function lib$es6$promise$utils$$isMaybeThenable(x) {
      return typeof x === 'object' && x !== null;
    }

    var lib$es6$promise$utils$$_isArray;
    if (!Array.isArray) {
      lib$es6$promise$utils$$_isArray = function (x) {
        return Object.prototype.toString.call(x) === '[object Array]';
      };
    } else {
      lib$es6$promise$utils$$_isArray = Array.isArray;
    }

    var lib$es6$promise$utils$$isArray = lib$es6$promise$utils$$_isArray;
    var lib$es6$promise$asap$$len = 0;
    var lib$es6$promise$asap$$vertxNext;
    var lib$es6$promise$asap$$customSchedulerFn;

    var lib$es6$promise$asap$$asap = function asap(callback, arg) {
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len] = callback;
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len + 1] = arg;
      lib$es6$promise$asap$$len += 2;
      if (lib$es6$promise$asap$$len === 2) {
        // If len is 2, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        if (lib$es6$promise$asap$$customSchedulerFn) {
          lib$es6$promise$asap$$customSchedulerFn(lib$es6$promise$asap$$flush);
        } else {
          lib$es6$promise$asap$$scheduleFlush();
        }
      }
    }

    function lib$es6$promise$asap$$setScheduler(scheduleFn) {
      lib$es6$promise$asap$$customSchedulerFn = scheduleFn;
    }

    function lib$es6$promise$asap$$setAsap(asapFn) {
      lib$es6$promise$asap$$asap = asapFn;
    }

    var lib$es6$promise$asap$$browserWindow = (typeof window !== 'undefined') ? window : undefined;
    var lib$es6$promise$asap$$browserGlobal = lib$es6$promise$asap$$browserWindow || {};
    var lib$es6$promise$asap$$BrowserMutationObserver = lib$es6$promise$asap$$browserGlobal.MutationObserver || lib$es6$promise$asap$$browserGlobal.WebKitMutationObserver;
    var lib$es6$promise$asap$$isNode = typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

    // test for web worker but not in IE10
    var lib$es6$promise$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
      typeof importScripts !== 'undefined' &&
      typeof MessageChannel !== 'undefined';

    // node
    function lib$es6$promise$asap$$useNextTick() {
      // node version 0.10.x displays a deprecation warning when nextTick is used recursively
      // see https://github.com/cujojs/when/issues/410 for details
      return function() {
        process.nextTick(lib$es6$promise$asap$$flush);
      };
    }

    // vertx
    function lib$es6$promise$asap$$useVertxTimer() {
      return function() {
        lib$es6$promise$asap$$vertxNext(lib$es6$promise$asap$$flush);
      };
    }

    function lib$es6$promise$asap$$useMutationObserver() {
      var iterations = 0;
      var observer = new lib$es6$promise$asap$$BrowserMutationObserver(lib$es6$promise$asap$$flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    // web worker
    function lib$es6$promise$asap$$useMessageChannel() {
      var channel = new MessageChannel();
      channel.port1.onmessage = lib$es6$promise$asap$$flush;
      return function () {
        channel.port2.postMessage(0);
      };
    }

    function lib$es6$promise$asap$$useSetTimeout() {
      return function() {
        setTimeout(lib$es6$promise$asap$$flush, 1);
      };
    }

    var lib$es6$promise$asap$$queue = new Array(1000);
    function lib$es6$promise$asap$$flush() {
      for (var i = 0; i < lib$es6$promise$asap$$len; i+=2) {
        var callback = lib$es6$promise$asap$$queue[i];
        var arg = lib$es6$promise$asap$$queue[i+1];

        callback(arg);

        lib$es6$promise$asap$$queue[i] = undefined;
        lib$es6$promise$asap$$queue[i+1] = undefined;
      }

      lib$es6$promise$asap$$len = 0;
    }

    function lib$es6$promise$asap$$attemptVertx() {
      try {
        var r = require;
        var vertx = r('vertx');
        lib$es6$promise$asap$$vertxNext = vertx.runOnLoop || vertx.runOnContext;
        return lib$es6$promise$asap$$useVertxTimer();
      } catch(e) {
        return lib$es6$promise$asap$$useSetTimeout();
      }
    }

    var lib$es6$promise$asap$$scheduleFlush;
    // Decide what async method to use to triggering processing of queued callbacks:
    if (lib$es6$promise$asap$$isNode) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useNextTick();
    } else if (lib$es6$promise$asap$$BrowserMutationObserver) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMutationObserver();
    } else if (lib$es6$promise$asap$$isWorker) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMessageChannel();
    } else if (lib$es6$promise$asap$$browserWindow === undefined && typeof require === 'function') {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$attemptVertx();
    } else {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useSetTimeout();
    }
    function lib$es6$promise$then$$then(onFulfillment, onRejection) {
      var parent = this;
      var state = parent._state;

      if (state === lib$es6$promise$$internal$$FULFILLED && !onFulfillment || state === lib$es6$promise$$internal$$REJECTED && !onRejection) {
        return this;
      }

      var child = new this.constructor(lib$es6$promise$$internal$$noop);
      var result = parent._result;

      if (state) {
        var callback = arguments[state - 1];
        lib$es6$promise$asap$$asap(function(){
          lib$es6$promise$$internal$$invokeCallback(state, child, callback, result);
        });
      } else {
        lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection);
      }

      return child;
    }
    var lib$es6$promise$then$$default = lib$es6$promise$then$$then;
    function lib$es6$promise$promise$resolve$$resolve(object) {
      /*jshint validthis:true */
      var Constructor = this;

      if (object && typeof object === 'object' && object.constructor === Constructor) {
        return object;
      }

      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$resolve(promise, object);
      return promise;
    }
    var lib$es6$promise$promise$resolve$$default = lib$es6$promise$promise$resolve$$resolve;

    function lib$es6$promise$$internal$$noop() {}

    var lib$es6$promise$$internal$$PENDING   = void 0;
    var lib$es6$promise$$internal$$FULFILLED = 1;
    var lib$es6$promise$$internal$$REJECTED  = 2;

    var lib$es6$promise$$internal$$GET_THEN_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$selfFulfillment() {
      return new TypeError("You cannot resolve a promise with itself");
    }

    function lib$es6$promise$$internal$$cannotReturnOwn() {
      return new TypeError('A promises callback cannot return that same promise.');
    }

    function lib$es6$promise$$internal$$getThen(promise) {
      try {
        return promise.then;
      } catch(error) {
        lib$es6$promise$$internal$$GET_THEN_ERROR.error = error;
        return lib$es6$promise$$internal$$GET_THEN_ERROR;
      }
    }

    function lib$es6$promise$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
      try {
        then.call(value, fulfillmentHandler, rejectionHandler);
      } catch(e) {
        return e;
      }
    }

    function lib$es6$promise$$internal$$handleForeignThenable(promise, thenable, then) {
       lib$es6$promise$asap$$asap(function(promise) {
        var sealed = false;
        var error = lib$es6$promise$$internal$$tryThen(then, thenable, function(value) {
          if (sealed) { return; }
          sealed = true;
          if (thenable !== value) {
            lib$es6$promise$$internal$$resolve(promise, value);
          } else {
            lib$es6$promise$$internal$$fulfill(promise, value);
          }
        }, function(reason) {
          if (sealed) { return; }
          sealed = true;

          lib$es6$promise$$internal$$reject(promise, reason);
        }, 'Settle: ' + (promise._label || ' unknown promise'));

        if (!sealed && error) {
          sealed = true;
          lib$es6$promise$$internal$$reject(promise, error);
        }
      }, promise);
    }

    function lib$es6$promise$$internal$$handleOwnThenable(promise, thenable) {
      if (thenable._state === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, thenable._result);
      } else if (thenable._state === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, thenable._result);
      } else {
        lib$es6$promise$$internal$$subscribe(thenable, undefined, function(value) {
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      }
    }

    function lib$es6$promise$$internal$$handleMaybeThenable(promise, maybeThenable, then) {
      if (maybeThenable.constructor === promise.constructor &&
          then === lib$es6$promise$then$$default &&
          constructor.resolve === lib$es6$promise$promise$resolve$$default) {
        lib$es6$promise$$internal$$handleOwnThenable(promise, maybeThenable);
      } else {
        if (then === lib$es6$promise$$internal$$GET_THEN_ERROR) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$GET_THEN_ERROR.error);
        } else if (then === undefined) {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        } else if (lib$es6$promise$utils$$isFunction(then)) {
          lib$es6$promise$$internal$$handleForeignThenable(promise, maybeThenable, then);
        } else {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        }
      }
    }

    function lib$es6$promise$$internal$$resolve(promise, value) {
      if (promise === value) {
        lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$selfFulfillment());
      } else if (lib$es6$promise$utils$$objectOrFunction(value)) {
        lib$es6$promise$$internal$$handleMaybeThenable(promise, value, lib$es6$promise$$internal$$getThen(value));
      } else {
        lib$es6$promise$$internal$$fulfill(promise, value);
      }
    }

    function lib$es6$promise$$internal$$publishRejection(promise) {
      if (promise._onerror) {
        promise._onerror(promise._result);
      }

      lib$es6$promise$$internal$$publish(promise);
    }

    function lib$es6$promise$$internal$$fulfill(promise, value) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }

      promise._result = value;
      promise._state = lib$es6$promise$$internal$$FULFILLED;

      if (promise._subscribers.length !== 0) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, promise);
      }
    }

    function lib$es6$promise$$internal$$reject(promise, reason) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }
      promise._state = lib$es6$promise$$internal$$REJECTED;
      promise._result = reason;

      lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publishRejection, promise);
    }

    function lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      parent._onerror = null;

      subscribers[length] = child;
      subscribers[length + lib$es6$promise$$internal$$FULFILLED] = onFulfillment;
      subscribers[length + lib$es6$promise$$internal$$REJECTED]  = onRejection;

      if (length === 0 && parent._state) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, parent);
      }
    }

    function lib$es6$promise$$internal$$publish(promise) {
      var subscribers = promise._subscribers;
      var settled = promise._state;

      if (subscribers.length === 0) { return; }

      var child, callback, detail = promise._result;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        if (child) {
          lib$es6$promise$$internal$$invokeCallback(settled, child, callback, detail);
        } else {
          callback(detail);
        }
      }

      promise._subscribers.length = 0;
    }

    function lib$es6$promise$$internal$$ErrorObject() {
      this.error = null;
    }

    var lib$es6$promise$$internal$$TRY_CATCH_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$tryCatch(callback, detail) {
      try {
        return callback(detail);
      } catch(e) {
        lib$es6$promise$$internal$$TRY_CATCH_ERROR.error = e;
        return lib$es6$promise$$internal$$TRY_CATCH_ERROR;
      }
    }

    function lib$es6$promise$$internal$$invokeCallback(settled, promise, callback, detail) {
      var hasCallback = lib$es6$promise$utils$$isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        value = lib$es6$promise$$internal$$tryCatch(callback, detail);

        if (value === lib$es6$promise$$internal$$TRY_CATCH_ERROR) {
          failed = true;
          error = value.error;
          value = null;
        } else {
          succeeded = true;
        }

        if (promise === value) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$cannotReturnOwn());
          return;
        }

      } else {
        value = detail;
        succeeded = true;
      }

      if (promise._state !== lib$es6$promise$$internal$$PENDING) {
        // noop
      } else if (hasCallback && succeeded) {
        lib$es6$promise$$internal$$resolve(promise, value);
      } else if (failed) {
        lib$es6$promise$$internal$$reject(promise, error);
      } else if (settled === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, value);
      } else if (settled === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, value);
      }
    }

    function lib$es6$promise$$internal$$initializePromise(promise, resolver) {
      try {
        resolver(function resolvePromise(value){
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function rejectPromise(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      } catch(e) {
        lib$es6$promise$$internal$$reject(promise, e);
      }
    }

    function lib$es6$promise$promise$all$$all(entries) {
      return new lib$es6$promise$enumerator$$default(this, entries).promise;
    }
    var lib$es6$promise$promise$all$$default = lib$es6$promise$promise$all$$all;
    function lib$es6$promise$promise$race$$race(entries) {
      /*jshint validthis:true */
      var Constructor = this;

      var promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (!lib$es6$promise$utils$$isArray(entries)) {
        lib$es6$promise$$internal$$reject(promise, new TypeError('You must pass an array to race.'));
        return promise;
      }

      var length = entries.length;

      function onFulfillment(value) {
        lib$es6$promise$$internal$$resolve(promise, value);
      }

      function onRejection(reason) {
        lib$es6$promise$$internal$$reject(promise, reason);
      }

      for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        lib$es6$promise$$internal$$subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
      }

      return promise;
    }
    var lib$es6$promise$promise$race$$default = lib$es6$promise$promise$race$$race;
    function lib$es6$promise$promise$reject$$reject(reason) {
      /*jshint validthis:true */
      var Constructor = this;
      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$reject(promise, reason);
      return promise;
    }
    var lib$es6$promise$promise$reject$$default = lib$es6$promise$promise$reject$$reject;

    var lib$es6$promise$promise$$counter = 0;

    function lib$es6$promise$promise$$needsResolver() {
      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    }

    function lib$es6$promise$promise$$needsNew() {
      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }

    var lib$es6$promise$promise$$default = lib$es6$promise$promise$$Promise;
    /**
      Promise objects represent the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise's eventual value or the reason
      why the promise cannot be fulfilled.

      Terminology
      -----------

      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
      - `thenable` is an object or function that defines a `then` method.
      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
      - `exception` is a value that is thrown using the throw statement.
      - `reason` is a value that indicates why a promise was rejected.
      - `settled` the final resting state of a promise, fulfilled or rejected.

      A promise can be in one of three states: pending, fulfilled, or rejected.

      Promises that are fulfilled have a fulfillment value and are in the fulfilled
      state.  Promises that are rejected have a rejection reason and are in the
      rejected state.  A fulfillment value is never a thenable.

      Promises can also be said to *resolve* a value.  If this value is also a
      promise, then the original promise's settled state will match the value's
      settled state.  So a promise that *resolves* a promise that rejects will
      itself reject, and a promise that *resolves* a promise that fulfills will
      itself fulfill.


      Basic Usage:
      ------------

      ```js
      var promise = new Promise(function(resolve, reject) {
        // on success
        resolve(value);

        // on failure
        reject(reason);
      });

      promise.then(function(value) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Advanced Usage:
      ---------------

      Promises shine when abstracting away asynchronous interactions such as
      `XMLHttpRequest`s.

      ```js
      function getJSON(url) {
        return new Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();

          xhr.open('GET', url);
          xhr.onreadystatechange = handler;
          xhr.responseType = 'json';
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

          function handler() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                resolve(this.response);
              } else {
                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
              }
            }
          };
        });
      }

      getJSON('/posts.json').then(function(json) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Unlike callbacks, promises are great composable primitives.

      ```js
      Promise.all([
        getJSON('/posts'),
        getJSON('/comments')
      ]).then(function(values){
        values[0] // => postsJSON
        values[1] // => commentsJSON

        return values;
      });
      ```

      @class Promise
      @param {function} resolver
      Useful for tooling.
      @constructor
    */
    function lib$es6$promise$promise$$Promise(resolver) {
      this._id = lib$es6$promise$promise$$counter++;
      this._state = undefined;
      this._result = undefined;
      this._subscribers = [];

      if (lib$es6$promise$$internal$$noop !== resolver) {
        typeof resolver !== 'function' && lib$es6$promise$promise$$needsResolver();
        this instanceof lib$es6$promise$promise$$Promise ? lib$es6$promise$$internal$$initializePromise(this, resolver) : lib$es6$promise$promise$$needsNew();
      }
    }

    lib$es6$promise$promise$$Promise.all = lib$es6$promise$promise$all$$default;
    lib$es6$promise$promise$$Promise.race = lib$es6$promise$promise$race$$default;
    lib$es6$promise$promise$$Promise.resolve = lib$es6$promise$promise$resolve$$default;
    lib$es6$promise$promise$$Promise.reject = lib$es6$promise$promise$reject$$default;
    lib$es6$promise$promise$$Promise._setScheduler = lib$es6$promise$asap$$setScheduler;
    lib$es6$promise$promise$$Promise._setAsap = lib$es6$promise$asap$$setAsap;
    lib$es6$promise$promise$$Promise._asap = lib$es6$promise$asap$$asap;

    lib$es6$promise$promise$$Promise.prototype = {
      constructor: lib$es6$promise$promise$$Promise,

    /**
      The primary way of interacting with a promise is through its `then` method,
      which registers callbacks to receive either a promise's eventual value or the
      reason why the promise cannot be fulfilled.

      ```js
      findUser().then(function(user){
        // user is available
      }, function(reason){
        // user is unavailable, and you are given the reason why
      });
      ```

      Chaining
      --------

      The return value of `then` is itself a promise.  This second, 'downstream'
      promise is resolved with the return value of the first promise's fulfillment
      or rejection handler, or rejected if the handler throws an exception.

      ```js
      findUser().then(function (user) {
        return user.name;
      }, function (reason) {
        return 'default name';
      }).then(function (userName) {
        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
        // will be `'default name'`
      });

      findUser().then(function (user) {
        throw new Error('Found user, but still unhappy');
      }, function (reason) {
        throw new Error('`findUser` rejected and we're unhappy');
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
      });
      ```
      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

      ```js
      findUser().then(function (user) {
        throw new PedagogicalException('Upstream error');
      }).then(function (value) {
        // never reached
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // The `PedgagocialException` is propagated all the way down to here
      });
      ```

      Assimilation
      ------------

      Sometimes the value you want to propagate to a downstream promise can only be
      retrieved asynchronously. This can be achieved by returning a promise in the
      fulfillment or rejection handler. The downstream promise will then be pending
      until the returned promise is settled. This is called *assimilation*.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // The user's comments are now available
      });
      ```

      If the assimliated promise rejects, then the downstream promise will also reject.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // If `findCommentsByAuthor` fulfills, we'll have the value here
      }, function (reason) {
        // If `findCommentsByAuthor` rejects, we'll have the reason here
      });
      ```

      Simple Example
      --------------

      Synchronous Example

      ```javascript
      var result;

      try {
        result = findResult();
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js
      findResult(function(result, err){
        if (err) {
          // failure
        } else {
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findResult().then(function(result){
        // success
      }, function(reason){
        // failure
      });
      ```

      Advanced Example
      --------------

      Synchronous Example

      ```javascript
      var author, books;

      try {
        author = findAuthor();
        books  = findBooksByAuthor(author);
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js

      function foundBooks(books) {

      }

      function failure(reason) {

      }

      findAuthor(function(author, err){
        if (err) {
          failure(err);
          // failure
        } else {
          try {
            findBoooksByAuthor(author, function(books, err) {
              if (err) {
                failure(err);
              } else {
                try {
                  foundBooks(books);
                } catch(reason) {
                  failure(reason);
                }
              }
            });
          } catch(error) {
            failure(err);
          }
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findAuthor().
        then(findBooksByAuthor).
        then(function(books){
          // found books
      }).catch(function(reason){
        // something went wrong
      });
      ```

      @method then
      @param {Function} onFulfilled
      @param {Function} onRejected
      Useful for tooling.
      @return {Promise}
    */
      then: lib$es6$promise$then$$default,

    /**
      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
      as the catch block of a try/catch statement.

      ```js
      function findAuthor(){
        throw new Error('couldn't find that author');
      }

      // synchronous
      try {
        findAuthor();
      } catch(reason) {
        // something went wrong
      }

      // async with promises
      findAuthor().catch(function(reason){
        // something went wrong
      });
      ```

      @method catch
      @param {Function} onRejection
      Useful for tooling.
      @return {Promise}
    */
      'catch': function(onRejection) {
        return this.then(null, onRejection);
      }
    };
    var lib$es6$promise$enumerator$$default = lib$es6$promise$enumerator$$Enumerator;
    function lib$es6$promise$enumerator$$Enumerator(Constructor, input) {
      this._instanceConstructor = Constructor;
      this.promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (Array.isArray(input)) {
        this._input     = input;
        this.length     = input.length;
        this._remaining = input.length;

        this._result = new Array(this.length);

        if (this.length === 0) {
          lib$es6$promise$$internal$$fulfill(this.promise, this._result);
        } else {
          this.length = this.length || 0;
          this._enumerate();
          if (this._remaining === 0) {
            lib$es6$promise$$internal$$fulfill(this.promise, this._result);
          }
        }
      } else {
        lib$es6$promise$$internal$$reject(this.promise, this._validationError());
      }
    }

    lib$es6$promise$enumerator$$Enumerator.prototype._validationError = function() {
      return new Error('Array Methods must be provided an Array');
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._enumerate = function() {
      var length  = this.length;
      var input   = this._input;

      for (var i = 0; this._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        this._eachEntry(input[i], i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
      var c = this._instanceConstructor;
      var resolve = c.resolve;

      if (resolve === lib$es6$promise$promise$resolve$$default) {
        var then = lib$es6$promise$$internal$$getThen(entry);

        if (then === lib$es6$promise$then$$default &&
            entry._state !== lib$es6$promise$$internal$$PENDING) {
          this._settledAt(entry._state, i, entry._result);
        } else if (typeof then !== 'function') {
          this._remaining--;
          this._result[i] = entry;
        } else if (c === lib$es6$promise$promise$$default) {
          var promise = new c(lib$es6$promise$$internal$$noop);
          lib$es6$promise$$internal$$handleMaybeThenable(promise, entry, then);
          this._willSettleAt(promise, i);
        } else {
          this._willSettleAt(new c(function(resolve) { resolve(entry); }), i);
        }
      } else {
        this._willSettleAt(resolve(entry), i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
      var promise = this.promise;

      if (promise._state === lib$es6$promise$$internal$$PENDING) {
        this._remaining--;

        if (state === lib$es6$promise$$internal$$REJECTED) {
          lib$es6$promise$$internal$$reject(promise, value);
        } else {
          this._result[i] = value;
        }
      }

      if (this._remaining === 0) {
        lib$es6$promise$$internal$$fulfill(promise, this._result);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
      var enumerator = this;

      lib$es6$promise$$internal$$subscribe(promise, undefined, function(value) {
        enumerator._settledAt(lib$es6$promise$$internal$$FULFILLED, i, value);
      }, function(reason) {
        enumerator._settledAt(lib$es6$promise$$internal$$REJECTED, i, reason);
      });
    };
    function lib$es6$promise$polyfill$$polyfill() {
      var local;

      if (typeof global !== 'undefined') {
          local = global;
      } else if (typeof self !== 'undefined') {
          local = self;
      } else {
          try {
              local = Function('return this')();
          } catch (e) {
              throw new Error('polyfill failed because global object is unavailable in this environment');
          }
      }

      var P = local.Promise;

      if (P && Object.prototype.toString.call(P.resolve()) === '[object Promise]' && !P.cast) {
        return;
      }

      local.Promise = lib$es6$promise$promise$$default;
    }
    var lib$es6$promise$polyfill$$default = lib$es6$promise$polyfill$$polyfill;

    var lib$es6$promise$umd$$ES6Promise = {
      'Promise': lib$es6$promise$promise$$default,
      'polyfill': lib$es6$promise$polyfill$$default
    };

    /* global define:true module:true window: true */
    if (typeof define === 'function' && define['amd']) {
      define(function() { return lib$es6$promise$umd$$ES6Promise; });
    } else if (typeof module !== 'undefined' && module['exports']) {
      module['exports'] = lib$es6$promise$umd$$ES6Promise;
    } else if (typeof this !== 'undefined') {
      this['ES6Promise'] = lib$es6$promise$umd$$ES6Promise;
    }

    lib$es6$promise$polyfill$$default();
}).call(this);


}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"_process":28}],2:[function(require,module,exports){
'use strict';
/* eslint-disable no-unused-vars */
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (e) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (Object.getOwnPropertySymbols) {
			symbols = Object.getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],3:[function(require,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = require('./util.js');
var WakeLock = require('./wakelock.js');

// Start at a higher number to reduce chance of conflict.
var nextDisplayId = 1000;

/**
 * The base class for all VR displays.
 */
function VRDisplay() {
  this.isPolyfilled = true;
  this.displayId = nextDisplayId++;
  this.displayName = 'webvr-polyfill displayName';

  this.isConnected = true;
  this.isPresenting = false;
  this.capabilities = {
    hasPosition: false,
    hasOrientation: false,
    hasExternalDisplay: false,
    canPresent: false
  };
  this.stageParameters = null;

  // "Private" members.
  this.waitingForPresent_ = false;
  this.layer_ = null;

  this.fullscreenElement_ = null;
  this.fullscreenWrapper_ = null;

  this.fullscreenEventTarget_ = null;
  this.fullscreenChangeHandler_ = null;
  this.fullscreenErrorHandler_ = null;

  this.wakelock_ = new WakeLock();
}

VRDisplay.prototype.getPose = function() {
  // TODO: Technically this should retain it's value for the duration of a frame
  // but I doubt that's practical to do in javascript.
  return this.getImmediatePose();
};

VRDisplay.prototype.requestAnimationFrame = function(callback) {
  return window.requestAnimationFrame(callback);
};

VRDisplay.prototype.cancelAnimationFrame = function(id) {
  return window.cancelAnimationFrame(id);
};

VRDisplay.prototype.wrapForFullscreen = function(element) {
  if (Util.isIOS())
    return element;

  if (!this.fullscreenWrapper_) {
    this.fullscreenWrapper_ = document.createElement('div');
    this.fullscreenWrapper_.classList.add('webvr-polyfill-fullscreen-wrapper');
    // Make sure the wrapper takes the full screen. Without this, there is a
    // white line at the bottom.
    this.fullscreenWrapper_.style.width = '100%';
    this.fullscreenWrapper_.style.height = '100%';
  }

  if (this.fullscreenElement_ == element)
    return this.fullscreenWrapper_;

  // Remove any previously applied wrappers
  this.removeFullscreenWrapper();

  this.fullscreenElement_ = element;
  var parent = this.fullscreenElement_.parentElement;
  parent.insertBefore(this.fullscreenWrapper_, this.fullscreenElement_);
  parent.removeChild(this.fullscreenElement_);
  this.fullscreenWrapper_.insertBefore(this.fullscreenElement_, this.fullscreenWrapper_.firstChild);

  return this.fullscreenWrapper_;
};

VRDisplay.prototype.removeFullscreenWrapper = function() {
  if (!this.fullscreenElement_)
    return;

  var element = this.fullscreenElement_;
  this.fullscreenElement_ = null;

  var parent = this.fullscreenWrapper_.parentElement;
  this.fullscreenWrapper_.removeChild(element);
  parent.insertBefore(element, this.fullscreenWrapper_);
  parent.removeChild(this.fullscreenWrapper_);

  return element;
};

VRDisplay.prototype.requestPresent = function(layer) {
  var self = this;
  this.layer_ = layer;

  return new Promise(function(resolve, reject) {
    if (!self.capabilities.canPresent) {
      reject(new Error('VRDisplay is not capable of presenting.'));
      return;
    }

    self.waitingForPresent_ = false;
    if (layer && layer.source) {
      var fullscreenElement = self.wrapForFullscreen(layer.source);

      function onFullscreenChange() {
        var actualFullscreenElement = Util.getFullscreenElement();

        self.isPresenting = (fullscreenElement === actualFullscreenElement);
        self.fireVRDisplayPresentChange_();
        if (self.isPresenting) {
          if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape-primary');
          }
          self.waitingForPresent_ = false;
          self.beginPresent_();
          resolve();
        } else {
          if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          }
          self.removeFullscreenWrapper();
          self.wakelock_.release();
          self.endPresent_();
          self.removeFullscreenListeners_();
        }
      }
      function onFullscreenError() {
        if (!self.waitingForPresent_) {
          return;
        }

        self.removeFullscreenWrapper();
        self.removeFullscreenListeners_();

        self.wakelock_.release();
        self.waitingForPresent_ = false;
        self.isPresenting = false;

        reject(new Error('Unable to present.'));
      }

      self.addFullscreenListeners_(fullscreenElement,
          onFullscreenChange, onFullscreenError);

      if (Util.requestFullscreen(fullscreenElement)) {
        self.wakelock_.request();
        self.waitingForPresent_ = true;
      } else if (Util.isIOS()) {
        // *sigh* Just fake it.
        self.wakelock_.request();
        self.isPresenting = true;
        self.fireVRDisplayPresentChange_();
        self.beginPresent_();
        resolve();
      }
    }

    if (!self.waitingForPresent_ && !Util.isIOS()) {
      Util.exitFullscreen();
      reject(new Error('Unable to present.'));
    }
  });
};

VRDisplay.prototype.exitPresent = function() {
  var wasPresenting = this.isPresenting;
  var self = this;
  this.isPresenting = false;
  this.layer_ = null;
  this.wakelock_.release();

  return new Promise(function(resolve, reject) {
    if (wasPresenting) {
      if (!Util.exitFullscreen() && Util.isIOS()) {
        self.fireVRDisplayPresentChange_();
        self.endPresent_();
      }

      self.removeFullscreenWrapper();

      resolve();
    } else {
      reject(new Error('Was not presenting to VRDisplay.'));
    }
  });
};

// This returns an array because future versions of the spec may accept multiple
// layers in requestPresent, and it's easier to overload function parameters
// than it is return types.
VRDisplay.prototype.getLayers = function() {
  if (this.layer_) {
    return [this.layer_];
  }
  return null;
};

VRDisplay.prototype.fireVRDisplayPresentChange_ = function() {
  var event = new CustomEvent('vrdisplaypresentchange', {detail: {vrdisplay: this}});
  window.dispatchEvent(event);
};

VRDisplay.prototype.addFullscreenListeners_ = function(element, changeHandler, errorHandler) {
  this.removeFullscreenListeners_();

  this.fullscreenEventTarget_ = element;
  this.fullscreenChangeHandler_ = changeHandler;
  this.fullscreenErrorHandler_ = errorHandler;

  if (changeHandler) {
    element.addEventListener('fullscreenchange', changeHandler, false);
    element.addEventListener('webkitfullscreenchange', changeHandler, false);
    document.addEventListener('mozfullscreenchange', changeHandler, false);
    element.addEventListener('msfullscreenchange', changeHandler, false);
  }

  if (errorHandler) {
    element.addEventListener('fullscreenerror', errorHandler, false);
    element.addEventListener('webkitfullscreenerror', errorHandler, false);
    document.addEventListener('mozfullscreenerror', errorHandler, false);
    element.addEventListener('msfullscreenerror', errorHandler, false);
  }
};

VRDisplay.prototype.removeFullscreenListeners_ = function() {
  if (!this.fullscreenEventTarget_)
    return;

  var element = this.fullscreenEventTarget_;

  if (this.fullscreenChangeHandler_) {
    var changeHandler = this.fullscreenChangeHandler_;
    element.removeEventListener('fullscreenchange', changeHandler, false);
    element.removeEventListener('webkitfullscreenchange', changeHandler, false);
    document.removeEventListener('mozfullscreenchange', changeHandler, false);
    element.removeEventListener('msfullscreenchange', changeHandler, false);
  }

  if (this.fullscreenErrorHandler_) {
    var errorHandler = this.fullscreenErrorHandler_;
    element.removeEventListener('fullscreenerror', errorHandler, false);
    element.removeEventListener('webkitfullscreenerror', errorHandler, false);
    document.removeEventListener('mozfullscreenerror', errorHandler, false);
    element.removeEventListener('msfullscreenerror', errorHandler, false);
  }

  this.fullscreenEventTarget_ = null;
  this.fullscreenChangeHandler_ = null;
  this.fullscreenErrorHandler_ = null;
};

VRDisplay.prototype.beginPresent_ = function() {
  // Override to add custom behavior when presentation begins.
};

VRDisplay.prototype.endPresent_ = function() {
  // Override to add custom behavior when presentation ends.
};

VRDisplay.prototype.submitFrame = function(pose) {
  // Override to add custom behavior for frame submission.
};

VRDisplay.prototype.getEyeParameters = function(whichEye) {
  // Override to return accurate eye parameters is canPresent is true.
  return null;
};

/*
 * Deprecated classes
 */

/**
 * The base class for all VR devices. (Deprecated)
 */
function VRDevice() {
  this.isPolyfilled = true;
  this.hardwareUnitId = 'webvr-polyfill hardwareUnitId';
  this.deviceId = 'webvr-polyfill deviceId';
  this.deviceName = 'webvr-polyfill deviceName';
}

/**
 * The base class for all VR HMD devices. (Deprecated)
 */
function HMDVRDevice() {
}
HMDVRDevice.prototype = new VRDevice();

/**
 * The base class for all VR position sensor devices. (Deprecated)
 */
function PositionSensorVRDevice() {
}
PositionSensorVRDevice.prototype = new VRDevice();

module.exports.VRDisplay = VRDisplay;
module.exports.VRDevice = VRDevice;
module.exports.HMDVRDevice = HMDVRDevice;
module.exports.PositionSensorVRDevice = PositionSensorVRDevice;

},{"./util.js":24,"./wakelock.js":26}],4:[function(require,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var CardboardUI = require('./cardboard-ui.js');
var Util = require('./util.js');
var WGLUPreserveGLState = require('./deps/wglu-preserve-state.js');

var distortionVS = [
  'attribute vec2 position;',
  'attribute vec3 texCoord;',

  'varying vec2 vTexCoord;',

  'uniform vec4 viewportOffsetScale[2];',

  'void main() {',
  '  vec4 viewport = viewportOffsetScale[int(texCoord.z)];',
  '  vTexCoord = (texCoord.xy * viewport.zw) + viewport.xy;',
  '  gl_Position = vec4( position, 1.0, 1.0 );',
  '}',
].join('\n');

var distortionFS = [
  'precision mediump float;',
  'uniform sampler2D diffuse;',

  'varying vec2 vTexCoord;',

  'void main() {',
  '  gl_FragColor = texture2D(diffuse, vTexCoord);',
  '}',
].join('\n');

/**
 * A mesh-based distorter.
 */
function CardboardDistorter(gl) {
  this.gl = gl;
  this.ctxAttribs = gl.getContextAttributes();

  this.meshWidth = 20;
  this.meshHeight = 20;

  this.bufferScale = WebVRConfig.BUFFER_SCALE ? WebVRConfig.BUFFER_SCALE : 1.0;

  this.bufferWidth = gl.drawingBufferWidth;
  this.bufferHeight = gl.drawingBufferHeight;

  // Patching support
  this.realBindFramebuffer = gl.bindFramebuffer;
  this.realEnable = gl.enable;
  this.realDisable = gl.disable;
  this.realColorMask = gl.colorMask;
  this.realClearColor = gl.clearColor;
  this.realViewport = gl.viewport;

  if (!Util.isIOS()) {
    this.realCanvasWidth = Object.getOwnPropertyDescriptor(gl.canvas.__proto__, 'width');
    this.realCanvasHeight = Object.getOwnPropertyDescriptor(gl.canvas.__proto__, 'height');
  }

  this.isPatched = false;

  // State tracking
  this.lastBoundFramebuffer = null;
  this.cullFace = false;
  this.depthTest = false;
  this.blend = false;
  this.scissorTest = false;
  this.stencilTest = false;
  this.viewport = [0, 0, 0, 0];
  this.colorMask = [true, true, true, true];
  this.clearColor = [0, 0, 0, 0];

  this.attribs = {
    position: 0,
    texCoord: 1
  };
  this.program = Util.linkProgram(gl, distortionVS, distortionFS, this.attribs);
  this.uniforms = Util.getProgramUniforms(gl, this.program);

  this.viewportOffsetScale = new Float32Array(8);
  this.setTextureBounds();

  this.vertexBuffer = gl.createBuffer();
  this.indexBuffer = gl.createBuffer();
  this.indexCount = 0;

  this.renderTarget = gl.createTexture();
  this.framebuffer = gl.createFramebuffer();

  this.depthStencilBuffer = null;
  this.depthBuffer = null;
  this.stencilBuffer = null;

  if (this.ctxAttribs.depth && this.ctxAttribs.stencil) {
    this.depthStencilBuffer = gl.createRenderbuffer();
  } else if (this.ctxAttribs.depth) {
    this.depthBuffer = gl.createRenderbuffer();
  } else if (this.ctxAttribs.stencil) {
    this.stencilBuffer = gl.createRenderbuffer();
  }

  this.patch();

  this.onResize();

  this.cardboardUI = new CardboardUI(gl);
};

/**
 * Tears down all the resources created by the distorter and removes any
 * patches.
 */
CardboardDistorter.prototype.destroy = function() {
  var gl = this.gl;

  this.unpatch();

  gl.deleteProgram(this.program);
  gl.deleteBuffer(this.vertexBuffer);
  gl.deleteBuffer(this.indexBuffer);
  gl.deleteTexture(this.renderTarget);
  gl.deleteFramebuffer(this.framebuffer);
  if (this.depthStencilBuffer) {
    gl.deleteRenderbuffer(this.depthStencilBuffer);
  }
  if (this.depthBuffer) {
    gl.deleteRenderbuffer(this.depthBuffer);
  }
  if (this.stencilBuffer) {
    gl.deleteRenderbuffer(this.stencilBuffer);
  }

  this.cardboardUI.destroy();
};


/**
 * Resizes the backbuffer to match the canvas width and height.
 */
CardboardDistorter.prototype.onResize = function() {
  var gl = this.gl;
  var self = this;

  var glState = [
    gl.RENDERBUFFER_BINDING,
    gl.TEXTURE_BINDING_2D, gl.TEXTURE0
  ];

  WGLUPreserveGLState(gl, glState, function(gl) {
    // Bind real backbuffer and clear it once. We don't need to clear it again
    // after that because we're overwriting the same area every frame.
    self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, null);

    // Put things in a good state
    if (self.scissorTest) { self.realDisable.call(gl, gl.SCISSOR_TEST); }
    self.realColorMask.call(gl, true, true, true, true);
    self.realViewport.call(gl, 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    self.realClearColor.call(gl, 0, 0, 0, 1);

    gl.clear(gl.COLOR_BUFFER_BIT);

    // Now bind and resize the fake backbuffer
    self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, self.framebuffer);

    gl.bindTexture(gl.TEXTURE_2D, self.renderTarget);
    gl.texImage2D(gl.TEXTURE_2D, 0, self.ctxAttribs.alpha ? gl.RGBA : gl.RGB,
        self.bufferWidth, self.bufferHeight, 0,
        self.ctxAttribs.alpha ? gl.RGBA : gl.RGB, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, self.renderTarget, 0);

    if (self.ctxAttribs.depth && self.ctxAttribs.stencil) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, self.depthStencilBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL,
          self.bufferWidth, self.bufferHeight);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT,
          gl.RENDERBUFFER, self.depthStencilBuffer);
    } else if (self.ctxAttribs.depth) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, self.depthBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16,
          self.bufferWidth, self.bufferHeight);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
          gl.RENDERBUFFER, self.depthBuffer);
    } else if (self.ctxAttribs.stencil) {
      gl.bindRenderbuffer(gl.RENDERBUFFER, self.stencilBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.STENCIL_INDEX8,
          self.bufferWidth, self.bufferHeight);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.STENCIL_ATTACHMENT,
          gl.RENDERBUFFER, self.stencilBuffer);
    }

    if (!gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
      console.error('Framebuffer incomplete!');
    }

    self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, self.lastBoundFramebuffer);

    if (self.scissorTest) { self.realEnable.call(gl, gl.SCISSOR_TEST); }

    self.realColorMask.apply(gl, self.colorMask);
    self.realViewport.apply(gl, self.viewport);
    self.realClearColor.apply(gl, self.clearColor);
  });

  if (this.cardboardUI) {
    this.cardboardUI.onResize();
  }
};

CardboardDistorter.prototype.patch = function() {
  if (this.isPatched) {
    return;
  }

  var self = this;
  var canvas = this.gl.canvas;
  var gl = this.gl;

  if (!Util.isIOS()) {
    canvas.width = Util.getScreenWidth() * this.bufferScale;
    canvas.height = Util.getScreenHeight() * this.bufferScale;

    Object.defineProperty(canvas, 'width', {
      configurable: true,
      enumerable: true,
      get: function() {
        return self.bufferWidth;
      },
      set: function(value) {
        self.bufferWidth = value;
        self.onResize();
      }
    });

    Object.defineProperty(canvas, 'height', {
      configurable: true,
      enumerable: true,
      get: function() {
        return self.bufferHeight;
      },
      set: function(value) {
        self.bufferHeight = value;
        self.onResize();
      }
    });
  }

  this.lastBoundFramebuffer = gl.getParameter(gl.FRAMEBUFFER_BINDING);

  if (this.lastBoundFramebuffer == null) {
    this.lastBoundFramebuffer = this.framebuffer;
    this.gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
  }

  this.gl.bindFramebuffer = function(target, framebuffer) {
    self.lastBoundFramebuffer = framebuffer ? framebuffer : self.framebuffer;
    // Silently make calls to bind the default framebuffer bind ours instead.
    self.realBindFramebuffer.call(gl, target, self.lastBoundFramebuffer);
  };

  this.cullFace = gl.getParameter(gl.CULL_FACE);
  this.depthTest = gl.getParameter(gl.DEPTH_TEST);
  this.blend = gl.getParameter(gl.BLEND);
  this.scissorTest = gl.getParameter(gl.SCISSOR_TEST);
  this.stencilTest = gl.getParameter(gl.STENCIL_TEST);

  gl.enable = function(pname) {
    switch (pname) {
      case gl.CULL_FACE: self.cullFace = true; break;
      case gl.DEPTH_TEST: self.depthTest = true; break;
      case gl.BLEND: self.blend = true; break;
      case gl.SCISSOR_TEST: self.scissorTest = true; break;
      case gl.STENCIL_TEST: self.stencilTest = true; break;
    }
    self.realEnable.call(gl, pname);
  };

  gl.disable = function(pname) {
    switch (pname) {
      case gl.CULL_FACE: self.cullFace = false; break;
      case gl.DEPTH_TEST: self.depthTest = false; break;
      case gl.BLEND: self.blend = false; break;
      case gl.SCISSOR_TEST: self.scissorTest = false; break;
      case gl.STENCIL_TEST: self.stencilTest = false; break;
    }
    self.realDisable.call(gl, pname);
  };

  this.colorMask = gl.getParameter(gl.COLOR_WRITEMASK);
  gl.colorMask = function(r, g, b, a) {
    self.colorMask[0] = r;
    self.colorMask[1] = g;
    self.colorMask[2] = b;
    self.colorMask[3] = a;
    self.realColorMask.call(gl, r, g, b, a);
  };

  this.clearColor = gl.getParameter(gl.COLOR_CLEAR_VALUE);
  gl.clearColor = function(r, g, b, a) {
    self.clearColor[0] = r;
    self.clearColor[1] = g;
    self.clearColor[2] = b;
    self.clearColor[3] = a;
    self.realClearColor.call(gl, r, g, b, a);
  };

  this.viewport = gl.getParameter(gl.VIEWPORT);
  gl.viewport = function(x, y, w, h) {
    self.viewport[0] = x;
    self.viewport[1] = y;
    self.viewport[2] = w;
    self.viewport[3] = h;
    self.realViewport.call(gl, x, y, w, h);
  };

  this.isPatched = true;
};

CardboardDistorter.prototype.unpatch = function() {
  if (!this.isPatched) {
    return;
  }

  var gl = this.gl;
  var canvas = this.gl.canvas;

  if (!Util.isIOS()) {
    Object.defineProperty(canvas, 'width', this.realCanvasWidth);
    Object.defineProperty(canvas, 'height', this.realCanvasHeight);
  }
  canvas.width = this.bufferWidth;
  canvas.height = this.bufferHeight;

  gl.bindFramebuffer = this.realBindFramebuffer;
  gl.enable = this.realEnable;
  gl.disable = this.realDisable;
  gl.colorMask = this.realColorMask;
  gl.clearColor = this.realClearColor;
  gl.viewport = this.realViewport;

  // Check to see if our fake backbuffer is bound and bind the real backbuffer
  // if that's the case.
  if (this.lastBoundFramebuffer == this.framebuffer) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  this.isPatched = false;
};

CardboardDistorter.prototype.setTextureBounds = function(leftBounds, rightBounds) {
  if (!leftBounds) {
    leftBounds = [0, 0, 0.5, 1];
  }

  if (!rightBounds) {
    rightBounds = [0.5, 0, 0.5, 1];
  }

  // Left eye
  this.viewportOffsetScale[0] = leftBounds[0]; // X
  this.viewportOffsetScale[1] = leftBounds[1]; // Y
  this.viewportOffsetScale[2] = leftBounds[2]; // Width
  this.viewportOffsetScale[3] = leftBounds[3]; // Height

  // Right eye
  this.viewportOffsetScale[4] = rightBounds[0]; // X
  this.viewportOffsetScale[5] = rightBounds[1]; // Y
  this.viewportOffsetScale[6] = rightBounds[2]; // Width
  this.viewportOffsetScale[7] = rightBounds[3]; // Height
};

/**
 * Performs distortion pass on the injected backbuffer, rendering it to the real
 * backbuffer.
 */
CardboardDistorter.prototype.submitFrame = function() {
  var gl = this.gl;
  var self = this;

  var glState = [];

  if (!WebVRConfig.DIRTY_SUBMIT_FRAME_BINDINGS) {
    glState.push(
      gl.CURRENT_PROGRAM,
      gl.ARRAY_BUFFER_BINDING,
      gl.ELEMENT_ARRAY_BUFFER_BINDING,
      gl.TEXTURE_BINDING_2D, gl.TEXTURE0
    );
  }

  WGLUPreserveGLState(gl, glState, function(gl) {
    // Bind the real default framebuffer
    self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, null);

    // Make sure the GL state is in a good place
    if (self.cullFace) { self.realDisable.call(gl, gl.CULL_FACE); }
    if (self.depthTest) { self.realDisable.call(gl, gl.DEPTH_TEST); }
    if (self.blend) { self.realDisable.call(gl, gl.BLEND); }
    if (self.scissorTest) { self.realDisable.call(gl, gl.SCISSOR_TEST); }
    if (self.stencilTest) { self.realDisable.call(gl, gl.STENCIL_TEST); }
    self.realColorMask.call(gl, true, true, true, true);
    self.realViewport.call(gl, 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    // If the backbuffer has an alpha channel clear every frame so the page
    // doesn't show through.
    if (self.ctxAttribs.alpha || Util.isIOS()) {
      self.realClearColor.call(gl, 0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    // Bind distortion program and mesh
    gl.useProgram(self.program);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.indexBuffer);

    gl.bindBuffer(gl.ARRAY_BUFFER, self.vertexBuffer);
    gl.enableVertexAttribArray(self.attribs.position);
    gl.enableVertexAttribArray(self.attribs.texCoord);
    gl.vertexAttribPointer(self.attribs.position, 2, gl.FLOAT, false, 20, 0);
    gl.vertexAttribPointer(self.attribs.texCoord, 3, gl.FLOAT, false, 20, 8);

    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(self.uniforms.diffuse, 0);
    gl.bindTexture(gl.TEXTURE_2D, self.renderTarget);

    gl.uniform4fv(self.uniforms.viewportOffsetScale, self.viewportOffsetScale);

    // Draws both eyes
    gl.drawElements(gl.TRIANGLES, self.indexCount, gl.UNSIGNED_SHORT, 0);

    self.cardboardUI.renderNoState();

    // Bind the fake default framebuffer again
    self.realBindFramebuffer.call(self.gl, gl.FRAMEBUFFER, self.framebuffer);

    // If preserveDrawingBuffer == false clear the framebuffer
    if (!self.ctxAttribs.preserveDrawingBuffer) {
      self.realClearColor.call(gl, 0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    if (!WebVRConfig.DIRTY_SUBMIT_FRAME_BINDINGS) {
      self.realBindFramebuffer.call(gl, gl.FRAMEBUFFER, self.lastBoundFramebuffer);
    }

    // Restore state
    if (self.cullFace) { self.realEnable.call(gl, gl.CULL_FACE); }
    if (self.depthTest) { self.realEnable.call(gl, gl.DEPTH_TEST); }
    if (self.blend) { self.realEnable.call(gl, gl.BLEND); }
    if (self.scissorTest) { self.realEnable.call(gl, gl.SCISSOR_TEST); }
    if (self.stencilTest) { self.realEnable.call(gl, gl.STENCIL_TEST); }

    self.realColorMask.apply(gl, self.colorMask);
    self.realViewport.apply(gl, self.viewport);
    if (self.ctxAttribs.alpha || !self.ctxAttribs.preserveDrawingBuffer) {
      self.realClearColor.apply(gl, self.clearColor);
    }
  });

  // Workaround for the fact that Safari doesn't allow us to patch the canvas
  // width and height correctly. After each submit frame check to see what the
  // real backbuffer size has been set to and resize the fake backbuffer size
  // to match.
  if (Util.isIOS()) {
    var canvas = gl.canvas;
    if (canvas.width != self.bufferWidth || canvas.height != self.bufferHeight) {
      self.bufferWidth = canvas.width;
      self.bufferHeight = canvas.height;
      self.onResize();
    }
  }
};

/**
 * Call when the deviceInfo has changed. At this point we need
 * to re-calculate the distortion mesh.
 */
CardboardDistorter.prototype.updateDeviceInfo = function(deviceInfo) {
  var gl = this.gl;
  var self = this;

  var glState = [gl.ARRAY_BUFFER_BINDING, gl.ELEMENT_ARRAY_BUFFER_BINDING];
  WGLUPreserveGLState(gl, glState, function(gl) {
    var vertices = self.computeMeshVertices_(self.meshWidth, self.meshHeight, deviceInfo);
    gl.bindBuffer(gl.ARRAY_BUFFER, self.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Indices don't change based on device parameters, so only compute once.
    if (!self.indexCount) {
      var indices = self.computeMeshIndices_(self.meshWidth, self.meshHeight);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, self.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
      self.indexCount = indices.length;
    }
  });
};

/**
 * Build the distortion mesh vertices.
 * Based on code from the Unity cardboard plugin.
 */
CardboardDistorter.prototype.computeMeshVertices_ = function(width, height, deviceInfo) {
  var vertices = new Float32Array(2 * width * height * 5);

  var lensFrustum = deviceInfo.getLeftEyeVisibleTanAngles();
  var noLensFrustum = deviceInfo.getLeftEyeNoLensTanAngles();
  var viewport = deviceInfo.getLeftEyeVisibleScreenRect(noLensFrustum);
  var vidx = 0;
  var iidx = 0;
  for (var e = 0; e < 2; e++) {
    for (var j = 0; j < height; j++) {
      for (var i = 0; i < width; i++, vidx++) {
        var u = i / (width - 1);
        var v = j / (height - 1);

        // Grid points regularly spaced in StreoScreen, and barrel distorted in
        // the mesh.
        var s = u;
        var t = v;
        var x = Util.lerp(lensFrustum[0], lensFrustum[2], u);
        var y = Util.lerp(lensFrustum[3], lensFrustum[1], v);
        var d = Math.sqrt(x * x + y * y);
        var r = deviceInfo.distortion.distortInverse(d);
        var p = x * r / d;
        var q = y * r / d;
        u = (p - noLensFrustum[0]) / (noLensFrustum[2] - noLensFrustum[0]);
        v = (q - noLensFrustum[3]) / (noLensFrustum[1] - noLensFrustum[3]);

        // Convert u,v to mesh screen coordinates.
        var aspect = deviceInfo.device.widthMeters / deviceInfo.device.heightMeters;

        // FIXME: The original Unity plugin multiplied U by the aspect ratio
        // and didn't multiply either value by 2, but that seems to get it
        // really close to correct looking for me. I hate this kind of "Don't
        // know why it works" code though, and wold love a more logical
        // explanation of what needs to happen here.
        u = (viewport.x + u * viewport.width - 0.5) * 2.0; //* aspect;
        v = (viewport.y + v * viewport.height - 0.5) * 2.0;

        vertices[(vidx * 5) + 0] = u; // position.x
        vertices[(vidx * 5) + 1] = v; // position.y
        vertices[(vidx * 5) + 2] = s; // texCoord.x
        vertices[(vidx * 5) + 3] = t; // texCoord.y
        vertices[(vidx * 5) + 4] = e; // texCoord.z (viewport index)
      }
    }
    var w = lensFrustum[2] - lensFrustum[0];
    lensFrustum[0] = -(w + lensFrustum[0]);
    lensFrustum[2] = w - lensFrustum[2];
    w = noLensFrustum[2] - noLensFrustum[0];
    noLensFrustum[0] = -(w + noLensFrustum[0]);
    noLensFrustum[2] = w - noLensFrustum[2];
    viewport.x = 1 - (viewport.x + viewport.width);
  }
  return vertices;
}

/**
 * Build the distortion mesh indices.
 * Based on code from the Unity cardboard plugin.
 */
CardboardDistorter.prototype.computeMeshIndices_ = function(width, height) {
  var indices = new Uint16Array(2 * (width - 1) * (height - 1) * 6);
  var halfwidth = width / 2;
  var halfheight = height / 2;
  var vidx = 0;
  var iidx = 0;
  for (var e = 0; e < 2; e++) {
    for (var j = 0; j < height; j++) {
      for (var i = 0; i < width; i++, vidx++) {
        if (i == 0 || j == 0)
          continue;
        // Build a quad.  Lower right and upper left quadrants have quads with
        // the triangle diagonal flipped to get the vignette to interpolate
        // correctly.
        if ((i <= halfwidth) == (j <= halfheight)) {
          // Quad diagonal lower left to upper right.
          indices[iidx++] = vidx;
          indices[iidx++] = vidx - width - 1;
          indices[iidx++] = vidx - width;
          indices[iidx++] = vidx - width - 1;
          indices[iidx++] = vidx;
          indices[iidx++] = vidx - 1;
        } else {
          // Quad diagonal upper left to lower right.
          indices[iidx++] = vidx - 1;
          indices[iidx++] = vidx - width;
          indices[iidx++] = vidx;
          indices[iidx++] = vidx - width;
          indices[iidx++] = vidx - 1;
          indices[iidx++] = vidx - width - 1;
        }
      }
    }
  }
  return indices;
};

CardboardDistorter.prototype.getOwnPropertyDescriptor_ = function(proto, attrName) {
  var descriptor = Object.getOwnPropertyDescriptor(proto, attrName);
  // In some cases (ahem... Safari), the descriptor returns undefined get and
  // set fields. In this case, we need to create a synthetic property
  // descriptor. This works around some of the issues in
  // https://github.com/borismus/webvr-polyfill/issues/46
  if (descriptor.get === undefined || descriptor.set === undefined) {
    descriptor.configurable = true;
    descriptor.enumerable = true;
    descriptor.get = function() {
      return this.getAttribute(attrName);
    };
    descriptor.set = function(val) {
      this.setAttribute(attrName, val);
    };
  }
  return descriptor;
};

module.exports = CardboardDistorter;

},{"./cardboard-ui.js":5,"./deps/wglu-preserve-state.js":7,"./util.js":24}],5:[function(require,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = require('./util.js');
var WGLUPreserveGLState = require('./deps/wglu-preserve-state.js');

var uiVS = [
  'attribute vec2 position;',

  'uniform mat4 projectionMat;',

  'void main() {',
  '  gl_Position = projectionMat * vec4( position, -1.0, 1.0 );',
  '}',
].join('\n');

var uiFS = [
  'precision mediump float;',

  'uniform vec4 color;',

  'void main() {',
  '  gl_FragColor = color;',
  '}',
].join('\n');

var DEG2RAD = Math.PI/180.0;

// The gear has 6 identical sections, each spanning 60 degrees.
var kAnglePerGearSection = 60;

// Half-angle of the span of the outer rim.
var kOuterRimEndAngle = 12;

// Angle between the middle of the outer rim and the start of the inner rim.
var kInnerRimBeginAngle = 20;

// Distance from center to outer rim, normalized so that the entire model
// fits in a [-1, 1] x [-1, 1] square.
var kOuterRadius = 1;

// Distance from center to depressed rim, in model units.
var kMiddleRadius = 0.75;

// Radius of the inner hollow circle, in model units.
var kInnerRadius = 0.3125;

// Center line thickness in DP.
var kCenterLineThicknessDp = 4;

// Button width in DP.
var kButtonWidthDp = 28;

// Factor to scale the touch area that responds to the touch.
var kTouchSlopFactor = 1.5;

var Angles = [
  0, kOuterRimEndAngle, kInnerRimBeginAngle,
  kAnglePerGearSection - kInnerRimBeginAngle,
  kAnglePerGearSection - kOuterRimEndAngle
];

/**
 * Renders the alignment line and "options" gear. It is assumed that the canvas
 * this is rendered into covers the entire screen (or close to it.)
 */
function CardboardUI(gl) {
  this.gl = gl;

  this.attribs = {
    position: 0
  };
  this.program = Util.linkProgram(gl, uiVS, uiFS, this.attribs);
  this.uniforms = Util.getProgramUniforms(gl, this.program);

  this.vertexBuffer = gl.createBuffer();
  this.gearOffset = 0;
  this.gearVertexCount = 0;
  this.arrowOffset = 0;
  this.arrowVertexCount = 0;

  this.projMat = new Float32Array(16);

  this.listener = null;

  this.onResize();
};

/**
 * Tears down all the resources created by the UI renderer.
 */
CardboardUI.prototype.destroy = function() {
  var gl = this.gl;

  if (this.listener) {
    gl.canvas.removeEventListener('click', this.listener, false);
  }

  gl.deleteProgram(this.program);
  gl.deleteBuffer(this.vertexBuffer);
};

/**
 * Adds a listener to clicks on the gear and back icons
 */
CardboardUI.prototype.listen = function(optionsCallback, backCallback) {
  var canvas = this.gl.canvas;
  this.listener = function(event) {
    var midline = canvas.clientWidth / 2;
    var buttonSize = kButtonWidthDp * kTouchSlopFactor;
    // Check to see if the user clicked on (or around) the gear icon
    if (event.clientX > midline - buttonSize &&
        event.clientX < midline + buttonSize &&
        event.clientY > canvas.clientHeight - buttonSize) {
      optionsCallback(event);
    }
    // Check to see if the user clicked on (or around) the back icon
    else if (event.clientX < buttonSize && event.clientY < buttonSize) {
      backCallback(event);
    }
  };
  canvas.addEventListener('click', this.listener, false);
};

/**
 * Builds the UI mesh.
 */
CardboardUI.prototype.onResize = function() {
  var gl = this.gl;
  var self = this;

  var glState = [
    gl.ARRAY_BUFFER_BINDING
  ];

  WGLUPreserveGLState(gl, glState, function(gl) {
    var vertices = [];

    var midline = gl.drawingBufferWidth / 2;

    // Assumes your canvas width and height is scaled proportionately.
    // TODO(smus): The following causes buttons to become huge on iOS, but seems
    // like the right thing to do. For now, added a hack. But really, investigate why.
    var dps = (gl.drawingBufferWidth / (screen.width * window.devicePixelRatio));
    if (!Util.isIOS()) {
      dps *= window.devicePixelRatio;
    }

    var lineWidth = kCenterLineThicknessDp * dps / 2;
    var buttonSize = kButtonWidthDp * kTouchSlopFactor * dps;
    var buttonScale = kButtonWidthDp * dps / 2;
    var buttonBorder = ((kButtonWidthDp * kTouchSlopFactor) - kButtonWidthDp) * dps;

    // Build centerline
    vertices.push(midline - lineWidth, buttonSize);
    vertices.push(midline - lineWidth, gl.drawingBufferHeight);
    vertices.push(midline + lineWidth, buttonSize);
    vertices.push(midline + lineWidth, gl.drawingBufferHeight);

    // Build gear
    self.gearOffset = (vertices.length / 2);

    function addGearSegment(theta, r) {
      var angle = (90 - theta) * DEG2RAD;
      var x = Math.cos(angle);
      var y = Math.sin(angle);
      vertices.push(kInnerRadius * x * buttonScale + midline, kInnerRadius * y * buttonScale + buttonScale);
      vertices.push(r * x * buttonScale + midline, r * y * buttonScale + buttonScale);
    }

    for (var i = 0; i <= 6; i++) {
      var segmentTheta = i * kAnglePerGearSection;

      addGearSegment(segmentTheta, kOuterRadius);
      addGearSegment(segmentTheta + kOuterRimEndAngle, kOuterRadius);
      addGearSegment(segmentTheta + kInnerRimBeginAngle, kMiddleRadius);
      addGearSegment(segmentTheta + (kAnglePerGearSection - kInnerRimBeginAngle), kMiddleRadius);
      addGearSegment(segmentTheta + (kAnglePerGearSection - kOuterRimEndAngle), kOuterRadius);
    }

    self.gearVertexCount = (vertices.length / 2) - self.gearOffset;

    // Build back arrow
    self.arrowOffset = (vertices.length / 2);

    function addArrowVertex(x, y) {
      vertices.push(buttonBorder + x, gl.drawingBufferHeight - buttonBorder - y);
    }

    var angledLineWidth = lineWidth / Math.sin(45 * DEG2RAD);

    addArrowVertex(0, buttonScale);
    addArrowVertex(buttonScale, 0);
    addArrowVertex(buttonScale + angledLineWidth, angledLineWidth);
    addArrowVertex(angledLineWidth, buttonScale + angledLineWidth);

    addArrowVertex(angledLineWidth, buttonScale - angledLineWidth);
    addArrowVertex(0, buttonScale);
    addArrowVertex(buttonScale, buttonScale * 2);
    addArrowVertex(buttonScale + angledLineWidth, (buttonScale * 2) - angledLineWidth);

    addArrowVertex(angledLineWidth, buttonScale - angledLineWidth);
    addArrowVertex(0, buttonScale);

    addArrowVertex(angledLineWidth, buttonScale - lineWidth);
    addArrowVertex(kButtonWidthDp * dps, buttonScale - lineWidth);
    addArrowVertex(angledLineWidth, buttonScale + lineWidth);
    addArrowVertex(kButtonWidthDp * dps, buttonScale + lineWidth);

    self.arrowVertexCount = (vertices.length / 2) - self.arrowOffset;

    // Buffer data
    gl.bindBuffer(gl.ARRAY_BUFFER, self.vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  });
};

/**
 * Performs distortion pass on the injected backbuffer, rendering it to the real
 * backbuffer.
 */
CardboardUI.prototype.render = function() {
  var gl = this.gl;
  var self = this;

  var glState = [
    gl.CULL_FACE,
    gl.DEPTH_TEST,
    gl.BLEND,
    gl.SCISSOR_TEST,
    gl.STENCIL_TEST,
    gl.COLOR_WRITEMASK,
    gl.VIEWPORT,

    gl.CURRENT_PROGRAM,
    gl.ARRAY_BUFFER_BINDING
  ];

  WGLUPreserveGLState(gl, glState, function(gl) {
    // Make sure the GL state is in a good place
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.STENCIL_TEST);
    gl.colorMask(true, true, true, true);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    self.renderNoState();
  });
};

CardboardUI.prototype.renderNoState = function() {
  var gl = this.gl;

  // Bind distortion program and mesh
  gl.useProgram(this.program);

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
  gl.enableVertexAttribArray(this.attribs.position);
  gl.vertexAttribPointer(this.attribs.position, 2, gl.FLOAT, false, 8, 0);

  gl.uniform4f(this.uniforms.color, 1.0, 1.0, 1.0, 1.0);

  Util.orthoMatrix(this.projMat, 0, gl.drawingBufferWidth, 0, gl.drawingBufferHeight, 0.1, 1024.0);
  gl.uniformMatrix4fv(this.uniforms.projectionMat, false, this.projMat);

  // Draws UI element
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.drawArrays(gl.TRIANGLE_STRIP, this.gearOffset, this.gearVertexCount);
  gl.drawArrays(gl.TRIANGLE_STRIP, this.arrowOffset, this.arrowVertexCount);
};

module.exports = CardboardUI;

},{"./deps/wglu-preserve-state.js":7,"./util.js":24}],6:[function(require,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var CardboardDistorter = require('./cardboard-distorter.js');
var CardboardUI = require('./cardboard-ui.js');
var DeviceInfo = require('./device-info.js');
var Dpdb = require('./dpdb/dpdb.js');
var FusionPoseSensor = require('./sensor-fusion/fusion-pose-sensor.js');
var RotateInstructions = require('./rotate-instructions.js');
var ViewerSelector = require('./viewer-selector.js');
var VRDisplay = require('./base.js').VRDisplay;
var Util = require('./util.js');

var Eye = {
  LEFT: 'left',
  RIGHT: 'right'
};

/**
 * VRDisplay based on mobile device parameters and DeviceMotion APIs.
 */
function CardboardVRDisplay() {
  this.displayName = 'Cardboard VRDisplay (webvr-polyfill)';

  this.capabilities.hasOrientation = true;
  this.capabilities.canPresent = true;

  // "Private" members.
  this.bufferScale_ = WebVRConfig.BUFFER_SCALE ? WebVRConfig.BUFFER_SCALE : 1.0;
  this.poseSensor_ = new FusionPoseSensor();
  this.distorter_ = null;
  this.cardboardUI_ = null;

  this.dpdb_ = new Dpdb(true, this.onDeviceParamsUpdated_.bind(this));
  this.deviceInfo_ = new DeviceInfo(this.dpdb_.getDeviceParams());

  this.viewerSelector_ = new ViewerSelector();
  this.viewerSelector_.on('change', this.onViewerChanged_.bind(this));

  // Set the correct initial viewer.
  this.deviceInfo_.setViewer(this.viewerSelector_.getCurrentViewer());

  this.rotateInstructions_ = new RotateInstructions();
}
CardboardVRDisplay.prototype = new VRDisplay();

CardboardVRDisplay.prototype.getImmediatePose = function() {
  return {
    position: this.poseSensor_.getPosition(),
    orientation: this.poseSensor_.getOrientation(),
    linearVelocity: null,
    linearAcceleration: null,
    angularVelocity: null,
    angularAcceleration: null
  };
};

CardboardVRDisplay.prototype.resetPose = function() {
  this.poseSensor_.resetPose();
};

CardboardVRDisplay.prototype.getEyeParameters = function(whichEye) {
  var offset = [this.deviceInfo_.viewer.interLensDistance * 0.5, 0.0, 0.0];
  var fieldOfView;

  // TODO: FoV can be a little expensive to compute. Cache when device params change.
  if (whichEye == Eye.LEFT) {
    offset[0] *= -1.0;
    fieldOfView = this.deviceInfo_.getFieldOfViewLeftEye();
  } else if (whichEye == Eye.RIGHT) {
    fieldOfView = this.deviceInfo_.getFieldOfViewRightEye();
  } else {
    console.error('Invalid eye provided: %s', whichEye);
    return null;
  }

  return {
    fieldOfView: fieldOfView,
    offset: offset,
    // TODO: Should be able to provide better values than these.
    renderWidth: this.deviceInfo_.device.width * 0.5 * this.bufferScale_,
    renderHeight: this.deviceInfo_.device.height * this.bufferScale_,
  };
};

CardboardVRDisplay.prototype.onDeviceParamsUpdated_ = function(newParams) {
  console.log('DPDB reported that device params were updated.');
  this.deviceInfo_.updateDeviceParams(newParams);

  if (this.distorter_) {
    this.distorter.updateDeviceInfo(this.deviceInfo_);
  }
};

CardboardVRDisplay.prototype.beginPresent_ = function() {
  var gl = this.layer_.source.getContext('webgl');
  if (!gl)
    gl = this.layer_.source.getContext('experimental-webgl');
  if (!gl)
    gl = this.layer_.source.getContext('webgl2');

  if (!gl)
    return; // Can't do distortion without a WebGL context.

  // Provides a way to opt out of distortion
  if (this.layer_.predistorted) {
    this.cardboardUI_ = new CardboardUI(gl);
  } else {
    // Create a new distorter for the target context
    this.distorter_ = new CardboardDistorter(gl);
    this.distorter_.updateDeviceInfo(this.deviceInfo_);
    this.cardboardUI_ = this.distorter_.cardboardUI;

    if (this.layer_.leftBounds || this.layer_.rightBounds) {
      this.distorter_.setTextureBounds(this.layer_.leftBounds, this.layer_.rightBounds);
    }
  }

  this.cardboardUI_.listen(function() {
    // Options clicked
    this.viewerSelector_.show(this.layer_.source.parentElement);
  }.bind(this), function() {
    // Back clicked
    this.exitPresent();
  }.bind(this));

  if (Util.isLandscapeMode() && Util.isMobile()) {
    // In landscape mode, temporarily show the "put into Cardboard"
    // interstitial. Otherwise, do the default thing.
    this.rotateInstructions_.showTemporarily(3000, this.layer_.source.parentElement);
  } else {
    this.rotateInstructions_.update();
  }

  // Listen for orientation change events in order to show interstitial.
  this.orientationHandler = this.onOrientationChange_.bind(this);
  window.addEventListener('orientationchange', this.orientationHandler);

  // Fire this event initially, to give geometry-distortion clients the chance
  // to do something custom.
  this.fireVRDisplayDeviceParamsChange_();
};

CardboardVRDisplay.prototype.endPresent_ = function() {
  if (this.distorter_) {
    this.distorter_.destroy();
    this.distorter_ = null;
  }
  if (this.cardboardUI_) {
    this.cardboardUI_.destroy();
    this.cardboardUI_ = null;
  }

  this.rotateInstructions_.hide();
  this.viewerSelector_.hide();

  window.removeEventListener('orientationchange', this.orientationHandler);
};

CardboardVRDisplay.prototype.submitFrame = function(pose) {
  if (this.distorter_) {
    this.distorter_.submitFrame();
  } else if (this.cardboardUI_) {
    this.cardboardUI_.render();
  }
};

CardboardVRDisplay.prototype.onOrientationChange_ = function(e) {
  console.log('onOrientationChange_');

  // Hide the viewer selector.
  this.viewerSelector_.hide();

  // Update the rotate instructions.
  this.rotateInstructions_.update();
};

CardboardVRDisplay.prototype.onViewerChanged_ = function(viewer) {
  this.deviceInfo_.setViewer(viewer);

  // Update the distortion appropriately.
  this.distorter_.updateDeviceInfo(this.deviceInfo_);

  // Fire a new event containing viewer and device parameters for clients that
  // want to implement their own geometry-based distortion.
  this.fireVRDisplayDeviceParamsChange_();
};

CardboardVRDisplay.prototype.fireVRDisplayDeviceParamsChange_ = function() {
  var event = new CustomEvent('vrdisplaydeviceparamschange', {
    detail: {
      vrdisplay: this,
      deviceInfo: this.deviceInfo_,
    }
  });
  window.dispatchEvent(event);
};

module.exports = CardboardVRDisplay;

},{"./base.js":3,"./cardboard-distorter.js":4,"./cardboard-ui.js":5,"./device-info.js":8,"./dpdb/dpdb.js":12,"./rotate-instructions.js":17,"./sensor-fusion/fusion-pose-sensor.js":19,"./util.js":24,"./viewer-selector.js":25}],7:[function(require,module,exports){
/*
Copyright (c) 2016, Brandon Jones.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/*
Caches specified GL state, runs a callback, and restores the cached state when
done.

Example usage:

var savedState = [
  gl.ARRAY_BUFFER_BINDING,

  // TEXTURE_BINDING_2D or _CUBE_MAP must always be followed by the texure unit.
  gl.TEXTURE_BINDING_2D, gl.TEXTURE0,

  gl.CLEAR_COLOR,
];
// After this call the array buffer, texture unit 0, active texture, and clear
// color will be restored. The viewport will remain changed, however, because
// gl.VIEWPORT was not included in the savedState list.
WGLUPreserveGLState(gl, savedState, function(gl) {
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, ....);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, ...);

  gl.clearColor(1, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
});

Note that this is not intended to be fast. Managing state in your own code to
avoid redundant state setting and querying will always be faster. This function
is most useful for cases where you may not have full control over the WebGL
calls being made, such as tooling or effect injectors.
*/

function WGLUPreserveGLState(gl, bindings, callback) {
  if (!bindings) {
    callback(gl);
    return;
  }

  var boundValues = [];

  var activeTexture = null;
  for (var i = 0; i < bindings.length; ++i) {
    var binding = bindings[i];
    switch (binding) {
      case gl.TEXTURE_BINDING_2D:
      case gl.TEXTURE_BINDING_CUBE_MAP:
        var textureUnit = bindings[++i];
        if (textureUnit < gl.TEXTURE0 || textureUnit > gl.TEXTURE31) {
          console.error("TEXTURE_BINDING_2D or TEXTURE_BINDING_CUBE_MAP must be followed by a valid texture unit");
          boundValues.push(null, null);
          break;
        }
        if (!activeTexture) {
          activeTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
        }
        gl.activeTexture(textureUnit);
        boundValues.push(gl.getParameter(binding), null);
        break;
      case gl.ACTIVE_TEXTURE:
        activeTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
        boundValues.push(null);
        break;
      default:
        boundValues.push(gl.getParameter(binding));
        break;
    }
  }

  callback(gl);

  for (var i = 0; i < bindings.length; ++i) {
    var binding = bindings[i];
    var boundValue = boundValues[i];
    switch (binding) {
      case gl.ACTIVE_TEXTURE:
        break; // Ignore this binding, since we special-case it to happen last.
      case gl.ARRAY_BUFFER_BINDING:
        gl.bindBuffer(gl.ARRAY_BUFFER, boundValue);
        break;
      case gl.COLOR_CLEAR_VALUE:
        gl.clearColor(boundValue[0], boundValue[1], boundValue[2], boundValue[3]);
        break;
      case gl.COLOR_WRITEMASK:
        gl.colorMask(boundValue[0], boundValue[1], boundValue[2], boundValue[3]);
        break;
      case gl.CURRENT_PROGRAM:
        gl.useProgram(boundValue);
        break;
      case gl.ELEMENT_ARRAY_BUFFER_BINDING:
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, boundValue);
        break;
      case gl.FRAMEBUFFER_BINDING:
        gl.bindFramebuffer(gl.FRAMEBUFFER, boundValue);
        break;
      case gl.RENDERBUFFER_BINDING:
        gl.bindRenderbuffer(gl.RENDERBUFFER, boundValue);
        break;
      case gl.TEXTURE_BINDING_2D:
        var textureUnit = bindings[++i];
        if (textureUnit < gl.TEXTURE0 || textureUnit > gl.TEXTURE31)
          break;
        gl.activeTexture(textureUnit);
        gl.bindTexture(gl.TEXTURE_2D, boundValue);
        break;
      case gl.TEXTURE_BINDING_CUBE_MAP:
        var textureUnit = bindings[++i];
        if (textureUnit < gl.TEXTURE0 || textureUnit > gl.TEXTURE31)
          break;
        gl.activeTexture(textureUnit);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, boundValue);
        break;
      case gl.VIEWPORT:
        gl.viewport(boundValue[0], boundValue[1], boundValue[2], boundValue[3]);
        break;
      case gl.BLEND:
      case gl.CULL_FACE:
      case gl.DEPTH_TEST:
      case gl.SCISSOR_TEST:
      case gl.STENCIL_TEST:
        if (boundValue) {
          gl.enable(binding);
        } else {
          gl.disable(binding);
        }
        break;
      default:
        console.log("No GL restore behavior for 0x" + binding.toString(16));
        break;
    }

    if (activeTexture) {
      gl.activeTexture(activeTexture);
    }
  }
}

module.exports = WGLUPreserveGLState;
},{}],8:[function(require,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Distortion = require('./distortion/distortion.js');
var THREE = require('./three-math.js');
var Util = require('./util.js');

function Device(params) {
  this.width = params.width || Util.getScreenWidth();
  this.height = params.height || Util.getScreenHeight();
  this.widthMeters = params.widthMeters;
  this.heightMeters = params.heightMeters;
  this.bevelMeters = params.bevelMeters;
}


// Fallback Android device (based on Nexus 5 measurements) for use when
// we can't recognize an Android device.
var DEFAULT_ANDROID = new Device({
  widthMeters: 0.110,
  heightMeters: 0.062,
  bevelMeters: 0.004
});

// Fallback iOS device (based on iPhone6) for use when
// we can't recognize an Android device.
var DEFAULT_IOS = new Device({
  widthMeters: 0.1038,
  heightMeters: 0.0584,
  bevelMeters: 0.004
});


var Viewers = {
  CardboardV1: new CardboardViewer({
    id: 'CardboardV1',
    label: 'Cardboard I/O 2014',
    fov: 40,
    interLensDistance: 0.060,
    baselineLensDistance: 0.035,
    screenLensDistance: 0.042,
    distortionCoefficients: [0.441, 0.156],
    inverseCoefficients: [-0.4410035, 0.42756155, -0.4804439, 0.5460139,
      -0.58821183, 0.5733938, -0.48303202, 0.33299083, -0.17573841,
      0.0651772, -0.01488963, 0.001559834]
  }),
  CardboardV2: new CardboardViewer({
    id: 'CardboardV2',
    label: 'Cardboard I/O 2015',
    fov: 60,
    interLensDistance: 0.064,
    baselineLensDistance: 0.035,
    screenLensDistance: 0.039,
    distortionCoefficients: [0.34, 0.55],
    inverseCoefficients: [-0.33836704, -0.18162185, 0.862655, -1.2462051,
      1.0560602, -0.58208317, 0.21609078, -0.05444823, 0.009177956,
      -9.904169E-4, 6.183535E-5, -1.6981803E-6]
  })
};


var DEFAULT_LEFT_CENTER = {x: 0.5, y: 0.5};
var DEFAULT_RIGHT_CENTER = {x: 0.5, y: 0.5};

/**
 * Manages information about the device and the viewer.
 *
 * deviceParams indicates the parameters of the device to use (generally
 * obtained from dpdb.getDeviceParams()). Can be null to mean no device
 * params were found.
 */
function DeviceInfo(deviceParams) {
  this.viewer = Viewers.CardboardV2;
  this.updateDeviceParams(deviceParams);
  this.distortion = new Distortion(this.viewer.distortionCoefficients);
}

DeviceInfo.prototype.updateDeviceParams = function(deviceParams) {
  this.device = this.determineDevice_(deviceParams) || this.device;
};

DeviceInfo.prototype.getDevice = function() {
  return this.device;
};

DeviceInfo.prototype.setViewer = function(viewer) {
  this.viewer = viewer;
  this.distortion = new Distortion(this.viewer.distortionCoefficients);
};

DeviceInfo.prototype.determineDevice_ = function(deviceParams) {
  if (!deviceParams) {
    // No parameters, so use a default.
    if (Util.isIOS()) {
      console.warn('Using fallback Android device measurements.');
      return DEFAULT_IOS;
    } else {
      console.warn('Using fallback iOS device measurements.');
      return DEFAULT_ANDROID;
    }
  }

  // Compute device screen dimensions based on deviceParams.
  var METERS_PER_INCH = 0.0254;
  var metersPerPixelX = METERS_PER_INCH / deviceParams.xdpi;
  var metersPerPixelY = METERS_PER_INCH / deviceParams.ydpi;
  var width = Util.getScreenWidth();
  var height = Util.getScreenHeight();
  return new Device({
    widthMeters: metersPerPixelX * width,
    heightMeters: metersPerPixelY * height,
    bevelMeters: deviceParams.bevelMm * 0.001,
  });
};

/**
 * Calculates field of view for the left eye.
 */
DeviceInfo.prototype.getDistortedFieldOfViewLeftEye = function() {
  var viewer = this.viewer;
  var device = this.device;
  var distortion = this.distortion;

  // Device.height and device.width for device in portrait mode, so transpose.
  var eyeToScreenDistance = viewer.screenLensDistance;

  var outerDist = (device.widthMeters - viewer.interLensDistance) / 2;
  var innerDist = viewer.interLensDistance / 2;
  var bottomDist = viewer.baselineLensDistance - device.bevelMeters;
  var topDist = device.heightMeters - bottomDist;

  var outerAngle = THREE.Math.radToDeg(Math.atan(
      distortion.distort(outerDist / eyeToScreenDistance)));
  var innerAngle = THREE.Math.radToDeg(Math.atan(
      distortion.distort(innerDist / eyeToScreenDistance)));
  var bottomAngle = THREE.Math.radToDeg(Math.atan(
      distortion.distort(bottomDist / eyeToScreenDistance)));
  var topAngle = THREE.Math.radToDeg(Math.atan(
      distortion.distort(topDist / eyeToScreenDistance)));

  return {
    leftDegrees: Math.min(outerAngle, viewer.fov),
    rightDegrees: Math.min(innerAngle, viewer.fov),
    downDegrees: Math.min(bottomAngle, viewer.fov),
    upDegrees: Math.min(topAngle, viewer.fov)
  };
};

/**
 * Calculates the tan-angles from the maximum FOV for the left eye for the
 * current device and screen parameters.
 */
DeviceInfo.prototype.getLeftEyeVisibleTanAngles = function() {
  var viewer = this.viewer;
  var device = this.device;
  var distortion = this.distortion;

  // Tan-angles from the max FOV.
  var fovLeft = Math.tan(-THREE.Math.degToRad(viewer.fov));
  var fovTop = Math.tan(THREE.Math.degToRad(viewer.fov));
  var fovRight = Math.tan(THREE.Math.degToRad(viewer.fov));
  var fovBottom = Math.tan(-THREE.Math.degToRad(viewer.fov));
  // Viewport size.
  var halfWidth = device.widthMeters / 4;
  var halfHeight = device.heightMeters / 2;
  // Viewport center, measured from left lens position.
  var verticalLensOffset = (viewer.baselineLensDistance - device.bevelMeters - halfHeight);
  var centerX = viewer.interLensDistance / 2 - halfWidth;
  var centerY = -verticalLensOffset;
  var centerZ = viewer.screenLensDistance;
  // Tan-angles of the viewport edges, as seen through the lens.
  var screenLeft = distortion.distort((centerX - halfWidth) / centerZ);
  var screenTop = distortion.distort((centerY + halfHeight) / centerZ);
  var screenRight = distortion.distort((centerX + halfWidth) / centerZ);
  var screenBottom = distortion.distort((centerY - halfHeight) / centerZ);
  // Compare the two sets of tan-angles and take the value closer to zero on each side.
  var result = new Float32Array(4);
  result[0] = Math.max(fovLeft, screenLeft);
  result[1] = Math.min(fovTop, screenTop);
  result[2] = Math.min(fovRight, screenRight);
  result[3] = Math.max(fovBottom, screenBottom);
  return result;
};

/**
 * Calculates the tan-angles from the maximum FOV for the left eye for the
 * current device and screen parameters, assuming no lenses.
 */
DeviceInfo.prototype.getLeftEyeNoLensTanAngles = function() {
  var viewer = this.viewer;
  var device = this.device;
  var distortion = this.distortion;

  var result = new Float32Array(4);
  // Tan-angles from the max FOV.
  var fovLeft = distortion.distortInverse(Math.tan(-THREE.Math.degToRad(viewer.fov)));
  var fovTop = distortion.distortInverse(Math.tan(THREE.Math.degToRad(viewer.fov)));
  var fovRight = distortion.distortInverse(Math.tan(THREE.Math.degToRad(viewer.fov)));
  var fovBottom = distortion.distortInverse(Math.tan(-THREE.Math.degToRad(viewer.fov)));
  // Viewport size.
  var halfWidth = device.widthMeters / 4;
  var halfHeight = device.heightMeters / 2;
  // Viewport center, measured from left lens position.
  var verticalLensOffset = (viewer.baselineLensDistance - device.bevelMeters - halfHeight);
  var centerX = viewer.interLensDistance / 2 - halfWidth;
  var centerY = -verticalLensOffset;
  var centerZ = viewer.screenLensDistance;
  // Tan-angles of the viewport edges, as seen through the lens.
  var screenLeft = (centerX - halfWidth) / centerZ;
  var screenTop = (centerY + halfHeight) / centerZ;
  var screenRight = (centerX + halfWidth) / centerZ;
  var screenBottom = (centerY - halfHeight) / centerZ;
  // Compare the two sets of tan-angles and take the value closer to zero on each side.
  result[0] = Math.max(fovLeft, screenLeft);
  result[1] = Math.min(fovTop, screenTop);
  result[2] = Math.min(fovRight, screenRight);
  result[3] = Math.max(fovBottom, screenBottom);
  return result;
};

/**
 * Calculates the screen rectangle visible from the left eye for the
 * current device and screen parameters.
 */
DeviceInfo.prototype.getLeftEyeVisibleScreenRect = function(undistortedFrustum) {
  var viewer = this.viewer;
  var device = this.device;

  var dist = viewer.screenLensDistance;
  var eyeX = (device.widthMeters - viewer.interLensDistance) / 2;
  var eyeY = viewer.baselineLensDistance - device.bevelMeters;
  var left = (undistortedFrustum[0] * dist + eyeX) / device.widthMeters;
  var top = (undistortedFrustum[1] * dist + eyeY) / device.heightMeters;
  var right = (undistortedFrustum[2] * dist + eyeX) / device.widthMeters;
  var bottom = (undistortedFrustum[3] * dist + eyeY) / device.heightMeters;
  return {
    x: left,
    y: bottom,
    width: right - left,
    height: top - bottom
  };
};

DeviceInfo.prototype.getFieldOfViewLeftEye = function(opt_isUndistorted) {
  return opt_isUndistorted ? this.getUndistortedFieldOfViewLeftEye() :
      this.getDistortedFieldOfViewLeftEye();
};

DeviceInfo.prototype.getFieldOfViewRightEye = function(opt_isUndistorted) {
  var fov = this.getFieldOfViewLeftEye(opt_isUndistorted);
  return {
    leftDegrees: fov.rightDegrees,
    rightDegrees: fov.leftDegrees,
    upDegrees: fov.upDegrees,
    downDegrees: fov.downDegrees
  };
};

/**
 * Calculates a projection matrix for the left eye.
 */
DeviceInfo.prototype.getProjectionMatrixLeftEye = function(opt_isUndistorted) {
  var fov = this.getFieldOfViewLeftEye(opt_isUndistorted);

  var projectionMatrix = new THREE.Matrix4();
  var near = 0.1;
  var far = 1000;
  var left = Math.tan(THREE.Math.degToRad(fov.leftDegrees)) * near;
  var right = Math.tan(THREE.Math.degToRad(fov.rightDegrees)) * near;
  var bottom = Math.tan(THREE.Math.degToRad(fov.downDegrees)) * near;
  var top = Math.tan(THREE.Math.degToRad(fov.upDegrees)) * near;

  // makeFrustum expects units in tan-angle space.
  projectionMatrix.makeFrustum(-left, right, -bottom, top, near, far);

  return projectionMatrix;
};


DeviceInfo.prototype.getUndistortedViewportLeftEye = function() {
  var p = this.getUndistortedParams_();
  var viewer = this.viewer;
  var device = this.device;

  var eyeToScreenDistance = viewer.screenLensDistance;
  var screenWidth = device.widthMeters / eyeToScreenDistance;
  var screenHeight = device.heightMeters / eyeToScreenDistance;
  var xPxPerTanAngle = device.width / screenWidth;
  var yPxPerTanAngle = device.height / screenHeight;

  var x = Math.round((p.eyePosX - p.outerDist) * xPxPerTanAngle);
  var y = Math.round((p.eyePosY - p.bottomDist) * yPxPerTanAngle);
  return {
    x: x,
    y: y,
    width: Math.round((p.eyePosX + p.innerDist) * xPxPerTanAngle) - x,
    height: Math.round((p.eyePosY + p.topDist) * yPxPerTanAngle) - y
  };
};

/**
 * Calculates undistorted field of view for the left eye.
 */
DeviceInfo.prototype.getUndistortedFieldOfViewLeftEye = function() {
  var p = this.getUndistortedParams_();

  return {
    leftDegrees: THREE.Math.radToDeg(Math.atan(p.outerDist)),
    rightDegrees: THREE.Math.radToDeg(Math.atan(p.innerDist)),
    downDegrees: THREE.Math.radToDeg(Math.atan(p.bottomDist)),
    upDegrees: THREE.Math.radToDeg(Math.atan(p.topDist))
  };
};

DeviceInfo.prototype.getUndistortedParams_ = function() {
  var viewer = this.viewer;
  var device = this.device;
  var distortion = this.distortion;

  // Most of these variables in tan-angle units.
  var eyeToScreenDistance = viewer.screenLensDistance;
  var halfLensDistance = viewer.interLensDistance / 2 / eyeToScreenDistance;
  var screenWidth = device.widthMeters / eyeToScreenDistance;
  var screenHeight = device.heightMeters / eyeToScreenDistance;

  var eyePosX = screenWidth / 2 - halfLensDistance;
  var eyePosY = (viewer.baselineLensDistance - device.bevelMeters) / eyeToScreenDistance;

  var maxFov = viewer.fov;
  var viewerMax = distortion.distortInverse(Math.tan(THREE.Math.degToRad(maxFov)));
  var outerDist = Math.min(eyePosX, viewerMax);
  var innerDist = Math.min(halfLensDistance, viewerMax);
  var bottomDist = Math.min(eyePosY, viewerMax);
  var topDist = Math.min(screenHeight - eyePosY, viewerMax);

  return {
    outerDist: outerDist,
    innerDist: innerDist,
    topDist: topDist,
    bottomDist: bottomDist,
    eyePosX: eyePosX,
    eyePosY: eyePosY
  };
};


function CardboardViewer(params) {
  // A machine readable ID.
  this.id = params.id;
  // A human readable label.
  this.label = params.label;

  // Field of view in degrees (per side).
  this.fov = params.fov;

  // Distance between lens centers in meters.
  this.interLensDistance = params.interLensDistance;
  // Distance between viewer baseline and lens center in meters.
  this.baselineLensDistance = params.baselineLensDistance;
  // Screen-to-lens distance in meters.
  this.screenLensDistance = params.screenLensDistance;

  // Distortion coefficients.
  this.distortionCoefficients = params.distortionCoefficients;
  // Inverse distortion coefficients.
  // TODO: Calculate these from distortionCoefficients in the future.
  this.inverseCoefficients = params.inverseCoefficients;
}

// Export viewer information.
DeviceInfo.Viewers = Viewers;
module.exports = DeviceInfo;
},{"./distortion/distortion.js":10,"./three-math.js":22,"./util.js":24}],9:[function(require,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var VRDisplay = require('./base.js').VRDisplay;
var HMDVRDevice = require('./base.js').HMDVRDevice;
var PositionSensorVRDevice = require('./base.js').PositionSensorVRDevice;

/**
 * Wraps a VRDisplay and exposes it as a HMDVRDevice
 */
function VRDisplayHMDDevice(display) {
  this.display = display;

  this.hardwareUnitId = display.displayId;
  this.deviceId = 'webvr-pollyfill:HMD:' + display.displayId;
  this.deviceName = display.displayName + ' (HMD)';
}
VRDisplayHMDDevice.prototype = new HMDVRDevice();

VRDisplayHMDDevice.prototype.getEyeParameters = function(whichEye) {
  var eyeParameters = this.display.getEyeParameters(whichEye);

  return {
    currentFieldOfView: eyeParameters.fieldOfView,
    maximumFieldOfView: eyeParameters.fieldOfView,
    minimumFieldOfView: eyeParameters.fieldOfView,
    recommendedFieldOfView: eyeParameters.fieldOfView,
    eyeTranslation: { x: eyeParameters.offset[0], y: eyeParameters.offset[1], z: eyeParameters.offset[2] },
    renderRect: {
      x: (whichEye == 'right') ? eyeParameters.renderWidth : 0,
      y: 0,
      width: eyeParameters.renderWidth,
      height: eyeParameters.renderHeight
    }
  };
};

VRDisplayHMDDevice.prototype.setFieldOfView =
    function(opt_fovLeft, opt_fovRight, opt_zNear, opt_zFar) {
  // Not supported. getEyeParameters reports that the min, max, and recommended
  // FoV is all the same, so no adjustment can be made.
};

// TODO: Need to hook requestFullscreen to see if a wrapped VRDisplay was passed
// in as an option. If so we should prevent the default fullscreen behavior and
// call VRDisplay.requestPresent instead.

/**
 * Wraps a VRDisplay and exposes it as a PositionSensorVRDevice
 */
function VRDisplayPositionSensorDevice(display) {
  this.display = display;

  this.hardwareUnitId = display.displayId;
  this.deviceId = 'webvr-pollyfill:PositionSensor: ' + display.displayId;
  this.deviceName = display.displayName + ' (PositionSensor)';
}
VRDisplayPositionSensorDevice.prototype = new PositionSensorVRDevice();

VRDisplayPositionSensorDevice.prototype.getState = function() {
  var pose = this.display.getPose();
  return {
    position: pose.position ? { x: pose.position[0], y: pose.position[1], z: pose.position[2] } : null,
    orientation: pose.orientation ? { x: pose.orientation[0], y: pose.orientation[1], z: pose.orientation[2], w: pose.orientation[3] } : null,
    linearVelocity: null,
    linearAcceleration: null,
    angularVelocity: null,
    angularAcceleration: null
  };
};

VRDisplayPositionSensorDevice.prototype.resetState = function() {
  return this.positionDevice.resetPose();
};


module.exports.VRDisplayHMDDevice = VRDisplayHMDDevice;
module.exports.VRDisplayPositionSensorDevice = VRDisplayPositionSensorDevice;


},{"./base.js":3}],10:[function(require,module,exports){
/**
 * TODO(smus): Implement coefficient inversion.
 */
function Distortion(coefficients) {
  this.coefficients = coefficients;
}

/**
 * Calculates the inverse distortion for a radius.
 * </p><p>
 * Allows to compute the original undistorted radius from a distorted one.
 * See also getApproximateInverseDistortion() for a faster but potentially
 * less accurate method.
 *
 * @param {Number} radius Distorted radius from the lens center in tan-angle units.
 * @return {Number} The undistorted radius in tan-angle units.
 */
Distortion.prototype.distortInverse = function(radius) {
  // Secant method.
  var r0 = 0;
  var r1 = 1;
  var dr0 = radius - this.distort(r0);
  while (Math.abs(r1 - r0) > 0.0001 /** 0.1mm */) {
    var dr1 = radius - this.distort(r1);
    var r2 = r1 - dr1 * ((r1 - r0) / (dr1 - dr0));
    r0 = r1;
    r1 = r2;
    dr0 = dr1;
  }
  return r1;
}

/**
 * Distorts a radius by its distortion factor from the center of the lenses.
 *
 * @param {Number} radius Radius from the lens center in tan-angle units.
 * @return {Number} The distorted radius in tan-angle units.
 */
Distortion.prototype.distort = function(radius) {
  var r2 = radius * radius;
  var ret = 0;
  for (var i = 0; i < this.coefficients.length; i++) {
    ret = r2 * (ret + this.coefficients[i]);
  }
  return (ret + 1) * radius;
}

module.exports = Distortion;
},{}],11:[function(require,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * DPDB cache.
 */
var DPDB_CACHE = {
  "format": 1,
  "last_updated": "2016-01-20T00:18:35Z",
  "devices": [

  {
    "type": "android",
    "rules": [
      { "mdmh": "asus/*/Nexus 7/*" },
      { "ua": "Nexus 7" }
    ],
    "dpi": [ 320.8, 323.0 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "asus/*/ASUS_Z00AD/*" },
      { "ua": "ASUS_Z00AD" }
    ],
    "dpi": [ 403.0, 404.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "HTC/*/HTC6435LVW/*" },
      { "ua": "HTC6435LVW" }
    ],
    "dpi": [ 449.7, 443.3 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "HTC/*/HTC One XL/*" },
      { "ua": "HTC One XL" }
    ],
    "dpi": [ 315.3, 314.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "htc/*/Nexus 9/*" },
      { "ua": "Nexus 9" }
    ],
    "dpi": 289.0,
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "HTC/*/HTC One M9/*" },
      { "ua": "HTC One M9" }
    ],
    "dpi": [ 442.5, 443.3 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "HTC/*/HTC One_M8/*" },
      { "ua": "HTC One_M8" }
    ],
    "dpi": [ 449.7, 447.4 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "HTC/*/HTC One/*" },
      { "ua": "HTC One" }
    ],
    "dpi": 472.8,
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Huawei/*/Nexus 6P/*" },
      { "ua": "Nexus 6P" }
    ],
    "dpi": [ 515.1, 518.0 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/Nexus 5X/*" },
      { "ua": "Nexus 5X" }
    ],
    "dpi": [ 422.0, 419.9 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/LGMS345/*" },
      { "ua": "LGMS345" }
    ],
    "dpi": [ 221.7, 219.1 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/LG-D800/*" },
      { "ua": "LG-D800" }
    ],
    "dpi": [ 422.0, 424.1 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/LG-D850/*" },
      { "ua": "LG-D850" }
    ],
    "dpi": [ 537.9, 541.9 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/VS985 4G/*" },
      { "ua": "VS985 4G" }
    ],
    "dpi": [ 537.9, 535.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/Nexus 5/*" },
      { "ua": "Nexus 5 " }
    ],
    "dpi": [ 442.4, 444.8 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/Nexus 4/*" },
      { "ua": "Nexus 4" }
    ],
    "dpi": [ 319.8, 318.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/LG-P769/*" },
      { "ua": "LG-P769" }
    ],
    "dpi": [ 240.6, 247.5 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/LGMS323/*" },
      { "ua": "LGMS323" }
    ],
    "dpi": [ 206.6, 204.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "LGE/*/LGLS996/*" },
      { "ua": "LGLS996" }
    ],
    "dpi": [ 403.4, 401.5 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Micromax/*/4560MMX/*" },
      { "ua": "4560MMX" }
    ],
    "dpi": [ 240.0, 219.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Micromax/*/A250/*" },
      { "ua": "Micromax A250" }
    ],
    "dpi": [ 480.0, 446.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Micromax/*/Micromax AQ4501/*" },
      { "ua": "Micromax AQ4501" }
    ],
    "dpi": 240.0,
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/DROID RAZR/*" },
      { "ua": "DROID RAZR" }
    ],
    "dpi": [ 368.1, 256.7 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT830C/*" },
      { "ua": "XT830C" }
    ],
    "dpi": [ 254.0, 255.9 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1021/*" },
      { "ua": "XT1021" }
    ],
    "dpi": [ 254.0, 256.7 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1023/*" },
      { "ua": "XT1023" }
    ],
    "dpi": [ 254.0, 256.7 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1028/*" },
      { "ua": "XT1028" }
    ],
    "dpi": [ 326.6, 327.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1034/*" },
      { "ua": "XT1034" }
    ],
    "dpi": [ 326.6, 328.4 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1053/*" },
      { "ua": "XT1053" }
    ],
    "dpi": [ 315.3, 316.1 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1562/*" },
      { "ua": "XT1562" }
    ],
    "dpi": [ 403.4, 402.7 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/Nexus 6/*" },
      { "ua": "Nexus 6 " }
    ],
    "dpi": [ 494.3, 489.7 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1063/*" },
      { "ua": "XT1063" }
    ],
    "dpi": [ 295.0, 296.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1064/*" },
      { "ua": "XT1064" }
    ],
    "dpi": [ 295.0, 295.6 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1092/*" },
      { "ua": "XT1092" }
    ],
    "dpi": [ 422.0, 424.1 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "motorola/*/XT1095/*" },
      { "ua": "XT1095" }
    ],
    "dpi": [ 422.0, 423.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "OnePlus/*/A0001/*" },
      { "ua": "A0001" }
    ],
    "dpi": [ 403.4, 401.0 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "OnePlus/*/ONE E1005/*" },
      { "ua": "ONE E1005" }
    ],
    "dpi": [ 442.4, 441.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "OnePlus/*/ONE A2005/*" },
      { "ua": "ONE A2005" }
    ],
    "dpi": [ 391.9, 405.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "OPPO/*/X909/*" },
      { "ua": "X909" }
    ],
    "dpi": [ 442.4, 444.1 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9082/*" },
      { "ua": "GT-I9082" }
    ],
    "dpi": [ 184.7, 185.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G360P/*" },
      { "ua": "SM-G360P" }
    ],
    "dpi": [ 196.7, 205.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/Nexus S/*" },
      { "ua": "Nexus S" }
    ],
    "dpi": [ 234.5, 229.8 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9300/*" },
      { "ua": "GT-I9300" }
    ],
    "dpi": [ 304.8, 303.9 ],
    "bw": 5,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-T230NU/*" },
      { "ua": "SM-T230NU" }
    ],
    "dpi": 216.0,
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SGH-T399/*" },
      { "ua": "SGH-T399" }
    ],
    "dpi": [ 217.7, 231.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-N9005/*" },
      { "ua": "SM-N9005" }
    ],
    "dpi": [ 386.4, 387.0 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SAMSUNG-SM-N900A/*" },
      { "ua": "SAMSUNG-SM-N900A" }
    ],
    "dpi": [ 386.4, 387.7 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9500/*" },
      { "ua": "GT-I9500" }
    ],
    "dpi": [ 442.5, 443.3 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9505/*" },
      { "ua": "GT-I9505" }
    ],
    "dpi": 439.4,
    "bw": 4,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G900F/*" },
      { "ua": "SM-G900F" }
    ],
    "dpi": [ 415.6, 431.6 ],
    "bw": 5,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G900M/*" },
      { "ua": "SM-G900M" }
    ],
    "dpi": [ 415.6, 431.6 ],
    "bw": 5,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G800F/*" },
      { "ua": "SM-G800F" }
    ],
    "dpi": 326.8,
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G906S/*" },
      { "ua": "SM-G906S" }
    ],
    "dpi": [ 562.7, 572.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9300/*" },
      { "ua": "GT-I9300" }
    ],
    "dpi": [ 306.7, 304.8 ],
    "bw": 5,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-T535/*" },
      { "ua": "SM-T535" }
    ],
    "dpi": [ 142.6, 136.4 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-N920C/*" },
      { "ua": "SM-N920C" }
    ],
    "dpi": [ 515.1, 518.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9300I/*" },
      { "ua": "GT-I9300I" }
    ],
    "dpi": [ 304.8, 305.8 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-I9195/*" },
      { "ua": "GT-I9195" }
    ],
    "dpi": [ 249.4, 256.7 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SPH-L520/*" },
      { "ua": "SPH-L520" }
    ],
    "dpi": [ 249.4, 255.9 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SAMSUNG-SGH-I717/*" },
      { "ua": "SAMSUNG-SGH-I717" }
    ],
    "dpi": 285.8,
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SPH-D710/*" },
      { "ua": "SPH-D710" }
    ],
    "dpi": [ 217.7, 204.2 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/GT-N7100/*" },
      { "ua": "GT-N7100" }
    ],
    "dpi": 265.1,
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SCH-I605/*" },
      { "ua": "SCH-I605" }
    ],
    "dpi": 265.1,
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/Galaxy Nexus/*" },
      { "ua": "Galaxy Nexus" }
    ],
    "dpi": [ 315.3, 314.2 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-N910H/*" },
      { "ua": "SM-N910H" }
    ],
    "dpi": [ 515.1, 518.0 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-N910C/*" },
      { "ua": "SM-N910C" }
    ],
    "dpi": [ 515.2, 520.2 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G130M/*" },
      { "ua": "SM-G130M" }
    ],
    "dpi": [ 165.9, 164.8 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G928I/*" },
      { "ua": "SM-G928I" }
    ],
    "dpi": [ 515.1, 518.4 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G920F/*" },
      { "ua": "SM-G920F" }
    ],
    "dpi": 580.6,
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G920P/*" },
      { "ua": "SM-G920P" }
    ],
    "dpi": [ 522.5, 577.0 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G925F/*" },
      { "ua": "SM-G925F" }
    ],
    "dpi": 580.6,
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "samsung/*/SM-G925V/*" },
      { "ua": "SM-G925V" }
    ],
    "dpi": [ 522.5, 576.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Sony/*/C6903/*" },
      { "ua": "C6903" }
    ],
    "dpi": [ 442.5, 443.3 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Sony/*/D6653/*" },
      { "ua": "D6653" }
    ],
    "dpi": [ 428.6, 427.6 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Sony/*/E6653/*" },
      { "ua": "E6653" }
    ],
    "dpi": [ 428.6, 425.7 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Sony/*/E6853/*" },
      { "ua": "E6853" }
    ],
    "dpi": [ 403.4, 401.9 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "Sony/*/SGP321/*" },
      { "ua": "SGP321" }
    ],
    "dpi": [ 224.7, 224.1 ],
    "bw": 3,
    "ac": 500
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "TCT/*/ALCATEL ONE TOUCH Fierce/*" },
      { "ua": "ALCATEL ONE TOUCH Fierce" }
    ],
    "dpi": [ 240.0, 247.5 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "THL/*/thl 5000/*" },
      { "ua": "thl 5000" }
    ],
    "dpi": [ 480.0, 443.3 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "android",
    "rules": [
      { "mdmh": "ZTE/*/ZTE Blade L2/*" },
      { "ua": "ZTE Blade L2" }
    ],
    "dpi": 240.0,
    "bw": 3,
    "ac": 500
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 640, 960 ] } ],
    "dpi": [ 325.1, 328.4 ],
    "bw": 4,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 640, 960 ] } ],
    "dpi": [ 325.1, 328.4 ],
    "bw": 4,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 640, 1136 ] } ],
    "dpi": [ 317.1, 320.2 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 640, 1136 ] } ],
    "dpi": [ 317.1, 320.2 ],
    "bw": 3,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 750, 1334 ] } ],
    "dpi": 326.4,
    "bw": 4,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 750, 1334 ] } ],
    "dpi": 326.4,
    "bw": 4,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 1242, 2208 ] } ],
    "dpi": [ 453.6, 458.4 ],
    "bw": 4,
    "ac": 1000
  },

  {
    "type": "ios",
    "rules": [ { "res": [ 1242, 2208 ] } ],
    "dpi": [ 453.6, 458.4 ],
    "bw": 4,
    "ac": 1000
  }
]};

module.exports = DPDB_CACHE;

},{}],12:[function(require,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Offline cache of the DPDB, to be used until we load the online one (and
// as a fallback in case we can't load the online one).
var DPDB_CACHE = require('./dpdb-cache.js');
var Util = require('../util.js');

// Online DPDB URL.
var ONLINE_DPDB_URL = 'https://storage.googleapis.com/cardboard-dpdb/dpdb.json';

/**
 * Calculates device parameters based on the DPDB (Device Parameter Database).
 * Initially, uses the cached DPDB values.
 *
 * If fetchOnline == true, then this object tries to fetch the online version
 * of the DPDB and updates the device info if a better match is found.
 * Calls the onDeviceParamsUpdated callback when there is an update to the
 * device information.
 */
function Dpdb(fetchOnline, onDeviceParamsUpdated) {
  // Start with the offline DPDB cache while we are loading the real one.
  this.dpdb = DPDB_CACHE;

  // Calculate device params based on the offline version of the DPDB.
  this.recalculateDeviceParams_();

  // XHR to fetch online DPDB file, if requested.
  if (fetchOnline) {
    // Set the callback.
    this.onDeviceParamsUpdated = onDeviceParamsUpdated;

    console.log('Fetching DPDB...');
    var xhr = new XMLHttpRequest();
    var obj = this;
    xhr.open('GET', ONLINE_DPDB_URL, true);
    xhr.addEventListener('load', function() {
      obj.loading = false;
      if (xhr.status >= 200 && xhr.status <= 299) {
        // Success.
        console.log('Successfully loaded online DPDB.');
        obj.dpdb = JSON.parse(xhr.response);
        obj.recalculateDeviceParams_();
      } else {
        // Error loading the DPDB.
        console.error('Error loading online DPDB!');
      }
    });
    xhr.send();
  }
}

// Returns the current device parameters.
Dpdb.prototype.getDeviceParams = function() {
  return this.deviceParams;
};

// Recalculates this device's parameters based on the DPDB.
Dpdb.prototype.recalculateDeviceParams_ = function() {
  console.log('Recalculating device params.');
  var newDeviceParams = this.calcDeviceParams_();
  console.log('New device parameters:');
  console.log(newDeviceParams);
  if (newDeviceParams) {
    this.deviceParams = newDeviceParams;
    // Invoke callback, if it is set.
    if (this.onDeviceParamsUpdated) {
      this.onDeviceParamsUpdated(this.deviceParams);
    }
  } else {
    console.error('Failed to recalculate device parameters.');
  }
};

// Returns a DeviceParams object that represents the best guess as to this
// device's parameters. Can return null if the device does not match any
// known devices.
Dpdb.prototype.calcDeviceParams_ = function() {
  var db = this.dpdb; // shorthand
  if (!db) {
    console.error('DPDB not available.');
    return null;
  }
  if (db.format != 1) {
    console.error('DPDB has unexpected format version.');
    return null;
  }
  if (!db.devices || !db.devices.length) {
    console.error('DPDB does not have a devices section.');
    return null;
  }

  // Get the actual user agent and screen dimensions in pixels.
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  var width = Util.getScreenWidth();
  var height = Util.getScreenHeight();
  console.log('User agent: ' + userAgent);
  console.log('Pixel width: ' + width);
  console.log('Pixel height: ' + height);

  if (!db.devices) {
    console.error('DPDB has no devices section.');
    return null;
  }

  for (var i = 0; i < db.devices.length; i++) {
    var device = db.devices[i];
    if (!device.rules) {
      console.warn('Device[' + i + '] has no rules section.');
      continue;
    }

    if (device.type != 'ios' && device.type != 'android') {
      console.warn('Device[' + i + '] has invalid type.');
      continue;
    }

    // See if this device is of the appropriate type.
    if (Util.isIOS() != (device.type == 'ios')) continue;

    // See if this device matches any of the rules:
    var matched = false;
    for (var j = 0; j < device.rules.length; j++) {
      var rule = device.rules[j];
      if (this.matchRule_(rule, userAgent, width, height)) {
        console.log('Rule matched:');
        console.log(rule);
        matched = true;
        break;
      }
    }
    if (!matched) continue;

    // device.dpi might be an array of [ xdpi, ydpi] or just a scalar.
    var xdpi = device.dpi[0] || device.dpi;
    var ydpi = device.dpi[1] || device.dpi;

    return new DeviceParams({ xdpi: xdpi, ydpi: ydpi, bevelMm: device.bw });
  }

  console.warn('No DPDB device match.');
  return null;
};

Dpdb.prototype.matchRule_ = function(rule, ua, screenWidth, screenHeight) {
  // We can only match 'ua' and 'res' rules, not other types like 'mdmh'
  // (which are meant for native platforms).
  if (!rule.ua && !rule.res) return false;

  // If our user agent string doesn't contain the indicated user agent string,
  // the match fails.
  if (rule.ua && ua.indexOf(rule.ua) < 0) return false;

  // If the rule specifies screen dimensions that don't correspond to ours,
  // the match fails.
  if (rule.res) {
    if (!rule.res[0] || !rule.res[1]) return false;
    var resX = rule.res[0];
    var resY = rule.res[1];
    // Compare min and max so as to make the order not matter, i.e., it should
    // be true that 640x480 == 480x640.
    if (Math.min(screenWidth, screenHeight) != Math.min(resX, resY) ||
        (Math.max(screenWidth, screenHeight) != Math.max(resX, resY))) {
      return false;
    }
  }

  return true;
}

function DeviceParams(params) {
  this.xdpi = params.xdpi;
  this.ydpi = params.ydpi;
  this.bevelMm = params.bevelMm;
}

module.exports = Dpdb;
},{"../util.js":24,"./dpdb-cache.js":11}],13:[function(require,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

function Emitter() {
  this.callbacks = {};
}

Emitter.prototype.emit = function(eventName) {
  var callbacks = this.callbacks[eventName];
  if (!callbacks) {
    //console.log('No valid callback specified.');
    return;
  }
  var args = [].slice.call(arguments);
  // Eliminate the first param (the callback).
  args.shift();
  for (var i = 0; i < callbacks.length; i++) {
    callbacks[i].apply(this, args);
  }
};

Emitter.prototype.on = function(eventName, callback) {
  if (eventName in this.callbacks) {
    this.callbacks[eventName].push(callback);
  } else {
    this.callbacks[eventName] = [callback];
  }
};

module.exports = Emitter;

},{}],14:[function(require,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var WebVRPolyfill = require('./webvr-polyfill.js');

// Initialize a WebVRConfig just in case.
window.WebVRConfig = window.WebVRConfig || {};

if (!window.WebVRConfig.DEFER_INITIALIZATION) {
  new WebVRPolyfill();
} else {
  window.InitializeWebVRPolyfill = function() {
   new WebVRPolyfill();
  }
}

},{"./webvr-polyfill.js":27}],15:[function(require,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var MathUtil = window.MathUtil || {};

MathUtil.degToRad = Math.PI / 180;
MathUtil.radToDeg = 180 / Math.PI;

// Some minimal math functionality borrowed from THREE.Math and stripped down
// for the purposes of this library.


MathUtil.Vector2 = function ( x, y ) {
  this.x = x || 0;
  this.y = y || 0;
};

MathUtil.Vector2.prototype = {
  constructor: MathUtil.Vector2,

  set: function ( x, y ) {
    this.x = x;
    this.y = y;

    return this;
  },

  copy: function ( v ) {
    this.x = v.x;
    this.y = v.y;

    return this;
  },

  subVectors: function ( a, b ) {
    this.x = a.x - b.x;
    this.y = a.y - b.y;

    return this;
  },
};

MathUtil.Vector3 = function ( x, y, z ) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
};

MathUtil.Vector3.prototype = {
  constructor: MathUtil.Vector3,

  set: function ( x, y, z ) {
    this.x = x;
    this.y = y;
    this.z = z;

    return this;
  },

  copy: function ( v ) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;

    return this;
  },

  length: function () {
    return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );
  },

  normalize: function () {
    var scalar = this.length();

    if ( scalar !== 0 ) {
      var invScalar = 1 / scalar;

      this.x *= invScalar;
      this.y *= invScalar;
      this.z *= invScalar;
    } else {
      this.x = 0;
      this.y = 0;
      this.z = 0;
    }

    return this;
  },

  applyQuaternion: function ( q ) {
    var x = this.x;
    var y = this.y;
    var z = this.z;

    var qx = q.x;
    var qy = q.y;
    var qz = q.z;
    var qw = q.w;

    // calculate quat * vector
    var ix =  qw * x + qy * z - qz * y;
    var iy =  qw * y + qz * x - qx * z;
    var iz =  qw * z + qx * y - qy * x;
    var iw = - qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    this.x = ix * qw + iw * - qx + iy * - qz - iz * - qy;
    this.y = iy * qw + iw * - qy + iz * - qx - ix * - qz;
    this.z = iz * qw + iw * - qz + ix * - qy - iy * - qx;

    return this;
  },

  dot: function ( v ) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  },

  crossVectors: function ( a, b ) {
    var ax = a.x, ay = a.y, az = a.z;
    var bx = b.x, by = b.y, bz = b.z;

    this.x = ay * bz - az * by;
    this.y = az * bx - ax * bz;
    this.z = ax * by - ay * bx;

    return this;
  },
};

MathUtil.Quaternion = function ( x, y, z, w ) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
  this.w = ( w !== undefined ) ? w : 1;
};

MathUtil.Quaternion.prototype = {
  constructor: MathUtil.Quaternion,

  set: function ( x, y, z, w ) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;

    return this;
  },

  copy: function ( quaternion ) {
    this.x = quaternion.x;
    this.y = quaternion.y;
    this.z = quaternion.z;
    this.w = quaternion.w;

    return this;
  },

  setFromEulerXYZ: function( x, y, z ) {
    var c1 = Math.cos( x / 2 );
    var c2 = Math.cos( y / 2 );
    var c3 = Math.cos( z / 2 );
    var s1 = Math.sin( x / 2 );
    var s2 = Math.sin( y / 2 );
    var s3 = Math.sin( z / 2 );

    this.x = s1 * c2 * c3 + c1 * s2 * s3;
    this.y = c1 * s2 * c3 - s1 * c2 * s3;
    this.z = c1 * c2 * s3 + s1 * s2 * c3;
    this.w = c1 * c2 * c3 - s1 * s2 * s3;

    return this;
  },

  setFromEulerYXZ: function( x, y, z ) {
    var c1 = Math.cos( x / 2 );
    var c2 = Math.cos( y / 2 );
    var c3 = Math.cos( z / 2 );
    var s1 = Math.sin( x / 2 );
    var s2 = Math.sin( y / 2 );
    var s3 = Math.sin( z / 2 );

    this.x = s1 * c2 * c3 + c1 * s2 * s3;
    this.y = c1 * s2 * c3 - s1 * c2 * s3;
    this.z = c1 * c2 * s3 - s1 * s2 * c3;
    this.w = c1 * c2 * c3 + s1 * s2 * s3;

    return this;
  },

  setFromAxisAngle: function ( axis, angle ) {
    // http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm
    // assumes axis is normalized

    var halfAngle = angle / 2, s = Math.sin( halfAngle );

    this.x = axis.x * s;
    this.y = axis.y * s;
    this.z = axis.z * s;
    this.w = Math.cos( halfAngle );

    return this;
  },

  multiply: function ( q ) {
    return this.multiplyQuaternions( this, q );
  },

  multiplyQuaternions: function ( a, b ) {
    // from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm

    var qax = a.x, qay = a.y, qaz = a.z, qaw = a.w;
    var qbx = b.x, qby = b.y, qbz = b.z, qbw = b.w;

    this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
    this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
    this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
    this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

    return this;
  },

  inverse: function () {
    this.x *= -1;
    this.y *= -1;
    this.z *= -1;

    this.normalize();

    return this;
  },

  normalize: function () {
    var l = Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w );

    if ( l === 0 ) {
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.w = 1;
    } else {
      l = 1 / l;

      this.x = this.x * l;
      this.y = this.y * l;
      this.z = this.z * l;
      this.w = this.w * l;
    }

    return this;
  },

  slerp: function ( qb, t ) {
    if ( t === 0 ) return this;
    if ( t === 1 ) return this.copy( qb );

    var x = this.x, y = this.y, z = this.z, w = this.w;

    // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

    var cosHalfTheta = w * qb.w + x * qb.x + y * qb.y + z * qb.z;

    if ( cosHalfTheta < 0 ) {
      this.w = - qb.w;
      this.x = - qb.x;
      this.y = - qb.y;
      this.z = - qb.z;

      cosHalfTheta = - cosHalfTheta;
    } else {
      this.copy( qb );
    }

    if ( cosHalfTheta >= 1.0 ) {
      this.w = w;
      this.x = x;
      this.y = y;
      this.z = z;

      return this;
    }

    var halfTheta = Math.acos( cosHalfTheta );
    var sinHalfTheta = Math.sqrt( 1.0 - cosHalfTheta * cosHalfTheta );

    if ( Math.abs( sinHalfTheta ) < 0.001 ) {
      this.w = 0.5 * ( w + this.w );
      this.x = 0.5 * ( x + this.x );
      this.y = 0.5 * ( y + this.y );
      this.z = 0.5 * ( z + this.z );

      return this;
    }

    var ratioA = Math.sin( ( 1 - t ) * halfTheta ) / sinHalfTheta,
    ratioB = Math.sin( t * halfTheta ) / sinHalfTheta;

    this.w = ( w * ratioA + this.w * ratioB );
    this.x = ( x * ratioA + this.x * ratioB );
    this.y = ( y * ratioA + this.y * ratioB );
    this.z = ( z * ratioA + this.z * ratioB );

    return this;
  },

  setFromUnitVectors: function () {
    // http://lolengine.net/blog/2014/02/24/quaternion-from-two-vectors-final
    // assumes direction vectors vFrom and vTo are normalized

    var v1, r;
    var EPS = 0.000001;

    return function ( vFrom, vTo ) {
      if ( v1 === undefined ) v1 = new MathUtil.Vector3();

      r = vFrom.dot( vTo ) + 1;

      if ( r < EPS ) {
        r = 0;

        if ( Math.abs( vFrom.x ) > Math.abs( vFrom.z ) ) {
          v1.set( - vFrom.y, vFrom.x, 0 );
        } else {
          v1.set( 0, - vFrom.z, vFrom.y );
        }
      } else {
        v1.crossVectors( vFrom, vTo );
      }

      this.x = v1.x;
      this.y = v1.y;
      this.z = v1.z;
      this.w = r;

      this.normalize();

      return this;
    }
  }(),
};

module.exports = MathUtil;

},{}],16:[function(require,module,exports){
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var VRDisplay = require('./base.js').VRDisplay;
var THREE = require('./three-math.js');
var Util = require('./util.js');

// How much to rotate per key stroke.
var KEY_SPEED = 0.15;
var KEY_ANIMATION_DURATION = 80;

// How much to rotate for mouse events.
var MOUSE_SPEED_X = 0.5;
var MOUSE_SPEED_Y = 0.3;

/**
 * VRDisplay based on mouse and keyboard input. Designed for desktops/laptops
 * where orientation events aren't supported. Cannot present.
 */
function MouseKeyboardVRDisplay() {
  this.displayName = 'Mouse and Keyboard VRDisplay (webvr-polyfill)';

  this.capabilities.hasOrientation = true;

  // Attach to mouse and keyboard events.
  window.addEventListener('keydown', this.onKeyDown_.bind(this));
  window.addEventListener('mousemove', this.onMouseMove_.bind(this));
  window.addEventListener('mousedown', this.onMouseDown_.bind(this));
  window.addEventListener('mouseup', this.onMouseUp_.bind(this));

  // "Private" members.
  this.phi_ = 0;
  this.theta_ = 0;

  // Variables for keyboard-based rotation animation.
  this.targetAngle_ = null;
  this.angleAnimation_ = null;

  // State variables for calculations.
  this.euler_ = new THREE.Euler();
  this.orientation_ = new THREE.Quaternion();

  // Variables for mouse-based rotation.
  this.rotateStart_ = new THREE.Vector2();
  this.rotateEnd_ = new THREE.Vector2();
  this.rotateDelta_ = new THREE.Vector2();
  this.isDragging_ = false;

  this.orientationOut_ = new Float32Array(4);
}
MouseKeyboardVRDisplay.prototype = new VRDisplay();

MouseKeyboardVRDisplay.prototype.getImmediatePose = function() {
  this.euler_.set(this.phi_, this.theta_, 0, 'YXZ');
  this.orientation_.setFromEuler(this.euler_);

  this.orientationOut_[0] = this.orientation_.x;
  this.orientationOut_[1] = this.orientation_.y;
  this.orientationOut_[2] = this.orientation_.z;
  this.orientationOut_[3] = this.orientation_.w;

  return {
    position: null,
    orientation: this.orientationOut_,
    linearVelocity: null,
    linearAcceleration: null,
    angularVelocity: null,
    angularAcceleration: null
  };
};

MouseKeyboardVRDisplay.prototype.onKeyDown_ = function(e) {
  // Track WASD and arrow keys.
  if (e.keyCode == 38) { // Up key.
    this.animatePhi_(this.phi_ + KEY_SPEED);
  } else if (e.keyCode == 39) { // Right key.
    this.animateTheta_(this.theta_ - KEY_SPEED);
  } else if (e.keyCode == 40) { // Down key.
    this.animatePhi_(this.phi_ - KEY_SPEED);
  } else if (e.keyCode == 37) { // Left key.
    this.animateTheta_(this.theta_ + KEY_SPEED);
  }
};

MouseKeyboardVRDisplay.prototype.animateTheta_ = function(targetAngle) {
  this.animateKeyTransitions_('theta_', targetAngle);
};

MouseKeyboardVRDisplay.prototype.animatePhi_ = function(targetAngle) {
  // Prevent looking too far up or down.
  targetAngle = Util.clamp(targetAngle, -Math.PI/2, Math.PI/2);
  this.animateKeyTransitions_('phi_', targetAngle);
};

/**
 * Start an animation to transition an angle from one value to another.
 */
MouseKeyboardVRDisplay.prototype.animateKeyTransitions_ = function(angleName, targetAngle) {
  // If an animation is currently running, cancel it.
  if (this.angleAnimation_) {
    clearInterval(this.angleAnimation_);
  }
  var startAngle = this[angleName];
  var startTime = new Date();
  // Set up an interval timer to perform the animation.
  this.angleAnimation_ = setInterval(function() {
    // Once we're finished the animation, we're done.
    var elapsed = new Date() - startTime;
    if (elapsed >= KEY_ANIMATION_DURATION) {
      this[angleName] = targetAngle;
      clearInterval(this.angleAnimation_);
      return;
    }
    // Linearly interpolate the angle some amount.
    var percent = elapsed / KEY_ANIMATION_DURATION;
    this[angleName] = startAngle + (targetAngle - startAngle) * percent;
  }.bind(this), 1000/60);
};

MouseKeyboardVRDisplay.prototype.onMouseDown_ = function(e) {
  this.rotateStart_.set(e.clientX, e.clientY);
  this.isDragging_ = true;
};

// Very similar to https://gist.github.com/mrflix/8351020
MouseKeyboardVRDisplay.prototype.onMouseMove_ = function(e) {
  if (!this.isDragging_ && !this.isPointerLocked_()) {
    return;
  }
  // Support pointer lock API.
  if (this.isPointerLocked_()) {
    var movementX = e.movementX || e.mozMovementX || 0;
    var movementY = e.movementY || e.mozMovementY || 0;
    this.rotateEnd_.set(this.rotateStart_.x - movementX, this.rotateStart_.y - movementY);
  } else {
    this.rotateEnd_.set(e.clientX, e.clientY);
  }
  // Calculate how much we moved in mouse space.
  this.rotateDelta_.subVectors(this.rotateEnd_, this.rotateStart_);
  this.rotateStart_.copy(this.rotateEnd_);

  // Keep track of the cumulative euler angles.
  this.phi_ += 2 * Math.PI * this.rotateDelta_.y / screen.height * MOUSE_SPEED_Y;
  this.theta_ += 2 * Math.PI * this.rotateDelta_.x / screen.width * MOUSE_SPEED_X;

  // Prevent looking too far up or down.
  this.phi_ = Util.clamp(this.phi_, -Math.PI/2, Math.PI/2);
};

MouseKeyboardVRDisplay.prototype.onMouseUp_ = function(e) {
  this.isDragging_ = false;
};

MouseKeyboardVRDisplay.prototype.isPointerLocked_ = function() {
  var el = document.pointerLockElement || document.mozPointerLockElement ||
      document.webkitPointerLockElement;
  return el !== undefined;
};

MouseKeyboardVRDisplay.prototype.resetPose = function() {
  this.phi_ = 0;
  this.theta_ = 0;
};

module.exports = MouseKeyboardVRDisplay;

},{"./base.js":3,"./three-math.js":22,"./util.js":24}],17:[function(require,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = require('./util.js');

function RotateInstructions() {
  this.loadIcon_();

  var overlay = document.createElement('div');
  var s = overlay.style;
  s.position = 'fixed';
  s.top = 0;
  s.right = 0;
  s.bottom = 0;
  s.left = 0;
  s.backgroundColor = 'gray';
  s.fontFamily = 'sans-serif';

  var img = document.createElement('img');
  img.src = this.icon;
  var s = img.style;
  s.marginLeft = '25%';
  s.marginTop = '25%';
  s.width = '50%';
  overlay.appendChild(img);

  var text = document.createElement('div');
  var s = text.style;
  s.textAlign = 'center';
  s.fontSize = '16px';
  s.lineHeight = '24px';
  s.margin = '24px 25%';
  s.width = '50%';
  text.innerHTML = 'Place your phone into your Cardboard viewer.';
  overlay.appendChild(text);

  var snackbar = document.createElement('div');
  var s = snackbar.style;
  s.backgroundColor = '#CFD8DC';
  s.position = 'fixed';
  s.bottom = 0;
  s.width = '100%';
  s.height = '48px';
  s.padding = '14px 24px';
  s.boxSizing = 'border-box';
  s.color = '#656A6B';
  overlay.appendChild(snackbar);

  var snackbarText = document.createElement('div');
  snackbarText.style.float = 'left';
  snackbarText.innerHTML = 'No Cardboard viewer?';

  var snackbarButton = document.createElement('a');
  snackbarButton.href = 'https://www.google.com/get/cardboard/get-cardboard/';
  snackbarButton.innerHTML = 'get one';
  var s = snackbarButton.style;
  s.float = 'right';
  s.fontWeight = 600;
  s.textTransform = 'uppercase';
  s.borderLeft = '1px solid gray';
  s.paddingLeft = '24px';
  s.textDecoration = 'none';
  s.color = '#656A6B';

  snackbar.appendChild(snackbarText);
  snackbar.appendChild(snackbarButton);

  this.overlay = overlay;
  this.text = text;

  this.hide();
}

RotateInstructions.prototype.show = function(parent) {
  if (!parent && !this.overlay.parentElement) {
    document.body.appendChild(this.overlay);
  } else if (parent) {
    if (this.overlay.parentElement && this.overlay.parentElement != parent)
      this.overlay.parentElement.removeChild(this.overlay);

    parent.appendChild(this.overlay);
  }

  this.overlay.style.display = 'block';

  var img = this.overlay.querySelector('img');
  var s = img.style;

  if (Util.isLandscapeMode()) {
    s.width = '20%';
    s.marginLeft = '40%';
    s.marginTop = '3%';
  } else {
    s.width = '50%';
    s.marginLeft = '25%';
    s.marginTop = '25%';
  }
};

RotateInstructions.prototype.hide = function() {
  this.overlay.style.display = 'none';
};

RotateInstructions.prototype.showTemporarily = function(ms, parent) {
  this.show(parent);
  this.timer = setTimeout(this.hide.bind(this), ms);
};

RotateInstructions.prototype.disableShowTemporarily = function() {
  clearTimeout(this.timer);
};

RotateInstructions.prototype.update = function() {
  this.disableShowTemporarily();
  // In portrait VR mode, tell the user to rotate to landscape. Otherwise, hide
  // the instructions.
  if (!Util.isLandscapeMode() && Util.isMobile()) {
    this.show();
  } else {
    this.hide();
  }
};

RotateInstructions.prototype.loadIcon_ = function() {
  // Encoded asset_src/rotate-instructions.svg
  this.icon = Util.base64('image/svg+xml', 'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+Cjxzdmcgd2lkdGg9IjE5OHB4IiBoZWlnaHQ9IjI0MHB4IiB2aWV3Qm94PSIwIDAgMTk4IDI0MCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4bWxuczpza2V0Y2g9Imh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaC9ucyI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDMuMy4zICgxMjA4MSkgLSBodHRwOi8vd3d3LmJvaGVtaWFuY29kaW5nLmNvbS9za2V0Y2ggLS0+CiAgICA8dGl0bGU+dHJhbnNpdGlvbjwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPjwvZGVmcz4KICAgIDxnIGlkPSJQYWdlLTEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIHNrZXRjaDp0eXBlPSJNU1BhZ2UiPgogICAgICAgIDxnIGlkPSJ0cmFuc2l0aW9uIiBza2V0Y2g6dHlwZT0iTVNBcnRib2FyZEdyb3VwIj4KICAgICAgICAgICAgPGcgaWQ9IkltcG9ydGVkLUxheWVycy1Db3B5LTQtKy1JbXBvcnRlZC1MYXllcnMtQ29weS0rLUltcG9ydGVkLUxheWVycy1Db3B5LTItQ29weSIgc2tldGNoOnR5cGU9Ik1TTGF5ZXJHcm91cCI+CiAgICAgICAgICAgICAgICA8ZyBpZD0iSW1wb3J0ZWQtTGF5ZXJzLUNvcHktNCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMC4wMDAwMDAsIDEwNy4wMDAwMDApIiBza2V0Y2g6dHlwZT0iTVNTaGFwZUdyb3VwIj4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTQ5LjYyNSwyLjUyNyBDMTQ5LjYyNSwyLjUyNyAxNTUuODA1LDYuMDk2IDE1Ni4zNjIsNi40MTggTDE1Ni4zNjIsNy4zMDQgQzE1Ni4zNjIsNy40ODEgMTU2LjM3NSw3LjY2NCAxNTYuNCw3Ljg1MyBDMTU2LjQxLDcuOTM0IDE1Ni40Miw4LjAxNSAxNTYuNDI3LDguMDk1IEMxNTYuNTY3LDkuNTEgMTU3LjQwMSwxMS4wOTMgMTU4LjUzMiwxMi4wOTQgTDE2NC4yNTIsMTcuMTU2IEwxNjQuMzMzLDE3LjA2NiBDMTY0LjMzMywxNy4wNjYgMTY4LjcxNSwxNC41MzYgMTY5LjU2OCwxNC4wNDIgQzE3MS4wMjUsMTQuODgzIDE5NS41MzgsMjkuMDM1IDE5NS41MzgsMjkuMDM1IEwxOTUuNTM4LDgzLjAzNiBDMTk1LjUzOCw4My44MDcgMTk1LjE1Miw4NC4yNTMgMTk0LjU5LDg0LjI1MyBDMTk0LjM1Nyw4NC4yNTMgMTk0LjA5NSw4NC4xNzcgMTkzLjgxOCw4NC4wMTcgTDE2OS44NTEsNzAuMTc5IEwxNjkuODM3LDcwLjIwMyBMMTQyLjUxNSw4NS45NzggTDE0MS42NjUsODQuNjU1IEMxMzYuOTM0LDgzLjEyNiAxMzEuOTE3LDgxLjkxNSAxMjYuNzE0LDgxLjA0NSBDMTI2LjcwOSw4MS4wNiAxMjYuNzA3LDgxLjA2OSAxMjYuNzA3LDgxLjA2OSBMMTIxLjY0LDk4LjAzIEwxMTMuNzQ5LDEwMi41ODYgTDExMy43MTIsMTAyLjUyMyBMMTEzLjcxMiwxMzAuMTEzIEMxMTMuNzEyLDEzMC44ODUgMTEzLjMyNiwxMzEuMzMgMTEyLjc2NCwxMzEuMzMgQzExMi41MzIsMTMxLjMzIDExMi4yNjksMTMxLjI1NCAxMTEuOTkyLDEzMS4wOTQgTDY5LjUxOSwxMDYuNTcyIEM2OC41NjksMTA2LjAyMyA2Ny43OTksMTA0LjY5NSA2Ny43OTksMTAzLjYwNSBMNjcuNzk5LDEwMi41NyBMNjcuNzc4LDEwMi42MTcgQzY3LjI3LDEwMi4zOTMgNjYuNjQ4LDEwMi4yNDkgNjUuOTYyLDEwMi4yMTggQzY1Ljg3NSwxMDIuMjE0IDY1Ljc4OCwxMDIuMjEyIDY1LjcwMSwxMDIuMjEyIEM2NS42MDYsMTAyLjIxMiA2NS41MTEsMTAyLjIxNSA2NS40MTYsMTAyLjIxOSBDNjUuMTk1LDEwMi4yMjkgNjQuOTc0LDEwMi4yMzUgNjQuNzU0LDEwMi4yMzUgQzY0LjMzMSwxMDIuMjM1IDYzLjkxMSwxMDIuMjE2IDYzLjQ5OCwxMDIuMTc4IEM2MS44NDMsMTAyLjAyNSA2MC4yOTgsMTAxLjU3OCA1OS4wOTQsMTAwLjg4MiBMMTIuNTE4LDczLjk5MiBMMTIuNTIzLDc0LjAwNCBMMi4yNDUsNTUuMjU0IEMxLjI0NCw1My40MjcgMi4wMDQsNTEuMDM4IDMuOTQzLDQ5LjkxOCBMNTkuOTU0LDE3LjU3MyBDNjAuNjI2LDE3LjE4NSA2MS4zNSwxNy4wMDEgNjIuMDUzLDE3LjAwMSBDNjMuMzc5LDE3LjAwMSA2NC42MjUsMTcuNjYgNjUuMjgsMTguODU0IEw2NS4yODUsMTguODUxIEw2NS41MTIsMTkuMjY0IEw2NS41MDYsMTkuMjY4IEM2NS45MDksMjAuMDAzIDY2LjQwNSwyMC42OCA2Ni45ODMsMjEuMjg2IEw2Ny4yNiwyMS41NTYgQzY5LjE3NCwyMy40MDYgNzEuNzI4LDI0LjM1NyA3NC4zNzMsMjQuMzU3IEM3Ni4zMjIsMjQuMzU3IDc4LjMyMSwyMy44NCA4MC4xNDgsMjIuNzg1IEM4MC4xNjEsMjIuNzg1IDg3LjQ2NywxOC41NjYgODcuNDY3LDE4LjU2NiBDODguMTM5LDE4LjE3OCA4OC44NjMsMTcuOTk0IDg5LjU2NiwxNy45OTQgQzkwLjg5MiwxNy45OTQgOTIuMTM4LDE4LjY1MiA5Mi43OTIsMTkuODQ3IEw5Ni4wNDIsMjUuNzc1IEw5Ni4wNjQsMjUuNzU3IEwxMDIuODQ5LDI5LjY3NCBMMTAyLjc0NCwyOS40OTIgTDE0OS42MjUsMi41MjcgTTE0OS42MjUsMC44OTIgQzE0OS4zNDMsMC44OTIgMTQ5LjA2MiwwLjk2NSAxNDguODEsMS4xMSBMMTAyLjY0MSwyNy42NjYgTDk3LjIzMSwyNC41NDIgTDk0LjIyNiwxOS4wNjEgQzkzLjMxMywxNy4zOTQgOTEuNTI3LDE2LjM1OSA4OS41NjYsMTYuMzU4IEM4OC41NTUsMTYuMzU4IDg3LjU0NiwxNi42MzIgODYuNjQ5LDE3LjE1IEM4My44NzgsMTguNzUgNzkuNjg3LDIxLjE2OSA3OS4zNzQsMjEuMzQ1IEM3OS4zNTksMjEuMzUzIDc5LjM0NSwyMS4zNjEgNzkuMzMsMjEuMzY5IEM3Ny43OTgsMjIuMjU0IDc2LjA4NCwyMi43MjIgNzQuMzczLDIyLjcyMiBDNzIuMDgxLDIyLjcyMiA2OS45NTksMjEuODkgNjguMzk3LDIwLjM4IEw2OC4xNDUsMjAuMTM1IEM2Ny43MDYsMTkuNjcyIDY3LjMyMywxOS4xNTYgNjcuMDA2LDE4LjYwMSBDNjYuOTg4LDE4LjU1OSA2Ni45NjgsMTguNTE5IDY2Ljk0NiwxOC40NzkgTDY2LjcxOSwxOC4wNjUgQzY2LjY5LDE4LjAxMiA2Ni42NTgsMTcuOTYgNjYuNjI0LDE3LjkxMSBDNjUuNjg2LDE2LjMzNyA2My45NTEsMTUuMzY2IDYyLjA1MywxNS4zNjYgQzYxLjA0MiwxNS4zNjYgNjAuMDMzLDE1LjY0IDU5LjEzNiwxNi4xNTggTDMuMTI1LDQ4LjUwMiBDMC40MjYsNTAuMDYxIC0wLjYxMyw1My40NDIgMC44MTEsNTYuMDQgTDExLjA4OSw3NC43OSBDMTEuMjY2LDc1LjExMyAxMS41MzcsNzUuMzUzIDExLjg1LDc1LjQ5NCBMNTguMjc2LDEwMi4yOTggQzU5LjY3OSwxMDMuMTA4IDYxLjQzMywxMDMuNjMgNjMuMzQ4LDEwMy44MDYgQzYzLjgxMiwxMDMuODQ4IDY0LjI4NSwxMDMuODcgNjQuNzU0LDEwMy44NyBDNjUsMTAzLjg3IDY1LjI0OSwxMDMuODY0IDY1LjQ5NCwxMDMuODUyIEM2NS41NjMsMTAzLjg0OSA2NS42MzIsMTAzLjg0NyA2NS43MDEsMTAzLjg0NyBDNjUuNzY0LDEwMy44NDcgNjUuODI4LDEwMy44NDkgNjUuODksMTAzLjg1MiBDNjUuOTg2LDEwMy44NTYgNjYuMDgsMTAzLjg2MyA2Ni4xNzMsMTAzLjg3NCBDNjYuMjgyLDEwNS40NjcgNjcuMzMyLDEwNy4xOTcgNjguNzAyLDEwNy45ODggTDExMS4xNzQsMTMyLjUxIEMxMTEuNjk4LDEzMi44MTIgMTEyLjIzMiwxMzIuOTY1IDExMi43NjQsMTMyLjk2NSBDMTE0LjI2MSwxMzIuOTY1IDExNS4zNDcsMTMxLjc2NSAxMTUuMzQ3LDEzMC4xMTMgTDExNS4zNDcsMTAzLjU1MSBMMTIyLjQ1OCw5OS40NDYgQzEyMi44MTksOTkuMjM3IDEyMy4wODcsOTguODk4IDEyMy4yMDcsOTguNDk4IEwxMjcuODY1LDgyLjkwNSBDMTMyLjI3OSw4My43MDIgMTM2LjU1Nyw4NC43NTMgMTQwLjYwNyw4Ni4wMzMgTDE0MS4xNCw4Ni44NjIgQzE0MS40NTEsODcuMzQ2IDE0MS45NzcsODcuNjEzIDE0Mi41MTYsODcuNjEzIEMxNDIuNzk0LDg3LjYxMyAxNDMuMDc2LDg3LjU0MiAxNDMuMzMzLDg3LjM5MyBMMTY5Ljg2NSw3Mi4wNzYgTDE5Myw4NS40MzMgQzE5My41MjMsODUuNzM1IDE5NC4wNTgsODUuODg4IDE5NC41OSw4NS44ODggQzE5Ni4wODcsODUuODg4IDE5Ny4xNzMsODQuNjg5IDE5Ny4xNzMsODMuMDM2IEwxOTcuMTczLDI5LjAzNSBDMTk3LjE3MywyOC40NTEgMTk2Ljg2MSwyNy45MTEgMTk2LjM1NSwyNy42MTkgQzE5Ni4zNTUsMjcuNjE5IDE3MS44NDMsMTMuNDY3IDE3MC4zODUsMTIuNjI2IEMxNzAuMTMyLDEyLjQ4IDE2OS44NSwxMi40MDcgMTY5LjU2OCwxMi40MDcgQzE2OS4yODUsMTIuNDA3IDE2OS4wMDIsMTIuNDgxIDE2OC43NDksMTIuNjI3IEMxNjguMTQzLDEyLjk3OCAxNjUuNzU2LDE0LjM1NyAxNjQuNDI0LDE1LjEyNSBMMTU5LjYxNSwxMC44NyBDMTU4Ljc5NiwxMC4xNDUgMTU4LjE1NCw4LjkzNyAxNTguMDU0LDcuOTM0IEMxNTguMDQ1LDcuODM3IDE1OC4wMzQsNy43MzkgMTU4LjAyMSw3LjY0IEMxNTguMDA1LDcuNTIzIDE1Ny45OTgsNy40MSAxNTcuOTk4LDcuMzA0IEwxNTcuOTk4LDYuNDE4IEMxNTcuOTk4LDUuODM0IDE1Ny42ODYsNS4yOTUgMTU3LjE4MSw1LjAwMiBDMTU2LjYyNCw0LjY4IDE1MC40NDIsMS4xMTEgMTUwLjQ0MiwxLjExMSBDMTUwLjE4OSwwLjk2NSAxNDkuOTA3LDAuODkyIDE0OS42MjUsMC44OTIiIGlkPSJGaWxsLTEiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNOTYuMDI3LDI1LjYzNiBMMTQyLjYwMyw1Mi41MjcgQzE0My44MDcsNTMuMjIyIDE0NC41ODIsNTQuMTE0IDE0NC44NDUsNTUuMDY4IEwxNDQuODM1LDU1LjA3NSBMNjMuNDYxLDEwMi4wNTcgTDYzLjQ2LDEwMi4wNTcgQzYxLjgwNiwxMDEuOTA1IDYwLjI2MSwxMDEuNDU3IDU5LjA1NywxMDAuNzYyIEwxMi40ODEsNzMuODcxIEw5Ni4wMjcsMjUuNjM2IiBpZD0iRmlsbC0yIiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTYzLjQ2MSwxMDIuMTc0IEM2My40NTMsMTAyLjE3NCA2My40NDYsMTAyLjE3NCA2My40MzksMTAyLjE3MiBDNjEuNzQ2LDEwMi4wMTYgNjAuMjExLDEwMS41NjMgNTguOTk4LDEwMC44NjMgTDEyLjQyMiw3My45NzMgQzEyLjM4Niw3My45NTIgMTIuMzY0LDczLjkxNCAxMi4zNjQsNzMuODcxIEMxMi4zNjQsNzMuODMgMTIuMzg2LDczLjc5MSAxMi40MjIsNzMuNzcgTDk1Ljk2OCwyNS41MzUgQzk2LjAwNCwyNS41MTQgOTYuMDQ5LDI1LjUxNCA5Ni4wODUsMjUuNTM1IEwxNDIuNjYxLDUyLjQyNiBDMTQzLjg4OCw1My4xMzQgMTQ0LjY4Miw1NC4wMzggMTQ0Ljk1Nyw1NS4wMzcgQzE0NC45Nyw1NS4wODMgMTQ0Ljk1Myw1NS4xMzMgMTQ0LjkxNSw1NS4xNjEgQzE0NC45MTEsNTUuMTY1IDE0NC44OTgsNTUuMTc0IDE0NC44OTQsNTUuMTc3IEw2My41MTksMTAyLjE1OCBDNjMuNTAxLDEwMi4xNjkgNjMuNDgxLDEwMi4xNzQgNjMuNDYxLDEwMi4xNzQgTDYzLjQ2MSwxMDIuMTc0IFogTTEyLjcxNCw3My44NzEgTDU5LjExNSwxMDAuNjYxIEM2MC4yOTMsMTAxLjM0MSA2MS43ODYsMTAxLjc4MiA2My40MzUsMTAxLjkzNyBMMTQ0LjcwNyw1NS4wMTUgQzE0NC40MjgsNTQuMTA4IDE0My42ODIsNTMuMjg1IDE0Mi41NDQsNTIuNjI4IEw5Ni4wMjcsMjUuNzcxIEwxMi43MTQsNzMuODcxIEwxMi43MTQsNzMuODcxIFoiIGlkPSJGaWxsLTMiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTQ4LjMyNyw1OC40NzEgQzE0OC4xNDUsNTguNDggMTQ3Ljk2Miw1OC40OCAxNDcuNzgxLDU4LjQ3MiBDMTQ1Ljg4Nyw1OC4zODkgMTQ0LjQ3OSw1Ny40MzQgMTQ0LjYzNiw1Ni4zNCBDMTQ0LjY4OSw1NS45NjcgMTQ0LjY2NCw1NS41OTcgMTQ0LjU2NCw1NS4yMzUgTDYzLjQ2MSwxMDIuMDU3IEM2NC4wODksMTAyLjExNSA2NC43MzMsMTAyLjEzIDY1LjM3OSwxMDIuMDk5IEM2NS41NjEsMTAyLjA5IDY1Ljc0MywxMDIuMDkgNjUuOTI1LDEwMi4wOTggQzY3LjgxOSwxMDIuMTgxIDY5LjIyNywxMDMuMTM2IDY5LjA3LDEwNC4yMyBMMTQ4LjMyNyw1OC40NzEiIGlkPSJGaWxsLTQiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNjkuMDcsMTA0LjM0NyBDNjkuMDQ4LDEwNC4zNDcgNjkuMDI1LDEwNC4zNCA2OS4wMDUsMTA0LjMyNyBDNjguOTY4LDEwNC4zMDEgNjguOTQ4LDEwNC4yNTcgNjguOTU1LDEwNC4yMTMgQzY5LDEwMy44OTYgNjguODk4LDEwMy41NzYgNjguNjU4LDEwMy4yODggQzY4LjE1MywxMDIuNjc4IDY3LjEwMywxMDIuMjY2IDY1LjkyLDEwMi4yMTQgQzY1Ljc0MiwxMDIuMjA2IDY1LjU2MywxMDIuMjA3IDY1LjM4NSwxMDIuMjE1IEM2NC43NDIsMTAyLjI0NiA2NC4wODcsMTAyLjIzMiA2My40NSwxMDIuMTc0IEM2My4zOTksMTAyLjE2OSA2My4zNTgsMTAyLjEzMiA2My4zNDcsMTAyLjA4MiBDNjMuMzM2LDEwMi4wMzMgNjMuMzU4LDEwMS45ODEgNjMuNDAyLDEwMS45NTYgTDE0NC41MDYsNTUuMTM0IEMxNDQuNTM3LDU1LjExNiAxNDQuNTc1LDU1LjExMyAxNDQuNjA5LDU1LjEyNyBDMTQ0LjY0Miw1NS4xNDEgMTQ0LjY2OCw1NS4xNyAxNDQuNjc3LDU1LjIwNCBDMTQ0Ljc4MSw1NS41ODUgMTQ0LjgwNiw1NS45NzIgMTQ0Ljc1MSw1Ni4zNTcgQzE0NC43MDYsNTYuNjczIDE0NC44MDgsNTYuOTk0IDE0NS4wNDcsNTcuMjgyIEMxNDUuNTUzLDU3Ljg5MiAxNDYuNjAyLDU4LjMwMyAxNDcuNzg2LDU4LjM1NSBDMTQ3Ljk2NCw1OC4zNjMgMTQ4LjE0Myw1OC4zNjMgMTQ4LjMyMSw1OC4zNTQgQzE0OC4zNzcsNTguMzUyIDE0OC40MjQsNTguMzg3IDE0OC40MzksNTguNDM4IEMxNDguNDU0LDU4LjQ5IDE0OC40MzIsNTguNTQ1IDE0OC4zODUsNTguNTcyIEw2OS4xMjksMTA0LjMzMSBDNjkuMTExLDEwNC4zNDIgNjkuMDksMTA0LjM0NyA2OS4wNywxMDQuMzQ3IEw2OS4wNywxMDQuMzQ3IFogTTY1LjY2NSwxMDEuOTc1IEM2NS43NTQsMTAxLjk3NSA2NS44NDIsMTAxLjk3NyA2NS45MywxMDEuOTgxIEM2Ny4xOTYsMTAyLjAzNyA2OC4yODMsMTAyLjQ2OSA2OC44MzgsMTAzLjEzOSBDNjkuMDY1LDEwMy40MTMgNjkuMTg4LDEwMy43MTQgNjkuMTk4LDEwNC4wMjEgTDE0Ny44ODMsNTguNTkyIEMxNDcuODQ3LDU4LjU5MiAxNDcuODExLDU4LjU5MSAxNDcuNzc2LDU4LjU4OSBDMTQ2LjUwOSw1OC41MzMgMTQ1LjQyMiw1OC4xIDE0NC44NjcsNTcuNDMxIEMxNDQuNTg1LDU3LjA5MSAxNDQuNDY1LDU2LjcwNyAxNDQuNTIsNTYuMzI0IEMxNDQuNTYzLDU2LjAyMSAxNDQuNTUyLDU1LjcxNiAxNDQuNDg4LDU1LjQxNCBMNjMuODQ2LDEwMS45NyBDNjQuMzUzLDEwMi4wMDIgNjQuODY3LDEwMi4wMDYgNjUuMzc0LDEwMS45ODIgQzY1LjQ3MSwxMDEuOTc3IDY1LjU2OCwxMDEuOTc1IDY1LjY2NSwxMDEuOTc1IEw2NS42NjUsMTAxLjk3NSBaIiBpZD0iRmlsbC01IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTIuMjA4LDU1LjEzNCBDMS4yMDcsNTMuMzA3IDEuOTY3LDUwLjkxNyAzLjkwNiw0OS43OTcgTDU5LjkxNywxNy40NTMgQzYxLjg1NiwxNi4zMzMgNjQuMjQxLDE2LjkwNyA2NS4yNDMsMTguNzM0IEw2NS40NzUsMTkuMTQ0IEM2NS44NzIsMTkuODgyIDY2LjM2OCwyMC41NiA2Ni45NDUsMjEuMTY1IEw2Ny4yMjMsMjEuNDM1IEM3MC41NDgsMjQuNjQ5IDc1LjgwNiwyNS4xNTEgODAuMTExLDIyLjY2NSBMODcuNDMsMTguNDQ1IEM4OS4zNywxNy4zMjYgOTEuNzU0LDE3Ljg5OSA5Mi43NTUsMTkuNzI3IEw5Ni4wMDUsMjUuNjU1IEwxMi40ODYsNzMuODg0IEwyLjIwOCw1NS4xMzQgWiIgaWQ9IkZpbGwtNiIgZmlsbD0iI0ZBRkFGQSI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMi40ODYsNzQuMDAxIEMxMi40NzYsNzQuMDAxIDEyLjQ2NSw3My45OTkgMTIuNDU1LDczLjk5NiBDMTIuNDI0LDczLjk4OCAxMi4zOTksNzMuOTY3IDEyLjM4NCw3My45NCBMMi4xMDYsNTUuMTkgQzEuMDc1LDUzLjMxIDEuODU3LDUwLjg0NSAzLjg0OCw0OS42OTYgTDU5Ljg1OCwxNy4zNTIgQzYwLjUyNSwxNi45NjcgNjEuMjcxLDE2Ljc2NCA2Mi4wMTYsMTYuNzY0IEM2My40MzEsMTYuNzY0IDY0LjY2NiwxNy40NjYgNjUuMzI3LDE4LjY0NiBDNjUuMzM3LDE4LjY1NCA2NS4zNDUsMTguNjYzIDY1LjM1MSwxOC42NzQgTDY1LjU3OCwxOS4wODggQzY1LjU4NCwxOS4xIDY1LjU4OSwxOS4xMTIgNjUuNTkxLDE5LjEyNiBDNjUuOTg1LDE5LjgzOCA2Ni40NjksMjAuNDk3IDY3LjAzLDIxLjA4NSBMNjcuMzA1LDIxLjM1MSBDNjkuMTUxLDIzLjEzNyA3MS42NDksMjQuMTIgNzQuMzM2LDI0LjEyIEM3Ni4zMTMsMjQuMTIgNzguMjksMjMuNTgyIDgwLjA1MywyMi41NjMgQzgwLjA2NCwyMi41NTcgODAuMDc2LDIyLjU1MyA4MC4wODgsMjIuNTUgTDg3LjM3MiwxOC4zNDQgQzg4LjAzOCwxNy45NTkgODguNzg0LDE3Ljc1NiA4OS41MjksMTcuNzU2IEM5MC45NTYsMTcuNzU2IDkyLjIwMSwxOC40NzIgOTIuODU4LDE5LjY3IEw5Ni4xMDcsMjUuNTk5IEM5Ni4xMzgsMjUuNjU0IDk2LjExOCwyNS43MjQgOTYuMDYzLDI1Ljc1NiBMMTIuNTQ1LDczLjk4NSBDMTIuNTI2LDczLjk5NiAxMi41MDYsNzQuMDAxIDEyLjQ4Niw3NC4wMDEgTDEyLjQ4Niw3NC4wMDEgWiBNNjIuMDE2LDE2Ljk5NyBDNjEuMzEyLDE2Ljk5NyA2MC42MDYsMTcuMTkgNTkuOTc1LDE3LjU1NCBMMy45NjUsNDkuODk5IEMyLjA4Myw1MC45ODUgMS4zNDEsNTMuMzA4IDIuMzEsNTUuMDc4IEwxMi41MzEsNzMuNzIzIEw5NS44NDgsMjUuNjExIEw5Mi42NTMsMTkuNzgyIEM5Mi4wMzgsMTguNjYgOTAuODcsMTcuOTkgODkuNTI5LDE3Ljk5IEM4OC44MjUsMTcuOTkgODguMTE5LDE4LjE4MiA4Ny40ODksMTguNTQ3IEw4MC4xNzIsMjIuNzcyIEM4MC4xNjEsMjIuNzc4IDgwLjE0OSwyMi43ODIgODAuMTM3LDIyLjc4NSBDNzguMzQ2LDIzLjgxMSA3Ni4zNDEsMjQuMzU0IDc0LjMzNiwyNC4zNTQgQzcxLjU4OCwyNC4zNTQgNjkuMDMzLDIzLjM0NyA2Ny4xNDIsMjEuNTE5IEw2Ni44NjQsMjEuMjQ5IEM2Ni4yNzcsMjAuNjM0IDY1Ljc3NCwxOS45NDcgNjUuMzY3LDE5LjIwMyBDNjUuMzYsMTkuMTkyIDY1LjM1NiwxOS4xNzkgNjUuMzU0LDE5LjE2NiBMNjUuMTYzLDE4LjgxOSBDNjUuMTU0LDE4LjgxMSA2NS4xNDYsMTguODAxIDY1LjE0LDE4Ljc5IEM2NC41MjUsMTcuNjY3IDYzLjM1NywxNi45OTcgNjIuMDE2LDE2Ljk5NyBMNjIuMDE2LDE2Ljk5NyBaIiBpZD0iRmlsbC03IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTQyLjQzNCw0OC44MDggTDQyLjQzNCw0OC44MDggQzM5LjkyNCw0OC44MDcgMzcuNzM3LDQ3LjU1IDM2LjU4Miw0NS40NDMgQzM0Ljc3MSw0Mi4xMzkgMzYuMTQ0LDM3LjgwOSAzOS42NDEsMzUuNzg5IEw1MS45MzIsMjguNjkxIEM1My4xMDMsMjguMDE1IDU0LjQxMywyNy42NTggNTUuNzIxLDI3LjY1OCBDNTguMjMxLDI3LjY1OCA2MC40MTgsMjguOTE2IDYxLjU3MywzMS4wMjMgQzYzLjM4NCwzNC4zMjcgNjIuMDEyLDM4LjY1NyA1OC41MTQsNDAuNjc3IEw0Ni4yMjMsNDcuNzc1IEM0NS4wNTMsNDguNDUgNDMuNzQyLDQ4LjgwOCA0Mi40MzQsNDguODA4IEw0Mi40MzQsNDguODA4IFogTTU1LjcyMSwyOC4xMjUgQzU0LjQ5NSwyOC4xMjUgNTMuMjY1LDI4LjQ2MSA1Mi4xNjYsMjkuMDk2IEwzOS44NzUsMzYuMTk0IEMzNi41OTYsMzguMDg3IDM1LjMwMiw0Mi4xMzYgMzYuOTkyLDQ1LjIxOCBDMzguMDYzLDQ3LjE3MyA0MC4wOTgsNDguMzQgNDIuNDM0LDQ4LjM0IEM0My42NjEsNDguMzQgNDQuODksNDguMDA1IDQ1Ljk5LDQ3LjM3IEw1OC4yODEsNDAuMjcyIEM2MS41NiwzOC4zNzkgNjIuODUzLDM0LjMzIDYxLjE2NCwzMS4yNDggQzYwLjA5MiwyOS4yOTMgNTguMDU4LDI4LjEyNSA1NS43MjEsMjguMTI1IEw1NS43MjEsMjguMTI1IFoiIGlkPSJGaWxsLTgiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTQ5LjU4OCwyLjQwNyBDMTQ5LjU4OCwyLjQwNyAxNTUuNzY4LDUuOTc1IDE1Ni4zMjUsNi4yOTcgTDE1Ni4zMjUsNy4xODQgQzE1Ni4zMjUsNy4zNiAxNTYuMzM4LDcuNTQ0IDE1Ni4zNjIsNy43MzMgQzE1Ni4zNzMsNy44MTQgMTU2LjM4Miw3Ljg5NCAxNTYuMzksNy45NzUgQzE1Ni41Myw5LjM5IDE1Ny4zNjMsMTAuOTczIDE1OC40OTUsMTEuOTc0IEwxNjUuODkxLDE4LjUxOSBDMTY2LjA2OCwxOC42NzUgMTY2LjI0OSwxOC44MTQgMTY2LjQzMiwxOC45MzQgQzE2OC4wMTEsMTkuOTc0IDE2OS4zODIsMTkuNCAxNjkuNDk0LDE3LjY1MiBDMTY5LjU0MywxNi44NjggMTY5LjU1MSwxNi4wNTcgMTY5LjUxNywxNS4yMjMgTDE2OS41MTQsMTUuMDYzIEwxNjkuNTE0LDEzLjkxMiBDMTcwLjc4LDE0LjY0MiAxOTUuNTAxLDI4LjkxNSAxOTUuNTAxLDI4LjkxNSBMMTk1LjUwMSw4Mi45MTUgQzE5NS41MDEsODQuMDA1IDE5NC43MzEsODQuNDQ1IDE5My43ODEsODMuODk3IEwxNTEuMzA4LDU5LjM3NCBDMTUwLjM1OCw1OC44MjYgMTQ5LjU4OCw1Ny40OTcgMTQ5LjU4OCw1Ni40MDggTDE0OS41ODgsMjIuMzc1IiBpZD0iRmlsbC05IiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE5NC41NTMsODQuMjUgQzE5NC4yOTYsODQuMjUgMTk0LjAxMyw4NC4xNjUgMTkzLjcyMiw4My45OTcgTDE1MS4yNSw1OS40NzYgQzE1MC4yNjksNTguOTA5IDE0OS40NzEsNTcuNTMzIDE0OS40NzEsNTYuNDA4IEwxNDkuNDcxLDIyLjM3NSBMMTQ5LjcwNSwyMi4zNzUgTDE0OS43MDUsNTYuNDA4IEMxNDkuNzA1LDU3LjQ1OSAxNTAuNDUsNTguNzQ0IDE1MS4zNjYsNTkuMjc0IEwxOTMuODM5LDgzLjc5NSBDMTk0LjI2Myw4NC4wNCAxOTQuNjU1LDg0LjA4MyAxOTQuOTQyLDgzLjkxNyBDMTk1LjIyNyw4My43NTMgMTk1LjM4NCw4My4zOTcgMTk1LjM4NCw4Mi45MTUgTDE5NS4zODQsMjguOTgyIEMxOTQuMTAyLDI4LjI0MiAxNzIuMTA0LDE1LjU0MiAxNjkuNjMxLDE0LjExNCBMMTY5LjYzNCwxNS4yMiBDMTY5LjY2OCwxNi4wNTIgMTY5LjY2LDE2Ljg3NCAxNjkuNjEsMTcuNjU5IEMxNjkuNTU2LDE4LjUwMyAxNjkuMjE0LDE5LjEyMyAxNjguNjQ3LDE5LjQwNSBDMTY4LjAyOCwxOS43MTQgMTY3LjE5NywxOS41NzggMTY2LjM2NywxOS4wMzIgQzE2Ni4xODEsMTguOTA5IDE2NS45OTUsMTguNzY2IDE2NS44MTQsMTguNjA2IEwxNTguNDE3LDEyLjA2MiBDMTU3LjI1OSwxMS4wMzYgMTU2LjQxOCw5LjQzNyAxNTYuMjc0LDcuOTg2IEMxNTYuMjY2LDcuOTA3IDE1Ni4yNTcsNy44MjcgMTU2LjI0Nyw3Ljc0OCBDMTU2LjIyMSw3LjU1NSAxNTYuMjA5LDcuMzY1IDE1Ni4yMDksNy4xODQgTDE1Ni4yMDksNi4zNjQgQzE1NS4zNzUsNS44ODMgMTQ5LjUyOSwyLjUwOCAxNDkuNTI5LDIuNTA4IEwxNDkuNjQ2LDIuMzA2IEMxNDkuNjQ2LDIuMzA2IDE1NS44MjcsNS44NzQgMTU2LjM4NCw2LjE5NiBMMTU2LjQ0Miw2LjIzIEwxNTYuNDQyLDcuMTg0IEMxNTYuNDQyLDcuMzU1IDE1Ni40NTQsNy41MzUgMTU2LjQ3OCw3LjcxNyBDMTU2LjQ4OSw3LjggMTU2LjQ5OSw3Ljg4MiAxNTYuNTA3LDcuOTYzIEMxNTYuNjQ1LDkuMzU4IDE1Ny40NTUsMTAuODk4IDE1OC41NzIsMTEuODg2IEwxNjUuOTY5LDE4LjQzMSBDMTY2LjE0MiwxOC41ODQgMTY2LjMxOSwxOC43MiAxNjYuNDk2LDE4LjgzNyBDMTY3LjI1NCwxOS4zMzYgMTY4LDE5LjQ2NyAxNjguNTQzLDE5LjE5NiBDMTY5LjAzMywxOC45NTMgMTY5LjMyOSwxOC40MDEgMTY5LjM3NywxNy42NDUgQzE2OS40MjcsMTYuODY3IDE2OS40MzQsMTYuMDU0IDE2OS40MDEsMTUuMjI4IEwxNjkuMzk3LDE1LjA2NSBMMTY5LjM5NywxMy43MSBMMTY5LjU3MiwxMy44MSBDMTcwLjgzOSwxNC41NDEgMTk1LjU1OSwyOC44MTQgMTk1LjU1OSwyOC44MTQgTDE5NS42MTgsMjguODQ3IEwxOTUuNjE4LDgyLjkxNSBDMTk1LjYxOCw4My40ODQgMTk1LjQyLDgzLjkxMSAxOTUuMDU5LDg0LjExOSBDMTk0LjkwOCw4NC4yMDYgMTk0LjczNyw4NC4yNSAxOTQuNTUzLDg0LjI1IiBpZD0iRmlsbC0xMCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNDUuNjg1LDU2LjE2MSBMMTY5LjgsNzAuMDgzIEwxNDMuODIyLDg1LjA4MSBMMTQyLjM2LDg0Ljc3NCBDMTM1LjgyNiw4Mi42MDQgMTI4LjczMiw4MS4wNDYgMTIxLjM0MSw4MC4xNTggQzExNi45NzYsNzkuNjM0IDExMi42NzgsODEuMjU0IDExMS43NDMsODMuNzc4IEMxMTEuNTA2LDg0LjQxNCAxMTEuNTAzLDg1LjA3MSAxMTEuNzMyLDg1LjcwNiBDMTEzLjI3LDg5Ljk3MyAxMTUuOTY4LDk0LjA2OSAxMTkuNzI3LDk3Ljg0MSBMMTIwLjI1OSw5OC42ODYgQzEyMC4yNiw5OC42ODUgOTQuMjgyLDExMy42ODMgOTQuMjgyLDExMy42ODMgTDcwLjE2Nyw5OS43NjEgTDE0NS42ODUsNTYuMTYxIiBpZD0iRmlsbC0xMSIgZmlsbD0iI0ZGRkZGRiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik05NC4yODIsMTEzLjgxOCBMOTQuMjIzLDExMy43ODUgTDY5LjkzMyw5OS43NjEgTDcwLjEwOCw5OS42NiBMMTQ1LjY4NSw1Ni4wMjYgTDE0NS43NDMsNTYuMDU5IEwxNzAuMDMzLDcwLjA4MyBMMTQzLjg0Miw4NS4yMDUgTDE0My43OTcsODUuMTk1IEMxNDMuNzcyLDg1LjE5IDE0Mi4zMzYsODQuODg4IDE0Mi4zMzYsODQuODg4IEMxMzUuNzg3LDgyLjcxNCAxMjguNzIzLDgxLjE2MyAxMjEuMzI3LDgwLjI3NCBDMTIwLjc4OCw4MC4yMDkgMTIwLjIzNiw4MC4xNzcgMTE5LjY4OSw4MC4xNzcgQzExNS45MzEsODAuMTc3IDExMi42MzUsODEuNzA4IDExMS44NTIsODMuODE5IEMxMTEuNjI0LDg0LjQzMiAxMTEuNjIxLDg1LjA1MyAxMTEuODQyLDg1LjY2NyBDMTEzLjM3Nyw4OS45MjUgMTE2LjA1OCw5My45OTMgMTE5LjgxLDk3Ljc1OCBMMTE5LjgyNiw5Ny43NzkgTDEyMC4zNTIsOTguNjE0IEMxMjAuMzU0LDk4LjYxNyAxMjAuMzU2LDk4LjYyIDEyMC4zNTgsOTguNjI0IEwxMjAuNDIyLDk4LjcyNiBMMTIwLjMxNyw5OC43ODcgQzEyMC4yNjQsOTguODE4IDk0LjU5OSwxMTMuNjM1IDk0LjM0LDExMy43ODUgTDk0LjI4MiwxMTMuODE4IEw5NC4yODIsMTEzLjgxOCBaIE03MC40MDEsOTkuNzYxIEw5NC4yODIsMTEzLjU0OSBMMTE5LjA4NCw5OS4yMjkgQzExOS42Myw5OC45MTQgMTE5LjkzLDk4Ljc0IDEyMC4xMDEsOTguNjU0IEwxMTkuNjM1LDk3LjkxNCBDMTE1Ljg2NCw5NC4xMjcgMTEzLjE2OCw5MC4wMzMgMTExLjYyMiw4NS43NDYgQzExMS4zODIsODUuMDc5IDExMS4zODYsODQuNDA0IDExMS42MzMsODMuNzM4IEMxMTIuNDQ4LDgxLjUzOSAxMTUuODM2LDc5Ljk0MyAxMTkuNjg5LDc5Ljk0MyBDMTIwLjI0Niw3OS45NDMgMTIwLjgwNiw3OS45NzYgMTIxLjM1NSw4MC4wNDIgQzEyOC43NjcsODAuOTMzIDEzNS44NDYsODIuNDg3IDE0Mi4zOTYsODQuNjYzIEMxNDMuMjMyLDg0LjgzOCAxNDMuNjExLDg0LjkxNyAxNDMuNzg2LDg0Ljk2NyBMMTY5LjU2Niw3MC4wODMgTDE0NS42ODUsNTYuMjk1IEw3MC40MDEsOTkuNzYxIEw3MC40MDEsOTkuNzYxIFoiIGlkPSJGaWxsLTEyIiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE2Ny4yMywxOC45NzkgTDE2Ny4yMyw2OS44NSBMMTM5LjkwOSw4NS42MjMgTDEzMy40NDgsNzEuNDU2IEMxMzIuNTM4LDY5LjQ2IDEzMC4wMiw2OS43MTggMTI3LjgyNCw3Mi4wMyBDMTI2Ljc2OSw3My4xNCAxMjUuOTMxLDc0LjU4NSAxMjUuNDk0LDc2LjA0OCBMMTE5LjAzNCw5Ny42NzYgTDkxLjcxMiwxMTMuNDUgTDkxLjcxMiw2Mi41NzkgTDE2Ny4yMywxOC45NzkiIGlkPSJGaWxsLTEzIiBmaWxsPSIjRkZGRkZGIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTkxLjcxMiwxMTMuNTY3IEM5MS42OTIsMTEzLjU2NyA5MS42NzIsMTEzLjU2MSA5MS42NTMsMTEzLjU1MSBDOTEuNjE4LDExMy41MyA5MS41OTUsMTEzLjQ5MiA5MS41OTUsMTEzLjQ1IEw5MS41OTUsNjIuNTc5IEM5MS41OTUsNjIuNTM3IDkxLjYxOCw2Mi40OTkgOTEuNjUzLDYyLjQ3OCBMMTY3LjE3MiwxOC44NzggQzE2Ny4yMDgsMTguODU3IDE2Ny4yNTIsMTguODU3IDE2Ny4yODgsMTguODc4IEMxNjcuMzI0LDE4Ljg5OSAxNjcuMzQ3LDE4LjkzNyAxNjcuMzQ3LDE4Ljk3OSBMMTY3LjM0Nyw2OS44NSBDMTY3LjM0Nyw2OS44OTEgMTY3LjMyNCw2OS45MyAxNjcuMjg4LDY5Ljk1IEwxMzkuOTY3LDg1LjcyNSBDMTM5LjkzOSw4NS43NDEgMTM5LjkwNSw4NS43NDUgMTM5Ljg3Myw4NS43MzUgQzEzOS44NDIsODUuNzI1IDEzOS44MTYsODUuNzAyIDEzOS44MDIsODUuNjcyIEwxMzMuMzQyLDcxLjUwNCBDMTMyLjk2Nyw3MC42ODIgMTMyLjI4LDcwLjIyOSAxMzEuNDA4LDcwLjIyOSBDMTMwLjMxOSw3MC4yMjkgMTI5LjA0NCw3MC45MTUgMTI3LjkwOCw3Mi4xMSBDMTI2Ljg3NCw3My4yIDEyNi4wMzQsNzQuNjQ3IDEyNS42MDYsNzYuMDgyIEwxMTkuMTQ2LDk3LjcwOSBDMTE5LjEzNyw5Ny43MzggMTE5LjExOCw5Ny43NjIgMTE5LjA5Miw5Ny43NzcgTDkxLjc3LDExMy41NTEgQzkxLjc1MiwxMTMuNTYxIDkxLjczMiwxMTMuNTY3IDkxLjcxMiwxMTMuNTY3IEw5MS43MTIsMTEzLjU2NyBaIE05MS44MjksNjIuNjQ3IEw5MS44MjksMTEzLjI0OCBMMTE4LjkzNSw5Ny41OTggTDEyNS4zODIsNzYuMDE1IEMxMjUuODI3LDc0LjUyNSAxMjYuNjY0LDczLjA4MSAxMjcuNzM5LDcxLjk1IEMxMjguOTE5LDcwLjcwOCAxMzAuMjU2LDY5Ljk5NiAxMzEuNDA4LDY5Ljk5NiBDMTMyLjM3Nyw2OS45OTYgMTMzLjEzOSw3MC40OTcgMTMzLjU1NCw3MS40MDcgTDEzOS45NjEsODUuNDU4IEwxNjcuMTEzLDY5Ljc4MiBMMTY3LjExMywxOS4xODEgTDkxLjgyOSw2Mi42NDcgTDkxLjgyOSw2Mi42NDcgWiIgaWQ9IkZpbGwtMTQiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTY4LjU0MywxOS4yMTMgTDE2OC41NDMsNzAuMDgzIEwxNDEuMjIxLDg1Ljg1NyBMMTM0Ljc2MSw3MS42ODkgQzEzMy44NTEsNjkuNjk0IDEzMS4zMzMsNjkuOTUxIDEyOS4xMzcsNzIuMjYzIEMxMjguMDgyLDczLjM3NCAxMjcuMjQ0LDc0LjgxOSAxMjYuODA3LDc2LjI4MiBMMTIwLjM0Niw5Ny45MDkgTDkzLjAyNSwxMTMuNjgzIEw5My4wMjUsNjIuODEzIEwxNjguNTQzLDE5LjIxMyIgaWQ9IkZpbGwtMTUiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNOTMuMDI1LDExMy44IEM5My4wMDUsMTEzLjggOTIuOTg0LDExMy43OTUgOTIuOTY2LDExMy43ODUgQzkyLjkzMSwxMTMuNzY0IDkyLjkwOCwxMTMuNzI1IDkyLjkwOCwxMTMuNjg0IEw5Mi45MDgsNjIuODEzIEM5Mi45MDgsNjIuNzcxIDkyLjkzMSw2Mi43MzMgOTIuOTY2LDYyLjcxMiBMMTY4LjQ4NCwxOS4xMTIgQzE2OC41MiwxOS4wOSAxNjguNTY1LDE5LjA5IDE2OC42MDEsMTkuMTEyIEMxNjguNjM3LDE5LjEzMiAxNjguNjYsMTkuMTcxIDE2OC42NiwxOS4yMTIgTDE2OC42Niw3MC4wODMgQzE2OC42Niw3MC4xMjUgMTY4LjYzNyw3MC4xNjQgMTY4LjYwMSw3MC4xODQgTDE0MS4yOCw4NS45NTggQzE0MS4yNTEsODUuOTc1IDE0MS4yMTcsODUuOTc5IDE0MS4xODYsODUuOTY4IEMxNDEuMTU0LDg1Ljk1OCAxNDEuMTI5LDg1LjkzNiAxNDEuMTE1LDg1LjkwNiBMMTM0LjY1NSw3MS43MzggQzEzNC4yOCw3MC45MTUgMTMzLjU5Myw3MC40NjMgMTMyLjcyLDcwLjQ2MyBDMTMxLjYzMiw3MC40NjMgMTMwLjM1Nyw3MS4xNDggMTI5LjIyMSw3Mi4zNDQgQzEyOC4xODYsNzMuNDMzIDEyNy4zNDcsNzQuODgxIDEyNi45MTksNzYuMzE1IEwxMjAuNDU4LDk3Ljk0MyBDMTIwLjQ1LDk3Ljk3MiAxMjAuNDMxLDk3Ljk5NiAxMjAuNDA1LDk4LjAxIEw5My4wODMsMTEzLjc4NSBDOTMuMDY1LDExMy43OTUgOTMuMDQ1LDExMy44IDkzLjAyNSwxMTMuOCBMOTMuMDI1LDExMy44IFogTTkzLjE0Miw2Mi44ODEgTDkzLjE0MiwxMTMuNDgxIEwxMjAuMjQ4LDk3LjgzMiBMMTI2LjY5NSw3Ni4yNDggQzEyNy4xNCw3NC43NTggMTI3Ljk3Nyw3My4zMTUgMTI5LjA1Miw3Mi4xODMgQzEzMC4yMzEsNzAuOTQyIDEzMS41NjgsNzAuMjI5IDEzMi43Miw3MC4yMjkgQzEzMy42ODksNzAuMjI5IDEzNC40NTIsNzAuNzMxIDEzNC44NjcsNzEuNjQxIEwxNDEuMjc0LDg1LjY5MiBMMTY4LjQyNiw3MC4wMTYgTDE2OC40MjYsMTkuNDE1IEw5My4xNDIsNjIuODgxIEw5My4xNDIsNjIuODgxIFoiIGlkPSJGaWxsLTE2IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE2OS44LDcwLjA4MyBMMTQyLjQ3OCw4NS44NTcgTDEzNi4wMTgsNzEuNjg5IEMxMzUuMTA4LDY5LjY5NCAxMzIuNTksNjkuOTUxIDEzMC4zOTMsNzIuMjYzIEMxMjkuMzM5LDczLjM3NCAxMjguNSw3NC44MTkgMTI4LjA2NCw3Ni4yODIgTDEyMS42MDMsOTcuOTA5IEw5NC4yODIsMTEzLjY4MyBMOTQuMjgyLDYyLjgxMyBMMTY5LjgsMTkuMjEzIEwxNjkuOCw3MC4wODMgWiIgaWQ9IkZpbGwtMTciIGZpbGw9IiNGQUZBRkEiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNOTQuMjgyLDExMy45MTcgQzk0LjI0MSwxMTMuOTE3IDk0LjIwMSwxMTMuOTA3IDk0LjE2NSwxMTMuODg2IEM5NC4wOTMsMTEzLjg0NSA5NC4wNDgsMTEzLjc2NyA5NC4wNDgsMTEzLjY4NCBMOTQuMDQ4LDYyLjgxMyBDOTQuMDQ4LDYyLjczIDk0LjA5Myw2Mi42NTIgOTQuMTY1LDYyLjYxMSBMMTY5LjY4MywxOS4wMSBDMTY5Ljc1NSwxOC45NjkgMTY5Ljg0NCwxOC45NjkgMTY5LjkxNywxOS4wMSBDMTY5Ljk4OSwxOS4wNTIgMTcwLjAzMywxOS4xMjkgMTcwLjAzMywxOS4yMTIgTDE3MC4wMzMsNzAuMDgzIEMxNzAuMDMzLDcwLjE2NiAxNjkuOTg5LDcwLjI0NCAxNjkuOTE3LDcwLjI4NSBMMTQyLjU5NSw4Ni4wNiBDMTQyLjUzOCw4Ni4wOTIgMTQyLjQ2OSw4Ni4xIDE0Mi40MDcsODYuMDggQzE0Mi4zNDQsODYuMDYgMTQyLjI5Myw4Ni4wMTQgMTQyLjI2Niw4NS45NTQgTDEzNS44MDUsNzEuNzg2IEMxMzUuNDQ1LDcwLjk5NyAxMzQuODEzLDcwLjU4IDEzMy45NzcsNzAuNTggQzEzMi45MjEsNzAuNTggMTMxLjY3Niw3MS4yNTIgMTMwLjU2Miw3Mi40MjQgQzEyOS41NCw3My41MDEgMTI4LjcxMSw3NC45MzEgMTI4LjI4Nyw3Ni4zNDggTDEyMS44MjcsOTcuOTc2IEMxMjEuODEsOTguMDM0IDEyMS43NzEsOTguMDgyIDEyMS43Miw5OC4xMTIgTDk0LjM5OCwxMTMuODg2IEM5NC4zNjIsMTEzLjkwNyA5NC4zMjIsMTEzLjkxNyA5NC4yODIsMTEzLjkxNyBMOTQuMjgyLDExMy45MTcgWiBNOTQuNTE1LDYyLjk0OCBMOTQuNTE1LDExMy4yNzkgTDEyMS40MDYsOTcuNzU0IEwxMjcuODQsNzYuMjE1IEMxMjguMjksNzQuNzA4IDEyOS4xMzcsNzMuMjQ3IDEzMC4yMjQsNzIuMTAzIEMxMzEuNDI1LDcwLjgzOCAxMzIuNzkzLDcwLjExMiAxMzMuOTc3LDcwLjExMiBDMTM0Ljk5NSw3MC4xMTIgMTM1Ljc5NSw3MC42MzggMTM2LjIzLDcxLjU5MiBMMTQyLjU4NCw4NS41MjYgTDE2OS41NjYsNjkuOTQ4IEwxNjkuNTY2LDE5LjYxNyBMOTQuNTE1LDYyLjk0OCBMOTQuNTE1LDYyLjk0OCBaIiBpZD0iRmlsbC0xOCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMDkuODk0LDkyLjk0MyBMMTA5Ljg5NCw5Mi45NDMgQzEwOC4xMiw5Mi45NDMgMTA2LjY1Myw5Mi4yMTggMTA1LjY1LDkwLjgyMyBDMTA1LjU4Myw5MC43MzEgMTA1LjU5Myw5MC42MSAxMDUuNjczLDkwLjUyOSBDMTA1Ljc1Myw5MC40NDggMTA1Ljg4LDkwLjQ0IDEwNS45NzQsOTAuNTA2IEMxMDYuNzU0LDkxLjA1MyAxMDcuNjc5LDkxLjMzMyAxMDguNzI0LDkxLjMzMyBDMTEwLjA0Nyw5MS4zMzMgMTExLjQ3OCw5MC44OTQgMTEyLjk4LDkwLjAyNyBDMTE4LjI5MSw4Ni45NiAxMjIuNjExLDc5LjUwOSAxMjIuNjExLDczLjQxNiBDMTIyLjYxMSw3MS40ODkgMTIyLjE2OSw2OS44NTYgMTIxLjMzMyw2OC42OTIgQzEyMS4yNjYsNjguNiAxMjEuMjc2LDY4LjQ3MyAxMjEuMzU2LDY4LjM5MiBDMTIxLjQzNiw2OC4zMTEgMTIxLjU2Myw2OC4yOTkgMTIxLjY1Niw2OC4zNjUgQzEyMy4zMjcsNjkuNTM3IDEyNC4yNDcsNzEuNzQ2IDEyNC4yNDcsNzQuNTg0IEMxMjQuMjQ3LDgwLjgyNiAxMTkuODIxLDg4LjQ0NyAxMTQuMzgyLDkxLjU4NyBDMTEyLjgwOCw5Mi40OTUgMTExLjI5OCw5Mi45NDMgMTA5Ljg5NCw5Mi45NDMgTDEwOS44OTQsOTIuOTQzIFogTTEwNi45MjUsOTEuNDAxIEMxMDcuNzM4LDkyLjA1MiAxMDguNzQ1LDkyLjI3OCAxMDkuODkzLDkyLjI3OCBMMTA5Ljg5NCw5Mi4yNzggQzExMS4yMTUsOTIuMjc4IDExMi42NDcsOTEuOTUxIDExNC4xNDgsOTEuMDg0IEMxMTkuNDU5LDg4LjAxNyAxMjMuNzgsODAuNjIxIDEyMy43OCw3NC41MjggQzEyMy43OCw3Mi41NDkgMTIzLjMxNyw3MC45MjkgMTIyLjQ1NCw2OS43NjcgQzEyMi44NjUsNzAuODAyIDEyMy4wNzksNzIuMDQyIDEyMy4wNzksNzMuNDAyIEMxMjMuMDc5LDc5LjY0NSAxMTguNjUzLDg3LjI4NSAxMTMuMjE0LDkwLjQyNSBDMTExLjY0LDkxLjMzNCAxMTAuMTMsOTEuNzQyIDEwOC43MjQsOTEuNzQyIEMxMDguMDgzLDkxLjc0MiAxMDcuNDgxLDkxLjU5MyAxMDYuOTI1LDkxLjQwMSBMMTA2LjkyNSw5MS40MDEgWiIgaWQ9IkZpbGwtMTkiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEzLjA5Nyw5MC4yMyBDMTE4LjQ4MSw4Ny4xMjIgMTIyLjg0NSw3OS41OTQgMTIyLjg0NSw3My40MTYgQzEyMi44NDUsNzEuMzY1IDEyMi4zNjIsNjkuNzI0IDEyMS41MjIsNjguNTU2IEMxMTkuNzM4LDY3LjMwNCAxMTcuMTQ4LDY3LjM2MiAxMTQuMjY1LDY5LjAyNiBDMTA4Ljg4MSw3Mi4xMzQgMTA0LjUxNyw3OS42NjIgMTA0LjUxNyw4NS44NCBDMTA0LjUxNyw4Ny44OTEgMTA1LDg5LjUzMiAxMDUuODQsOTAuNyBDMTA3LjYyNCw5MS45NTIgMTEwLjIxNCw5MS44OTQgMTEzLjA5Nyw5MC4yMyIgaWQ9IkZpbGwtMjAiIGZpbGw9IiNGQUZBRkEiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTA4LjcyNCw5MS42MTQgTDEwOC43MjQsOTEuNjE0IEMxMDcuNTgyLDkxLjYxNCAxMDYuNTY2LDkxLjQwMSAxMDUuNzA1LDkwLjc5NyBDMTA1LjY4NCw5MC43ODMgMTA1LjY2NSw5MC44MTEgMTA1LjY1LDkwLjc5IEMxMDQuNzU2LDg5LjU0NiAxMDQuMjgzLDg3Ljg0MiAxMDQuMjgzLDg1LjgxNyBDMTA0LjI4Myw3OS41NzUgMTA4LjcwOSw3MS45NTMgMTE0LjE0OCw2OC44MTIgQzExNS43MjIsNjcuOTA0IDExNy4yMzIsNjcuNDQ5IDExOC42MzgsNjcuNDQ5IEMxMTkuNzgsNjcuNDQ5IDEyMC43OTYsNjcuNzU4IDEyMS42NTYsNjguMzYyIEMxMjEuNjc4LDY4LjM3NyAxMjEuNjk3LDY4LjM5NyAxMjEuNzEyLDY4LjQxOCBDMTIyLjYwNiw2OS42NjIgMTIzLjA3OSw3MS4zOSAxMjMuMDc5LDczLjQxNSBDMTIzLjA3OSw3OS42NTggMTE4LjY1Myw4Ny4xOTggMTEzLjIxNCw5MC4zMzggQzExMS42NCw5MS4yNDcgMTEwLjEzLDkxLjYxNCAxMDguNzI0LDkxLjYxNCBMMTA4LjcyNCw5MS42MTQgWiBNMTA2LjAwNiw5MC41MDUgQzEwNi43OCw5MS4wMzcgMTA3LjY5NCw5MS4yODEgMTA4LjcyNCw5MS4yODEgQzExMC4wNDcsOTEuMjgxIDExMS40NzgsOTAuODY4IDExMi45OCw5MC4wMDEgQzExOC4yOTEsODYuOTM1IDEyMi42MTEsNzkuNDk2IDEyMi42MTEsNzMuNDAzIEMxMjIuNjExLDcxLjQ5NCAxMjIuMTc3LDY5Ljg4IDEyMS4zNTYsNjguNzE4IEMxMjAuNTgyLDY4LjE4NSAxMTkuNjY4LDY3LjkxOSAxMTguNjM4LDY3LjkxOSBDMTE3LjMxNSw2Ny45MTkgMTE1Ljg4Myw2OC4zNiAxMTQuMzgyLDY5LjIyNyBDMTA5LjA3MSw3Mi4yOTMgMTA0Ljc1MSw3OS43MzMgMTA0Ljc1MSw4NS44MjYgQzEwNC43NTEsODcuNzM1IDEwNS4xODUsODkuMzQzIDEwNi4wMDYsOTAuNTA1IEwxMDYuMDA2LDkwLjUwNSBaIiBpZD0iRmlsbC0yMSIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNDkuMzE4LDcuMjYyIEwxMzkuMzM0LDE2LjE0IEwxNTUuMjI3LDI3LjE3MSBMMTYwLjgxNiwyMS4wNTkgTDE0OS4zMTgsNy4yNjIiIGlkPSJGaWxsLTIyIiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE2OS42NzYsMTMuODQgTDE1OS45MjgsMTkuNDY3IEMxNTYuMjg2LDIxLjU3IDE1MC40LDIxLjU4IDE0Ni43ODEsMTkuNDkxIEMxNDMuMTYxLDE3LjQwMiAxNDMuMTgsMTQuMDAzIDE0Ni44MjIsMTEuOSBMMTU2LjMxNyw2LjI5MiBMMTQ5LjU4OCwyLjQwNyBMNjcuNzUyLDQ5LjQ3OCBMMTEzLjY3NSw3NS45OTIgTDExNi43NTYsNzQuMjEzIEMxMTcuMzg3LDczLjg0OCAxMTcuNjI1LDczLjMxNSAxMTcuMzc0LDcyLjgyMyBDMTE1LjAxNyw2OC4xOTEgMTE0Ljc4MSw2My4yNzcgMTE2LjY5MSw1OC41NjEgQzEyMi4zMjksNDQuNjQxIDE0MS4yLDMzLjc0NiAxNjUuMzA5LDMwLjQ5MSBDMTczLjQ3OCwyOS4zODggMTgxLjk4OSwyOS41MjQgMTkwLjAxMywzMC44ODUgQzE5MC44NjUsMzEuMDMgMTkxLjc4OSwzMC44OTMgMTkyLjQyLDMwLjUyOCBMMTk1LjUwMSwyOC43NSBMMTY5LjY3NiwxMy44NCIgaWQ9IkZpbGwtMjMiIGZpbGw9IiNGQUZBRkEiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEzLjY3NSw3Ni40NTkgQzExMy41OTQsNzYuNDU5IDExMy41MTQsNzYuNDM4IDExMy40NDIsNzYuMzk3IEw2Ny41MTgsNDkuODgyIEM2Ny4zNzQsNDkuNzk5IDY3LjI4NCw0OS42NDUgNjcuMjg1LDQ5LjQ3OCBDNjcuMjg1LDQ5LjMxMSA2Ny4zNzQsNDkuMTU3IDY3LjUxOSw0OS4wNzMgTDE0OS4zNTUsMi4wMDIgQzE0OS40OTksMS45MTkgMTQ5LjY3NywxLjkxOSAxNDkuODIxLDIuMDAyIEwxNTYuNTUsNS44ODcgQzE1Ni43NzQsNi4wMTcgMTU2Ljg1LDYuMzAyIDE1Ni43MjIsNi41MjYgQzE1Ni41OTIsNi43NDkgMTU2LjMwNyw2LjgyNiAxNTYuMDgzLDYuNjk2IEwxNDkuNTg3LDIuOTQ2IEw2OC42ODcsNDkuNDc5IEwxMTMuNjc1LDc1LjQ1MiBMMTE2LjUyMyw3My44MDggQzExNi43MTUsNzMuNjk3IDExNy4xNDMsNzMuMzk5IDExNi45NTgsNzMuMDM1IEMxMTQuNTQyLDY4LjI4NyAxMTQuMyw2My4yMjEgMTE2LjI1OCw1OC4zODUgQzExOS4wNjQsNTEuNDU4IDEyNS4xNDMsNDUuMTQzIDEzMy44NCw0MC4xMjIgQzE0Mi40OTcsMzUuMTI0IDE1My4zNTgsMzEuNjMzIDE2NS4yNDcsMzAuMDI4IEMxNzMuNDQ1LDI4LjkyMSAxODIuMDM3LDI5LjA1OCAxOTAuMDkxLDMwLjQyNSBDMTkwLjgzLDMwLjU1IDE5MS42NTIsMzAuNDMyIDE5Mi4xODYsMzAuMTI0IEwxOTQuNTY3LDI4Ljc1IEwxNjkuNDQyLDE0LjI0NCBDMTY5LjIxOSwxNC4xMTUgMTY5LjE0MiwxMy44MjkgMTY5LjI3MSwxMy42MDYgQzE2OS40LDEzLjM4MiAxNjkuNjg1LDEzLjMwNiAxNjkuOTA5LDEzLjQzNSBMMTk1LjczNCwyOC4zNDUgQzE5NS44NzksMjguNDI4IDE5NS45NjgsMjguNTgzIDE5NS45NjgsMjguNzUgQzE5NS45NjgsMjguOTE2IDE5NS44NzksMjkuMDcxIDE5NS43MzQsMjkuMTU0IEwxOTIuNjUzLDMwLjkzMyBDMTkxLjkzMiwzMS4zNSAxOTAuODksMzEuNTA4IDE4OS45MzUsMzEuMzQ2IEMxODEuOTcyLDI5Ljk5NSAxNzMuNDc4LDI5Ljg2IDE2NS4zNzIsMzAuOTU0IEMxNTMuNjAyLDMyLjU0MyAxNDIuODYsMzUuOTkzIDEzNC4zMDcsNDAuOTMxIEMxMjUuNzkzLDQ1Ljg0NyAxMTkuODUxLDUyLjAwNCAxMTcuMTI0LDU4LjczNiBDMTE1LjI3LDYzLjMxNCAxMTUuNTAxLDY4LjExMiAxMTcuNzksNzIuNjExIEMxMTguMTYsNzMuMzM2IDExNy44NDUsNzQuMTI0IDExNi45OSw3NC42MTcgTDExMy45MDksNzYuMzk3IEMxMTMuODM2LDc2LjQzOCAxMTMuNzU2LDc2LjQ1OSAxMTMuNjc1LDc2LjQ1OSIgaWQ9IkZpbGwtMjQiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTUzLjMxNiwyMS4yNzkgQzE1MC45MDMsMjEuMjc5IDE0OC40OTUsMjAuNzUxIDE0Ni42NjQsMTkuNjkzIEMxNDQuODQ2LDE4LjY0NCAxNDMuODQ0LDE3LjIzMiAxNDMuODQ0LDE1LjcxOCBDMTQzLjg0NCwxNC4xOTEgMTQ0Ljg2LDEyLjc2MyAxNDYuNzA1LDExLjY5OCBMMTU2LjE5OCw2LjA5MSBDMTU2LjMwOSw2LjAyNSAxNTYuNDUyLDYuMDYyIDE1Ni41MTgsNi4xNzMgQzE1Ni41ODMsNi4yODQgMTU2LjU0Nyw2LjQyNyAxNTYuNDM2LDYuNDkzIEwxNDYuOTQsMTIuMTAyIEMxNDUuMjQ0LDEzLjA4MSAxNDQuMzEyLDE0LjM2NSAxNDQuMzEyLDE1LjcxOCBDMTQ0LjMxMiwxNy4wNTggMTQ1LjIzLDE4LjMyNiAxNDYuODk3LDE5LjI4OSBDMTUwLjQ0NiwyMS4zMzggMTU2LjI0LDIxLjMyNyAxNTkuODExLDE5LjI2NSBMMTY5LjU1OSwxMy42MzcgQzE2OS42NywxMy41NzMgMTY5LjgxMywxMy42MTEgMTY5Ljg3OCwxMy43MjMgQzE2OS45NDMsMTMuODM0IDE2OS45MDQsMTMuOTc3IDE2OS43OTMsMTQuMDQyIEwxNjAuMDQ1LDE5LjY3IEMxNTguMTg3LDIwLjc0MiAxNTUuNzQ5LDIxLjI3OSAxNTMuMzE2LDIxLjI3OSIgaWQ9IkZpbGwtMjUiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEzLjY3NSw3NS45OTIgTDY3Ljc2Miw0OS40ODQiIGlkPSJGaWxsLTI2IiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTExMy42NzUsNzYuMzQyIEMxMTMuNjE1LDc2LjM0MiAxMTMuNTU1LDc2LjMyNyAxMTMuNSw3Ni4yOTUgTDY3LjU4Nyw0OS43ODcgQzY3LjQxOSw0OS42OSA2Ny4zNjIsNDkuNDc2IDY3LjQ1OSw0OS4zMDkgQzY3LjU1Niw0OS4xNDEgNjcuNzcsNDkuMDgzIDY3LjkzNyw0OS4xOCBMMTEzLjg1LDc1LjY4OCBDMTE0LjAxOCw3NS43ODUgMTE0LjA3NSw3NiAxMTMuOTc4LDc2LjE2NyBDMTEzLjkxNCw3Ni4yNzkgMTEzLjc5Niw3Ni4zNDIgMTEzLjY3NSw3Ni4zNDIiIGlkPSJGaWxsLTI3IiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTY3Ljc2Miw0OS40ODQgTDY3Ljc2MiwxMDMuNDg1IEM2Ny43NjIsMTA0LjU3NSA2OC41MzIsMTA1LjkwMyA2OS40ODIsMTA2LjQ1MiBMMTExLjk1NSwxMzAuOTczIEMxMTIuOTA1LDEzMS41MjIgMTEzLjY3NSwxMzEuMDgzIDExMy42NzUsMTI5Ljk5MyBMMTEzLjY3NSw3NS45OTIiIGlkPSJGaWxsLTI4IiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTExMi43MjcsMTMxLjU2MSBDMTEyLjQzLDEzMS41NjEgMTEyLjEwNywxMzEuNDY2IDExMS43OCwxMzEuMjc2IEw2OS4zMDcsMTA2Ljc1NSBDNjguMjQ0LDEwNi4xNDIgNjcuNDEyLDEwNC43MDUgNjcuNDEyLDEwMy40ODUgTDY3LjQxMiw0OS40ODQgQzY3LjQxMiw0OS4yOSA2Ny41NjksNDkuMTM0IDY3Ljc2Miw0OS4xMzQgQzY3Ljk1Niw0OS4xMzQgNjguMTEzLDQ5LjI5IDY4LjExMyw0OS40ODQgTDY4LjExMywxMDMuNDg1IEM2OC4xMTMsMTA0LjQ0NSA2OC44MiwxMDUuNjY1IDY5LjY1NywxMDYuMTQ4IEwxMTIuMTMsMTMwLjY3IEMxMTIuNDc0LDEzMC44NjggMTEyLjc5MSwxMzAuOTEzIDExMywxMzAuNzkyIEMxMTMuMjA2LDEzMC42NzMgMTEzLjMyNSwxMzAuMzgxIDExMy4zMjUsMTI5Ljk5MyBMMTEzLjMyNSw3NS45OTIgQzExMy4zMjUsNzUuNzk4IDExMy40ODIsNzUuNjQxIDExMy42NzUsNzUuNjQxIEMxMTMuODY5LDc1LjY0MSAxMTQuMDI1LDc1Ljc5OCAxMTQuMDI1LDc1Ljk5MiBMMTE0LjAyNSwxMjkuOTkzIEMxMTQuMDI1LDEzMC42NDggMTEzLjc4NiwxMzEuMTQ3IDExMy4zNSwxMzEuMzk5IEMxMTMuMTYyLDEzMS41MDcgMTEyLjk1MiwxMzEuNTYxIDExMi43MjcsMTMxLjU2MSIgaWQ9IkZpbGwtMjkiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTEyLjg2LDQwLjUxMiBDMTEyLjg2LDQwLjUxMiAxMTIuODYsNDAuNTEyIDExMi44NTksNDAuNTEyIEMxMTAuNTQxLDQwLjUxMiAxMDguMzYsMzkuOTkgMTA2LjcxNywzOS4wNDEgQzEwNS4wMTIsMzguMDU3IDEwNC4wNzQsMzYuNzI2IDEwNC4wNzQsMzUuMjkyIEMxMDQuMDc0LDMzLjg0NyAxMDUuMDI2LDMyLjUwMSAxMDYuNzU0LDMxLjUwNCBMMTE4Ljc5NSwyNC41NTEgQzEyMC40NjMsMjMuNTg5IDEyMi42NjksMjMuMDU4IDEyNS4wMDcsMjMuMDU4IEMxMjcuMzI1LDIzLjA1OCAxMjkuNTA2LDIzLjU4MSAxMzEuMTUsMjQuNTMgQzEzMi44NTQsMjUuNTE0IDEzMy43OTMsMjYuODQ1IDEzMy43OTMsMjguMjc4IEMxMzMuNzkzLDI5LjcyNCAxMzIuODQxLDMxLjA2OSAxMzEuMTEzLDMyLjA2NyBMMTE5LjA3MSwzOS4wMTkgQzExNy40MDMsMzkuOTgyIDExNS4xOTcsNDAuNTEyIDExMi44Niw0MC41MTIgTDExMi44Niw0MC41MTIgWiBNMTI1LjAwNywyMy43NTkgQzEyMi43OSwyMy43NTkgMTIwLjcwOSwyNC4yNTYgMTE5LjE0NiwyNS4xNTggTDEwNy4xMDQsMzIuMTEgQzEwNS42MDIsMzIuOTc4IDEwNC43NzQsMzQuMTA4IDEwNC43NzQsMzUuMjkyIEMxMDQuNzc0LDM2LjQ2NSAxMDUuNTg5LDM3LjU4MSAxMDcuMDY3LDM4LjQzNCBDMTA4LjYwNSwzOS4zMjMgMTEwLjY2MywzOS44MTIgMTEyLjg1OSwzOS44MTIgTDExMi44NiwzOS44MTIgQzExNS4wNzYsMzkuODEyIDExNy4xNTgsMzkuMzE1IDExOC43MjEsMzguNDEzIEwxMzAuNzYyLDMxLjQ2IEMxMzIuMjY0LDMwLjU5MyAxMzMuMDkyLDI5LjQ2MyAxMzMuMDkyLDI4LjI3OCBDMTMzLjA5MiwyNy4xMDYgMTMyLjI3OCwyNS45OSAxMzAuOCwyNS4xMzYgQzEyOS4yNjEsMjQuMjQ4IDEyNy4yMDQsMjMuNzU5IDEyNS4wMDcsMjMuNzU5IEwxMjUuMDA3LDIzLjc1OSBaIiBpZD0iRmlsbC0zMCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNjUuNjMsMTYuMjE5IEwxNTkuODk2LDE5LjUzIEMxNTYuNzI5LDIxLjM1OCAxNTEuNjEsMjEuMzY3IDE0OC40NjMsMTkuNTUgQzE0NS4zMTYsMTcuNzMzIDE0NS4zMzIsMTQuNzc4IDE0OC40OTksMTIuOTQ5IEwxNTQuMjMzLDkuNjM5IEwxNjUuNjMsMTYuMjE5IiBpZD0iRmlsbC0zMSIgZmlsbD0iI0ZBRkFGQSI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xNTQuMjMzLDEwLjQ0OCBMMTY0LjIyOCwxNi4yMTkgTDE1OS41NDYsMTguOTIzIEMxNTguMTEyLDE5Ljc1IDE1Ni4xOTQsMjAuMjA2IDE1NC4xNDcsMjAuMjA2IEMxNTIuMTE4LDIwLjIwNiAxNTAuMjI0LDE5Ljc1NyAxNDguODE0LDE4Ljk0MyBDMTQ3LjUyNCwxOC4xOTkgMTQ2LjgxNCwxNy4yNDkgMTQ2LjgxNCwxNi4yNjkgQzE0Ni44MTQsMTUuMjc4IDE0Ny41MzcsMTQuMzE0IDE0OC44NSwxMy41NTYgTDE1NC4yMzMsMTAuNDQ4IE0xNTQuMjMzLDkuNjM5IEwxNDguNDk5LDEyLjk0OSBDMTQ1LjMzMiwxNC43NzggMTQ1LjMxNiwxNy43MzMgMTQ4LjQ2MywxOS41NSBDMTUwLjAzMSwyMC40NTUgMTUyLjA4NiwyMC45MDcgMTU0LjE0NywyMC45MDcgQzE1Ni4yMjQsMjAuOTA3IDE1OC4zMDYsMjAuNDQ3IDE1OS44OTYsMTkuNTMgTDE2NS42MywxNi4yMTkgTDE1NC4yMzMsOS42MzkiIGlkPSJGaWxsLTMyIiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE0NS40NDUsNzIuNjY3IEwxNDUuNDQ1LDcyLjY2NyBDMTQzLjY3Miw3Mi42NjcgMTQyLjIwNCw3MS44MTcgMTQxLjIwMiw3MC40MjIgQzE0MS4xMzUsNzAuMzMgMTQxLjE0NSw3MC4xNDcgMTQxLjIyNSw3MC4wNjYgQzE0MS4zMDUsNjkuOTg1IDE0MS40MzIsNjkuOTQ2IDE0MS41MjUsNzAuMDExIEMxNDIuMzA2LDcwLjU1OSAxNDMuMjMxLDcwLjgyMyAxNDQuMjc2LDcwLjgyMiBDMTQ1LjU5OCw3MC44MjIgMTQ3LjAzLDcwLjM3NiAxNDguNTMyLDY5LjUwOSBDMTUzLjg0Miw2Ni40NDMgMTU4LjE2Myw1OC45ODcgMTU4LjE2Myw1Mi44OTQgQzE1OC4xNjMsNTAuOTY3IDE1Ny43MjEsNDkuMzMyIDE1Ni44ODQsNDguMTY4IEMxNTYuODE4LDQ4LjA3NiAxNTYuODI4LDQ3Ljk0OCAxNTYuOTA4LDQ3Ljg2NyBDMTU2Ljk4OCw0Ny43ODYgMTU3LjExNCw0Ny43NzQgMTU3LjIwOCw0Ny44NCBDMTU4Ljg3OCw0OS4wMTIgMTU5Ljc5OCw1MS4yMiAxNTkuNzk4LDU0LjA1OSBDMTU5Ljc5OCw2MC4zMDEgMTU1LjM3Myw2OC4wNDYgMTQ5LjkzMyw3MS4xODYgQzE0OC4zNiw3Mi4wOTQgMTQ2Ljg1LDcyLjY2NyAxNDUuNDQ1LDcyLjY2NyBMMTQ1LjQ0NSw3Mi42NjcgWiBNMTQyLjQ3Niw3MSBDMTQzLjI5LDcxLjY1MSAxNDQuMjk2LDcyLjAwMiAxNDUuNDQ1LDcyLjAwMiBDMTQ2Ljc2Nyw3Mi4wMDIgMTQ4LjE5OCw3MS41NSAxNDkuNyw3MC42ODIgQzE1NS4wMSw2Ny42MTcgMTU5LjMzMSw2MC4xNTkgMTU5LjMzMSw1NC4wNjUgQzE1OS4zMzEsNTIuMDg1IDE1OC44NjgsNTAuNDM1IDE1OC4wMDYsNDkuMjcyIEMxNTguNDE3LDUwLjMwNyAxNTguNjMsNTEuNTMyIDE1OC42Myw1Mi44OTIgQzE1OC42Myw1OS4xMzQgMTU0LjIwNSw2Ni43NjcgMTQ4Ljc2NSw2OS45MDcgQzE0Ny4xOTIsNzAuODE2IDE0NS42ODEsNzEuMjgzIDE0NC4yNzYsNzEuMjgzIEMxNDMuNjM0LDcxLjI4MyAxNDMuMDMzLDcxLjE5MiAxNDIuNDc2LDcxIEwxNDIuNDc2LDcxIFoiIGlkPSJGaWxsLTMzIiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE0OC42NDgsNjkuNzA0IEMxNTQuMDMyLDY2LjU5NiAxNTguMzk2LDU5LjA2OCAxNTguMzk2LDUyLjg5MSBDMTU4LjM5Niw1MC44MzkgMTU3LjkxMyw0OS4xOTggMTU3LjA3NCw0OC4wMyBDMTU1LjI4OSw0Ni43NzggMTUyLjY5OSw0Ni44MzYgMTQ5LjgxNiw0OC41MDEgQzE0NC40MzMsNTEuNjA5IDE0MC4wNjgsNTkuMTM3IDE0MC4wNjgsNjUuMzE0IEMxNDAuMDY4LDY3LjM2NSAxNDAuNTUyLDY5LjAwNiAxNDEuMzkxLDcwLjE3NCBDMTQzLjE3Niw3MS40MjcgMTQ1Ljc2NSw3MS4zNjkgMTQ4LjY0OCw2OS43MDQiIGlkPSJGaWxsLTM0IiBmaWxsPSIjRkFGQUZBIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTE0NC4yNzYsNzEuMjc2IEwxNDQuMjc2LDcxLjI3NiBDMTQzLjEzMyw3MS4yNzYgMTQyLjExOCw3MC45NjkgMTQxLjI1Nyw3MC4zNjUgQzE0MS4yMzYsNzAuMzUxIDE0MS4yMTcsNzAuMzMyIDE0MS4yMDIsNzAuMzExIEMxNDAuMzA3LDY5LjA2NyAxMzkuODM1LDY3LjMzOSAxMzkuODM1LDY1LjMxNCBDMTM5LjgzNSw1OS4wNzMgMTQ0LjI2LDUxLjQzOSAxNDkuNyw0OC4yOTggQzE1MS4yNzMsNDcuMzkgMTUyLjc4NCw0Ni45MjkgMTU0LjE4OSw0Ni45MjkgQzE1NS4zMzIsNDYuOTI5IDE1Ni4zNDcsNDcuMjM2IDE1Ny4yMDgsNDcuODM5IEMxNTcuMjI5LDQ3Ljg1NCAxNTcuMjQ4LDQ3Ljg3MyAxNTcuMjYzLDQ3Ljg5NCBDMTU4LjE1Nyw0OS4xMzggMTU4LjYzLDUwLjg2NSAxNTguNjMsNTIuODkxIEMxNTguNjMsNTkuMTMyIDE1NC4yMDUsNjYuNzY2IDE0OC43NjUsNjkuOTA3IEMxNDcuMTkyLDcwLjgxNSAxNDUuNjgxLDcxLjI3NiAxNDQuMjc2LDcxLjI3NiBMMTQ0LjI3Niw3MS4yNzYgWiBNMTQxLjU1OCw3MC4xMDQgQzE0Mi4zMzEsNzAuNjM3IDE0My4yNDUsNzEuMDA1IDE0NC4yNzYsNzEuMDA1IEMxNDUuNTk4LDcxLjAwNSAxNDcuMDMsNzAuNDY3IDE0OC41MzIsNjkuNiBDMTUzLjg0Miw2Ni41MzQgMTU4LjE2Myw1OS4wMzMgMTU4LjE2Myw1Mi45MzkgQzE1OC4xNjMsNTEuMDMxIDE1Ny43MjksNDkuMzg1IDE1Ni45MDcsNDguMjIzIEMxNTYuMTMzLDQ3LjY5MSAxNTUuMjE5LDQ3LjQwOSAxNTQuMTg5LDQ3LjQwOSBDMTUyLjg2Nyw0Ny40MDkgMTUxLjQzNSw0Ny44NDIgMTQ5LjkzMyw0OC43MDkgQzE0NC42MjMsNTEuNzc1IDE0MC4zMDIsNTkuMjczIDE0MC4zMDIsNjUuMzY2IEMxNDAuMzAyLDY3LjI3NiAxNDAuNzM2LDY4Ljk0MiAxNDEuNTU4LDcwLjEwNCBMMTQxLjU1OCw3MC4xMDQgWiIgaWQ9IkZpbGwtMzUiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTUwLjcyLDY1LjM2MSBMMTUwLjM1Nyw2NS4wNjYgQzE1MS4xNDcsNjQuMDkyIDE1MS44NjksNjMuMDQgMTUyLjUwNSw2MS45MzggQzE1My4zMTMsNjAuNTM5IDE1My45NzgsNTkuMDY3IDE1NC40ODIsNTcuNTYzIEwxNTQuOTI1LDU3LjcxMiBDMTU0LjQxMiw1OS4yNDUgMTUzLjczMyw2MC43NDUgMTUyLjkxLDYyLjE3MiBDMTUyLjI2Miw2My4yOTUgMTUxLjUyNSw2NC4zNjggMTUwLjcyLDY1LjM2MSIgaWQ9IkZpbGwtMzYiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTE1LjkxNyw4NC41MTQgTDExNS41NTQsODQuMjIgQzExNi4zNDQsODMuMjQ1IDExNy4wNjYsODIuMTk0IDExNy43MDIsODEuMDkyIEMxMTguNTEsNzkuNjkyIDExOS4xNzUsNzguMjIgMTE5LjY3OCw3Ni43MTcgTDEyMC4xMjEsNzYuODY1IEMxMTkuNjA4LDc4LjM5OCAxMTguOTMsNzkuODk5IDExOC4xMDYsODEuMzI2IEMxMTcuNDU4LDgyLjQ0OCAxMTYuNzIyLDgzLjUyMSAxMTUuOTE3LDg0LjUxNCIgaWQ9IkZpbGwtMzciIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTE0LDEzMC40NzYgTDExNCwxMzAuMDA4IEwxMTQsNzYuMDUyIEwxMTQsNzUuNTg0IEwxMTQsNzYuMDUyIEwxMTQsMTMwLjAwOCBMMTE0LDEzMC40NzYiIGlkPSJGaWxsLTM4IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICA8L2c+CiAgICAgICAgICAgICAgICA8ZyBpZD0iSW1wb3J0ZWQtTGF5ZXJzLUNvcHkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDYyLjAwMDAwMCwgMC4wMDAwMDApIiBza2V0Y2g6dHlwZT0iTVNTaGFwZUdyb3VwIj4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTkuODIyLDM3LjQ3NCBDMTkuODM5LDM3LjMzOSAxOS43NDcsMzcuMTk0IDE5LjU1NSwzNy4wODIgQzE5LjIyOCwzNi44OTQgMTguNzI5LDM2Ljg3MiAxOC40NDYsMzcuMDM3IEwxMi40MzQsNDAuNTA4IEMxMi4zMDMsNDAuNTg0IDEyLjI0LDQwLjY4NiAxMi4yNDMsNDAuNzkzIEMxMi4yNDUsNDAuOTI1IDEyLjI0NSw0MS4yNTQgMTIuMjQ1LDQxLjM3MSBMMTIuMjQ1LDQxLjQxNCBMMTIuMjM4LDQxLjU0MiBDOC4xNDgsNDMuODg3IDUuNjQ3LDQ1LjMyMSA1LjY0Nyw0NS4zMjEgQzUuNjQ2LDQ1LjMyMSAzLjU3LDQ2LjM2NyAyLjg2LDUwLjUxMyBDMi44Niw1MC41MTMgMS45NDgsNTcuNDc0IDEuOTYyLDcwLjI1OCBDMS45NzcsODIuODI4IDIuNTY4LDg3LjMyOCAzLjEyOSw5MS42MDkgQzMuMzQ5LDkzLjI5MyA2LjEzLDkzLjczNCA2LjEzLDkzLjczNCBDNi40NjEsOTMuNzc0IDYuODI4LDkzLjcwNyA3LjIxLDkzLjQ4NiBMODIuNDgzLDQ5LjkzNSBDODQuMjkxLDQ4Ljg2NiA4NS4xNSw0Ni4yMTYgODUuNTM5LDQzLjY1MSBDODYuNzUyLDM1LjY2MSA4Ny4yMTQsMTAuNjczIDg1LjI2NCwzLjc3MyBDODUuMDY4LDMuMDggODQuNzU0LDIuNjkgODQuMzk2LDIuNDkxIEw4Mi4zMSwxLjcwMSBDODEuNTgzLDEuNzI5IDgwLjg5NCwyLjE2OCA4MC43NzYsMi4yMzYgQzgwLjYzNiwyLjMxNyA0MS44MDcsMjQuNTg1IDIwLjAzMiwzNy4wNzIgTDE5LjgyMiwzNy40NzQiIGlkPSJGaWxsLTEiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNODIuMzExLDEuNzAxIEw4NC4zOTYsMi40OTEgQzg0Ljc1NCwyLjY5IDg1LjA2OCwzLjA4IDg1LjI2NCwzLjc3MyBDODcuMjEzLDEwLjY3MyA4Ni43NTEsMzUuNjYgODUuNTM5LDQzLjY1MSBDODUuMTQ5LDQ2LjIxNiA4NC4yOSw0OC44NjYgODIuNDgzLDQ5LjkzNSBMNy4yMSw5My40ODYgQzYuODk3LDkzLjY2NyA2LjU5NSw5My43NDQgNi4zMTQsOTMuNzQ0IEw2LjEzMSw5My43MzMgQzYuMTMxLDkzLjczNCAzLjM0OSw5My4yOTMgMy4xMjgsOTEuNjA5IEMyLjU2OCw4Ny4zMjcgMS45NzcsODIuODI4IDEuOTYzLDcwLjI1OCBDMS45NDgsNTcuNDc0IDIuODYsNTAuNTEzIDIuODYsNTAuNTEzIEMzLjU3LDQ2LjM2NyA1LjY0Nyw0NS4zMjEgNS42NDcsNDUuMzIxIEM1LjY0Nyw0NS4zMjEgOC4xNDgsNDMuODg3IDEyLjIzOCw0MS41NDIgTDEyLjI0NSw0MS40MTQgTDEyLjI0NSw0MS4zNzEgQzEyLjI0NSw0MS4yNTQgMTIuMjQ1LDQwLjkyNSAxMi4yNDMsNDAuNzkzIEMxMi4yNCw0MC42ODYgMTIuMzAyLDQwLjU4MyAxMi40MzQsNDAuNTA4IEwxOC40NDYsMzcuMDM2IEMxOC41NzQsMzYuOTYyIDE4Ljc0NiwzNi45MjYgMTguOTI3LDM2LjkyNiBDMTkuMTQ1LDM2LjkyNiAxOS4zNzYsMzYuOTc5IDE5LjU1NCwzNy4wODIgQzE5Ljc0NywzNy4xOTQgMTkuODM5LDM3LjM0IDE5LjgyMiwzNy40NzQgTDIwLjAzMywzNy4wNzIgQzQxLjgwNiwyNC41ODUgODAuNjM2LDIuMzE4IDgwLjc3NywyLjIzNiBDODAuODk0LDIuMTY4IDgxLjU4MywxLjcyOSA4Mi4zMTEsMS43MDEgTTgyLjMxMSwwLjcwNCBMODIuMjcyLDAuNzA1IEM4MS42NTQsMC43MjggODAuOTg5LDAuOTQ5IDgwLjI5OCwxLjM2MSBMODAuMjc3LDEuMzczIEM4MC4xMjksMS40NTggNTkuNzY4LDEzLjEzNSAxOS43NTgsMzYuMDc5IEMxOS41LDM1Ljk4MSAxOS4yMTQsMzUuOTI5IDE4LjkyNywzNS45MjkgQzE4LjU2MiwzNS45MjkgMTguMjIzLDM2LjAxMyAxNy45NDcsMzYuMTczIEwxMS45MzUsMzkuNjQ0IEMxMS40OTMsMzkuODk5IDExLjIzNiw0MC4zMzQgMTEuMjQ2LDQwLjgxIEwxMS4yNDcsNDAuOTYgTDUuMTY3LDQ0LjQ0NyBDNC43OTQsNDQuNjQ2IDIuNjI1LDQ1Ljk3OCAxLjg3Nyw1MC4zNDUgTDEuODcxLDUwLjM4NCBDMS44NjIsNTAuNDU0IDAuOTUxLDU3LjU1NyAwLjk2NSw3MC4yNTkgQzAuOTc5LDgyLjg3OSAxLjU2OCw4Ny4zNzUgMi4xMzcsOTEuNzI0IEwyLjEzOSw5MS43MzkgQzIuNDQ3LDk0LjA5NCA1LjYxNCw5NC42NjIgNS45NzUsOTQuNzE5IEw2LjAwOSw5NC43MjMgQzYuMTEsOTQuNzM2IDYuMjEzLDk0Ljc0MiA2LjMxNCw5NC43NDIgQzYuNzksOTQuNzQyIDcuMjYsOTQuNjEgNy43MSw5NC4zNSBMODIuOTgzLDUwLjc5OCBDODQuNzk0LDQ5LjcyNyA4NS45ODIsNDcuMzc1IDg2LjUyNSw0My44MDEgQzg3LjcxMSwzNS45ODcgODguMjU5LDEwLjcwNSA4Ni4yMjQsMy41MDIgQzg1Ljk3MSwyLjYwOSA4NS41MiwxLjk3NSA4NC44ODEsMS42MiBMODQuNzQ5LDEuNTU4IEw4Mi42NjQsMC43NjkgQzgyLjU1MSwwLjcyNSA4Mi40MzEsMC43MDQgODIuMzExLDAuNzA0IiBpZD0iRmlsbC0yIiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTY2LjI2NywxMS41NjUgTDY3Ljc2MiwxMS45OTkgTDExLjQyMyw0NC4zMjUiIGlkPSJGaWxsLTMiIGZpbGw9IiNGRkZGRkYiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTIuMjAyLDkwLjU0NSBDMTIuMDI5LDkwLjU0NSAxMS44NjIsOTAuNDU1IDExLjc2OSw5MC4yOTUgQzExLjYzMiw5MC4wNTcgMTEuNzEzLDg5Ljc1MiAxMS45NTIsODkuNjE0IEwzMC4zODksNzguOTY5IEMzMC42MjgsNzguODMxIDMwLjkzMyw3OC45MTMgMzEuMDcxLDc5LjE1MiBDMzEuMjA4LDc5LjM5IDMxLjEyNyw3OS42OTYgMzAuODg4LDc5LjgzMyBMMTIuNDUxLDkwLjQ3OCBMMTIuMjAyLDkwLjU0NSIgaWQ9IkZpbGwtNCIgZmlsbD0iIzYwN0Q4QiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMy43NjQsNDIuNjU0IEwxMy42NTYsNDIuNTkyIEwxMy43MDIsNDIuNDIxIEwxOC44MzcsMzkuNDU3IEwxOS4wMDcsMzkuNTAyIEwxOC45NjIsMzkuNjczIEwxMy44MjcsNDIuNjM3IEwxMy43NjQsNDIuNjU0IiBpZD0iRmlsbC01IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTguNTIsOTAuMzc1IEw4LjUyLDQ2LjQyMSBMOC41ODMsNDYuMzg1IEw3NS44NCw3LjU1NCBMNzUuODQsNTEuNTA4IEw3NS43NzgsNTEuNTQ0IEw4LjUyLDkwLjM3NSBMOC41Miw5MC4zNzUgWiBNOC43Nyw0Ni41NjQgTDguNzcsODkuOTQ0IEw3NS41OTEsNTEuMzY1IEw3NS41OTEsNy45ODUgTDguNzcsNDYuNTY0IEw4Ljc3LDQ2LjU2NCBaIiBpZD0iRmlsbC02IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTI0Ljk4Niw4My4xODIgQzI0Ljc1Niw4My4zMzEgMjQuMzc0LDgzLjU2NiAyNC4xMzcsODMuNzA1IEwxMi42MzIsOTAuNDA2IEMxMi4zOTUsOTAuNTQ1IDEyLjQyNiw5MC42NTggMTIuNyw5MC42NTggTDEzLjI2NSw5MC42NTggQzEzLjU0LDkwLjY1OCAxMy45NTgsOTAuNTQ1IDE0LjE5NSw5MC40MDYgTDI1LjcsODMuNzA1IEMyNS45MzcsODMuNTY2IDI2LjEyOCw4My40NTIgMjYuMTI1LDgzLjQ0OSBDMjYuMTIyLDgzLjQ0NyAyNi4xMTksODMuMjIgMjYuMTE5LDgyLjk0NiBDMjYuMTE5LDgyLjY3MiAyNS45MzEsODIuNTY5IDI1LjcwMSw4Mi43MTkgTDI0Ljk4Niw4My4xODIiIGlkPSJGaWxsLTciIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTMuMjY2LDkwLjc4MiBMMTIuNyw5MC43ODIgQzEyLjUsOTAuNzgyIDEyLjM4NCw5MC43MjYgMTIuMzU0LDkwLjYxNiBDMTIuMzI0LDkwLjUwNiAxMi4zOTcsOTAuMzk5IDEyLjU2OSw5MC4yOTkgTDI0LjA3NCw4My41OTcgQzI0LjMxLDgzLjQ1OSAyNC42ODksODMuMjI2IDI0LjkxOCw4My4wNzggTDI1LjYzMyw4Mi42MTQgQzI1LjcyMyw4Mi41NTUgMjUuODEzLDgyLjUyNSAyNS44OTksODIuNTI1IEMyNi4wNzEsODIuNTI1IDI2LjI0NCw4Mi42NTUgMjYuMjQ0LDgyLjk0NiBDMjYuMjQ0LDgzLjE2IDI2LjI0NSw4My4zMDkgMjYuMjQ3LDgzLjM4MyBMMjYuMjUzLDgzLjM4NyBMMjYuMjQ5LDgzLjQ1NiBDMjYuMjQ2LDgzLjUzMSAyNi4yNDYsODMuNTMxIDI1Ljc2Myw4My44MTIgTDE0LjI1OCw5MC41MTQgQzE0LDkwLjY2NSAxMy41NjQsOTAuNzgyIDEzLjI2Niw5MC43ODIgTDEzLjI2Niw5MC43ODIgWiBNMTIuNjY2LDkwLjUzMiBMMTIuNyw5MC41MzMgTDEzLjI2Niw5MC41MzMgQzEzLjUxOCw5MC41MzMgMTMuOTE1LDkwLjQyNSAxNC4xMzIsOTAuMjk5IEwyNS42MzcsODMuNTk3IEMyNS44MDUsODMuNDk5IDI1LjkzMSw4My40MjQgMjUuOTk4LDgzLjM4MyBDMjUuOTk0LDgzLjI5OSAyNS45OTQsODMuMTY1IDI1Ljk5NCw4Mi45NDYgTDI1Ljg5OSw4Mi43NzUgTDI1Ljc2OCw4Mi44MjQgTDI1LjA1NCw4My4yODcgQzI0LjgyMiw4My40MzcgMjQuNDM4LDgzLjY3MyAyNC4yLDgzLjgxMiBMMTIuNjk1LDkwLjUxNCBMMTIuNjY2LDkwLjUzMiBMMTIuNjY2LDkwLjUzMiBaIiBpZD0iRmlsbC04IiBmaWxsPSIjNjA3RDhCIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTEzLjI2Niw4OS44NzEgTDEyLjcsODkuODcxIEMxMi41LDg5Ljg3MSAxMi4zODQsODkuODE1IDEyLjM1NCw4OS43MDUgQzEyLjMyNCw4OS41OTUgMTIuMzk3LDg5LjQ4OCAxMi41NjksODkuMzg4IEwyNC4wNzQsODIuNjg2IEMyNC4zMzIsODIuNTM1IDI0Ljc2OCw4Mi40MTggMjUuMDY3LDgyLjQxOCBMMjUuNjMyLDgyLjQxOCBDMjUuODMyLDgyLjQxOCAyNS45NDgsODIuNDc0IDI1Ljk3OCw4Mi41ODQgQzI2LjAwOCw4Mi42OTQgMjUuOTM1LDgyLjgwMSAyNS43NjMsODIuOTAxIEwxNC4yNTgsODkuNjAzIEMxNCw4OS43NTQgMTMuNTY0LDg5Ljg3MSAxMy4yNjYsODkuODcxIEwxMy4yNjYsODkuODcxIFogTTEyLjY2Niw4OS42MjEgTDEyLjcsODkuNjIyIEwxMy4yNjYsODkuNjIyIEMxMy41MTgsODkuNjIyIDEzLjkxNSw4OS41MTUgMTQuMTMyLDg5LjM4OCBMMjUuNjM3LDgyLjY4NiBMMjUuNjY3LDgyLjY2OCBMMjUuNjMyLDgyLjY2NyBMMjUuMDY3LDgyLjY2NyBDMjQuODE1LDgyLjY2NyAyNC40MTgsODIuNzc1IDI0LjIsODIuOTAxIEwxMi42OTUsODkuNjAzIEwxMi42NjYsODkuNjIxIEwxMi42NjYsODkuNjIxIFoiIGlkPSJGaWxsLTkiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNMTIuMzcsOTAuODAxIEwxMi4zNyw4OS41NTQgTDEyLjM3LDkwLjgwMSIgaWQ9IkZpbGwtMTAiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNi4xMyw5My45MDEgQzUuMzc5LDkzLjgwOCA0LjgxNiw5My4xNjQgNC42OTEsOTIuNTI1IEMzLjg2LDg4LjI4NyAzLjU0LDgzLjc0MyAzLjUyNiw3MS4xNzMgQzMuNTExLDU4LjM4OSA0LjQyMyw1MS40MjggNC40MjMsNTEuNDI4IEM1LjEzNCw0Ny4yODIgNy4yMSw0Ni4yMzYgNy4yMSw0Ni4yMzYgQzcuMjEsNDYuMjM2IDgxLjY2NywzLjI1IDgyLjA2OSwzLjAxNyBDODIuMjkyLDIuODg4IDg0LjU1NiwxLjQzMyA4NS4yNjQsMy45NCBDODcuMjE0LDEwLjg0IDg2Ljc1MiwzNS44MjcgODUuNTM5LDQzLjgxOCBDODUuMTUsNDYuMzgzIDg0LjI5MSw0OS4wMzMgODIuNDgzLDUwLjEwMSBMNy4yMSw5My42NTMgQzYuODI4LDkzLjg3NCA2LjQ2MSw5My45NDEgNi4xMyw5My45MDEgQzYuMTMsOTMuOTAxIDMuMzQ5LDkzLjQ2IDMuMTI5LDkxLjc3NiBDMi41NjgsODcuNDk1IDEuOTc3LDgyLjk5NSAxLjk2Miw3MC40MjUgQzEuOTQ4LDU3LjY0MSAyLjg2LDUwLjY4IDIuODYsNTAuNjggQzMuNTcsNDYuNTM0IDUuNjQ3LDQ1LjQ4OSA1LjY0Nyw0NS40ODkgQzUuNjQ2LDQ1LjQ4OSA4LjA2NSw0NC4wOTIgMTIuMjQ1LDQxLjY3OSBMMTMuMTE2LDQxLjU2IEwxOS43MTUsMzcuNzMgTDE5Ljc2MSwzNy4yNjkgTDYuMTMsOTMuOTAxIiBpZD0iRmlsbC0xMSIgZmlsbD0iI0ZBRkFGQSI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik02LjMxNyw5NC4xNjEgTDYuMTAyLDk0LjE0OCBMNi4xMDEsOTQuMTQ4IEw1Ljg1Nyw5NC4xMDEgQzUuMTM4LDkzLjk0NSAzLjA4NSw5My4zNjUgMi44ODEsOTEuODA5IEMyLjMxMyw4Ny40NjkgMS43MjcsODIuOTk2IDEuNzEzLDcwLjQyNSBDMS42OTksNTcuNzcxIDIuNjA0LDUwLjcxOCAyLjYxMyw1MC42NDggQzMuMzM4LDQ2LjQxNyA1LjQ0NSw0NS4zMSA1LjUzNSw0NS4yNjYgTDEyLjE2Myw0MS40MzkgTDEzLjAzMyw0MS4zMiBMMTkuNDc5LDM3LjU3OCBMMTkuNTEzLDM3LjI0NCBDMTkuNTI2LDM3LjEwNyAxOS42NDcsMzcuMDA4IDE5Ljc4NiwzNy4wMjEgQzE5LjkyMiwzNy4wMzQgMjAuMDIzLDM3LjE1NiAyMC4wMDksMzcuMjkzIEwxOS45NSwzNy44ODIgTDEzLjE5OCw0MS44MDEgTDEyLjMyOCw0MS45MTkgTDUuNzcyLDQ1LjcwNCBDNS43NDEsNDUuNzIgMy43ODIsNDYuNzcyIDMuMTA2LDUwLjcyMiBDMy4wOTksNTAuNzgyIDIuMTk4LDU3LjgwOCAyLjIxMiw3MC40MjQgQzIuMjI2LDgyLjk2MyAyLjgwOSw4Ny40MiAzLjM3Myw5MS43MjkgQzMuNDY0LDkyLjQyIDQuMDYyLDkyLjg4MyA0LjY4Miw5My4xODEgQzQuNTY2LDkyLjk4NCA0LjQ4Niw5Mi43NzYgNC40NDYsOTIuNTcyIEMzLjY2NSw4OC41ODggMy4yOTEsODQuMzcgMy4yNzYsNzEuMTczIEMzLjI2Miw1OC41MiA0LjE2Nyw1MS40NjYgNC4xNzYsNTEuMzk2IEM0LjkwMSw0Ny4xNjUgNy4wMDgsNDYuMDU5IDcuMDk4LDQ2LjAxNCBDNy4wOTQsNDYuMDE1IDgxLjU0MiwzLjAzNCA4MS45NDQsMi44MDIgTDgxLjk3MiwyLjc4NSBDODIuODc2LDIuMjQ3IDgzLjY5MiwyLjA5NyA4NC4zMzIsMi4zNTIgQzg0Ljg4NywyLjU3MyA4NS4yODEsMy4wODUgODUuNTA0LDMuODcyIEM4Ny41MTgsMTEgODYuOTY0LDM2LjA5MSA4NS43ODUsNDMuODU1IEM4NS4yNzgsNDcuMTk2IDg0LjIxLDQ5LjM3IDgyLjYxLDUwLjMxNyBMNy4zMzUsOTMuODY5IEM2Ljk5OSw5NC4wNjMgNi42NTgsOTQuMTYxIDYuMzE3LDk0LjE2MSBMNi4zMTcsOTQuMTYxIFogTTYuMTcsOTMuNjU0IEM2LjQ2Myw5My42OSA2Ljc3NCw5My42MTcgNy4wODUsOTMuNDM3IEw4Mi4zNTgsNDkuODg2IEM4NC4xODEsNDguODA4IDg0Ljk2LDQ1Ljk3MSA4NS4yOTIsNDMuNzggQzg2LjQ2NiwzNi4wNDkgODcuMDIzLDExLjA4NSA4NS4wMjQsNC4wMDggQzg0Ljg0NiwzLjM3NyA4NC41NTEsMi45NzYgODQuMTQ4LDIuODE2IEM4My42NjQsMi42MjMgODIuOTgyLDIuNzY0IDgyLjIyNywzLjIxMyBMODIuMTkzLDMuMjM0IEM4MS43OTEsMy40NjYgNy4zMzUsNDYuNDUyIDcuMzM1LDQ2LjQ1MiBDNy4zMDQsNDYuNDY5IDUuMzQ2LDQ3LjUyMSA0LjY2OSw1MS40NzEgQzQuNjYyLDUxLjUzIDMuNzYxLDU4LjU1NiAzLjc3NSw3MS4xNzMgQzMuNzksODQuMzI4IDQuMTYxLDg4LjUyNCA0LjkzNiw5Mi40NzYgQzUuMDI2LDkyLjkzNyA1LjQxMiw5My40NTkgNS45NzMsOTMuNjE1IEM2LjA4Nyw5My42NCA2LjE1OCw5My42NTIgNi4xNjksOTMuNjU0IEw2LjE3LDkzLjY1NCBMNi4xNyw5My42NTQgWiIgaWQ9IkZpbGwtMTIiIGZpbGw9IiM0NTVBNjQiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNy4zMTcsNjguOTgyIEM3LjgwNiw2OC43MDEgOC4yMDIsNjguOTI2IDguMjAyLDY5LjQ4NyBDOC4yMDIsNzAuMDQ3IDcuODA2LDcwLjczIDcuMzE3LDcxLjAxMiBDNi44MjksNzEuMjk0IDYuNDMzLDcxLjA2OSA2LjQzMyw3MC41MDggQzYuNDMzLDY5Ljk0OCA2LjgyOSw2OS4yNjUgNy4zMTcsNjguOTgyIiBpZD0iRmlsbC0xMyIgZmlsbD0iI0ZGRkZGRiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik02LjkyLDcxLjEzMyBDNi42MzEsNzEuMTMzIDYuNDMzLDcwLjkwNSA2LjQzMyw3MC41MDggQzYuNDMzLDY5Ljk0OCA2LjgyOSw2OS4yNjUgNy4zMTcsNjguOTgyIEM3LjQ2LDY4LjkgNy41OTUsNjguODYxIDcuNzE0LDY4Ljg2MSBDOC4wMDMsNjguODYxIDguMjAyLDY5LjA5IDguMjAyLDY5LjQ4NyBDOC4yMDIsNzAuMDQ3IDcuODA2LDcwLjczIDcuMzE3LDcxLjAxMiBDNy4xNzQsNzEuMDk0IDcuMDM5LDcxLjEzMyA2LjkyLDcxLjEzMyBNNy43MTQsNjguNjc0IEM3LjU1Nyw2OC42NzQgNy4zOTIsNjguNzIzIDcuMjI0LDY4LjgyMSBDNi42NzYsNjkuMTM4IDYuMjQ2LDY5Ljg3OSA2LjI0Niw3MC41MDggQzYuMjQ2LDcwLjk5NCA2LjUxNyw3MS4zMiA2LjkyLDcxLjMyIEM3LjA3OCw3MS4zMiA3LjI0Myw3MS4yNzEgNy40MTEsNzEuMTc0IEM3Ljk1OSw3MC44NTcgOC4zODksNzAuMTE3IDguMzg5LDY5LjQ4NyBDOC4zODksNjkuMDAxIDguMTE3LDY4LjY3NCA3LjcxNCw2OC42NzQiIGlkPSJGaWxsLTE0IiBmaWxsPSIjODA5N0EyIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTYuOTIsNzAuOTQ3IEM2LjY0OSw3MC45NDcgNi42MjEsNzAuNjQgNi42MjEsNzAuNTA4IEM2LjYyMSw3MC4wMTcgNi45ODIsNjkuMzkyIDcuNDExLDY5LjE0NSBDNy41MjEsNjkuMDgyIDcuNjI1LDY5LjA0OSA3LjcxNCw2OS4wNDkgQzcuOTg2LDY5LjA0OSA4LjAxNSw2OS4zNTUgOC4wMTUsNjkuNDg3IEM4LjAxNSw2OS45NzggNy42NTIsNzAuNjAzIDcuMjI0LDcwLjg1MSBDNy4xMTUsNzAuOTE0IDcuMDEsNzAuOTQ3IDYuOTIsNzAuOTQ3IE03LjcxNCw2OC44NjEgQzcuNTk1LDY4Ljg2MSA3LjQ2LDY4LjkgNy4zMTcsNjguOTgyIEM2LjgyOSw2OS4yNjUgNi40MzMsNjkuOTQ4IDYuNDMzLDcwLjUwOCBDNi40MzMsNzAuOTA1IDYuNjMxLDcxLjEzMyA2LjkyLDcxLjEzMyBDNy4wMzksNzEuMTMzIDcuMTc0LDcxLjA5NCA3LjMxNyw3MS4wMTIgQzcuODA2LDcwLjczIDguMjAyLDcwLjA0NyA4LjIwMiw2OS40ODcgQzguMjAyLDY5LjA5IDguMDAzLDY4Ljg2MSA3LjcxNCw2OC44NjEiIGlkPSJGaWxsLTE1IiBmaWxsPSIjODA5N0EyIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTcuNDQ0LDg1LjM1IEM3LjcwOCw4NS4xOTggNy45MjEsODUuMzE5IDcuOTIxLDg1LjYyMiBDNy45MjEsODUuOTI1IDcuNzA4LDg2LjI5MiA3LjQ0NCw4Ni40NDQgQzcuMTgxLDg2LjU5NyA2Ljk2Nyw4Ni40NzUgNi45NjcsODYuMTczIEM2Ljk2Nyw4NS44NzEgNy4xODEsODUuNTAyIDcuNDQ0LDg1LjM1IiBpZD0iRmlsbC0xNiIgZmlsbD0iI0ZGRkZGRiI+PC9wYXRoPgogICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik03LjIzLDg2LjUxIEM3LjA3NCw4Ni41MSA2Ljk2Nyw4Ni4zODcgNi45NjcsODYuMTczIEM2Ljk2Nyw4NS44NzEgNy4xODEsODUuNTAyIDcuNDQ0LDg1LjM1IEM3LjUyMSw4NS4zMDUgNy41OTQsODUuMjg0IDcuNjU4LDg1LjI4NCBDNy44MTQsODUuMjg0IDcuOTIxLDg1LjQwOCA3LjkyMSw4NS42MjIgQzcuOTIxLDg1LjkyNSA3LjcwOCw4Ni4yOTIgNy40NDQsODYuNDQ0IEM3LjM2Nyw4Ni40ODkgNy4yOTQsODYuNTEgNy4yMyw4Ni41MSBNNy42NTgsODUuMDk4IEM3LjU1OCw4NS4wOTggNy40NTUsODUuMTI3IDcuMzUxLDg1LjE4OCBDNy4wMzEsODUuMzczIDYuNzgxLDg1LjgwNiA2Ljc4MSw4Ni4xNzMgQzYuNzgxLDg2LjQ4MiA2Ljk2Niw4Ni42OTcgNy4yMyw4Ni42OTcgQzcuMzMsODYuNjk3IDcuNDMzLDg2LjY2NiA3LjUzOCw4Ni42MDcgQzcuODU4LDg2LjQyMiA4LjEwOCw4NS45ODkgOC4xMDgsODUuNjIyIEM4LjEwOCw4NS4zMTMgNy45MjMsODUuMDk4IDcuNjU4LDg1LjA5OCIgaWQ9IkZpbGwtMTciIGZpbGw9IiM4MDk3QTIiPjwvcGF0aD4KICAgICAgICAgICAgICAgICAgICA8cGF0aCBkPSJNNy4yMyw4Ni4zMjIgTDcuMTU0LDg2LjE3MyBDNy4xNTQsODUuOTM4IDcuMzMzLDg1LjYyOSA3LjUzOCw4NS41MTIgTDcuNjU4LDg1LjQ3MSBMNy43MzQsODUuNjIyIEM3LjczNCw4NS44NTYgNy41NTUsODYuMTY0IDcuMzUxLDg2LjI4MiBMNy4yMyw4Ni4zMjIgTTcuNjU4LDg1LjI4NCBDNy41OTQsODUuMjg0IDcuNTIxLDg1LjMwNSA3LjQ0NCw4NS4zNSBDNy4xODEsODUuNTAyIDYuOTY3LDg1Ljg3MSA2Ljk2Nyw4Ni4xNzMgQzYuOTY3LDg2LjM4NyA3LjA3NCw4Ni41MSA3LjIzLDg2LjUxIEM3LjI5NCw4Ni41MSA3LjM2Nyw4Ni40ODkgNy40NDQsODYuNDQ0IEM3LjcwOCw4Ni4yOTIgNy45MjEsODUuOTI1IDcuOTIxLDg1LjYyMiBDNy45MjEsODUuNDA4IDcuODE0LDg1LjI4NCA3LjY1OCw4NS4yODQiIGlkPSJGaWxsLTE4IiBmaWxsPSIjODA5N0EyIj48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTc3LjI3OCw3Ljc2OSBMNzcuMjc4LDUxLjQzNiBMMTAuMjA4LDkwLjE2IEwxMC4yMDgsNDYuNDkzIEw3Ny4yNzgsNy43NjkiIGlkPSJGaWxsLTE5IiBmaWxsPSIjNDU1QTY0Ij48L3BhdGg+CiAgICAgICAgICAgICAgICAgICAgPHBhdGggZD0iTTEwLjA4Myw5MC4zNzUgTDEwLjA4Myw0Ni40MjEgTDEwLjE0Niw0Ni4zODUgTDc3LjQwMyw3LjU1NCBMNzcuNDAzLDUxLjUwOCBMNzcuMzQxLDUxLjU0NCBMMTAuMDgzLDkwLjM3NSBMMTAuMDgzLDkwLjM3NSBaIE0xMC4zMzMsNDYuNTY0IEwxMC4zMzMsODkuOTQ0IEw3Ny4xNTQsNTEuMzY1IEw3Ny4xNTQsNy45ODUgTDEwLjMzMyw0Ni41NjQgTDEwLjMzMyw0Ni41NjQgWiIgaWQ9IkZpbGwtMjAiIGZpbGw9IiM2MDdEOEIiPjwvcGF0aD4KICAgICAgICAgICAgICAgIDwvZz4KICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0xMjUuNzM3LDg4LjY0NyBMMTE4LjA5OCw5MS45ODEgTDExOC4wOTgsODQgTDEwNi42MzksODguNzEzIEwxMDYuNjM5LDk2Ljk4MiBMOTksMTAwLjMxNSBMMTEyLjM2OSwxMDMuOTYxIEwxMjUuNzM3LDg4LjY0NyIgaWQ9IkltcG9ydGVkLUxheWVycy1Db3B5LTIiIGZpbGw9IiM0NTVBNjQiIHNrZXRjaDp0eXBlPSJNU1NoYXBlR3JvdXAiPjwvcGF0aD4KICAgICAgICAgICAgPC9nPgogICAgICAgIDwvZz4KICAgIDwvZz4KPC9zdmc+');
};

module.exports = RotateInstructions;

},{"./util.js":24}],18:[function(require,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * TODO: Fix up all "new THREE" instantiations to improve performance.
 */
var SensorSample = require('./sensor-sample.js');
var THREE = require('../three-math.js');
var Util = require('../util.js');

var DEBUG = false;

/**
 * An implementation of a simple complementary filter, which fuses gyroscope and
 * accelerometer data from the 'devicemotion' event.
 *
 * Accelerometer data is very noisy, but stable over the long term.
 * Gyroscope data is smooth, but tends to drift over the long term.
 *
 * This fusion is relatively simple:
 * 1. Get orientation estimates from accelerometer by applying a low-pass filter
 *    on that data.
 * 2. Get orientation estimates from gyroscope by integrating over time.
 * 3. Combine the two estimates, weighing (1) in the long term, but (2) for the
 *    short term.
 */
function ComplementaryFilter(kFilter) {
  this.kFilter = kFilter;

  // Raw sensor measurements.
  this.currentAccelMeasurement = new SensorSample();
  this.currentGyroMeasurement = new SensorSample();
  this.previousGyroMeasurement = new SensorSample();

  // Current filter orientation
  this.filterQ = new THREE.Quaternion();
  this.previousFilterQ = new THREE.Quaternion();

  // Orientation based on the accelerometer.
  this.accelQ = new THREE.Quaternion();
  // Whether or not the orientation has been initialized.
  this.isOrientationInitialized = false;
  // Running estimate of gravity based on the current orientation.
  this.estimatedGravity = new THREE.Vector3();
  // Measured gravity based on accelerometer.
  this.measuredGravity = new THREE.Vector3();

  // Debug only quaternion of gyro-based orientation.
  this.gyroIntegralQ = new THREE.Quaternion();
}

ComplementaryFilter.prototype.addAccelMeasurement = function(vector, timestampS) {
  this.currentAccelMeasurement.set(vector, timestampS);
};

ComplementaryFilter.prototype.addGyroMeasurement = function(vector, timestampS) {
  this.currentGyroMeasurement.set(vector, timestampS);

  var deltaT = timestampS - this.previousGyroMeasurement.timestampS;
  if (Util.isTimestampDeltaValid(deltaT)) {
    this.run_();
  }
  
  this.previousGyroMeasurement.copy(this.currentGyroMeasurement);
};

ComplementaryFilter.prototype.run_ = function() {

  if (!this.isOrientationInitialized) {
    this.accelQ = this.accelToQuaternion_(this.currentAccelMeasurement.sample);
    this.previousFilterQ.copy(this.accelQ);
    this.isOrientationInitialized = true;
    return;
  }

  var deltaT = this.currentGyroMeasurement.timestampS -
      this.previousGyroMeasurement.timestampS;

  // Convert gyro rotation vector to a quaternion delta.
  var gyroDeltaQ = this.gyroToQuaternionDelta_(this.currentGyroMeasurement.sample, deltaT);
  this.gyroIntegralQ.multiply(gyroDeltaQ);

  // filter_1 = K * (filter_0 + gyro * dT) + (1 - K) * accel.
  this.filterQ.copy(this.previousFilterQ);
  this.filterQ.multiply(gyroDeltaQ);

  // Calculate the delta between the current estimated gravity and the real
  // gravity vector from accelerometer.
  var invFilterQ = new THREE.Quaternion();
  invFilterQ.copy(this.filterQ);
  invFilterQ.inverse();

  this.estimatedGravity.set(0, 0, -1);
  this.estimatedGravity.applyQuaternion(invFilterQ);
  this.estimatedGravity.normalize();

  this.measuredGravity.copy(this.currentAccelMeasurement.sample);
  this.measuredGravity.normalize();

  // Compare estimated gravity with measured gravity, get the delta quaternion
  // between the two.
  var deltaQ = new THREE.Quaternion();
  deltaQ.setFromUnitVectors(this.estimatedGravity, this.measuredGravity);
  deltaQ.inverse();

  if (DEBUG) {
    console.log('Delta: %d deg, G_est: (%s, %s, %s), G_meas: (%s, %s, %s)',
                THREE.Math.radToDeg(Util.getQuaternionAngle(deltaQ)),
                (this.estimatedGravity.x).toFixed(1),
                (this.estimatedGravity.y).toFixed(1),
                (this.estimatedGravity.z).toFixed(1),
                (this.measuredGravity.x).toFixed(1),
                (this.measuredGravity.y).toFixed(1),
                (this.measuredGravity.z).toFixed(1));
  }

  // Calculate the SLERP target: current orientation plus the measured-estimated
  // quaternion delta.
  var targetQ = new THREE.Quaternion();
  targetQ.copy(this.filterQ);
  targetQ.multiply(deltaQ);

  // SLERP factor: 0 is pure gyro, 1 is pure accel.
  this.filterQ.slerp(targetQ, 1 - this.kFilter);

  this.previousFilterQ.copy(this.filterQ);
};

ComplementaryFilter.prototype.getOrientation = function() {
  return this.filterQ;
};

ComplementaryFilter.prototype.accelToQuaternion_ = function(accel) {
  var normAccel = new THREE.Vector3();
  normAccel.copy(accel);
  normAccel.normalize();
  var quat = new THREE.Quaternion();
  quat.setFromUnitVectors(new THREE.Vector3(0, 0, -1), normAccel);
  quat.inverse();
  return quat;
};

ComplementaryFilter.prototype.gyroToQuaternionDelta_ = function(gyro, dt) {
  // Extract axis and angle from the gyroscope data.
  var quat = new THREE.Quaternion();
  var axis = new THREE.Vector3();
  axis.copy(gyro);
  axis.normalize();
  quat.setFromAxisAngle(axis, gyro.length() * dt);
  return quat;
};


module.exports = ComplementaryFilter;

},{"../three-math.js":22,"../util.js":24,"./sensor-sample.js":21}],19:[function(require,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var ComplementaryFilter = require('./complementary-filter.js');
var PosePredictor = require('./pose-predictor.js');
var TouchPanner = require('../touch-panner.js');
var THREE = require('../three-math.js');
var Util = require('../util.js');

/**
 * The pose sensor, implemented using DeviceMotion APIs.
 */
function FusionPoseSensor() {
  this.deviceId = 'webvr-polyfill:fused';
  this.deviceName = 'VR Position Device (webvr-polyfill:fused)';

  this.accelerometer = new THREE.Vector3();
  this.gyroscope = new THREE.Vector3();

  window.addEventListener('devicemotion', this.onDeviceMotionChange_.bind(this));
  window.addEventListener('orientationchange', this.onScreenOrientationChange_.bind(this));

  this.filter = new ComplementaryFilter(WebVRConfig.K_FILTER || 0.98);
  this.posePredictor = new PosePredictor(WebVRConfig.PREDICTION_TIME_S || 0.040);
  this.touchPanner = new TouchPanner();

  this.filterToWorldQ = new THREE.Quaternion();

  // Set the filter to world transform, depending on OS.
  if (Util.isIOS()) {
    this.filterToWorldQ.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI/2);
  } else {
    this.filterToWorldQ.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2);
  }

  this.worldToScreenQ = new THREE.Quaternion();
  this.setScreenTransform_();

  // Keep track of a reset transform for resetSensor.
  this.resetQ = new THREE.Quaternion();

  this.isFirefoxAndroid = Util.isFirefoxAndroid();
  this.isIOS = Util.isIOS();

  this.orientationOut_ = new Float32Array(4);
}

FusionPoseSensor.prototype.getPosition = function() {
  // This PoseSensor doesn't support position
  return null;
};

FusionPoseSensor.prototype.getOrientation = function() {
  // Convert from filter space to the the same system used by the
  // deviceorientation event.
  var orientation = this.filter.getOrientation();

  // Predict orientation.
  this.predictedQ = this.posePredictor.getPrediction(orientation, this.gyroscope, this.previousTimestampS);

  // Convert to THREE coordinate system: -Z forward, Y up, X right.
  var out = new THREE.Quaternion();
  out.copy(this.filterToWorldQ);
  out.multiply(this.resetQ);
  if (!WebVRConfig.TOUCH_PANNER_DISABLED) {
    out.multiply(this.touchPanner.getOrientation());
  }
  out.multiply(this.predictedQ);
  out.multiply(this.worldToScreenQ);

  // Handle the yaw-only case.
  if (WebVRConfig.YAW_ONLY) {
    // Make a quaternion that only turns around the Y-axis.
    out.x = 0;
    out.z = 0;
    out.normalize();
  }

  this.orientationOut_[0] = out.x;
  this.orientationOut_[1] = out.y;
  this.orientationOut_[2] = out.z;
  this.orientationOut_[3] = out.w;
  return this.orientationOut_;
};

FusionPoseSensor.prototype.resetPose = function() {
  // Reduce to inverted yaw-only
  this.resetQ.copy(this.filter.getOrientation());
  this.resetQ.x = 0;
  this.resetQ.y = 0;
  this.resetQ.z *= -1;
  this.resetQ.normalize();

  if (!WebVRConfig.TOUCH_PANNER_DISABLED) {
    this.touchPanner.resetSensor();
  }
};

FusionPoseSensor.prototype.onDeviceMotionChange_ = function(deviceMotion) {
  var accGravity = deviceMotion.accelerationIncludingGravity;
  var rotRate = deviceMotion.rotationRate;
  var timestampS = deviceMotion.timeStamp / 1000;

  // Firefox Android timeStamp returns one thousandth of a millisecond.
  if (this.isFirefoxAndroid) {
    timestampS /= 1000;
  }

  var deltaS = timestampS - this.previousTimestampS;
  if (deltaS <= Util.MIN_TIMESTEP || deltaS > Util.MAX_TIMESTEP) {
    console.warn('Invalid timestamps detected. Time step between successive ' +
                 'gyroscope sensor samples is very small or not monotonic');
    this.previousTimestampS = timestampS;
    return;
  }
  this.accelerometer.set(-accGravity.x, -accGravity.y, -accGravity.z);
  this.gyroscope.set(rotRate.alpha, rotRate.beta, rotRate.gamma);

  // With iOS and Firefox Android, rotationRate is reported in degrees,
  // so we first convert to radians.
  if (this.isIOS || this.isFirefoxAndroid) {
    this.gyroscope.multiplyScalar(Math.PI / 180);
  }

  this.filter.addAccelMeasurement(this.accelerometer, timestampS);
  this.filter.addGyroMeasurement(this.gyroscope, timestampS);

  this.previousTimestampS = timestampS;
};

FusionPoseSensor.prototype.onScreenOrientationChange_ =
    function(screenOrientation) {
  this.setScreenTransform_();
};

FusionPoseSensor.prototype.setScreenTransform_ = function() {
  this.worldToScreenQ.set(0, 0, 0, 1);
  switch (window.orientation) {
    case 0:
      break;
    case 90:
      this.worldToScreenQ.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI/2);
      break;
    case -90:
      this.worldToScreenQ.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI/2);
      break;
    case 180:
      // TODO.
      break;
  }
};


module.exports = FusionPoseSensor;

},{"../three-math.js":22,"../touch-panner.js":23,"../util.js":24,"./complementary-filter.js":18,"./pose-predictor.js":20}],20:[function(require,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var MathUtil = require('../math-util.js');
var DEBUG = false;

/**
 * Given an orientation and the gyroscope data, predicts the future orientation
 * of the head. This makes rendering appear faster.
 *
 * Also see: http://msl.cs.uiuc.edu/~lavalle/papers/LavYerKatAnt14.pdf
 *
 * @param {Number} predictionTimeS time from head movement to the appearance of
 * the corresponding image.
 */
function PosePredictor(predictionTimeS) {
  this.predictionTimeS = predictionTimeS;

  // The quaternion corresponding to the previous state.
  this.previousQ = new MathUtil.Quaternion();
  // Previous time a prediction occurred.
  this.previousTimestampS = null;

  // The delta quaternion that adjusts the current pose.
  this.deltaQ = new MathUtil.Quaternion();
  // The output quaternion.
  this.outQ = new MathUtil.Quaternion();
}

PosePredictor.prototype.getPrediction = function(currentQ, gyro, timestampS) {
  if (!this.previousTimestampS) {
    this.previousQ.copy(currentQ);
    this.previousTimestampS = timestampS;
    return currentQ;
  }

  // Calculate axis and angle based on gyroscope rotation rate data.
  var axis = new MathUtil.Vector3();
  axis.copy(gyro);
  axis.normalize();

  var angularSpeed = gyro.length();

  // If we're rotating slowly, don't do prediction.
  if (angularSpeed < MathUtil.degToRad * 20) {
    if (DEBUG) {
      console.log('Moving slowly, at %s deg/s: no prediction',
                  (MathUtil.radToDeg * angularSpeed).toFixed(1));
    }
    this.outQ.copy(currentQ);
    this.previousQ.copy(currentQ);
    return this.outQ;
  }

  // Get the predicted angle based on the time delta and latency.
  var deltaT = timestampS - this.previousTimestampS;
  var predictAngle = angularSpeed * this.predictionTimeS;

  this.deltaQ.setFromAxisAngle(axis, predictAngle);
  this.outQ.copy(this.previousQ);
  this.outQ.multiply(this.deltaQ);

  this.previousQ.copy(currentQ);

  return this.outQ;
};


module.exports = PosePredictor;

},{"../math-util.js":15}],21:[function(require,module,exports){
function SensorSample(sample, timestampS) {
  this.set(sample, timestampS);
};

SensorSample.prototype.set = function(sample, timestampS) {
  this.sample = sample;
  this.timestampS = timestampS;
};

SensorSample.prototype.copy = function(sensorSample) {
  this.set(sensorSample.sample, sensorSample.timestampS);
};

module.exports = SensorSample;

},{}],22:[function(require,module,exports){
/*
 * A subset of THREE.js, providing mostly quaternion and euler-related
 * operations, manually lifted from
 * https://github.com/mrdoob/three.js/tree/master/src/math, as of 9c30286b38df039fca389989ff06ea1c15d6bad1
 */

// Only use if the real THREE is not provided.
var THREE = window.THREE || {};

// If some piece of THREE is missing, fill it in here.
if (!THREE.Quaternion || !THREE.Vector3 || !THREE.Vector2 || !THREE.Euler || !THREE.Math) {
console.log('No THREE.js found.');


/*** START Quaternion ***/

/**
 * @author mikael emtinger / http://gomo.se/
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author bhouston / http://exocortex.com
 */

THREE.Quaternion = function ( x, y, z, w ) {

	this._x = x || 0;
	this._y = y || 0;
	this._z = z || 0;
	this._w = ( w !== undefined ) ? w : 1;

};

THREE.Quaternion.prototype = {

	constructor: THREE.Quaternion,

	_x: 0,_y: 0, _z: 0, _w: 0,

	get x () {

		return this._x;

	},

	set x ( value ) {

		this._x = value;
		this.onChangeCallback();

	},

	get y () {

		return this._y;

	},

	set y ( value ) {

		this._y = value;
		this.onChangeCallback();

	},

	get z () {

		return this._z;

	},

	set z ( value ) {

		this._z = value;
		this.onChangeCallback();

	},

	get w () {

		return this._w;

	},

	set w ( value ) {

		this._w = value;
		this.onChangeCallback();

	},

	set: function ( x, y, z, w ) {

		this._x = x;
		this._y = y;
		this._z = z;
		this._w = w;

		this.onChangeCallback();

		return this;

	},

	copy: function ( quaternion ) {

		this._x = quaternion.x;
		this._y = quaternion.y;
		this._z = quaternion.z;
		this._w = quaternion.w;

		this.onChangeCallback();

		return this;

	},

	setFromEuler: function ( euler, update ) {

		if ( euler instanceof THREE.Euler === false ) {

			throw new Error( 'THREE.Quaternion: .setFromEuler() now expects a Euler rotation rather than a Vector3 and order.' );
		}

		// http://www.mathworks.com/matlabcentral/fileexchange/
		// 	20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
		//	content/SpinCalc.m

		var c1 = Math.cos( euler._x / 2 );
		var c2 = Math.cos( euler._y / 2 );
		var c3 = Math.cos( euler._z / 2 );
		var s1 = Math.sin( euler._x / 2 );
		var s2 = Math.sin( euler._y / 2 );
		var s3 = Math.sin( euler._z / 2 );

		if ( euler.order === 'XYZ' ) {

			this._x = s1 * c2 * c3 + c1 * s2 * s3;
			this._y = c1 * s2 * c3 - s1 * c2 * s3;
			this._z = c1 * c2 * s3 + s1 * s2 * c3;
			this._w = c1 * c2 * c3 - s1 * s2 * s3;

		} else if ( euler.order === 'YXZ' ) {

			this._x = s1 * c2 * c3 + c1 * s2 * s3;
			this._y = c1 * s2 * c3 - s1 * c2 * s3;
			this._z = c1 * c2 * s3 - s1 * s2 * c3;
			this._w = c1 * c2 * c3 + s1 * s2 * s3;

		} else if ( euler.order === 'ZXY' ) {

			this._x = s1 * c2 * c3 - c1 * s2 * s3;
			this._y = c1 * s2 * c3 + s1 * c2 * s3;
			this._z = c1 * c2 * s3 + s1 * s2 * c3;
			this._w = c1 * c2 * c3 - s1 * s2 * s3;

		} else if ( euler.order === 'ZYX' ) {

			this._x = s1 * c2 * c3 - c1 * s2 * s3;
			this._y = c1 * s2 * c3 + s1 * c2 * s3;
			this._z = c1 * c2 * s3 - s1 * s2 * c3;
			this._w = c1 * c2 * c3 + s1 * s2 * s3;

		} else if ( euler.order === 'YZX' ) {

			this._x = s1 * c2 * c3 + c1 * s2 * s3;
			this._y = c1 * s2 * c3 + s1 * c2 * s3;
			this._z = c1 * c2 * s3 - s1 * s2 * c3;
			this._w = c1 * c2 * c3 - s1 * s2 * s3;

		} else if ( euler.order === 'XZY' ) {

			this._x = s1 * c2 * c3 - c1 * s2 * s3;
			this._y = c1 * s2 * c3 - s1 * c2 * s3;
			this._z = c1 * c2 * s3 + s1 * s2 * c3;
			this._w = c1 * c2 * c3 + s1 * s2 * s3;

		}

		if ( update !== false ) this.onChangeCallback();

		return this;

	},

	setFromAxisAngle: function ( axis, angle ) {

		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm

		// assumes axis is normalized

		var halfAngle = angle / 2, s = Math.sin( halfAngle );

		this._x = axis.x * s;
		this._y = axis.y * s;
		this._z = axis.z * s;
		this._w = Math.cos( halfAngle );

		this.onChangeCallback();

		return this;

	},

	setFromRotationMatrix: function ( m ) {

		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm

		// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

		var te = m.elements,

			m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ],
			m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ],
			m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ],

			trace = m11 + m22 + m33,
			s;

		if ( trace > 0 ) {

			s = 0.5 / Math.sqrt( trace + 1.0 );

			this._w = 0.25 / s;
			this._x = ( m32 - m23 ) * s;
			this._y = ( m13 - m31 ) * s;
			this._z = ( m21 - m12 ) * s;

		} else if ( m11 > m22 && m11 > m33 ) {

			s = 2.0 * Math.sqrt( 1.0 + m11 - m22 - m33 );

			this._w = ( m32 - m23 ) / s;
			this._x = 0.25 * s;
			this._y = ( m12 + m21 ) / s;
			this._z = ( m13 + m31 ) / s;

		} else if ( m22 > m33 ) {

			s = 2.0 * Math.sqrt( 1.0 + m22 - m11 - m33 );

			this._w = ( m13 - m31 ) / s;
			this._x = ( m12 + m21 ) / s;
			this._y = 0.25 * s;
			this._z = ( m23 + m32 ) / s;

		} else {

			s = 2.0 * Math.sqrt( 1.0 + m33 - m11 - m22 );

			this._w = ( m21 - m12 ) / s;
			this._x = ( m13 + m31 ) / s;
			this._y = ( m23 + m32 ) / s;
			this._z = 0.25 * s;

		}

		this.onChangeCallback();

		return this;

	},

	setFromUnitVectors: function () {

		// http://lolengine.net/blog/2014/02/24/quaternion-from-two-vectors-final

		// assumes direction vectors vFrom and vTo are normalized

		var v1, r;

		var EPS = 0.000001;

		return function ( vFrom, vTo ) {

			if ( v1 === undefined ) v1 = new THREE.Vector3();

			r = vFrom.dot( vTo ) + 1;

			if ( r < EPS ) {

				r = 0;

				if ( Math.abs( vFrom.x ) > Math.abs( vFrom.z ) ) {

					v1.set( - vFrom.y, vFrom.x, 0 );

				} else {

					v1.set( 0, - vFrom.z, vFrom.y );

				}

			} else {

				v1.crossVectors( vFrom, vTo );

			}

			this._x = v1.x;
			this._y = v1.y;
			this._z = v1.z;
			this._w = r;

			this.normalize();

			return this;

		}

	}(),

	inverse: function () {

		this.conjugate().normalize();

		return this;

	},

	conjugate: function () {

		this._x *= - 1;
		this._y *= - 1;
		this._z *= - 1;

		this.onChangeCallback();

		return this;

	},

	dot: function ( v ) {

		return this._x * v._x + this._y * v._y + this._z * v._z + this._w * v._w;

	},

	lengthSq: function () {

		return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w;

	},

	length: function () {

		return Math.sqrt( this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w );

	},

	normalize: function () {

		var l = this.length();

		if ( l === 0 ) {

			this._x = 0;
			this._y = 0;
			this._z = 0;
			this._w = 1;

		} else {

			l = 1 / l;

			this._x = this._x * l;
			this._y = this._y * l;
			this._z = this._z * l;
			this._w = this._w * l;

		}

		this.onChangeCallback();

		return this;

	},

	multiply: function ( q, p ) {

		if ( p !== undefined ) {

			console.warn( 'THREE.Quaternion: .multiply() now only accepts one argument. Use .multiplyQuaternions( a, b ) instead.' );
			return this.multiplyQuaternions( q, p );

		}

		return this.multiplyQuaternions( this, q );

	},

	multiplyQuaternions: function ( a, b ) {

		// from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm

		var qax = a._x, qay = a._y, qaz = a._z, qaw = a._w;
		var qbx = b._x, qby = b._y, qbz = b._z, qbw = b._w;

		this._x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
		this._y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
		this._z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
		this._w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

		this.onChangeCallback();

		return this;

	},

	multiplyVector3: function ( vector ) {

		console.warn( 'THREE.Quaternion: .multiplyVector3() has been removed. Use is now vector.applyQuaternion( quaternion ) instead.' );
		return vector.applyQuaternion( this );

	},

	slerp: function ( qb, t ) {

		if ( t === 0 ) return this;
		if ( t === 1 ) return this.copy( qb );

		var x = this._x, y = this._y, z = this._z, w = this._w;

		// http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

		var cosHalfTheta = w * qb._w + x * qb._x + y * qb._y + z * qb._z;

		if ( cosHalfTheta < 0 ) {

			this._w = - qb._w;
			this._x = - qb._x;
			this._y = - qb._y;
			this._z = - qb._z;

			cosHalfTheta = - cosHalfTheta;

		} else {

			this.copy( qb );

		}

		if ( cosHalfTheta >= 1.0 ) {

			this._w = w;
			this._x = x;
			this._y = y;
			this._z = z;

			return this;

		}

		var halfTheta = Math.acos( cosHalfTheta );
		var sinHalfTheta = Math.sqrt( 1.0 - cosHalfTheta * cosHalfTheta );

		if ( Math.abs( sinHalfTheta ) < 0.001 ) {

			this._w = 0.5 * ( w + this._w );
			this._x = 0.5 * ( x + this._x );
			this._y = 0.5 * ( y + this._y );
			this._z = 0.5 * ( z + this._z );

			return this;

		}

		var ratioA = Math.sin( ( 1 - t ) * halfTheta ) / sinHalfTheta,
		ratioB = Math.sin( t * halfTheta ) / sinHalfTheta;

		this._w = ( w * ratioA + this._w * ratioB );
		this._x = ( x * ratioA + this._x * ratioB );
		this._y = ( y * ratioA + this._y * ratioB );
		this._z = ( z * ratioA + this._z * ratioB );

		this.onChangeCallback();

		return this;

	},

	equals: function ( quaternion ) {

		return ( quaternion._x === this._x ) && ( quaternion._y === this._y ) && ( quaternion._z === this._z ) && ( quaternion._w === this._w );

	},

	fromArray: function ( array, offset ) {

		if ( offset === undefined ) offset = 0;

		this._x = array[ offset ];
		this._y = array[ offset + 1 ];
		this._z = array[ offset + 2 ];
		this._w = array[ offset + 3 ];

		this.onChangeCallback();

		return this;

	},

	toArray: function ( array, offset ) {

		if ( array === undefined ) array = [];
		if ( offset === undefined ) offset = 0;

		array[ offset ] = this._x;
		array[ offset + 1 ] = this._y;
		array[ offset + 2 ] = this._z;
		array[ offset + 3 ] = this._w;

		return array;

	},

	onChange: function ( callback ) {

		this.onChangeCallback = callback;

		return this;

	},

	onChangeCallback: function () {},

	clone: function () {

		return new THREE.Quaternion( this._x, this._y, this._z, this._w );

	}

};

THREE.Quaternion.slerp = function ( qa, qb, qm, t ) {

	return qm.copy( qa ).slerp( qb, t );

}

/*** END Quaternion ***/
/*** START Vector2 ***/
/**
 * @author mrdoob / http://mrdoob.com/
 * @author philogb / http://blog.thejit.org/
 * @author egraether / http://egraether.com/
 * @author zz85 / http://www.lab4games.net/zz85/blog
 */

THREE.Vector2 = function ( x, y ) {

	this.x = x || 0;
	this.y = y || 0;

};

THREE.Vector2.prototype = {

	constructor: THREE.Vector2,

	set: function ( x, y ) {

		this.x = x;
		this.y = y;

		return this;

	},

	setX: function ( x ) {

		this.x = x;

		return this;

	},

	setY: function ( y ) {

		this.y = y;

		return this;

	},

	setComponent: function ( index, value ) {

		switch ( index ) {

			case 0: this.x = value; break;
			case 1: this.y = value; break;
			default: throw new Error( 'index is out of range: ' + index );

		}

	},

	getComponent: function ( index ) {

		switch ( index ) {

			case 0: return this.x;
			case 1: return this.y;
			default: throw new Error( 'index is out of range: ' + index );

		}

	},

	copy: function ( v ) {

		this.x = v.x;
		this.y = v.y;

		return this;

	},

	add: function ( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'THREE.Vector2: .add() now only accepts one argument. Use .addVectors( a, b ) instead.' );
			return this.addVectors( v, w );

		}

		this.x += v.x;
		this.y += v.y;

		return this;

	},

	addVectors: function ( a, b ) {

		this.x = a.x + b.x;
		this.y = a.y + b.y;

		return this;

	},

	addScalar: function ( s ) {

		this.x += s;
		this.y += s;

		return this;

	},

	sub: function ( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'THREE.Vector2: .sub() now only accepts one argument. Use .subVectors( a, b ) instead.' );
			return this.subVectors( v, w );

		}

		this.x -= v.x;
		this.y -= v.y;

		return this;

	},

	subVectors: function ( a, b ) {

		this.x = a.x - b.x;
		this.y = a.y - b.y;

		return this;

	},

	multiply: function ( v ) {

		this.x *= v.x;
		this.y *= v.y;

		return this;

	},

	multiplyScalar: function ( s ) {

		this.x *= s;
		this.y *= s;

		return this;

	},

	divide: function ( v ) {

		this.x /= v.x;
		this.y /= v.y;

		return this;

	},

	divideScalar: function ( scalar ) {

		if ( scalar !== 0 ) {

			var invScalar = 1 / scalar;

			this.x *= invScalar;
			this.y *= invScalar;

		} else {

			this.x = 0;
			this.y = 0;

		}

		return this;

	},

	min: function ( v ) {

		if ( this.x > v.x ) {

			this.x = v.x;

		}

		if ( this.y > v.y ) {

			this.y = v.y;

		}

		return this;

	},

	max: function ( v ) {

		if ( this.x < v.x ) {

			this.x = v.x;

		}

		if ( this.y < v.y ) {

			this.y = v.y;

		}

		return this;

	},

	clamp: function ( min, max ) {

		// This function assumes min < max, if this assumption isn't true it will not operate correctly

		if ( this.x < min.x ) {

			this.x = min.x;

		} else if ( this.x > max.x ) {

			this.x = max.x;

		}

		if ( this.y < min.y ) {

			this.y = min.y;

		} else if ( this.y > max.y ) {

			this.y = max.y;

		}

		return this;
	},

	clampScalar: ( function () {

		var min, max;

		return function ( minVal, maxVal ) {

			if ( min === undefined ) {

				min = new THREE.Vector2();
				max = new THREE.Vector2();

			}

			min.set( minVal, minVal );
			max.set( maxVal, maxVal );

			return this.clamp( min, max );

		};

	} )(),

	floor: function () {

		this.x = Math.floor( this.x );
		this.y = Math.floor( this.y );

		return this;

	},

	ceil: function () {

		this.x = Math.ceil( this.x );
		this.y = Math.ceil( this.y );

		return this;

	},

	round: function () {

		this.x = Math.round( this.x );
		this.y = Math.round( this.y );

		return this;

	},

	roundToZero: function () {

		this.x = ( this.x < 0 ) ? Math.ceil( this.x ) : Math.floor( this.x );
		this.y = ( this.y < 0 ) ? Math.ceil( this.y ) : Math.floor( this.y );

		return this;

	},

	negate: function () {

		this.x = - this.x;
		this.y = - this.y;

		return this;

	},

	dot: function ( v ) {

		return this.x * v.x + this.y * v.y;

	},

	lengthSq: function () {

		return this.x * this.x + this.y * this.y;

	},

	length: function () {

		return Math.sqrt( this.x * this.x + this.y * this.y );

	},

	normalize: function () {

		return this.divideScalar( this.length() );

	},

	distanceTo: function ( v ) {

		return Math.sqrt( this.distanceToSquared( v ) );

	},

	distanceToSquared: function ( v ) {

		var dx = this.x - v.x, dy = this.y - v.y;
		return dx * dx + dy * dy;

	},

	setLength: function ( l ) {

		var oldLength = this.length();

		if ( oldLength !== 0 && l !== oldLength ) {

			this.multiplyScalar( l / oldLength );
		}

		return this;

	},

	lerp: function ( v, alpha ) {

		this.x += ( v.x - this.x ) * alpha;
		this.y += ( v.y - this.y ) * alpha;

		return this;

	},

	equals: function ( v ) {

		return ( ( v.x === this.x ) && ( v.y === this.y ) );

	},

	fromArray: function ( array, offset ) {

		if ( offset === undefined ) offset = 0;

		this.x = array[ offset ];
		this.y = array[ offset + 1 ];

		return this;

	},

	toArray: function ( array, offset ) {

		if ( array === undefined ) array = [];
		if ( offset === undefined ) offset = 0;

		array[ offset ] = this.x;
		array[ offset + 1 ] = this.y;

		return array;

	},

	fromAttribute: function ( attribute, index, offset ) {

	    if ( offset === undefined ) offset = 0;

	    index = index * attribute.itemSize + offset;

	    this.x = attribute.array[ index ];
	    this.y = attribute.array[ index + 1 ];

	    return this;

	},

	clone: function () {

		return new THREE.Vector2( this.x, this.y );

	}

};
/*** END Vector2 ***/
/*** START Vector3 ***/

/**
 * @author mrdoob / http://mrdoob.com/
 * @author *kile / http://kile.stravaganza.org/
 * @author philogb / http://blog.thejit.org/
 * @author mikael emtinger / http://gomo.se/
 * @author egraether / http://egraether.com/
 * @author WestLangley / http://github.com/WestLangley
 */

THREE.Vector3 = function ( x, y, z ) {

	this.x = x || 0;
	this.y = y || 0;
	this.z = z || 0;

};

THREE.Vector3.prototype = {

	constructor: THREE.Vector3,

	set: function ( x, y, z ) {

		this.x = x;
		this.y = y;
		this.z = z;

		return this;

	},

	setX: function ( x ) {

		this.x = x;

		return this;

	},

	setY: function ( y ) {

		this.y = y;

		return this;

	},

	setZ: function ( z ) {

		this.z = z;

		return this;

	},

	setComponent: function ( index, value ) {

		switch ( index ) {

			case 0: this.x = value; break;
			case 1: this.y = value; break;
			case 2: this.z = value; break;
			default: throw new Error( 'index is out of range: ' + index );

		}

	},

	getComponent: function ( index ) {

		switch ( index ) {

			case 0: return this.x;
			case 1: return this.y;
			case 2: return this.z;
			default: throw new Error( 'index is out of range: ' + index );

		}

	},

	copy: function ( v ) {

		this.x = v.x;
		this.y = v.y;
		this.z = v.z;

		return this;

	},

	add: function ( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'THREE.Vector3: .add() now only accepts one argument. Use .addVectors( a, b ) instead.' );
			return this.addVectors( v, w );

		}

		this.x += v.x;
		this.y += v.y;
		this.z += v.z;

		return this;

	},

	addScalar: function ( s ) {

		this.x += s;
		this.y += s;
		this.z += s;

		return this;

	},

	addVectors: function ( a, b ) {

		this.x = a.x + b.x;
		this.y = a.y + b.y;
		this.z = a.z + b.z;

		return this;

	},

	sub: function ( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'THREE.Vector3: .sub() now only accepts one argument. Use .subVectors( a, b ) instead.' );
			return this.subVectors( v, w );

		}

		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;

		return this;

	},

	subVectors: function ( a, b ) {

		this.x = a.x - b.x;
		this.y = a.y - b.y;
		this.z = a.z - b.z;

		return this;

	},

	multiply: function ( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'THREE.Vector3: .multiply() now only accepts one argument. Use .multiplyVectors( a, b ) instead.' );
			return this.multiplyVectors( v, w );

		}

		this.x *= v.x;
		this.y *= v.y;
		this.z *= v.z;

		return this;

	},

	multiplyScalar: function ( scalar ) {

		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;

		return this;

	},

	multiplyVectors: function ( a, b ) {

		this.x = a.x * b.x;
		this.y = a.y * b.y;
		this.z = a.z * b.z;

		return this;

	},

	applyEuler: function () {

		var quaternion;

		return function ( euler ) {

			if ( euler instanceof THREE.Euler === false ) {

				console.error( 'THREE.Vector3: .applyEuler() now expects a Euler rotation rather than a Vector3 and order.' );

			}

			if ( quaternion === undefined ) quaternion = new THREE.Quaternion();

			this.applyQuaternion( quaternion.setFromEuler( euler ) );

			return this;

		};

	}(),

	applyAxisAngle: function () {

		var quaternion;

		return function ( axis, angle ) {

			if ( quaternion === undefined ) quaternion = new THREE.Quaternion();

			this.applyQuaternion( quaternion.setFromAxisAngle( axis, angle ) );

			return this;

		};

	}(),

	applyMatrix3: function ( m ) {

		var x = this.x;
		var y = this.y;
		var z = this.z;

		var e = m.elements;

		this.x = e[ 0 ] * x + e[ 3 ] * y + e[ 6 ] * z;
		this.y = e[ 1 ] * x + e[ 4 ] * y + e[ 7 ] * z;
		this.z = e[ 2 ] * x + e[ 5 ] * y + e[ 8 ] * z;

		return this;

	},

	applyMatrix4: function ( m ) {

		// input: THREE.Matrix4 affine matrix

		var x = this.x, y = this.y, z = this.z;

		var e = m.elements;

		this.x = e[ 0 ] * x + e[ 4 ] * y + e[ 8 ]  * z + e[ 12 ];
		this.y = e[ 1 ] * x + e[ 5 ] * y + e[ 9 ]  * z + e[ 13 ];
		this.z = e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ];

		return this;

	},

	applyProjection: function ( m ) {

		// input: THREE.Matrix4 projection matrix

		var x = this.x, y = this.y, z = this.z;

		var e = m.elements;
		var d = 1 / ( e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ] ); // perspective divide

		this.x = ( e[ 0 ] * x + e[ 4 ] * y + e[ 8 ]  * z + e[ 12 ] ) * d;
		this.y = ( e[ 1 ] * x + e[ 5 ] * y + e[ 9 ]  * z + e[ 13 ] ) * d;
		this.z = ( e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ] ) * d;

		return this;

	},

	applyQuaternion: function ( q ) {

		var x = this.x;
		var y = this.y;
		var z = this.z;

		var qx = q.x;
		var qy = q.y;
		var qz = q.z;
		var qw = q.w;

		// calculate quat * vector

		var ix =  qw * x + qy * z - qz * y;
		var iy =  qw * y + qz * x - qx * z;
		var iz =  qw * z + qx * y - qy * x;
		var iw = - qx * x - qy * y - qz * z;

		// calculate result * inverse quat

		this.x = ix * qw + iw * - qx + iy * - qz - iz * - qy;
		this.y = iy * qw + iw * - qy + iz * - qx - ix * - qz;
		this.z = iz * qw + iw * - qz + ix * - qy - iy * - qx;

		return this;

	},

	project: function () {

		var matrix;

		return function ( camera ) {

			if ( matrix === undefined ) matrix = new THREE.Matrix4();

			matrix.multiplyMatrices( camera.projectionMatrix, matrix.getInverse( camera.matrixWorld ) );
			return this.applyProjection( matrix );

		};

	}(),

	unproject: function () {

		var matrix;

		return function ( camera ) {

			if ( matrix === undefined ) matrix = new THREE.Matrix4();

			matrix.multiplyMatrices( camera.matrixWorld, matrix.getInverse( camera.projectionMatrix ) );
			return this.applyProjection( matrix );

		};

	}(),

	transformDirection: function ( m ) {

		// input: THREE.Matrix4 affine matrix
		// vector interpreted as a direction

		var x = this.x, y = this.y, z = this.z;

		var e = m.elements;

		this.x = e[ 0 ] * x + e[ 4 ] * y + e[ 8 ]  * z;
		this.y = e[ 1 ] * x + e[ 5 ] * y + e[ 9 ]  * z;
		this.z = e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z;

		this.normalize();

		return this;

	},

	divide: function ( v ) {

		this.x /= v.x;
		this.y /= v.y;
		this.z /= v.z;

		return this;

	},

	divideScalar: function ( scalar ) {

		if ( scalar !== 0 ) {

			var invScalar = 1 / scalar;

			this.x *= invScalar;
			this.y *= invScalar;
			this.z *= invScalar;

		} else {

			this.x = 0;
			this.y = 0;
			this.z = 0;

		}

		return this;

	},

	min: function ( v ) {

		if ( this.x > v.x ) {

			this.x = v.x;

		}

		if ( this.y > v.y ) {

			this.y = v.y;

		}

		if ( this.z > v.z ) {

			this.z = v.z;

		}

		return this;

	},

	max: function ( v ) {

		if ( this.x < v.x ) {

			this.x = v.x;

		}

		if ( this.y < v.y ) {

			this.y = v.y;

		}

		if ( this.z < v.z ) {

			this.z = v.z;

		}

		return this;

	},

	clamp: function ( min, max ) {

		// This function assumes min < max, if this assumption isn't true it will not operate correctly

		if ( this.x < min.x ) {

			this.x = min.x;

		} else if ( this.x > max.x ) {

			this.x = max.x;

		}

		if ( this.y < min.y ) {

			this.y = min.y;

		} else if ( this.y > max.y ) {

			this.y = max.y;

		}

		if ( this.z < min.z ) {

			this.z = min.z;

		} else if ( this.z > max.z ) {

			this.z = max.z;

		}

		return this;

	},

	clampScalar: ( function () {

		var min, max;

		return function ( minVal, maxVal ) {

			if ( min === undefined ) {

				min = new THREE.Vector3();
				max = new THREE.Vector3();

			}

			min.set( minVal, minVal, minVal );
			max.set( maxVal, maxVal, maxVal );

			return this.clamp( min, max );

		};

	} )(),

	floor: function () {

		this.x = Math.floor( this.x );
		this.y = Math.floor( this.y );
		this.z = Math.floor( this.z );

		return this;

	},

	ceil: function () {

		this.x = Math.ceil( this.x );
		this.y = Math.ceil( this.y );
		this.z = Math.ceil( this.z );

		return this;

	},

	round: function () {

		this.x = Math.round( this.x );
		this.y = Math.round( this.y );
		this.z = Math.round( this.z );

		return this;

	},

	roundToZero: function () {

		this.x = ( this.x < 0 ) ? Math.ceil( this.x ) : Math.floor( this.x );
		this.y = ( this.y < 0 ) ? Math.ceil( this.y ) : Math.floor( this.y );
		this.z = ( this.z < 0 ) ? Math.ceil( this.z ) : Math.floor( this.z );

		return this;

	},

	negate: function () {

		this.x = - this.x;
		this.y = - this.y;
		this.z = - this.z;

		return this;

	},

	dot: function ( v ) {

		return this.x * v.x + this.y * v.y + this.z * v.z;

	},

	lengthSq: function () {

		return this.x * this.x + this.y * this.y + this.z * this.z;

	},

	length: function () {

		return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );

	},

	lengthManhattan: function () {

		return Math.abs( this.x ) + Math.abs( this.y ) + Math.abs( this.z );

	},

	normalize: function () {

		return this.divideScalar( this.length() );

	},

	setLength: function ( l ) {

		var oldLength = this.length();

		if ( oldLength !== 0 && l !== oldLength  ) {

			this.multiplyScalar( l / oldLength );
		}

		return this;

	},

	lerp: function ( v, alpha ) {

		this.x += ( v.x - this.x ) * alpha;
		this.y += ( v.y - this.y ) * alpha;
		this.z += ( v.z - this.z ) * alpha;

		return this;

	},

	cross: function ( v, w ) {

		if ( w !== undefined ) {

			console.warn( 'THREE.Vector3: .cross() now only accepts one argument. Use .crossVectors( a, b ) instead.' );
			return this.crossVectors( v, w );

		}

		var x = this.x, y = this.y, z = this.z;

		this.x = y * v.z - z * v.y;
		this.y = z * v.x - x * v.z;
		this.z = x * v.y - y * v.x;

		return this;

	},

	crossVectors: function ( a, b ) {

		var ax = a.x, ay = a.y, az = a.z;
		var bx = b.x, by = b.y, bz = b.z;

		this.x = ay * bz - az * by;
		this.y = az * bx - ax * bz;
		this.z = ax * by - ay * bx;

		return this;

	},

	projectOnVector: function () {

		var v1, dot;

		return function ( vector ) {

			if ( v1 === undefined ) v1 = new THREE.Vector3();

			v1.copy( vector ).normalize();

			dot = this.dot( v1 );

			return this.copy( v1 ).multiplyScalar( dot );

		};

	}(),

	projectOnPlane: function () {

		var v1;

		return function ( planeNormal ) {

			if ( v1 === undefined ) v1 = new THREE.Vector3();

			v1.copy( this ).projectOnVector( planeNormal );

			return this.sub( v1 );

		}

	}(),

	reflect: function () {

		// reflect incident vector off plane orthogonal to normal
		// normal is assumed to have unit length

		var v1;

		return function ( normal ) {

			if ( v1 === undefined ) v1 = new THREE.Vector3();

			return this.sub( v1.copy( normal ).multiplyScalar( 2 * this.dot( normal ) ) );

		}

	}(),

	angleTo: function ( v ) {

		var theta = this.dot( v ) / ( this.length() * v.length() );

		// clamp, to handle numerical problems

		return Math.acos( THREE.Math.clamp( theta, - 1, 1 ) );

	},

	distanceTo: function ( v ) {

		return Math.sqrt( this.distanceToSquared( v ) );

	},

	distanceToSquared: function ( v ) {

		var dx = this.x - v.x;
		var dy = this.y - v.y;
		var dz = this.z - v.z;

		return dx * dx + dy * dy + dz * dz;

	},

	setEulerFromRotationMatrix: function ( m, order ) {

		console.error( 'THREE.Vector3: .setEulerFromRotationMatrix() has been removed. Use Euler.setFromRotationMatrix() instead.' );

	},

	setEulerFromQuaternion: function ( q, order ) {

		console.error( 'THREE.Vector3: .setEulerFromQuaternion() has been removed. Use Euler.setFromQuaternion() instead.' );

	},

	getPositionFromMatrix: function ( m ) {

		console.warn( 'THREE.Vector3: .getPositionFromMatrix() has been renamed to .setFromMatrixPosition().' );

		return this.setFromMatrixPosition( m );

	},

	getScaleFromMatrix: function ( m ) {

		console.warn( 'THREE.Vector3: .getScaleFromMatrix() has been renamed to .setFromMatrixScale().' );

		return this.setFromMatrixScale( m );
	},

	getColumnFromMatrix: function ( index, matrix ) {

		console.warn( 'THREE.Vector3: .getColumnFromMatrix() has been renamed to .setFromMatrixColumn().' );

		return this.setFromMatrixColumn( index, matrix );

	},

	setFromMatrixPosition: function ( m ) {

		this.x = m.elements[ 12 ];
		this.y = m.elements[ 13 ];
		this.z = m.elements[ 14 ];

		return this;

	},

	setFromMatrixScale: function ( m ) {

		var sx = this.set( m.elements[ 0 ], m.elements[ 1 ], m.elements[  2 ] ).length();
		var sy = this.set( m.elements[ 4 ], m.elements[ 5 ], m.elements[  6 ] ).length();
		var sz = this.set( m.elements[ 8 ], m.elements[ 9 ], m.elements[ 10 ] ).length();

		this.x = sx;
		this.y = sy;
		this.z = sz;

		return this;
	},

	setFromMatrixColumn: function ( index, matrix ) {

		var offset = index * 4;

		var me = matrix.elements;

		this.x = me[ offset ];
		this.y = me[ offset + 1 ];
		this.z = me[ offset + 2 ];

		return this;

	},

	equals: function ( v ) {

		return ( ( v.x === this.x ) && ( v.y === this.y ) && ( v.z === this.z ) );

	},

	fromArray: function ( array, offset ) {

		if ( offset === undefined ) offset = 0;

		this.x = array[ offset ];
		this.y = array[ offset + 1 ];
		this.z = array[ offset + 2 ];

		return this;

	},

	toArray: function ( array, offset ) {

		if ( array === undefined ) array = [];
		if ( offset === undefined ) offset = 0;

		array[ offset ] = this.x;
		array[ offset + 1 ] = this.y;
		array[ offset + 2 ] = this.z;

		return array;

	},

	fromAttribute: function ( attribute, index, offset ) {

	    if ( offset === undefined ) offset = 0;

	    index = index * attribute.itemSize + offset;

	    this.x = attribute.array[ index ];
	    this.y = attribute.array[ index + 1 ];
	    this.z = attribute.array[ index + 2 ];

	    return this;

	},

	clone: function () {

		return new THREE.Vector3( this.x, this.y, this.z );

	}

};
/*** END Vector3 ***/
/*** START Euler ***/
/**
 * @author mrdoob / http://mrdoob.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author bhouston / http://exocortex.com
 */

THREE.Euler = function ( x, y, z, order ) {

	this._x = x || 0;
	this._y = y || 0;
	this._z = z || 0;
	this._order = order || THREE.Euler.DefaultOrder;

};

THREE.Euler.RotationOrders = [ 'XYZ', 'YZX', 'ZXY', 'XZY', 'YXZ', 'ZYX' ];

THREE.Euler.DefaultOrder = 'XYZ';

THREE.Euler.prototype = {

	constructor: THREE.Euler,

	_x: 0, _y: 0, _z: 0, _order: THREE.Euler.DefaultOrder,

	get x () {

		return this._x;

	},

	set x ( value ) {

		this._x = value;
		this.onChangeCallback();

	},

	get y () {

		return this._y;

	},

	set y ( value ) {

		this._y = value;
		this.onChangeCallback();

	},

	get z () {

		return this._z;

	},

	set z ( value ) {

		this._z = value;
		this.onChangeCallback();

	},

	get order () {

		return this._order;

	},

	set order ( value ) {

		this._order = value;
		this.onChangeCallback();

	},

	set: function ( x, y, z, order ) {

		this._x = x;
		this._y = y;
		this._z = z;
		this._order = order || this._order;

		this.onChangeCallback();

		return this;

	},

	copy: function ( euler ) {

		this._x = euler._x;
		this._y = euler._y;
		this._z = euler._z;
		this._order = euler._order;

		this.onChangeCallback();

		return this;

	},

	setFromRotationMatrix: function ( m, order, update ) {

		var clamp = THREE.Math.clamp;

		// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

		var te = m.elements;
		var m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ];
		var m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ];
		var m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ];

		order = order || this._order;

		if ( order === 'XYZ' ) {

			this._y = Math.asin( clamp( m13, - 1, 1 ) );

			if ( Math.abs( m13 ) < 0.99999 ) {

				this._x = Math.atan2( - m23, m33 );
				this._z = Math.atan2( - m12, m11 );

			} else {

				this._x = Math.atan2( m32, m22 );
				this._z = 0;

			}

		} else if ( order === 'YXZ' ) {

			this._x = Math.asin( - clamp( m23, - 1, 1 ) );

			if ( Math.abs( m23 ) < 0.99999 ) {

				this._y = Math.atan2( m13, m33 );
				this._z = Math.atan2( m21, m22 );

			} else {

				this._y = Math.atan2( - m31, m11 );
				this._z = 0;

			}

		} else if ( order === 'ZXY' ) {

			this._x = Math.asin( clamp( m32, - 1, 1 ) );

			if ( Math.abs( m32 ) < 0.99999 ) {

				this._y = Math.atan2( - m31, m33 );
				this._z = Math.atan2( - m12, m22 );

			} else {

				this._y = 0;
				this._z = Math.atan2( m21, m11 );

			}

		} else if ( order === 'ZYX' ) {

			this._y = Math.asin( - clamp( m31, - 1, 1 ) );

			if ( Math.abs( m31 ) < 0.99999 ) {

				this._x = Math.atan2( m32, m33 );
				this._z = Math.atan2( m21, m11 );

			} else {

				this._x = 0;
				this._z = Math.atan2( - m12, m22 );

			}

		} else if ( order === 'YZX' ) {

			this._z = Math.asin( clamp( m21, - 1, 1 ) );

			if ( Math.abs( m21 ) < 0.99999 ) {

				this._x = Math.atan2( - m23, m22 );
				this._y = Math.atan2( - m31, m11 );

			} else {

				this._x = 0;
				this._y = Math.atan2( m13, m33 );

			}

		} else if ( order === 'XZY' ) {

			this._z = Math.asin( - clamp( m12, - 1, 1 ) );

			if ( Math.abs( m12 ) < 0.99999 ) {

				this._x = Math.atan2( m32, m22 );
				this._y = Math.atan2( m13, m11 );

			} else {

				this._x = Math.atan2( - m23, m33 );
				this._y = 0;

			}

		} else {

			console.warn( 'THREE.Euler: .setFromRotationMatrix() given unsupported order: ' + order )

		}

		this._order = order;

		if ( update !== false ) this.onChangeCallback();

		return this;

	},

	setFromQuaternion: function () {

		var matrix;

		return function ( q, order, update ) {

			if ( matrix === undefined ) matrix = new THREE.Matrix4();
			matrix.makeRotationFromQuaternion( q );
			this.setFromRotationMatrix( matrix, order, update );

			return this;

		};

	}(),

	setFromVector3: function ( v, order ) {

		return this.set( v.x, v.y, v.z, order || this._order );

	},

	reorder: function () {

		// WARNING: this discards revolution information -bhouston

		var q = new THREE.Quaternion();

		return function ( newOrder ) {

			q.setFromEuler( this );
			this.setFromQuaternion( q, newOrder );

		};

	}(),

	equals: function ( euler ) {

		return ( euler._x === this._x ) && ( euler._y === this._y ) && ( euler._z === this._z ) && ( euler._order === this._order );

	},

	fromArray: function ( array ) {

		this._x = array[ 0 ];
		this._y = array[ 1 ];
		this._z = array[ 2 ];
		if ( array[ 3 ] !== undefined ) this._order = array[ 3 ];

		this.onChangeCallback();

		return this;

	},

	toArray: function () {

		return [ this._x, this._y, this._z, this._order ];

	},

	toVector3: function ( optionalResult ) {

		if ( optionalResult ) {

			return optionalResult.set( this._x, this._y, this._z );

		} else {

			return new THREE.Vector3( this._x, this._y, this._z );

		}

	},

	onChange: function ( callback ) {

		this.onChangeCallback = callback;

		return this;

	},

	onChangeCallback: function () {},

	clone: function () {

		return new THREE.Euler( this._x, this._y, this._z, this._order );

	}

};
/*** END Euler ***/
/*** START Math ***/
/**
 * @author alteredq / http://alteredqualia.com/
 * @author mrdoob / http://mrdoob.com/
 */

THREE.Math = {

	generateUUID: function () {

		// http://www.broofa.com/Tools/Math.uuid.htm

		var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split( '' );
		var uuid = new Array( 36 );
		var rnd = 0, r;

		return function () {

			for ( var i = 0; i < 36; i ++ ) {

				if ( i == 8 || i == 13 || i == 18 || i == 23 ) {

					uuid[ i ] = '-';

				} else if ( i == 14 ) {

					uuid[ i ] = '4';

				} else {

					if ( rnd <= 0x02 ) rnd = 0x2000000 + ( Math.random() * 0x1000000 ) | 0;
					r = rnd & 0xf;
					rnd = rnd >> 4;
					uuid[ i ] = chars[ ( i == 19 ) ? ( r & 0x3 ) | 0x8 : r ];

				}
			}

			return uuid.join( '' );

		};

	}(),

	// Clamp value to range <a, b>

	clamp: function ( x, a, b ) {

		return ( x < a ) ? a : ( ( x > b ) ? b : x );

	},

	// Clamp value to range <a, inf)

	clampBottom: function ( x, a ) {

		return x < a ? a : x;

	},

	// Linear mapping from range <a1, a2> to range <b1, b2>

	mapLinear: function ( x, a1, a2, b1, b2 ) {

		return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );

	},

	// http://en.wikipedia.org/wiki/Smoothstep

	smoothstep: function ( x, min, max ) {

		if ( x <= min ) return 0;
		if ( x >= max ) return 1;

		x = ( x - min ) / ( max - min );

		return x * x * ( 3 - 2 * x );

	},

	smootherstep: function ( x, min, max ) {

		if ( x <= min ) return 0;
		if ( x >= max ) return 1;

		x = ( x - min ) / ( max - min );

		return x * x * x * ( x * ( x * 6 - 15 ) + 10 );

	},

	// Random float from <0, 1> with 16 bits of randomness
	// (standard Math.random() creates repetitive patterns when applied over larger space)

	random16: function () {

		return ( 65280 * Math.random() + 255 * Math.random() ) / 65535;

	},

	// Random integer from <low, high> interval

	randInt: function ( low, high ) {

		return Math.floor( this.randFloat( low, high ) );

	},

	// Random float from <low, high> interval

	randFloat: function ( low, high ) {

		return low + Math.random() * ( high - low );

	},

	// Random float from <-range/2, range/2> interval

	randFloatSpread: function ( range ) {

		return range * ( 0.5 - Math.random() );

	},

	degToRad: function () {

		var degreeToRadiansFactor = Math.PI / 180;

		return function ( degrees ) {

			return degrees * degreeToRadiansFactor;

		};

	}(),

	radToDeg: function () {

		var radianToDegreesFactor = 180 / Math.PI;

		return function ( radians ) {

			return radians * radianToDegreesFactor;

		};

	}(),

	isPowerOfTwo: function ( value ) {

		return ( value & ( value - 1 ) ) === 0 && value !== 0;

	},

	nextPowerOfTwo: function ( value ) {

		value --;
		value |= value >> 1;
		value |= value >> 2;
		value |= value >> 4;
		value |= value >> 8;
		value |= value >> 16;
		value ++;

		return value;
	}

};

/*** END Math ***/

}

module.exports = THREE;

},{}],23:[function(require,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var MathUtil = require('./math-util.js');
var Util = require('./util.js');

var ROTATE_SPEED = 0.5;
/**
 * Provides a quaternion responsible for pre-panning the scene before further
 * transformations due to device sensors.
 */
function TouchPanner() {
  window.addEventListener('touchstart', this.onTouchStart_.bind(this));
  window.addEventListener('touchmove', this.onTouchMove_.bind(this));
  window.addEventListener('touchend', this.onTouchEnd_.bind(this));

  this.isTouching = false;
  this.rotateStart = new MathUtil.Vector2();
  this.rotateEnd = new MathUtil.Vector2();
  this.rotateDelta = new MathUtil.Vector2();

  this.theta = 0;
  this.orientation = new MathUtil.Quaternion();
}

TouchPanner.prototype.getOrientation = function() {
  this.orientation.setFromEulerXYZ(0, 0, this.theta);
  return this.orientation;
};

TouchPanner.prototype.resetSensor = function() {
  this.theta = 0;
};

TouchPanner.prototype.onTouchStart_ = function(e) {
  // Only respond if there is exactly one touch.
  if (e.touches.length != 1) {
    return;
  }
  this.rotateStart.set(e.touches[0].pageX, e.touches[0].pageY);
  this.isTouching = true;
};

TouchPanner.prototype.onTouchMove_ = function(e) {
  if (!this.isTouching) {
    return;
  }
  this.rotateEnd.set(e.touches[0].pageX, e.touches[0].pageY);
  this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart);
  this.rotateStart.copy(this.rotateEnd);

  // On iOS, direction is inverted.
  if (Util.isIOS()) {
    this.rotateDelta.x *= -1;
  }

  var element = document.body;
  this.theta += 2 * Math.PI * this.rotateDelta.x / element.clientWidth * ROTATE_SPEED;
};

TouchPanner.prototype.onTouchEnd_ = function(e) {
  this.isTouching = false;
};

module.exports = TouchPanner;

},{"./math-util.js":15,"./util.js":24}],24:[function(require,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var objectAssign = require('object-assign');

var Util = window.Util || {};

Util.MIN_TIMESTEP = 0.001;
Util.MAX_TIMESTEP = 1;

Util.base64 = function(mimeType, base64) {
  return 'data:' + mimeType + ';base64,' + base64;
};

Util.clamp = function(value, min, max) {
  return Math.min(Math.max(min, value), max);
};

Util.lerp = function(a, b, t) {
  return a + ((b - a) * t);
};

Util.isIOS = (function() {
  var isIOS = /iPad|iPhone|iPod/.test(navigator.platform);
  return function() {
    return isIOS;
  };
})();

Util.isSafari = (function() {
  var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  return function() {
    return isSafari;
  };
})();

Util.isFirefoxAndroid = (function() {
  var isFirefoxAndroid = navigator.userAgent.indexOf('Firefox') !== -1 &&
      navigator.userAgent.indexOf('Android') !== -1;
  return function() {
    return isFirefoxAndroid;
  };
})();

Util.isLandscapeMode = function() {
  return (window.orientation == 90 || window.orientation == -90);
};

// Helper method to validate the time steps of sensor timestamps.
Util.isTimestampDeltaValid = function(timestampDeltaS) {
  if (isNaN(timestampDeltaS)) {
    return false;
  }
  if (timestampDeltaS <= Util.MIN_TIMESTEP) {
    return false;
  }
  if (timestampDeltaS > Util.MAX_TIMESTEP) {
    return false;
  }
  return true;
};

Util.getScreenWidth = function() {
  return Math.max(window.screen.width, window.screen.height) *
      window.devicePixelRatio;
};

Util.getScreenHeight = function() {
  return Math.min(window.screen.width, window.screen.height) *
      window.devicePixelRatio;
};

Util.requestFullscreen = function(element) {
  if (element.requestFullscreen) {
    element.requestFullscreen();
  } else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
  } else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
  } else if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  } else {
    return false;
  }

  return true;
};

Util.exitFullscreen = function() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  } else {
    return false;
  }

  return true;
};

Util.getFullscreenElement = function() {
  return document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;
};

Util.linkProgram = function(gl, vertexSource, fragmentSource, attribLocationMap) {
  // No error checking for brevity.
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexSource);
  gl.compileShader(vertexShader);

  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentSource);
  gl.compileShader(fragmentShader);

  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  for (var attribName in attribLocationMap)
    gl.bindAttribLocation(program, attribLocationMap[attribName], attribName);

  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
};

Util.getProgramUniforms = function(gl, program) {
  var uniforms = {};
  var uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  var uniformName = '';
  for (var i = 0; i < uniformCount; i++) {
    var uniformInfo = gl.getActiveUniform(program, i);
    uniformName = uniformInfo.name.replace('[0]', '');
    uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
  }
  return uniforms;
};

Util.orthoMatrix = function (out, left, right, bottom, top, near, far) {
  var lr = 1 / (left - right),
      bt = 1 / (bottom - top),
      nf = 1 / (near - far);
  out[0] = -2 * lr;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = -2 * bt;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 2 * nf;
  out[11] = 0;
  out[12] = (left + right) * lr;
  out[13] = (top + bottom) * bt;
  out[14] = (far + near) * nf;
  out[15] = 1;
  return out;
};

Util.isMobile = function() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

Util.extend = objectAssign;

module.exports = Util;

},{"object-assign":2}],25:[function(require,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Emitter = require('./emitter.js');
var Util = require('./util.js');
var DeviceInfo = require('./device-info.js');

var DEFAULT_VIEWER = 'CardboardV1';
var VIEWER_KEY = 'WEBVR_CARDBOARD_VIEWER';
var CLASS_NAME = 'webvr-polyfill-viewer-selector';

/**
 * Creates a viewer selector with the options specified. Supports being shown
 * and hidden. Generates events when viewer parameters change. Also supports
 * saving the currently selected index in localStorage.
 */
function ViewerSelector() {
  // Try to load the selected key from local storage. If none exists, use the
  // default key.
  try {
    this.selectedKey = localStorage.getItem(VIEWER_KEY) || DEFAULT_VIEWER;
  } catch (error) {
    console.error('Failed to load viewer profile: %s', error);
  }
  this.dialog = this.createDialog_(DeviceInfo.Viewers);
  this.root = null;
}
ViewerSelector.prototype = new Emitter();

ViewerSelector.prototype.show = function(root) {
  this.root = root;

  root.appendChild(this.dialog);
  //console.log('ViewerSelector.show');

  // Ensure the currently selected item is checked.
  var selected = this.dialog.querySelector('#' + this.selectedKey);
  selected.checked = true;

  // Show the UI.
  this.dialog.style.display = 'block';
};

ViewerSelector.prototype.hide = function() {
  if (this.root && this.root.contains(this.dialog)) {
    this.root.removeChild(this.dialog);
  }
  //console.log('ViewerSelector.hide');
  this.dialog.style.display = 'none';
};

ViewerSelector.prototype.getCurrentViewer = function() {
  return DeviceInfo.Viewers[this.selectedKey];
};

ViewerSelector.prototype.getSelectedKey_ = function() {
  var input = this.dialog.querySelector('input[name=field]:checked');
  if (input) {
    return input.id;
  }
  return null;
};

ViewerSelector.prototype.onSave_ = function() {
  this.selectedKey = this.getSelectedKey_();
  if (!this.selectedKey || !DeviceInfo.Viewers[this.selectedKey]) {
    console.error('ViewerSelector.onSave_: this should never happen!');
    return;
  }

  this.emit('change', DeviceInfo.Viewers[this.selectedKey]);

  // Attempt to save the viewer profile, but fails in private mode.
  try {
    localStorage.setItem(VIEWER_KEY, this.selectedKey);
  } catch(error) {
    console.error('Failed to save viewer profile: %s', error);
  }
  this.hide();
};

/**
 * Creates the dialog.
 */
ViewerSelector.prototype.createDialog_ = function(options) {
  var container = document.createElement('div');
  container.classList.add(CLASS_NAME);
  container.style.display = 'none';
  // Create an overlay that dims the background, and which goes away when you
  // tap it.
  var overlay = document.createElement('div');
  var s = overlay.style;
  s.position = 'fixed';
  s.left = 0;
  s.top = 0;
  s.width = '100%';
  s.height = '100%';
  s.background = 'rgba(0, 0, 0, 0.3)';
  overlay.addEventListener('click', this.hide.bind(this));

  var width = 280;
  var dialog = document.createElement('div');
  var s = dialog.style;
  s.boxSizing = 'border-box';
  s.position = 'fixed';
  s.top = '24px';
  s.left = '50%';
  s.marginLeft = (-width/2) + 'px';
  s.width = width + 'px';
  s.padding = '24px';
  s.overflow = 'hidden';
  s.background = '#fafafa';
  s.fontFamily = "'Roboto', sans-serif";
  s.boxShadow = '0px 5px 20px #666';

  dialog.appendChild(this.createH1_('Select your viewer'));
  for (var id in options) {
    dialog.appendChild(this.createChoice_(id, options[id].label));
  }
  dialog.appendChild(this.createButton_('Save', this.onSave_.bind(this)));

  container.appendChild(overlay);
  container.appendChild(dialog);

  return container;
};

ViewerSelector.prototype.createH1_ = function(name) {
  var h1 = document.createElement('h1');
  var s = h1.style;
  s.color = 'black';
  s.fontSize = '20px';
  s.fontWeight = 'bold';
  s.marginTop = 0;
  s.marginBottom = '24px';
  h1.innerHTML = name;
  return h1;
};

ViewerSelector.prototype.createChoice_ = function(id, name) {
  /*
  <div class="choice">
  <input id="v1" type="radio" name="field" value="v1">
  <label for="v1">Cardboard V1</label>
  </div>
  */
  var div = document.createElement('div');
  div.style.marginTop = '8px';
  div.style.color = 'black';

  var input = document.createElement('input');
  input.style.fontSize = '30px';
  input.setAttribute('id', id);
  input.setAttribute('type', 'radio');
  input.setAttribute('value', id);
  input.setAttribute('name', 'field');

  var label = document.createElement('label');
  label.style.marginLeft = '4px';
  label.setAttribute('for', id);
  label.innerHTML = name;

  div.appendChild(input);
  div.appendChild(label);

  return div;
};

ViewerSelector.prototype.createButton_ = function(label, onclick) {
  var button = document.createElement('button');
  button.innerHTML = label;
  var s = button.style;
  s.float = 'right';
  s.textTransform = 'uppercase';
  s.color = '#1094f7';
  s.fontSize = '14px';
  s.letterSpacing = 0;
  s.border = 0;
  s.background = 'none';
  s.marginTop = '16px';

  button.addEventListener('click', onclick);

  return button;
};

module.exports = ViewerSelector;

},{"./device-info.js":8,"./emitter.js":13,"./util.js":24}],26:[function(require,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var Util = require('./util.js');

/**
 * Android and iOS compatible wakelock implementation.
 *
 * Refactored thanks to dkovalev@.
 */
function AndroidWakeLock() {
  var video = document.createElement('video');

  video.addEventListener('ended', function() {
    video.play();
  });

  this.request = function() {
    if (video.paused) {
      // Base64 version of videos_src/no-sleep-120s.mp4.
      video.src = Util.base64('video/mp4', 'AAAAGGZ0eXBpc29tAAAAAG1wNDFhdmMxAAAIA21vb3YAAABsbXZoZAAAAADSa9v60mvb+gABX5AAlw/gAAEAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAdkdHJhawAAAFx0a2hkAAAAAdJr2/rSa9v6AAAAAQAAAAAAlw/gAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAQAAAAAAQAAAAHAAAAAAAJGVkdHMAAAAcZWxzdAAAAAAAAAABAJcP4AAAAAAAAQAAAAAG3G1kaWEAAAAgbWRoZAAAAADSa9v60mvb+gAPQkAGjneAFccAAAAAAC1oZGxyAAAAAAAAAAB2aWRlAAAAAAAAAAAAAAAAVmlkZW9IYW5kbGVyAAAABodtaW5mAAAAFHZtaGQAAAABAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAAZHc3RibAAAAJdzdHNkAAAAAAAAAAEAAACHYXZjMQAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAMABwASAAAAEgAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABj//wAAADFhdmNDAWQAC//hABlnZAALrNlfllw4QAAAAwBAAAADAKPFCmWAAQAFaOvssiwAAAAYc3R0cwAAAAAAAAABAAAAbgAPQkAAAAAUc3RzcwAAAAAAAAABAAAAAQAAA4BjdHRzAAAAAAAAAG4AAAABAD0JAAAAAAEAehIAAAAAAQA9CQAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEATEtAAAAAAQAehIAAAAABAAAAAAAAAAEAD0JAAAAAAQBMS0AAAAABAB6EgAAAAAEAAAAAAAAAAQAPQkAAAAABAExLQAAAAAEAHoSAAAAAAQAAAAAAAAABAA9CQAAAAAEALcbAAAAAHHN0c2MAAAAAAAAAAQAAAAEAAABuAAAAAQAAAcxzdHN6AAAAAAAAAAAAAABuAAADCQAAABgAAAAOAAAADgAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABIAAAAOAAAADAAAAAwAAAASAAAADgAAAAwAAAAMAAAAEgAAAA4AAAAMAAAADAAAABMAAAAUc3RjbwAAAAAAAAABAAAIKwAAACt1ZHRhAAAAI6llbmMAFwAAdmxjIDIuMi4xIHN0cmVhbSBvdXRwdXQAAAAId2lkZQAACRRtZGF0AAACrgX//6vcRem95tlIt5Ys2CDZI+7veDI2NCAtIGNvcmUgMTQyIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNCAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDEzIG1lPWhleCBzdWJtZT03IHBzeT0xIHBzeV9yZD0xLjAwOjAuMDAgbWl4ZWRfcmVmPTEgbWVfcmFuZ2U9MTYgY2hyb21hX21lPTEgdHJlbGxpcz0xIDh4OGRjdD0xIGNxbT0wIGRlYWR6b25lPTIxLDExIGZhc3RfcHNraXA9MSBjaHJvbWFfcXBfb2Zmc2V0PS0yIHRocmVhZHM9MTIgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTEgc2NlbmVjdXQ9NDAgaW50cmFfcmVmcmVzaD0wIHJjX2xvb2thaGVhZD00MCByYz1hYnIgbWJ0cmVlPTEgYml0cmF0ZT0xMDAgcmF0ZXRvbD0xLjAgcWNvbXA9MC42MCBxcG1pbj0xMCBxcG1heD01MSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAAU2WIhAAQ/8ltlOe+cTZuGkKg+aRtuivcDZ0pBsfsEi9p/i1yU9DxS2lq4dXTinViF1URBKXgnzKBd/Uh1bkhHtMrwrRcOJslD01UB+fyaL6ef+DBAAAAFEGaJGxBD5B+v+a+4QqF3MgBXz9MAAAACkGeQniH/+94r6EAAAAKAZ5hdEN/8QytwAAAAAgBnmNqQ3/EgQAAAA5BmmhJqEFomUwIIf/+4QAAAApBnoZFESw//76BAAAACAGepXRDf8SBAAAACAGep2pDf8SAAAAADkGarEmoQWyZTAgh//7gAAAACkGeykUVLD//voEAAAAIAZ7pdEN/xIAAAAAIAZ7rakN/xIAAAAAOQZrwSahBbJlMCCH//uEAAAAKQZ8ORRUsP/++gQAAAAgBny10Q3/EgQAAAAgBny9qQ3/EgAAAAA5BmzRJqEFsmUwIIf/+4AAAAApBn1JFFSw//76BAAAACAGfcXRDf8SAAAAACAGfc2pDf8SAAAAADkGbeEmoQWyZTAgh//7hAAAACkGflkUVLD//voAAAAAIAZ+1dEN/xIEAAAAIAZ+3akN/xIEAAAAOQZu8SahBbJlMCCH//uAAAAAKQZ/aRRUsP/++gQAAAAgBn/l0Q3/EgAAAAAgBn/tqQ3/EgQAAAA5Bm+BJqEFsmUwIIf/+4QAAAApBnh5FFSw//76AAAAACAGePXRDf8SAAAAACAGeP2pDf8SBAAAADkGaJEmoQWyZTAgh//7gAAAACkGeQkUVLD//voEAAAAIAZ5hdEN/xIAAAAAIAZ5jakN/xIEAAAAOQZpoSahBbJlMCCH//uEAAAAKQZ6GRRUsP/++gQAAAAgBnqV0Q3/EgQAAAAgBnqdqQ3/EgAAAAA5BmqxJqEFsmUwIIf/+4AAAAApBnspFFSw//76BAAAACAGe6XRDf8SAAAAACAGe62pDf8SAAAAADkGa8EmoQWyZTAgh//7hAAAACkGfDkUVLD//voEAAAAIAZ8tdEN/xIEAAAAIAZ8vakN/xIAAAAAOQZs0SahBbJlMCCH//uAAAAAKQZ9SRRUsP/++gQAAAAgBn3F0Q3/EgAAAAAgBn3NqQ3/EgAAAAA5Bm3hJqEFsmUwIIf/+4QAAAApBn5ZFFSw//76AAAAACAGftXRDf8SBAAAACAGft2pDf8SBAAAADkGbvEmoQWyZTAgh//7gAAAACkGf2kUVLD//voEAAAAIAZ/5dEN/xIAAAAAIAZ/7akN/xIEAAAAOQZvgSahBbJlMCCH//uEAAAAKQZ4eRRUsP/++gAAAAAgBnj10Q3/EgAAAAAgBnj9qQ3/EgQAAAA5BmiRJqEFsmUwIIf/+4AAAAApBnkJFFSw//76BAAAACAGeYXRDf8SAAAAACAGeY2pDf8SBAAAADkGaaEmoQWyZTAgh//7hAAAACkGehkUVLD//voEAAAAIAZ6ldEN/xIEAAAAIAZ6nakN/xIAAAAAOQZqsSahBbJlMCCH//uAAAAAKQZ7KRRUsP/++gQAAAAgBnul0Q3/EgAAAAAgBnutqQ3/EgAAAAA5BmvBJqEFsmUwIIf/+4QAAAApBnw5FFSw//76BAAAACAGfLXRDf8SBAAAACAGfL2pDf8SAAAAADkGbNEmoQWyZTAgh//7gAAAACkGfUkUVLD//voEAAAAIAZ9xdEN/xIAAAAAIAZ9zakN/xIAAAAAOQZt4SahBbJlMCCH//uEAAAAKQZ+WRRUsP/++gAAAAAgBn7V0Q3/EgQAAAAgBn7dqQ3/EgQAAAA5Bm7xJqEFsmUwIIf/+4AAAAApBn9pFFSw//76BAAAACAGf+XRDf8SAAAAACAGf+2pDf8SBAAAADkGb4EmoQWyZTAgh//7hAAAACkGeHkUVLD//voAAAAAIAZ49dEN/xIAAAAAIAZ4/akN/xIEAAAAOQZokSahBbJlMCCH//uAAAAAKQZ5CRRUsP/++gQAAAAgBnmF0Q3/EgAAAAAgBnmNqQ3/EgQAAAA5BmmhJqEFsmUwIIf/+4QAAAApBnoZFFSw//76BAAAACAGepXRDf8SBAAAACAGep2pDf8SAAAAADkGarEmoQWyZTAgh//7gAAAACkGeykUVLD//voEAAAAIAZ7pdEN/xIAAAAAIAZ7rakN/xIAAAAAPQZruSahBbJlMFEw3//7B');
      video.play();
    }
  };

  this.release = function() {
    video.pause();
    video.src = '';
  };
}

function iOSWakeLock() {
  var timer = null;

  this.request = function() {
    if (!timer) {
      timer = setInterval(function() {
        window.location = window.location;
        setTimeout(window.stop, 0);
      }, 30000);
    }
  }

  this.release = function() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
}


function getWakeLock() {
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  if (userAgent.match(/iPhone/i) || userAgent.match(/iPod/i)) {
    return iOSWakeLock;
  } else {
    return AndroidWakeLock;
  }
}

module.exports = getWakeLock();
},{"./util.js":24}],27:[function(require,module,exports){
/*
 * Copyright 2015 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Polyfill ES6 Promises (mostly for IE 11).
require('es6-promise').polyfill();

var CardboardVRDisplay = require('./cardboard-vr-display.js');
var MouseKeyboardVRDisplay = require('./mouse-keyboard-vr-display.js');
// Uncomment to add positional tracking via webcam.
//var WebcamPositionSensorVRDevice = require('./webcam-position-sensor-vr-device.js');
var VRDisplay = require('./base.js').VRDisplay;
var HMDVRDevice = require('./base.js').HMDVRDevice;
var PositionSensorVRDevice = require('./base.js').PositionSensorVRDevice;
var VRDisplayHMDDevice = require('./display-wrappers.js').VRDisplayHMDDevice;
var VRDisplayPositionSensorDevice = require('./display-wrappers.js').VRDisplayPositionSensorDevice;

function WebVRPolyfill() {
  this.displays = [];
  this.devices = []; // For deprecated objects
  this.devicesPopulated = false;
  this.nativeWebVRAvailable = this.isWebVRAvailable();
  this.nativeLegacyWebVRAvailable = this.isDeprecatedWebVRAvailable();

  if (!this.nativeLegacyWebVRAvailable) {
    if (!this.nativeWebVRAvailable) {
      this.enablePolyfill();
    }
    if (WebVRConfig.ENABLE_DEPRECATED_API) {
      this.enableDeprecatedPolyfill();
    }
  }
}

WebVRPolyfill.prototype.isWebVRAvailable = function() {
  return ('getVRDisplays' in navigator);
};

WebVRPolyfill.prototype.isDeprecatedWebVRAvailable = function() {
  return ('getVRDevices' in navigator) || ('mozGetVRDevices' in navigator);
};

WebVRPolyfill.prototype.populateDevices = function() {
  if (this.devicesPopulated) {
    return;
  }

  // Initialize our virtual VR devices.
  var vrDisplay = null;

  // Add a Cardboard VRDisplay on compatible mobile devices
  if (this.isCardboardCompatible()) {
    vrDisplay = new CardboardVRDisplay();
    this.displays.push(vrDisplay);

    // For backwards compatibility
    if (WebVRConfig.ENABLE_DEPRECATED_API) {
      this.devices.push(new VRDisplayHMDDevice(vrDisplay));
      this.devices.push(new VRDisplayPositionSensorDevice(vrDisplay));
    }
  }

  // Add a Mouse and Keyboard driven VRDisplay for desktops/laptops
  if (!this.isMobile() && !WebVRConfig.MOUSE_KEYBOARD_CONTROLS_DISABLED) {
    vrDisplay = new MouseKeyboardVRDisplay();
    this.displays.push(vrDisplay);

    // For backwards compatibility
    if (WebVRConfig.ENABLE_DEPRECATED_API) {
      this.devices.push(new VRDisplayHMDDevice(vrDisplay));
      this.devices.push(new VRDisplayPositionSensorDevice(vrDisplay));
    }
  }

  // Uncomment to add positional tracking via webcam.
  //if (!this.isMobile() && WebVRConfig.ENABLE_DEPRECATED_API) {
  //  positionDevice = new WebcamPositionSensorVRDevice();
  //  this.devices.push(positionDevice);
  //}

  this.devicesPopulated = true;
};

WebVRPolyfill.prototype.enablePolyfill = function() {
  // Provide navigator.getVRDisplays.
  navigator.getVRDisplays = this.getVRDisplays.bind(this);

  // Provide the VRDisplay object.
  window.VRDisplay = VRDisplay;
};

WebVRPolyfill.prototype.enableDeprecatedPolyfill = function() {
  // Provide navigator.getVRDevices.
  navigator.getVRDevices = this.getVRDevices.bind(this);

  // Provide the CardboardHMDVRDevice and PositionSensorVRDevice objects.
  window.HMDVRDevice = HMDVRDevice;
  window.PositionSensorVRDevice = PositionSensorVRDevice;
};

WebVRPolyfill.prototype.getVRDisplays = function() {
  this.populateDevices();
  var displays = this.displays;
  return new Promise(function(resolve, reject) {
    try {
      resolve(displays);
    } catch (e) {
      reject(e);
    }
  });
};

WebVRPolyfill.prototype.getVRDevices = function() {
  console.warn('getVRDevices is deprecated. Please update your code to use getVRDisplays instead.');
  var self = this;
  return new Promise(function(resolve, reject) {
    try {
      if (!self.devicesPopulated) {
        if (self.nativeWebVRAvailable) {
          return navigator.getVRDisplays(function(displays) {
            for (var i = 0; i < displays.length; ++i) {
              self.devices.push(new VRDisplayHMDDevice(displays[i]));
              self.devices.push(new VRDisplayPositionSensorDevice(displays[i]));
            }
            self.devicesPopulated = true;
            resolve(self.devices);
          }, reject);
        }

        if (self.nativeLegacyWebVRAvailable) {
          return (navigator.getVRDDevices || navigator.mozGetVRDevices)(function(devices) {
            for (var i = 0; i < devices.length; ++i) {
              if (devices[i] instanceof HMDVRDevice) {
                self.devices.push(devices[i]);
              }
              if (devices[i] instanceof PositionSensorVRDevice) {
                self.devices.push(devices[i]);
              }
            }
            self.devicesPopulated = true;
            resolve(self.devices);
          }, reject);
        }
      }

      self.populateDevices();
      resolve(self.devices);
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Determine if a device is mobile.
 */
WebVRPolyfill.prototype.isMobile = function() {
  return /Android/i.test(navigator.userAgent) ||
      /iPhone|iPad|iPod/i.test(navigator.userAgent);
};

WebVRPolyfill.prototype.isCardboardCompatible = function() {
  // For now, support all iOS and Android devices.
  // Also enable the WebVRConfig.FORCE_VR flag for debugging.
  return this.isMobile() || WebVRConfig.FORCE_ENABLE_VR;
};

module.exports = WebVRPolyfill;

},{"./base.js":3,"./cardboard-vr-display.js":6,"./display-wrappers.js":9,"./mouse-keyboard-vr-display.js":16,"es6-promise":1}],28:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[14])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL2hvbWVicmV3L2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIm5vZGVfbW9kdWxlcy9lczYtcHJvbWlzZS9kaXN0L2VzNi1wcm9taXNlLmpzIiwibm9kZV9tb2R1bGVzL29iamVjdC1hc3NpZ24vaW5kZXguanMiLCJzcmMvYmFzZS5qcyIsInNyYy9jYXJkYm9hcmQtZGlzdG9ydGVyLmpzIiwic3JjL2NhcmRib2FyZC11aS5qcyIsInNyYy9jYXJkYm9hcmQtdnItZGlzcGxheS5qcyIsInNyYy9kZXBzL3dnbHUtcHJlc2VydmUtc3RhdGUuanMiLCJzcmMvZGV2aWNlLWluZm8uanMiLCJzcmMvZGlzcGxheS13cmFwcGVycy5qcyIsInNyYy9kaXN0b3J0aW9uL2Rpc3RvcnRpb24uanMiLCJzcmMvZHBkYi9kcGRiLWNhY2hlLmpzIiwic3JjL2RwZGIvZHBkYi5qcyIsInNyYy9lbWl0dGVyLmpzIiwic3JjL21haW4uanMiLCJzcmMvbWF0aC11dGlsLmpzIiwic3JjL21vdXNlLWtleWJvYXJkLXZyLWRpc3BsYXkuanMiLCJzcmMvcm90YXRlLWluc3RydWN0aW9ucy5qcyIsInNyYy9zZW5zb3ItZnVzaW9uL2NvbXBsZW1lbnRhcnktZmlsdGVyLmpzIiwic3JjL3NlbnNvci1mdXNpb24vZnVzaW9uLXBvc2Utc2Vuc29yLmpzIiwic3JjL3NlbnNvci1mdXNpb24vcG9zZS1wcmVkaWN0b3IuanMiLCJzcmMvc2Vuc29yLWZ1c2lvbi9zZW5zb3Itc2FtcGxlLmpzIiwic3JjL3RocmVlLW1hdGguanMiLCJzcmMvdG91Y2gtcGFubmVyLmpzIiwic3JjL3V0aWwuanMiLCJzcmMvdmlld2VyLXNlbGVjdG9yLmpzIiwic3JjL3dha2Vsb2NrLmpzIiwic3JjL3dlYnZyLXBvbHlmaWxsLmpzIiwiLi4vLi4vaG9tZWJyZXcvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMTdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9YQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6OEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3J2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdk1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiFcbiAqIEBvdmVydmlldyBlczYtcHJvbWlzZSAtIGEgdGlueSBpbXBsZW1lbnRhdGlvbiBvZiBQcm9taXNlcy9BKy5cbiAqIEBjb3B5cmlnaHQgQ29weXJpZ2h0IChjKSAyMDE0IFllaHVkYSBLYXR6LCBUb20gRGFsZSwgU3RlZmFuIFBlbm5lciBhbmQgY29udHJpYnV0b3JzIChDb252ZXJzaW9uIHRvIEVTNiBBUEkgYnkgSmFrZSBBcmNoaWJhbGQpXG4gKiBAbGljZW5zZSAgIExpY2Vuc2VkIHVuZGVyIE1JVCBsaWNlbnNlXG4gKiAgICAgICAgICAgIFNlZSBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vamFrZWFyY2hpYmFsZC9lczYtcHJvbWlzZS9tYXN0ZXIvTElDRU5TRVxuICogQHZlcnNpb24gICAzLjEuMlxuICovXG5cbihmdW5jdGlvbigpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkdXRpbHMkJG9iamVjdE9yRnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuIHR5cGVvZiB4ID09PSAnZnVuY3Rpb24nIHx8ICh0eXBlb2YgeCA9PT0gJ29iamVjdCcgJiYgeCAhPT0gbnVsbCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0Z1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ2Z1bmN0aW9uJztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzTWF5YmVUaGVuYWJsZSh4KSB7XG4gICAgICByZXR1cm4gdHlwZW9mIHggPT09ICdvYmplY3QnICYmIHggIT09IG51bGw7XG4gICAgfVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkX2lzQXJyYXk7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkdXRpbHMkJF9pc0FycmF5ID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh4KSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSR1dGlscyQkX2lzQXJyYXkgPSBBcnJheS5pc0FycmF5O1xuICAgIH1cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzQXJyYXkgPSBsaWIkZXM2JHByb21pc2UkdXRpbHMkJF9pc0FycmF5O1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuID0gMDtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJHZlcnR4TmV4dDtcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJGN1c3RvbVNjaGVkdWxlckZuO1xuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwID0gZnVuY3Rpb24gYXNhcChjYWxsYmFjaywgYXJnKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbl0gPSBjYWxsYmFjaztcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRxdWV1ZVtsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuICsgMV0gPSBhcmc7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuICs9IDI7XG4gICAgICBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbiA9PT0gMikge1xuICAgICAgICAvLyBJZiBsZW4gaXMgMiwgdGhhdCBtZWFucyB0aGF0IHdlIG5lZWQgdG8gc2NoZWR1bGUgYW4gYXN5bmMgZmx1c2guXG4gICAgICAgIC8vIElmIGFkZGl0aW9uYWwgY2FsbGJhY2tzIGFyZSBxdWV1ZWQgYmVmb3JlIHRoZSBxdWV1ZSBpcyBmbHVzaGVkLCB0aGV5XG4gICAgICAgIC8vIHdpbGwgYmUgcHJvY2Vzc2VkIGJ5IHRoaXMgZmx1c2ggdGhhdCB3ZSBhcmUgc2NoZWR1bGluZy5cbiAgICAgICAgaWYgKGxpYiRlczYkcHJvbWlzZSRhc2FwJCRjdXN0b21TY2hlZHVsZXJGbikge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRjdXN0b21TY2hlZHVsZXJGbihsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2gpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzY2hlZHVsZUZsdXNoKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2V0U2NoZWR1bGVyKHNjaGVkdWxlRm4pIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRjdXN0b21TY2hlZHVsZXJGbiA9IHNjaGVkdWxlRm47XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJHNldEFzYXAoYXNhcEZuKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcCA9IGFzYXBGbjtcbiAgICB9XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJGJyb3dzZXJXaW5kb3cgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpID8gd2luZG93IDogdW5kZWZpbmVkO1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkYnJvd3Nlckdsb2JhbCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRicm93c2VyV2luZG93IHx8IHt9O1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkYnJvd3Nlckdsb2JhbC5NdXRhdGlvbk9ic2VydmVyIHx8IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRicm93c2VyR2xvYmFsLldlYktpdE11dGF0aW9uT2JzZXJ2ZXI7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRpc05vZGUgPSB0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYge30udG9TdHJpbmcuY2FsbChwcm9jZXNzKSA9PT0gJ1tvYmplY3QgcHJvY2Vzc10nO1xuXG4gICAgLy8gdGVzdCBmb3Igd2ViIHdvcmtlciBidXQgbm90IGluIElFMTBcbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJGFzYXAkJGlzV29ya2VyID0gdHlwZW9mIFVpbnQ4Q2xhbXBlZEFycmF5ICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgdHlwZW9mIGltcG9ydFNjcmlwdHMgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICB0eXBlb2YgTWVzc2FnZUNoYW5uZWwgIT09ICd1bmRlZmluZWQnO1xuXG4gICAgLy8gbm9kZVxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VOZXh0VGljaygpIHtcbiAgICAgIC8vIG5vZGUgdmVyc2lvbiAwLjEwLnggZGlzcGxheXMgYSBkZXByZWNhdGlvbiB3YXJuaW5nIHdoZW4gbmV4dFRpY2sgaXMgdXNlZCByZWN1cnNpdmVseVxuICAgICAgLy8gc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9jdWpvanMvd2hlbi9pc3N1ZXMvNDEwIGZvciBkZXRhaWxzXG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgIHByb2Nlc3MubmV4dFRpY2sobGliJGVzNiRwcm9taXNlJGFzYXAkJGZsdXNoKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gdmVydHhcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlVmVydHhUaW1lcigpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHZlcnR4TmV4dChsaWIkZXM2JHByb21pc2UkYXNhcCQkZmx1c2gpO1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlTXV0YXRpb25PYnNlcnZlcigpIHtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHZhciBvYnNlcnZlciA9IG5ldyBsaWIkZXM2JHByb21pc2UkYXNhcCQkQnJvd3Nlck11dGF0aW9uT2JzZXJ2ZXIobGliJGVzNiRwcm9taXNlJGFzYXAkJGZsdXNoKTtcbiAgICAgIHZhciBub2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJycpO1xuICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShub2RlLCB7IGNoYXJhY3RlckRhdGE6IHRydWUgfSk7XG5cbiAgICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgICAgbm9kZS5kYXRhID0gKGl0ZXJhdGlvbnMgPSArK2l0ZXJhdGlvbnMgJSAyKTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gd2ViIHdvcmtlclxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VNZXNzYWdlQ2hhbm5lbCgpIHtcbiAgICAgIHZhciBjaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gICAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaDtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNoYW5uZWwucG9ydDIucG9zdE1lc3NhZ2UoMCk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VTZXRUaW1lb3V0KCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICBzZXRUaW1lb3V0KGxpYiRlczYkcHJvbWlzZSRhc2FwJCRmbHVzaCwgMSk7XG4gICAgICB9O1xuICAgIH1cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWUgPSBuZXcgQXJyYXkoMTAwMCk7XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJGZsdXNoKCkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaWIkZXM2JHByb21pc2UkYXNhcCQkbGVuOyBpKz0yKSB7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRxdWV1ZVtpXTtcbiAgICAgICAgdmFyIGFyZyA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRxdWV1ZVtpKzFdO1xuXG4gICAgICAgIGNhbGxiYWNrKGFyZyk7XG5cbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHF1ZXVlW2ldID0gdW5kZWZpbmVkO1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkcXVldWVbaSsxXSA9IHVuZGVmaW5lZDtcbiAgICAgIH1cblxuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJGxlbiA9IDA7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJGFzYXAkJGF0dGVtcHRWZXJ0eCgpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHZhciByID0gcmVxdWlyZTtcbiAgICAgICAgdmFyIHZlcnR4ID0gcigndmVydHgnKTtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHZlcnR4TmV4dCA9IHZlcnR4LnJ1bk9uTG9vcCB8fCB2ZXJ0eC5ydW5PbkNvbnRleHQ7XG4gICAgICAgIHJldHVybiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlVmVydHhUaW1lcigpO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIHJldHVybiBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlU2V0VGltZW91dCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaDtcbiAgICAvLyBEZWNpZGUgd2hhdCBhc3luYyBtZXRob2QgdG8gdXNlIHRvIHRyaWdnZXJpbmcgcHJvY2Vzc2luZyBvZiBxdWV1ZWQgY2FsbGJhY2tzOlxuICAgIGlmIChsaWIkZXM2JHByb21pc2UkYXNhcCQkaXNOb2RlKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VOZXh0VGljaygpO1xuICAgIH0gZWxzZSBpZiAobGliJGVzNiRwcm9taXNlJGFzYXAkJEJyb3dzZXJNdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCR1c2VNdXRhdGlvbk9ic2VydmVyKCk7XG4gICAgfSBlbHNlIGlmIChsaWIkZXM2JHByb21pc2UkYXNhcCQkaXNXb3JrZXIpIHtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzY2hlZHVsZUZsdXNoID0gbGliJGVzNiRwcm9taXNlJGFzYXAkJHVzZU1lc3NhZ2VDaGFubmVsKCk7XG4gICAgfSBlbHNlIGlmIChsaWIkZXM2JHByb21pc2UkYXNhcCQkYnJvd3NlcldpbmRvdyA9PT0gdW5kZWZpbmVkICYmIHR5cGVvZiByZXF1aXJlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2NoZWR1bGVGbHVzaCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhdHRlbXB0VmVydHgoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGliJGVzNiRwcm9taXNlJGFzYXAkJHNjaGVkdWxlRmx1c2ggPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkdXNlU2V0VGltZW91dCgpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkdGhlbiQkdGhlbihvbkZ1bGZpbGxtZW50LCBvblJlamVjdGlvbikge1xuICAgICAgdmFyIHBhcmVudCA9IHRoaXM7XG4gICAgICB2YXIgc3RhdGUgPSBwYXJlbnQuX3N0YXRlO1xuXG4gICAgICBpZiAoc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRCAmJiAhb25GdWxmaWxsbWVudCB8fCBzdGF0ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQgJiYgIW9uUmVqZWN0aW9uKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICB2YXIgY2hpbGQgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcbiAgICAgIHZhciByZXN1bHQgPSBwYXJlbnQuX3Jlc3VsdDtcblxuICAgICAgaWYgKHN0YXRlKSB7XG4gICAgICAgIHZhciBjYWxsYmFjayA9IGFyZ3VtZW50c1tzdGF0ZSAtIDFdO1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcChmdW5jdGlvbigpe1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGludm9rZUNhbGxiYWNrKHN0YXRlLCBjaGlsZCwgY2FsbGJhY2ssIHJlc3VsdCk7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkc3Vic2NyaWJlKHBhcmVudCwgY2hpbGQsIG9uRnVsZmlsbG1lbnQsIG9uUmVqZWN0aW9uKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNoaWxkO1xuICAgIH1cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHRoZW4kJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkdGhlbiQkdGhlbjtcbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZXNvbHZlJCRyZXNvbHZlKG9iamVjdCkge1xuICAgICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICAgIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG5cbiAgICAgIGlmIChvYmplY3QgJiYgdHlwZW9mIG9iamVjdCA9PT0gJ29iamVjdCcgJiYgb2JqZWN0LmNvbnN0cnVjdG9yID09PSBDb25zdHJ1Y3Rvcikge1xuICAgICAgICByZXR1cm4gb2JqZWN0O1xuICAgICAgfVxuXG4gICAgICB2YXIgcHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgb2JqZWN0KTtcbiAgICAgIHJldHVybiBwcm9taXNlO1xuICAgIH1cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVzb2x2ZSQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlc29sdmUkJHJlc29sdmU7XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKCkge31cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HICAgPSB2b2lkIDA7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRCA9IDE7XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEICA9IDI7XG5cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkR0VUX1RIRU5fRVJST1IgPSBuZXcgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkRXJyb3JPYmplY3QoKTtcblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHNlbGZGdWxmaWxsbWVudCgpIHtcbiAgICAgIHJldHVybiBuZXcgVHlwZUVycm9yKFwiWW91IGNhbm5vdCByZXNvbHZlIGEgcHJvbWlzZSB3aXRoIGl0c2VsZlwiKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRjYW5ub3RSZXR1cm5Pd24oKSB7XG4gICAgICByZXR1cm4gbmV3IFR5cGVFcnJvcignQSBwcm9taXNlcyBjYWxsYmFjayBjYW5ub3QgcmV0dXJuIHRoYXQgc2FtZSBwcm9taXNlLicpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGdldFRoZW4ocHJvbWlzZSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHByb21pc2UudGhlbjtcbiAgICAgIH0gY2F0Y2goZXJyb3IpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkR0VUX1RIRU5fRVJST1IuZXJyb3IgPSBlcnJvcjtcbiAgICAgICAgcmV0dXJuIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEdFVF9USEVOX0VSUk9SO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHRyeVRoZW4odGhlbiwgdmFsdWUsIGZ1bGZpbGxtZW50SGFuZGxlciwgcmVqZWN0aW9uSGFuZGxlcikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhlbi5jYWxsKHZhbHVlLCBmdWxmaWxsbWVudEhhbmRsZXIsIHJlamVjdGlvbkhhbmRsZXIpO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIHJldHVybiBlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZUZvcmVpZ25UaGVuYWJsZShwcm9taXNlLCB0aGVuYWJsZSwgdGhlbikge1xuICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwKGZ1bmN0aW9uKHByb21pc2UpIHtcbiAgICAgICAgdmFyIHNlYWxlZCA9IGZhbHNlO1xuICAgICAgICB2YXIgZXJyb3IgPSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCR0cnlUaGVuKHRoZW4sIHRoZW5hYmxlLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIGlmIChzZWFsZWQpIHsgcmV0dXJuOyB9XG4gICAgICAgICAgc2VhbGVkID0gdHJ1ZTtcbiAgICAgICAgICBpZiAodGhlbmFibGUgIT09IHZhbHVlKSB7XG4gICAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCBmdW5jdGlvbihyZWFzb24pIHtcbiAgICAgICAgICBpZiAoc2VhbGVkKSB7IHJldHVybjsgfVxuICAgICAgICAgIHNlYWxlZCA9IHRydWU7XG5cbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICAgICAgfSwgJ1NldHRsZTogJyArIChwcm9taXNlLl9sYWJlbCB8fCAnIHVua25vd24gcHJvbWlzZScpKTtcblxuICAgICAgICBpZiAoIXNlYWxlZCAmJiBlcnJvcikge1xuICAgICAgICAgIHNlYWxlZCA9IHRydWU7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfSwgcHJvbWlzZSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlT3duVGhlbmFibGUocHJvbWlzZSwgdGhlbmFibGUpIHtcbiAgICAgIGlmICh0aGVuYWJsZS5fc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIHRoZW5hYmxlLl9yZXN1bHQpO1xuICAgICAgfSBlbHNlIGlmICh0aGVuYWJsZS5fc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCB0aGVuYWJsZS5fcmVzdWx0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHN1YnNjcmliZSh0aGVuYWJsZSwgdW5kZWZpbmVkLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgICB9LCBmdW5jdGlvbihyZWFzb24pIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgcmVhc29uKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlTWF5YmVUaGVuYWJsZShwcm9taXNlLCBtYXliZVRoZW5hYmxlLCB0aGVuKSB7XG4gICAgICBpZiAobWF5YmVUaGVuYWJsZS5jb25zdHJ1Y3RvciA9PT0gcHJvbWlzZS5jb25zdHJ1Y3RvciAmJlxuICAgICAgICAgIHRoZW4gPT09IGxpYiRlczYkcHJvbWlzZSR0aGVuJCRkZWZhdWx0ICYmXG4gICAgICAgICAgY29uc3RydWN0b3IucmVzb2x2ZSA9PT0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVzb2x2ZSQkZGVmYXVsdCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRoYW5kbGVPd25UaGVuYWJsZShwcm9taXNlLCBtYXliZVRoZW5hYmxlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGVuID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRHRVRfVEhFTl9FUlJPUikge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRHRVRfVEhFTl9FUlJPUi5lcnJvcik7XG4gICAgICAgIH0gZWxzZSBpZiAodGhlbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCBtYXliZVRoZW5hYmxlKTtcbiAgICAgICAgfSBlbHNlIGlmIChsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzRnVuY3Rpb24odGhlbikpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRoYW5kbGVGb3JlaWduVGhlbmFibGUocHJvbWlzZSwgbWF5YmVUaGVuYWJsZSwgdGhlbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCBtYXliZVRoZW5hYmxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgdmFsdWUpIHtcbiAgICAgIGlmIChwcm9taXNlID09PSB2YWx1ZSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkc2VsZkZ1bGZpbGxtZW50KCkpO1xuICAgICAgfSBlbHNlIGlmIChsaWIkZXM2JHByb21pc2UkdXRpbHMkJG9iamVjdE9yRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGhhbmRsZU1heWJlVGhlbmFibGUocHJvbWlzZSwgdmFsdWUsIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGdldFRoZW4odmFsdWUpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2hSZWplY3Rpb24ocHJvbWlzZSkge1xuICAgICAgaWYgKHByb21pc2UuX29uZXJyb3IpIHtcbiAgICAgICAgcHJvbWlzZS5fb25lcnJvcihwcm9taXNlLl9yZXN1bHQpO1xuICAgICAgfVxuXG4gICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRwdWJsaXNoKHByb21pc2UpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwocHJvbWlzZSwgdmFsdWUpIHtcbiAgICAgIGlmIChwcm9taXNlLl9zdGF0ZSAhPT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORykgeyByZXR1cm47IH1cblxuICAgICAgcHJvbWlzZS5fcmVzdWx0ID0gdmFsdWU7XG4gICAgICBwcm9taXNlLl9zdGF0ZSA9IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRDtcblxuICAgICAgaWYgKHByb21pc2UuX3N1YnNjcmliZXJzLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcChsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRwdWJsaXNoLCBwcm9taXNlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgcmVhc29uKSB7XG4gICAgICBpZiAocHJvbWlzZS5fc3RhdGUgIT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcpIHsgcmV0dXJuOyB9XG4gICAgICBwcm9taXNlLl9zdGF0ZSA9IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEO1xuICAgICAgcHJvbWlzZS5fcmVzdWx0ID0gcmVhc29uO1xuXG4gICAgICBsaWIkZXM2JHByb21pc2UkYXNhcCQkYXNhcChsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRwdWJsaXNoUmVqZWN0aW9uLCBwcm9taXNlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRzdWJzY3JpYmUocGFyZW50LCBjaGlsZCwgb25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pIHtcbiAgICAgIHZhciBzdWJzY3JpYmVycyA9IHBhcmVudC5fc3Vic2NyaWJlcnM7XG4gICAgICB2YXIgbGVuZ3RoID0gc3Vic2NyaWJlcnMubGVuZ3RoO1xuXG4gICAgICBwYXJlbnQuX29uZXJyb3IgPSBudWxsO1xuXG4gICAgICBzdWJzY3JpYmVyc1tsZW5ndGhdID0gY2hpbGQ7XG4gICAgICBzdWJzY3JpYmVyc1tsZW5ndGggKyBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRGVUxGSUxMRURdID0gb25GdWxmaWxsbWVudDtcbiAgICAgIHN1YnNjcmliZXJzW2xlbmd0aCArIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFJFSkVDVEVEXSAgPSBvblJlamVjdGlvbjtcblxuICAgICAgaWYgKGxlbmd0aCA9PT0gMCAmJiBwYXJlbnQuX3N0YXRlKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHB1Ymxpc2gsIHBhcmVudCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcHVibGlzaChwcm9taXNlKSB7XG4gICAgICB2YXIgc3Vic2NyaWJlcnMgPSBwcm9taXNlLl9zdWJzY3JpYmVycztcbiAgICAgIHZhciBzZXR0bGVkID0gcHJvbWlzZS5fc3RhdGU7XG5cbiAgICAgIGlmIChzdWJzY3JpYmVycy5sZW5ndGggPT09IDApIHsgcmV0dXJuOyB9XG5cbiAgICAgIHZhciBjaGlsZCwgY2FsbGJhY2ssIGRldGFpbCA9IHByb21pc2UuX3Jlc3VsdDtcblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdWJzY3JpYmVycy5sZW5ndGg7IGkgKz0gMykge1xuICAgICAgICBjaGlsZCA9IHN1YnNjcmliZXJzW2ldO1xuICAgICAgICBjYWxsYmFjayA9IHN1YnNjcmliZXJzW2kgKyBzZXR0bGVkXTtcblxuICAgICAgICBpZiAoY2hpbGQpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpbnZva2VDYWxsYmFjayhzZXR0bGVkLCBjaGlsZCwgY2FsbGJhY2ssIGRldGFpbCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2FsbGJhY2soZGV0YWlsKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBwcm9taXNlLl9zdWJzY3JpYmVycy5sZW5ndGggPSAwO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEVycm9yT2JqZWN0KCkge1xuICAgICAgdGhpcy5lcnJvciA9IG51bGw7XG4gICAgfVxuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFRSWV9DQVRDSF9FUlJPUiA9IG5ldyBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRFcnJvck9iamVjdCgpO1xuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkdHJ5Q2F0Y2goY2FsbGJhY2ssIGRldGFpbCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGRldGFpbCk7XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkVFJZX0NBVENIX0VSUk9SLmVycm9yID0gZTtcbiAgICAgICAgcmV0dXJuIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFRSWV9DQVRDSF9FUlJPUjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpbnZva2VDYWxsYmFjayhzZXR0bGVkLCBwcm9taXNlLCBjYWxsYmFjaywgZGV0YWlsKSB7XG4gICAgICB2YXIgaGFzQ2FsbGJhY2sgPSBsaWIkZXM2JHByb21pc2UkdXRpbHMkJGlzRnVuY3Rpb24oY2FsbGJhY2spLFxuICAgICAgICAgIHZhbHVlLCBlcnJvciwgc3VjY2VlZGVkLCBmYWlsZWQ7XG5cbiAgICAgIGlmIChoYXNDYWxsYmFjaykge1xuICAgICAgICB2YWx1ZSA9IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHRyeUNhdGNoKGNhbGxiYWNrLCBkZXRhaWwpO1xuXG4gICAgICAgIGlmICh2YWx1ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkVFJZX0NBVENIX0VSUk9SKSB7XG4gICAgICAgICAgZmFpbGVkID0gdHJ1ZTtcbiAgICAgICAgICBlcnJvciA9IHZhbHVlLmVycm9yO1xuICAgICAgICAgIHZhbHVlID0gbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdWNjZWVkZWQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByb21pc2UgPT09IHZhbHVlKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGNhbm5vdFJldHVybk93bigpKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFsdWUgPSBkZXRhaWw7XG4gICAgICAgIHN1Y2NlZWRlZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChwcm9taXNlLl9zdGF0ZSAhPT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORykge1xuICAgICAgICAvLyBub29wXG4gICAgICB9IGVsc2UgaWYgKGhhc0NhbGxiYWNrICYmIHN1Y2NlZWRlZCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZXNvbHZlKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAoZmFpbGVkKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBlcnJvcik7XG4gICAgICB9IGVsc2UgaWYgKHNldHRsZWQgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRCkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRmdWxmaWxsKHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH0gZWxzZSBpZiAoc2V0dGxlZCA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQpIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRpbml0aWFsaXplUHJvbWlzZShwcm9taXNlLCByZXNvbHZlcikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzb2x2ZXIoZnVuY3Rpb24gcmVzb2x2ZVByb21pc2UodmFsdWUpe1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgICB9LCBmdW5jdGlvbiByZWplY3RQcm9taXNlKHJlYXNvbikge1xuICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkYWxsJCRhbGwoZW50cmllcykge1xuICAgICAgcmV0dXJuIG5ldyBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkZGVmYXVsdCh0aGlzLCBlbnRyaWVzKS5wcm9taXNlO1xuICAgIH1cbiAgICB2YXIgbGliJGVzNiRwcm9taXNlJHByb21pc2UkYWxsJCRkZWZhdWx0ID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkYWxsJCRhbGw7XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmFjZSQkcmFjZShlbnRyaWVzKSB7XG4gICAgICAvKmpzaGludCB2YWxpZHRoaXM6dHJ1ZSAqL1xuICAgICAgdmFyIENvbnN0cnVjdG9yID0gdGhpcztcblxuICAgICAgdmFyIHByb21pc2UgPSBuZXcgQ29uc3RydWN0b3IobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCk7XG5cbiAgICAgIGlmICghbGliJGVzNiRwcm9taXNlJHV0aWxzJCRpc0FycmF5KGVudHJpZXMpKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCBuZXcgVHlwZUVycm9yKCdZb3UgbXVzdCBwYXNzIGFuIGFycmF5IHRvIHJhY2UuJykpO1xuICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgIH1cblxuICAgICAgdmFyIGxlbmd0aCA9IGVudHJpZXMubGVuZ3RoO1xuXG4gICAgICBmdW5jdGlvbiBvbkZ1bGZpbGxtZW50KHZhbHVlKSB7XG4gICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlc29sdmUocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBvblJlamVjdGlvbihyZWFzb24pIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHByb21pc2UsIHJlYXNvbik7XG4gICAgICB9XG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBwcm9taXNlLl9zdGF0ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUEVORElORyAmJiBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkc3Vic2NyaWJlKENvbnN0cnVjdG9yLnJlc29sdmUoZW50cmllc1tpXSksIHVuZGVmaW5lZCwgb25GdWxmaWxsbWVudCwgb25SZWplY3Rpb24pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9XG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJhY2UkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyYWNlJCRyYWNlO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJHJlamVjdCQkcmVqZWN0KHJlYXNvbikge1xuICAgICAgLypqc2hpbnQgdmFsaWR0aGlzOnRydWUgKi9cbiAgICAgIHZhciBDb25zdHJ1Y3RvciA9IHRoaXM7XG4gICAgICB2YXIgcHJvbWlzZSA9IG5ldyBDb25zdHJ1Y3RvcihsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRub29wKTtcbiAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJHJlamVjdChwcm9taXNlLCByZWFzb24pO1xuICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgfVxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZWplY3QkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZWplY3QkJHJlamVjdDtcblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkY291bnRlciA9IDA7XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkbmVlZHNSZXNvbHZlcigpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1lvdSBtdXN0IHBhc3MgYSByZXNvbHZlciBmdW5jdGlvbiBhcyB0aGUgZmlyc3QgYXJndW1lbnQgdG8gdGhlIHByb21pc2UgY29uc3RydWN0b3InKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkbmVlZHNOZXcoKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiRmFpbGVkIHRvIGNvbnN0cnVjdCAnUHJvbWlzZSc6IFBsZWFzZSB1c2UgdGhlICduZXcnIG9wZXJhdG9yLCB0aGlzIG9iamVjdCBjb25zdHJ1Y3RvciBjYW5ub3QgYmUgY2FsbGVkIGFzIGEgZnVuY3Rpb24uXCIpO1xuICAgIH1cblxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlO1xuICAgIC8qKlxuICAgICAgUHJvbWlzZSBvYmplY3RzIHJlcHJlc2VudCB0aGUgZXZlbnR1YWwgcmVzdWx0IG9mIGFuIGFzeW5jaHJvbm91cyBvcGVyYXRpb24uIFRoZVxuICAgICAgcHJpbWFyeSB3YXkgb2YgaW50ZXJhY3Rpbmcgd2l0aCBhIHByb21pc2UgaXMgdGhyb3VnaCBpdHMgYHRoZW5gIG1ldGhvZCwgd2hpY2hcbiAgICAgIHJlZ2lzdGVycyBjYWxsYmFja3MgdG8gcmVjZWl2ZSBlaXRoZXIgYSBwcm9taXNlJ3MgZXZlbnR1YWwgdmFsdWUgb3IgdGhlIHJlYXNvblxuICAgICAgd2h5IHRoZSBwcm9taXNlIGNhbm5vdCBiZSBmdWxmaWxsZWQuXG5cbiAgICAgIFRlcm1pbm9sb2d5XG4gICAgICAtLS0tLS0tLS0tLVxuXG4gICAgICAtIGBwcm9taXNlYCBpcyBhbiBvYmplY3Qgb3IgZnVuY3Rpb24gd2l0aCBhIGB0aGVuYCBtZXRob2Qgd2hvc2UgYmVoYXZpb3IgY29uZm9ybXMgdG8gdGhpcyBzcGVjaWZpY2F0aW9uLlxuICAgICAgLSBgdGhlbmFibGVgIGlzIGFuIG9iamVjdCBvciBmdW5jdGlvbiB0aGF0IGRlZmluZXMgYSBgdGhlbmAgbWV0aG9kLlxuICAgICAgLSBgdmFsdWVgIGlzIGFueSBsZWdhbCBKYXZhU2NyaXB0IHZhbHVlIChpbmNsdWRpbmcgdW5kZWZpbmVkLCBhIHRoZW5hYmxlLCBvciBhIHByb21pc2UpLlxuICAgICAgLSBgZXhjZXB0aW9uYCBpcyBhIHZhbHVlIHRoYXQgaXMgdGhyb3duIHVzaW5nIHRoZSB0aHJvdyBzdGF0ZW1lbnQuXG4gICAgICAtIGByZWFzb25gIGlzIGEgdmFsdWUgdGhhdCBpbmRpY2F0ZXMgd2h5IGEgcHJvbWlzZSB3YXMgcmVqZWN0ZWQuXG4gICAgICAtIGBzZXR0bGVkYCB0aGUgZmluYWwgcmVzdGluZyBzdGF0ZSBvZiBhIHByb21pc2UsIGZ1bGZpbGxlZCBvciByZWplY3RlZC5cblxuICAgICAgQSBwcm9taXNlIGNhbiBiZSBpbiBvbmUgb2YgdGhyZWUgc3RhdGVzOiBwZW5kaW5nLCBmdWxmaWxsZWQsIG9yIHJlamVjdGVkLlxuXG4gICAgICBQcm9taXNlcyB0aGF0IGFyZSBmdWxmaWxsZWQgaGF2ZSBhIGZ1bGZpbGxtZW50IHZhbHVlIGFuZCBhcmUgaW4gdGhlIGZ1bGZpbGxlZFxuICAgICAgc3RhdGUuICBQcm9taXNlcyB0aGF0IGFyZSByZWplY3RlZCBoYXZlIGEgcmVqZWN0aW9uIHJlYXNvbiBhbmQgYXJlIGluIHRoZVxuICAgICAgcmVqZWN0ZWQgc3RhdGUuICBBIGZ1bGZpbGxtZW50IHZhbHVlIGlzIG5ldmVyIGEgdGhlbmFibGUuXG5cbiAgICAgIFByb21pc2VzIGNhbiBhbHNvIGJlIHNhaWQgdG8gKnJlc29sdmUqIGEgdmFsdWUuICBJZiB0aGlzIHZhbHVlIGlzIGFsc28gYVxuICAgICAgcHJvbWlzZSwgdGhlbiB0aGUgb3JpZ2luYWwgcHJvbWlzZSdzIHNldHRsZWQgc3RhdGUgd2lsbCBtYXRjaCB0aGUgdmFsdWUnc1xuICAgICAgc2V0dGxlZCBzdGF0ZS4gIFNvIGEgcHJvbWlzZSB0aGF0ICpyZXNvbHZlcyogYSBwcm9taXNlIHRoYXQgcmVqZWN0cyB3aWxsXG4gICAgICBpdHNlbGYgcmVqZWN0LCBhbmQgYSBwcm9taXNlIHRoYXQgKnJlc29sdmVzKiBhIHByb21pc2UgdGhhdCBmdWxmaWxscyB3aWxsXG4gICAgICBpdHNlbGYgZnVsZmlsbC5cblxuXG4gICAgICBCYXNpYyBVc2FnZTpcbiAgICAgIC0tLS0tLS0tLS0tLVxuXG4gICAgICBgYGBqc1xuICAgICAgdmFyIHByb21pc2UgPSBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgLy8gb24gc3VjY2Vzc1xuICAgICAgICByZXNvbHZlKHZhbHVlKTtcblxuICAgICAgICAvLyBvbiBmYWlsdXJlXG4gICAgICAgIHJlamVjdChyZWFzb24pO1xuICAgICAgfSk7XG5cbiAgICAgIHByb21pc2UudGhlbihmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAvLyBvbiBmdWxmaWxsbWVudFxuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgIC8vIG9uIHJlamVjdGlvblxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQWR2YW5jZWQgVXNhZ2U6XG4gICAgICAtLS0tLS0tLS0tLS0tLS1cblxuICAgICAgUHJvbWlzZXMgc2hpbmUgd2hlbiBhYnN0cmFjdGluZyBhd2F5IGFzeW5jaHJvbm91cyBpbnRlcmFjdGlvbnMgc3VjaCBhc1xuICAgICAgYFhNTEh0dHBSZXF1ZXN0YHMuXG5cbiAgICAgIGBgYGpzXG4gICAgICBmdW5jdGlvbiBnZXRKU09OKHVybCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KXtcbiAgICAgICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgICAgICB4aHIub3BlbignR0VUJywgdXJsKTtcbiAgICAgICAgICB4aHIub25yZWFkeXN0YXRlY2hhbmdlID0gaGFuZGxlcjtcbiAgICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2pzb24nO1xuICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdBY2NlcHQnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHhoci5zZW5kKCk7XG5cbiAgICAgICAgICBmdW5jdGlvbiBoYW5kbGVyKCkge1xuICAgICAgICAgICAgaWYgKHRoaXMucmVhZHlTdGF0ZSA9PT0gdGhpcy5ET05FKSB7XG4gICAgICAgICAgICAgIGlmICh0aGlzLnN0YXR1cyA9PT0gMjAwKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSh0aGlzLnJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKCdnZXRKU09OOiBgJyArIHVybCArICdgIGZhaWxlZCB3aXRoIHN0YXR1czogWycgKyB0aGlzLnN0YXR1cyArICddJykpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGdldEpTT04oJy9wb3N0cy5qc29uJykudGhlbihmdW5jdGlvbihqc29uKSB7XG4gICAgICAgIC8vIG9uIGZ1bGZpbGxtZW50XG4gICAgICB9LCBmdW5jdGlvbihyZWFzb24pIHtcbiAgICAgICAgLy8gb24gcmVqZWN0aW9uXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBVbmxpa2UgY2FsbGJhY2tzLCBwcm9taXNlcyBhcmUgZ3JlYXQgY29tcG9zYWJsZSBwcmltaXRpdmVzLlxuXG4gICAgICBgYGBqc1xuICAgICAgUHJvbWlzZS5hbGwoW1xuICAgICAgICBnZXRKU09OKCcvcG9zdHMnKSxcbiAgICAgICAgZ2V0SlNPTignL2NvbW1lbnRzJylcbiAgICAgIF0pLnRoZW4oZnVuY3Rpb24odmFsdWVzKXtcbiAgICAgICAgdmFsdWVzWzBdIC8vID0+IHBvc3RzSlNPTlxuICAgICAgICB2YWx1ZXNbMV0gLy8gPT4gY29tbWVudHNKU09OXG5cbiAgICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEBjbGFzcyBQcm9taXNlXG4gICAgICBAcGFyYW0ge2Z1bmN0aW9ufSByZXNvbHZlclxuICAgICAgVXNlZnVsIGZvciB0b29saW5nLlxuICAgICAgQGNvbnN0cnVjdG9yXG4gICAgKi9cbiAgICBmdW5jdGlvbiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZShyZXNvbHZlcikge1xuICAgICAgdGhpcy5faWQgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkY291bnRlcisrO1xuICAgICAgdGhpcy5fc3RhdGUgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9yZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLl9zdWJzY3JpYmVycyA9IFtdO1xuXG4gICAgICBpZiAobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCAhPT0gcmVzb2x2ZXIpIHtcbiAgICAgICAgdHlwZW9mIHJlc29sdmVyICE9PSAnZnVuY3Rpb24nICYmIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRuZWVkc1Jlc29sdmVyKCk7XG4gICAgICAgIHRoaXMgaW5zdGFuY2VvZiBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZSA/IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGluaXRpYWxpemVQcm9taXNlKHRoaXMsIHJlc29sdmVyKSA6IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRuZWVkc05ldygpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLmFsbCA9IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJGFsbCQkZGVmYXVsdDtcbiAgICBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZS5yYWNlID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmFjZSQkZGVmYXVsdDtcbiAgICBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZS5yZXNvbHZlID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVzb2x2ZSQkZGVmYXVsdDtcbiAgICBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZS5yZWplY3QgPSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSRyZWplY3QkJGRlZmF1bHQ7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UuX3NldFNjaGVkdWxlciA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRzZXRTY2hlZHVsZXI7XG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UuX3NldEFzYXAgPSBsaWIkZXM2JHByb21pc2UkYXNhcCQkc2V0QXNhcDtcbiAgICBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkUHJvbWlzZS5fYXNhcCA9IGxpYiRlczYkcHJvbWlzZSRhc2FwJCRhc2FwO1xuXG4gICAgbGliJGVzNiRwcm9taXNlJHByb21pc2UkJFByb21pc2UucHJvdG90eXBlID0ge1xuICAgICAgY29uc3RydWN0b3I6IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRQcm9taXNlLFxuXG4gICAgLyoqXG4gICAgICBUaGUgcHJpbWFyeSB3YXkgb2YgaW50ZXJhY3Rpbmcgd2l0aCBhIHByb21pc2UgaXMgdGhyb3VnaCBpdHMgYHRoZW5gIG1ldGhvZCxcbiAgICAgIHdoaWNoIHJlZ2lzdGVycyBjYWxsYmFja3MgdG8gcmVjZWl2ZSBlaXRoZXIgYSBwcm9taXNlJ3MgZXZlbnR1YWwgdmFsdWUgb3IgdGhlXG4gICAgICByZWFzb24gd2h5IHRoZSBwcm9taXNlIGNhbm5vdCBiZSBmdWxmaWxsZWQuXG5cbiAgICAgIGBgYGpzXG4gICAgICBmaW5kVXNlcigpLnRoZW4oZnVuY3Rpb24odXNlcil7XG4gICAgICAgIC8vIHVzZXIgaXMgYXZhaWxhYmxlXG4gICAgICB9LCBmdW5jdGlvbihyZWFzb24pe1xuICAgICAgICAvLyB1c2VyIGlzIHVuYXZhaWxhYmxlLCBhbmQgeW91IGFyZSBnaXZlbiB0aGUgcmVhc29uIHdoeVxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQ2hhaW5pbmdcbiAgICAgIC0tLS0tLS0tXG5cbiAgICAgIFRoZSByZXR1cm4gdmFsdWUgb2YgYHRoZW5gIGlzIGl0c2VsZiBhIHByb21pc2UuICBUaGlzIHNlY29uZCwgJ2Rvd25zdHJlYW0nXG4gICAgICBwcm9taXNlIGlzIHJlc29sdmVkIHdpdGggdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgZmlyc3QgcHJvbWlzZSdzIGZ1bGZpbGxtZW50XG4gICAgICBvciByZWplY3Rpb24gaGFuZGxlciwgb3IgcmVqZWN0ZWQgaWYgdGhlIGhhbmRsZXIgdGhyb3dzIGFuIGV4Y2VwdGlvbi5cblxuICAgICAgYGBganNcbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICByZXR1cm4gdXNlci5uYW1lO1xuICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICByZXR1cm4gJ2RlZmF1bHQgbmFtZSc7XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uICh1c2VyTmFtZSkge1xuICAgICAgICAvLyBJZiBgZmluZFVzZXJgIGZ1bGZpbGxlZCwgYHVzZXJOYW1lYCB3aWxsIGJlIHRoZSB1c2VyJ3MgbmFtZSwgb3RoZXJ3aXNlIGl0XG4gICAgICAgIC8vIHdpbGwgYmUgYCdkZWZhdWx0IG5hbWUnYFxuICAgICAgfSk7XG5cbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZvdW5kIHVzZXIsIGJ1dCBzdGlsbCB1bmhhcHB5Jyk7XG4gICAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignYGZpbmRVc2VyYCByZWplY3RlZCBhbmQgd2UncmUgdW5oYXBweScpO1xuICAgICAgfSkudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gbmV2ZXIgcmVhY2hlZFxuICAgICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICAvLyBpZiBgZmluZFVzZXJgIGZ1bGZpbGxlZCwgYHJlYXNvbmAgd2lsbCBiZSAnRm91bmQgdXNlciwgYnV0IHN0aWxsIHVuaGFwcHknLlxuICAgICAgICAvLyBJZiBgZmluZFVzZXJgIHJlamVjdGVkLCBgcmVhc29uYCB3aWxsIGJlICdgZmluZFVzZXJgIHJlamVjdGVkIGFuZCB3ZSdyZSB1bmhhcHB5Jy5cbiAgICAgIH0pO1xuICAgICAgYGBgXG4gICAgICBJZiB0aGUgZG93bnN0cmVhbSBwcm9taXNlIGRvZXMgbm90IHNwZWNpZnkgYSByZWplY3Rpb24gaGFuZGxlciwgcmVqZWN0aW9uIHJlYXNvbnMgd2lsbCBiZSBwcm9wYWdhdGVkIGZ1cnRoZXIgZG93bnN0cmVhbS5cblxuICAgICAgYGBganNcbiAgICAgIGZpbmRVc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xuICAgICAgICB0aHJvdyBuZXcgUGVkYWdvZ2ljYWxFeGNlcHRpb24oJ1Vwc3RyZWFtIGVycm9yJyk7XG4gICAgICB9KS50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAvLyBuZXZlciByZWFjaGVkXG4gICAgICB9KS50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAvLyBuZXZlciByZWFjaGVkXG4gICAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIC8vIFRoZSBgUGVkZ2Fnb2NpYWxFeGNlcHRpb25gIGlzIHByb3BhZ2F0ZWQgYWxsIHRoZSB3YXkgZG93biB0byBoZXJlXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBBc3NpbWlsYXRpb25cbiAgICAgIC0tLS0tLS0tLS0tLVxuXG4gICAgICBTb21ldGltZXMgdGhlIHZhbHVlIHlvdSB3YW50IHRvIHByb3BhZ2F0ZSB0byBhIGRvd25zdHJlYW0gcHJvbWlzZSBjYW4gb25seSBiZVxuICAgICAgcmV0cmlldmVkIGFzeW5jaHJvbm91c2x5LiBUaGlzIGNhbiBiZSBhY2hpZXZlZCBieSByZXR1cm5pbmcgYSBwcm9taXNlIGluIHRoZVxuICAgICAgZnVsZmlsbG1lbnQgb3IgcmVqZWN0aW9uIGhhbmRsZXIuIFRoZSBkb3duc3RyZWFtIHByb21pc2Ugd2lsbCB0aGVuIGJlIHBlbmRpbmdcbiAgICAgIHVudGlsIHRoZSByZXR1cm5lZCBwcm9taXNlIGlzIHNldHRsZWQuIFRoaXMgaXMgY2FsbGVkICphc3NpbWlsYXRpb24qLlxuXG4gICAgICBgYGBqc1xuICAgICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgIHJldHVybiBmaW5kQ29tbWVudHNCeUF1dGhvcih1c2VyKTtcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKGNvbW1lbnRzKSB7XG4gICAgICAgIC8vIFRoZSB1c2VyJ3MgY29tbWVudHMgYXJlIG5vdyBhdmFpbGFibGVcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIElmIHRoZSBhc3NpbWxpYXRlZCBwcm9taXNlIHJlamVjdHMsIHRoZW4gdGhlIGRvd25zdHJlYW0gcHJvbWlzZSB3aWxsIGFsc28gcmVqZWN0LlxuXG4gICAgICBgYGBqc1xuICAgICAgZmluZFVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgIHJldHVybiBmaW5kQ29tbWVudHNCeUF1dGhvcih1c2VyKTtcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKGNvbW1lbnRzKSB7XG4gICAgICAgIC8vIElmIGBmaW5kQ29tbWVudHNCeUF1dGhvcmAgZnVsZmlsbHMsIHdlJ2xsIGhhdmUgdGhlIHZhbHVlIGhlcmVcbiAgICAgIH0sIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgLy8gSWYgYGZpbmRDb21tZW50c0J5QXV0aG9yYCByZWplY3RzLCB3ZSdsbCBoYXZlIHRoZSByZWFzb24gaGVyZVxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgU2ltcGxlIEV4YW1wbGVcbiAgICAgIC0tLS0tLS0tLS0tLS0tXG5cbiAgICAgIFN5bmNocm9ub3VzIEV4YW1wbGVcblxuICAgICAgYGBgamF2YXNjcmlwdFxuICAgICAgdmFyIHJlc3VsdDtcblxuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzdWx0ID0gZmluZFJlc3VsdCgpO1xuICAgICAgICAvLyBzdWNjZXNzXG4gICAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgICAvLyBmYWlsdXJlXG4gICAgICB9XG4gICAgICBgYGBcblxuICAgICAgRXJyYmFjayBFeGFtcGxlXG5cbiAgICAgIGBgYGpzXG4gICAgICBmaW5kUmVzdWx0KGZ1bmN0aW9uKHJlc3VsdCwgZXJyKXtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIC8vIGZhaWx1cmVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBzdWNjZXNzXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIFByb21pc2UgRXhhbXBsZTtcblxuICAgICAgYGBgamF2YXNjcmlwdFxuICAgICAgZmluZFJlc3VsdCgpLnRoZW4oZnVuY3Rpb24ocmVzdWx0KXtcbiAgICAgICAgLy8gc3VjY2Vzc1xuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgICAgLy8gZmFpbHVyZVxuICAgICAgfSk7XG4gICAgICBgYGBcblxuICAgICAgQWR2YW5jZWQgRXhhbXBsZVxuICAgICAgLS0tLS0tLS0tLS0tLS1cblxuICAgICAgU3luY2hyb25vdXMgRXhhbXBsZVxuXG4gICAgICBgYGBqYXZhc2NyaXB0XG4gICAgICB2YXIgYXV0aG9yLCBib29rcztcblxuICAgICAgdHJ5IHtcbiAgICAgICAgYXV0aG9yID0gZmluZEF1dGhvcigpO1xuICAgICAgICBib29rcyAgPSBmaW5kQm9va3NCeUF1dGhvcihhdXRob3IpO1xuICAgICAgICAvLyBzdWNjZXNzXG4gICAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgICAvLyBmYWlsdXJlXG4gICAgICB9XG4gICAgICBgYGBcblxuICAgICAgRXJyYmFjayBFeGFtcGxlXG5cbiAgICAgIGBgYGpzXG5cbiAgICAgIGZ1bmN0aW9uIGZvdW5kQm9va3MoYm9va3MpIHtcblxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBmYWlsdXJlKHJlYXNvbikge1xuXG4gICAgICB9XG5cbiAgICAgIGZpbmRBdXRob3IoZnVuY3Rpb24oYXV0aG9yLCBlcnIpe1xuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgZmFpbHVyZShlcnIpO1xuICAgICAgICAgIC8vIGZhaWx1cmVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgZmluZEJvb29rc0J5QXV0aG9yKGF1dGhvciwgZnVuY3Rpb24oYm9va3MsIGVycikge1xuICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgZmFpbHVyZShlcnIpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICBmb3VuZEJvb2tzKGJvb2tzKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgICAgICAgICAgICAgZmFpbHVyZShyZWFzb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBjYXRjaChlcnJvcikge1xuICAgICAgICAgICAgZmFpbHVyZShlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBzdWNjZXNzXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIFByb21pc2UgRXhhbXBsZTtcblxuICAgICAgYGBgamF2YXNjcmlwdFxuICAgICAgZmluZEF1dGhvcigpLlxuICAgICAgICB0aGVuKGZpbmRCb29rc0J5QXV0aG9yKS5cbiAgICAgICAgdGhlbihmdW5jdGlvbihib29rcyl7XG4gICAgICAgICAgLy8gZm91bmQgYm9va3NcbiAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKHJlYXNvbil7XG4gICAgICAgIC8vIHNvbWV0aGluZyB3ZW50IHdyb25nXG4gICAgICB9KTtcbiAgICAgIGBgYFxuXG4gICAgICBAbWV0aG9kIHRoZW5cbiAgICAgIEBwYXJhbSB7RnVuY3Rpb259IG9uRnVsZmlsbGVkXG4gICAgICBAcGFyYW0ge0Z1bmN0aW9ufSBvblJlamVjdGVkXG4gICAgICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gICAgICBAcmV0dXJuIHtQcm9taXNlfVxuICAgICovXG4gICAgICB0aGVuOiBsaWIkZXM2JHByb21pc2UkdGhlbiQkZGVmYXVsdCxcblxuICAgIC8qKlxuICAgICAgYGNhdGNoYCBpcyBzaW1wbHkgc3VnYXIgZm9yIGB0aGVuKHVuZGVmaW5lZCwgb25SZWplY3Rpb24pYCB3aGljaCBtYWtlcyBpdCB0aGUgc2FtZVxuICAgICAgYXMgdGhlIGNhdGNoIGJsb2NrIG9mIGEgdHJ5L2NhdGNoIHN0YXRlbWVudC5cblxuICAgICAgYGBganNcbiAgICAgIGZ1bmN0aW9uIGZpbmRBdXRob3IoKXtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZG4ndCBmaW5kIHRoYXQgYXV0aG9yJyk7XG4gICAgICB9XG5cbiAgICAgIC8vIHN5bmNocm9ub3VzXG4gICAgICB0cnkge1xuICAgICAgICBmaW5kQXV0aG9yKCk7XG4gICAgICB9IGNhdGNoKHJlYXNvbikge1xuICAgICAgICAvLyBzb21ldGhpbmcgd2VudCB3cm9uZ1xuICAgICAgfVxuXG4gICAgICAvLyBhc3luYyB3aXRoIHByb21pc2VzXG4gICAgICBmaW5kQXV0aG9yKCkuY2F0Y2goZnVuY3Rpb24ocmVhc29uKXtcbiAgICAgICAgLy8gc29tZXRoaW5nIHdlbnQgd3JvbmdcbiAgICAgIH0pO1xuICAgICAgYGBgXG5cbiAgICAgIEBtZXRob2QgY2F0Y2hcbiAgICAgIEBwYXJhbSB7RnVuY3Rpb259IG9uUmVqZWN0aW9uXG4gICAgICBVc2VmdWwgZm9yIHRvb2xpbmcuXG4gICAgICBAcmV0dXJuIHtQcm9taXNlfVxuICAgICovXG4gICAgICAnY2F0Y2gnOiBmdW5jdGlvbihvblJlamVjdGlvbikge1xuICAgICAgICByZXR1cm4gdGhpcy50aGVuKG51bGwsIG9uUmVqZWN0aW9uKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHZhciBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkZGVmYXVsdCA9IGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yO1xuICAgIGZ1bmN0aW9uIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yKENvbnN0cnVjdG9yLCBpbnB1dCkge1xuICAgICAgdGhpcy5faW5zdGFuY2VDb25zdHJ1Y3RvciA9IENvbnN0cnVjdG9yO1xuICAgICAgdGhpcy5wcm9taXNlID0gbmV3IENvbnN0cnVjdG9yKGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJG5vb3ApO1xuXG4gICAgICBpZiAoQXJyYXkuaXNBcnJheShpbnB1dCkpIHtcbiAgICAgICAgdGhpcy5faW5wdXQgICAgID0gaW5wdXQ7XG4gICAgICAgIHRoaXMubGVuZ3RoICAgICA9IGlucHV0Lmxlbmd0aDtcbiAgICAgICAgdGhpcy5fcmVtYWluaW5nID0gaW5wdXQubGVuZ3RoO1xuXG4gICAgICAgIHRoaXMuX3Jlc3VsdCA9IG5ldyBBcnJheSh0aGlzLmxlbmd0aCk7XG5cbiAgICAgICAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbCh0aGlzLnByb21pc2UsIHRoaXMuX3Jlc3VsdCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5sZW5ndGggPSB0aGlzLmxlbmd0aCB8fCAwO1xuICAgICAgICAgIHRoaXMuX2VudW1lcmF0ZSgpO1xuICAgICAgICAgIGlmICh0aGlzLl9yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgICAgIGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGZ1bGZpbGwodGhpcy5wcm9taXNlLCB0aGlzLl9yZXN1bHQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkcmVqZWN0KHRoaXMucHJvbWlzZSwgdGhpcy5fdmFsaWRhdGlvbkVycm9yKCkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yLnByb3RvdHlwZS5fdmFsaWRhdGlvbkVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IEVycm9yKCdBcnJheSBNZXRob2RzIG11c3QgYmUgcHJvdmlkZWQgYW4gQXJyYXknKTtcbiAgICB9O1xuXG4gICAgbGliJGVzNiRwcm9taXNlJGVudW1lcmF0b3IkJEVudW1lcmF0b3IucHJvdG90eXBlLl9lbnVtZXJhdGUgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBsZW5ndGggID0gdGhpcy5sZW5ndGg7XG4gICAgICB2YXIgaW5wdXQgICA9IHRoaXMuX2lucHV0O1xuXG4gICAgICBmb3IgKHZhciBpID0gMDsgdGhpcy5fc3RhdGUgPT09IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJFBFTkRJTkcgJiYgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRoaXMuX2VhY2hFbnRyeShpbnB1dFtpXSwgaSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yLnByb3RvdHlwZS5fZWFjaEVudHJ5ID0gZnVuY3Rpb24oZW50cnksIGkpIHtcbiAgICAgIHZhciBjID0gdGhpcy5faW5zdGFuY2VDb25zdHJ1Y3RvcjtcbiAgICAgIHZhciByZXNvbHZlID0gYy5yZXNvbHZlO1xuXG4gICAgICBpZiAocmVzb2x2ZSA9PT0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkcmVzb2x2ZSQkZGVmYXVsdCkge1xuICAgICAgICB2YXIgdGhlbiA9IGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJGdldFRoZW4oZW50cnkpO1xuXG4gICAgICAgIGlmICh0aGVuID09PSBsaWIkZXM2JHByb21pc2UkdGhlbiQkZGVmYXVsdCAmJlxuICAgICAgICAgICAgZW50cnkuX3N0YXRlICE9PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7XG4gICAgICAgICAgdGhpcy5fc2V0dGxlZEF0KGVudHJ5Ll9zdGF0ZSwgaSwgZW50cnkuX3Jlc3VsdCk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHRoZW4gIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICB0aGlzLl9yZW1haW5pbmctLTtcbiAgICAgICAgICB0aGlzLl9yZXN1bHRbaV0gPSBlbnRyeTtcbiAgICAgICAgfSBlbHNlIGlmIChjID09PSBsaWIkZXM2JHByb21pc2UkcHJvbWlzZSQkZGVmYXVsdCkge1xuICAgICAgICAgIHZhciBwcm9taXNlID0gbmV3IGMobGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkbm9vcCk7XG4gICAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkaGFuZGxlTWF5YmVUaGVuYWJsZShwcm9taXNlLCBlbnRyeSwgdGhlbik7XG4gICAgICAgICAgdGhpcy5fd2lsbFNldHRsZUF0KHByb21pc2UsIGkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX3dpbGxTZXR0bGVBdChuZXcgYyhmdW5jdGlvbihyZXNvbHZlKSB7IHJlc29sdmUoZW50cnkpOyB9KSwgaSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX3dpbGxTZXR0bGVBdChyZXNvbHZlKGVudHJ5KSwgaSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGxpYiRlczYkcHJvbWlzZSRlbnVtZXJhdG9yJCRFbnVtZXJhdG9yLnByb3RvdHlwZS5fc2V0dGxlZEF0ID0gZnVuY3Rpb24oc3RhdGUsIGksIHZhbHVlKSB7XG4gICAgICB2YXIgcHJvbWlzZSA9IHRoaXMucHJvbWlzZTtcblxuICAgICAgaWYgKHByb21pc2UuX3N0YXRlID09PSBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRQRU5ESU5HKSB7XG4gICAgICAgIHRoaXMuX3JlbWFpbmluZy0tO1xuXG4gICAgICAgIGlmIChzdGF0ZSA9PT0gbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkUkVKRUNURUQpIHtcbiAgICAgICAgICBsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRyZWplY3QocHJvbWlzZSwgdmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuX3Jlc3VsdFtpXSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9yZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkZnVsZmlsbChwcm9taXNlLCB0aGlzLl9yZXN1bHQpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBsaWIkZXM2JHByb21pc2UkZW51bWVyYXRvciQkRW51bWVyYXRvci5wcm90b3R5cGUuX3dpbGxTZXR0bGVBdCA9IGZ1bmN0aW9uKHByb21pc2UsIGkpIHtcbiAgICAgIHZhciBlbnVtZXJhdG9yID0gdGhpcztcblxuICAgICAgbGliJGVzNiRwcm9taXNlJCRpbnRlcm5hbCQkc3Vic2NyaWJlKHByb21pc2UsIHVuZGVmaW5lZCwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgZW51bWVyYXRvci5fc2V0dGxlZEF0KGxpYiRlczYkcHJvbWlzZSQkaW50ZXJuYWwkJEZVTEZJTExFRCwgaSwgdmFsdWUpO1xuICAgICAgfSwgZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgICAgIGVudW1lcmF0b3IuX3NldHRsZWRBdChsaWIkZXM2JHByb21pc2UkJGludGVybmFsJCRSRUpFQ1RFRCwgaSwgcmVhc29uKTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgZnVuY3Rpb24gbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRwb2x5ZmlsbCgpIHtcbiAgICAgIHZhciBsb2NhbDtcblxuICAgICAgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgbG9jYWwgPSBnbG9iYWw7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgIGxvY2FsID0gc2VsZjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgbG9jYWwgPSBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwb2x5ZmlsbCBmYWlsZWQgYmVjYXVzZSBnbG9iYWwgb2JqZWN0IGlzIHVuYXZhaWxhYmxlIGluIHRoaXMgZW52aXJvbm1lbnQnKTtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHZhciBQID0gbG9jYWwuUHJvbWlzZTtcblxuICAgICAgaWYgKFAgJiYgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFAucmVzb2x2ZSgpKSA9PT0gJ1tvYmplY3QgUHJvbWlzZV0nICYmICFQLmNhc3QpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBsb2NhbC5Qcm9taXNlID0gbGliJGVzNiRwcm9taXNlJHByb21pc2UkJGRlZmF1bHQ7XG4gICAgfVxuICAgIHZhciBsaWIkZXM2JHByb21pc2UkcG9seWZpbGwkJGRlZmF1bHQgPSBsaWIkZXM2JHByb21pc2UkcG9seWZpbGwkJHBvbHlmaWxsO1xuXG4gICAgdmFyIGxpYiRlczYkcHJvbWlzZSR1bWQkJEVTNlByb21pc2UgPSB7XG4gICAgICAnUHJvbWlzZSc6IGxpYiRlczYkcHJvbWlzZSRwcm9taXNlJCRkZWZhdWx0LFxuICAgICAgJ3BvbHlmaWxsJzogbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRkZWZhdWx0XG4gICAgfTtcblxuICAgIC8qIGdsb2JhbCBkZWZpbmU6dHJ1ZSBtb2R1bGU6dHJ1ZSB3aW5kb3c6IHRydWUgKi9cbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmVbJ2FtZCddKSB7XG4gICAgICBkZWZpbmUoZnVuY3Rpb24oKSB7IHJldHVybiBsaWIkZXM2JHByb21pc2UkdW1kJCRFUzZQcm9taXNlOyB9KTtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZVsnZXhwb3J0cyddKSB7XG4gICAgICBtb2R1bGVbJ2V4cG9ydHMnXSA9IGxpYiRlczYkcHJvbWlzZSR1bWQkJEVTNlByb21pc2U7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgdGhpcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHRoaXNbJ0VTNlByb21pc2UnXSA9IGxpYiRlczYkcHJvbWlzZSR1bWQkJEVTNlByb21pc2U7XG4gICAgfVxuXG4gICAgbGliJGVzNiRwcm9taXNlJHBvbHlmaWxsJCRkZWZhdWx0KCk7XG59KS5jYWxsKHRoaXMpO1xuXG4iLCIndXNlIHN0cmljdCc7XG4vKiBlc2xpbnQtZGlzYWJsZSBuby11bnVzZWQtdmFycyAqL1xudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciBwcm9wSXNFbnVtZXJhYmxlID0gT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZTtcblxuZnVuY3Rpb24gdG9PYmplY3QodmFsKSB7XG5cdGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpIHtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdPYmplY3QuYXNzaWduIGNhbm5vdCBiZSBjYWxsZWQgd2l0aCBudWxsIG9yIHVuZGVmaW5lZCcpO1xuXHR9XG5cblx0cmV0dXJuIE9iamVjdCh2YWwpO1xufVxuXG5mdW5jdGlvbiBzaG91bGRVc2VOYXRpdmUoKSB7XG5cdHRyeSB7XG5cdFx0aWYgKCFPYmplY3QuYXNzaWduKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gRGV0ZWN0IGJ1Z2d5IHByb3BlcnR5IGVudW1lcmF0aW9uIG9yZGVyIGluIG9sZGVyIFY4IHZlcnNpb25zLlxuXG5cdFx0Ly8gaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9NDExOFxuXHRcdHZhciB0ZXN0MSA9IG5ldyBTdHJpbmcoJ2FiYycpOyAgLy8gZXNsaW50LWRpc2FibGUtbGluZVxuXHRcdHRlc3QxWzVdID0gJ2RlJztcblx0XHRpZiAoT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGVzdDEpWzBdID09PSAnNScpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBodHRwczovL2J1Z3MuY2hyb21pdW0ub3JnL3AvdjgvaXNzdWVzL2RldGFpbD9pZD0zMDU2XG5cdFx0dmFyIHRlc3QyID0ge307XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCAxMDsgaSsrKSB7XG5cdFx0XHR0ZXN0MlsnXycgKyBTdHJpbmcuZnJvbUNoYXJDb2RlKGkpXSA9IGk7XG5cdFx0fVxuXHRcdHZhciBvcmRlcjIgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0ZXN0MikubWFwKGZ1bmN0aW9uIChuKSB7XG5cdFx0XHRyZXR1cm4gdGVzdDJbbl07XG5cdFx0fSk7XG5cdFx0aWYgKG9yZGVyMi5qb2luKCcnKSAhPT0gJzAxMjM0NTY3ODknKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MzA1NlxuXHRcdHZhciB0ZXN0MyA9IHt9O1xuXHRcdCdhYmNkZWZnaGlqa2xtbm9wcXJzdCcuc3BsaXQoJycpLmZvckVhY2goZnVuY3Rpb24gKGxldHRlcikge1xuXHRcdFx0dGVzdDNbbGV0dGVyXSA9IGxldHRlcjtcblx0XHR9KTtcblx0XHRpZiAoT2JqZWN0LmtleXMoT2JqZWN0LmFzc2lnbih7fSwgdGVzdDMpKS5qb2luKCcnKSAhPT1cblx0XHRcdFx0J2FiY2RlZmdoaWprbG1ub3BxcnN0Jykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0Ly8gV2UgZG9uJ3QgZXhwZWN0IGFueSBvZiB0aGUgYWJvdmUgdG8gdGhyb3csIGJ1dCBiZXR0ZXIgdG8gYmUgc2FmZS5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzaG91bGRVc2VOYXRpdmUoKSA/IE9iamVjdC5hc3NpZ24gOiBmdW5jdGlvbiAodGFyZ2V0LCBzb3VyY2UpIHtcblx0dmFyIGZyb207XG5cdHZhciB0byA9IHRvT2JqZWN0KHRhcmdldCk7XG5cdHZhciBzeW1ib2xzO1xuXG5cdGZvciAodmFyIHMgPSAxOyBzIDwgYXJndW1lbnRzLmxlbmd0aDsgcysrKSB7XG5cdFx0ZnJvbSA9IE9iamVjdChhcmd1bWVudHNbc10pO1xuXG5cdFx0Zm9yICh2YXIga2V5IGluIGZyb20pIHtcblx0XHRcdGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKGZyb20sIGtleSkpIHtcblx0XHRcdFx0dG9ba2V5XSA9IGZyb21ba2V5XTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scykge1xuXHRcdFx0c3ltYm9scyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMoZnJvbSk7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHN5bWJvbHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdFx0aWYgKHByb3BJc0VudW1lcmFibGUuY2FsbChmcm9tLCBzeW1ib2xzW2ldKSkge1xuXHRcdFx0XHRcdHRvW3N5bWJvbHNbaV1dID0gZnJvbVtzeW1ib2xzW2ldXTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0bztcbn07XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xudmFyIFdha2VMb2NrID0gcmVxdWlyZSgnLi93YWtlbG9jay5qcycpO1xuXG4vLyBTdGFydCBhdCBhIGhpZ2hlciBudW1iZXIgdG8gcmVkdWNlIGNoYW5jZSBvZiBjb25mbGljdC5cbnZhciBuZXh0RGlzcGxheUlkID0gMTAwMDtcblxuLyoqXG4gKiBUaGUgYmFzZSBjbGFzcyBmb3IgYWxsIFZSIGRpc3BsYXlzLlxuICovXG5mdW5jdGlvbiBWUkRpc3BsYXkoKSB7XG4gIHRoaXMuaXNQb2x5ZmlsbGVkID0gdHJ1ZTtcbiAgdGhpcy5kaXNwbGF5SWQgPSBuZXh0RGlzcGxheUlkKys7XG4gIHRoaXMuZGlzcGxheU5hbWUgPSAnd2VidnItcG9seWZpbGwgZGlzcGxheU5hbWUnO1xuXG4gIHRoaXMuaXNDb25uZWN0ZWQgPSB0cnVlO1xuICB0aGlzLmlzUHJlc2VudGluZyA9IGZhbHNlO1xuICB0aGlzLmNhcGFiaWxpdGllcyA9IHtcbiAgICBoYXNQb3NpdGlvbjogZmFsc2UsXG4gICAgaGFzT3JpZW50YXRpb246IGZhbHNlLFxuICAgIGhhc0V4dGVybmFsRGlzcGxheTogZmFsc2UsXG4gICAgY2FuUHJlc2VudDogZmFsc2VcbiAgfTtcbiAgdGhpcy5zdGFnZVBhcmFtZXRlcnMgPSBudWxsO1xuXG4gIC8vIFwiUHJpdmF0ZVwiIG1lbWJlcnMuXG4gIHRoaXMud2FpdGluZ0ZvclByZXNlbnRfID0gZmFsc2U7XG4gIHRoaXMubGF5ZXJfID0gbnVsbDtcblxuICB0aGlzLmZ1bGxzY3JlZW5FbGVtZW50XyA9IG51bGw7XG4gIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfID0gbnVsbDtcblxuICB0aGlzLmZ1bGxzY3JlZW5FdmVudFRhcmdldF8gPSBudWxsO1xuICB0aGlzLmZ1bGxzY3JlZW5DaGFuZ2VIYW5kbGVyXyA9IG51bGw7XG4gIHRoaXMuZnVsbHNjcmVlbkVycm9ySGFuZGxlcl8gPSBudWxsO1xuXG4gIHRoaXMud2FrZWxvY2tfID0gbmV3IFdha2VMb2NrKCk7XG59XG5cblZSRGlzcGxheS5wcm90b3R5cGUuZ2V0UG9zZSA9IGZ1bmN0aW9uKCkge1xuICAvLyBUT0RPOiBUZWNobmljYWxseSB0aGlzIHNob3VsZCByZXRhaW4gaXQncyB2YWx1ZSBmb3IgdGhlIGR1cmF0aW9uIG9mIGEgZnJhbWVcbiAgLy8gYnV0IEkgZG91YnQgdGhhdCdzIHByYWN0aWNhbCB0byBkbyBpbiBqYXZhc2NyaXB0LlxuICByZXR1cm4gdGhpcy5nZXRJbW1lZGlhdGVQb3NlKCk7XG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gIHJldHVybiB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGNhbGxiYWNrKTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbihpZCkge1xuICByZXR1cm4gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKGlkKTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUud3JhcEZvckZ1bGxzY3JlZW4gPSBmdW5jdGlvbihlbGVtZW50KSB7XG4gIGlmIChVdGlsLmlzSU9TKCkpXG4gICAgcmV0dXJuIGVsZW1lbnQ7XG5cbiAgaWYgKCF0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXykge1xuICAgIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgdGhpcy5mdWxsc2NyZWVuV3JhcHBlcl8uY2xhc3NMaXN0LmFkZCgnd2VidnItcG9seWZpbGwtZnVsbHNjcmVlbi13cmFwcGVyJyk7XG4gICAgLy8gTWFrZSBzdXJlIHRoZSB3cmFwcGVyIHRha2VzIHRoZSBmdWxsIHNjcmVlbi4gV2l0aG91dCB0aGlzLCB0aGVyZSBpcyBhXG4gICAgLy8gd2hpdGUgbGluZSBhdCB0aGUgYm90dG9tLlxuICAgIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfLnN0eWxlLndpZHRoID0gJzEwMCUnO1xuICAgIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfLnN0eWxlLmhlaWdodCA9ICcxMDAlJztcbiAgfVxuXG4gIGlmICh0aGlzLmZ1bGxzY3JlZW5FbGVtZW50XyA9PSBlbGVtZW50KVxuICAgIHJldHVybiB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXztcblxuICAvLyBSZW1vdmUgYW55IHByZXZpb3VzbHkgYXBwbGllZCB3cmFwcGVyc1xuICB0aGlzLnJlbW92ZUZ1bGxzY3JlZW5XcmFwcGVyKCk7XG5cbiAgdGhpcy5mdWxsc2NyZWVuRWxlbWVudF8gPSBlbGVtZW50O1xuICB2YXIgcGFyZW50ID0gdGhpcy5mdWxsc2NyZWVuRWxlbWVudF8ucGFyZW50RWxlbWVudDtcbiAgcGFyZW50Lmluc2VydEJlZm9yZSh0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXywgdGhpcy5mdWxsc2NyZWVuRWxlbWVudF8pO1xuICBwYXJlbnQucmVtb3ZlQ2hpbGQodGhpcy5mdWxsc2NyZWVuRWxlbWVudF8pO1xuICB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXy5pbnNlcnRCZWZvcmUodGhpcy5mdWxsc2NyZWVuRWxlbWVudF8sIHRoaXMuZnVsbHNjcmVlbldyYXBwZXJfLmZpcnN0Q2hpbGQpO1xuXG4gIHJldHVybiB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXztcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUucmVtb3ZlRnVsbHNjcmVlbldyYXBwZXIgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCF0aGlzLmZ1bGxzY3JlZW5FbGVtZW50XylcbiAgICByZXR1cm47XG5cbiAgdmFyIGVsZW1lbnQgPSB0aGlzLmZ1bGxzY3JlZW5FbGVtZW50XztcbiAgdGhpcy5mdWxsc2NyZWVuRWxlbWVudF8gPSBudWxsO1xuXG4gIHZhciBwYXJlbnQgPSB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXy5wYXJlbnRFbGVtZW50O1xuICB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXy5yZW1vdmVDaGlsZChlbGVtZW50KTtcbiAgcGFyZW50Lmluc2VydEJlZm9yZShlbGVtZW50LCB0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXyk7XG4gIHBhcmVudC5yZW1vdmVDaGlsZCh0aGlzLmZ1bGxzY3JlZW5XcmFwcGVyXyk7XG5cbiAgcmV0dXJuIGVsZW1lbnQ7XG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLnJlcXVlc3RQcmVzZW50ID0gZnVuY3Rpb24obGF5ZXIpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLmxheWVyXyA9IGxheWVyO1xuXG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICBpZiAoIXNlbGYuY2FwYWJpbGl0aWVzLmNhblByZXNlbnQpIHtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoJ1ZSRGlzcGxheSBpcyBub3QgY2FwYWJsZSBvZiBwcmVzZW50aW5nLicpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZWxmLndhaXRpbmdGb3JQcmVzZW50XyA9IGZhbHNlO1xuICAgIGlmIChsYXllciAmJiBsYXllci5zb3VyY2UpIHtcbiAgICAgIHZhciBmdWxsc2NyZWVuRWxlbWVudCA9IHNlbGYud3JhcEZvckZ1bGxzY3JlZW4obGF5ZXIuc291cmNlKTtcblxuICAgICAgZnVuY3Rpb24gb25GdWxsc2NyZWVuQ2hhbmdlKCkge1xuICAgICAgICB2YXIgYWN0dWFsRnVsbHNjcmVlbkVsZW1lbnQgPSBVdGlsLmdldEZ1bGxzY3JlZW5FbGVtZW50KCk7XG5cbiAgICAgICAgc2VsZi5pc1ByZXNlbnRpbmcgPSAoZnVsbHNjcmVlbkVsZW1lbnQgPT09IGFjdHVhbEZ1bGxzY3JlZW5FbGVtZW50KTtcbiAgICAgICAgc2VsZi5maXJlVlJEaXNwbGF5UHJlc2VudENoYW5nZV8oKTtcbiAgICAgICAgaWYgKHNlbGYuaXNQcmVzZW50aW5nKSB7XG4gICAgICAgICAgaWYgKHNjcmVlbi5vcmllbnRhdGlvbiAmJiBzY3JlZW4ub3JpZW50YXRpb24ubG9jaykge1xuICAgICAgICAgICAgc2NyZWVuLm9yaWVudGF0aW9uLmxvY2soJ2xhbmRzY2FwZS1wcmltYXJ5Jyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHNlbGYud2FpdGluZ0ZvclByZXNlbnRfID0gZmFsc2U7XG4gICAgICAgICAgc2VsZi5iZWdpblByZXNlbnRfKCk7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChzY3JlZW4ub3JpZW50YXRpb24gJiYgc2NyZWVuLm9yaWVudGF0aW9uLnVubG9jaykge1xuICAgICAgICAgICAgc2NyZWVuLm9yaWVudGF0aW9uLnVubG9jaygpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzZWxmLnJlbW92ZUZ1bGxzY3JlZW5XcmFwcGVyKCk7XG4gICAgICAgICAgc2VsZi53YWtlbG9ja18ucmVsZWFzZSgpO1xuICAgICAgICAgIHNlbGYuZW5kUHJlc2VudF8oKTtcbiAgICAgICAgICBzZWxmLnJlbW92ZUZ1bGxzY3JlZW5MaXN0ZW5lcnNfKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZ1bmN0aW9uIG9uRnVsbHNjcmVlbkVycm9yKCkge1xuICAgICAgICBpZiAoIXNlbGYud2FpdGluZ0ZvclByZXNlbnRfKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5yZW1vdmVGdWxsc2NyZWVuV3JhcHBlcigpO1xuICAgICAgICBzZWxmLnJlbW92ZUZ1bGxzY3JlZW5MaXN0ZW5lcnNfKCk7XG5cbiAgICAgICAgc2VsZi53YWtlbG9ja18ucmVsZWFzZSgpO1xuICAgICAgICBzZWxmLndhaXRpbmdGb3JQcmVzZW50XyA9IGZhbHNlO1xuICAgICAgICBzZWxmLmlzUHJlc2VudGluZyA9IGZhbHNlO1xuXG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ1VuYWJsZSB0byBwcmVzZW50LicpKTtcbiAgICAgIH1cblxuICAgICAgc2VsZi5hZGRGdWxsc2NyZWVuTGlzdGVuZXJzXyhmdWxsc2NyZWVuRWxlbWVudCxcbiAgICAgICAgICBvbkZ1bGxzY3JlZW5DaGFuZ2UsIG9uRnVsbHNjcmVlbkVycm9yKTtcblxuICAgICAgaWYgKFV0aWwucmVxdWVzdEZ1bGxzY3JlZW4oZnVsbHNjcmVlbkVsZW1lbnQpKSB7XG4gICAgICAgIHNlbGYud2FrZWxvY2tfLnJlcXVlc3QoKTtcbiAgICAgICAgc2VsZi53YWl0aW5nRm9yUHJlc2VudF8gPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChVdGlsLmlzSU9TKCkpIHtcbiAgICAgICAgLy8gKnNpZ2gqIEp1c3QgZmFrZSBpdC5cbiAgICAgICAgc2VsZi53YWtlbG9ja18ucmVxdWVzdCgpO1xuICAgICAgICBzZWxmLmlzUHJlc2VudGluZyA9IHRydWU7XG4gICAgICAgIHNlbGYuZmlyZVZSRGlzcGxheVByZXNlbnRDaGFuZ2VfKCk7XG4gICAgICAgIHNlbGYuYmVnaW5QcmVzZW50XygpO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFzZWxmLndhaXRpbmdGb3JQcmVzZW50XyAmJiAhVXRpbC5pc0lPUygpKSB7XG4gICAgICBVdGlsLmV4aXRGdWxsc2NyZWVuKCk7XG4gICAgICByZWplY3QobmV3IEVycm9yKCdVbmFibGUgdG8gcHJlc2VudC4nKSk7XG4gICAgfVxuICB9KTtcbn07XG5cblZSRGlzcGxheS5wcm90b3R5cGUuZXhpdFByZXNlbnQgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHdhc1ByZXNlbnRpbmcgPSB0aGlzLmlzUHJlc2VudGluZztcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLmlzUHJlc2VudGluZyA9IGZhbHNlO1xuICB0aGlzLmxheWVyXyA9IG51bGw7XG4gIHRoaXMud2FrZWxvY2tfLnJlbGVhc2UoKTtcblxuICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgaWYgKHdhc1ByZXNlbnRpbmcpIHtcbiAgICAgIGlmICghVXRpbC5leGl0RnVsbHNjcmVlbigpICYmIFV0aWwuaXNJT1MoKSkge1xuICAgICAgICBzZWxmLmZpcmVWUkRpc3BsYXlQcmVzZW50Q2hhbmdlXygpO1xuICAgICAgICBzZWxmLmVuZFByZXNlbnRfKCk7XG4gICAgICB9XG5cbiAgICAgIHNlbGYucmVtb3ZlRnVsbHNjcmVlbldyYXBwZXIoKTtcblxuICAgICAgcmVzb2x2ZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZWplY3QobmV3IEVycm9yKCdXYXMgbm90IHByZXNlbnRpbmcgdG8gVlJEaXNwbGF5LicpKTtcbiAgICB9XG4gIH0pO1xufTtcblxuLy8gVGhpcyByZXR1cm5zIGFuIGFycmF5IGJlY2F1c2UgZnV0dXJlIHZlcnNpb25zIG9mIHRoZSBzcGVjIG1heSBhY2NlcHQgbXVsdGlwbGVcbi8vIGxheWVycyBpbiByZXF1ZXN0UHJlc2VudCwgYW5kIGl0J3MgZWFzaWVyIHRvIG92ZXJsb2FkIGZ1bmN0aW9uIHBhcmFtZXRlcnNcbi8vIHRoYW4gaXQgaXMgcmV0dXJuIHR5cGVzLlxuVlJEaXNwbGF5LnByb3RvdHlwZS5nZXRMYXllcnMgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMubGF5ZXJfKSB7XG4gICAgcmV0dXJuIFt0aGlzLmxheWVyX107XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLmZpcmVWUkRpc3BsYXlQcmVzZW50Q2hhbmdlXyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZXZlbnQgPSBuZXcgQ3VzdG9tRXZlbnQoJ3ZyZGlzcGxheXByZXNlbnRjaGFuZ2UnLCB7ZGV0YWlsOiB7dnJkaXNwbGF5OiB0aGlzfX0pO1xuICB3aW5kb3cuZGlzcGF0Y2hFdmVudChldmVudCk7XG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLmFkZEZ1bGxzY3JlZW5MaXN0ZW5lcnNfID0gZnVuY3Rpb24oZWxlbWVudCwgY2hhbmdlSGFuZGxlciwgZXJyb3JIYW5kbGVyKSB7XG4gIHRoaXMucmVtb3ZlRnVsbHNjcmVlbkxpc3RlbmVyc18oKTtcblxuICB0aGlzLmZ1bGxzY3JlZW5FdmVudFRhcmdldF8gPSBlbGVtZW50O1xuICB0aGlzLmZ1bGxzY3JlZW5DaGFuZ2VIYW5kbGVyXyA9IGNoYW5nZUhhbmRsZXI7XG4gIHRoaXMuZnVsbHNjcmVlbkVycm9ySGFuZGxlcl8gPSBlcnJvckhhbmRsZXI7XG5cbiAgaWYgKGNoYW5nZUhhbmRsZXIpIHtcbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2Z1bGxzY3JlZW5jaGFuZ2UnLCBjaGFuZ2VIYW5kbGVyLCBmYWxzZSk7XG4gICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd3ZWJraXRmdWxsc2NyZWVuY2hhbmdlJywgY2hhbmdlSGFuZGxlciwgZmFsc2UpO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vemZ1bGxzY3JlZW5jaGFuZ2UnLCBjaGFuZ2VIYW5kbGVyLCBmYWxzZSk7XG4gICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdtc2Z1bGxzY3JlZW5jaGFuZ2UnLCBjaGFuZ2VIYW5kbGVyLCBmYWxzZSk7XG4gIH1cblxuICBpZiAoZXJyb3JIYW5kbGVyKSB7XG4gICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdmdWxsc2NyZWVuZXJyb3InLCBlcnJvckhhbmRsZXIsIGZhbHNlKTtcbiAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmtpdGZ1bGxzY3JlZW5lcnJvcicsIGVycm9ySGFuZGxlciwgZmFsc2UpO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vemZ1bGxzY3JlZW5lcnJvcicsIGVycm9ySGFuZGxlciwgZmFsc2UpO1xuICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbXNmdWxsc2NyZWVuZXJyb3InLCBlcnJvckhhbmRsZXIsIGZhbHNlKTtcbiAgfVxufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5yZW1vdmVGdWxsc2NyZWVuTGlzdGVuZXJzXyA9IGZ1bmN0aW9uKCkge1xuICBpZiAoIXRoaXMuZnVsbHNjcmVlbkV2ZW50VGFyZ2V0XylcbiAgICByZXR1cm47XG5cbiAgdmFyIGVsZW1lbnQgPSB0aGlzLmZ1bGxzY3JlZW5FdmVudFRhcmdldF87XG5cbiAgaWYgKHRoaXMuZnVsbHNjcmVlbkNoYW5nZUhhbmRsZXJfKSB7XG4gICAgdmFyIGNoYW5nZUhhbmRsZXIgPSB0aGlzLmZ1bGxzY3JlZW5DaGFuZ2VIYW5kbGVyXztcbiAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Z1bGxzY3JlZW5jaGFuZ2UnLCBjaGFuZ2VIYW5kbGVyLCBmYWxzZSk7XG4gICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd3ZWJraXRmdWxsc2NyZWVuY2hhbmdlJywgY2hhbmdlSGFuZGxlciwgZmFsc2UpO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vemZ1bGxzY3JlZW5jaGFuZ2UnLCBjaGFuZ2VIYW5kbGVyLCBmYWxzZSk7XG4gICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtc2Z1bGxzY3JlZW5jaGFuZ2UnLCBjaGFuZ2VIYW5kbGVyLCBmYWxzZSk7XG4gIH1cblxuICBpZiAodGhpcy5mdWxsc2NyZWVuRXJyb3JIYW5kbGVyXykge1xuICAgIHZhciBlcnJvckhhbmRsZXIgPSB0aGlzLmZ1bGxzY3JlZW5FcnJvckhhbmRsZXJfO1xuICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignZnVsbHNjcmVlbmVycm9yJywgZXJyb3JIYW5kbGVyLCBmYWxzZSk7XG4gICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd3ZWJraXRmdWxsc2NyZWVuZXJyb3InLCBlcnJvckhhbmRsZXIsIGZhbHNlKTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3pmdWxsc2NyZWVuZXJyb3InLCBlcnJvckhhbmRsZXIsIGZhbHNlKTtcbiAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21zZnVsbHNjcmVlbmVycm9yJywgZXJyb3JIYW5kbGVyLCBmYWxzZSk7XG4gIH1cblxuICB0aGlzLmZ1bGxzY3JlZW5FdmVudFRhcmdldF8gPSBudWxsO1xuICB0aGlzLmZ1bGxzY3JlZW5DaGFuZ2VIYW5kbGVyXyA9IG51bGw7XG4gIHRoaXMuZnVsbHNjcmVlbkVycm9ySGFuZGxlcl8gPSBudWxsO1xufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5iZWdpblByZXNlbnRfID0gZnVuY3Rpb24oKSB7XG4gIC8vIE92ZXJyaWRlIHRvIGFkZCBjdXN0b20gYmVoYXZpb3Igd2hlbiBwcmVzZW50YXRpb24gYmVnaW5zLlxufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5lbmRQcmVzZW50XyA9IGZ1bmN0aW9uKCkge1xuICAvLyBPdmVycmlkZSB0byBhZGQgY3VzdG9tIGJlaGF2aW9yIHdoZW4gcHJlc2VudGF0aW9uIGVuZHMuXG59O1xuXG5WUkRpc3BsYXkucHJvdG90eXBlLnN1Ym1pdEZyYW1lID0gZnVuY3Rpb24ocG9zZSkge1xuICAvLyBPdmVycmlkZSB0byBhZGQgY3VzdG9tIGJlaGF2aW9yIGZvciBmcmFtZSBzdWJtaXNzaW9uLlxufTtcblxuVlJEaXNwbGF5LnByb3RvdHlwZS5nZXRFeWVQYXJhbWV0ZXJzID0gZnVuY3Rpb24od2hpY2hFeWUpIHtcbiAgLy8gT3ZlcnJpZGUgdG8gcmV0dXJuIGFjY3VyYXRlIGV5ZSBwYXJhbWV0ZXJzIGlzIGNhblByZXNlbnQgaXMgdHJ1ZS5cbiAgcmV0dXJuIG51bGw7XG59O1xuXG4vKlxuICogRGVwcmVjYXRlZCBjbGFzc2VzXG4gKi9cblxuLyoqXG4gKiBUaGUgYmFzZSBjbGFzcyBmb3IgYWxsIFZSIGRldmljZXMuIChEZXByZWNhdGVkKVxuICovXG5mdW5jdGlvbiBWUkRldmljZSgpIHtcbiAgdGhpcy5pc1BvbHlmaWxsZWQgPSB0cnVlO1xuICB0aGlzLmhhcmR3YXJlVW5pdElkID0gJ3dlYnZyLXBvbHlmaWxsIGhhcmR3YXJlVW5pdElkJztcbiAgdGhpcy5kZXZpY2VJZCA9ICd3ZWJ2ci1wb2x5ZmlsbCBkZXZpY2VJZCc7XG4gIHRoaXMuZGV2aWNlTmFtZSA9ICd3ZWJ2ci1wb2x5ZmlsbCBkZXZpY2VOYW1lJztcbn1cblxuLyoqXG4gKiBUaGUgYmFzZSBjbGFzcyBmb3IgYWxsIFZSIEhNRCBkZXZpY2VzLiAoRGVwcmVjYXRlZClcbiAqL1xuZnVuY3Rpb24gSE1EVlJEZXZpY2UoKSB7XG59XG5ITURWUkRldmljZS5wcm90b3R5cGUgPSBuZXcgVlJEZXZpY2UoKTtcblxuLyoqXG4gKiBUaGUgYmFzZSBjbGFzcyBmb3IgYWxsIFZSIHBvc2l0aW9uIHNlbnNvciBkZXZpY2VzLiAoRGVwcmVjYXRlZClcbiAqL1xuZnVuY3Rpb24gUG9zaXRpb25TZW5zb3JWUkRldmljZSgpIHtcbn1cblBvc2l0aW9uU2Vuc29yVlJEZXZpY2UucHJvdG90eXBlID0gbmV3IFZSRGV2aWNlKCk7XG5cbm1vZHVsZS5leHBvcnRzLlZSRGlzcGxheSA9IFZSRGlzcGxheTtcbm1vZHVsZS5leHBvcnRzLlZSRGV2aWNlID0gVlJEZXZpY2U7XG5tb2R1bGUuZXhwb3J0cy5ITURWUkRldmljZSA9IEhNRFZSRGV2aWNlO1xubW9kdWxlLmV4cG9ydHMuUG9zaXRpb25TZW5zb3JWUkRldmljZSA9IFBvc2l0aW9uU2Vuc29yVlJEZXZpY2U7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgQ2FyZGJvYXJkVUkgPSByZXF1aXJlKCcuL2NhcmRib2FyZC11aS5qcycpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcbnZhciBXR0xVUHJlc2VydmVHTFN0YXRlID0gcmVxdWlyZSgnLi9kZXBzL3dnbHUtcHJlc2VydmUtc3RhdGUuanMnKTtcblxudmFyIGRpc3RvcnRpb25WUyA9IFtcbiAgJ2F0dHJpYnV0ZSB2ZWMyIHBvc2l0aW9uOycsXG4gICdhdHRyaWJ1dGUgdmVjMyB0ZXhDb29yZDsnLFxuXG4gICd2YXJ5aW5nIHZlYzIgdlRleENvb3JkOycsXG5cbiAgJ3VuaWZvcm0gdmVjNCB2aWV3cG9ydE9mZnNldFNjYWxlWzJdOycsXG5cbiAgJ3ZvaWQgbWFpbigpIHsnLFxuICAnICB2ZWM0IHZpZXdwb3J0ID0gdmlld3BvcnRPZmZzZXRTY2FsZVtpbnQodGV4Q29vcmQueildOycsXG4gICcgIHZUZXhDb29yZCA9ICh0ZXhDb29yZC54eSAqIHZpZXdwb3J0Lnp3KSArIHZpZXdwb3J0Lnh5OycsXG4gICcgIGdsX1Bvc2l0aW9uID0gdmVjNCggcG9zaXRpb24sIDEuMCwgMS4wICk7JyxcbiAgJ30nLFxuXS5qb2luKCdcXG4nKTtcblxudmFyIGRpc3RvcnRpb25GUyA9IFtcbiAgJ3ByZWNpc2lvbiBtZWRpdW1wIGZsb2F0OycsXG4gICd1bmlmb3JtIHNhbXBsZXIyRCBkaWZmdXNlOycsXG5cbiAgJ3ZhcnlpbmcgdmVjMiB2VGV4Q29vcmQ7JyxcblxuICAndm9pZCBtYWluKCkgeycsXG4gICcgIGdsX0ZyYWdDb2xvciA9IHRleHR1cmUyRChkaWZmdXNlLCB2VGV4Q29vcmQpOycsXG4gICd9Jyxcbl0uam9pbignXFxuJyk7XG5cbi8qKlxuICogQSBtZXNoLWJhc2VkIGRpc3RvcnRlci5cbiAqL1xuZnVuY3Rpb24gQ2FyZGJvYXJkRGlzdG9ydGVyKGdsKSB7XG4gIHRoaXMuZ2wgPSBnbDtcbiAgdGhpcy5jdHhBdHRyaWJzID0gZ2wuZ2V0Q29udGV4dEF0dHJpYnV0ZXMoKTtcblxuICB0aGlzLm1lc2hXaWR0aCA9IDIwO1xuICB0aGlzLm1lc2hIZWlnaHQgPSAyMDtcblxuICB0aGlzLmJ1ZmZlclNjYWxlID0gV2ViVlJDb25maWcuQlVGRkVSX1NDQUxFID8gV2ViVlJDb25maWcuQlVGRkVSX1NDQUxFIDogMS4wO1xuXG4gIHRoaXMuYnVmZmVyV2lkdGggPSBnbC5kcmF3aW5nQnVmZmVyV2lkdGg7XG4gIHRoaXMuYnVmZmVySGVpZ2h0ID0gZ2wuZHJhd2luZ0J1ZmZlckhlaWdodDtcblxuICAvLyBQYXRjaGluZyBzdXBwb3J0XG4gIHRoaXMucmVhbEJpbmRGcmFtZWJ1ZmZlciA9IGdsLmJpbmRGcmFtZWJ1ZmZlcjtcbiAgdGhpcy5yZWFsRW5hYmxlID0gZ2wuZW5hYmxlO1xuICB0aGlzLnJlYWxEaXNhYmxlID0gZ2wuZGlzYWJsZTtcbiAgdGhpcy5yZWFsQ29sb3JNYXNrID0gZ2wuY29sb3JNYXNrO1xuICB0aGlzLnJlYWxDbGVhckNvbG9yID0gZ2wuY2xlYXJDb2xvcjtcbiAgdGhpcy5yZWFsVmlld3BvcnQgPSBnbC52aWV3cG9ydDtcblxuICBpZiAoIVV0aWwuaXNJT1MoKSkge1xuICAgIHRoaXMucmVhbENhbnZhc1dpZHRoID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihnbC5jYW52YXMuX19wcm90b19fLCAnd2lkdGgnKTtcbiAgICB0aGlzLnJlYWxDYW52YXNIZWlnaHQgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGdsLmNhbnZhcy5fX3Byb3RvX18sICdoZWlnaHQnKTtcbiAgfVxuXG4gIHRoaXMuaXNQYXRjaGVkID0gZmFsc2U7XG5cbiAgLy8gU3RhdGUgdHJhY2tpbmdcbiAgdGhpcy5sYXN0Qm91bmRGcmFtZWJ1ZmZlciA9IG51bGw7XG4gIHRoaXMuY3VsbEZhY2UgPSBmYWxzZTtcbiAgdGhpcy5kZXB0aFRlc3QgPSBmYWxzZTtcbiAgdGhpcy5ibGVuZCA9IGZhbHNlO1xuICB0aGlzLnNjaXNzb3JUZXN0ID0gZmFsc2U7XG4gIHRoaXMuc3RlbmNpbFRlc3QgPSBmYWxzZTtcbiAgdGhpcy52aWV3cG9ydCA9IFswLCAwLCAwLCAwXTtcbiAgdGhpcy5jb2xvck1hc2sgPSBbdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZV07XG4gIHRoaXMuY2xlYXJDb2xvciA9IFswLCAwLCAwLCAwXTtcblxuICB0aGlzLmF0dHJpYnMgPSB7XG4gICAgcG9zaXRpb246IDAsXG4gICAgdGV4Q29vcmQ6IDFcbiAgfTtcbiAgdGhpcy5wcm9ncmFtID0gVXRpbC5saW5rUHJvZ3JhbShnbCwgZGlzdG9ydGlvblZTLCBkaXN0b3J0aW9uRlMsIHRoaXMuYXR0cmlicyk7XG4gIHRoaXMudW5pZm9ybXMgPSBVdGlsLmdldFByb2dyYW1Vbmlmb3JtcyhnbCwgdGhpcy5wcm9ncmFtKTtcblxuICB0aGlzLnZpZXdwb3J0T2Zmc2V0U2NhbGUgPSBuZXcgRmxvYXQzMkFycmF5KDgpO1xuICB0aGlzLnNldFRleHR1cmVCb3VuZHMoKTtcblxuICB0aGlzLnZlcnRleEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICB0aGlzLmluZGV4QnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG4gIHRoaXMuaW5kZXhDb3VudCA9IDA7XG5cbiAgdGhpcy5yZW5kZXJUYXJnZXQgPSBnbC5jcmVhdGVUZXh0dXJlKCk7XG4gIHRoaXMuZnJhbWVidWZmZXIgPSBnbC5jcmVhdGVGcmFtZWJ1ZmZlcigpO1xuXG4gIHRoaXMuZGVwdGhTdGVuY2lsQnVmZmVyID0gbnVsbDtcbiAgdGhpcy5kZXB0aEJ1ZmZlciA9IG51bGw7XG4gIHRoaXMuc3RlbmNpbEJ1ZmZlciA9IG51bGw7XG5cbiAgaWYgKHRoaXMuY3R4QXR0cmlicy5kZXB0aCAmJiB0aGlzLmN0eEF0dHJpYnMuc3RlbmNpbCkge1xuICAgIHRoaXMuZGVwdGhTdGVuY2lsQnVmZmVyID0gZ2wuY3JlYXRlUmVuZGVyYnVmZmVyKCk7XG4gIH0gZWxzZSBpZiAodGhpcy5jdHhBdHRyaWJzLmRlcHRoKSB7XG4gICAgdGhpcy5kZXB0aEJ1ZmZlciA9IGdsLmNyZWF0ZVJlbmRlcmJ1ZmZlcigpO1xuICB9IGVsc2UgaWYgKHRoaXMuY3R4QXR0cmlicy5zdGVuY2lsKSB7XG4gICAgdGhpcy5zdGVuY2lsQnVmZmVyID0gZ2wuY3JlYXRlUmVuZGVyYnVmZmVyKCk7XG4gIH1cblxuICB0aGlzLnBhdGNoKCk7XG5cbiAgdGhpcy5vblJlc2l6ZSgpO1xuXG4gIHRoaXMuY2FyZGJvYXJkVUkgPSBuZXcgQ2FyZGJvYXJkVUkoZ2wpO1xufTtcblxuLyoqXG4gKiBUZWFycyBkb3duIGFsbCB0aGUgcmVzb3VyY2VzIGNyZWF0ZWQgYnkgdGhlIGRpc3RvcnRlciBhbmQgcmVtb3ZlcyBhbnlcbiAqIHBhdGNoZXMuXG4gKi9cbkNhcmRib2FyZERpc3RvcnRlci5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZ2wgPSB0aGlzLmdsO1xuXG4gIHRoaXMudW5wYXRjaCgpO1xuXG4gIGdsLmRlbGV0ZVByb2dyYW0odGhpcy5wcm9ncmFtKTtcbiAgZ2wuZGVsZXRlQnVmZmVyKHRoaXMudmVydGV4QnVmZmVyKTtcbiAgZ2wuZGVsZXRlQnVmZmVyKHRoaXMuaW5kZXhCdWZmZXIpO1xuICBnbC5kZWxldGVUZXh0dXJlKHRoaXMucmVuZGVyVGFyZ2V0KTtcbiAgZ2wuZGVsZXRlRnJhbWVidWZmZXIodGhpcy5mcmFtZWJ1ZmZlcik7XG4gIGlmICh0aGlzLmRlcHRoU3RlbmNpbEJ1ZmZlcikge1xuICAgIGdsLmRlbGV0ZVJlbmRlcmJ1ZmZlcih0aGlzLmRlcHRoU3RlbmNpbEJ1ZmZlcik7XG4gIH1cbiAgaWYgKHRoaXMuZGVwdGhCdWZmZXIpIHtcbiAgICBnbC5kZWxldGVSZW5kZXJidWZmZXIodGhpcy5kZXB0aEJ1ZmZlcik7XG4gIH1cbiAgaWYgKHRoaXMuc3RlbmNpbEJ1ZmZlcikge1xuICAgIGdsLmRlbGV0ZVJlbmRlcmJ1ZmZlcih0aGlzLnN0ZW5jaWxCdWZmZXIpO1xuICB9XG5cbiAgdGhpcy5jYXJkYm9hcmRVSS5kZXN0cm95KCk7XG59O1xuXG5cbi8qKlxuICogUmVzaXplcyB0aGUgYmFja2J1ZmZlciB0byBtYXRjaCB0aGUgY2FudmFzIHdpZHRoIGFuZCBoZWlnaHQuXG4gKi9cbkNhcmRib2FyZERpc3RvcnRlci5wcm90b3R5cGUub25SZXNpemUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGdsID0gdGhpcy5nbDtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHZhciBnbFN0YXRlID0gW1xuICAgIGdsLlJFTkRFUkJVRkZFUl9CSU5ESU5HLFxuICAgIGdsLlRFWFRVUkVfQklORElOR18yRCwgZ2wuVEVYVFVSRTBcbiAgXTtcblxuICBXR0xVUHJlc2VydmVHTFN0YXRlKGdsLCBnbFN0YXRlLCBmdW5jdGlvbihnbCkge1xuICAgIC8vIEJpbmQgcmVhbCBiYWNrYnVmZmVyIGFuZCBjbGVhciBpdCBvbmNlLiBXZSBkb24ndCBuZWVkIHRvIGNsZWFyIGl0IGFnYWluXG4gICAgLy8gYWZ0ZXIgdGhhdCBiZWNhdXNlIHdlJ3JlIG92ZXJ3cml0aW5nIHRoZSBzYW1lIGFyZWEgZXZlcnkgZnJhbWUuXG4gICAgc2VsZi5yZWFsQmluZEZyYW1lYnVmZmVyLmNhbGwoZ2wsIGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcblxuICAgIC8vIFB1dCB0aGluZ3MgaW4gYSBnb29kIHN0YXRlXG4gICAgaWYgKHNlbGYuc2Npc3NvclRlc3QpIHsgc2VsZi5yZWFsRGlzYWJsZS5jYWxsKGdsLCBnbC5TQ0lTU09SX1RFU1QpOyB9XG4gICAgc2VsZi5yZWFsQ29sb3JNYXNrLmNhbGwoZ2wsIHRydWUsIHRydWUsIHRydWUsIHRydWUpO1xuICAgIHNlbGYucmVhbFZpZXdwb3J0LmNhbGwoZ2wsIDAsIDAsIGdsLmRyYXdpbmdCdWZmZXJXaWR0aCwgZ2wuZHJhd2luZ0J1ZmZlckhlaWdodCk7XG4gICAgc2VsZi5yZWFsQ2xlYXJDb2xvci5jYWxsKGdsLCAwLCAwLCAwLCAxKTtcblxuICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpO1xuXG4gICAgLy8gTm93IGJpbmQgYW5kIHJlc2l6ZSB0aGUgZmFrZSBiYWNrYnVmZmVyXG4gICAgc2VsZi5yZWFsQmluZEZyYW1lYnVmZmVyLmNhbGwoZ2wsIGdsLkZSQU1FQlVGRkVSLCBzZWxmLmZyYW1lYnVmZmVyKTtcblxuICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHNlbGYucmVuZGVyVGFyZ2V0KTtcbiAgICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIDAsIHNlbGYuY3R4QXR0cmlicy5hbHBoYSA/IGdsLlJHQkEgOiBnbC5SR0IsXG4gICAgICAgIHNlbGYuYnVmZmVyV2lkdGgsIHNlbGYuYnVmZmVySGVpZ2h0LCAwLFxuICAgICAgICBzZWxmLmN0eEF0dHJpYnMuYWxwaGEgPyBnbC5SR0JBIDogZ2wuUkdCLCBnbC5VTlNJR05FRF9CWVRFLCBudWxsKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTElORUFSKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTElORUFSKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5DTEFNUF9UT19FREdFKTtcbiAgICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9ULCBnbC5DTEFNUF9UT19FREdFKTtcbiAgICBnbC5mcmFtZWJ1ZmZlclRleHR1cmUyRChnbC5GUkFNRUJVRkZFUiwgZ2wuQ09MT1JfQVRUQUNITUVOVDAsIGdsLlRFWFRVUkVfMkQsIHNlbGYucmVuZGVyVGFyZ2V0LCAwKTtcblxuICAgIGlmIChzZWxmLmN0eEF0dHJpYnMuZGVwdGggJiYgc2VsZi5jdHhBdHRyaWJzLnN0ZW5jaWwpIHtcbiAgICAgIGdsLmJpbmRSZW5kZXJidWZmZXIoZ2wuUkVOREVSQlVGRkVSLCBzZWxmLmRlcHRoU3RlbmNpbEJ1ZmZlcik7XG4gICAgICBnbC5yZW5kZXJidWZmZXJTdG9yYWdlKGdsLlJFTkRFUkJVRkZFUiwgZ2wuREVQVEhfU1RFTkNJTCxcbiAgICAgICAgICBzZWxmLmJ1ZmZlcldpZHRoLCBzZWxmLmJ1ZmZlckhlaWdodCk7XG4gICAgICBnbC5mcmFtZWJ1ZmZlclJlbmRlcmJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgZ2wuREVQVEhfU1RFTkNJTF9BVFRBQ0hNRU5ULFxuICAgICAgICAgIGdsLlJFTkRFUkJVRkZFUiwgc2VsZi5kZXB0aFN0ZW5jaWxCdWZmZXIpO1xuICAgIH0gZWxzZSBpZiAoc2VsZi5jdHhBdHRyaWJzLmRlcHRoKSB7XG4gICAgICBnbC5iaW5kUmVuZGVyYnVmZmVyKGdsLlJFTkRFUkJVRkZFUiwgc2VsZi5kZXB0aEJ1ZmZlcik7XG4gICAgICBnbC5yZW5kZXJidWZmZXJTdG9yYWdlKGdsLlJFTkRFUkJVRkZFUiwgZ2wuREVQVEhfQ09NUE9ORU5UMTYsXG4gICAgICAgICAgc2VsZi5idWZmZXJXaWR0aCwgc2VsZi5idWZmZXJIZWlnaHQpO1xuICAgICAgZ2wuZnJhbWVidWZmZXJSZW5kZXJidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIGdsLkRFUFRIX0FUVEFDSE1FTlQsXG4gICAgICAgICAgZ2wuUkVOREVSQlVGRkVSLCBzZWxmLmRlcHRoQnVmZmVyKTtcbiAgICB9IGVsc2UgaWYgKHNlbGYuY3R4QXR0cmlicy5zdGVuY2lsKSB7XG4gICAgICBnbC5iaW5kUmVuZGVyYnVmZmVyKGdsLlJFTkRFUkJVRkZFUiwgc2VsZi5zdGVuY2lsQnVmZmVyKTtcbiAgICAgIGdsLnJlbmRlcmJ1ZmZlclN0b3JhZ2UoZ2wuUkVOREVSQlVGRkVSLCBnbC5TVEVOQ0lMX0lOREVYOCxcbiAgICAgICAgICBzZWxmLmJ1ZmZlcldpZHRoLCBzZWxmLmJ1ZmZlckhlaWdodCk7XG4gICAgICBnbC5mcmFtZWJ1ZmZlclJlbmRlcmJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgZ2wuU1RFTkNJTF9BVFRBQ0hNRU5ULFxuICAgICAgICAgIGdsLlJFTkRFUkJVRkZFUiwgc2VsZi5zdGVuY2lsQnVmZmVyKTtcbiAgICB9XG5cbiAgICBpZiAoIWdsLmNoZWNrRnJhbWVidWZmZXJTdGF0dXMoZ2wuRlJBTUVCVUZGRVIpID09PSBnbC5GUkFNRUJVRkZFUl9DT01QTEVURSkge1xuICAgICAgY29uc29sZS5lcnJvcignRnJhbWVidWZmZXIgaW5jb21wbGV0ZSEnKTtcbiAgICB9XG5cbiAgICBzZWxmLnJlYWxCaW5kRnJhbWVidWZmZXIuY2FsbChnbCwgZ2wuRlJBTUVCVUZGRVIsIHNlbGYubGFzdEJvdW5kRnJhbWVidWZmZXIpO1xuXG4gICAgaWYgKHNlbGYuc2Npc3NvclRlc3QpIHsgc2VsZi5yZWFsRW5hYmxlLmNhbGwoZ2wsIGdsLlNDSVNTT1JfVEVTVCk7IH1cblxuICAgIHNlbGYucmVhbENvbG9yTWFzay5hcHBseShnbCwgc2VsZi5jb2xvck1hc2spO1xuICAgIHNlbGYucmVhbFZpZXdwb3J0LmFwcGx5KGdsLCBzZWxmLnZpZXdwb3J0KTtcbiAgICBzZWxmLnJlYWxDbGVhckNvbG9yLmFwcGx5KGdsLCBzZWxmLmNsZWFyQ29sb3IpO1xuICB9KTtcblxuICBpZiAodGhpcy5jYXJkYm9hcmRVSSkge1xuICAgIHRoaXMuY2FyZGJvYXJkVUkub25SZXNpemUoKTtcbiAgfVxufTtcblxuQ2FyZGJvYXJkRGlzdG9ydGVyLnByb3RvdHlwZS5wYXRjaCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5pc1BhdGNoZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHZhciBjYW52YXMgPSB0aGlzLmdsLmNhbnZhcztcbiAgdmFyIGdsID0gdGhpcy5nbDtcblxuICBpZiAoIVV0aWwuaXNJT1MoKSkge1xuICAgIGNhbnZhcy53aWR0aCA9IFV0aWwuZ2V0U2NyZWVuV2lkdGgoKSAqIHRoaXMuYnVmZmVyU2NhbGU7XG4gICAgY2FudmFzLmhlaWdodCA9IFV0aWwuZ2V0U2NyZWVuSGVpZ2h0KCkgKiB0aGlzLmJ1ZmZlclNjYWxlO1xuXG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNhbnZhcywgJ3dpZHRoJywge1xuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBzZWxmLmJ1ZmZlcldpZHRoO1xuICAgICAgfSxcbiAgICAgIHNldDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgc2VsZi5idWZmZXJXaWR0aCA9IHZhbHVlO1xuICAgICAgICBzZWxmLm9uUmVzaXplKCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2FudmFzLCAnaGVpZ2h0Jywge1xuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBzZWxmLmJ1ZmZlckhlaWdodDtcbiAgICAgIH0sXG4gICAgICBzZXQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHNlbGYuYnVmZmVySGVpZ2h0ID0gdmFsdWU7XG4gICAgICAgIHNlbGYub25SZXNpemUoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHRoaXMubGFzdEJvdW5kRnJhbWVidWZmZXIgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuRlJBTUVCVUZGRVJfQklORElORyk7XG5cbiAgaWYgKHRoaXMubGFzdEJvdW5kRnJhbWVidWZmZXIgPT0gbnVsbCkge1xuICAgIHRoaXMubGFzdEJvdW5kRnJhbWVidWZmZXIgPSB0aGlzLmZyYW1lYnVmZmVyO1xuICAgIHRoaXMuZ2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCB0aGlzLmZyYW1lYnVmZmVyKTtcbiAgfVxuXG4gIHRoaXMuZ2wuYmluZEZyYW1lYnVmZmVyID0gZnVuY3Rpb24odGFyZ2V0LCBmcmFtZWJ1ZmZlcikge1xuICAgIHNlbGYubGFzdEJvdW5kRnJhbWVidWZmZXIgPSBmcmFtZWJ1ZmZlciA/IGZyYW1lYnVmZmVyIDogc2VsZi5mcmFtZWJ1ZmZlcjtcbiAgICAvLyBTaWxlbnRseSBtYWtlIGNhbGxzIHRvIGJpbmQgdGhlIGRlZmF1bHQgZnJhbWVidWZmZXIgYmluZCBvdXJzIGluc3RlYWQuXG4gICAgc2VsZi5yZWFsQmluZEZyYW1lYnVmZmVyLmNhbGwoZ2wsIHRhcmdldCwgc2VsZi5sYXN0Qm91bmRGcmFtZWJ1ZmZlcik7XG4gIH07XG5cbiAgdGhpcy5jdWxsRmFjZSA9IGdsLmdldFBhcmFtZXRlcihnbC5DVUxMX0ZBQ0UpO1xuICB0aGlzLmRlcHRoVGVzdCA9IGdsLmdldFBhcmFtZXRlcihnbC5ERVBUSF9URVNUKTtcbiAgdGhpcy5ibGVuZCA9IGdsLmdldFBhcmFtZXRlcihnbC5CTEVORCk7XG4gIHRoaXMuc2Npc3NvclRlc3QgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuU0NJU1NPUl9URVNUKTtcbiAgdGhpcy5zdGVuY2lsVGVzdCA9IGdsLmdldFBhcmFtZXRlcihnbC5TVEVOQ0lMX1RFU1QpO1xuXG4gIGdsLmVuYWJsZSA9IGZ1bmN0aW9uKHBuYW1lKSB7XG4gICAgc3dpdGNoIChwbmFtZSkge1xuICAgICAgY2FzZSBnbC5DVUxMX0ZBQ0U6IHNlbGYuY3VsbEZhY2UgPSB0cnVlOyBicmVhaztcbiAgICAgIGNhc2UgZ2wuREVQVEhfVEVTVDogc2VsZi5kZXB0aFRlc3QgPSB0cnVlOyBicmVhaztcbiAgICAgIGNhc2UgZ2wuQkxFTkQ6IHNlbGYuYmxlbmQgPSB0cnVlOyBicmVhaztcbiAgICAgIGNhc2UgZ2wuU0NJU1NPUl9URVNUOiBzZWxmLnNjaXNzb3JUZXN0ID0gdHJ1ZTsgYnJlYWs7XG4gICAgICBjYXNlIGdsLlNURU5DSUxfVEVTVDogc2VsZi5zdGVuY2lsVGVzdCA9IHRydWU7IGJyZWFrO1xuICAgIH1cbiAgICBzZWxmLnJlYWxFbmFibGUuY2FsbChnbCwgcG5hbWUpO1xuICB9O1xuXG4gIGdsLmRpc2FibGUgPSBmdW5jdGlvbihwbmFtZSkge1xuICAgIHN3aXRjaCAocG5hbWUpIHtcbiAgICAgIGNhc2UgZ2wuQ1VMTF9GQUNFOiBzZWxmLmN1bGxGYWNlID0gZmFsc2U7IGJyZWFrO1xuICAgICAgY2FzZSBnbC5ERVBUSF9URVNUOiBzZWxmLmRlcHRoVGVzdCA9IGZhbHNlOyBicmVhaztcbiAgICAgIGNhc2UgZ2wuQkxFTkQ6IHNlbGYuYmxlbmQgPSBmYWxzZTsgYnJlYWs7XG4gICAgICBjYXNlIGdsLlNDSVNTT1JfVEVTVDogc2VsZi5zY2lzc29yVGVzdCA9IGZhbHNlOyBicmVhaztcbiAgICAgIGNhc2UgZ2wuU1RFTkNJTF9URVNUOiBzZWxmLnN0ZW5jaWxUZXN0ID0gZmFsc2U7IGJyZWFrO1xuICAgIH1cbiAgICBzZWxmLnJlYWxEaXNhYmxlLmNhbGwoZ2wsIHBuYW1lKTtcbiAgfTtcblxuICB0aGlzLmNvbG9yTWFzayA9IGdsLmdldFBhcmFtZXRlcihnbC5DT0xPUl9XUklURU1BU0spO1xuICBnbC5jb2xvck1hc2sgPSBmdW5jdGlvbihyLCBnLCBiLCBhKSB7XG4gICAgc2VsZi5jb2xvck1hc2tbMF0gPSByO1xuICAgIHNlbGYuY29sb3JNYXNrWzFdID0gZztcbiAgICBzZWxmLmNvbG9yTWFza1syXSA9IGI7XG4gICAgc2VsZi5jb2xvck1hc2tbM10gPSBhO1xuICAgIHNlbGYucmVhbENvbG9yTWFzay5jYWxsKGdsLCByLCBnLCBiLCBhKTtcbiAgfTtcblxuICB0aGlzLmNsZWFyQ29sb3IgPSBnbC5nZXRQYXJhbWV0ZXIoZ2wuQ09MT1JfQ0xFQVJfVkFMVUUpO1xuICBnbC5jbGVhckNvbG9yID0gZnVuY3Rpb24ociwgZywgYiwgYSkge1xuICAgIHNlbGYuY2xlYXJDb2xvclswXSA9IHI7XG4gICAgc2VsZi5jbGVhckNvbG9yWzFdID0gZztcbiAgICBzZWxmLmNsZWFyQ29sb3JbMl0gPSBiO1xuICAgIHNlbGYuY2xlYXJDb2xvclszXSA9IGE7XG4gICAgc2VsZi5yZWFsQ2xlYXJDb2xvci5jYWxsKGdsLCByLCBnLCBiLCBhKTtcbiAgfTtcblxuICB0aGlzLnZpZXdwb3J0ID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLlZJRVdQT1JUKTtcbiAgZ2wudmlld3BvcnQgPSBmdW5jdGlvbih4LCB5LCB3LCBoKSB7XG4gICAgc2VsZi52aWV3cG9ydFswXSA9IHg7XG4gICAgc2VsZi52aWV3cG9ydFsxXSA9IHk7XG4gICAgc2VsZi52aWV3cG9ydFsyXSA9IHc7XG4gICAgc2VsZi52aWV3cG9ydFszXSA9IGg7XG4gICAgc2VsZi5yZWFsVmlld3BvcnQuY2FsbChnbCwgeCwgeSwgdywgaCk7XG4gIH07XG5cbiAgdGhpcy5pc1BhdGNoZWQgPSB0cnVlO1xufTtcblxuQ2FyZGJvYXJkRGlzdG9ydGVyLnByb3RvdHlwZS51bnBhdGNoID0gZnVuY3Rpb24oKSB7XG4gIGlmICghdGhpcy5pc1BhdGNoZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgZ2wgPSB0aGlzLmdsO1xuICB2YXIgY2FudmFzID0gdGhpcy5nbC5jYW52YXM7XG5cbiAgaWYgKCFVdGlsLmlzSU9TKCkpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoY2FudmFzLCAnd2lkdGgnLCB0aGlzLnJlYWxDYW52YXNXaWR0aCk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGNhbnZhcywgJ2hlaWdodCcsIHRoaXMucmVhbENhbnZhc0hlaWdodCk7XG4gIH1cbiAgY2FudmFzLndpZHRoID0gdGhpcy5idWZmZXJXaWR0aDtcbiAgY2FudmFzLmhlaWdodCA9IHRoaXMuYnVmZmVySGVpZ2h0O1xuXG4gIGdsLmJpbmRGcmFtZWJ1ZmZlciA9IHRoaXMucmVhbEJpbmRGcmFtZWJ1ZmZlcjtcbiAgZ2wuZW5hYmxlID0gdGhpcy5yZWFsRW5hYmxlO1xuICBnbC5kaXNhYmxlID0gdGhpcy5yZWFsRGlzYWJsZTtcbiAgZ2wuY29sb3JNYXNrID0gdGhpcy5yZWFsQ29sb3JNYXNrO1xuICBnbC5jbGVhckNvbG9yID0gdGhpcy5yZWFsQ2xlYXJDb2xvcjtcbiAgZ2wudmlld3BvcnQgPSB0aGlzLnJlYWxWaWV3cG9ydDtcblxuICAvLyBDaGVjayB0byBzZWUgaWYgb3VyIGZha2UgYmFja2J1ZmZlciBpcyBib3VuZCBhbmQgYmluZCB0aGUgcmVhbCBiYWNrYnVmZmVyXG4gIC8vIGlmIHRoYXQncyB0aGUgY2FzZS5cbiAgaWYgKHRoaXMubGFzdEJvdW5kRnJhbWVidWZmZXIgPT0gdGhpcy5mcmFtZWJ1ZmZlcikge1xuICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgbnVsbCk7XG4gIH1cblxuICB0aGlzLmlzUGF0Y2hlZCA9IGZhbHNlO1xufTtcblxuQ2FyZGJvYXJkRGlzdG9ydGVyLnByb3RvdHlwZS5zZXRUZXh0dXJlQm91bmRzID0gZnVuY3Rpb24obGVmdEJvdW5kcywgcmlnaHRCb3VuZHMpIHtcbiAgaWYgKCFsZWZ0Qm91bmRzKSB7XG4gICAgbGVmdEJvdW5kcyA9IFswLCAwLCAwLjUsIDFdO1xuICB9XG5cbiAgaWYgKCFyaWdodEJvdW5kcykge1xuICAgIHJpZ2h0Qm91bmRzID0gWzAuNSwgMCwgMC41LCAxXTtcbiAgfVxuXG4gIC8vIExlZnQgZXllXG4gIHRoaXMudmlld3BvcnRPZmZzZXRTY2FsZVswXSA9IGxlZnRCb3VuZHNbMF07IC8vIFhcbiAgdGhpcy52aWV3cG9ydE9mZnNldFNjYWxlWzFdID0gbGVmdEJvdW5kc1sxXTsgLy8gWVxuICB0aGlzLnZpZXdwb3J0T2Zmc2V0U2NhbGVbMl0gPSBsZWZ0Qm91bmRzWzJdOyAvLyBXaWR0aFxuICB0aGlzLnZpZXdwb3J0T2Zmc2V0U2NhbGVbM10gPSBsZWZ0Qm91bmRzWzNdOyAvLyBIZWlnaHRcblxuICAvLyBSaWdodCBleWVcbiAgdGhpcy52aWV3cG9ydE9mZnNldFNjYWxlWzRdID0gcmlnaHRCb3VuZHNbMF07IC8vIFhcbiAgdGhpcy52aWV3cG9ydE9mZnNldFNjYWxlWzVdID0gcmlnaHRCb3VuZHNbMV07IC8vIFlcbiAgdGhpcy52aWV3cG9ydE9mZnNldFNjYWxlWzZdID0gcmlnaHRCb3VuZHNbMl07IC8vIFdpZHRoXG4gIHRoaXMudmlld3BvcnRPZmZzZXRTY2FsZVs3XSA9IHJpZ2h0Qm91bmRzWzNdOyAvLyBIZWlnaHRcbn07XG5cbi8qKlxuICogUGVyZm9ybXMgZGlzdG9ydGlvbiBwYXNzIG9uIHRoZSBpbmplY3RlZCBiYWNrYnVmZmVyLCByZW5kZXJpbmcgaXQgdG8gdGhlIHJlYWxcbiAqIGJhY2tidWZmZXIuXG4gKi9cbkNhcmRib2FyZERpc3RvcnRlci5wcm90b3R5cGUuc3VibWl0RnJhbWUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGdsID0gdGhpcy5nbDtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHZhciBnbFN0YXRlID0gW107XG5cbiAgaWYgKCFXZWJWUkNvbmZpZy5ESVJUWV9TVUJNSVRfRlJBTUVfQklORElOR1MpIHtcbiAgICBnbFN0YXRlLnB1c2goXG4gICAgICBnbC5DVVJSRU5UX1BST0dSQU0sXG4gICAgICBnbC5BUlJBWV9CVUZGRVJfQklORElORyxcbiAgICAgIGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSX0JJTkRJTkcsXG4gICAgICBnbC5URVhUVVJFX0JJTkRJTkdfMkQsIGdsLlRFWFRVUkUwXG4gICAgKTtcbiAgfVxuXG4gIFdHTFVQcmVzZXJ2ZUdMU3RhdGUoZ2wsIGdsU3RhdGUsIGZ1bmN0aW9uKGdsKSB7XG4gICAgLy8gQmluZCB0aGUgcmVhbCBkZWZhdWx0IGZyYW1lYnVmZmVyXG4gICAgc2VsZi5yZWFsQmluZEZyYW1lYnVmZmVyLmNhbGwoZ2wsIGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcblxuICAgIC8vIE1ha2Ugc3VyZSB0aGUgR0wgc3RhdGUgaXMgaW4gYSBnb29kIHBsYWNlXG4gICAgaWYgKHNlbGYuY3VsbEZhY2UpIHsgc2VsZi5yZWFsRGlzYWJsZS5jYWxsKGdsLCBnbC5DVUxMX0ZBQ0UpOyB9XG4gICAgaWYgKHNlbGYuZGVwdGhUZXN0KSB7IHNlbGYucmVhbERpc2FibGUuY2FsbChnbCwgZ2wuREVQVEhfVEVTVCk7IH1cbiAgICBpZiAoc2VsZi5ibGVuZCkgeyBzZWxmLnJlYWxEaXNhYmxlLmNhbGwoZ2wsIGdsLkJMRU5EKTsgfVxuICAgIGlmIChzZWxmLnNjaXNzb3JUZXN0KSB7IHNlbGYucmVhbERpc2FibGUuY2FsbChnbCwgZ2wuU0NJU1NPUl9URVNUKTsgfVxuICAgIGlmIChzZWxmLnN0ZW5jaWxUZXN0KSB7IHNlbGYucmVhbERpc2FibGUuY2FsbChnbCwgZ2wuU1RFTkNJTF9URVNUKTsgfVxuICAgIHNlbGYucmVhbENvbG9yTWFzay5jYWxsKGdsLCB0cnVlLCB0cnVlLCB0cnVlLCB0cnVlKTtcbiAgICBzZWxmLnJlYWxWaWV3cG9ydC5jYWxsKGdsLCAwLCAwLCBnbC5kcmF3aW5nQnVmZmVyV2lkdGgsIGdsLmRyYXdpbmdCdWZmZXJIZWlnaHQpO1xuXG4gICAgLy8gSWYgdGhlIGJhY2tidWZmZXIgaGFzIGFuIGFscGhhIGNoYW5uZWwgY2xlYXIgZXZlcnkgZnJhbWUgc28gdGhlIHBhZ2VcbiAgICAvLyBkb2Vzbid0IHNob3cgdGhyb3VnaC5cbiAgICBpZiAoc2VsZi5jdHhBdHRyaWJzLmFscGhhIHx8IFV0aWwuaXNJT1MoKSkge1xuICAgICAgc2VsZi5yZWFsQ2xlYXJDb2xvci5jYWxsKGdsLCAwLCAwLCAwLCAxKTtcbiAgICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpO1xuICAgIH1cblxuICAgIC8vIEJpbmQgZGlzdG9ydGlvbiBwcm9ncmFtIGFuZCBtZXNoXG4gICAgZ2wudXNlUHJvZ3JhbShzZWxmLnByb2dyYW0pO1xuXG4gICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgc2VsZi5pbmRleEJ1ZmZlcik7XG5cbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgc2VsZi52ZXJ0ZXhCdWZmZXIpO1xuICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHNlbGYuYXR0cmlicy5wb3NpdGlvbik7XG4gICAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkoc2VsZi5hdHRyaWJzLnRleENvb3JkKTtcbiAgICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHNlbGYuYXR0cmlicy5wb3NpdGlvbiwgMiwgZ2wuRkxPQVQsIGZhbHNlLCAyMCwgMCk7XG4gICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzZWxmLmF0dHJpYnMudGV4Q29vcmQsIDMsIGdsLkZMT0FULCBmYWxzZSwgMjAsIDgpO1xuXG4gICAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCk7XG4gICAgZ2wudW5pZm9ybTFpKHNlbGYudW5pZm9ybXMuZGlmZnVzZSwgMCk7XG4gICAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgc2VsZi5yZW5kZXJUYXJnZXQpO1xuXG4gICAgZ2wudW5pZm9ybTRmdihzZWxmLnVuaWZvcm1zLnZpZXdwb3J0T2Zmc2V0U2NhbGUsIHNlbGYudmlld3BvcnRPZmZzZXRTY2FsZSk7XG5cbiAgICAvLyBEcmF3cyBib3RoIGV5ZXNcbiAgICBnbC5kcmF3RWxlbWVudHMoZ2wuVFJJQU5HTEVTLCBzZWxmLmluZGV4Q291bnQsIGdsLlVOU0lHTkVEX1NIT1JULCAwKTtcblxuICAgIHNlbGYuY2FyZGJvYXJkVUkucmVuZGVyTm9TdGF0ZSgpO1xuXG4gICAgLy8gQmluZCB0aGUgZmFrZSBkZWZhdWx0IGZyYW1lYnVmZmVyIGFnYWluXG4gICAgc2VsZi5yZWFsQmluZEZyYW1lYnVmZmVyLmNhbGwoc2VsZi5nbCwgZ2wuRlJBTUVCVUZGRVIsIHNlbGYuZnJhbWVidWZmZXIpO1xuXG4gICAgLy8gSWYgcHJlc2VydmVEcmF3aW5nQnVmZmVyID09IGZhbHNlIGNsZWFyIHRoZSBmcmFtZWJ1ZmZlclxuICAgIGlmICghc2VsZi5jdHhBdHRyaWJzLnByZXNlcnZlRHJhd2luZ0J1ZmZlcikge1xuICAgICAgc2VsZi5yZWFsQ2xlYXJDb2xvci5jYWxsKGdsLCAwLCAwLCAwLCAwKTtcbiAgICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpO1xuICAgIH1cblxuICAgIGlmICghV2ViVlJDb25maWcuRElSVFlfU1VCTUlUX0ZSQU1FX0JJTkRJTkdTKSB7XG4gICAgICBzZWxmLnJlYWxCaW5kRnJhbWVidWZmZXIuY2FsbChnbCwgZ2wuRlJBTUVCVUZGRVIsIHNlbGYubGFzdEJvdW5kRnJhbWVidWZmZXIpO1xuICAgIH1cblxuICAgIC8vIFJlc3RvcmUgc3RhdGVcbiAgICBpZiAoc2VsZi5jdWxsRmFjZSkgeyBzZWxmLnJlYWxFbmFibGUuY2FsbChnbCwgZ2wuQ1VMTF9GQUNFKTsgfVxuICAgIGlmIChzZWxmLmRlcHRoVGVzdCkgeyBzZWxmLnJlYWxFbmFibGUuY2FsbChnbCwgZ2wuREVQVEhfVEVTVCk7IH1cbiAgICBpZiAoc2VsZi5ibGVuZCkgeyBzZWxmLnJlYWxFbmFibGUuY2FsbChnbCwgZ2wuQkxFTkQpOyB9XG4gICAgaWYgKHNlbGYuc2Npc3NvclRlc3QpIHsgc2VsZi5yZWFsRW5hYmxlLmNhbGwoZ2wsIGdsLlNDSVNTT1JfVEVTVCk7IH1cbiAgICBpZiAoc2VsZi5zdGVuY2lsVGVzdCkgeyBzZWxmLnJlYWxFbmFibGUuY2FsbChnbCwgZ2wuU1RFTkNJTF9URVNUKTsgfVxuXG4gICAgc2VsZi5yZWFsQ29sb3JNYXNrLmFwcGx5KGdsLCBzZWxmLmNvbG9yTWFzayk7XG4gICAgc2VsZi5yZWFsVmlld3BvcnQuYXBwbHkoZ2wsIHNlbGYudmlld3BvcnQpO1xuICAgIGlmIChzZWxmLmN0eEF0dHJpYnMuYWxwaGEgfHwgIXNlbGYuY3R4QXR0cmlicy5wcmVzZXJ2ZURyYXdpbmdCdWZmZXIpIHtcbiAgICAgIHNlbGYucmVhbENsZWFyQ29sb3IuYXBwbHkoZ2wsIHNlbGYuY2xlYXJDb2xvcik7XG4gICAgfVxuICB9KTtcblxuICAvLyBXb3JrYXJvdW5kIGZvciB0aGUgZmFjdCB0aGF0IFNhZmFyaSBkb2Vzbid0IGFsbG93IHVzIHRvIHBhdGNoIHRoZSBjYW52YXNcbiAgLy8gd2lkdGggYW5kIGhlaWdodCBjb3JyZWN0bHkuIEFmdGVyIGVhY2ggc3VibWl0IGZyYW1lIGNoZWNrIHRvIHNlZSB3aGF0IHRoZVxuICAvLyByZWFsIGJhY2tidWZmZXIgc2l6ZSBoYXMgYmVlbiBzZXQgdG8gYW5kIHJlc2l6ZSB0aGUgZmFrZSBiYWNrYnVmZmVyIHNpemVcbiAgLy8gdG8gbWF0Y2guXG4gIGlmIChVdGlsLmlzSU9TKCkpIHtcbiAgICB2YXIgY2FudmFzID0gZ2wuY2FudmFzO1xuICAgIGlmIChjYW52YXMud2lkdGggIT0gc2VsZi5idWZmZXJXaWR0aCB8fCBjYW52YXMuaGVpZ2h0ICE9IHNlbGYuYnVmZmVySGVpZ2h0KSB7XG4gICAgICBzZWxmLmJ1ZmZlcldpZHRoID0gY2FudmFzLndpZHRoO1xuICAgICAgc2VsZi5idWZmZXJIZWlnaHQgPSBjYW52YXMuaGVpZ2h0O1xuICAgICAgc2VsZi5vblJlc2l6ZSgpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBDYWxsIHdoZW4gdGhlIGRldmljZUluZm8gaGFzIGNoYW5nZWQuIEF0IHRoaXMgcG9pbnQgd2UgbmVlZFxuICogdG8gcmUtY2FsY3VsYXRlIHRoZSBkaXN0b3J0aW9uIG1lc2guXG4gKi9cbkNhcmRib2FyZERpc3RvcnRlci5wcm90b3R5cGUudXBkYXRlRGV2aWNlSW5mbyA9IGZ1bmN0aW9uKGRldmljZUluZm8pIHtcbiAgdmFyIGdsID0gdGhpcy5nbDtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHZhciBnbFN0YXRlID0gW2dsLkFSUkFZX0JVRkZFUl9CSU5ESU5HLCBnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUl9CSU5ESU5HXTtcbiAgV0dMVVByZXNlcnZlR0xTdGF0ZShnbCwgZ2xTdGF0ZSwgZnVuY3Rpb24oZ2wpIHtcbiAgICB2YXIgdmVydGljZXMgPSBzZWxmLmNvbXB1dGVNZXNoVmVydGljZXNfKHNlbGYubWVzaFdpZHRoLCBzZWxmLm1lc2hIZWlnaHQsIGRldmljZUluZm8pO1xuICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBzZWxmLnZlcnRleEJ1ZmZlcik7XG4gICAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIHZlcnRpY2VzLCBnbC5TVEFUSUNfRFJBVyk7XG5cbiAgICAvLyBJbmRpY2VzIGRvbid0IGNoYW5nZSBiYXNlZCBvbiBkZXZpY2UgcGFyYW1ldGVycywgc28gb25seSBjb21wdXRlIG9uY2UuXG4gICAgaWYgKCFzZWxmLmluZGV4Q291bnQpIHtcbiAgICAgIHZhciBpbmRpY2VzID0gc2VsZi5jb21wdXRlTWVzaEluZGljZXNfKHNlbGYubWVzaFdpZHRoLCBzZWxmLm1lc2hIZWlnaHQpO1xuICAgICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgc2VsZi5pbmRleEJ1ZmZlcik7XG4gICAgICBnbC5idWZmZXJEYXRhKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBpbmRpY2VzLCBnbC5TVEFUSUNfRFJBVyk7XG4gICAgICBzZWxmLmluZGV4Q291bnQgPSBpbmRpY2VzLmxlbmd0aDtcbiAgICB9XG4gIH0pO1xufTtcblxuLyoqXG4gKiBCdWlsZCB0aGUgZGlzdG9ydGlvbiBtZXNoIHZlcnRpY2VzLlxuICogQmFzZWQgb24gY29kZSBmcm9tIHRoZSBVbml0eSBjYXJkYm9hcmQgcGx1Z2luLlxuICovXG5DYXJkYm9hcmREaXN0b3J0ZXIucHJvdG90eXBlLmNvbXB1dGVNZXNoVmVydGljZXNfID0gZnVuY3Rpb24od2lkdGgsIGhlaWdodCwgZGV2aWNlSW5mbykge1xuICB2YXIgdmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5KDIgKiB3aWR0aCAqIGhlaWdodCAqIDUpO1xuXG4gIHZhciBsZW5zRnJ1c3R1bSA9IGRldmljZUluZm8uZ2V0TGVmdEV5ZVZpc2libGVUYW5BbmdsZXMoKTtcbiAgdmFyIG5vTGVuc0ZydXN0dW0gPSBkZXZpY2VJbmZvLmdldExlZnRFeWVOb0xlbnNUYW5BbmdsZXMoKTtcbiAgdmFyIHZpZXdwb3J0ID0gZGV2aWNlSW5mby5nZXRMZWZ0RXllVmlzaWJsZVNjcmVlblJlY3Qobm9MZW5zRnJ1c3R1bSk7XG4gIHZhciB2aWR4ID0gMDtcbiAgdmFyIGlpZHggPSAwO1xuICBmb3IgKHZhciBlID0gMDsgZSA8IDI7IGUrKykge1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgaGVpZ2h0OyBqKyspIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgd2lkdGg7IGkrKywgdmlkeCsrKSB7XG4gICAgICAgIHZhciB1ID0gaSAvICh3aWR0aCAtIDEpO1xuICAgICAgICB2YXIgdiA9IGogLyAoaGVpZ2h0IC0gMSk7XG5cbiAgICAgICAgLy8gR3JpZCBwb2ludHMgcmVndWxhcmx5IHNwYWNlZCBpbiBTdHJlb1NjcmVlbiwgYW5kIGJhcnJlbCBkaXN0b3J0ZWQgaW5cbiAgICAgICAgLy8gdGhlIG1lc2guXG4gICAgICAgIHZhciBzID0gdTtcbiAgICAgICAgdmFyIHQgPSB2O1xuICAgICAgICB2YXIgeCA9IFV0aWwubGVycChsZW5zRnJ1c3R1bVswXSwgbGVuc0ZydXN0dW1bMl0sIHUpO1xuICAgICAgICB2YXIgeSA9IFV0aWwubGVycChsZW5zRnJ1c3R1bVszXSwgbGVuc0ZydXN0dW1bMV0sIHYpO1xuICAgICAgICB2YXIgZCA9IE1hdGguc3FydCh4ICogeCArIHkgKiB5KTtcbiAgICAgICAgdmFyIHIgPSBkZXZpY2VJbmZvLmRpc3RvcnRpb24uZGlzdG9ydEludmVyc2UoZCk7XG4gICAgICAgIHZhciBwID0geCAqIHIgLyBkO1xuICAgICAgICB2YXIgcSA9IHkgKiByIC8gZDtcbiAgICAgICAgdSA9IChwIC0gbm9MZW5zRnJ1c3R1bVswXSkgLyAobm9MZW5zRnJ1c3R1bVsyXSAtIG5vTGVuc0ZydXN0dW1bMF0pO1xuICAgICAgICB2ID0gKHEgLSBub0xlbnNGcnVzdHVtWzNdKSAvIChub0xlbnNGcnVzdHVtWzFdIC0gbm9MZW5zRnJ1c3R1bVszXSk7XG5cbiAgICAgICAgLy8gQ29udmVydCB1LHYgdG8gbWVzaCBzY3JlZW4gY29vcmRpbmF0ZXMuXG4gICAgICAgIHZhciBhc3BlY3QgPSBkZXZpY2VJbmZvLmRldmljZS53aWR0aE1ldGVycyAvIGRldmljZUluZm8uZGV2aWNlLmhlaWdodE1ldGVycztcblxuICAgICAgICAvLyBGSVhNRTogVGhlIG9yaWdpbmFsIFVuaXR5IHBsdWdpbiBtdWx0aXBsaWVkIFUgYnkgdGhlIGFzcGVjdCByYXRpb1xuICAgICAgICAvLyBhbmQgZGlkbid0IG11bHRpcGx5IGVpdGhlciB2YWx1ZSBieSAyLCBidXQgdGhhdCBzZWVtcyB0byBnZXQgaXRcbiAgICAgICAgLy8gcmVhbGx5IGNsb3NlIHRvIGNvcnJlY3QgbG9va2luZyBmb3IgbWUuIEkgaGF0ZSB0aGlzIGtpbmQgb2YgXCJEb24ndFxuICAgICAgICAvLyBrbm93IHdoeSBpdCB3b3Jrc1wiIGNvZGUgdGhvdWdoLCBhbmQgd29sZCBsb3ZlIGEgbW9yZSBsb2dpY2FsXG4gICAgICAgIC8vIGV4cGxhbmF0aW9uIG9mIHdoYXQgbmVlZHMgdG8gaGFwcGVuIGhlcmUuXG4gICAgICAgIHUgPSAodmlld3BvcnQueCArIHUgKiB2aWV3cG9ydC53aWR0aCAtIDAuNSkgKiAyLjA7IC8vKiBhc3BlY3Q7XG4gICAgICAgIHYgPSAodmlld3BvcnQueSArIHYgKiB2aWV3cG9ydC5oZWlnaHQgLSAwLjUpICogMi4wO1xuXG4gICAgICAgIHZlcnRpY2VzWyh2aWR4ICogNSkgKyAwXSA9IHU7IC8vIHBvc2l0aW9uLnhcbiAgICAgICAgdmVydGljZXNbKHZpZHggKiA1KSArIDFdID0gdjsgLy8gcG9zaXRpb24ueVxuICAgICAgICB2ZXJ0aWNlc1sodmlkeCAqIDUpICsgMl0gPSBzOyAvLyB0ZXhDb29yZC54XG4gICAgICAgIHZlcnRpY2VzWyh2aWR4ICogNSkgKyAzXSA9IHQ7IC8vIHRleENvb3JkLnlcbiAgICAgICAgdmVydGljZXNbKHZpZHggKiA1KSArIDRdID0gZTsgLy8gdGV4Q29vcmQueiAodmlld3BvcnQgaW5kZXgpXG4gICAgICB9XG4gICAgfVxuICAgIHZhciB3ID0gbGVuc0ZydXN0dW1bMl0gLSBsZW5zRnJ1c3R1bVswXTtcbiAgICBsZW5zRnJ1c3R1bVswXSA9IC0odyArIGxlbnNGcnVzdHVtWzBdKTtcbiAgICBsZW5zRnJ1c3R1bVsyXSA9IHcgLSBsZW5zRnJ1c3R1bVsyXTtcbiAgICB3ID0gbm9MZW5zRnJ1c3R1bVsyXSAtIG5vTGVuc0ZydXN0dW1bMF07XG4gICAgbm9MZW5zRnJ1c3R1bVswXSA9IC0odyArIG5vTGVuc0ZydXN0dW1bMF0pO1xuICAgIG5vTGVuc0ZydXN0dW1bMl0gPSB3IC0gbm9MZW5zRnJ1c3R1bVsyXTtcbiAgICB2aWV3cG9ydC54ID0gMSAtICh2aWV3cG9ydC54ICsgdmlld3BvcnQud2lkdGgpO1xuICB9XG4gIHJldHVybiB2ZXJ0aWNlcztcbn1cblxuLyoqXG4gKiBCdWlsZCB0aGUgZGlzdG9ydGlvbiBtZXNoIGluZGljZXMuXG4gKiBCYXNlZCBvbiBjb2RlIGZyb20gdGhlIFVuaXR5IGNhcmRib2FyZCBwbHVnaW4uXG4gKi9cbkNhcmRib2FyZERpc3RvcnRlci5wcm90b3R5cGUuY29tcHV0ZU1lc2hJbmRpY2VzXyA9IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQpIHtcbiAgdmFyIGluZGljZXMgPSBuZXcgVWludDE2QXJyYXkoMiAqICh3aWR0aCAtIDEpICogKGhlaWdodCAtIDEpICogNik7XG4gIHZhciBoYWxmd2lkdGggPSB3aWR0aCAvIDI7XG4gIHZhciBoYWxmaGVpZ2h0ID0gaGVpZ2h0IC8gMjtcbiAgdmFyIHZpZHggPSAwO1xuICB2YXIgaWlkeCA9IDA7XG4gIGZvciAodmFyIGUgPSAwOyBlIDwgMjsgZSsrKSB7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBoZWlnaHQ7IGorKykge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB3aWR0aDsgaSsrLCB2aWR4KyspIHtcbiAgICAgICAgaWYgKGkgPT0gMCB8fCBqID09IDApXG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIC8vIEJ1aWxkIGEgcXVhZC4gIExvd2VyIHJpZ2h0IGFuZCB1cHBlciBsZWZ0IHF1YWRyYW50cyBoYXZlIHF1YWRzIHdpdGhcbiAgICAgICAgLy8gdGhlIHRyaWFuZ2xlIGRpYWdvbmFsIGZsaXBwZWQgdG8gZ2V0IHRoZSB2aWduZXR0ZSB0byBpbnRlcnBvbGF0ZVxuICAgICAgICAvLyBjb3JyZWN0bHkuXG4gICAgICAgIGlmICgoaSA8PSBoYWxmd2lkdGgpID09IChqIDw9IGhhbGZoZWlnaHQpKSB7XG4gICAgICAgICAgLy8gUXVhZCBkaWFnb25hbCBsb3dlciBsZWZ0IHRvIHVwcGVyIHJpZ2h0LlxuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHg7XG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeCAtIHdpZHRoIC0gMTtcbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4IC0gd2lkdGg7XG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeCAtIHdpZHRoIC0gMTtcbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4O1xuICAgICAgICAgIGluZGljZXNbaWlkeCsrXSA9IHZpZHggLSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIFF1YWQgZGlhZ29uYWwgdXBwZXIgbGVmdCB0byBsb3dlciByaWdodC5cbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4IC0gMTtcbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4IC0gd2lkdGg7XG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeDtcbiAgICAgICAgICBpbmRpY2VzW2lpZHgrK10gPSB2aWR4IC0gd2lkdGg7XG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeCAtIDE7XG4gICAgICAgICAgaW5kaWNlc1tpaWR4KytdID0gdmlkeCAtIHdpZHRoIC0gMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gaW5kaWNlcztcbn07XG5cbkNhcmRib2FyZERpc3RvcnRlci5wcm90b3R5cGUuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yXyA9IGZ1bmN0aW9uKHByb3RvLCBhdHRyTmFtZSkge1xuICB2YXIgZGVzY3JpcHRvciA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IocHJvdG8sIGF0dHJOYW1lKTtcbiAgLy8gSW4gc29tZSBjYXNlcyAoYWhlbS4uLiBTYWZhcmkpLCB0aGUgZGVzY3JpcHRvciByZXR1cm5zIHVuZGVmaW5lZCBnZXQgYW5kXG4gIC8vIHNldCBmaWVsZHMuIEluIHRoaXMgY2FzZSwgd2UgbmVlZCB0byBjcmVhdGUgYSBzeW50aGV0aWMgcHJvcGVydHlcbiAgLy8gZGVzY3JpcHRvci4gVGhpcyB3b3JrcyBhcm91bmQgc29tZSBvZiB0aGUgaXNzdWVzIGluXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ib3Jpc211cy93ZWJ2ci1wb2x5ZmlsbC9pc3N1ZXMvNDZcbiAgaWYgKGRlc2NyaXB0b3IuZ2V0ID09PSB1bmRlZmluZWQgfHwgZGVzY3JpcHRvci5zZXQgPT09IHVuZGVmaW5lZCkge1xuICAgIGRlc2NyaXB0b3IuY29uZmlndXJhYmxlID0gdHJ1ZTtcbiAgICBkZXNjcmlwdG9yLmVudW1lcmFibGUgPSB0cnVlO1xuICAgIGRlc2NyaXB0b3IuZ2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRBdHRyaWJ1dGUoYXR0ck5hbWUpO1xuICAgIH07XG4gICAgZGVzY3JpcHRvci5zZXQgPSBmdW5jdGlvbih2YWwpIHtcbiAgICAgIHRoaXMuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCB2YWwpO1xuICAgIH07XG4gIH1cbiAgcmV0dXJuIGRlc2NyaXB0b3I7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhcmRib2FyZERpc3RvcnRlcjtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG52YXIgV0dMVVByZXNlcnZlR0xTdGF0ZSA9IHJlcXVpcmUoJy4vZGVwcy93Z2x1LXByZXNlcnZlLXN0YXRlLmpzJyk7XG5cbnZhciB1aVZTID0gW1xuICAnYXR0cmlidXRlIHZlYzIgcG9zaXRpb247JyxcblxuICAndW5pZm9ybSBtYXQ0IHByb2plY3Rpb25NYXQ7JyxcblxuICAndm9pZCBtYWluKCkgeycsXG4gICcgIGdsX1Bvc2l0aW9uID0gcHJvamVjdGlvbk1hdCAqIHZlYzQoIHBvc2l0aW9uLCAtMS4wLCAxLjAgKTsnLFxuICAnfScsXG5dLmpvaW4oJ1xcbicpO1xuXG52YXIgdWlGUyA9IFtcbiAgJ3ByZWNpc2lvbiBtZWRpdW1wIGZsb2F0OycsXG5cbiAgJ3VuaWZvcm0gdmVjNCBjb2xvcjsnLFxuXG4gICd2b2lkIG1haW4oKSB7JyxcbiAgJyAgZ2xfRnJhZ0NvbG9yID0gY29sb3I7JyxcbiAgJ30nLFxuXS5qb2luKCdcXG4nKTtcblxudmFyIERFRzJSQUQgPSBNYXRoLlBJLzE4MC4wO1xuXG4vLyBUaGUgZ2VhciBoYXMgNiBpZGVudGljYWwgc2VjdGlvbnMsIGVhY2ggc3Bhbm5pbmcgNjAgZGVncmVlcy5cbnZhciBrQW5nbGVQZXJHZWFyU2VjdGlvbiA9IDYwO1xuXG4vLyBIYWxmLWFuZ2xlIG9mIHRoZSBzcGFuIG9mIHRoZSBvdXRlciByaW0uXG52YXIga091dGVyUmltRW5kQW5nbGUgPSAxMjtcblxuLy8gQW5nbGUgYmV0d2VlbiB0aGUgbWlkZGxlIG9mIHRoZSBvdXRlciByaW0gYW5kIHRoZSBzdGFydCBvZiB0aGUgaW5uZXIgcmltLlxudmFyIGtJbm5lclJpbUJlZ2luQW5nbGUgPSAyMDtcblxuLy8gRGlzdGFuY2UgZnJvbSBjZW50ZXIgdG8gb3V0ZXIgcmltLCBub3JtYWxpemVkIHNvIHRoYXQgdGhlIGVudGlyZSBtb2RlbFxuLy8gZml0cyBpbiBhIFstMSwgMV0geCBbLTEsIDFdIHNxdWFyZS5cbnZhciBrT3V0ZXJSYWRpdXMgPSAxO1xuXG4vLyBEaXN0YW5jZSBmcm9tIGNlbnRlciB0byBkZXByZXNzZWQgcmltLCBpbiBtb2RlbCB1bml0cy5cbnZhciBrTWlkZGxlUmFkaXVzID0gMC43NTtcblxuLy8gUmFkaXVzIG9mIHRoZSBpbm5lciBob2xsb3cgY2lyY2xlLCBpbiBtb2RlbCB1bml0cy5cbnZhciBrSW5uZXJSYWRpdXMgPSAwLjMxMjU7XG5cbi8vIENlbnRlciBsaW5lIHRoaWNrbmVzcyBpbiBEUC5cbnZhciBrQ2VudGVyTGluZVRoaWNrbmVzc0RwID0gNDtcblxuLy8gQnV0dG9uIHdpZHRoIGluIERQLlxudmFyIGtCdXR0b25XaWR0aERwID0gMjg7XG5cbi8vIEZhY3RvciB0byBzY2FsZSB0aGUgdG91Y2ggYXJlYSB0aGF0IHJlc3BvbmRzIHRvIHRoZSB0b3VjaC5cbnZhciBrVG91Y2hTbG9wRmFjdG9yID0gMS41O1xuXG52YXIgQW5nbGVzID0gW1xuICAwLCBrT3V0ZXJSaW1FbmRBbmdsZSwga0lubmVyUmltQmVnaW5BbmdsZSxcbiAga0FuZ2xlUGVyR2VhclNlY3Rpb24gLSBrSW5uZXJSaW1CZWdpbkFuZ2xlLFxuICBrQW5nbGVQZXJHZWFyU2VjdGlvbiAtIGtPdXRlclJpbUVuZEFuZ2xlXG5dO1xuXG4vKipcbiAqIFJlbmRlcnMgdGhlIGFsaWdubWVudCBsaW5lIGFuZCBcIm9wdGlvbnNcIiBnZWFyLiBJdCBpcyBhc3N1bWVkIHRoYXQgdGhlIGNhbnZhc1xuICogdGhpcyBpcyByZW5kZXJlZCBpbnRvIGNvdmVycyB0aGUgZW50aXJlIHNjcmVlbiAob3IgY2xvc2UgdG8gaXQuKVxuICovXG5mdW5jdGlvbiBDYXJkYm9hcmRVSShnbCkge1xuICB0aGlzLmdsID0gZ2w7XG5cbiAgdGhpcy5hdHRyaWJzID0ge1xuICAgIHBvc2l0aW9uOiAwXG4gIH07XG4gIHRoaXMucHJvZ3JhbSA9IFV0aWwubGlua1Byb2dyYW0oZ2wsIHVpVlMsIHVpRlMsIHRoaXMuYXR0cmlicyk7XG4gIHRoaXMudW5pZm9ybXMgPSBVdGlsLmdldFByb2dyYW1Vbmlmb3JtcyhnbCwgdGhpcy5wcm9ncmFtKTtcblxuICB0aGlzLnZlcnRleEJ1ZmZlciA9IGdsLmNyZWF0ZUJ1ZmZlcigpO1xuICB0aGlzLmdlYXJPZmZzZXQgPSAwO1xuICB0aGlzLmdlYXJWZXJ0ZXhDb3VudCA9IDA7XG4gIHRoaXMuYXJyb3dPZmZzZXQgPSAwO1xuICB0aGlzLmFycm93VmVydGV4Q291bnQgPSAwO1xuXG4gIHRoaXMucHJvak1hdCA9IG5ldyBGbG9hdDMyQXJyYXkoMTYpO1xuXG4gIHRoaXMubGlzdGVuZXIgPSBudWxsO1xuXG4gIHRoaXMub25SZXNpemUoKTtcbn07XG5cbi8qKlxuICogVGVhcnMgZG93biBhbGwgdGhlIHJlc291cmNlcyBjcmVhdGVkIGJ5IHRoZSBVSSByZW5kZXJlci5cbiAqL1xuQ2FyZGJvYXJkVUkucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGdsID0gdGhpcy5nbDtcblxuICBpZiAodGhpcy5saXN0ZW5lcikge1xuICAgIGdsLmNhbnZhcy5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMubGlzdGVuZXIsIGZhbHNlKTtcbiAgfVxuXG4gIGdsLmRlbGV0ZVByb2dyYW0odGhpcy5wcm9ncmFtKTtcbiAgZ2wuZGVsZXRlQnVmZmVyKHRoaXMudmVydGV4QnVmZmVyKTtcbn07XG5cbi8qKlxuICogQWRkcyBhIGxpc3RlbmVyIHRvIGNsaWNrcyBvbiB0aGUgZ2VhciBhbmQgYmFjayBpY29uc1xuICovXG5DYXJkYm9hcmRVSS5wcm90b3R5cGUubGlzdGVuID0gZnVuY3Rpb24ob3B0aW9uc0NhbGxiYWNrLCBiYWNrQ2FsbGJhY2spIHtcbiAgdmFyIGNhbnZhcyA9IHRoaXMuZ2wuY2FudmFzO1xuICB0aGlzLmxpc3RlbmVyID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICB2YXIgbWlkbGluZSA9IGNhbnZhcy5jbGllbnRXaWR0aCAvIDI7XG4gICAgdmFyIGJ1dHRvblNpemUgPSBrQnV0dG9uV2lkdGhEcCAqIGtUb3VjaFNsb3BGYWN0b3I7XG4gICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZSB1c2VyIGNsaWNrZWQgb24gKG9yIGFyb3VuZCkgdGhlIGdlYXIgaWNvblxuICAgIGlmIChldmVudC5jbGllbnRYID4gbWlkbGluZSAtIGJ1dHRvblNpemUgJiZcbiAgICAgICAgZXZlbnQuY2xpZW50WCA8IG1pZGxpbmUgKyBidXR0b25TaXplICYmXG4gICAgICAgIGV2ZW50LmNsaWVudFkgPiBjYW52YXMuY2xpZW50SGVpZ2h0IC0gYnV0dG9uU2l6ZSkge1xuICAgICAgb3B0aW9uc0NhbGxiYWNrKGV2ZW50KTtcbiAgICB9XG4gICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZSB1c2VyIGNsaWNrZWQgb24gKG9yIGFyb3VuZCkgdGhlIGJhY2sgaWNvblxuICAgIGVsc2UgaWYgKGV2ZW50LmNsaWVudFggPCBidXR0b25TaXplICYmIGV2ZW50LmNsaWVudFkgPCBidXR0b25TaXplKSB7XG4gICAgICBiYWNrQ2FsbGJhY2soZXZlbnQpO1xuICAgIH1cbiAgfTtcbiAgY2FudmFzLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5saXN0ZW5lciwgZmFsc2UpO1xufTtcblxuLyoqXG4gKiBCdWlsZHMgdGhlIFVJIG1lc2guXG4gKi9cbkNhcmRib2FyZFVJLnByb3RvdHlwZS5vblJlc2l6ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZ2wgPSB0aGlzLmdsO1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdmFyIGdsU3RhdGUgPSBbXG4gICAgZ2wuQVJSQVlfQlVGRkVSX0JJTkRJTkdcbiAgXTtcblxuICBXR0xVUHJlc2VydmVHTFN0YXRlKGdsLCBnbFN0YXRlLCBmdW5jdGlvbihnbCkge1xuICAgIHZhciB2ZXJ0aWNlcyA9IFtdO1xuXG4gICAgdmFyIG1pZGxpbmUgPSBnbC5kcmF3aW5nQnVmZmVyV2lkdGggLyAyO1xuXG4gICAgLy8gQXNzdW1lcyB5b3VyIGNhbnZhcyB3aWR0aCBhbmQgaGVpZ2h0IGlzIHNjYWxlZCBwcm9wb3J0aW9uYXRlbHkuXG4gICAgLy8gVE9ETyhzbXVzKTogVGhlIGZvbGxvd2luZyBjYXVzZXMgYnV0dG9ucyB0byBiZWNvbWUgaHVnZSBvbiBpT1MsIGJ1dCBzZWVtc1xuICAgIC8vIGxpa2UgdGhlIHJpZ2h0IHRoaW5nIHRvIGRvLiBGb3Igbm93LCBhZGRlZCBhIGhhY2suIEJ1dCByZWFsbHksIGludmVzdGlnYXRlIHdoeS5cbiAgICB2YXIgZHBzID0gKGdsLmRyYXdpbmdCdWZmZXJXaWR0aCAvIChzY3JlZW4ud2lkdGggKiB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbykpO1xuICAgIGlmICghVXRpbC5pc0lPUygpKSB7XG4gICAgICBkcHMgKj0gd2luZG93LmRldmljZVBpeGVsUmF0aW87XG4gICAgfVxuXG4gICAgdmFyIGxpbmVXaWR0aCA9IGtDZW50ZXJMaW5lVGhpY2tuZXNzRHAgKiBkcHMgLyAyO1xuICAgIHZhciBidXR0b25TaXplID0ga0J1dHRvbldpZHRoRHAgKiBrVG91Y2hTbG9wRmFjdG9yICogZHBzO1xuICAgIHZhciBidXR0b25TY2FsZSA9IGtCdXR0b25XaWR0aERwICogZHBzIC8gMjtcbiAgICB2YXIgYnV0dG9uQm9yZGVyID0gKChrQnV0dG9uV2lkdGhEcCAqIGtUb3VjaFNsb3BGYWN0b3IpIC0ga0J1dHRvbldpZHRoRHApICogZHBzO1xuXG4gICAgLy8gQnVpbGQgY2VudGVybGluZVxuICAgIHZlcnRpY2VzLnB1c2gobWlkbGluZSAtIGxpbmVXaWR0aCwgYnV0dG9uU2l6ZSk7XG4gICAgdmVydGljZXMucHVzaChtaWRsaW5lIC0gbGluZVdpZHRoLCBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0KTtcbiAgICB2ZXJ0aWNlcy5wdXNoKG1pZGxpbmUgKyBsaW5lV2lkdGgsIGJ1dHRvblNpemUpO1xuICAgIHZlcnRpY2VzLnB1c2gobWlkbGluZSArIGxpbmVXaWR0aCwgZ2wuZHJhd2luZ0J1ZmZlckhlaWdodCk7XG5cbiAgICAvLyBCdWlsZCBnZWFyXG4gICAgc2VsZi5nZWFyT2Zmc2V0ID0gKHZlcnRpY2VzLmxlbmd0aCAvIDIpO1xuXG4gICAgZnVuY3Rpb24gYWRkR2VhclNlZ21lbnQodGhldGEsIHIpIHtcbiAgICAgIHZhciBhbmdsZSA9ICg5MCAtIHRoZXRhKSAqIERFRzJSQUQ7XG4gICAgICB2YXIgeCA9IE1hdGguY29zKGFuZ2xlKTtcbiAgICAgIHZhciB5ID0gTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgdmVydGljZXMucHVzaChrSW5uZXJSYWRpdXMgKiB4ICogYnV0dG9uU2NhbGUgKyBtaWRsaW5lLCBrSW5uZXJSYWRpdXMgKiB5ICogYnV0dG9uU2NhbGUgKyBidXR0b25TY2FsZSk7XG4gICAgICB2ZXJ0aWNlcy5wdXNoKHIgKiB4ICogYnV0dG9uU2NhbGUgKyBtaWRsaW5lLCByICogeSAqIGJ1dHRvblNjYWxlICsgYnV0dG9uU2NhbGUpO1xuICAgIH1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IDY7IGkrKykge1xuICAgICAgdmFyIHNlZ21lbnRUaGV0YSA9IGkgKiBrQW5nbGVQZXJHZWFyU2VjdGlvbjtcblxuICAgICAgYWRkR2VhclNlZ21lbnQoc2VnbWVudFRoZXRhLCBrT3V0ZXJSYWRpdXMpO1xuICAgICAgYWRkR2VhclNlZ21lbnQoc2VnbWVudFRoZXRhICsga091dGVyUmltRW5kQW5nbGUsIGtPdXRlclJhZGl1cyk7XG4gICAgICBhZGRHZWFyU2VnbWVudChzZWdtZW50VGhldGEgKyBrSW5uZXJSaW1CZWdpbkFuZ2xlLCBrTWlkZGxlUmFkaXVzKTtcbiAgICAgIGFkZEdlYXJTZWdtZW50KHNlZ21lbnRUaGV0YSArIChrQW5nbGVQZXJHZWFyU2VjdGlvbiAtIGtJbm5lclJpbUJlZ2luQW5nbGUpLCBrTWlkZGxlUmFkaXVzKTtcbiAgICAgIGFkZEdlYXJTZWdtZW50KHNlZ21lbnRUaGV0YSArIChrQW5nbGVQZXJHZWFyU2VjdGlvbiAtIGtPdXRlclJpbUVuZEFuZ2xlKSwga091dGVyUmFkaXVzKTtcbiAgICB9XG5cbiAgICBzZWxmLmdlYXJWZXJ0ZXhDb3VudCA9ICh2ZXJ0aWNlcy5sZW5ndGggLyAyKSAtIHNlbGYuZ2Vhck9mZnNldDtcblxuICAgIC8vIEJ1aWxkIGJhY2sgYXJyb3dcbiAgICBzZWxmLmFycm93T2Zmc2V0ID0gKHZlcnRpY2VzLmxlbmd0aCAvIDIpO1xuXG4gICAgZnVuY3Rpb24gYWRkQXJyb3dWZXJ0ZXgoeCwgeSkge1xuICAgICAgdmVydGljZXMucHVzaChidXR0b25Cb3JkZXIgKyB4LCBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0IC0gYnV0dG9uQm9yZGVyIC0geSk7XG4gICAgfVxuXG4gICAgdmFyIGFuZ2xlZExpbmVXaWR0aCA9IGxpbmVXaWR0aCAvIE1hdGguc2luKDQ1ICogREVHMlJBRCk7XG5cbiAgICBhZGRBcnJvd1ZlcnRleCgwLCBidXR0b25TY2FsZSk7XG4gICAgYWRkQXJyb3dWZXJ0ZXgoYnV0dG9uU2NhbGUsIDApO1xuICAgIGFkZEFycm93VmVydGV4KGJ1dHRvblNjYWxlICsgYW5nbGVkTGluZVdpZHRoLCBhbmdsZWRMaW5lV2lkdGgpO1xuICAgIGFkZEFycm93VmVydGV4KGFuZ2xlZExpbmVXaWR0aCwgYnV0dG9uU2NhbGUgKyBhbmdsZWRMaW5lV2lkdGgpO1xuXG4gICAgYWRkQXJyb3dWZXJ0ZXgoYW5nbGVkTGluZVdpZHRoLCBidXR0b25TY2FsZSAtIGFuZ2xlZExpbmVXaWR0aCk7XG4gICAgYWRkQXJyb3dWZXJ0ZXgoMCwgYnV0dG9uU2NhbGUpO1xuICAgIGFkZEFycm93VmVydGV4KGJ1dHRvblNjYWxlLCBidXR0b25TY2FsZSAqIDIpO1xuICAgIGFkZEFycm93VmVydGV4KGJ1dHRvblNjYWxlICsgYW5nbGVkTGluZVdpZHRoLCAoYnV0dG9uU2NhbGUgKiAyKSAtIGFuZ2xlZExpbmVXaWR0aCk7XG5cbiAgICBhZGRBcnJvd1ZlcnRleChhbmdsZWRMaW5lV2lkdGgsIGJ1dHRvblNjYWxlIC0gYW5nbGVkTGluZVdpZHRoKTtcbiAgICBhZGRBcnJvd1ZlcnRleCgwLCBidXR0b25TY2FsZSk7XG5cbiAgICBhZGRBcnJvd1ZlcnRleChhbmdsZWRMaW5lV2lkdGgsIGJ1dHRvblNjYWxlIC0gbGluZVdpZHRoKTtcbiAgICBhZGRBcnJvd1ZlcnRleChrQnV0dG9uV2lkdGhEcCAqIGRwcywgYnV0dG9uU2NhbGUgLSBsaW5lV2lkdGgpO1xuICAgIGFkZEFycm93VmVydGV4KGFuZ2xlZExpbmVXaWR0aCwgYnV0dG9uU2NhbGUgKyBsaW5lV2lkdGgpO1xuICAgIGFkZEFycm93VmVydGV4KGtCdXR0b25XaWR0aERwICogZHBzLCBidXR0b25TY2FsZSArIGxpbmVXaWR0aCk7XG5cbiAgICBzZWxmLmFycm93VmVydGV4Q291bnQgPSAodmVydGljZXMubGVuZ3RoIC8gMikgLSBzZWxmLmFycm93T2Zmc2V0O1xuXG4gICAgLy8gQnVmZmVyIGRhdGFcbiAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgc2VsZi52ZXJ0ZXhCdWZmZXIpO1xuICAgIGdsLmJ1ZmZlckRhdGEoZ2wuQVJSQVlfQlVGRkVSLCBuZXcgRmxvYXQzMkFycmF5KHZlcnRpY2VzKSwgZ2wuU1RBVElDX0RSQVcpO1xuICB9KTtcbn07XG5cbi8qKlxuICogUGVyZm9ybXMgZGlzdG9ydGlvbiBwYXNzIG9uIHRoZSBpbmplY3RlZCBiYWNrYnVmZmVyLCByZW5kZXJpbmcgaXQgdG8gdGhlIHJlYWxcbiAqIGJhY2tidWZmZXIuXG4gKi9cbkNhcmRib2FyZFVJLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGdsID0gdGhpcy5nbDtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIHZhciBnbFN0YXRlID0gW1xuICAgIGdsLkNVTExfRkFDRSxcbiAgICBnbC5ERVBUSF9URVNULFxuICAgIGdsLkJMRU5ELFxuICAgIGdsLlNDSVNTT1JfVEVTVCxcbiAgICBnbC5TVEVOQ0lMX1RFU1QsXG4gICAgZ2wuQ09MT1JfV1JJVEVNQVNLLFxuICAgIGdsLlZJRVdQT1JULFxuXG4gICAgZ2wuQ1VSUkVOVF9QUk9HUkFNLFxuICAgIGdsLkFSUkFZX0JVRkZFUl9CSU5ESU5HXG4gIF07XG5cbiAgV0dMVVByZXNlcnZlR0xTdGF0ZShnbCwgZ2xTdGF0ZSwgZnVuY3Rpb24oZ2wpIHtcbiAgICAvLyBNYWtlIHN1cmUgdGhlIEdMIHN0YXRlIGlzIGluIGEgZ29vZCBwbGFjZVxuICAgIGdsLmRpc2FibGUoZ2wuQ1VMTF9GQUNFKTtcbiAgICBnbC5kaXNhYmxlKGdsLkRFUFRIX1RFU1QpO1xuICAgIGdsLmRpc2FibGUoZ2wuQkxFTkQpO1xuICAgIGdsLmRpc2FibGUoZ2wuU0NJU1NPUl9URVNUKTtcbiAgICBnbC5kaXNhYmxlKGdsLlNURU5DSUxfVEVTVCk7XG4gICAgZ2wuY29sb3JNYXNrKHRydWUsIHRydWUsIHRydWUsIHRydWUpO1xuICAgIGdsLnZpZXdwb3J0KDAsIDAsIGdsLmRyYXdpbmdCdWZmZXJXaWR0aCwgZ2wuZHJhd2luZ0J1ZmZlckhlaWdodCk7XG5cbiAgICBzZWxmLnJlbmRlck5vU3RhdGUoKTtcbiAgfSk7XG59O1xuXG5DYXJkYm9hcmRVSS5wcm90b3R5cGUucmVuZGVyTm9TdGF0ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZ2wgPSB0aGlzLmdsO1xuXG4gIC8vIEJpbmQgZGlzdG9ydGlvbiBwcm9ncmFtIGFuZCBtZXNoXG4gIGdsLnVzZVByb2dyYW0odGhpcy5wcm9ncmFtKTtcblxuICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy52ZXJ0ZXhCdWZmZXIpO1xuICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSh0aGlzLmF0dHJpYnMucG9zaXRpb24pO1xuICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHRoaXMuYXR0cmlicy5wb3NpdGlvbiwgMiwgZ2wuRkxPQVQsIGZhbHNlLCA4LCAwKTtcblxuICBnbC51bmlmb3JtNGYodGhpcy51bmlmb3Jtcy5jb2xvciwgMS4wLCAxLjAsIDEuMCwgMS4wKTtcblxuICBVdGlsLm9ydGhvTWF0cml4KHRoaXMucHJvak1hdCwgMCwgZ2wuZHJhd2luZ0J1ZmZlcldpZHRoLCAwLCBnbC5kcmF3aW5nQnVmZmVySGVpZ2h0LCAwLjEsIDEwMjQuMCk7XG4gIGdsLnVuaWZvcm1NYXRyaXg0ZnYodGhpcy51bmlmb3Jtcy5wcm9qZWN0aW9uTWF0LCBmYWxzZSwgdGhpcy5wcm9qTWF0KTtcblxuICAvLyBEcmF3cyBVSSBlbGVtZW50XG4gIGdsLmRyYXdBcnJheXMoZ2wuVFJJQU5HTEVfU1RSSVAsIDAsIDQpO1xuICBnbC5kcmF3QXJyYXlzKGdsLlRSSUFOR0xFX1NUUklQLCB0aGlzLmdlYXJPZmZzZXQsIHRoaXMuZ2VhclZlcnRleENvdW50KTtcbiAgZ2wuZHJhd0FycmF5cyhnbC5UUklBTkdMRV9TVFJJUCwgdGhpcy5hcnJvd09mZnNldCwgdGhpcy5hcnJvd1ZlcnRleENvdW50KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ2FyZGJvYXJkVUk7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgQ2FyZGJvYXJkRGlzdG9ydGVyID0gcmVxdWlyZSgnLi9jYXJkYm9hcmQtZGlzdG9ydGVyLmpzJyk7XG52YXIgQ2FyZGJvYXJkVUkgPSByZXF1aXJlKCcuL2NhcmRib2FyZC11aS5qcycpO1xudmFyIERldmljZUluZm8gPSByZXF1aXJlKCcuL2RldmljZS1pbmZvLmpzJyk7XG52YXIgRHBkYiA9IHJlcXVpcmUoJy4vZHBkYi9kcGRiLmpzJyk7XG52YXIgRnVzaW9uUG9zZVNlbnNvciA9IHJlcXVpcmUoJy4vc2Vuc29yLWZ1c2lvbi9mdXNpb24tcG9zZS1zZW5zb3IuanMnKTtcbnZhciBSb3RhdGVJbnN0cnVjdGlvbnMgPSByZXF1aXJlKCcuL3JvdGF0ZS1pbnN0cnVjdGlvbnMuanMnKTtcbnZhciBWaWV3ZXJTZWxlY3RvciA9IHJlcXVpcmUoJy4vdmlld2VyLXNlbGVjdG9yLmpzJyk7XG52YXIgVlJEaXNwbGF5ID0gcmVxdWlyZSgnLi9iYXNlLmpzJykuVlJEaXNwbGF5O1xudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcblxudmFyIEV5ZSA9IHtcbiAgTEVGVDogJ2xlZnQnLFxuICBSSUdIVDogJ3JpZ2h0J1xufTtcblxuLyoqXG4gKiBWUkRpc3BsYXkgYmFzZWQgb24gbW9iaWxlIGRldmljZSBwYXJhbWV0ZXJzIGFuZCBEZXZpY2VNb3Rpb24gQVBJcy5cbiAqL1xuZnVuY3Rpb24gQ2FyZGJvYXJkVlJEaXNwbGF5KCkge1xuICB0aGlzLmRpc3BsYXlOYW1lID0gJ0NhcmRib2FyZCBWUkRpc3BsYXkgKHdlYnZyLXBvbHlmaWxsKSc7XG5cbiAgdGhpcy5jYXBhYmlsaXRpZXMuaGFzT3JpZW50YXRpb24gPSB0cnVlO1xuICB0aGlzLmNhcGFiaWxpdGllcy5jYW5QcmVzZW50ID0gdHJ1ZTtcblxuICAvLyBcIlByaXZhdGVcIiBtZW1iZXJzLlxuICB0aGlzLmJ1ZmZlclNjYWxlXyA9IFdlYlZSQ29uZmlnLkJVRkZFUl9TQ0FMRSA/IFdlYlZSQ29uZmlnLkJVRkZFUl9TQ0FMRSA6IDEuMDtcbiAgdGhpcy5wb3NlU2Vuc29yXyA9IG5ldyBGdXNpb25Qb3NlU2Vuc29yKCk7XG4gIHRoaXMuZGlzdG9ydGVyXyA9IG51bGw7XG4gIHRoaXMuY2FyZGJvYXJkVUlfID0gbnVsbDtcblxuICB0aGlzLmRwZGJfID0gbmV3IERwZGIodHJ1ZSwgdGhpcy5vbkRldmljZVBhcmFtc1VwZGF0ZWRfLmJpbmQodGhpcykpO1xuICB0aGlzLmRldmljZUluZm9fID0gbmV3IERldmljZUluZm8odGhpcy5kcGRiXy5nZXREZXZpY2VQYXJhbXMoKSk7XG5cbiAgdGhpcy52aWV3ZXJTZWxlY3Rvcl8gPSBuZXcgVmlld2VyU2VsZWN0b3IoKTtcbiAgdGhpcy52aWV3ZXJTZWxlY3Rvcl8ub24oJ2NoYW5nZScsIHRoaXMub25WaWV3ZXJDaGFuZ2VkXy5iaW5kKHRoaXMpKTtcblxuICAvLyBTZXQgdGhlIGNvcnJlY3QgaW5pdGlhbCB2aWV3ZXIuXG4gIHRoaXMuZGV2aWNlSW5mb18uc2V0Vmlld2VyKHRoaXMudmlld2VyU2VsZWN0b3JfLmdldEN1cnJlbnRWaWV3ZXIoKSk7XG5cbiAgdGhpcy5yb3RhdGVJbnN0cnVjdGlvbnNfID0gbmV3IFJvdGF0ZUluc3RydWN0aW9ucygpO1xufVxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZSA9IG5ldyBWUkRpc3BsYXkoKTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5nZXRJbW1lZGlhdGVQb3NlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcG9zaXRpb246IHRoaXMucG9zZVNlbnNvcl8uZ2V0UG9zaXRpb24oKSxcbiAgICBvcmllbnRhdGlvbjogdGhpcy5wb3NlU2Vuc29yXy5nZXRPcmllbnRhdGlvbigpLFxuICAgIGxpbmVhclZlbG9jaXR5OiBudWxsLFxuICAgIGxpbmVhckFjY2VsZXJhdGlvbjogbnVsbCxcbiAgICBhbmd1bGFyVmVsb2NpdHk6IG51bGwsXG4gICAgYW5ndWxhckFjY2VsZXJhdGlvbjogbnVsbFxuICB9O1xufTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5yZXNldFBvc2UgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wb3NlU2Vuc29yXy5yZXNldFBvc2UoKTtcbn07XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUuZ2V0RXllUGFyYW1ldGVycyA9IGZ1bmN0aW9uKHdoaWNoRXllKSB7XG4gIHZhciBvZmZzZXQgPSBbdGhpcy5kZXZpY2VJbmZvXy52aWV3ZXIuaW50ZXJMZW5zRGlzdGFuY2UgKiAwLjUsIDAuMCwgMC4wXTtcbiAgdmFyIGZpZWxkT2ZWaWV3O1xuXG4gIC8vIFRPRE86IEZvViBjYW4gYmUgYSBsaXR0bGUgZXhwZW5zaXZlIHRvIGNvbXB1dGUuIENhY2hlIHdoZW4gZGV2aWNlIHBhcmFtcyBjaGFuZ2UuXG4gIGlmICh3aGljaEV5ZSA9PSBFeWUuTEVGVCkge1xuICAgIG9mZnNldFswXSAqPSAtMS4wO1xuICAgIGZpZWxkT2ZWaWV3ID0gdGhpcy5kZXZpY2VJbmZvXy5nZXRGaWVsZE9mVmlld0xlZnRFeWUoKTtcbiAgfSBlbHNlIGlmICh3aGljaEV5ZSA9PSBFeWUuUklHSFQpIHtcbiAgICBmaWVsZE9mVmlldyA9IHRoaXMuZGV2aWNlSW5mb18uZ2V0RmllbGRPZlZpZXdSaWdodEV5ZSgpO1xuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0ludmFsaWQgZXllIHByb3ZpZGVkOiAlcycsIHdoaWNoRXllKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZmllbGRPZlZpZXc6IGZpZWxkT2ZWaWV3LFxuICAgIG9mZnNldDogb2Zmc2V0LFxuICAgIC8vIFRPRE86IFNob3VsZCBiZSBhYmxlIHRvIHByb3ZpZGUgYmV0dGVyIHZhbHVlcyB0aGFuIHRoZXNlLlxuICAgIHJlbmRlcldpZHRoOiB0aGlzLmRldmljZUluZm9fLmRldmljZS53aWR0aCAqIDAuNSAqIHRoaXMuYnVmZmVyU2NhbGVfLFxuICAgIHJlbmRlckhlaWdodDogdGhpcy5kZXZpY2VJbmZvXy5kZXZpY2UuaGVpZ2h0ICogdGhpcy5idWZmZXJTY2FsZV8sXG4gIH07XG59O1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLm9uRGV2aWNlUGFyYW1zVXBkYXRlZF8gPSBmdW5jdGlvbihuZXdQYXJhbXMpIHtcbiAgY29uc29sZS5sb2coJ0RQREIgcmVwb3J0ZWQgdGhhdCBkZXZpY2UgcGFyYW1zIHdlcmUgdXBkYXRlZC4nKTtcbiAgdGhpcy5kZXZpY2VJbmZvXy51cGRhdGVEZXZpY2VQYXJhbXMobmV3UGFyYW1zKTtcblxuICBpZiAodGhpcy5kaXN0b3J0ZXJfKSB7XG4gICAgdGhpcy5kaXN0b3J0ZXIudXBkYXRlRGV2aWNlSW5mbyh0aGlzLmRldmljZUluZm9fKTtcbiAgfVxufTtcblxuQ2FyZGJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5iZWdpblByZXNlbnRfID0gZnVuY3Rpb24oKSB7XG4gIHZhciBnbCA9IHRoaXMubGF5ZXJfLnNvdXJjZS5nZXRDb250ZXh0KCd3ZWJnbCcpO1xuICBpZiAoIWdsKVxuICAgIGdsID0gdGhpcy5sYXllcl8uc291cmNlLmdldENvbnRleHQoJ2V4cGVyaW1lbnRhbC13ZWJnbCcpO1xuICBpZiAoIWdsKVxuICAgIGdsID0gdGhpcy5sYXllcl8uc291cmNlLmdldENvbnRleHQoJ3dlYmdsMicpO1xuXG4gIGlmICghZ2wpXG4gICAgcmV0dXJuOyAvLyBDYW4ndCBkbyBkaXN0b3J0aW9uIHdpdGhvdXQgYSBXZWJHTCBjb250ZXh0LlxuXG4gIC8vIFByb3ZpZGVzIGEgd2F5IHRvIG9wdCBvdXQgb2YgZGlzdG9ydGlvblxuICBpZiAodGhpcy5sYXllcl8ucHJlZGlzdG9ydGVkKSB7XG4gICAgdGhpcy5jYXJkYm9hcmRVSV8gPSBuZXcgQ2FyZGJvYXJkVUkoZ2wpO1xuICB9IGVsc2Uge1xuICAgIC8vIENyZWF0ZSBhIG5ldyBkaXN0b3J0ZXIgZm9yIHRoZSB0YXJnZXQgY29udGV4dFxuICAgIHRoaXMuZGlzdG9ydGVyXyA9IG5ldyBDYXJkYm9hcmREaXN0b3J0ZXIoZ2wpO1xuICAgIHRoaXMuZGlzdG9ydGVyXy51cGRhdGVEZXZpY2VJbmZvKHRoaXMuZGV2aWNlSW5mb18pO1xuICAgIHRoaXMuY2FyZGJvYXJkVUlfID0gdGhpcy5kaXN0b3J0ZXJfLmNhcmRib2FyZFVJO1xuXG4gICAgaWYgKHRoaXMubGF5ZXJfLmxlZnRCb3VuZHMgfHwgdGhpcy5sYXllcl8ucmlnaHRCb3VuZHMpIHtcbiAgICAgIHRoaXMuZGlzdG9ydGVyXy5zZXRUZXh0dXJlQm91bmRzKHRoaXMubGF5ZXJfLmxlZnRCb3VuZHMsIHRoaXMubGF5ZXJfLnJpZ2h0Qm91bmRzKTtcbiAgICB9XG4gIH1cblxuICB0aGlzLmNhcmRib2FyZFVJXy5saXN0ZW4oZnVuY3Rpb24oKSB7XG4gICAgLy8gT3B0aW9ucyBjbGlja2VkXG4gICAgdGhpcy52aWV3ZXJTZWxlY3Rvcl8uc2hvdyh0aGlzLmxheWVyXy5zb3VyY2UucGFyZW50RWxlbWVudCk7XG4gIH0uYmluZCh0aGlzKSwgZnVuY3Rpb24oKSB7XG4gICAgLy8gQmFjayBjbGlja2VkXG4gICAgdGhpcy5leGl0UHJlc2VudCgpO1xuICB9LmJpbmQodGhpcykpO1xuXG4gIGlmIChVdGlsLmlzTGFuZHNjYXBlTW9kZSgpICYmIFV0aWwuaXNNb2JpbGUoKSkge1xuICAgIC8vIEluIGxhbmRzY2FwZSBtb2RlLCB0ZW1wb3JhcmlseSBzaG93IHRoZSBcInB1dCBpbnRvIENhcmRib2FyZFwiXG4gICAgLy8gaW50ZXJzdGl0aWFsLiBPdGhlcndpc2UsIGRvIHRoZSBkZWZhdWx0IHRoaW5nLlxuICAgIHRoaXMucm90YXRlSW5zdHJ1Y3Rpb25zXy5zaG93VGVtcG9yYXJpbHkoMzAwMCwgdGhpcy5sYXllcl8uc291cmNlLnBhcmVudEVsZW1lbnQpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMucm90YXRlSW5zdHJ1Y3Rpb25zXy51cGRhdGUoKTtcbiAgfVxuXG4gIC8vIExpc3RlbiBmb3Igb3JpZW50YXRpb24gY2hhbmdlIGV2ZW50cyBpbiBvcmRlciB0byBzaG93IGludGVyc3RpdGlhbC5cbiAgdGhpcy5vcmllbnRhdGlvbkhhbmRsZXIgPSB0aGlzLm9uT3JpZW50YXRpb25DaGFuZ2VfLmJpbmQodGhpcyk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdvcmllbnRhdGlvbmNoYW5nZScsIHRoaXMub3JpZW50YXRpb25IYW5kbGVyKTtcblxuICAvLyBGaXJlIHRoaXMgZXZlbnQgaW5pdGlhbGx5LCB0byBnaXZlIGdlb21ldHJ5LWRpc3RvcnRpb24gY2xpZW50cyB0aGUgY2hhbmNlXG4gIC8vIHRvIGRvIHNvbWV0aGluZyBjdXN0b20uXG4gIHRoaXMuZmlyZVZSRGlzcGxheURldmljZVBhcmFtc0NoYW5nZV8oKTtcbn07XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUuZW5kUHJlc2VudF8gPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuZGlzdG9ydGVyXykge1xuICAgIHRoaXMuZGlzdG9ydGVyXy5kZXN0cm95KCk7XG4gICAgdGhpcy5kaXN0b3J0ZXJfID0gbnVsbDtcbiAgfVxuICBpZiAodGhpcy5jYXJkYm9hcmRVSV8pIHtcbiAgICB0aGlzLmNhcmRib2FyZFVJXy5kZXN0cm95KCk7XG4gICAgdGhpcy5jYXJkYm9hcmRVSV8gPSBudWxsO1xuICB9XG5cbiAgdGhpcy5yb3RhdGVJbnN0cnVjdGlvbnNfLmhpZGUoKTtcbiAgdGhpcy52aWV3ZXJTZWxlY3Rvcl8uaGlkZSgpO1xuXG4gIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdvcmllbnRhdGlvbmNoYW5nZScsIHRoaXMub3JpZW50YXRpb25IYW5kbGVyKTtcbn07XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUuc3VibWl0RnJhbWUgPSBmdW5jdGlvbihwb3NlKSB7XG4gIGlmICh0aGlzLmRpc3RvcnRlcl8pIHtcbiAgICB0aGlzLmRpc3RvcnRlcl8uc3VibWl0RnJhbWUoKTtcbiAgfSBlbHNlIGlmICh0aGlzLmNhcmRib2FyZFVJXykge1xuICAgIHRoaXMuY2FyZGJvYXJkVUlfLnJlbmRlcigpO1xuICB9XG59O1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLm9uT3JpZW50YXRpb25DaGFuZ2VfID0gZnVuY3Rpb24oZSkge1xuICBjb25zb2xlLmxvZygnb25PcmllbnRhdGlvbkNoYW5nZV8nKTtcblxuICAvLyBIaWRlIHRoZSB2aWV3ZXIgc2VsZWN0b3IuXG4gIHRoaXMudmlld2VyU2VsZWN0b3JfLmhpZGUoKTtcblxuICAvLyBVcGRhdGUgdGhlIHJvdGF0ZSBpbnN0cnVjdGlvbnMuXG4gIHRoaXMucm90YXRlSW5zdHJ1Y3Rpb25zXy51cGRhdGUoKTtcbn07XG5cbkNhcmRib2FyZFZSRGlzcGxheS5wcm90b3R5cGUub25WaWV3ZXJDaGFuZ2VkXyA9IGZ1bmN0aW9uKHZpZXdlcikge1xuICB0aGlzLmRldmljZUluZm9fLnNldFZpZXdlcih2aWV3ZXIpO1xuXG4gIC8vIFVwZGF0ZSB0aGUgZGlzdG9ydGlvbiBhcHByb3ByaWF0ZWx5LlxuICB0aGlzLmRpc3RvcnRlcl8udXBkYXRlRGV2aWNlSW5mbyh0aGlzLmRldmljZUluZm9fKTtcblxuICAvLyBGaXJlIGEgbmV3IGV2ZW50IGNvbnRhaW5pbmcgdmlld2VyIGFuZCBkZXZpY2UgcGFyYW1ldGVycyBmb3IgY2xpZW50cyB0aGF0XG4gIC8vIHdhbnQgdG8gaW1wbGVtZW50IHRoZWlyIG93biBnZW9tZXRyeS1iYXNlZCBkaXN0b3J0aW9uLlxuICB0aGlzLmZpcmVWUkRpc3BsYXlEZXZpY2VQYXJhbXNDaGFuZ2VfKCk7XG59O1xuXG5DYXJkYm9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmZpcmVWUkRpc3BsYXlEZXZpY2VQYXJhbXNDaGFuZ2VfID0gZnVuY3Rpb24oKSB7XG4gIHZhciBldmVudCA9IG5ldyBDdXN0b21FdmVudCgndnJkaXNwbGF5ZGV2aWNlcGFyYW1zY2hhbmdlJywge1xuICAgIGRldGFpbDoge1xuICAgICAgdnJkaXNwbGF5OiB0aGlzLFxuICAgICAgZGV2aWNlSW5mbzogdGhpcy5kZXZpY2VJbmZvXyxcbiAgICB9XG4gIH0pO1xuICB3aW5kb3cuZGlzcGF0Y2hFdmVudChldmVudCk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IENhcmRib2FyZFZSRGlzcGxheTtcbiIsIi8qXG5Db3B5cmlnaHQgKGMpIDIwMTYsIEJyYW5kb24gSm9uZXMuXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbm9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbmluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbnRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbmNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbmFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cblRIRSBTT0ZUV0FSRS5cbiovXG5cbi8qXG5DYWNoZXMgc3BlY2lmaWVkIEdMIHN0YXRlLCBydW5zIGEgY2FsbGJhY2ssIGFuZCByZXN0b3JlcyB0aGUgY2FjaGVkIHN0YXRlIHdoZW5cbmRvbmUuXG5cbkV4YW1wbGUgdXNhZ2U6XG5cbnZhciBzYXZlZFN0YXRlID0gW1xuICBnbC5BUlJBWV9CVUZGRVJfQklORElORyxcblxuICAvLyBURVhUVVJFX0JJTkRJTkdfMkQgb3IgX0NVQkVfTUFQIG11c3QgYWx3YXlzIGJlIGZvbGxvd2VkIGJ5IHRoZSB0ZXh1cmUgdW5pdC5cbiAgZ2wuVEVYVFVSRV9CSU5ESU5HXzJELCBnbC5URVhUVVJFMCxcblxuICBnbC5DTEVBUl9DT0xPUixcbl07XG4vLyBBZnRlciB0aGlzIGNhbGwgdGhlIGFycmF5IGJ1ZmZlciwgdGV4dHVyZSB1bml0IDAsIGFjdGl2ZSB0ZXh0dXJlLCBhbmQgY2xlYXJcbi8vIGNvbG9yIHdpbGwgYmUgcmVzdG9yZWQuIFRoZSB2aWV3cG9ydCB3aWxsIHJlbWFpbiBjaGFuZ2VkLCBob3dldmVyLCBiZWNhdXNlXG4vLyBnbC5WSUVXUE9SVCB3YXMgbm90IGluY2x1ZGVkIGluIHRoZSBzYXZlZFN0YXRlIGxpc3QuXG5XR0xVUHJlc2VydmVHTFN0YXRlKGdsLCBzYXZlZFN0YXRlLCBmdW5jdGlvbihnbCkge1xuICBnbC52aWV3cG9ydCgwLCAwLCBnbC5kcmF3aW5nQnVmZmVyV2lkdGgsIGdsLmRyYXdpbmdCdWZmZXJIZWlnaHQpO1xuXG4gIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBidWZmZXIpO1xuICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgLi4uLik7XG5cbiAgZ2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCk7XG4gIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRleHR1cmUpO1xuICBnbC50ZXhJbWFnZTJEKGdsLlRFWFRVUkVfMkQsIC4uLik7XG5cbiAgZ2wuY2xlYXJDb2xvcigxLCAwLCAwLCAxKTtcbiAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCk7XG59KTtcblxuTm90ZSB0aGF0IHRoaXMgaXMgbm90IGludGVuZGVkIHRvIGJlIGZhc3QuIE1hbmFnaW5nIHN0YXRlIGluIHlvdXIgb3duIGNvZGUgdG9cbmF2b2lkIHJlZHVuZGFudCBzdGF0ZSBzZXR0aW5nIGFuZCBxdWVyeWluZyB3aWxsIGFsd2F5cyBiZSBmYXN0ZXIuIFRoaXMgZnVuY3Rpb25cbmlzIG1vc3QgdXNlZnVsIGZvciBjYXNlcyB3aGVyZSB5b3UgbWF5IG5vdCBoYXZlIGZ1bGwgY29udHJvbCBvdmVyIHRoZSBXZWJHTFxuY2FsbHMgYmVpbmcgbWFkZSwgc3VjaCBhcyB0b29saW5nIG9yIGVmZmVjdCBpbmplY3RvcnMuXG4qL1xuXG5mdW5jdGlvbiBXR0xVUHJlc2VydmVHTFN0YXRlKGdsLCBiaW5kaW5ncywgY2FsbGJhY2spIHtcbiAgaWYgKCFiaW5kaW5ncykge1xuICAgIGNhbGxiYWNrKGdsKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgYm91bmRWYWx1ZXMgPSBbXTtcblxuICB2YXIgYWN0aXZlVGV4dHVyZSA9IG51bGw7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYmluZGluZ3MubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgYmluZGluZyA9IGJpbmRpbmdzW2ldO1xuICAgIHN3aXRjaCAoYmluZGluZykge1xuICAgICAgY2FzZSBnbC5URVhUVVJFX0JJTkRJTkdfMkQ6XG4gICAgICBjYXNlIGdsLlRFWFRVUkVfQklORElOR19DVUJFX01BUDpcbiAgICAgICAgdmFyIHRleHR1cmVVbml0ID0gYmluZGluZ3NbKytpXTtcbiAgICAgICAgaWYgKHRleHR1cmVVbml0IDwgZ2wuVEVYVFVSRTAgfHwgdGV4dHVyZVVuaXQgPiBnbC5URVhUVVJFMzEpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVEVYVFVSRV9CSU5ESU5HXzJEIG9yIFRFWFRVUkVfQklORElOR19DVUJFX01BUCBtdXN0IGJlIGZvbGxvd2VkIGJ5IGEgdmFsaWQgdGV4dHVyZSB1bml0XCIpO1xuICAgICAgICAgIGJvdW5kVmFsdWVzLnB1c2gobnVsbCwgbnVsbCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFhY3RpdmVUZXh0dXJlKSB7XG4gICAgICAgICAgYWN0aXZlVGV4dHVyZSA9IGdsLmdldFBhcmFtZXRlcihnbC5BQ1RJVkVfVEVYVFVSRSk7XG4gICAgICAgIH1cbiAgICAgICAgZ2wuYWN0aXZlVGV4dHVyZSh0ZXh0dXJlVW5pdCk7XG4gICAgICAgIGJvdW5kVmFsdWVzLnB1c2goZ2wuZ2V0UGFyYW1ldGVyKGJpbmRpbmcpLCBudWxsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLkFDVElWRV9URVhUVVJFOlxuICAgICAgICBhY3RpdmVUZXh0dXJlID0gZ2wuZ2V0UGFyYW1ldGVyKGdsLkFDVElWRV9URVhUVVJFKTtcbiAgICAgICAgYm91bmRWYWx1ZXMucHVzaChudWxsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBib3VuZFZhbHVlcy5wdXNoKGdsLmdldFBhcmFtZXRlcihiaW5kaW5nKSk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGNhbGxiYWNrKGdsKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGJpbmRpbmdzLmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGJpbmRpbmcgPSBiaW5kaW5nc1tpXTtcbiAgICB2YXIgYm91bmRWYWx1ZSA9IGJvdW5kVmFsdWVzW2ldO1xuICAgIHN3aXRjaCAoYmluZGluZykge1xuICAgICAgY2FzZSBnbC5BQ1RJVkVfVEVYVFVSRTpcbiAgICAgICAgYnJlYWs7IC8vIElnbm9yZSB0aGlzIGJpbmRpbmcsIHNpbmNlIHdlIHNwZWNpYWwtY2FzZSBpdCB0byBoYXBwZW4gbGFzdC5cbiAgICAgIGNhc2UgZ2wuQVJSQVlfQlVGRkVSX0JJTkRJTkc6XG4gICAgICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBib3VuZFZhbHVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLkNPTE9SX0NMRUFSX1ZBTFVFOlxuICAgICAgICBnbC5jbGVhckNvbG9yKGJvdW5kVmFsdWVbMF0sIGJvdW5kVmFsdWVbMV0sIGJvdW5kVmFsdWVbMl0sIGJvdW5kVmFsdWVbM10pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuQ09MT1JfV1JJVEVNQVNLOlxuICAgICAgICBnbC5jb2xvck1hc2soYm91bmRWYWx1ZVswXSwgYm91bmRWYWx1ZVsxXSwgYm91bmRWYWx1ZVsyXSwgYm91bmRWYWx1ZVszXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBnbC5DVVJSRU5UX1BST0dSQU06XG4gICAgICAgIGdsLnVzZVByb2dyYW0oYm91bmRWYWx1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUl9CSU5ESU5HOlxuICAgICAgICBnbC5iaW5kQnVmZmVyKGdsLkVMRU1FTlRfQVJSQVlfQlVGRkVSLCBib3VuZFZhbHVlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIGdsLkZSQU1FQlVGRkVSX0JJTkRJTkc6XG4gICAgICAgIGdsLmJpbmRGcmFtZWJ1ZmZlcihnbC5GUkFNRUJVRkZFUiwgYm91bmRWYWx1ZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBnbC5SRU5ERVJCVUZGRVJfQklORElORzpcbiAgICAgICAgZ2wuYmluZFJlbmRlcmJ1ZmZlcihnbC5SRU5ERVJCVUZGRVIsIGJvdW5kVmFsdWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuVEVYVFVSRV9CSU5ESU5HXzJEOlxuICAgICAgICB2YXIgdGV4dHVyZVVuaXQgPSBiaW5kaW5nc1srK2ldO1xuICAgICAgICBpZiAodGV4dHVyZVVuaXQgPCBnbC5URVhUVVJFMCB8fCB0ZXh0dXJlVW5pdCA+IGdsLlRFWFRVUkUzMSlcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZ2wuYWN0aXZlVGV4dHVyZSh0ZXh0dXJlVW5pdCk7XG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIGJvdW5kVmFsdWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuVEVYVFVSRV9CSU5ESU5HX0NVQkVfTUFQOlxuICAgICAgICB2YXIgdGV4dHVyZVVuaXQgPSBiaW5kaW5nc1srK2ldO1xuICAgICAgICBpZiAodGV4dHVyZVVuaXQgPCBnbC5URVhUVVJFMCB8fCB0ZXh0dXJlVW5pdCA+IGdsLlRFWFRVUkUzMSlcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZ2wuYWN0aXZlVGV4dHVyZSh0ZXh0dXJlVW5pdCk7XG4gICAgICAgIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfQ1VCRV9NQVAsIGJvdW5kVmFsdWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuVklFV1BPUlQ6XG4gICAgICAgIGdsLnZpZXdwb3J0KGJvdW5kVmFsdWVbMF0sIGJvdW5kVmFsdWVbMV0sIGJvdW5kVmFsdWVbMl0sIGJvdW5kVmFsdWVbM10pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgZ2wuQkxFTkQ6XG4gICAgICBjYXNlIGdsLkNVTExfRkFDRTpcbiAgICAgIGNhc2UgZ2wuREVQVEhfVEVTVDpcbiAgICAgIGNhc2UgZ2wuU0NJU1NPUl9URVNUOlxuICAgICAgY2FzZSBnbC5TVEVOQ0lMX1RFU1Q6XG4gICAgICAgIGlmIChib3VuZFZhbHVlKSB7XG4gICAgICAgICAgZ2wuZW5hYmxlKGJpbmRpbmcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGdsLmRpc2FibGUoYmluZGluZyk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBjb25zb2xlLmxvZyhcIk5vIEdMIHJlc3RvcmUgYmVoYXZpb3IgZm9yIDB4XCIgKyBiaW5kaW5nLnRvU3RyaW5nKDE2KSk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChhY3RpdmVUZXh0dXJlKSB7XG4gICAgICBnbC5hY3RpdmVUZXh0dXJlKGFjdGl2ZVRleHR1cmUpO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFdHTFVQcmVzZXJ2ZUdMU3RhdGU7IiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIERpc3RvcnRpb24gPSByZXF1aXJlKCcuL2Rpc3RvcnRpb24vZGlzdG9ydGlvbi5qcycpO1xudmFyIFRIUkVFID0gcmVxdWlyZSgnLi90aHJlZS1tYXRoLmpzJyk7XG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG5mdW5jdGlvbiBEZXZpY2UocGFyYW1zKSB7XG4gIHRoaXMud2lkdGggPSBwYXJhbXMud2lkdGggfHwgVXRpbC5nZXRTY3JlZW5XaWR0aCgpO1xuICB0aGlzLmhlaWdodCA9IHBhcmFtcy5oZWlnaHQgfHwgVXRpbC5nZXRTY3JlZW5IZWlnaHQoKTtcbiAgdGhpcy53aWR0aE1ldGVycyA9IHBhcmFtcy53aWR0aE1ldGVycztcbiAgdGhpcy5oZWlnaHRNZXRlcnMgPSBwYXJhbXMuaGVpZ2h0TWV0ZXJzO1xuICB0aGlzLmJldmVsTWV0ZXJzID0gcGFyYW1zLmJldmVsTWV0ZXJzO1xufVxuXG5cbi8vIEZhbGxiYWNrIEFuZHJvaWQgZGV2aWNlIChiYXNlZCBvbiBOZXh1cyA1IG1lYXN1cmVtZW50cykgZm9yIHVzZSB3aGVuXG4vLyB3ZSBjYW4ndCByZWNvZ25pemUgYW4gQW5kcm9pZCBkZXZpY2UuXG52YXIgREVGQVVMVF9BTkRST0lEID0gbmV3IERldmljZSh7XG4gIHdpZHRoTWV0ZXJzOiAwLjExMCxcbiAgaGVpZ2h0TWV0ZXJzOiAwLjA2MixcbiAgYmV2ZWxNZXRlcnM6IDAuMDA0XG59KTtcblxuLy8gRmFsbGJhY2sgaU9TIGRldmljZSAoYmFzZWQgb24gaVBob25lNikgZm9yIHVzZSB3aGVuXG4vLyB3ZSBjYW4ndCByZWNvZ25pemUgYW4gQW5kcm9pZCBkZXZpY2UuXG52YXIgREVGQVVMVF9JT1MgPSBuZXcgRGV2aWNlKHtcbiAgd2lkdGhNZXRlcnM6IDAuMTAzOCxcbiAgaGVpZ2h0TWV0ZXJzOiAwLjA1ODQsXG4gIGJldmVsTWV0ZXJzOiAwLjAwNFxufSk7XG5cblxudmFyIFZpZXdlcnMgPSB7XG4gIENhcmRib2FyZFYxOiBuZXcgQ2FyZGJvYXJkVmlld2VyKHtcbiAgICBpZDogJ0NhcmRib2FyZFYxJyxcbiAgICBsYWJlbDogJ0NhcmRib2FyZCBJL08gMjAxNCcsXG4gICAgZm92OiA0MCxcbiAgICBpbnRlckxlbnNEaXN0YW5jZTogMC4wNjAsXG4gICAgYmFzZWxpbmVMZW5zRGlzdGFuY2U6IDAuMDM1LFxuICAgIHNjcmVlbkxlbnNEaXN0YW5jZTogMC4wNDIsXG4gICAgZGlzdG9ydGlvbkNvZWZmaWNpZW50czogWzAuNDQxLCAwLjE1Nl0sXG4gICAgaW52ZXJzZUNvZWZmaWNpZW50czogWy0wLjQ0MTAwMzUsIDAuNDI3NTYxNTUsIC0wLjQ4MDQ0MzksIDAuNTQ2MDEzOSxcbiAgICAgIC0wLjU4ODIxMTgzLCAwLjU3MzM5MzgsIC0wLjQ4MzAzMjAyLCAwLjMzMjk5MDgzLCAtMC4xNzU3Mzg0MSxcbiAgICAgIDAuMDY1MTc3MiwgLTAuMDE0ODg5NjMsIDAuMDAxNTU5ODM0XVxuICB9KSxcbiAgQ2FyZGJvYXJkVjI6IG5ldyBDYXJkYm9hcmRWaWV3ZXIoe1xuICAgIGlkOiAnQ2FyZGJvYXJkVjInLFxuICAgIGxhYmVsOiAnQ2FyZGJvYXJkIEkvTyAyMDE1JyxcbiAgICBmb3Y6IDYwLFxuICAgIGludGVyTGVuc0Rpc3RhbmNlOiAwLjA2NCxcbiAgICBiYXNlbGluZUxlbnNEaXN0YW5jZTogMC4wMzUsXG4gICAgc2NyZWVuTGVuc0Rpc3RhbmNlOiAwLjAzOSxcbiAgICBkaXN0b3J0aW9uQ29lZmZpY2llbnRzOiBbMC4zNCwgMC41NV0sXG4gICAgaW52ZXJzZUNvZWZmaWNpZW50czogWy0wLjMzODM2NzA0LCAtMC4xODE2MjE4NSwgMC44NjI2NTUsIC0xLjI0NjIwNTEsXG4gICAgICAxLjA1NjA2MDIsIC0wLjU4MjA4MzE3LCAwLjIxNjA5MDc4LCAtMC4wNTQ0NDgyMywgMC4wMDkxNzc5NTYsXG4gICAgICAtOS45MDQxNjlFLTQsIDYuMTgzNTM1RS01LCAtMS42OTgxODAzRS02XVxuICB9KVxufTtcblxuXG52YXIgREVGQVVMVF9MRUZUX0NFTlRFUiA9IHt4OiAwLjUsIHk6IDAuNX07XG52YXIgREVGQVVMVF9SSUdIVF9DRU5URVIgPSB7eDogMC41LCB5OiAwLjV9O1xuXG4vKipcbiAqIE1hbmFnZXMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGRldmljZSBhbmQgdGhlIHZpZXdlci5cbiAqXG4gKiBkZXZpY2VQYXJhbXMgaW5kaWNhdGVzIHRoZSBwYXJhbWV0ZXJzIG9mIHRoZSBkZXZpY2UgdG8gdXNlIChnZW5lcmFsbHlcbiAqIG9idGFpbmVkIGZyb20gZHBkYi5nZXREZXZpY2VQYXJhbXMoKSkuIENhbiBiZSBudWxsIHRvIG1lYW4gbm8gZGV2aWNlXG4gKiBwYXJhbXMgd2VyZSBmb3VuZC5cbiAqL1xuZnVuY3Rpb24gRGV2aWNlSW5mbyhkZXZpY2VQYXJhbXMpIHtcbiAgdGhpcy52aWV3ZXIgPSBWaWV3ZXJzLkNhcmRib2FyZFYyO1xuICB0aGlzLnVwZGF0ZURldmljZVBhcmFtcyhkZXZpY2VQYXJhbXMpO1xuICB0aGlzLmRpc3RvcnRpb24gPSBuZXcgRGlzdG9ydGlvbih0aGlzLnZpZXdlci5kaXN0b3J0aW9uQ29lZmZpY2llbnRzKTtcbn1cblxuRGV2aWNlSW5mby5wcm90b3R5cGUudXBkYXRlRGV2aWNlUGFyYW1zID0gZnVuY3Rpb24oZGV2aWNlUGFyYW1zKSB7XG4gIHRoaXMuZGV2aWNlID0gdGhpcy5kZXRlcm1pbmVEZXZpY2VfKGRldmljZVBhcmFtcykgfHwgdGhpcy5kZXZpY2U7XG59O1xuXG5EZXZpY2VJbmZvLnByb3RvdHlwZS5nZXREZXZpY2UgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuZGV2aWNlO1xufTtcblxuRGV2aWNlSW5mby5wcm90b3R5cGUuc2V0Vmlld2VyID0gZnVuY3Rpb24odmlld2VyKSB7XG4gIHRoaXMudmlld2VyID0gdmlld2VyO1xuICB0aGlzLmRpc3RvcnRpb24gPSBuZXcgRGlzdG9ydGlvbih0aGlzLnZpZXdlci5kaXN0b3J0aW9uQ29lZmZpY2llbnRzKTtcbn07XG5cbkRldmljZUluZm8ucHJvdG90eXBlLmRldGVybWluZURldmljZV8gPSBmdW5jdGlvbihkZXZpY2VQYXJhbXMpIHtcbiAgaWYgKCFkZXZpY2VQYXJhbXMpIHtcbiAgICAvLyBObyBwYXJhbWV0ZXJzLCBzbyB1c2UgYSBkZWZhdWx0LlxuICAgIGlmIChVdGlsLmlzSU9TKCkpIHtcbiAgICAgIGNvbnNvbGUud2FybignVXNpbmcgZmFsbGJhY2sgQW5kcm9pZCBkZXZpY2UgbWVhc3VyZW1lbnRzLicpO1xuICAgICAgcmV0dXJuIERFRkFVTFRfSU9TO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1VzaW5nIGZhbGxiYWNrIGlPUyBkZXZpY2UgbWVhc3VyZW1lbnRzLicpO1xuICAgICAgcmV0dXJuIERFRkFVTFRfQU5EUk9JRDtcbiAgICB9XG4gIH1cblxuICAvLyBDb21wdXRlIGRldmljZSBzY3JlZW4gZGltZW5zaW9ucyBiYXNlZCBvbiBkZXZpY2VQYXJhbXMuXG4gIHZhciBNRVRFUlNfUEVSX0lOQ0ggPSAwLjAyNTQ7XG4gIHZhciBtZXRlcnNQZXJQaXhlbFggPSBNRVRFUlNfUEVSX0lOQ0ggLyBkZXZpY2VQYXJhbXMueGRwaTtcbiAgdmFyIG1ldGVyc1BlclBpeGVsWSA9IE1FVEVSU19QRVJfSU5DSCAvIGRldmljZVBhcmFtcy55ZHBpO1xuICB2YXIgd2lkdGggPSBVdGlsLmdldFNjcmVlbldpZHRoKCk7XG4gIHZhciBoZWlnaHQgPSBVdGlsLmdldFNjcmVlbkhlaWdodCgpO1xuICByZXR1cm4gbmV3IERldmljZSh7XG4gICAgd2lkdGhNZXRlcnM6IG1ldGVyc1BlclBpeGVsWCAqIHdpZHRoLFxuICAgIGhlaWdodE1ldGVyczogbWV0ZXJzUGVyUGl4ZWxZICogaGVpZ2h0LFxuICAgIGJldmVsTWV0ZXJzOiBkZXZpY2VQYXJhbXMuYmV2ZWxNbSAqIDAuMDAxLFxuICB9KTtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyBmaWVsZCBvZiB2aWV3IGZvciB0aGUgbGVmdCBleWUuXG4gKi9cbkRldmljZUluZm8ucHJvdG90eXBlLmdldERpc3RvcnRlZEZpZWxkT2ZWaWV3TGVmdEV5ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgdmlld2VyID0gdGhpcy52aWV3ZXI7XG4gIHZhciBkZXZpY2UgPSB0aGlzLmRldmljZTtcbiAgdmFyIGRpc3RvcnRpb24gPSB0aGlzLmRpc3RvcnRpb247XG5cbiAgLy8gRGV2aWNlLmhlaWdodCBhbmQgZGV2aWNlLndpZHRoIGZvciBkZXZpY2UgaW4gcG9ydHJhaXQgbW9kZSwgc28gdHJhbnNwb3NlLlxuICB2YXIgZXllVG9TY3JlZW5EaXN0YW5jZSA9IHZpZXdlci5zY3JlZW5MZW5zRGlzdGFuY2U7XG5cbiAgdmFyIG91dGVyRGlzdCA9IChkZXZpY2Uud2lkdGhNZXRlcnMgLSB2aWV3ZXIuaW50ZXJMZW5zRGlzdGFuY2UpIC8gMjtcbiAgdmFyIGlubmVyRGlzdCA9IHZpZXdlci5pbnRlckxlbnNEaXN0YW5jZSAvIDI7XG4gIHZhciBib3R0b21EaXN0ID0gdmlld2VyLmJhc2VsaW5lTGVuc0Rpc3RhbmNlIC0gZGV2aWNlLmJldmVsTWV0ZXJzO1xuICB2YXIgdG9wRGlzdCA9IGRldmljZS5oZWlnaHRNZXRlcnMgLSBib3R0b21EaXN0O1xuXG4gIHZhciBvdXRlckFuZ2xlID0gVEhSRUUuTWF0aC5yYWRUb0RlZyhNYXRoLmF0YW4oXG4gICAgICBkaXN0b3J0aW9uLmRpc3RvcnQob3V0ZXJEaXN0IC8gZXllVG9TY3JlZW5EaXN0YW5jZSkpKTtcbiAgdmFyIGlubmVyQW5nbGUgPSBUSFJFRS5NYXRoLnJhZFRvRGVnKE1hdGguYXRhbihcbiAgICAgIGRpc3RvcnRpb24uZGlzdG9ydChpbm5lckRpc3QgLyBleWVUb1NjcmVlbkRpc3RhbmNlKSkpO1xuICB2YXIgYm90dG9tQW5nbGUgPSBUSFJFRS5NYXRoLnJhZFRvRGVnKE1hdGguYXRhbihcbiAgICAgIGRpc3RvcnRpb24uZGlzdG9ydChib3R0b21EaXN0IC8gZXllVG9TY3JlZW5EaXN0YW5jZSkpKTtcbiAgdmFyIHRvcEFuZ2xlID0gVEhSRUUuTWF0aC5yYWRUb0RlZyhNYXRoLmF0YW4oXG4gICAgICBkaXN0b3J0aW9uLmRpc3RvcnQodG9wRGlzdCAvIGV5ZVRvU2NyZWVuRGlzdGFuY2UpKSk7XG5cbiAgcmV0dXJuIHtcbiAgICBsZWZ0RGVncmVlczogTWF0aC5taW4ob3V0ZXJBbmdsZSwgdmlld2VyLmZvdiksXG4gICAgcmlnaHREZWdyZWVzOiBNYXRoLm1pbihpbm5lckFuZ2xlLCB2aWV3ZXIuZm92KSxcbiAgICBkb3duRGVncmVlczogTWF0aC5taW4oYm90dG9tQW5nbGUsIHZpZXdlci5mb3YpLFxuICAgIHVwRGVncmVlczogTWF0aC5taW4odG9wQW5nbGUsIHZpZXdlci5mb3YpXG4gIH07XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIHRhbi1hbmdsZXMgZnJvbSB0aGUgbWF4aW11bSBGT1YgZm9yIHRoZSBsZWZ0IGV5ZSBmb3IgdGhlXG4gKiBjdXJyZW50IGRldmljZSBhbmQgc2NyZWVuIHBhcmFtZXRlcnMuXG4gKi9cbkRldmljZUluZm8ucHJvdG90eXBlLmdldExlZnRFeWVWaXNpYmxlVGFuQW5nbGVzID0gZnVuY3Rpb24oKSB7XG4gIHZhciB2aWV3ZXIgPSB0aGlzLnZpZXdlcjtcbiAgdmFyIGRldmljZSA9IHRoaXMuZGV2aWNlO1xuICB2YXIgZGlzdG9ydGlvbiA9IHRoaXMuZGlzdG9ydGlvbjtcblxuICAvLyBUYW4tYW5nbGVzIGZyb20gdGhlIG1heCBGT1YuXG4gIHZhciBmb3ZMZWZ0ID0gTWF0aC50YW4oLVRIUkVFLk1hdGguZGVnVG9SYWQodmlld2VyLmZvdikpO1xuICB2YXIgZm92VG9wID0gTWF0aC50YW4oVEhSRUUuTWF0aC5kZWdUb1JhZCh2aWV3ZXIuZm92KSk7XG4gIHZhciBmb3ZSaWdodCA9IE1hdGgudGFuKFRIUkVFLk1hdGguZGVnVG9SYWQodmlld2VyLmZvdikpO1xuICB2YXIgZm92Qm90dG9tID0gTWF0aC50YW4oLVRIUkVFLk1hdGguZGVnVG9SYWQodmlld2VyLmZvdikpO1xuICAvLyBWaWV3cG9ydCBzaXplLlxuICB2YXIgaGFsZldpZHRoID0gZGV2aWNlLndpZHRoTWV0ZXJzIC8gNDtcbiAgdmFyIGhhbGZIZWlnaHQgPSBkZXZpY2UuaGVpZ2h0TWV0ZXJzIC8gMjtcbiAgLy8gVmlld3BvcnQgY2VudGVyLCBtZWFzdXJlZCBmcm9tIGxlZnQgbGVucyBwb3NpdGlvbi5cbiAgdmFyIHZlcnRpY2FsTGVuc09mZnNldCA9ICh2aWV3ZXIuYmFzZWxpbmVMZW5zRGlzdGFuY2UgLSBkZXZpY2UuYmV2ZWxNZXRlcnMgLSBoYWxmSGVpZ2h0KTtcbiAgdmFyIGNlbnRlclggPSB2aWV3ZXIuaW50ZXJMZW5zRGlzdGFuY2UgLyAyIC0gaGFsZldpZHRoO1xuICB2YXIgY2VudGVyWSA9IC12ZXJ0aWNhbExlbnNPZmZzZXQ7XG4gIHZhciBjZW50ZXJaID0gdmlld2VyLnNjcmVlbkxlbnNEaXN0YW5jZTtcbiAgLy8gVGFuLWFuZ2xlcyBvZiB0aGUgdmlld3BvcnQgZWRnZXMsIGFzIHNlZW4gdGhyb3VnaCB0aGUgbGVucy5cbiAgdmFyIHNjcmVlbkxlZnQgPSBkaXN0b3J0aW9uLmRpc3RvcnQoKGNlbnRlclggLSBoYWxmV2lkdGgpIC8gY2VudGVyWik7XG4gIHZhciBzY3JlZW5Ub3AgPSBkaXN0b3J0aW9uLmRpc3RvcnQoKGNlbnRlclkgKyBoYWxmSGVpZ2h0KSAvIGNlbnRlclopO1xuICB2YXIgc2NyZWVuUmlnaHQgPSBkaXN0b3J0aW9uLmRpc3RvcnQoKGNlbnRlclggKyBoYWxmV2lkdGgpIC8gY2VudGVyWik7XG4gIHZhciBzY3JlZW5Cb3R0b20gPSBkaXN0b3J0aW9uLmRpc3RvcnQoKGNlbnRlclkgLSBoYWxmSGVpZ2h0KSAvIGNlbnRlclopO1xuICAvLyBDb21wYXJlIHRoZSB0d28gc2V0cyBvZiB0YW4tYW5nbGVzIGFuZCB0YWtlIHRoZSB2YWx1ZSBjbG9zZXIgdG8gemVybyBvbiBlYWNoIHNpZGUuXG4gIHZhciByZXN1bHQgPSBuZXcgRmxvYXQzMkFycmF5KDQpO1xuICByZXN1bHRbMF0gPSBNYXRoLm1heChmb3ZMZWZ0LCBzY3JlZW5MZWZ0KTtcbiAgcmVzdWx0WzFdID0gTWF0aC5taW4oZm92VG9wLCBzY3JlZW5Ub3ApO1xuICByZXN1bHRbMl0gPSBNYXRoLm1pbihmb3ZSaWdodCwgc2NyZWVuUmlnaHQpO1xuICByZXN1bHRbM10gPSBNYXRoLm1heChmb3ZCb3R0b20sIHNjcmVlbkJvdHRvbSk7XG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgdGhlIHRhbi1hbmdsZXMgZnJvbSB0aGUgbWF4aW11bSBGT1YgZm9yIHRoZSBsZWZ0IGV5ZSBmb3IgdGhlXG4gKiBjdXJyZW50IGRldmljZSBhbmQgc2NyZWVuIHBhcmFtZXRlcnMsIGFzc3VtaW5nIG5vIGxlbnNlcy5cbiAqL1xuRGV2aWNlSW5mby5wcm90b3R5cGUuZ2V0TGVmdEV5ZU5vTGVuc1RhbkFuZ2xlcyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgdmlld2VyID0gdGhpcy52aWV3ZXI7XG4gIHZhciBkZXZpY2UgPSB0aGlzLmRldmljZTtcbiAgdmFyIGRpc3RvcnRpb24gPSB0aGlzLmRpc3RvcnRpb247XG5cbiAgdmFyIHJlc3VsdCA9IG5ldyBGbG9hdDMyQXJyYXkoNCk7XG4gIC8vIFRhbi1hbmdsZXMgZnJvbSB0aGUgbWF4IEZPVi5cbiAgdmFyIGZvdkxlZnQgPSBkaXN0b3J0aW9uLmRpc3RvcnRJbnZlcnNlKE1hdGgudGFuKC1USFJFRS5NYXRoLmRlZ1RvUmFkKHZpZXdlci5mb3YpKSk7XG4gIHZhciBmb3ZUb3AgPSBkaXN0b3J0aW9uLmRpc3RvcnRJbnZlcnNlKE1hdGgudGFuKFRIUkVFLk1hdGguZGVnVG9SYWQodmlld2VyLmZvdikpKTtcbiAgdmFyIGZvdlJpZ2h0ID0gZGlzdG9ydGlvbi5kaXN0b3J0SW52ZXJzZShNYXRoLnRhbihUSFJFRS5NYXRoLmRlZ1RvUmFkKHZpZXdlci5mb3YpKSk7XG4gIHZhciBmb3ZCb3R0b20gPSBkaXN0b3J0aW9uLmRpc3RvcnRJbnZlcnNlKE1hdGgudGFuKC1USFJFRS5NYXRoLmRlZ1RvUmFkKHZpZXdlci5mb3YpKSk7XG4gIC8vIFZpZXdwb3J0IHNpemUuXG4gIHZhciBoYWxmV2lkdGggPSBkZXZpY2Uud2lkdGhNZXRlcnMgLyA0O1xuICB2YXIgaGFsZkhlaWdodCA9IGRldmljZS5oZWlnaHRNZXRlcnMgLyAyO1xuICAvLyBWaWV3cG9ydCBjZW50ZXIsIG1lYXN1cmVkIGZyb20gbGVmdCBsZW5zIHBvc2l0aW9uLlxuICB2YXIgdmVydGljYWxMZW5zT2Zmc2V0ID0gKHZpZXdlci5iYXNlbGluZUxlbnNEaXN0YW5jZSAtIGRldmljZS5iZXZlbE1ldGVycyAtIGhhbGZIZWlnaHQpO1xuICB2YXIgY2VudGVyWCA9IHZpZXdlci5pbnRlckxlbnNEaXN0YW5jZSAvIDIgLSBoYWxmV2lkdGg7XG4gIHZhciBjZW50ZXJZID0gLXZlcnRpY2FsTGVuc09mZnNldDtcbiAgdmFyIGNlbnRlclogPSB2aWV3ZXIuc2NyZWVuTGVuc0Rpc3RhbmNlO1xuICAvLyBUYW4tYW5nbGVzIG9mIHRoZSB2aWV3cG9ydCBlZGdlcywgYXMgc2VlbiB0aHJvdWdoIHRoZSBsZW5zLlxuICB2YXIgc2NyZWVuTGVmdCA9IChjZW50ZXJYIC0gaGFsZldpZHRoKSAvIGNlbnRlclo7XG4gIHZhciBzY3JlZW5Ub3AgPSAoY2VudGVyWSArIGhhbGZIZWlnaHQpIC8gY2VudGVyWjtcbiAgdmFyIHNjcmVlblJpZ2h0ID0gKGNlbnRlclggKyBoYWxmV2lkdGgpIC8gY2VudGVyWjtcbiAgdmFyIHNjcmVlbkJvdHRvbSA9IChjZW50ZXJZIC0gaGFsZkhlaWdodCkgLyBjZW50ZXJaO1xuICAvLyBDb21wYXJlIHRoZSB0d28gc2V0cyBvZiB0YW4tYW5nbGVzIGFuZCB0YWtlIHRoZSB2YWx1ZSBjbG9zZXIgdG8gemVybyBvbiBlYWNoIHNpZGUuXG4gIHJlc3VsdFswXSA9IE1hdGgubWF4KGZvdkxlZnQsIHNjcmVlbkxlZnQpO1xuICByZXN1bHRbMV0gPSBNYXRoLm1pbihmb3ZUb3AsIHNjcmVlblRvcCk7XG4gIHJlc3VsdFsyXSA9IE1hdGgubWluKGZvdlJpZ2h0LCBzY3JlZW5SaWdodCk7XG4gIHJlc3VsdFszXSA9IE1hdGgubWF4KGZvdkJvdHRvbSwgc2NyZWVuQm90dG9tKTtcbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgc2NyZWVuIHJlY3RhbmdsZSB2aXNpYmxlIGZyb20gdGhlIGxlZnQgZXllIGZvciB0aGVcbiAqIGN1cnJlbnQgZGV2aWNlIGFuZCBzY3JlZW4gcGFyYW1ldGVycy5cbiAqL1xuRGV2aWNlSW5mby5wcm90b3R5cGUuZ2V0TGVmdEV5ZVZpc2libGVTY3JlZW5SZWN0ID0gZnVuY3Rpb24odW5kaXN0b3J0ZWRGcnVzdHVtKSB7XG4gIHZhciB2aWV3ZXIgPSB0aGlzLnZpZXdlcjtcbiAgdmFyIGRldmljZSA9IHRoaXMuZGV2aWNlO1xuXG4gIHZhciBkaXN0ID0gdmlld2VyLnNjcmVlbkxlbnNEaXN0YW5jZTtcbiAgdmFyIGV5ZVggPSAoZGV2aWNlLndpZHRoTWV0ZXJzIC0gdmlld2VyLmludGVyTGVuc0Rpc3RhbmNlKSAvIDI7XG4gIHZhciBleWVZID0gdmlld2VyLmJhc2VsaW5lTGVuc0Rpc3RhbmNlIC0gZGV2aWNlLmJldmVsTWV0ZXJzO1xuICB2YXIgbGVmdCA9ICh1bmRpc3RvcnRlZEZydXN0dW1bMF0gKiBkaXN0ICsgZXllWCkgLyBkZXZpY2Uud2lkdGhNZXRlcnM7XG4gIHZhciB0b3AgPSAodW5kaXN0b3J0ZWRGcnVzdHVtWzFdICogZGlzdCArIGV5ZVkpIC8gZGV2aWNlLmhlaWdodE1ldGVycztcbiAgdmFyIHJpZ2h0ID0gKHVuZGlzdG9ydGVkRnJ1c3R1bVsyXSAqIGRpc3QgKyBleWVYKSAvIGRldmljZS53aWR0aE1ldGVycztcbiAgdmFyIGJvdHRvbSA9ICh1bmRpc3RvcnRlZEZydXN0dW1bM10gKiBkaXN0ICsgZXllWSkgLyBkZXZpY2UuaGVpZ2h0TWV0ZXJzO1xuICByZXR1cm4ge1xuICAgIHg6IGxlZnQsXG4gICAgeTogYm90dG9tLFxuICAgIHdpZHRoOiByaWdodCAtIGxlZnQsXG4gICAgaGVpZ2h0OiB0b3AgLSBib3R0b21cbiAgfTtcbn07XG5cbkRldmljZUluZm8ucHJvdG90eXBlLmdldEZpZWxkT2ZWaWV3TGVmdEV5ZSA9IGZ1bmN0aW9uKG9wdF9pc1VuZGlzdG9ydGVkKSB7XG4gIHJldHVybiBvcHRfaXNVbmRpc3RvcnRlZCA/IHRoaXMuZ2V0VW5kaXN0b3J0ZWRGaWVsZE9mVmlld0xlZnRFeWUoKSA6XG4gICAgICB0aGlzLmdldERpc3RvcnRlZEZpZWxkT2ZWaWV3TGVmdEV5ZSgpO1xufTtcblxuRGV2aWNlSW5mby5wcm90b3R5cGUuZ2V0RmllbGRPZlZpZXdSaWdodEV5ZSA9IGZ1bmN0aW9uKG9wdF9pc1VuZGlzdG9ydGVkKSB7XG4gIHZhciBmb3YgPSB0aGlzLmdldEZpZWxkT2ZWaWV3TGVmdEV5ZShvcHRfaXNVbmRpc3RvcnRlZCk7XG4gIHJldHVybiB7XG4gICAgbGVmdERlZ3JlZXM6IGZvdi5yaWdodERlZ3JlZXMsXG4gICAgcmlnaHREZWdyZWVzOiBmb3YubGVmdERlZ3JlZXMsXG4gICAgdXBEZWdyZWVzOiBmb3YudXBEZWdyZWVzLFxuICAgIGRvd25EZWdyZWVzOiBmb3YuZG93bkRlZ3JlZXNcbiAgfTtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyBhIHByb2plY3Rpb24gbWF0cml4IGZvciB0aGUgbGVmdCBleWUuXG4gKi9cbkRldmljZUluZm8ucHJvdG90eXBlLmdldFByb2plY3Rpb25NYXRyaXhMZWZ0RXllID0gZnVuY3Rpb24ob3B0X2lzVW5kaXN0b3J0ZWQpIHtcbiAgdmFyIGZvdiA9IHRoaXMuZ2V0RmllbGRPZlZpZXdMZWZ0RXllKG9wdF9pc1VuZGlzdG9ydGVkKTtcblxuICB2YXIgcHJvamVjdGlvbk1hdHJpeCA9IG5ldyBUSFJFRS5NYXRyaXg0KCk7XG4gIHZhciBuZWFyID0gMC4xO1xuICB2YXIgZmFyID0gMTAwMDtcbiAgdmFyIGxlZnQgPSBNYXRoLnRhbihUSFJFRS5NYXRoLmRlZ1RvUmFkKGZvdi5sZWZ0RGVncmVlcykpICogbmVhcjtcbiAgdmFyIHJpZ2h0ID0gTWF0aC50YW4oVEhSRUUuTWF0aC5kZWdUb1JhZChmb3YucmlnaHREZWdyZWVzKSkgKiBuZWFyO1xuICB2YXIgYm90dG9tID0gTWF0aC50YW4oVEhSRUUuTWF0aC5kZWdUb1JhZChmb3YuZG93bkRlZ3JlZXMpKSAqIG5lYXI7XG4gIHZhciB0b3AgPSBNYXRoLnRhbihUSFJFRS5NYXRoLmRlZ1RvUmFkKGZvdi51cERlZ3JlZXMpKSAqIG5lYXI7XG5cbiAgLy8gbWFrZUZydXN0dW0gZXhwZWN0cyB1bml0cyBpbiB0YW4tYW5nbGUgc3BhY2UuXG4gIHByb2plY3Rpb25NYXRyaXgubWFrZUZydXN0dW0oLWxlZnQsIHJpZ2h0LCAtYm90dG9tLCB0b3AsIG5lYXIsIGZhcik7XG5cbiAgcmV0dXJuIHByb2plY3Rpb25NYXRyaXg7XG59O1xuXG5cbkRldmljZUluZm8ucHJvdG90eXBlLmdldFVuZGlzdG9ydGVkVmlld3BvcnRMZWZ0RXllID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwID0gdGhpcy5nZXRVbmRpc3RvcnRlZFBhcmFtc18oKTtcbiAgdmFyIHZpZXdlciA9IHRoaXMudmlld2VyO1xuICB2YXIgZGV2aWNlID0gdGhpcy5kZXZpY2U7XG5cbiAgdmFyIGV5ZVRvU2NyZWVuRGlzdGFuY2UgPSB2aWV3ZXIuc2NyZWVuTGVuc0Rpc3RhbmNlO1xuICB2YXIgc2NyZWVuV2lkdGggPSBkZXZpY2Uud2lkdGhNZXRlcnMgLyBleWVUb1NjcmVlbkRpc3RhbmNlO1xuICB2YXIgc2NyZWVuSGVpZ2h0ID0gZGV2aWNlLmhlaWdodE1ldGVycyAvIGV5ZVRvU2NyZWVuRGlzdGFuY2U7XG4gIHZhciB4UHhQZXJUYW5BbmdsZSA9IGRldmljZS53aWR0aCAvIHNjcmVlbldpZHRoO1xuICB2YXIgeVB4UGVyVGFuQW5nbGUgPSBkZXZpY2UuaGVpZ2h0IC8gc2NyZWVuSGVpZ2h0O1xuXG4gIHZhciB4ID0gTWF0aC5yb3VuZCgocC5leWVQb3NYIC0gcC5vdXRlckRpc3QpICogeFB4UGVyVGFuQW5nbGUpO1xuICB2YXIgeSA9IE1hdGgucm91bmQoKHAuZXllUG9zWSAtIHAuYm90dG9tRGlzdCkgKiB5UHhQZXJUYW5BbmdsZSk7XG4gIHJldHVybiB7XG4gICAgeDogeCxcbiAgICB5OiB5LFxuICAgIHdpZHRoOiBNYXRoLnJvdW5kKChwLmV5ZVBvc1ggKyBwLmlubmVyRGlzdCkgKiB4UHhQZXJUYW5BbmdsZSkgLSB4LFxuICAgIGhlaWdodDogTWF0aC5yb3VuZCgocC5leWVQb3NZICsgcC50b3BEaXN0KSAqIHlQeFBlclRhbkFuZ2xlKSAtIHlcbiAgfTtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB1bmRpc3RvcnRlZCBmaWVsZCBvZiB2aWV3IGZvciB0aGUgbGVmdCBleWUuXG4gKi9cbkRldmljZUluZm8ucHJvdG90eXBlLmdldFVuZGlzdG9ydGVkRmllbGRPZlZpZXdMZWZ0RXllID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwID0gdGhpcy5nZXRVbmRpc3RvcnRlZFBhcmFtc18oKTtcblxuICByZXR1cm4ge1xuICAgIGxlZnREZWdyZWVzOiBUSFJFRS5NYXRoLnJhZFRvRGVnKE1hdGguYXRhbihwLm91dGVyRGlzdCkpLFxuICAgIHJpZ2h0RGVncmVlczogVEhSRUUuTWF0aC5yYWRUb0RlZyhNYXRoLmF0YW4ocC5pbm5lckRpc3QpKSxcbiAgICBkb3duRGVncmVlczogVEhSRUUuTWF0aC5yYWRUb0RlZyhNYXRoLmF0YW4ocC5ib3R0b21EaXN0KSksXG4gICAgdXBEZWdyZWVzOiBUSFJFRS5NYXRoLnJhZFRvRGVnKE1hdGguYXRhbihwLnRvcERpc3QpKVxuICB9O1xufTtcblxuRGV2aWNlSW5mby5wcm90b3R5cGUuZ2V0VW5kaXN0b3J0ZWRQYXJhbXNfID0gZnVuY3Rpb24oKSB7XG4gIHZhciB2aWV3ZXIgPSB0aGlzLnZpZXdlcjtcbiAgdmFyIGRldmljZSA9IHRoaXMuZGV2aWNlO1xuICB2YXIgZGlzdG9ydGlvbiA9IHRoaXMuZGlzdG9ydGlvbjtcblxuICAvLyBNb3N0IG9mIHRoZXNlIHZhcmlhYmxlcyBpbiB0YW4tYW5nbGUgdW5pdHMuXG4gIHZhciBleWVUb1NjcmVlbkRpc3RhbmNlID0gdmlld2VyLnNjcmVlbkxlbnNEaXN0YW5jZTtcbiAgdmFyIGhhbGZMZW5zRGlzdGFuY2UgPSB2aWV3ZXIuaW50ZXJMZW5zRGlzdGFuY2UgLyAyIC8gZXllVG9TY3JlZW5EaXN0YW5jZTtcbiAgdmFyIHNjcmVlbldpZHRoID0gZGV2aWNlLndpZHRoTWV0ZXJzIC8gZXllVG9TY3JlZW5EaXN0YW5jZTtcbiAgdmFyIHNjcmVlbkhlaWdodCA9IGRldmljZS5oZWlnaHRNZXRlcnMgLyBleWVUb1NjcmVlbkRpc3RhbmNlO1xuXG4gIHZhciBleWVQb3NYID0gc2NyZWVuV2lkdGggLyAyIC0gaGFsZkxlbnNEaXN0YW5jZTtcbiAgdmFyIGV5ZVBvc1kgPSAodmlld2VyLmJhc2VsaW5lTGVuc0Rpc3RhbmNlIC0gZGV2aWNlLmJldmVsTWV0ZXJzKSAvIGV5ZVRvU2NyZWVuRGlzdGFuY2U7XG5cbiAgdmFyIG1heEZvdiA9IHZpZXdlci5mb3Y7XG4gIHZhciB2aWV3ZXJNYXggPSBkaXN0b3J0aW9uLmRpc3RvcnRJbnZlcnNlKE1hdGgudGFuKFRIUkVFLk1hdGguZGVnVG9SYWQobWF4Rm92KSkpO1xuICB2YXIgb3V0ZXJEaXN0ID0gTWF0aC5taW4oZXllUG9zWCwgdmlld2VyTWF4KTtcbiAgdmFyIGlubmVyRGlzdCA9IE1hdGgubWluKGhhbGZMZW5zRGlzdGFuY2UsIHZpZXdlck1heCk7XG4gIHZhciBib3R0b21EaXN0ID0gTWF0aC5taW4oZXllUG9zWSwgdmlld2VyTWF4KTtcbiAgdmFyIHRvcERpc3QgPSBNYXRoLm1pbihzY3JlZW5IZWlnaHQgLSBleWVQb3NZLCB2aWV3ZXJNYXgpO1xuXG4gIHJldHVybiB7XG4gICAgb3V0ZXJEaXN0OiBvdXRlckRpc3QsXG4gICAgaW5uZXJEaXN0OiBpbm5lckRpc3QsXG4gICAgdG9wRGlzdDogdG9wRGlzdCxcbiAgICBib3R0b21EaXN0OiBib3R0b21EaXN0LFxuICAgIGV5ZVBvc1g6IGV5ZVBvc1gsXG4gICAgZXllUG9zWTogZXllUG9zWVxuICB9O1xufTtcblxuXG5mdW5jdGlvbiBDYXJkYm9hcmRWaWV3ZXIocGFyYW1zKSB7XG4gIC8vIEEgbWFjaGluZSByZWFkYWJsZSBJRC5cbiAgdGhpcy5pZCA9IHBhcmFtcy5pZDtcbiAgLy8gQSBodW1hbiByZWFkYWJsZSBsYWJlbC5cbiAgdGhpcy5sYWJlbCA9IHBhcmFtcy5sYWJlbDtcblxuICAvLyBGaWVsZCBvZiB2aWV3IGluIGRlZ3JlZXMgKHBlciBzaWRlKS5cbiAgdGhpcy5mb3YgPSBwYXJhbXMuZm92O1xuXG4gIC8vIERpc3RhbmNlIGJldHdlZW4gbGVucyBjZW50ZXJzIGluIG1ldGVycy5cbiAgdGhpcy5pbnRlckxlbnNEaXN0YW5jZSA9IHBhcmFtcy5pbnRlckxlbnNEaXN0YW5jZTtcbiAgLy8gRGlzdGFuY2UgYmV0d2VlbiB2aWV3ZXIgYmFzZWxpbmUgYW5kIGxlbnMgY2VudGVyIGluIG1ldGVycy5cbiAgdGhpcy5iYXNlbGluZUxlbnNEaXN0YW5jZSA9IHBhcmFtcy5iYXNlbGluZUxlbnNEaXN0YW5jZTtcbiAgLy8gU2NyZWVuLXRvLWxlbnMgZGlzdGFuY2UgaW4gbWV0ZXJzLlxuICB0aGlzLnNjcmVlbkxlbnNEaXN0YW5jZSA9IHBhcmFtcy5zY3JlZW5MZW5zRGlzdGFuY2U7XG5cbiAgLy8gRGlzdG9ydGlvbiBjb2VmZmljaWVudHMuXG4gIHRoaXMuZGlzdG9ydGlvbkNvZWZmaWNpZW50cyA9IHBhcmFtcy5kaXN0b3J0aW9uQ29lZmZpY2llbnRzO1xuICAvLyBJbnZlcnNlIGRpc3RvcnRpb24gY29lZmZpY2llbnRzLlxuICAvLyBUT0RPOiBDYWxjdWxhdGUgdGhlc2UgZnJvbSBkaXN0b3J0aW9uQ29lZmZpY2llbnRzIGluIHRoZSBmdXR1cmUuXG4gIHRoaXMuaW52ZXJzZUNvZWZmaWNpZW50cyA9IHBhcmFtcy5pbnZlcnNlQ29lZmZpY2llbnRzO1xufVxuXG4vLyBFeHBvcnQgdmlld2VyIGluZm9ybWF0aW9uLlxuRGV2aWNlSW5mby5WaWV3ZXJzID0gVmlld2Vycztcbm1vZHVsZS5leHBvcnRzID0gRGV2aWNlSW5mbzsiLCIvKlxuICogQ29weXJpZ2h0IDIwMTYgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xudmFyIFZSRGlzcGxheSA9IHJlcXVpcmUoJy4vYmFzZS5qcycpLlZSRGlzcGxheTtcbnZhciBITURWUkRldmljZSA9IHJlcXVpcmUoJy4vYmFzZS5qcycpLkhNRFZSRGV2aWNlO1xudmFyIFBvc2l0aW9uU2Vuc29yVlJEZXZpY2UgPSByZXF1aXJlKCcuL2Jhc2UuanMnKS5Qb3NpdGlvblNlbnNvclZSRGV2aWNlO1xuXG4vKipcbiAqIFdyYXBzIGEgVlJEaXNwbGF5IGFuZCBleHBvc2VzIGl0IGFzIGEgSE1EVlJEZXZpY2VcbiAqL1xuZnVuY3Rpb24gVlJEaXNwbGF5SE1ERGV2aWNlKGRpc3BsYXkpIHtcbiAgdGhpcy5kaXNwbGF5ID0gZGlzcGxheTtcblxuICB0aGlzLmhhcmR3YXJlVW5pdElkID0gZGlzcGxheS5kaXNwbGF5SWQ7XG4gIHRoaXMuZGV2aWNlSWQgPSAnd2VidnItcG9sbHlmaWxsOkhNRDonICsgZGlzcGxheS5kaXNwbGF5SWQ7XG4gIHRoaXMuZGV2aWNlTmFtZSA9IGRpc3BsYXkuZGlzcGxheU5hbWUgKyAnIChITUQpJztcbn1cblZSRGlzcGxheUhNRERldmljZS5wcm90b3R5cGUgPSBuZXcgSE1EVlJEZXZpY2UoKTtcblxuVlJEaXNwbGF5SE1ERGV2aWNlLnByb3RvdHlwZS5nZXRFeWVQYXJhbWV0ZXJzID0gZnVuY3Rpb24od2hpY2hFeWUpIHtcbiAgdmFyIGV5ZVBhcmFtZXRlcnMgPSB0aGlzLmRpc3BsYXkuZ2V0RXllUGFyYW1ldGVycyh3aGljaEV5ZSk7XG5cbiAgcmV0dXJuIHtcbiAgICBjdXJyZW50RmllbGRPZlZpZXc6IGV5ZVBhcmFtZXRlcnMuZmllbGRPZlZpZXcsXG4gICAgbWF4aW11bUZpZWxkT2ZWaWV3OiBleWVQYXJhbWV0ZXJzLmZpZWxkT2ZWaWV3LFxuICAgIG1pbmltdW1GaWVsZE9mVmlldzogZXllUGFyYW1ldGVycy5maWVsZE9mVmlldyxcbiAgICByZWNvbW1lbmRlZEZpZWxkT2ZWaWV3OiBleWVQYXJhbWV0ZXJzLmZpZWxkT2ZWaWV3LFxuICAgIGV5ZVRyYW5zbGF0aW9uOiB7IHg6IGV5ZVBhcmFtZXRlcnMub2Zmc2V0WzBdLCB5OiBleWVQYXJhbWV0ZXJzLm9mZnNldFsxXSwgejogZXllUGFyYW1ldGVycy5vZmZzZXRbMl0gfSxcbiAgICByZW5kZXJSZWN0OiB7XG4gICAgICB4OiAod2hpY2hFeWUgPT0gJ3JpZ2h0JykgPyBleWVQYXJhbWV0ZXJzLnJlbmRlcldpZHRoIDogMCxcbiAgICAgIHk6IDAsXG4gICAgICB3aWR0aDogZXllUGFyYW1ldGVycy5yZW5kZXJXaWR0aCxcbiAgICAgIGhlaWdodDogZXllUGFyYW1ldGVycy5yZW5kZXJIZWlnaHRcbiAgICB9XG4gIH07XG59O1xuXG5WUkRpc3BsYXlITUREZXZpY2UucHJvdG90eXBlLnNldEZpZWxkT2ZWaWV3ID1cbiAgICBmdW5jdGlvbihvcHRfZm92TGVmdCwgb3B0X2ZvdlJpZ2h0LCBvcHRfek5lYXIsIG9wdF96RmFyKSB7XG4gIC8vIE5vdCBzdXBwb3J0ZWQuIGdldEV5ZVBhcmFtZXRlcnMgcmVwb3J0cyB0aGF0IHRoZSBtaW4sIG1heCwgYW5kIHJlY29tbWVuZGVkXG4gIC8vIEZvViBpcyBhbGwgdGhlIHNhbWUsIHNvIG5vIGFkanVzdG1lbnQgY2FuIGJlIG1hZGUuXG59O1xuXG4vLyBUT0RPOiBOZWVkIHRvIGhvb2sgcmVxdWVzdEZ1bGxzY3JlZW4gdG8gc2VlIGlmIGEgd3JhcHBlZCBWUkRpc3BsYXkgd2FzIHBhc3NlZFxuLy8gaW4gYXMgYW4gb3B0aW9uLiBJZiBzbyB3ZSBzaG91bGQgcHJldmVudCB0aGUgZGVmYXVsdCBmdWxsc2NyZWVuIGJlaGF2aW9yIGFuZFxuLy8gY2FsbCBWUkRpc3BsYXkucmVxdWVzdFByZXNlbnQgaW5zdGVhZC5cblxuLyoqXG4gKiBXcmFwcyBhIFZSRGlzcGxheSBhbmQgZXhwb3NlcyBpdCBhcyBhIFBvc2l0aW9uU2Vuc29yVlJEZXZpY2VcbiAqL1xuZnVuY3Rpb24gVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2UoZGlzcGxheSkge1xuICB0aGlzLmRpc3BsYXkgPSBkaXNwbGF5O1xuXG4gIHRoaXMuaGFyZHdhcmVVbml0SWQgPSBkaXNwbGF5LmRpc3BsYXlJZDtcbiAgdGhpcy5kZXZpY2VJZCA9ICd3ZWJ2ci1wb2xseWZpbGw6UG9zaXRpb25TZW5zb3I6ICcgKyBkaXNwbGF5LmRpc3BsYXlJZDtcbiAgdGhpcy5kZXZpY2VOYW1lID0gZGlzcGxheS5kaXNwbGF5TmFtZSArICcgKFBvc2l0aW9uU2Vuc29yKSc7XG59XG5WUkRpc3BsYXlQb3NpdGlvblNlbnNvckRldmljZS5wcm90b3R5cGUgPSBuZXcgUG9zaXRpb25TZW5zb3JWUkRldmljZSgpO1xuXG5WUkRpc3BsYXlQb3NpdGlvblNlbnNvckRldmljZS5wcm90b3R5cGUuZ2V0U3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBvc2UgPSB0aGlzLmRpc3BsYXkuZ2V0UG9zZSgpO1xuICByZXR1cm4ge1xuICAgIHBvc2l0aW9uOiBwb3NlLnBvc2l0aW9uID8geyB4OiBwb3NlLnBvc2l0aW9uWzBdLCB5OiBwb3NlLnBvc2l0aW9uWzFdLCB6OiBwb3NlLnBvc2l0aW9uWzJdIH0gOiBudWxsLFxuICAgIG9yaWVudGF0aW9uOiBwb3NlLm9yaWVudGF0aW9uID8geyB4OiBwb3NlLm9yaWVudGF0aW9uWzBdLCB5OiBwb3NlLm9yaWVudGF0aW9uWzFdLCB6OiBwb3NlLm9yaWVudGF0aW9uWzJdLCB3OiBwb3NlLm9yaWVudGF0aW9uWzNdIH0gOiBudWxsLFxuICAgIGxpbmVhclZlbG9jaXR5OiBudWxsLFxuICAgIGxpbmVhckFjY2VsZXJhdGlvbjogbnVsbCxcbiAgICBhbmd1bGFyVmVsb2NpdHk6IG51bGwsXG4gICAgYW5ndWxhckFjY2VsZXJhdGlvbjogbnVsbFxuICB9O1xufTtcblxuVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2UucHJvdG90eXBlLnJlc2V0U3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMucG9zaXRpb25EZXZpY2UucmVzZXRQb3NlKCk7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzLlZSRGlzcGxheUhNRERldmljZSA9IFZSRGlzcGxheUhNRERldmljZTtcbm1vZHVsZS5leHBvcnRzLlZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlID0gVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2U7XG5cbiIsIi8qKlxuICogVE9ETyhzbXVzKTogSW1wbGVtZW50IGNvZWZmaWNpZW50IGludmVyc2lvbi5cbiAqL1xuZnVuY3Rpb24gRGlzdG9ydGlvbihjb2VmZmljaWVudHMpIHtcbiAgdGhpcy5jb2VmZmljaWVudHMgPSBjb2VmZmljaWVudHM7XG59XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgaW52ZXJzZSBkaXN0b3J0aW9uIGZvciBhIHJhZGl1cy5cbiAqIDwvcD48cD5cbiAqIEFsbG93cyB0byBjb21wdXRlIHRoZSBvcmlnaW5hbCB1bmRpc3RvcnRlZCByYWRpdXMgZnJvbSBhIGRpc3RvcnRlZCBvbmUuXG4gKiBTZWUgYWxzbyBnZXRBcHByb3hpbWF0ZUludmVyc2VEaXN0b3J0aW9uKCkgZm9yIGEgZmFzdGVyIGJ1dCBwb3RlbnRpYWxseVxuICogbGVzcyBhY2N1cmF0ZSBtZXRob2QuXG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IHJhZGl1cyBEaXN0b3J0ZWQgcmFkaXVzIGZyb20gdGhlIGxlbnMgY2VudGVyIGluIHRhbi1hbmdsZSB1bml0cy5cbiAqIEByZXR1cm4ge051bWJlcn0gVGhlIHVuZGlzdG9ydGVkIHJhZGl1cyBpbiB0YW4tYW5nbGUgdW5pdHMuXG4gKi9cbkRpc3RvcnRpb24ucHJvdG90eXBlLmRpc3RvcnRJbnZlcnNlID0gZnVuY3Rpb24ocmFkaXVzKSB7XG4gIC8vIFNlY2FudCBtZXRob2QuXG4gIHZhciByMCA9IDA7XG4gIHZhciByMSA9IDE7XG4gIHZhciBkcjAgPSByYWRpdXMgLSB0aGlzLmRpc3RvcnQocjApO1xuICB3aGlsZSAoTWF0aC5hYnMocjEgLSByMCkgPiAwLjAwMDEgLyoqIDAuMW1tICovKSB7XG4gICAgdmFyIGRyMSA9IHJhZGl1cyAtIHRoaXMuZGlzdG9ydChyMSk7XG4gICAgdmFyIHIyID0gcjEgLSBkcjEgKiAoKHIxIC0gcjApIC8gKGRyMSAtIGRyMCkpO1xuICAgIHIwID0gcjE7XG4gICAgcjEgPSByMjtcbiAgICBkcjAgPSBkcjE7XG4gIH1cbiAgcmV0dXJuIHIxO1xufVxuXG4vKipcbiAqIERpc3RvcnRzIGEgcmFkaXVzIGJ5IGl0cyBkaXN0b3J0aW9uIGZhY3RvciBmcm9tIHRoZSBjZW50ZXIgb2YgdGhlIGxlbnNlcy5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gcmFkaXVzIFJhZGl1cyBmcm9tIHRoZSBsZW5zIGNlbnRlciBpbiB0YW4tYW5nbGUgdW5pdHMuXG4gKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBkaXN0b3J0ZWQgcmFkaXVzIGluIHRhbi1hbmdsZSB1bml0cy5cbiAqL1xuRGlzdG9ydGlvbi5wcm90b3R5cGUuZGlzdG9ydCA9IGZ1bmN0aW9uKHJhZGl1cykge1xuICB2YXIgcjIgPSByYWRpdXMgKiByYWRpdXM7XG4gIHZhciByZXQgPSAwO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY29lZmZpY2llbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgcmV0ID0gcjIgKiAocmV0ICsgdGhpcy5jb2VmZmljaWVudHNbaV0pO1xuICB9XG4gIHJldHVybiAocmV0ICsgMSkgKiByYWRpdXM7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gRGlzdG9ydGlvbjsiLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vKipcbiAqIERQREIgY2FjaGUuXG4gKi9cbnZhciBEUERCX0NBQ0hFID0ge1xuICBcImZvcm1hdFwiOiAxLFxuICBcImxhc3RfdXBkYXRlZFwiOiBcIjIwMTYtMDEtMjBUMDA6MTg6MzVaXCIsXG4gIFwiZGV2aWNlc1wiOiBbXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiYXN1cy8qL05leHVzIDcvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJOZXh1cyA3XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAzMjAuOCwgMzIzLjAgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJhc3VzLyovQVNVU19aMDBBRC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkFTVVNfWjAwQURcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQwMy4wLCA0MDQuNiBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJIVEMvKi9IVEM2NDM1TFZXLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiSFRDNjQzNUxWV1wiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDQ5LjcsIDQ0My4zIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkhUQy8qL0hUQyBPbmUgWEwvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJIVEMgT25lIFhMXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAzMTUuMywgMzE0LjYgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiaHRjLyovTmV4dXMgOS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIk5leHVzIDlcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiAyODkuMCxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJIVEMvKi9IVEMgT25lIE05LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiSFRDIE9uZSBNOVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDQyLjUsIDQ0My4zIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiSFRDLyovSFRDIE9uZV9NOC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkhUQyBPbmVfTThcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQ0OS43LCA0NDcuNCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkhUQy8qL0hUQyBPbmUvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJIVEMgT25lXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogNDcyLjgsXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkh1YXdlaS8qL05leHVzIDZQLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiTmV4dXMgNlBcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDUxNS4xLCA1MTguMCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJMR0UvKi9OZXh1cyA1WC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIk5leHVzIDVYXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0MjIuMCwgNDE5LjkgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiTEdFLyovTEdNUzM0NS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkxHTVMzNDVcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDIyMS43LCAyMTkuMSBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkxHRS8qL0xHLUQ4MDAvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJMRy1EODAwXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0MjIuMCwgNDI0LjEgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJMR0UvKi9MRy1EODUwLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiTEctRDg1MFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNTM3LjksIDU0MS45IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiTEdFLyovVlM5ODUgNEcvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJWUzk4NSA0R1wiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNTM3LjksIDUzNS42IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkxHRS8qL05leHVzIDUvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJOZXh1cyA1IFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDQyLjQsIDQ0NC44IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkxHRS8qL05leHVzIDQvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJOZXh1cyA0XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAzMTkuOCwgMzE4LjQgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiTEdFLyovTEctUDc2OS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkxHLVA3NjlcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDI0MC42LCAyNDcuNSBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJMR0UvKi9MR01TMzIzLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiTEdNUzMyM1wiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMjA2LjYsIDIwNC42IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIkxHRS8qL0xHTFM5OTYvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJMR0xTOTk2XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0MDMuNCwgNDAxLjUgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiTWljcm9tYXgvKi80NTYwTU1YLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiNDU2ME1NWFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMjQwLjAsIDIxOS40IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIk1pY3JvbWF4LyovQTI1MC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIk1pY3JvbWF4IEEyNTBcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQ4MC4wLCA0NDYuNCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJNaWNyb21heC8qL01pY3JvbWF4IEFRNDUwMS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIk1pY3JvbWF4IEFRNDUwMVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IDI0MC4wLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIm1vdG9yb2xhLyovRFJPSUQgUkFaUi8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkRST0lEIFJBWlJcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDM2OC4xLCAyNTYuNyBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL1hUODMwQy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlhUODMwQ1wiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMjU0LjAsIDI1NS45IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIm1vdG9yb2xhLyovWFQxMDIxLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiWFQxMDIxXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyNTQuMCwgMjU2LjcgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL1hUMTAyMy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlhUMTAyM1wiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMjU0LjAsIDI1Ni43IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDEwMjgvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJYVDEwMjhcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDMyNi42LCAzMjcuNiBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL1hUMTAzNC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlhUMTAzNFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMzI2LjYsIDMyOC40IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDEwNTMvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJYVDEwNTNcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDMxNS4zLCAzMTYuMSBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL1hUMTU2Mi8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlhUMTU2MlwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDAzLjQsIDQwMi43IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIm1vdG9yb2xhLyovTmV4dXMgNi8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIk5leHVzIDYgXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0OTQuMywgNDg5LjcgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDEwNjMvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJYVDEwNjNcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDI5NS4wLCAyOTYuNiBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJtb3Rvcm9sYS8qL1hUMTA2NC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlhUMTA2NFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMjk1LjAsIDI5NS42IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwibW90b3JvbGEvKi9YVDEwOTIvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJYVDEwOTJcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQyMi4wLCA0MjQuMSBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIm1vdG9yb2xhLyovWFQxMDk1LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiWFQxMDk1XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0MjIuMCwgNDIzLjQgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiT25lUGx1cy8qL0EwMDAxLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiQTAwMDFcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQwMy40LCA0MDEuMCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJPbmVQbHVzLyovT05FIEUxMDA1LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiT05FIEUxMDA1XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0NDIuNCwgNDQxLjQgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiT25lUGx1cy8qL09ORSBBMjAwNS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIk9ORSBBMjAwNVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMzkxLjksIDQwNS40IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIk9QUE8vKi9YOTA5LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiWDkwOVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDQyLjQsIDQ0NC4xIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9HVC1JOTA4Mi8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkdULUk5MDgyXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAxODQuNywgMTg1LjQgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUczNjBQLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU00tRzM2MFBcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDE5Ni43LCAyMDUuNCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovTmV4dXMgUy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIk5leHVzIFNcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDIzNC41LCAyMjkuOCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovR1QtSTkzMDAvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJHVC1JOTMwMFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMzA0LjgsIDMwMy45IF0sXG4gICAgXCJid1wiOiA1LFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLVQyMzBOVS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLVQyMzBOVVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IDIxNi4wLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TR0gtVDM5OS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNHSC1UMzk5XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyMTcuNywgMjMxLjQgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLU45MDA1LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU00tTjkwMDVcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDM4Ni40LCAzODcuMCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TQU1TVU5HLVNNLU45MDBBLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU0FNU1VORy1TTS1OOTAwQVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMzg2LjQsIDM4Ny43IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9HVC1JOTUwMC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkdULUk5NTAwXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0NDIuNSwgNDQzLjMgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovR1QtSTk1MDUvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJHVC1JOTUwNVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IDQzOS40LFxuICAgIFwiYndcIjogNCxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tRzkwMEYvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTTS1HOTAwRlwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDE1LjYsIDQzMS42IF0sXG4gICAgXCJid1wiOiA1LFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HOTAwTS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLUc5MDBNXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0MTUuNiwgNDMxLjYgXSxcbiAgICBcImJ3XCI6IDUsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUc4MDBGLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU00tRzgwMEZcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiAzMjYuOCxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUc5MDZTLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU00tRzkwNlNcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDU2Mi43LCA1NzIuNCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovR1QtSTkzMDAvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJHVC1JOTMwMFwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMzA2LjcsIDMwNC44IF0sXG4gICAgXCJid1wiOiA1LFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1UNTM1LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU00tVDUzNVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMTQyLjYsIDEzNi40IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLU45MjBDLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU00tTjkyMENcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDUxNS4xLCA1MTguNCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovR1QtSTkzMDBJLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiR1QtSTkzMDBJXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAzMDQuOCwgMzA1LjggXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL0dULUk5MTk1LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiR1QtSTkxOTVcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDI0OS40LCAyNTYuNyBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TUEgtTDUyMC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNQSC1MNTIwXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyNDkuNCwgMjU1LjkgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NBTVNVTkctU0dILUk3MTcvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTQU1TVU5HLVNHSC1JNzE3XCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogMjg1LjgsXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TUEgtRDcxMC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNQSC1ENzEwXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAyMTcuNywgMjA0LjIgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL0dULU43MTAwLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiR1QtTjcxMDBcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiAyNjUuMSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NDSC1JNjA1LypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU0NILUk2MDVcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiAyNjUuMSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL0dhbGF4eSBOZXh1cy8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkdhbGF4eSBOZXh1c1wiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMzE1LjMsIDMxNC4yIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1OOTEwSC8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLU45MTBIXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA1MTUuMSwgNTE4LjAgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLU45MTBDLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU00tTjkxMENcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDUxNS4yLCA1MjAuMiBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HMTMwTS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLUcxMzBNXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyAxNjUuOSwgMTY0LjggXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tRzkyOEkvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTTS1HOTI4SVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNTE1LjEsIDUxOC40IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HOTIwRi8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLUc5MjBGXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogNTgwLjYsXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogNTAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwic2Ftc3VuZy8qL1NNLUc5MjBQLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiU00tRzkyMFBcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDUyMi41LCA1NzcuMCBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJzYW1zdW5nLyovU00tRzkyNUYvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTTS1HOTI1RlwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IDU4MC42LFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcInNhbXN1bmcvKi9TTS1HOTI1Vi8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIlNNLUc5MjVWXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA1MjIuNSwgNTc2LjYgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiU29ueS8qL0M2OTAzLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiQzY5MDNcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQ0Mi41LCA0NDMuMyBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIlNvbnkvKi9ENjY1My8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkQ2NjUzXCIgfVxuICAgIF0sXG4gICAgXCJkcGlcIjogWyA0MjguNiwgNDI3LjYgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImFuZHJvaWRcIixcbiAgICBcInJ1bGVzXCI6IFtcbiAgICAgIHsgXCJtZG1oXCI6IFwiU29ueS8qL0U2NjUzLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwiRTY2NTNcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQyOC42LCA0MjUuNyBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJTb255LyovRTY4NTMvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJFNjg1M1wiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgNDAzLjQsIDQwMS45IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIlNvbnkvKi9TR1AzMjEvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJTR1AzMjFcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDIyNC43LCAyMjQuMSBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDUwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIlRDVC8qL0FMQ0FURUwgT05FIFRPVUNIIEZpZXJjZS8qXCIgfSxcbiAgICAgIHsgXCJ1YVwiOiBcIkFMQ0FURUwgT05FIFRPVUNIIEZpZXJjZVwiIH1cbiAgICBdLFxuICAgIFwiZHBpXCI6IFsgMjQwLjAsIDI0Ny41IF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJhbmRyb2lkXCIsXG4gICAgXCJydWxlc1wiOiBbXG4gICAgICB7IFwibWRtaFwiOiBcIlRITC8qL3RobCA1MDAwLypcIiB9LFxuICAgICAgeyBcInVhXCI6IFwidGhsIDUwMDBcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiBbIDQ4MC4wLCA0NDMuMyBdLFxuICAgIFwiYndcIjogMyxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiYW5kcm9pZFwiLFxuICAgIFwicnVsZXNcIjogW1xuICAgICAgeyBcIm1kbWhcIjogXCJaVEUvKi9aVEUgQmxhZGUgTDIvKlwiIH0sXG4gICAgICB7IFwidWFcIjogXCJaVEUgQmxhZGUgTDJcIiB9XG4gICAgXSxcbiAgICBcImRwaVwiOiAyNDAuMCxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiA1MDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiaW9zXCIsXG4gICAgXCJydWxlc1wiOiBbIHsgXCJyZXNcIjogWyA2NDAsIDk2MCBdIH0gXSxcbiAgICBcImRwaVwiOiBbIDMyNS4xLCAzMjguNCBdLFxuICAgIFwiYndcIjogNCxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiaW9zXCIsXG4gICAgXCJydWxlc1wiOiBbIHsgXCJyZXNcIjogWyA2NDAsIDk2MCBdIH0gXSxcbiAgICBcImRwaVwiOiBbIDMyNS4xLCAzMjguNCBdLFxuICAgIFwiYndcIjogNCxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiaW9zXCIsXG4gICAgXCJydWxlc1wiOiBbIHsgXCJyZXNcIjogWyA2NDAsIDExMzYgXSB9IF0sXG4gICAgXCJkcGlcIjogWyAzMTcuMSwgMzIwLjIgXSxcbiAgICBcImJ3XCI6IDMsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImlvc1wiLFxuICAgIFwicnVsZXNcIjogWyB7IFwicmVzXCI6IFsgNjQwLCAxMTM2IF0gfSBdLFxuICAgIFwiZHBpXCI6IFsgMzE3LjEsIDMyMC4yIF0sXG4gICAgXCJid1wiOiAzLFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJpb3NcIixcbiAgICBcInJ1bGVzXCI6IFsgeyBcInJlc1wiOiBbIDc1MCwgMTMzNCBdIH0gXSxcbiAgICBcImRwaVwiOiAzMjYuNCxcbiAgICBcImJ3XCI6IDQsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH0sXG5cbiAge1xuICAgIFwidHlwZVwiOiBcImlvc1wiLFxuICAgIFwicnVsZXNcIjogWyB7IFwicmVzXCI6IFsgNzUwLCAxMzM0IF0gfSBdLFxuICAgIFwiZHBpXCI6IDMyNi40LFxuICAgIFwiYndcIjogNCxcbiAgICBcImFjXCI6IDEwMDBcbiAgfSxcblxuICB7XG4gICAgXCJ0eXBlXCI6IFwiaW9zXCIsXG4gICAgXCJydWxlc1wiOiBbIHsgXCJyZXNcIjogWyAxMjQyLCAyMjA4IF0gfSBdLFxuICAgIFwiZHBpXCI6IFsgNDUzLjYsIDQ1OC40IF0sXG4gICAgXCJid1wiOiA0LFxuICAgIFwiYWNcIjogMTAwMFxuICB9LFxuXG4gIHtcbiAgICBcInR5cGVcIjogXCJpb3NcIixcbiAgICBcInJ1bGVzXCI6IFsgeyBcInJlc1wiOiBbIDEyNDIsIDIyMDggXSB9IF0sXG4gICAgXCJkcGlcIjogWyA0NTMuNiwgNDU4LjQgXSxcbiAgICBcImJ3XCI6IDQsXG4gICAgXCJhY1wiOiAxMDAwXG4gIH1cbl19O1xuXG5tb2R1bGUuZXhwb3J0cyA9IERQREJfQ0FDSEU7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG4vLyBPZmZsaW5lIGNhY2hlIG9mIHRoZSBEUERCLCB0byBiZSB1c2VkIHVudGlsIHdlIGxvYWQgdGhlIG9ubGluZSBvbmUgKGFuZFxuLy8gYXMgYSBmYWxsYmFjayBpbiBjYXNlIHdlIGNhbid0IGxvYWQgdGhlIG9ubGluZSBvbmUpLlxudmFyIERQREJfQ0FDSEUgPSByZXF1aXJlKCcuL2RwZGItY2FjaGUuanMnKTtcbnZhciBVdGlsID0gcmVxdWlyZSgnLi4vdXRpbC5qcycpO1xuXG4vLyBPbmxpbmUgRFBEQiBVUkwuXG52YXIgT05MSU5FX0RQREJfVVJMID0gJ2h0dHBzOi8vc3RvcmFnZS5nb29nbGVhcGlzLmNvbS9jYXJkYm9hcmQtZHBkYi9kcGRiLmpzb24nO1xuXG4vKipcbiAqIENhbGN1bGF0ZXMgZGV2aWNlIHBhcmFtZXRlcnMgYmFzZWQgb24gdGhlIERQREIgKERldmljZSBQYXJhbWV0ZXIgRGF0YWJhc2UpLlxuICogSW5pdGlhbGx5LCB1c2VzIHRoZSBjYWNoZWQgRFBEQiB2YWx1ZXMuXG4gKlxuICogSWYgZmV0Y2hPbmxpbmUgPT0gdHJ1ZSwgdGhlbiB0aGlzIG9iamVjdCB0cmllcyB0byBmZXRjaCB0aGUgb25saW5lIHZlcnNpb25cbiAqIG9mIHRoZSBEUERCIGFuZCB1cGRhdGVzIHRoZSBkZXZpY2UgaW5mbyBpZiBhIGJldHRlciBtYXRjaCBpcyBmb3VuZC5cbiAqIENhbGxzIHRoZSBvbkRldmljZVBhcmFtc1VwZGF0ZWQgY2FsbGJhY2sgd2hlbiB0aGVyZSBpcyBhbiB1cGRhdGUgdG8gdGhlXG4gKiBkZXZpY2UgaW5mb3JtYXRpb24uXG4gKi9cbmZ1bmN0aW9uIERwZGIoZmV0Y2hPbmxpbmUsIG9uRGV2aWNlUGFyYW1zVXBkYXRlZCkge1xuICAvLyBTdGFydCB3aXRoIHRoZSBvZmZsaW5lIERQREIgY2FjaGUgd2hpbGUgd2UgYXJlIGxvYWRpbmcgdGhlIHJlYWwgb25lLlxuICB0aGlzLmRwZGIgPSBEUERCX0NBQ0hFO1xuXG4gIC8vIENhbGN1bGF0ZSBkZXZpY2UgcGFyYW1zIGJhc2VkIG9uIHRoZSBvZmZsaW5lIHZlcnNpb24gb2YgdGhlIERQREIuXG4gIHRoaXMucmVjYWxjdWxhdGVEZXZpY2VQYXJhbXNfKCk7XG5cbiAgLy8gWEhSIHRvIGZldGNoIG9ubGluZSBEUERCIGZpbGUsIGlmIHJlcXVlc3RlZC5cbiAgaWYgKGZldGNoT25saW5lKSB7XG4gICAgLy8gU2V0IHRoZSBjYWxsYmFjay5cbiAgICB0aGlzLm9uRGV2aWNlUGFyYW1zVXBkYXRlZCA9IG9uRGV2aWNlUGFyYW1zVXBkYXRlZDtcblxuICAgIGNvbnNvbGUubG9nKCdGZXRjaGluZyBEUERCLi4uJyk7XG4gICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIHZhciBvYmogPSB0aGlzO1xuICAgIHhoci5vcGVuKCdHRVQnLCBPTkxJTkVfRFBEQl9VUkwsIHRydWUpO1xuICAgIHhoci5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICBvYmoubG9hZGluZyA9IGZhbHNlO1xuICAgICAgaWYgKHhoci5zdGF0dXMgPj0gMjAwICYmIHhoci5zdGF0dXMgPD0gMjk5KSB7XG4gICAgICAgIC8vIFN1Y2Nlc3MuXG4gICAgICAgIGNvbnNvbGUubG9nKCdTdWNjZXNzZnVsbHkgbG9hZGVkIG9ubGluZSBEUERCLicpO1xuICAgICAgICBvYmouZHBkYiA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlKTtcbiAgICAgICAgb2JqLnJlY2FsY3VsYXRlRGV2aWNlUGFyYW1zXygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRXJyb3IgbG9hZGluZyB0aGUgRFBEQi5cbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgbG9hZGluZyBvbmxpbmUgRFBEQiEnKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICB4aHIuc2VuZCgpO1xuICB9XG59XG5cbi8vIFJldHVybnMgdGhlIGN1cnJlbnQgZGV2aWNlIHBhcmFtZXRlcnMuXG5EcGRiLnByb3RvdHlwZS5nZXREZXZpY2VQYXJhbXMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuZGV2aWNlUGFyYW1zO1xufTtcblxuLy8gUmVjYWxjdWxhdGVzIHRoaXMgZGV2aWNlJ3MgcGFyYW1ldGVycyBiYXNlZCBvbiB0aGUgRFBEQi5cbkRwZGIucHJvdG90eXBlLnJlY2FsY3VsYXRlRGV2aWNlUGFyYW1zXyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLmxvZygnUmVjYWxjdWxhdGluZyBkZXZpY2UgcGFyYW1zLicpO1xuICB2YXIgbmV3RGV2aWNlUGFyYW1zID0gdGhpcy5jYWxjRGV2aWNlUGFyYW1zXygpO1xuICBjb25zb2xlLmxvZygnTmV3IGRldmljZSBwYXJhbWV0ZXJzOicpO1xuICBjb25zb2xlLmxvZyhuZXdEZXZpY2VQYXJhbXMpO1xuICBpZiAobmV3RGV2aWNlUGFyYW1zKSB7XG4gICAgdGhpcy5kZXZpY2VQYXJhbXMgPSBuZXdEZXZpY2VQYXJhbXM7XG4gICAgLy8gSW52b2tlIGNhbGxiYWNrLCBpZiBpdCBpcyBzZXQuXG4gICAgaWYgKHRoaXMub25EZXZpY2VQYXJhbXNVcGRhdGVkKSB7XG4gICAgICB0aGlzLm9uRGV2aWNlUGFyYW1zVXBkYXRlZCh0aGlzLmRldmljZVBhcmFtcyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byByZWNhbGN1bGF0ZSBkZXZpY2UgcGFyYW1ldGVycy4nKTtcbiAgfVxufTtcblxuLy8gUmV0dXJucyBhIERldmljZVBhcmFtcyBvYmplY3QgdGhhdCByZXByZXNlbnRzIHRoZSBiZXN0IGd1ZXNzIGFzIHRvIHRoaXNcbi8vIGRldmljZSdzIHBhcmFtZXRlcnMuIENhbiByZXR1cm4gbnVsbCBpZiB0aGUgZGV2aWNlIGRvZXMgbm90IG1hdGNoIGFueVxuLy8ga25vd24gZGV2aWNlcy5cbkRwZGIucHJvdG90eXBlLmNhbGNEZXZpY2VQYXJhbXNfID0gZnVuY3Rpb24oKSB7XG4gIHZhciBkYiA9IHRoaXMuZHBkYjsgLy8gc2hvcnRoYW5kXG4gIGlmICghZGIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdEUERCIG5vdCBhdmFpbGFibGUuJyk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgaWYgKGRiLmZvcm1hdCAhPSAxKSB7XG4gICAgY29uc29sZS5lcnJvcignRFBEQiBoYXMgdW5leHBlY3RlZCBmb3JtYXQgdmVyc2lvbi4nKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBpZiAoIWRiLmRldmljZXMgfHwgIWRiLmRldmljZXMubGVuZ3RoKSB7XG4gICAgY29uc29sZS5lcnJvcignRFBEQiBkb2VzIG5vdCBoYXZlIGEgZGV2aWNlcyBzZWN0aW9uLicpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLy8gR2V0IHRoZSBhY3R1YWwgdXNlciBhZ2VudCBhbmQgc2NyZWVuIGRpbWVuc2lvbnMgaW4gcGl4ZWxzLlxuICB2YXIgdXNlckFnZW50ID0gbmF2aWdhdG9yLnVzZXJBZ2VudCB8fCBuYXZpZ2F0b3IudmVuZG9yIHx8IHdpbmRvdy5vcGVyYTtcbiAgdmFyIHdpZHRoID0gVXRpbC5nZXRTY3JlZW5XaWR0aCgpO1xuICB2YXIgaGVpZ2h0ID0gVXRpbC5nZXRTY3JlZW5IZWlnaHQoKTtcbiAgY29uc29sZS5sb2coJ1VzZXIgYWdlbnQ6ICcgKyB1c2VyQWdlbnQpO1xuICBjb25zb2xlLmxvZygnUGl4ZWwgd2lkdGg6ICcgKyB3aWR0aCk7XG4gIGNvbnNvbGUubG9nKCdQaXhlbCBoZWlnaHQ6ICcgKyBoZWlnaHQpO1xuXG4gIGlmICghZGIuZGV2aWNlcykge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0RQREIgaGFzIG5vIGRldmljZXMgc2VjdGlvbi4nKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZGIuZGV2aWNlcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBkZXZpY2UgPSBkYi5kZXZpY2VzW2ldO1xuICAgIGlmICghZGV2aWNlLnJ1bGVzKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ0RldmljZVsnICsgaSArICddIGhhcyBubyBydWxlcyBzZWN0aW9uLicpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgaWYgKGRldmljZS50eXBlICE9ICdpb3MnICYmIGRldmljZS50eXBlICE9ICdhbmRyb2lkJykge1xuICAgICAgY29uc29sZS53YXJuKCdEZXZpY2VbJyArIGkgKyAnXSBoYXMgaW52YWxpZCB0eXBlLicpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gU2VlIGlmIHRoaXMgZGV2aWNlIGlzIG9mIHRoZSBhcHByb3ByaWF0ZSB0eXBlLlxuICAgIGlmIChVdGlsLmlzSU9TKCkgIT0gKGRldmljZS50eXBlID09ICdpb3MnKSkgY29udGludWU7XG5cbiAgICAvLyBTZWUgaWYgdGhpcyBkZXZpY2UgbWF0Y2hlcyBhbnkgb2YgdGhlIHJ1bGVzOlxuICAgIHZhciBtYXRjaGVkID0gZmFsc2U7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBkZXZpY2UucnVsZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgIHZhciBydWxlID0gZGV2aWNlLnJ1bGVzW2pdO1xuICAgICAgaWYgKHRoaXMubWF0Y2hSdWxlXyhydWxlLCB1c2VyQWdlbnQsIHdpZHRoLCBoZWlnaHQpKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdSdWxlIG1hdGNoZWQ6Jyk7XG4gICAgICAgIGNvbnNvbGUubG9nKHJ1bGUpO1xuICAgICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghbWF0Y2hlZCkgY29udGludWU7XG5cbiAgICAvLyBkZXZpY2UuZHBpIG1pZ2h0IGJlIGFuIGFycmF5IG9mIFsgeGRwaSwgeWRwaV0gb3IganVzdCBhIHNjYWxhci5cbiAgICB2YXIgeGRwaSA9IGRldmljZS5kcGlbMF0gfHwgZGV2aWNlLmRwaTtcbiAgICB2YXIgeWRwaSA9IGRldmljZS5kcGlbMV0gfHwgZGV2aWNlLmRwaTtcblxuICAgIHJldHVybiBuZXcgRGV2aWNlUGFyYW1zKHsgeGRwaTogeGRwaSwgeWRwaTogeWRwaSwgYmV2ZWxNbTogZGV2aWNlLmJ3IH0pO1xuICB9XG5cbiAgY29uc29sZS53YXJuKCdObyBEUERCIGRldmljZSBtYXRjaC4nKTtcbiAgcmV0dXJuIG51bGw7XG59O1xuXG5EcGRiLnByb3RvdHlwZS5tYXRjaFJ1bGVfID0gZnVuY3Rpb24ocnVsZSwgdWEsIHNjcmVlbldpZHRoLCBzY3JlZW5IZWlnaHQpIHtcbiAgLy8gV2UgY2FuIG9ubHkgbWF0Y2ggJ3VhJyBhbmQgJ3JlcycgcnVsZXMsIG5vdCBvdGhlciB0eXBlcyBsaWtlICdtZG1oJ1xuICAvLyAod2hpY2ggYXJlIG1lYW50IGZvciBuYXRpdmUgcGxhdGZvcm1zKS5cbiAgaWYgKCFydWxlLnVhICYmICFydWxlLnJlcykgcmV0dXJuIGZhbHNlO1xuXG4gIC8vIElmIG91ciB1c2VyIGFnZW50IHN0cmluZyBkb2Vzbid0IGNvbnRhaW4gdGhlIGluZGljYXRlZCB1c2VyIGFnZW50IHN0cmluZyxcbiAgLy8gdGhlIG1hdGNoIGZhaWxzLlxuICBpZiAocnVsZS51YSAmJiB1YS5pbmRleE9mKHJ1bGUudWEpIDwgMCkgcmV0dXJuIGZhbHNlO1xuXG4gIC8vIElmIHRoZSBydWxlIHNwZWNpZmllcyBzY3JlZW4gZGltZW5zaW9ucyB0aGF0IGRvbid0IGNvcnJlc3BvbmQgdG8gb3VycyxcbiAgLy8gdGhlIG1hdGNoIGZhaWxzLlxuICBpZiAocnVsZS5yZXMpIHtcbiAgICBpZiAoIXJ1bGUucmVzWzBdIHx8ICFydWxlLnJlc1sxXSkgcmV0dXJuIGZhbHNlO1xuICAgIHZhciByZXNYID0gcnVsZS5yZXNbMF07XG4gICAgdmFyIHJlc1kgPSBydWxlLnJlc1sxXTtcbiAgICAvLyBDb21wYXJlIG1pbiBhbmQgbWF4IHNvIGFzIHRvIG1ha2UgdGhlIG9yZGVyIG5vdCBtYXR0ZXIsIGkuZS4sIGl0IHNob3VsZFxuICAgIC8vIGJlIHRydWUgdGhhdCA2NDB4NDgwID09IDQ4MHg2NDAuXG4gICAgaWYgKE1hdGgubWluKHNjcmVlbldpZHRoLCBzY3JlZW5IZWlnaHQpICE9IE1hdGgubWluKHJlc1gsIHJlc1kpIHx8XG4gICAgICAgIChNYXRoLm1heChzY3JlZW5XaWR0aCwgc2NyZWVuSGVpZ2h0KSAhPSBNYXRoLm1heChyZXNYLCByZXNZKSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gRGV2aWNlUGFyYW1zKHBhcmFtcykge1xuICB0aGlzLnhkcGkgPSBwYXJhbXMueGRwaTtcbiAgdGhpcy55ZHBpID0gcGFyYW1zLnlkcGk7XG4gIHRoaXMuYmV2ZWxNbSA9IHBhcmFtcy5iZXZlbE1tO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IERwZGI7IiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuZnVuY3Rpb24gRW1pdHRlcigpIHtcbiAgdGhpcy5jYWxsYmFja3MgPSB7fTtcbn1cblxuRW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKGV2ZW50TmFtZSkge1xuICB2YXIgY2FsbGJhY2tzID0gdGhpcy5jYWxsYmFja3NbZXZlbnROYW1lXTtcbiAgaWYgKCFjYWxsYmFja3MpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdObyB2YWxpZCBjYWxsYmFjayBzcGVjaWZpZWQuJyk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAvLyBFbGltaW5hdGUgdGhlIGZpcnN0IHBhcmFtICh0aGUgY2FsbGJhY2spLlxuICBhcmdzLnNoaWZ0KCk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgY2FsbGJhY2tzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG59O1xuXG5FbWl0dGVyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKGV2ZW50TmFtZSwgY2FsbGJhY2spIHtcbiAgaWYgKGV2ZW50TmFtZSBpbiB0aGlzLmNhbGxiYWNrcykge1xuICAgIHRoaXMuY2FsbGJhY2tzW2V2ZW50TmFtZV0ucHVzaChjYWxsYmFjayk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5jYWxsYmFja3NbZXZlbnROYW1lXSA9IFtjYWxsYmFja107XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRW1pdHRlcjtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG52YXIgV2ViVlJQb2x5ZmlsbCA9IHJlcXVpcmUoJy4vd2VidnItcG9seWZpbGwuanMnKTtcblxuLy8gSW5pdGlhbGl6ZSBhIFdlYlZSQ29uZmlnIGp1c3QgaW4gY2FzZS5cbndpbmRvdy5XZWJWUkNvbmZpZyA9IHdpbmRvdy5XZWJWUkNvbmZpZyB8fCB7fTtcblxuaWYgKCF3aW5kb3cuV2ViVlJDb25maWcuREVGRVJfSU5JVElBTElaQVRJT04pIHtcbiAgbmV3IFdlYlZSUG9seWZpbGwoKTtcbn0gZWxzZSB7XG4gIHdpbmRvdy5Jbml0aWFsaXplV2ViVlJQb2x5ZmlsbCA9IGZ1bmN0aW9uKCkge1xuICAgbmV3IFdlYlZSUG9seWZpbGwoKTtcbiAgfVxufVxuIiwiLypcbiAqIENvcHlyaWdodCAyMDE2IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxudmFyIE1hdGhVdGlsID0gd2luZG93Lk1hdGhVdGlsIHx8IHt9O1xuXG5NYXRoVXRpbC5kZWdUb1JhZCA9IE1hdGguUEkgLyAxODA7XG5NYXRoVXRpbC5yYWRUb0RlZyA9IDE4MCAvIE1hdGguUEk7XG5cbi8vIFNvbWUgbWluaW1hbCBtYXRoIGZ1bmN0aW9uYWxpdHkgYm9ycm93ZWQgZnJvbSBUSFJFRS5NYXRoIGFuZCBzdHJpcHBlZCBkb3duXG4vLyBmb3IgdGhlIHB1cnBvc2VzIG9mIHRoaXMgbGlicmFyeS5cblxuXG5NYXRoVXRpbC5WZWN0b3IyID0gZnVuY3Rpb24gKCB4LCB5ICkge1xuICB0aGlzLnggPSB4IHx8IDA7XG4gIHRoaXMueSA9IHkgfHwgMDtcbn07XG5cbk1hdGhVdGlsLlZlY3RvcjIucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogTWF0aFV0aWwuVmVjdG9yMixcblxuICBzZXQ6IGZ1bmN0aW9uICggeCwgeSApIHtcbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBjb3B5OiBmdW5jdGlvbiAoIHYgKSB7XG4gICAgdGhpcy54ID0gdi54O1xuICAgIHRoaXMueSA9IHYueTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIHN1YlZlY3RvcnM6IGZ1bmN0aW9uICggYSwgYiApIHtcbiAgICB0aGlzLnggPSBhLnggLSBiLng7XG4gICAgdGhpcy55ID0gYS55IC0gYi55O1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG59O1xuXG5NYXRoVXRpbC5WZWN0b3IzID0gZnVuY3Rpb24gKCB4LCB5LCB6ICkge1xuICB0aGlzLnggPSB4IHx8IDA7XG4gIHRoaXMueSA9IHkgfHwgMDtcbiAgdGhpcy56ID0geiB8fCAwO1xufTtcblxuTWF0aFV0aWwuVmVjdG9yMy5wcm90b3R5cGUgPSB7XG4gIGNvbnN0cnVjdG9yOiBNYXRoVXRpbC5WZWN0b3IzLFxuXG4gIHNldDogZnVuY3Rpb24gKCB4LCB5LCB6ICkge1xuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcbiAgICB0aGlzLnogPSB6O1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgY29weTogZnVuY3Rpb24gKCB2ICkge1xuICAgIHRoaXMueCA9IHYueDtcbiAgICB0aGlzLnkgPSB2Lnk7XG4gICAgdGhpcy56ID0gdi56O1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgbGVuZ3RoOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIE1hdGguc3FydCggdGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55ICsgdGhpcy56ICogdGhpcy56ICk7XG4gIH0sXG5cbiAgbm9ybWFsaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNjYWxhciA9IHRoaXMubGVuZ3RoKCk7XG5cbiAgICBpZiAoIHNjYWxhciAhPT0gMCApIHtcbiAgICAgIHZhciBpbnZTY2FsYXIgPSAxIC8gc2NhbGFyO1xuXG4gICAgICB0aGlzLnggKj0gaW52U2NhbGFyO1xuICAgICAgdGhpcy55ICo9IGludlNjYWxhcjtcbiAgICAgIHRoaXMueiAqPSBpbnZTY2FsYXI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMueCA9IDA7XG4gICAgICB0aGlzLnkgPSAwO1xuICAgICAgdGhpcy56ID0gMDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBhcHBseVF1YXRlcm5pb246IGZ1bmN0aW9uICggcSApIHtcbiAgICB2YXIgeCA9IHRoaXMueDtcbiAgICB2YXIgeSA9IHRoaXMueTtcbiAgICB2YXIgeiA9IHRoaXMuejtcblxuICAgIHZhciBxeCA9IHEueDtcbiAgICB2YXIgcXkgPSBxLnk7XG4gICAgdmFyIHF6ID0gcS56O1xuICAgIHZhciBxdyA9IHEudztcblxuICAgIC8vIGNhbGN1bGF0ZSBxdWF0ICogdmVjdG9yXG4gICAgdmFyIGl4ID0gIHF3ICogeCArIHF5ICogeiAtIHF6ICogeTtcbiAgICB2YXIgaXkgPSAgcXcgKiB5ICsgcXogKiB4IC0gcXggKiB6O1xuICAgIHZhciBpeiA9ICBxdyAqIHogKyBxeCAqIHkgLSBxeSAqIHg7XG4gICAgdmFyIGl3ID0gLSBxeCAqIHggLSBxeSAqIHkgLSBxeiAqIHo7XG5cbiAgICAvLyBjYWxjdWxhdGUgcmVzdWx0ICogaW52ZXJzZSBxdWF0XG4gICAgdGhpcy54ID0gaXggKiBxdyArIGl3ICogLSBxeCArIGl5ICogLSBxeiAtIGl6ICogLSBxeTtcbiAgICB0aGlzLnkgPSBpeSAqIHF3ICsgaXcgKiAtIHF5ICsgaXogKiAtIHF4IC0gaXggKiAtIHF6O1xuICAgIHRoaXMueiA9IGl6ICogcXcgKyBpdyAqIC0gcXogKyBpeCAqIC0gcXkgLSBpeSAqIC0gcXg7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBkb3Q6IGZ1bmN0aW9uICggdiApIHtcbiAgICByZXR1cm4gdGhpcy54ICogdi54ICsgdGhpcy55ICogdi55ICsgdGhpcy56ICogdi56O1xuICB9LFxuXG4gIGNyb3NzVmVjdG9yczogZnVuY3Rpb24gKCBhLCBiICkge1xuICAgIHZhciBheCA9IGEueCwgYXkgPSBhLnksIGF6ID0gYS56O1xuICAgIHZhciBieCA9IGIueCwgYnkgPSBiLnksIGJ6ID0gYi56O1xuXG4gICAgdGhpcy54ID0gYXkgKiBieiAtIGF6ICogYnk7XG4gICAgdGhpcy55ID0gYXogKiBieCAtIGF4ICogYno7XG4gICAgdGhpcy56ID0gYXggKiBieSAtIGF5ICogYng7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcbn07XG5cbk1hdGhVdGlsLlF1YXRlcm5pb24gPSBmdW5jdGlvbiAoIHgsIHksIHosIHcgKSB7XG4gIHRoaXMueCA9IHggfHwgMDtcbiAgdGhpcy55ID0geSB8fCAwO1xuICB0aGlzLnogPSB6IHx8IDA7XG4gIHRoaXMudyA9ICggdyAhPT0gdW5kZWZpbmVkICkgPyB3IDogMTtcbn07XG5cbk1hdGhVdGlsLlF1YXRlcm5pb24ucHJvdG90eXBlID0ge1xuICBjb25zdHJ1Y3RvcjogTWF0aFV0aWwuUXVhdGVybmlvbixcblxuICBzZXQ6IGZ1bmN0aW9uICggeCwgeSwgeiwgdyApIHtcbiAgICB0aGlzLnggPSB4O1xuICAgIHRoaXMueSA9IHk7XG4gICAgdGhpcy56ID0gejtcbiAgICB0aGlzLncgPSB3O1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgY29weTogZnVuY3Rpb24gKCBxdWF0ZXJuaW9uICkge1xuICAgIHRoaXMueCA9IHF1YXRlcm5pb24ueDtcbiAgICB0aGlzLnkgPSBxdWF0ZXJuaW9uLnk7XG4gICAgdGhpcy56ID0gcXVhdGVybmlvbi56O1xuICAgIHRoaXMudyA9IHF1YXRlcm5pb24udztcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIHNldEZyb21FdWxlclhZWjogZnVuY3Rpb24oIHgsIHksIHogKSB7XG4gICAgdmFyIGMxID0gTWF0aC5jb3MoIHggLyAyICk7XG4gICAgdmFyIGMyID0gTWF0aC5jb3MoIHkgLyAyICk7XG4gICAgdmFyIGMzID0gTWF0aC5jb3MoIHogLyAyICk7XG4gICAgdmFyIHMxID0gTWF0aC5zaW4oIHggLyAyICk7XG4gICAgdmFyIHMyID0gTWF0aC5zaW4oIHkgLyAyICk7XG4gICAgdmFyIHMzID0gTWF0aC5zaW4oIHogLyAyICk7XG5cbiAgICB0aGlzLnggPSBzMSAqIGMyICogYzMgKyBjMSAqIHMyICogczM7XG4gICAgdGhpcy55ID0gYzEgKiBzMiAqIGMzIC0gczEgKiBjMiAqIHMzO1xuICAgIHRoaXMueiA9IGMxICogYzIgKiBzMyArIHMxICogczIgKiBjMztcbiAgICB0aGlzLncgPSBjMSAqIGMyICogYzMgLSBzMSAqIHMyICogczM7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBzZXRGcm9tRXVsZXJZWFo6IGZ1bmN0aW9uKCB4LCB5LCB6ICkge1xuICAgIHZhciBjMSA9IE1hdGguY29zKCB4IC8gMiApO1xuICAgIHZhciBjMiA9IE1hdGguY29zKCB5IC8gMiApO1xuICAgIHZhciBjMyA9IE1hdGguY29zKCB6IC8gMiApO1xuICAgIHZhciBzMSA9IE1hdGguc2luKCB4IC8gMiApO1xuICAgIHZhciBzMiA9IE1hdGguc2luKCB5IC8gMiApO1xuICAgIHZhciBzMyA9IE1hdGguc2luKCB6IC8gMiApO1xuXG4gICAgdGhpcy54ID0gczEgKiBjMiAqIGMzICsgYzEgKiBzMiAqIHMzO1xuICAgIHRoaXMueSA9IGMxICogczIgKiBjMyAtIHMxICogYzIgKiBzMztcbiAgICB0aGlzLnogPSBjMSAqIGMyICogczMgLSBzMSAqIHMyICogYzM7XG4gICAgdGhpcy53ID0gYzEgKiBjMiAqIGMzICsgczEgKiBzMiAqIHMzO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgc2V0RnJvbUF4aXNBbmdsZTogZnVuY3Rpb24gKCBheGlzLCBhbmdsZSApIHtcbiAgICAvLyBodHRwOi8vd3d3LmV1Y2xpZGVhbnNwYWNlLmNvbS9tYXRocy9nZW9tZXRyeS9yb3RhdGlvbnMvY29udmVyc2lvbnMvYW5nbGVUb1F1YXRlcm5pb24vaW5kZXguaHRtXG4gICAgLy8gYXNzdW1lcyBheGlzIGlzIG5vcm1hbGl6ZWRcblxuICAgIHZhciBoYWxmQW5nbGUgPSBhbmdsZSAvIDIsIHMgPSBNYXRoLnNpbiggaGFsZkFuZ2xlICk7XG5cbiAgICB0aGlzLnggPSBheGlzLnggKiBzO1xuICAgIHRoaXMueSA9IGF4aXMueSAqIHM7XG4gICAgdGhpcy56ID0gYXhpcy56ICogcztcbiAgICB0aGlzLncgPSBNYXRoLmNvcyggaGFsZkFuZ2xlICk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBtdWx0aXBseTogZnVuY3Rpb24gKCBxICkge1xuICAgIHJldHVybiB0aGlzLm11bHRpcGx5UXVhdGVybmlvbnMoIHRoaXMsIHEgKTtcbiAgfSxcblxuICBtdWx0aXBseVF1YXRlcm5pb25zOiBmdW5jdGlvbiAoIGEsIGIgKSB7XG4gICAgLy8gZnJvbSBodHRwOi8vd3d3LmV1Y2xpZGVhbnNwYWNlLmNvbS9tYXRocy9hbGdlYnJhL3JlYWxOb3JtZWRBbGdlYnJhL3F1YXRlcm5pb25zL2NvZGUvaW5kZXguaHRtXG5cbiAgICB2YXIgcWF4ID0gYS54LCBxYXkgPSBhLnksIHFheiA9IGEueiwgcWF3ID0gYS53O1xuICAgIHZhciBxYnggPSBiLngsIHFieSA9IGIueSwgcWJ6ID0gYi56LCBxYncgPSBiLnc7XG5cbiAgICB0aGlzLnggPSBxYXggKiBxYncgKyBxYXcgKiBxYnggKyBxYXkgKiBxYnogLSBxYXogKiBxYnk7XG4gICAgdGhpcy55ID0gcWF5ICogcWJ3ICsgcWF3ICogcWJ5ICsgcWF6ICogcWJ4IC0gcWF4ICogcWJ6O1xuICAgIHRoaXMueiA9IHFheiAqIHFidyArIHFhdyAqIHFieiArIHFheCAqIHFieSAtIHFheSAqIHFieDtcbiAgICB0aGlzLncgPSBxYXcgKiBxYncgLSBxYXggKiBxYnggLSBxYXkgKiBxYnkgLSBxYXogKiBxYno7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBpbnZlcnNlOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy54ICo9IC0xO1xuICAgIHRoaXMueSAqPSAtMTtcbiAgICB0aGlzLnogKj0gLTE7XG5cbiAgICB0aGlzLm5vcm1hbGl6ZSgpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgbm9ybWFsaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGwgPSBNYXRoLnNxcnQoIHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueSArIHRoaXMueiAqIHRoaXMueiArIHRoaXMudyAqIHRoaXMudyApO1xuXG4gICAgaWYgKCBsID09PSAwICkge1xuICAgICAgdGhpcy54ID0gMDtcbiAgICAgIHRoaXMueSA9IDA7XG4gICAgICB0aGlzLnogPSAwO1xuICAgICAgdGhpcy53ID0gMTtcbiAgICB9IGVsc2Uge1xuICAgICAgbCA9IDEgLyBsO1xuXG4gICAgICB0aGlzLnggPSB0aGlzLnggKiBsO1xuICAgICAgdGhpcy55ID0gdGhpcy55ICogbDtcbiAgICAgIHRoaXMueiA9IHRoaXMueiAqIGw7XG4gICAgICB0aGlzLncgPSB0aGlzLncgKiBsO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIHNsZXJwOiBmdW5jdGlvbiAoIHFiLCB0ICkge1xuICAgIGlmICggdCA9PT0gMCApIHJldHVybiB0aGlzO1xuICAgIGlmICggdCA9PT0gMSApIHJldHVybiB0aGlzLmNvcHkoIHFiICk7XG5cbiAgICB2YXIgeCA9IHRoaXMueCwgeSA9IHRoaXMueSwgeiA9IHRoaXMueiwgdyA9IHRoaXMudztcblxuICAgIC8vIGh0dHA6Ly93d3cuZXVjbGlkZWFuc3BhY2UuY29tL21hdGhzL2FsZ2VicmEvcmVhbE5vcm1lZEFsZ2VicmEvcXVhdGVybmlvbnMvc2xlcnAvXG5cbiAgICB2YXIgY29zSGFsZlRoZXRhID0gdyAqIHFiLncgKyB4ICogcWIueCArIHkgKiBxYi55ICsgeiAqIHFiLno7XG5cbiAgICBpZiAoIGNvc0hhbGZUaGV0YSA8IDAgKSB7XG4gICAgICB0aGlzLncgPSAtIHFiLnc7XG4gICAgICB0aGlzLnggPSAtIHFiLng7XG4gICAgICB0aGlzLnkgPSAtIHFiLnk7XG4gICAgICB0aGlzLnogPSAtIHFiLno7XG5cbiAgICAgIGNvc0hhbGZUaGV0YSA9IC0gY29zSGFsZlRoZXRhO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNvcHkoIHFiICk7XG4gICAgfVxuXG4gICAgaWYgKCBjb3NIYWxmVGhldGEgPj0gMS4wICkge1xuICAgICAgdGhpcy53ID0gdztcbiAgICAgIHRoaXMueCA9IHg7XG4gICAgICB0aGlzLnkgPSB5O1xuICAgICAgdGhpcy56ID0gejtcblxuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdmFyIGhhbGZUaGV0YSA9IE1hdGguYWNvcyggY29zSGFsZlRoZXRhICk7XG4gICAgdmFyIHNpbkhhbGZUaGV0YSA9IE1hdGguc3FydCggMS4wIC0gY29zSGFsZlRoZXRhICogY29zSGFsZlRoZXRhICk7XG5cbiAgICBpZiAoIE1hdGguYWJzKCBzaW5IYWxmVGhldGEgKSA8IDAuMDAxICkge1xuICAgICAgdGhpcy53ID0gMC41ICogKCB3ICsgdGhpcy53ICk7XG4gICAgICB0aGlzLnggPSAwLjUgKiAoIHggKyB0aGlzLnggKTtcbiAgICAgIHRoaXMueSA9IDAuNSAqICggeSArIHRoaXMueSApO1xuICAgICAgdGhpcy56ID0gMC41ICogKCB6ICsgdGhpcy56ICk7XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHZhciByYXRpb0EgPSBNYXRoLnNpbiggKCAxIC0gdCApICogaGFsZlRoZXRhICkgLyBzaW5IYWxmVGhldGEsXG4gICAgcmF0aW9CID0gTWF0aC5zaW4oIHQgKiBoYWxmVGhldGEgKSAvIHNpbkhhbGZUaGV0YTtcblxuICAgIHRoaXMudyA9ICggdyAqIHJhdGlvQSArIHRoaXMudyAqIHJhdGlvQiApO1xuICAgIHRoaXMueCA9ICggeCAqIHJhdGlvQSArIHRoaXMueCAqIHJhdGlvQiApO1xuICAgIHRoaXMueSA9ICggeSAqIHJhdGlvQSArIHRoaXMueSAqIHJhdGlvQiApO1xuICAgIHRoaXMueiA9ICggeiAqIHJhdGlvQSArIHRoaXMueiAqIHJhdGlvQiApO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgc2V0RnJvbVVuaXRWZWN0b3JzOiBmdW5jdGlvbiAoKSB7XG4gICAgLy8gaHR0cDovL2xvbGVuZ2luZS5uZXQvYmxvZy8yMDE0LzAyLzI0L3F1YXRlcm5pb24tZnJvbS10d28tdmVjdG9ycy1maW5hbFxuICAgIC8vIGFzc3VtZXMgZGlyZWN0aW9uIHZlY3RvcnMgdkZyb20gYW5kIHZUbyBhcmUgbm9ybWFsaXplZFxuXG4gICAgdmFyIHYxLCByO1xuICAgIHZhciBFUFMgPSAwLjAwMDAwMTtcblxuICAgIHJldHVybiBmdW5jdGlvbiAoIHZGcm9tLCB2VG8gKSB7XG4gICAgICBpZiAoIHYxID09PSB1bmRlZmluZWQgKSB2MSA9IG5ldyBNYXRoVXRpbC5WZWN0b3IzKCk7XG5cbiAgICAgIHIgPSB2RnJvbS5kb3QoIHZUbyApICsgMTtcblxuICAgICAgaWYgKCByIDwgRVBTICkge1xuICAgICAgICByID0gMDtcblxuICAgICAgICBpZiAoIE1hdGguYWJzKCB2RnJvbS54ICkgPiBNYXRoLmFicyggdkZyb20ueiApICkge1xuICAgICAgICAgIHYxLnNldCggLSB2RnJvbS55LCB2RnJvbS54LCAwICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdjEuc2V0KCAwLCAtIHZGcm9tLnosIHZGcm9tLnkgKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdjEuY3Jvc3NWZWN0b3JzKCB2RnJvbSwgdlRvICk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMueCA9IHYxLng7XG4gICAgICB0aGlzLnkgPSB2MS55O1xuICAgICAgdGhpcy56ID0gdjEuejtcbiAgICAgIHRoaXMudyA9IHI7XG5cbiAgICAgIHRoaXMubm9ybWFsaXplKCk7XG5cbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgfSgpLFxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBNYXRoVXRpbDtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNiBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBWUkRpc3BsYXkgPSByZXF1aXJlKCcuL2Jhc2UuanMnKS5WUkRpc3BsYXk7XG52YXIgVEhSRUUgPSByZXF1aXJlKCcuL3RocmVlLW1hdGguanMnKTtcbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbi8vIEhvdyBtdWNoIHRvIHJvdGF0ZSBwZXIga2V5IHN0cm9rZS5cbnZhciBLRVlfU1BFRUQgPSAwLjE1O1xudmFyIEtFWV9BTklNQVRJT05fRFVSQVRJT04gPSA4MDtcblxuLy8gSG93IG11Y2ggdG8gcm90YXRlIGZvciBtb3VzZSBldmVudHMuXG52YXIgTU9VU0VfU1BFRURfWCA9IDAuNTtcbnZhciBNT1VTRV9TUEVFRF9ZID0gMC4zO1xuXG4vKipcbiAqIFZSRGlzcGxheSBiYXNlZCBvbiBtb3VzZSBhbmQga2V5Ym9hcmQgaW5wdXQuIERlc2lnbmVkIGZvciBkZXNrdG9wcy9sYXB0b3BzXG4gKiB3aGVyZSBvcmllbnRhdGlvbiBldmVudHMgYXJlbid0IHN1cHBvcnRlZC4gQ2Fubm90IHByZXNlbnQuXG4gKi9cbmZ1bmN0aW9uIE1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkoKSB7XG4gIHRoaXMuZGlzcGxheU5hbWUgPSAnTW91c2UgYW5kIEtleWJvYXJkIFZSRGlzcGxheSAod2VidnItcG9seWZpbGwpJztcblxuICB0aGlzLmNhcGFiaWxpdGllcy5oYXNPcmllbnRhdGlvbiA9IHRydWU7XG5cbiAgLy8gQXR0YWNoIHRvIG1vdXNlIGFuZCBrZXlib2FyZCBldmVudHMuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgdGhpcy5vbktleURvd25fLmJpbmQodGhpcykpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vtb3ZlJywgdGhpcy5vbk1vdXNlTW92ZV8uYmluZCh0aGlzKSk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLm9uTW91c2VEb3duXy5iaW5kKHRoaXMpKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLm9uTW91c2VVcF8uYmluZCh0aGlzKSk7XG5cbiAgLy8gXCJQcml2YXRlXCIgbWVtYmVycy5cbiAgdGhpcy5waGlfID0gMDtcbiAgdGhpcy50aGV0YV8gPSAwO1xuXG4gIC8vIFZhcmlhYmxlcyBmb3Iga2V5Ym9hcmQtYmFzZWQgcm90YXRpb24gYW5pbWF0aW9uLlxuICB0aGlzLnRhcmdldEFuZ2xlXyA9IG51bGw7XG4gIHRoaXMuYW5nbGVBbmltYXRpb25fID0gbnVsbDtcblxuICAvLyBTdGF0ZSB2YXJpYWJsZXMgZm9yIGNhbGN1bGF0aW9ucy5cbiAgdGhpcy5ldWxlcl8gPSBuZXcgVEhSRUUuRXVsZXIoKTtcbiAgdGhpcy5vcmllbnRhdGlvbl8gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuXG4gIC8vIFZhcmlhYmxlcyBmb3IgbW91c2UtYmFzZWQgcm90YXRpb24uXG4gIHRoaXMucm90YXRlU3RhcnRfID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcbiAgdGhpcy5yb3RhdGVFbmRfID0gbmV3IFRIUkVFLlZlY3RvcjIoKTtcbiAgdGhpcy5yb3RhdGVEZWx0YV8gPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuICB0aGlzLmlzRHJhZ2dpbmdfID0gZmFsc2U7XG5cbiAgdGhpcy5vcmllbnRhdGlvbk91dF8gPSBuZXcgRmxvYXQzMkFycmF5KDQpO1xufVxuTW91c2VLZXlib2FyZFZSRGlzcGxheS5wcm90b3R5cGUgPSBuZXcgVlJEaXNwbGF5KCk7XG5cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmdldEltbWVkaWF0ZVBvc2UgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5ldWxlcl8uc2V0KHRoaXMucGhpXywgdGhpcy50aGV0YV8sIDAsICdZWFonKTtcbiAgdGhpcy5vcmllbnRhdGlvbl8uc2V0RnJvbUV1bGVyKHRoaXMuZXVsZXJfKTtcblxuICB0aGlzLm9yaWVudGF0aW9uT3V0X1swXSA9IHRoaXMub3JpZW50YXRpb25fLng7XG4gIHRoaXMub3JpZW50YXRpb25PdXRfWzFdID0gdGhpcy5vcmllbnRhdGlvbl8ueTtcbiAgdGhpcy5vcmllbnRhdGlvbk91dF9bMl0gPSB0aGlzLm9yaWVudGF0aW9uXy56O1xuICB0aGlzLm9yaWVudGF0aW9uT3V0X1szXSA9IHRoaXMub3JpZW50YXRpb25fLnc7XG5cbiAgcmV0dXJuIHtcbiAgICBwb3NpdGlvbjogbnVsbCxcbiAgICBvcmllbnRhdGlvbjogdGhpcy5vcmllbnRhdGlvbk91dF8sXG4gICAgbGluZWFyVmVsb2NpdHk6IG51bGwsXG4gICAgbGluZWFyQWNjZWxlcmF0aW9uOiBudWxsLFxuICAgIGFuZ3VsYXJWZWxvY2l0eTogbnVsbCxcbiAgICBhbmd1bGFyQWNjZWxlcmF0aW9uOiBudWxsXG4gIH07XG59O1xuXG5Nb3VzZUtleWJvYXJkVlJEaXNwbGF5LnByb3RvdHlwZS5vbktleURvd25fID0gZnVuY3Rpb24oZSkge1xuICAvLyBUcmFjayBXQVNEIGFuZCBhcnJvdyBrZXlzLlxuICBpZiAoZS5rZXlDb2RlID09IDM4KSB7IC8vIFVwIGtleS5cbiAgICB0aGlzLmFuaW1hdGVQaGlfKHRoaXMucGhpXyArIEtFWV9TUEVFRCk7XG4gIH0gZWxzZSBpZiAoZS5rZXlDb2RlID09IDM5KSB7IC8vIFJpZ2h0IGtleS5cbiAgICB0aGlzLmFuaW1hdGVUaGV0YV8odGhpcy50aGV0YV8gLSBLRVlfU1BFRUQpO1xuICB9IGVsc2UgaWYgKGUua2V5Q29kZSA9PSA0MCkgeyAvLyBEb3duIGtleS5cbiAgICB0aGlzLmFuaW1hdGVQaGlfKHRoaXMucGhpXyAtIEtFWV9TUEVFRCk7XG4gIH0gZWxzZSBpZiAoZS5rZXlDb2RlID09IDM3KSB7IC8vIExlZnQga2V5LlxuICAgIHRoaXMuYW5pbWF0ZVRoZXRhXyh0aGlzLnRoZXRhXyArIEtFWV9TUEVFRCk7XG4gIH1cbn07XG5cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmFuaW1hdGVUaGV0YV8gPSBmdW5jdGlvbih0YXJnZXRBbmdsZSkge1xuICB0aGlzLmFuaW1hdGVLZXlUcmFuc2l0aW9uc18oJ3RoZXRhXycsIHRhcmdldEFuZ2xlKTtcbn07XG5cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmFuaW1hdGVQaGlfID0gZnVuY3Rpb24odGFyZ2V0QW5nbGUpIHtcbiAgLy8gUHJldmVudCBsb29raW5nIHRvbyBmYXIgdXAgb3IgZG93bi5cbiAgdGFyZ2V0QW5nbGUgPSBVdGlsLmNsYW1wKHRhcmdldEFuZ2xlLCAtTWF0aC5QSS8yLCBNYXRoLlBJLzIpO1xuICB0aGlzLmFuaW1hdGVLZXlUcmFuc2l0aW9uc18oJ3BoaV8nLCB0YXJnZXRBbmdsZSk7XG59O1xuXG4vKipcbiAqIFN0YXJ0IGFuIGFuaW1hdGlvbiB0byB0cmFuc2l0aW9uIGFuIGFuZ2xlIGZyb20gb25lIHZhbHVlIHRvIGFub3RoZXIuXG4gKi9cbk1vdXNlS2V5Ym9hcmRWUkRpc3BsYXkucHJvdG90eXBlLmFuaW1hdGVLZXlUcmFuc2l0aW9uc18gPSBmdW5jdGlvbihhbmdsZU5hbWUsIHRhcmdldEFuZ2xlKSB7XG4gIC8vIElmIGFuIGFuaW1hdGlvbiBpcyBjdXJyZW50bHkgcnVubmluZywgY2FuY2VsIGl0LlxuICBpZiAodGhpcy5hbmdsZUFuaW1hdGlvbl8pIHtcbiAgICBjbGVhckludGVydmFsKHRoaXMuYW5nbGVBbmltYXRpb25fKTtcbiAgfVxuICB2YXIgc3RhcnRBbmdsZSA9IHRoaXNbYW5nbGVOYW1lXTtcbiAgdmFyIHN0YXJ0VGltZSA9IG5ldyBEYXRlKCk7XG4gIC8vIFNldCB1cCBhbiBpbnRlcnZhbCB0aW1lciB0byBwZXJmb3JtIHRoZSBhbmltYXRpb24uXG4gIHRoaXMuYW5nbGVBbmltYXRpb25fID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgLy8gT25jZSB3ZSdyZSBmaW5pc2hlZCB0aGUgYW5pbWF0aW9uLCB3ZSdyZSBkb25lLlxuICAgIHZhciBlbGFwc2VkID0gbmV3IERhdGUoKSAtIHN0YXJ0VGltZTtcbiAgICBpZiAoZWxhcHNlZCA+PSBLRVlfQU5JTUFUSU9OX0RVUkFUSU9OKSB7XG4gICAgICB0aGlzW2FuZ2xlTmFtZV0gPSB0YXJnZXRBbmdsZTtcbiAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy5hbmdsZUFuaW1hdGlvbl8pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBMaW5lYXJseSBpbnRlcnBvbGF0ZSB0aGUgYW5nbGUgc29tZSBhbW91bnQuXG4gICAgdmFyIHBlcmNlbnQgPSBlbGFwc2VkIC8gS0VZX0FOSU1BVElPTl9EVVJBVElPTjtcbiAgICB0aGlzW2FuZ2xlTmFtZV0gPSBzdGFydEFuZ2xlICsgKHRhcmdldEFuZ2xlIC0gc3RhcnRBbmdsZSkgKiBwZXJjZW50O1xuICB9LmJpbmQodGhpcyksIDEwMDAvNjApO1xufTtcblxuTW91c2VLZXlib2FyZFZSRGlzcGxheS5wcm90b3R5cGUub25Nb3VzZURvd25fID0gZnVuY3Rpb24oZSkge1xuICB0aGlzLnJvdGF0ZVN0YXJ0Xy5zZXQoZS5jbGllbnRYLCBlLmNsaWVudFkpO1xuICB0aGlzLmlzRHJhZ2dpbmdfID0gdHJ1ZTtcbn07XG5cbi8vIFZlcnkgc2ltaWxhciB0byBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9tcmZsaXgvODM1MTAyMFxuTW91c2VLZXlib2FyZFZSRGlzcGxheS5wcm90b3R5cGUub25Nb3VzZU1vdmVfID0gZnVuY3Rpb24oZSkge1xuICBpZiAoIXRoaXMuaXNEcmFnZ2luZ18gJiYgIXRoaXMuaXNQb2ludGVyTG9ja2VkXygpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIC8vIFN1cHBvcnQgcG9pbnRlciBsb2NrIEFQSS5cbiAgaWYgKHRoaXMuaXNQb2ludGVyTG9ja2VkXygpKSB7XG4gICAgdmFyIG1vdmVtZW50WCA9IGUubW92ZW1lbnRYIHx8IGUubW96TW92ZW1lbnRYIHx8IDA7XG4gICAgdmFyIG1vdmVtZW50WSA9IGUubW92ZW1lbnRZIHx8IGUubW96TW92ZW1lbnRZIHx8IDA7XG4gICAgdGhpcy5yb3RhdGVFbmRfLnNldCh0aGlzLnJvdGF0ZVN0YXJ0Xy54IC0gbW92ZW1lbnRYLCB0aGlzLnJvdGF0ZVN0YXJ0Xy55IC0gbW92ZW1lbnRZKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnJvdGF0ZUVuZF8uc2V0KGUuY2xpZW50WCwgZS5jbGllbnRZKTtcbiAgfVxuICAvLyBDYWxjdWxhdGUgaG93IG11Y2ggd2UgbW92ZWQgaW4gbW91c2Ugc3BhY2UuXG4gIHRoaXMucm90YXRlRGVsdGFfLnN1YlZlY3RvcnModGhpcy5yb3RhdGVFbmRfLCB0aGlzLnJvdGF0ZVN0YXJ0Xyk7XG4gIHRoaXMucm90YXRlU3RhcnRfLmNvcHkodGhpcy5yb3RhdGVFbmRfKTtcblxuICAvLyBLZWVwIHRyYWNrIG9mIHRoZSBjdW11bGF0aXZlIGV1bGVyIGFuZ2xlcy5cbiAgdGhpcy5waGlfICs9IDIgKiBNYXRoLlBJICogdGhpcy5yb3RhdGVEZWx0YV8ueSAvIHNjcmVlbi5oZWlnaHQgKiBNT1VTRV9TUEVFRF9ZO1xuICB0aGlzLnRoZXRhXyArPSAyICogTWF0aC5QSSAqIHRoaXMucm90YXRlRGVsdGFfLnggLyBzY3JlZW4ud2lkdGggKiBNT1VTRV9TUEVFRF9YO1xuXG4gIC8vIFByZXZlbnQgbG9va2luZyB0b28gZmFyIHVwIG9yIGRvd24uXG4gIHRoaXMucGhpXyA9IFV0aWwuY2xhbXAodGhpcy5waGlfLCAtTWF0aC5QSS8yLCBNYXRoLlBJLzIpO1xufTtcblxuTW91c2VLZXlib2FyZFZSRGlzcGxheS5wcm90b3R5cGUub25Nb3VzZVVwXyA9IGZ1bmN0aW9uKGUpIHtcbiAgdGhpcy5pc0RyYWdnaW5nXyA9IGZhbHNlO1xufTtcblxuTW91c2VLZXlib2FyZFZSRGlzcGxheS5wcm90b3R5cGUuaXNQb2ludGVyTG9ja2VkXyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZWwgPSBkb2N1bWVudC5wb2ludGVyTG9ja0VsZW1lbnQgfHwgZG9jdW1lbnQubW96UG9pbnRlckxvY2tFbGVtZW50IHx8XG4gICAgICBkb2N1bWVudC53ZWJraXRQb2ludGVyTG9ja0VsZW1lbnQ7XG4gIHJldHVybiBlbCAhPT0gdW5kZWZpbmVkO1xufTtcblxuTW91c2VLZXlib2FyZFZSRGlzcGxheS5wcm90b3R5cGUucmVzZXRQb3NlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucGhpXyA9IDA7XG4gIHRoaXMudGhldGFfID0gMDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTW91c2VLZXlib2FyZFZSRGlzcGxheTtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBVdGlsID0gcmVxdWlyZSgnLi91dGlsLmpzJyk7XG5cbmZ1bmN0aW9uIFJvdGF0ZUluc3RydWN0aW9ucygpIHtcbiAgdGhpcy5sb2FkSWNvbl8oKTtcblxuICB2YXIgb3ZlcmxheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB2YXIgcyA9IG92ZXJsYXkuc3R5bGU7XG4gIHMucG9zaXRpb24gPSAnZml4ZWQnO1xuICBzLnRvcCA9IDA7XG4gIHMucmlnaHQgPSAwO1xuICBzLmJvdHRvbSA9IDA7XG4gIHMubGVmdCA9IDA7XG4gIHMuYmFja2dyb3VuZENvbG9yID0gJ2dyYXknO1xuICBzLmZvbnRGYW1pbHkgPSAnc2Fucy1zZXJpZic7XG5cbiAgdmFyIGltZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2ltZycpO1xuICBpbWcuc3JjID0gdGhpcy5pY29uO1xuICB2YXIgcyA9IGltZy5zdHlsZTtcbiAgcy5tYXJnaW5MZWZ0ID0gJzI1JSc7XG4gIHMubWFyZ2luVG9wID0gJzI1JSc7XG4gIHMud2lkdGggPSAnNTAlJztcbiAgb3ZlcmxheS5hcHBlbmRDaGlsZChpbWcpO1xuXG4gIHZhciB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gIHZhciBzID0gdGV4dC5zdHlsZTtcbiAgcy50ZXh0QWxpZ24gPSAnY2VudGVyJztcbiAgcy5mb250U2l6ZSA9ICcxNnB4JztcbiAgcy5saW5lSGVpZ2h0ID0gJzI0cHgnO1xuICBzLm1hcmdpbiA9ICcyNHB4IDI1JSc7XG4gIHMud2lkdGggPSAnNTAlJztcbiAgdGV4dC5pbm5lckhUTUwgPSAnUGxhY2UgeW91ciBwaG9uZSBpbnRvIHlvdXIgQ2FyZGJvYXJkIHZpZXdlci4nO1xuICBvdmVybGF5LmFwcGVuZENoaWxkKHRleHQpO1xuXG4gIHZhciBzbmFja2JhciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB2YXIgcyA9IHNuYWNrYmFyLnN0eWxlO1xuICBzLmJhY2tncm91bmRDb2xvciA9ICcjQ0ZEOERDJztcbiAgcy5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gIHMuYm90dG9tID0gMDtcbiAgcy53aWR0aCA9ICcxMDAlJztcbiAgcy5oZWlnaHQgPSAnNDhweCc7XG4gIHMucGFkZGluZyA9ICcxNHB4IDI0cHgnO1xuICBzLmJveFNpemluZyA9ICdib3JkZXItYm94JztcbiAgcy5jb2xvciA9ICcjNjU2QTZCJztcbiAgb3ZlcmxheS5hcHBlbmRDaGlsZChzbmFja2Jhcik7XG5cbiAgdmFyIHNuYWNrYmFyVGV4dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICBzbmFja2JhclRleHQuc3R5bGUuZmxvYXQgPSAnbGVmdCc7XG4gIHNuYWNrYmFyVGV4dC5pbm5lckhUTUwgPSAnTm8gQ2FyZGJvYXJkIHZpZXdlcj8nO1xuXG4gIHZhciBzbmFja2JhckJ1dHRvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgc25hY2tiYXJCdXR0b24uaHJlZiA9ICdodHRwczovL3d3dy5nb29nbGUuY29tL2dldC9jYXJkYm9hcmQvZ2V0LWNhcmRib2FyZC8nO1xuICBzbmFja2JhckJ1dHRvbi5pbm5lckhUTUwgPSAnZ2V0IG9uZSc7XG4gIHZhciBzID0gc25hY2tiYXJCdXR0b24uc3R5bGU7XG4gIHMuZmxvYXQgPSAncmlnaHQnO1xuICBzLmZvbnRXZWlnaHQgPSA2MDA7XG4gIHMudGV4dFRyYW5zZm9ybSA9ICd1cHBlcmNhc2UnO1xuICBzLmJvcmRlckxlZnQgPSAnMXB4IHNvbGlkIGdyYXknO1xuICBzLnBhZGRpbmdMZWZ0ID0gJzI0cHgnO1xuICBzLnRleHREZWNvcmF0aW9uID0gJ25vbmUnO1xuICBzLmNvbG9yID0gJyM2NTZBNkInO1xuXG4gIHNuYWNrYmFyLmFwcGVuZENoaWxkKHNuYWNrYmFyVGV4dCk7XG4gIHNuYWNrYmFyLmFwcGVuZENoaWxkKHNuYWNrYmFyQnV0dG9uKTtcblxuICB0aGlzLm92ZXJsYXkgPSBvdmVybGF5O1xuICB0aGlzLnRleHQgPSB0ZXh0O1xuXG4gIHRoaXMuaGlkZSgpO1xufVxuXG5Sb3RhdGVJbnN0cnVjdGlvbnMucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbihwYXJlbnQpIHtcbiAgaWYgKCFwYXJlbnQgJiYgIXRoaXMub3ZlcmxheS5wYXJlbnRFbGVtZW50KSB7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0aGlzLm92ZXJsYXkpO1xuICB9IGVsc2UgaWYgKHBhcmVudCkge1xuICAgIGlmICh0aGlzLm92ZXJsYXkucGFyZW50RWxlbWVudCAmJiB0aGlzLm92ZXJsYXkucGFyZW50RWxlbWVudCAhPSBwYXJlbnQpXG4gICAgICB0aGlzLm92ZXJsYXkucGFyZW50RWxlbWVudC5yZW1vdmVDaGlsZCh0aGlzLm92ZXJsYXkpO1xuXG4gICAgcGFyZW50LmFwcGVuZENoaWxkKHRoaXMub3ZlcmxheSk7XG4gIH1cblxuICB0aGlzLm92ZXJsYXkuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG5cbiAgdmFyIGltZyA9IHRoaXMub3ZlcmxheS5xdWVyeVNlbGVjdG9yKCdpbWcnKTtcbiAgdmFyIHMgPSBpbWcuc3R5bGU7XG5cbiAgaWYgKFV0aWwuaXNMYW5kc2NhcGVNb2RlKCkpIHtcbiAgICBzLndpZHRoID0gJzIwJSc7XG4gICAgcy5tYXJnaW5MZWZ0ID0gJzQwJSc7XG4gICAgcy5tYXJnaW5Ub3AgPSAnMyUnO1xuICB9IGVsc2Uge1xuICAgIHMud2lkdGggPSAnNTAlJztcbiAgICBzLm1hcmdpbkxlZnQgPSAnMjUlJztcbiAgICBzLm1hcmdpblRvcCA9ICcyNSUnO1xuICB9XG59O1xuXG5Sb3RhdGVJbnN0cnVjdGlvbnMucHJvdG90eXBlLmhpZGUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5vdmVybGF5LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG59O1xuXG5Sb3RhdGVJbnN0cnVjdGlvbnMucHJvdG90eXBlLnNob3dUZW1wb3JhcmlseSA9IGZ1bmN0aW9uKG1zLCBwYXJlbnQpIHtcbiAgdGhpcy5zaG93KHBhcmVudCk7XG4gIHRoaXMudGltZXIgPSBzZXRUaW1lb3V0KHRoaXMuaGlkZS5iaW5kKHRoaXMpLCBtcyk7XG59O1xuXG5Sb3RhdGVJbnN0cnVjdGlvbnMucHJvdG90eXBlLmRpc2FibGVTaG93VGVtcG9yYXJpbHkgPSBmdW5jdGlvbigpIHtcbiAgY2xlYXJUaW1lb3V0KHRoaXMudGltZXIpO1xufTtcblxuUm90YXRlSW5zdHJ1Y3Rpb25zLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5kaXNhYmxlU2hvd1RlbXBvcmFyaWx5KCk7XG4gIC8vIEluIHBvcnRyYWl0IFZSIG1vZGUsIHRlbGwgdGhlIHVzZXIgdG8gcm90YXRlIHRvIGxhbmRzY2FwZS4gT3RoZXJ3aXNlLCBoaWRlXG4gIC8vIHRoZSBpbnN0cnVjdGlvbnMuXG4gIGlmICghVXRpbC5pc0xhbmRzY2FwZU1vZGUoKSAmJiBVdGlsLmlzTW9iaWxlKCkpIHtcbiAgICB0aGlzLnNob3coKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmhpZGUoKTtcbiAgfVxufTtcblxuUm90YXRlSW5zdHJ1Y3Rpb25zLnByb3RvdHlwZS5sb2FkSWNvbl8gPSBmdW5jdGlvbigpIHtcbiAgLy8gRW5jb2RlZCBhc3NldF9zcmMvcm90YXRlLWluc3RydWN0aW9ucy5zdmdcbiAgdGhpcy5pY29uID0gVXRpbC5iYXNlNjQoJ2ltYWdlL3N2Zyt4bWwnLCAnUEQ5NGJXd2dkbVZ5YzJsdmJqMGlNUzR3SWlCbGJtTnZaR2x1WnowaVZWUkdMVGdpSUhOMFlXNWtZV3h2Ym1VOUltNXZJajgrQ2p4emRtY2dkMmxrZEdnOUlqRTVPSEI0SWlCb1pXbG5hSFE5SWpJME1IQjRJaUIyYVdWM1FtOTRQU0l3SURBZ01UazRJREkwTUNJZ2RtVnljMmx2YmowaU1TNHhJaUI0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lJSGh0Ykc1ek9uaHNhVzVyUFNKb2RIUndPaTh2ZDNkM0xuY3pMbTl5Wnk4eE9UazVMM2hzYVc1cklpQjRiV3h1Y3pwemEyVjBZMmc5SW1oMGRIQTZMeTkzZDNjdVltOW9aVzFwWVc1amIyUnBibWN1WTI5dEwzTnJaWFJqYUM5dWN5SStDaUFnSUNBOElTMHRJRWRsYm1WeVlYUnZjam9nVTJ0bGRHTm9JRE11TXk0eklDZ3hNakE0TVNrZ0xTQm9kSFJ3T2k4dmQzZDNMbUp2YUdWdGFXRnVZMjlrYVc1bkxtTnZiUzl6YTJWMFkyZ2dMUzArQ2lBZ0lDQThkR2wwYkdVK2RISmhibk5wZEdsdmJqd3ZkR2wwYkdVK0NpQWdJQ0E4WkdWell6NURjbVZoZEdWa0lIZHBkR2dnVTJ0bGRHTm9Mand2WkdWell6NEtJQ0FnSUR4a1pXWnpQand2WkdWbWN6NEtJQ0FnSUR4bklHbGtQU0pRWVdkbExURWlJSE4wY205clpUMGlibTl1WlNJZ2MzUnliMnRsTFhkcFpIUm9QU0l4SWlCbWFXeHNQU0p1YjI1bElpQm1hV3hzTFhKMWJHVTlJbVYyWlc1dlpHUWlJSE5yWlhSamFEcDBlWEJsUFNKTlUxQmhaMlVpUGdvZ0lDQWdJQ0FnSUR4bklHbGtQU0owY21GdWMybDBhVzl1SWlCemEyVjBZMmc2ZEhsd1pUMGlUVk5CY25SaWIyRnlaRWR5YjNWd0lqNEtJQ0FnSUNBZ0lDQWdJQ0FnUEdjZ2FXUTlJa2x0Y0c5eWRHVmtMVXhoZVdWeWN5MURiM0I1TFRRdEt5MUpiWEJ2Y25SbFpDMU1ZWGxsY25NdFEyOXdlUzByTFVsdGNHOXlkR1ZrTFV4aGVXVnljeTFEYjNCNUxUSXRRMjl3ZVNJZ2MydGxkR05vT25SNWNHVTlJazFUVEdGNVpYSkhjbTkxY0NJK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOFp5QnBaRDBpU1cxd2IzSjBaV1F0VEdGNVpYSnpMVU52Y0hrdE5DSWdkSEpoYm5ObWIzSnRQU0owY21GdWMyeGhkR1VvTUM0d01EQXdNREFzSURFd055NHdNREF3TURBcElpQnphMlYwWTJnNmRIbHdaVDBpVFZOVGFHRndaVWR5YjNWd0lqNEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRRNUxqWXlOU3d5TGpVeU55QkRNVFE1TGpZeU5Td3lMalV5TnlBeE5UVXVPREExTERZdU1EazJJREUxTmk0ek5qSXNOaTQwTVRnZ1RERTFOaTR6TmpJc055NHpNRFFnUXpFMU5pNHpOaklzTnk0ME9ERWdNVFUyTGpNM05TdzNMalkyTkNBeE5UWXVOQ3czTGpnMU15QkRNVFUyTGpReExEY3VPVE0wSURFMU5pNDBNaXc0TGpBeE5TQXhOVFl1TkRJM0xEZ3VNRGsxSUVNeE5UWXVOVFkzTERrdU5URWdNVFUzTGpRd01Td3hNUzR3T1RNZ01UVTRMalV6TWl3eE1pNHdPVFFnVERFMk5DNHlOVElzTVRjdU1UVTJJRXd4TmpRdU16TXpMREUzTGpBMk5pQkRNVFkwTGpNek15d3hOeTR3TmpZZ01UWTRMamN4TlN3eE5DNDFNellnTVRZNUxqVTJPQ3d4TkM0d05ESWdRekUzTVM0d01qVXNNVFF1T0RneklERTVOUzQxTXpnc01qa3VNRE0xSURFNU5TNDFNemdzTWprdU1ETTFJRXd4T1RVdU5UTTRMRGd6TGpBek5pQkRNVGsxTGpVek9DdzRNeTQ0TURjZ01UazFMakUxTWl3NE5DNHlOVE1nTVRrMExqVTVMRGcwTGpJMU15QkRNVGswTGpNMU55dzROQzR5TlRNZ01UazBMakE1TlN3NE5DNHhOemNnTVRrekxqZ3hPQ3c0TkM0d01UY2dUREUyT1M0NE5URXNOekF1TVRjNUlFd3hOamt1T0RNM0xEY3dMakl3TXlCTU1UUXlMalV4TlN3NE5TNDVOemdnVERFME1TNDJOalVzT0RRdU5qVTFJRU14TXpZdU9UTTBMRGd6TGpFeU5pQXhNekV1T1RFM0xEZ3hMamt4TlNBeE1qWXVOekUwTERneExqQTBOU0JETVRJMkxqY3dPU3c0TVM0d05pQXhNall1TnpBM0xEZ3hMakEyT1NBeE1qWXVOekEzTERneExqQTJPU0JNTVRJeExqWTBMRGs0TGpBeklFd3hNVE11TnpRNUxERXdNaTQxT0RZZ1RERXhNeTQzTVRJc01UQXlMalV5TXlCTU1URXpMamN4TWl3eE16QXVNVEV6SUVNeE1UTXVOekV5TERFek1DNDRPRFVnTVRFekxqTXlOaXd4TXpFdU16TWdNVEV5TGpjMk5Dd3hNekV1TXpNZ1F6RXhNaTQxTXpJc01UTXhMak16SURFeE1pNHlOamtzTVRNeExqSTFOQ0F4TVRFdU9Ua3lMREV6TVM0d09UUWdURFk1TGpVeE9Td3hNRFl1TlRjeUlFTTJPQzQxTmprc01UQTJMakF5TXlBMk55NDNPVGtzTVRBMExqWTVOU0EyTnk0M09Ua3NNVEF6TGpZd05TQk1OamN1TnprNUxERXdNaTQxTnlCTU5qY3VOemM0TERFd01pNDJNVGNnUXpZM0xqSTNMREV3TWk0ek9UTWdOall1TmpRNExERXdNaTR5TkRrZ05qVXVPVFl5TERFd01pNHlNVGdnUXpZMUxqZzNOU3d4TURJdU1qRTBJRFkxTGpjNE9Dd3hNREl1TWpFeUlEWTFMamN3TVN3eE1ESXVNakV5SUVNMk5TNDJNRFlzTVRBeUxqSXhNaUEyTlM0MU1URXNNVEF5TGpJeE5TQTJOUzQwTVRZc01UQXlMakl4T1NCRE5qVXVNVGsxTERFd01pNHlNamtnTmpRdU9UYzBMREV3TWk0eU16VWdOalF1TnpVMExERXdNaTR5TXpVZ1F6WTBMak16TVN3eE1ESXVNak0xSURZekxqa3hNU3d4TURJdU1qRTJJRFl6TGpRNU9Dd3hNREl1TVRjNElFTTJNUzQ0TkRNc01UQXlMakF5TlNBMk1DNHlPVGdzTVRBeExqVTNPQ0ExT1M0d09UUXNNVEF3TGpnNE1pQk1NVEl1TlRFNExEY3pMams1TWlCTU1USXVOVEl6TERjMExqQXdOQ0JNTWk0eU5EVXNOVFV1TWpVMElFTXhMakkwTkN3MU15NDBNamNnTWk0d01EUXNOVEV1TURNNElETXVPVFF6TERRNUxqa3hPQ0JNTlRrdU9UVTBMREUzTGpVM015QkROakF1TmpJMkxERTNMakU0TlNBMk1TNHpOU3d4Tnk0d01ERWdOakl1TURVekxERTNMakF3TVNCRE5qTXVNemM1TERFM0xqQXdNU0EyTkM0Mk1qVXNNVGN1TmpZZ05qVXVNamdzTVRndU9EVTBJRXcyTlM0eU9EVXNNVGd1T0RVeElFdzJOUzQxTVRJc01Ua3VNalkwSUV3Mk5TNDFNRFlzTVRrdU1qWTRJRU0yTlM0NU1Ea3NNakF1TURBeklEWTJMalF3TlN3eU1DNDJPQ0EyTmk0NU9ETXNNakV1TWpnMklFdzJOeTR5Tml3eU1TNDFOVFlnUXpZNUxqRTNOQ3d5TXk0ME1EWWdOekV1TnpJNExESTBMak0xTnlBM05DNHpOek1zTWpRdU16VTNJRU0zTmk0ek1qSXNNalF1TXpVM0lEYzRMak15TVN3eU15NDROQ0E0TUM0eE5EZ3NNakl1TnpnMUlFTTRNQzR4TmpFc01qSXVOemcxSURnM0xqUTJOeXd4T0M0MU5qWWdPRGN1TkRZM0xERTRMalUyTmlCRE9EZ3VNVE01TERFNExqRTNPQ0E0T0M0NE5qTXNNVGN1T1RrMElEZzVMalUyTml3eE55NDVPVFFnUXprd0xqZzVNaXd4Tnk0NU9UUWdPVEl1TVRNNExERTRMalkxTWlBNU1pNDNPVElzTVRrdU9EUTNJRXc1Tmk0d05ESXNNalV1TnpjMUlFdzVOaTR3TmpRc01qVXVOelUzSUV3eE1ESXVPRFE1TERJNUxqWTNOQ0JNTVRBeUxqYzBOQ3d5T1M0ME9USWdUREUwT1M0Mk1qVXNNaTQxTWpjZ1RURTBPUzQyTWpVc01DNDRPVElnUXpFME9TNHpORE1zTUM0NE9USWdNVFE1TGpBMk1pd3dMamsyTlNBeE5EZ3VPREVzTVM0eE1TQk1NVEF5TGpZME1Td3lOeTQyTmpZZ1REazNMakl6TVN3eU5DNDFORElnVERrMExqSXlOaXd4T1M0d05qRWdRemt6TGpNeE15d3hOeTR6T1RRZ09URXVOVEkzTERFMkxqTTFPU0E0T1M0MU5qWXNNVFl1TXpVNElFTTRPQzQxTlRVc01UWXVNelU0SURnM0xqVTBOaXd4Tmk0Mk16SWdPRFl1TmpRNUxERTNMakUxSUVNNE15NDROemdzTVRndU56VWdOemt1TmpnM0xESXhMakUyT1NBM09TNHpOelFzTWpFdU16UTFJRU0zT1M0ek5Ua3NNakV1TXpVeklEYzVMak0wTlN3eU1TNHpOakVnTnprdU16TXNNakV1TXpZNUlFTTNOeTQzT1Rnc01qSXVNalUwSURjMkxqQTROQ3d5TWk0M01qSWdOelF1TXpjekxESXlMamN5TWlCRE56SXVNRGd4TERJeUxqY3lNaUEyT1M0NU5Ua3NNakV1T0RrZ05qZ3VNemszTERJd0xqTTRJRXcyT0M0eE5EVXNNakF1TVRNMUlFTTJOeTQzTURZc01Ua3VOamN5SURZM0xqTXlNeXd4T1M0eE5UWWdOamN1TURBMkxERTRMall3TVNCRE5qWXVPVGc0TERFNExqVTFPU0EyTmk0NU5qZ3NNVGd1TlRFNUlEWTJMamswTml3eE9DNDBOemtnVERZMkxqY3hPU3d4T0M0d05qVWdRelkyTGpZNUxERTRMakF4TWlBMk5pNDJOVGdzTVRjdU9UWWdOall1TmpJMExERTNMamt4TVNCRE5qVXVOamcyTERFMkxqTXpOeUEyTXk0NU5URXNNVFV1TXpZMklEWXlMakExTXl3eE5TNHpOallnUXpZeExqQTBNaXd4TlM0ek5qWWdOakF1TURNekxERTFMalkwSURVNUxqRXpOaXd4Tmk0eE5UZ2dURE11TVRJMUxEUTRMalV3TWlCRE1DNDBNallzTlRBdU1EWXhJQzB3TGpZeE15dzFNeTQwTkRJZ01DNDRNVEVzTlRZdU1EUWdUREV4TGpBNE9TdzNOQzQzT1NCRE1URXVNalkyTERjMUxqRXhNeUF4TVM0MU16Y3NOelV1TXpVeklERXhMamcxTERjMUxqUTVOQ0JNTlRndU1qYzJMREV3TWk0eU9UZ2dRelU1TGpZM09Td3hNRE11TVRBNElEWXhMalF6TXl3eE1ETXVOak1nTmpNdU16UTRMREV3TXk0NE1EWWdRell6TGpneE1pd3hNRE11T0RRNElEWTBMakk0TlN3eE1ETXVPRGNnTmpRdU56VTBMREV3TXk0NE55QkROalVzTVRBekxqZzNJRFkxTGpJME9Td3hNRE11T0RZMElEWTFMalE1TkN3eE1ETXVPRFV5SUVNMk5TNDFOak1zTVRBekxqZzBPU0EyTlM0Mk16SXNNVEF6TGpnME55QTJOUzQzTURFc01UQXpMamcwTnlCRE5qVXVOelkwTERFd015NDRORGNnTmpVdU9ESTRMREV3TXk0NE5Ea2dOalV1T0Rrc01UQXpMamcxTWlCRE5qVXVPVGcyTERFd015NDROVFlnTmpZdU1EZ3NNVEF6TGpnMk15QTJOaTR4TnpNc01UQXpMamczTkNCRE5qWXVNamd5TERFd05TNDBOamNnTmpjdU16TXlMREV3Tnk0eE9UY2dOamd1TnpBeUxERXdOeTQ1T0RnZ1RERXhNUzR4TnpRc01UTXlMalV4SUVNeE1URXVOams0TERFek1pNDRNVElnTVRFeUxqSXpNaXd4TXpJdU9UWTFJREV4TWk0M05qUXNNVE15TGprMk5TQkRNVEUwTGpJMk1Td3hNekl1T1RZMUlERXhOUzR6TkRjc01UTXhMamMyTlNBeE1UVXVNelEzTERFek1DNHhNVE1nVERFeE5TNHpORGNzTVRBekxqVTFNU0JNTVRJeUxqUTFPQ3c1T1M0ME5EWWdRekV5TWk0NE1Ua3NPVGt1TWpNM0lERXlNeTR3T0Rjc09UZ3VPRGs0SURFeU15NHlNRGNzT1RndU5EazRJRXd4TWpjdU9EWTFMRGd5TGprd05TQkRNVE15TGpJM09TdzRNeTQzTURJZ01UTTJMalUxTnl3NE5DNDNOVE1nTVRRd0xqWXdOeXc0Tmk0d016TWdUREUwTVM0eE5DdzROaTQ0TmpJZ1F6RTBNUzQwTlRFc09EY3VNelEySURFME1TNDVOemNzT0RjdU5qRXpJREUwTWk0MU1UWXNPRGN1TmpFeklFTXhOREl1TnprMExEZzNMall4TXlBeE5ETXVNRGMyTERnM0xqVTBNaUF4TkRNdU16TXpMRGczTGpNNU15Qk1NVFk1TGpnMk5TdzNNaTR3TnpZZ1RERTVNeXc0TlM0ME16TWdRekU1TXk0MU1qTXNPRFV1TnpNMUlERTVOQzR3TlRnc09EVXVPRGc0SURFNU5DNDFPU3c0TlM0NE9EZ2dRekU1Tmk0d09EY3NPRFV1T0RnNElERTVOeTR4TnpNc09EUXVOamc1SURFNU55NHhOek1zT0RNdU1ETTJJRXd4T1RjdU1UY3pMREk1TGpBek5TQkRNVGszTGpFM015d3lPQzQwTlRFZ01UazJMamcyTVN3eU55NDVNVEVnTVRrMkxqTTFOU3d5Tnk0Mk1Ua2dRekU1Tmk0ek5UVXNNamN1TmpFNUlERTNNUzQ0TkRNc01UTXVORFkzSURFM01DNHpPRFVzTVRJdU5qSTJJRU14TnpBdU1UTXlMREV5TGpRNElERTJPUzQ0TlN3eE1pNDBNRGNnTVRZNUxqVTJPQ3d4TWk0ME1EY2dRekUyT1M0eU9EVXNNVEl1TkRBM0lERTJPUzR3TURJc01USXVORGd4SURFMk9DNDNORGtzTVRJdU5qSTNJRU14TmpndU1UUXpMREV5TGprM09DQXhOalV1TnpVMkxERTBMak0xTnlBeE5qUXVOREkwTERFMUxqRXlOU0JNTVRVNUxqWXhOU3d4TUM0NE55QkRNVFU0TGpjNU5pd3hNQzR4TkRVZ01UVTRMakUxTkN3NExqa3pOeUF4TlRndU1EVTBMRGN1T1RNMElFTXhOVGd1TURRMUxEY3VPRE0zSURFMU9DNHdNelFzTnk0M016a2dNVFU0TGpBeU1TdzNMalkwSUVNeE5UZ3VNREExTERjdU5USXpJREUxTnk0NU9UZ3NOeTQwTVNBeE5UY3VPVGs0TERjdU16QTBJRXd4TlRjdU9UazRMRFl1TkRFNElFTXhOVGN1T1RrNExEVXVPRE0wSURFMU55NDJPRFlzTlM0eU9UVWdNVFUzTGpFNE1TdzFMakF3TWlCRE1UVTJMall5TkN3MExqWTRJREUxTUM0ME5ESXNNUzR4TVRFZ01UVXdMalEwTWl3eExqRXhNU0JETVRVd0xqRTRPU3d3TGprMk5TQXhORGt1T1RBM0xEQXVPRGt5SURFME9TNDJNalVzTUM0NE9USWlJR2xrUFNKR2FXeHNMVEVpSUdacGJHdzlJaU0wTlRWQk5qUWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOT1RZdU1ESTNMREkxTGpZek5pQk1NVFF5TGpZd015dzFNaTQxTWpjZ1F6RTBNeTQ0TURjc05UTXVNakl5SURFME5DNDFPRElzTlRRdU1URTBJREUwTkM0NE5EVXNOVFV1TURZNElFd3hORFF1T0RNMUxEVTFMakEzTlNCTU5qTXVORFl4TERFd01pNHdOVGNnVERZekxqUTJMREV3TWk0d05UY2dRell4TGpnd05pd3hNREV1T1RBMUlEWXdMakkyTVN3eE1ERXVORFUzSURVNUxqQTFOeXd4TURBdU56WXlJRXd4TWk0ME9ERXNOek11T0RjeElFdzVOaTR3TWpjc01qVXVOak0ySWlCcFpEMGlSbWxzYkMweUlpQm1hV3hzUFNJalJrRkdRVVpCSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUWXpMalEyTVN3eE1ESXVNVGMwSUVNMk15NDBOVE1zTVRBeUxqRTNOQ0EyTXk0ME5EWXNNVEF5TGpFM05DQTJNeTQwTXprc01UQXlMakUzTWlCRE5qRXVOelEyTERFd01pNHdNVFlnTmpBdU1qRXhMREV3TVM0MU5qTWdOVGd1T1RrNExERXdNQzQ0TmpNZ1RERXlMalF5TWl3M015NDVOek1nUXpFeUxqTTROaXczTXk0NU5USWdNVEl1TXpZMExEY3pMamt4TkNBeE1pNHpOalFzTnpNdU9EY3hJRU14TWk0ek5qUXNOek11T0RNZ01USXVNemcyTERjekxqYzVNU0F4TWk0ME1qSXNOek11TnpjZ1REazFMamsyT0N3eU5TNDFNelVnUXprMkxqQXdOQ3d5TlM0MU1UUWdPVFl1TURRNUxESTFMalV4TkNBNU5pNHdPRFVzTWpVdU5UTTFJRXd4TkRJdU5qWXhMRFV5TGpReU5pQkRNVFF6TGpnNE9DdzFNeTR4TXpRZ01UUTBMalk0TWl3MU5DNHdNemdnTVRRMExqazFOeXcxTlM0d016Y2dRekUwTkM0NU55dzFOUzR3T0RNZ01UUTBMamsxTXl3MU5TNHhNek1nTVRRMExqa3hOU3cxTlM0eE5qRWdRekUwTkM0NU1URXNOVFV1TVRZMUlERTBOQzQ0T1Rnc05UVXVNVGMwSURFME5DNDRPVFFzTlRVdU1UYzNJRXcyTXk0MU1Ua3NNVEF5TGpFMU9DQkROak11TlRBeExERXdNaTR4TmprZ05qTXVORGd4TERFd01pNHhOelFnTmpNdU5EWXhMREV3TWk0eE56UWdURFl6TGpRMk1Td3hNREl1TVRjMElGb2dUVEV5TGpjeE5DdzNNeTQ0TnpFZ1REVTVMakV4TlN3eE1EQXVOall4SUVNMk1DNHlPVE1zTVRBeExqTTBNU0EyTVM0M09EWXNNVEF4TGpjNE1pQTJNeTQwTXpVc01UQXhMamt6TnlCTU1UUTBMamN3Tnl3MU5TNHdNVFVnUXpFME5DNDBNamdzTlRRdU1UQTRJREUwTXk0Mk9ESXNOVE11TWpnMUlERTBNaTQxTkRRc05USXVOakk0SUV3NU5pNHdNamNzTWpVdU56Y3hJRXd4TWk0M01UUXNOek11T0RjeElFd3hNaTQzTVRRc056TXVPRGN4SUZvaUlHbGtQU0pHYVd4c0xUTWlJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVFE0TGpNeU55dzFPQzQwTnpFZ1F6RTBPQzR4TkRVc05UZ3VORGdnTVRRM0xqazJNaXcxT0M0ME9DQXhORGN1TnpneExEVTRMalEzTWlCRE1UUTFMamc0Tnl3MU9DNHpPRGtnTVRRMExqUTNPU3cxTnk0ME16UWdNVFEwTGpZek5pdzFOaTR6TkNCRE1UUTBMalk0T1N3MU5TNDVOamNnTVRRMExqWTJOQ3cxTlM0MU9UY2dNVFEwTGpVMk5DdzFOUzR5TXpVZ1REWXpMalEyTVN3eE1ESXVNRFUzSUVNMk5DNHdPRGtzTVRBeUxqRXhOU0EyTkM0M016TXNNVEF5TGpFeklEWTFMak0zT1N3eE1ESXVNRGs1SUVNMk5TNDFOakVzTVRBeUxqQTVJRFkxTGpjME15d3hNREl1TURrZ05qVXVPVEkxTERFd01pNHdPVGdnUXpZM0xqZ3hPU3d4TURJdU1UZ3hJRFk1TGpJeU55d3hNRE11TVRNMklEWTVMakEzTERFd05DNHlNeUJNTVRRNExqTXlOeXcxT0M0ME56RWlJR2xrUFNKR2FXeHNMVFFpSUdacGJHdzlJaU5HUmtaR1JrWWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTmprdU1EY3NNVEEwTGpNME55QkROamt1TURRNExERXdOQzR6TkRjZ05qa3VNREkxTERFd05DNHpOQ0EyT1M0d01EVXNNVEEwTGpNeU55QkROamd1T1RZNExERXdOQzR6TURFZ05qZ3VPVFE0TERFd05DNHlOVGNnTmpndU9UVTFMREV3TkM0eU1UTWdRelk1TERFd015NDRPVFlnTmpndU9EazRMREV3TXk0MU56WWdOamd1TmpVNExERXdNeTR5T0RnZ1F6WTRMakUxTXl3eE1ESXVOamM0SURZM0xqRXdNeXd4TURJdU1qWTJJRFkxTGpreUxERXdNaTR5TVRRZ1F6WTFMamMwTWl3eE1ESXVNakEySURZMUxqVTJNeXd4TURJdU1qQTNJRFkxTGpNNE5Td3hNREl1TWpFMUlFTTJOQzQzTkRJc01UQXlMakkwTmlBMk5DNHdPRGNzTVRBeUxqSXpNaUEyTXk0ME5Td3hNREl1TVRjMElFTTJNeTR6T1Rrc01UQXlMakUyT1NBMk15NHpOVGdzTVRBeUxqRXpNaUEyTXk0ek5EY3NNVEF5TGpBNE1pQkROak11TXpNMkxERXdNaTR3TXpNZ05qTXVNelU0TERFd01TNDVPREVnTmpNdU5EQXlMREV3TVM0NU5UWWdUREUwTkM0MU1EWXNOVFV1TVRNMElFTXhORFF1TlRNM0xEVTFMakV4TmlBeE5EUXVOVGMxTERVMUxqRXhNeUF4TkRRdU5qQTVMRFUxTGpFeU55QkRNVFEwTGpZME1pdzFOUzR4TkRFZ01UUTBMalkyT0N3MU5TNHhOeUF4TkRRdU5qYzNMRFUxTGpJd05DQkRNVFEwTGpjNE1TdzFOUzQxT0RVZ01UUTBMamd3Tml3MU5TNDVOeklnTVRRMExqYzFNU3cxTmk0ek5UY2dRekUwTkM0M01EWXNOVFl1TmpjeklERTBOQzQ0TURnc05UWXVPVGswSURFME5TNHdORGNzTlRjdU1qZ3lJRU14TkRVdU5UVXpMRFUzTGpnNU1pQXhORFl1TmpBeUxEVTRMak13TXlBeE5EY3VOemcyTERVNExqTTFOU0JETVRRM0xqazJOQ3cxT0M0ek5qTWdNVFE0TGpFME15dzFPQzR6TmpNZ01UUTRMak15TVN3MU9DNHpOVFFnUXpFME9DNHpOemNzTlRndU16VXlJREUwT0M0ME1qUXNOVGd1TXpnM0lERTBPQzQwTXprc05UZ3VORE00SUVNeE5EZ3VORFUwTERVNExqUTVJREUwT0M0ME16SXNOVGd1TlRRMUlERTBPQzR6T0RVc05UZ3VOVGN5SUV3Mk9TNHhNamtzTVRBMExqTXpNU0JETmprdU1URXhMREV3TkM0ek5ESWdOamt1TURrc01UQTBMak0wTnlBMk9TNHdOeXd4TURRdU16UTNJRXcyT1M0d055d3hNRFF1TXpRM0lGb2dUVFkxTGpZMk5Td3hNREV1T1RjMUlFTTJOUzQzTlRRc01UQXhMamszTlNBMk5TNDRORElzTVRBeExqazNOeUEyTlM0NU15d3hNREV1T1RneElFTTJOeTR4T1RZc01UQXlMakF6TnlBMk9DNHlPRE1zTVRBeUxqUTJPU0EyT0M0NE16Z3NNVEF6TGpFek9TQkROamt1TURZMUxERXdNeTQwTVRNZ05qa3VNVGc0TERFd015NDNNVFFnTmprdU1UazRMREV3TkM0d01qRWdUREUwTnk0NE9ETXNOVGd1TlRreUlFTXhORGN1T0RRM0xEVTRMalU1TWlBeE5EY3VPREV4TERVNExqVTVNU0F4TkRjdU56YzJMRFU0TGpVNE9TQkRNVFEyTGpVd09TdzFPQzQxTXpNZ01UUTFMalF5TWl3MU9DNHhJREUwTkM0NE5qY3NOVGN1TkRNeElFTXhORFF1TlRnMUxEVTNMakE1TVNBeE5EUXVORFkxTERVMkxqY3dOeUF4TkRRdU5USXNOVFl1TXpJMElFTXhORFF1TlRZekxEVTJMakF5TVNBeE5EUXVOVFV5TERVMUxqY3hOaUF4TkRRdU5EZzRMRFUxTGpReE5DQk1Oak11T0RRMkxERXdNUzQ1TnlCRE5qUXVNelV6TERFd01pNHdNRElnTmpRdU9EWTNMREV3TWk0d01EWWdOalV1TXpjMExERXdNUzQ1T0RJZ1F6WTFMalEzTVN3eE1ERXVPVGMzSURZMUxqVTJPQ3d4TURFdU9UYzFJRFkxTGpZMk5Td3hNREV1T1RjMUlFdzJOUzQyTmpVc01UQXhMamszTlNCYUlpQnBaRDBpUm1sc2JDMDFJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEl1TWpBNExEVTFMakV6TkNCRE1TNHlNRGNzTlRNdU16QTNJREV1T1RZM0xEVXdMamt4TnlBekxqa3dOaXcwT1M0M09UY2dURFU1TGpreE55d3hOeTQwTlRNZ1F6WXhMamcxTml3eE5pNHpNek1nTmpRdU1qUXhMREUyTGprd055QTJOUzR5TkRNc01UZ3VOek0wSUV3Mk5TNDBOelVzTVRrdU1UUTBJRU0yTlM0NE56SXNNVGt1T0RneUlEWTJMak0yT0N3eU1DNDFOaUEyTmk0NU5EVXNNakV1TVRZMUlFdzJOeTR5TWpNc01qRXVORE0xSUVNM01DNDFORGdzTWpRdU5qUTVJRGMxTGpnd05pd3lOUzR4TlRFZ09EQXVNVEV4TERJeUxqWTJOU0JNT0RjdU5ETXNNVGd1TkRRMUlFTTRPUzR6Tnl3eE55NHpNallnT1RFdU56VTBMREUzTGpnNU9TQTVNaTQzTlRVc01Ua3VOekkzSUV3NU5pNHdNRFVzTWpVdU5qVTFJRXd4TWk0ME9EWXNOek11T0RnMElFd3lMakl3T0N3MU5TNHhNelFnV2lJZ2FXUTlJa1pwYkd3dE5pSWdabWxzYkQwaUkwWkJSa0ZHUVNJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMHhNaTQwT0RZc056UXVNREF4SUVNeE1pNDBOellzTnpRdU1EQXhJREV5TGpRMk5TdzNNeTQ1T1RrZ01USXVORFUxTERjekxqazVOaUJETVRJdU5ESTBMRGN6TGprNE9DQXhNaTR6T1Rrc056TXVPVFkzSURFeUxqTTROQ3czTXk0NU5DQk1NaTR4TURZc05UVXVNVGtnUXpFdU1EYzFMRFV6TGpNeElERXVPRFUzTERVd0xqZzBOU0F6TGpnME9DdzBPUzQyT1RZZ1REVTVMamcxT0N3eE55NHpOVElnUXpZd0xqVXlOU3d4Tmk0NU5qY2dOakV1TWpjeExERTJMamMyTkNBMk1pNHdNVFlzTVRZdU56WTBJRU0yTXk0ME16RXNNVFl1TnpZMElEWTBMalkyTml3eE55NDBOallnTmpVdU16STNMREU0TGpZME5pQkROalV1TXpNM0xERTRMalkxTkNBMk5TNHpORFVzTVRndU5qWXpJRFkxTGpNMU1Td3hPQzQyTnpRZ1REWTFMalUzT0N3eE9TNHdPRGdnUXpZMUxqVTROQ3d4T1M0eElEWTFMalU0T1N3eE9TNHhNVElnTmpVdU5Ua3hMREU1TGpFeU5pQkROalV1T1RnMUxERTVMamd6T0NBMk5pNDBOamtzTWpBdU5EazNJRFkzTGpBekxESXhMakE0TlNCTU5qY3VNekExTERJeExqTTFNU0JETmprdU1UVXhMREl6TGpFek55QTNNUzQyTkRrc01qUXVNVElnTnpRdU16TTJMREkwTGpFeUlFTTNOaTR6TVRNc01qUXVNVElnTnpndU1qa3NNak11TlRneUlEZ3dMakExTXl3eU1pNDFOak1nUXpnd0xqQTJOQ3d5TWk0MU5UY2dPREF1TURjMkxESXlMalUxTXlBNE1DNHdPRGdzTWpJdU5UVWdURGczTGpNM01pd3hPQzR6TkRRZ1F6ZzRMakF6T0N3eE55NDVOVGtnT0RndU56ZzBMREUzTGpjMU5pQTRPUzQxTWprc01UY3VOelUySUVNNU1DNDVOVFlzTVRjdU56VTJJRGt5TGpJd01Td3hPQzQwTnpJZ09USXVPRFU0TERFNUxqWTNJRXc1Tmk0eE1EY3NNalV1TlRrNUlFTTVOaTR4TXpnc01qVXVOalUwSURrMkxqRXhPQ3d5TlM0M01qUWdPVFl1TURZekxESTFMamMxTmlCTU1USXVOVFExTERjekxqazROU0JETVRJdU5USTJMRGN6TGprNU5pQXhNaTQxTURZc056UXVNREF4SURFeUxqUTROaXczTkM0d01ERWdUREV5TGpRNE5pdzNOQzR3TURFZ1dpQk5Oakl1TURFMkxERTJMams1TnlCRE5qRXVNekV5TERFMkxqazVOeUEyTUM0Mk1EWXNNVGN1TVRrZ05Ua3VPVGMxTERFM0xqVTFOQ0JNTXk0NU5qVXNORGt1T0RrNUlFTXlMakE0TXl3MU1DNDVPRFVnTVM0ek5ERXNOVE11TXpBNElESXVNekVzTlRVdU1EYzRJRXd4TWk0MU16RXNOek11TnpJeklFdzVOUzQ0TkRnc01qVXVOakV4SUV3NU1pNDJOVE1zTVRrdU56Z3lJRU01TWk0d016Z3NNVGd1TmpZZ09UQXVPRGNzTVRjdU9Ua2dPRGt1TlRJNUxERTNMams1SUVNNE9DNDRNalVzTVRjdU9Ua2dPRGd1TVRFNUxERTRMakU0TWlBNE55NDBPRGtzTVRndU5UUTNJRXc0TUM0eE56SXNNakl1TnpjeUlFTTRNQzR4TmpFc01qSXVOemM0SURnd0xqRTBPU3d5TWk0M09ESWdPREF1TVRNM0xESXlMamM0TlNCRE56Z3VNelEyTERJekxqZ3hNU0EzTmk0ek5ERXNNalF1TXpVMElEYzBMak16Tml3eU5DNHpOVFFnUXpjeExqVTRPQ3d5TkM0ek5UUWdOamt1TURNekxESXpMak0wTnlBMk55NHhORElzTWpFdU5URTVJRXcyTmk0NE5qUXNNakV1TWpRNUlFTTJOaTR5Tnpjc01qQXVOak0wSURZMUxqYzNOQ3d4T1M0NU5EY2dOalV1TXpZM0xERTVMakl3TXlCRE5qVXVNellzTVRrdU1Ua3lJRFkxTGpNMU5pd3hPUzR4TnprZ05qVXVNelUwTERFNUxqRTJOaUJNTmpVdU1UWXpMREU0TGpneE9TQkROalV1TVRVMExERTRMamd4TVNBMk5TNHhORFlzTVRndU9EQXhJRFkxTGpFMExERTRMamM1SUVNMk5DNDFNalVzTVRjdU5qWTNJRFl6TGpNMU55d3hOaTQ1T1RjZ05qSXVNREUyTERFMkxqazVOeUJNTmpJdU1ERTJMREUyTGprNU55QmFJaUJwWkQwaVJtbHNiQzAzSWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRReUxqUXpOQ3cwT0M0NE1EZ2dURFF5TGpRek5DdzBPQzQ0TURnZ1F6TTVMamt5TkN3ME9DNDRNRGNnTXpjdU56TTNMRFEzTGpVMUlETTJMalU0TWl3ME5TNDBORE1nUXpNMExqYzNNU3cwTWk0eE16a2dNell1TVRRMExETTNMamd3T1NBek9TNDJOREVzTXpVdU56ZzVJRXcxTVM0NU16SXNNamd1TmpreElFTTFNeTR4TURNc01qZ3VNREUxSURVMExqUXhNeXd5Tnk0Mk5UZ2dOVFV1TnpJeExESTNMalkxT0NCRE5UZ3VNak14TERJM0xqWTFPQ0EyTUM0ME1UZ3NNamd1T1RFMklEWXhMalUzTXl3ek1TNHdNak1nUXpZekxqTTROQ3d6TkM0ek1qY2dOakl1TURFeUxETTRMalkxTnlBMU9DNDFNVFFzTkRBdU5qYzNJRXcwTmk0eU1qTXNORGN1TnpjMUlFTTBOUzR3TlRNc05EZ3VORFVnTkRNdU56UXlMRFE0TGpnd09DQTBNaTQwTXpRc05EZ3VPREE0SUV3ME1pNDBNelFzTkRndU9EQTRJRm9nVFRVMUxqY3lNU3d5T0M0eE1qVWdRelUwTGpRNU5Td3lPQzR4TWpVZ05UTXVNalkxTERJNExqUTJNU0ExTWk0eE5qWXNNamt1TURrMklFd3pPUzQ0TnpVc016WXVNVGswSUVNek5pNDFPVFlzTXpndU1EZzNJRE0xTGpNd01pdzBNaTR4TXpZZ016WXVPVGt5TERRMUxqSXhPQ0JETXpndU1EWXpMRFEzTGpFM015QTBNQzR3T1Rnc05EZ3VNelFnTkRJdU5ETTBMRFE0TGpNMElFTTBNeTQyTmpFc05EZ3VNelFnTkRRdU9Ea3NORGd1TURBMUlEUTFMams1TERRM0xqTTNJRXcxT0M0eU9ERXNOREF1TWpjeUlFTTJNUzQxTml3ek9DNHpOemtnTmpJdU9EVXpMRE0wTGpNeklEWXhMakUyTkN3ek1TNHlORGdnUXpZd0xqQTVNaXd5T1M0eU9UTWdOVGd1TURVNExESTRMakV5TlNBMU5TNDNNakVzTWpndU1USTFJRXcxTlM0M01qRXNNamd1TVRJMUlGb2lJR2xrUFNKR2FXeHNMVGdpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRRNUxqVTRPQ3d5TGpRd055QkRNVFE1TGpVNE9Dd3lMalF3TnlBeE5UVXVOelk0TERVdU9UYzFJREUxTmk0ek1qVXNOaTR5T1RjZ1RERTFOaTR6TWpVc055NHhPRFFnUXpFMU5pNHpNalVzTnk0ek5pQXhOVFl1TXpNNExEY3VOVFEwSURFMU5pNHpOaklzTnk0M016TWdRekUxTmk0ek56TXNOeTQ0TVRRZ01UVTJMak00TWl3M0xqZzVOQ0F4TlRZdU16a3NOeTQ1TnpVZ1F6RTFOaTQxTXl3NUxqTTVJREUxTnk0ek5qTXNNVEF1T1RjeklERTFPQzQwT1RVc01URXVPVGMwSUV3eE5qVXVPRGt4TERFNExqVXhPU0JETVRZMkxqQTJPQ3d4T0M0Mk56VWdNVFkyTGpJME9Td3hPQzQ0TVRRZ01UWTJMalF6TWl3eE9DNDVNelFnUXpFMk9DNHdNVEVzTVRrdU9UYzBJREUyT1M0ek9ESXNNVGt1TkNBeE5qa3VORGswTERFM0xqWTFNaUJETVRZNUxqVTBNeXd4Tmk0NE5qZ2dNVFk1TGpVMU1Td3hOaTR3TlRjZ01UWTVMalV4Tnl3eE5TNHlNak1nVERFMk9TNDFNVFFzTVRVdU1EWXpJRXd4TmprdU5URTBMREV6TGpreE1pQkRNVGN3TGpjNExERTBMalkwTWlBeE9UVXVOVEF4TERJNExqa3hOU0F4T1RVdU5UQXhMREk0TGpreE5TQk1NVGsxTGpVd01TdzRNaTQ1TVRVZ1F6RTVOUzQxTURFc09EUXVNREExSURFNU5DNDNNekVzT0RRdU5EUTFJREU1TXk0M09ERXNPRE11T0RrM0lFd3hOVEV1TXpBNExEVTVMak0zTkNCRE1UVXdMak0xT0N3MU9DNDRNallnTVRRNUxqVTRPQ3cxTnk0ME9UY2dNVFE1TGpVNE9DdzFOaTQwTURnZ1RERTBPUzQxT0Rnc01qSXVNemMxSWlCcFpEMGlSbWxzYkMwNUlpQm1hV3hzUFNJalJrRkdRVVpCSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURTVOQzQxTlRNc09EUXVNalVnUXpFNU5DNHlPVFlzT0RRdU1qVWdNVGswTGpBeE15dzROQzR4TmpVZ01Ua3pMamN5TWl3NE15NDVPVGNnVERFMU1TNHlOU3cxT1M0ME56WWdRekUxTUM0eU5qa3NOVGd1T1RBNUlERTBPUzQwTnpFc05UY3VOVE16SURFME9TNDBOekVzTlRZdU5EQTRJRXd4TkRrdU5EY3hMREl5TGpNM05TQk1NVFE1TGpjd05Td3lNaTR6TnpVZ1RERTBPUzQzTURVc05UWXVOREE0SUVNeE5Ea3VOekExTERVM0xqUTFPU0F4TlRBdU5EVXNOVGd1TnpRMElERTFNUzR6TmpZc05Ua3VNamMwSUV3eE9UTXVPRE01TERnekxqYzVOU0JETVRrMExqSTJNeXc0TkM0d05DQXhPVFF1TmpVMUxEZzBMakE0TXlBeE9UUXVPVFF5TERnekxqa3hOeUJETVRrMUxqSXlOeXc0TXk0M05UTWdNVGsxTGpNNE5DdzRNeTR6T1RjZ01UazFMak00TkN3NE1pNDVNVFVnVERFNU5TNHpPRFFzTWpndU9UZ3lJRU14T1RRdU1UQXlMREk0TGpJME1pQXhOekl1TVRBMExERTFMalUwTWlBeE5qa3VOak14TERFMExqRXhOQ0JNTVRZNUxqWXpOQ3d4TlM0eU1pQkRNVFk1TGpZMk9Dd3hOaTR3TlRJZ01UWTVMalkyTERFMkxqZzNOQ0F4TmprdU5qRXNNVGN1TmpVNUlFTXhOamt1TlRVMkxERTRMalV3TXlBeE5qa3VNakUwTERFNUxqRXlNeUF4TmpndU5qUTNMREU1TGpRd05TQkRNVFk0TGpBeU9Dd3hPUzQzTVRRZ01UWTNMakU1Tnl3eE9TNDFOemdnTVRZMkxqTTJOeXd4T1M0d016SWdRekUyTmk0eE9ERXNNVGd1T1RBNUlERTJOUzQ1T1RVc01UZ3VOelkySURFMk5TNDRNVFFzTVRndU5qQTJJRXd4TlRndU5ERTNMREV5TGpBMk1pQkRNVFUzTGpJMU9Td3hNUzR3TXpZZ01UVTJMalF4T0N3NUxqUXpOeUF4TlRZdU1qYzBMRGN1T1RnMklFTXhOVFl1TWpZMkxEY3VPVEEzSURFMU5pNHlOVGNzTnk0NE1qY2dNVFUyTGpJME55dzNMamMwT0NCRE1UVTJMakl5TVN3M0xqVTFOU0F4TlRZdU1qQTVMRGN1TXpZMUlERTFOaTR5TURrc055NHhPRFFnVERFMU5pNHlNRGtzTmk0ek5qUWdRekUxTlM0ek56VXNOUzQ0T0RNZ01UUTVMalV5T1N3eUxqVXdPQ0F4TkRrdU5USTVMREl1TlRBNElFd3hORGt1TmpRMkxESXVNekEySUVNeE5Ea3VOalEyTERJdU16QTJJREUxTlM0NE1qY3NOUzQ0TnpRZ01UVTJMak00TkN3MkxqRTVOaUJNTVRVMkxqUTBNaXcyTGpJeklFd3hOVFl1TkRReUxEY3VNVGcwSUVNeE5UWXVORFF5TERjdU16VTFJREUxTmk0ME5UUXNOeTQxTXpVZ01UVTJMalEzT0N3M0xqY3hOeUJETVRVMkxqUTRPU3czTGpnZ01UVTJMalE1T1N3M0xqZzRNaUF4TlRZdU5UQTNMRGN1T1RZeklFTXhOVFl1TmpRMUxEa3VNelU0SURFMU55NDBOVFVzTVRBdU9EazRJREUxT0M0MU56SXNNVEV1T0RnMklFd3hOalV1T1RZNUxERTRMalF6TVNCRE1UWTJMakUwTWl3eE9DNDFPRFFnTVRZMkxqTXhPU3d4T0M0M01pQXhOall1TkRrMkxERTRMamd6TnlCRE1UWTNMakkxTkN3eE9TNHpNellnTVRZNExERTVMalEyTnlBeE5qZ3VOVFF6TERFNUxqRTVOaUJETVRZNUxqQXpNeXd4T0M0NU5UTWdNVFk1TGpNeU9Td3hPQzQwTURFZ01UWTVMak0zTnl3eE55NDJORFVnUXpFMk9TNDBNamNzTVRZdU9EWTNJREUyT1M0ME16UXNNVFl1TURVMElERTJPUzQwTURFc01UVXVNakk0SUV3eE5qa3VNemszTERFMUxqQTJOU0JNTVRZNUxqTTVOeXd4TXk0M01TQk1NVFk1TGpVM01pd3hNeTQ0TVNCRE1UY3dMamd6T1N3eE5DNDFOREVnTVRrMUxqVTFPU3d5T0M0NE1UUWdNVGsxTGpVMU9Td3lPQzQ0TVRRZ1RERTVOUzQyTVRnc01qZ3VPRFEzSUV3eE9UVXVOakU0TERneUxqa3hOU0JETVRrMUxqWXhPQ3c0TXk0ME9EUWdNVGsxTGpReUxEZ3pMamt4TVNBeE9UVXVNRFU1TERnMExqRXhPU0JETVRrMExqa3dPQ3c0TkM0eU1EWWdNVGswTGpjek55dzROQzR5TlNBeE9UUXVOVFV6TERnMExqSTFJaUJwWkQwaVJtbHNiQzB4TUNJZ1ptbHNiRDBpSXpZd04wUTRRaUkrUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWsweE5EVXVOamcxTERVMkxqRTJNU0JNTVRZNUxqZ3NOekF1TURneklFd3hORE11T0RJeUxEZzFMakE0TVNCTU1UUXlMak0yTERnMExqYzNOQ0JETVRNMUxqZ3lOaXc0TWk0Mk1EUWdNVEk0TGpjek1pdzRNUzR3TkRZZ01USXhMak0wTVN3NE1DNHhOVGdnUXpFeE5pNDVOellzTnprdU5qTTBJREV4TWk0Mk56Z3NPREV1TWpVMElERXhNUzQzTkRNc09ETXVOemM0SUVNeE1URXVOVEEyTERnMExqUXhOQ0F4TVRFdU5UQXpMRGcxTGpBM01TQXhNVEV1TnpNeUxEZzFMamN3TmlCRE1URXpMakkzTERnNUxqazNNeUF4TVRVdU9UWTRMRGswTGpBMk9TQXhNVGt1TnpJM0xEazNMamcwTVNCTU1USXdMakkxT1N3NU9DNDJPRFlnUXpFeU1DNHlOaXc1T0M0Mk9EVWdPVFF1TWpneUxERXhNeTQyT0RNZ09UUXVNamd5TERFeE15NDJPRE1nVERjd0xqRTJOeXc1T1M0M05qRWdUREUwTlM0Mk9EVXNOVFl1TVRZeElpQnBaRDBpUm1sc2JDMHhNU0lnWm1sc2JEMGlJMFpHUmtaR1JpSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazA1TkM0eU9ESXNNVEV6TGpneE9DQk1PVFF1TWpJekxERXhNeTQzT0RVZ1REWTVMamt6TXl3NU9TNDNOakVnVERjd0xqRXdPQ3c1T1M0Mk5pQk1NVFExTGpZNE5TdzFOaTR3TWpZZ1RERTBOUzQzTkRNc05UWXVNRFU1SUV3eE56QXVNRE16TERjd0xqQTRNeUJNTVRRekxqZzBNaXc0TlM0eU1EVWdUREUwTXk0M09UY3NPRFV1TVRrMUlFTXhORE11TnpjeUxEZzFMakU1SURFME1pNHpNellzT0RRdU9EZzRJREUwTWk0ek16WXNPRFF1T0RnNElFTXhNelV1TnpnM0xEZ3lMamN4TkNBeE1qZ3VOekl6TERneExqRTJNeUF4TWpFdU16STNMRGd3TGpJM05DQkRNVEl3TGpjNE9DdzRNQzR5TURrZ01USXdMakl6Tml3NE1DNHhOemNnTVRFNUxqWTRPU3c0TUM0eE56Y2dRekV4TlM0NU16RXNPREF1TVRjM0lERXhNaTQyTXpVc09ERXVOekE0SURFeE1TNDROVElzT0RNdU9ERTVJRU14TVRFdU5qSTBMRGcwTGpRek1pQXhNVEV1TmpJeExEZzFMakExTXlBeE1URXVPRFF5TERnMUxqWTJOeUJETVRFekxqTTNOeXc0T1M0NU1qVWdNVEUyTGpBMU9DdzVNeTQ1T1RNZ01URTVMamd4TERrM0xqYzFPQ0JNTVRFNUxqZ3lOaXc1Tnk0M056a2dUREV5TUM0ek5USXNPVGd1TmpFMElFTXhNakF1TXpVMExEazRMall4TnlBeE1qQXVNelUyTERrNExqWXlJREV5TUM0ek5UZ3NPVGd1TmpJMElFd3hNakF1TkRJeUxEazRMamN5TmlCTU1USXdMak14Tnl3NU9DNDNPRGNnUXpFeU1DNHlOalFzT1RndU9ERTRJRGswTGpVNU9Td3hNVE11TmpNMUlEazBMak0wTERFeE15NDNPRFVnVERrMExqSTRNaXd4TVRNdU9ERTRJRXc1TkM0eU9ESXNNVEV6TGpneE9DQmFJRTAzTUM0ME1ERXNPVGt1TnpZeElFdzVOQzR5T0RJc01URXpMalUwT1NCTU1URTVMakE0TkN3NU9TNHlNamtnUXpFeE9TNDJNeXc1T0M0NU1UUWdNVEU1TGprekxEazRMamMwSURFeU1DNHhNREVzT1RndU5qVTBJRXd4TVRrdU5qTTFMRGszTGpreE5DQkRNVEUxTGpnMk5DdzVOQzR4TWpjZ01URXpMakUyT0N3NU1DNHdNek1nTVRFeExqWXlNaXc0TlM0M05EWWdRekV4TVM0ek9ESXNPRFV1TURjNUlERXhNUzR6T0RZc09EUXVOREEwSURFeE1TNDJNek1zT0RNdU56TTRJRU14TVRJdU5EUTRMRGd4TGpVek9TQXhNVFV1T0RNMkxEYzVMamswTXlBeE1Ua3VOamc1TERjNUxqazBNeUJETVRJd0xqSTBOaXczT1M0NU5ETWdNVEl3TGpnd05pdzNPUzQ1TnpZZ01USXhMak0xTlN3NE1DNHdORElnUXpFeU9DNDNOamNzT0RBdU9UTXpJREV6TlM0NE5EWXNPREl1TkRnM0lERTBNaTR6T1RZc09EUXVOall6SUVNeE5ETXVNak15TERnMExqZ3pPQ0F4TkRNdU5qRXhMRGcwTGpreE55QXhORE11TnpnMkxEZzBMamsyTnlCTU1UWTVMalUyTml3M01DNHdPRE1nVERFME5TNDJPRFVzTlRZdU1qazFJRXczTUM0ME1ERXNPVGt1TnpZeElFdzNNQzQwTURFc09Ua3VOell4SUZvaUlHbGtQU0pHYVd4c0xURXlJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEUyTnk0eU15d3hPQzQ1TnprZ1RERTJOeTR5TXl3Mk9TNDROU0JNTVRNNUxqa3dPU3c0TlM0Mk1qTWdUREV6TXk0ME5EZ3NOekV1TkRVMklFTXhNekl1TlRNNExEWTVMalEySURFek1DNHdNaXcyT1M0M01UZ2dNVEkzTGpneU5DdzNNaTR3TXlCRE1USTJMamMyT1N3M015NHhOQ0F4TWpVdU9UTXhMRGMwTGpVNE5TQXhNalV1TkRrMExEYzJMakEwT0NCTU1URTVMakF6TkN3NU55NDJOellnVERreExqY3hNaXd4TVRNdU5EVWdURGt4TGpjeE1pdzJNaTQxTnprZ1RERTJOeTR5TXl3eE9DNDVOemtpSUdsa1BTSkdhV3hzTFRFeklpQm1hV3hzUFNJalJrWkdSa1pHSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUa3hMamN4TWl3eE1UTXVOVFkzSUVNNU1TNDJPVElzTVRFekxqVTJOeUE1TVM0Mk56SXNNVEV6TGpVMk1TQTVNUzQyTlRNc01URXpMalUxTVNCRE9URXVOakU0TERFeE15NDFNeUE1TVM0MU9UVXNNVEV6TGpRNU1pQTVNUzQxT1RVc01URXpMalExSUV3NU1TNDFPVFVzTmpJdU5UYzVJRU01TVM0MU9UVXNOakl1TlRNM0lEa3hMall4T0N3Mk1pNDBPVGtnT1RFdU5qVXpMRFl5TGpRM09DQk1NVFkzTGpFM01pd3hPQzQ0TnpnZ1F6RTJOeTR5TURnc01UZ3VPRFUzSURFMk55NHlOVElzTVRndU9EVTNJREUyTnk0eU9EZ3NNVGd1T0RjNElFTXhOamN1TXpJMExERTRMamc1T1NBeE5qY3VNelEzTERFNExqa3pOeUF4TmpjdU16UTNMREU0TGprM09TQk1NVFkzTGpNME55dzJPUzQ0TlNCRE1UWTNMak0wTnl3Mk9TNDRPVEVnTVRZM0xqTXlOQ3cyT1M0NU15QXhOamN1TWpnNExEWTVMamsxSUV3eE16a3VPVFkzTERnMUxqY3lOU0JETVRNNUxqa3pPU3c0TlM0M05ERWdNVE01TGprd05TdzROUzQzTkRVZ01UTTVMamczTXl3NE5TNDNNelVnUXpFek9TNDRORElzT0RVdU56STFJREV6T1M0NE1UWXNPRFV1TnpBeUlERXpPUzQ0TURJc09EVXVOamN5SUV3eE16TXVNelF5TERjeExqVXdOQ0JETVRNeUxqazJOeXczTUM0Mk9ESWdNVE15TGpJNExEY3dMakl5T1NBeE16RXVOREE0TERjd0xqSXlPU0JETVRNd0xqTXhPU3czTUM0eU1qa2dNVEk1TGpBME5DdzNNQzQ1TVRVZ01USTNMamt3T0N3M01pNHhNU0JETVRJMkxqZzNOQ3czTXk0eUlERXlOaTR3TXpRc056UXVOalEzSURFeU5TNDJNRFlzTnpZdU1EZ3lJRXd4TVRrdU1UUTJMRGszTGpjd09TQkRNVEU1TGpFek55dzVOeTQzTXpnZ01URTVMakV4T0N3NU55NDNOaklnTVRFNUxqQTVNaXc1Tnk0M056Y2dURGt4TGpjM0xERXhNeTQxTlRFZ1F6a3hMamMxTWl3eE1UTXVOVFl4SURreExqY3pNaXd4TVRNdU5UWTNJRGt4TGpjeE1pd3hNVE11TlRZM0lFdzVNUzQzTVRJc01URXpMalUyTnlCYUlFMDVNUzQ0TWprc05qSXVOalEzSUV3NU1TNDRNamtzTVRFekxqSTBPQ0JNTVRFNExqa3pOU3c1Tnk0MU9UZ2dUREV5TlM0ek9ESXNOell1TURFMUlFTXhNalV1T0RJM0xEYzBMalV5TlNBeE1qWXVOalkwTERjekxqQTRNU0F4TWpjdU56TTVMRGN4TGprMUlFTXhNamd1T1RFNUxEY3dMamN3T0NBeE16QXVNalUyTERZNUxqazVOaUF4TXpFdU5EQTRMRFk1TGprNU5pQkRNVE15TGpNM055dzJPUzQ1T1RZZ01UTXpMakV6T1N3M01DNDBPVGNnTVRNekxqVTFOQ3czTVM0ME1EY2dUREV6T1M0NU5qRXNPRFV1TkRVNElFd3hOamN1TVRFekxEWTVMamM0TWlCTU1UWTNMakV4TXl3eE9TNHhPREVnVERreExqZ3lPU3cyTWk0Mk5EY2dURGt4TGpneU9TdzJNaTQyTkRjZ1dpSWdhV1E5SWtacGJHd3RNVFFpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRZNExqVTBNeXd4T1M0eU1UTWdUREUyT0M0MU5ETXNOekF1TURneklFd3hOREV1TWpJeExEZzFMamcxTnlCTU1UTTBMamMyTVN3M01TNDJPRGtnUXpFek15NDROVEVzTmprdU5qazBJREV6TVM0ek16TXNOamt1T1RVeElERXlPUzR4TXpjc056SXVNall6SUVNeE1qZ3VNRGd5TERjekxqTTNOQ0F4TWpjdU1qUTBMRGMwTGpneE9TQXhNall1T0RBM0xEYzJMakk0TWlCTU1USXdMak0wTml3NU55NDVNRGtnVERrekxqQXlOU3d4TVRNdU5qZ3pJRXc1TXk0d01qVXNOakl1T0RFeklFd3hOamd1TlRRekxERTVMakl4TXlJZ2FXUTlJa1pwYkd3dE1UVWlJR1pwYkd3OUlpTkdSa1pHUmtZaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5PVE11TURJMUxERXhNeTQ0SUVNNU15NHdNRFVzTVRFekxqZ2dPVEl1T1RnMExERXhNeTQzT1RVZ09USXVPVFkyTERFeE15NDNPRFVnUXpreUxqa3pNU3d4TVRNdU56WTBJRGt5TGprd09Dd3hNVE11TnpJMUlEa3lMamt3T0N3eE1UTXVOamcwSUV3NU1pNDVNRGdzTmpJdU9ERXpJRU01TWk0NU1EZ3NOakl1TnpjeElEa3lMamt6TVN3Mk1pNDNNek1nT1RJdU9UWTJMRFl5TGpjeE1pQk1NVFk0TGpRNE5Dd3hPUzR4TVRJZ1F6RTJPQzQxTWl3eE9TNHdPU0F4TmpndU5UWTFMREU1TGpBNUlERTJPQzQyTURFc01Ua3VNVEV5SUVNeE5qZ3VOak0zTERFNUxqRXpNaUF4TmpndU5qWXNNVGt1TVRjeElERTJPQzQyTml3eE9TNHlNVElnVERFMk9DNDJOaXczTUM0d09ETWdRekUyT0M0Mk5pdzNNQzR4TWpVZ01UWTRMall6Tnl3M01DNHhOalFnTVRZNExqWXdNU3czTUM0eE9EUWdUREUwTVM0eU9DdzROUzQ1TlRnZ1F6RTBNUzR5TlRFc09EVXVPVGMxSURFME1TNHlNVGNzT0RVdU9UYzVJREUwTVM0eE9EWXNPRFV1T1RZNElFTXhOREV1TVRVMExEZzFMamsxT0NBeE5ERXVNVEk1TERnMUxqa3pOaUF4TkRFdU1URTFMRGcxTGprd05pQk1NVE0wTGpZMU5TdzNNUzQzTXpnZ1F6RXpOQzR5T0N3M01DNDVNVFVnTVRNekxqVTVNeXczTUM0ME5qTWdNVE15TGpjeUxEY3dMalEyTXlCRE1UTXhMall6TWl3M01DNDBOak1nTVRNd0xqTTFOeXczTVM0eE5EZ2dNVEk1TGpJeU1TdzNNaTR6TkRRZ1F6RXlPQzR4T0RZc056TXVORE16SURFeU55NHpORGNzTnpRdU9EZ3hJREV5Tmk0NU1Ua3NOell1TXpFMUlFd3hNakF1TkRVNExEazNMamswTXlCRE1USXdMalExTERrM0xqazNNaUF4TWpBdU5ETXhMRGszTGprNU5pQXhNakF1TkRBMUxEazRMakF4SUV3NU15NHdPRE1zTVRFekxqYzROU0JET1RNdU1EWTFMREV4TXk0M09UVWdPVE11TURRMUxERXhNeTQ0SURrekxqQXlOU3d4TVRNdU9DQk1PVE11TURJMUxERXhNeTQ0SUZvZ1RUa3pMakUwTWl3Mk1pNDRPREVnVERrekxqRTBNaXd4TVRNdU5EZ3hJRXd4TWpBdU1qUTRMRGszTGpnek1pQk1NVEkyTGpZNU5TdzNOaTR5TkRnZ1F6RXlOeTR4TkN3M05DNDNOVGdnTVRJM0xqazNOeXczTXk0ek1UVWdNVEk1TGpBMU1pdzNNaTR4T0RNZ1F6RXpNQzR5TXpFc056QXVPVFF5SURFek1TNDFOamdzTnpBdU1qSTVJREV6TWk0M01pdzNNQzR5TWprZ1F6RXpNeTQyT0Rrc056QXVNakk1SURFek5DNDBOVElzTnpBdU56TXhJREV6TkM0NE5qY3NOekV1TmpReElFd3hOREV1TWpjMExEZzFMalk1TWlCTU1UWTRMalF5Tml3M01DNHdNVFlnVERFMk9DNDBNallzTVRrdU5ERTFJRXc1TXk0eE5ESXNOakl1T0RneElFdzVNeTR4TkRJc05qSXVPRGd4SUZvaUlHbGtQU0pHYVd4c0xURTJJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEUyT1M0NExEY3dMakE0TXlCTU1UUXlMalEzT0N3NE5TNDROVGNnVERFek5pNHdNVGdzTnpFdU5qZzVJRU14TXpVdU1UQTRMRFk1TGpZNU5DQXhNekl1TlRrc05qa3VPVFV4SURFek1DNHpPVE1zTnpJdU1qWXpJRU14TWprdU16TTVMRGN6TGpNM05DQXhNamd1TlN3M05DNDRNVGtnTVRJNExqQTJOQ3czTmk0eU9ESWdUREV5TVM0Mk1ETXNPVGN1T1RBNUlFdzVOQzR5T0RJc01URXpMalk0TXlCTU9UUXVNamd5TERZeUxqZ3hNeUJNTVRZNUxqZ3NNVGt1TWpFeklFd3hOamt1T0N3M01DNHdPRE1nV2lJZ2FXUTlJa1pwYkd3dE1UY2lJR1pwYkd3OUlpTkdRVVpCUmtFaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5PVFF1TWpneUxERXhNeTQ1TVRjZ1F6azBMakkwTVN3eE1UTXVPVEUzSURrMExqSXdNU3d4TVRNdU9UQTNJRGswTGpFMk5Td3hNVE11T0RnMklFTTVOQzR3T1RNc01URXpMamcwTlNBNU5DNHdORGdzTVRFekxqYzJOeUE1TkM0d05EZ3NNVEV6TGpZNE5DQk1PVFF1TURRNExEWXlMamd4TXlCRE9UUXVNRFE0TERZeUxqY3pJRGswTGpBNU15dzJNaTQyTlRJZ09UUXVNVFkxTERZeUxqWXhNU0JNTVRZNUxqWTRNeXd4T1M0d01TQkRNVFk1TGpjMU5Td3hPQzQ1TmprZ01UWTVMamcwTkN3eE9DNDVOamtnTVRZNUxqa3hOeXd4T1M0d01TQkRNVFk1TGprNE9Td3hPUzR3TlRJZ01UY3dMakF6TXl3eE9TNHhNamtnTVRjd0xqQXpNeXd4T1M0eU1USWdUREUzTUM0d016TXNOekF1TURneklFTXhOekF1TURNekxEY3dMakUyTmlBeE5qa3VPVGc1TERjd0xqSTBOQ0F4TmprdU9URTNMRGN3TGpJNE5TQk1NVFF5TGpVNU5TdzROaTR3TmlCRE1UUXlMalV6T0N3NE5pNHdPVElnTVRReUxqUTJPU3c0Tmk0eElERTBNaTQwTURjc09EWXVNRGdnUXpFME1pNHpORFFzT0RZdU1EWWdNVFF5TGpJNU15dzROaTR3TVRRZ01UUXlMakkyTml3NE5TNDVOVFFnVERFek5TNDRNRFVzTnpFdU56ZzJJRU14TXpVdU5EUTFMRGN3TGprNU55QXhNelF1T0RFekxEY3dMalU0SURFek15NDVOemNzTnpBdU5UZ2dRekV6TWk0NU1qRXNOekF1TlRnZ01UTXhMalkzTml3M01TNHlOVElnTVRNd0xqVTJNaXczTWk0ME1qUWdRekV5T1M0MU5DdzNNeTQxTURFZ01USTRMamN4TVN3M05DNDVNekVnTVRJNExqSTROeXczTmk0ek5EZ2dUREV5TVM0NE1qY3NPVGN1T1RjMklFTXhNakV1T0RFc09UZ3VNRE0wSURFeU1TNDNOekVzT1RndU1EZ3lJREV5TVM0M01pdzVPQzR4TVRJZ1REazBMak01T0N3eE1UTXVPRGcySUVNNU5DNHpOaklzTVRFekxqa3dOeUE1TkM0ek1qSXNNVEV6TGpreE55QTVOQzR5T0RJc01URXpMamt4TnlCTU9UUXVNamd5TERFeE15NDVNVGNnV2lCTk9UUXVOVEUxTERZeUxqazBPQ0JNT1RRdU5URTFMREV4TXk0eU56a2dUREV5TVM0ME1EWXNPVGN1TnpVMElFd3hNamN1T0RRc056WXVNakUxSUVNeE1qZ3VNamtzTnpRdU56QTRJREV5T1M0eE16Y3NOek11TWpRM0lERXpNQzR5TWpRc056SXVNVEF6SUVNeE16RXVOREkxTERjd0xqZ3pPQ0F4TXpJdU56a3pMRGN3TGpFeE1pQXhNek11T1RjM0xEY3dMakV4TWlCRE1UTTBMams1TlN3M01DNHhNVElnTVRNMUxqYzVOU3czTUM0Mk16Z2dNVE0yTGpJekxEY3hMalU1TWlCTU1UUXlMalU0TkN3NE5TNDFNallnVERFMk9TNDFOallzTmprdU9UUTRJRXd4TmprdU5UWTJMREU1TGpZeE55Qk1PVFF1TlRFMUxEWXlMamswT0NCTU9UUXVOVEUxTERZeUxqazBPQ0JhSWlCcFpEMGlSbWxzYkMweE9DSWdabWxzYkQwaUl6WXdOMFE0UWlJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMHhNRGt1T0RrMExEa3lMamswTXlCTU1UQTVMamc1TkN3NU1pNDVORE1nUXpFd09DNHhNaXc1TWk0NU5ETWdNVEEyTGpZMU15dzVNaTR5TVRnZ01UQTFMalkxTERrd0xqZ3lNeUJETVRBMUxqVTRNeXc1TUM0M016RWdNVEExTGpVNU15dzVNQzQyTVNBeE1EVXVOamN6TERrd0xqVXlPU0JETVRBMUxqYzFNeXc1TUM0ME5EZ2dNVEExTGpnNExEa3dMalEwSURFd05TNDVOelFzT1RBdU5UQTJJRU14TURZdU56VTBMRGt4TGpBMU15QXhNRGN1TmpjNUxEa3hMak16TXlBeE1EZ3VOekkwTERreExqTXpNeUJETVRFd0xqQTBOeXc1TVM0ek16TWdNVEV4TGpRM09DdzVNQzQ0T1RRZ01URXlMams0TERrd0xqQXlOeUJETVRFNExqSTVNU3c0Tmk0NU5pQXhNakl1TmpFeExEYzVMalV3T1NBeE1qSXVOakV4TERjekxqUXhOaUJETVRJeUxqWXhNU3czTVM0ME9Ea2dNVEl5TGpFMk9TdzJPUzQ0TlRZZ01USXhMak16TXl3Mk9DNDJPVElnUXpFeU1TNHlOallzTmpndU5pQXhNakV1TWpjMkxEWTRMalEzTXlBeE1qRXVNelUyTERZNExqTTVNaUJETVRJeExqUXpOaXcyT0M0ek1URWdNVEl4TGpVMk15dzJPQzR5T1RrZ01USXhMalkxTml3Mk9DNHpOalVnUXpFeU15NHpNamNzTmprdU5UTTNJREV5TkM0eU5EY3NOekV1TnpRMklERXlOQzR5TkRjc056UXVOVGcwSUVNeE1qUXVNalEzTERnd0xqZ3lOaUF4TVRrdU9ESXhMRGc0TGpRME55QXhNVFF1TXpneUxEa3hMalU0TnlCRE1URXlMamd3T0N3NU1pNDBPVFVnTVRFeExqSTVPQ3c1TWk0NU5ETWdNVEE1TGpnNU5DdzVNaTQ1TkRNZ1RERXdPUzQ0T1RRc09USXVPVFF6SUZvZ1RURXdOaTQ1TWpVc09URXVOREF4SUVNeE1EY3VOek00TERreUxqQTFNaUF4TURndU56UTFMRGt5TGpJM09DQXhNRGt1T0RrekxEa3lMakkzT0NCTU1UQTVMamc1TkN3NU1pNHlOemdnUXpFeE1TNHlNVFVzT1RJdU1qYzRJREV4TWk0Mk5EY3NPVEV1T1RVeElERXhOQzR4TkRnc09URXVNRGcwSUVNeE1Ua3VORFU1TERnNExqQXhOeUF4TWpNdU56Z3NPREF1TmpJeElERXlNeTQzT0N3M05DNDFNamdnUXpFeU15NDNPQ3czTWk0MU5Ea2dNVEl6TGpNeE55dzNNQzQ1TWprZ01USXlMalExTkN3Mk9TNDNOamNnUXpFeU1pNDROalVzTnpBdU9EQXlJREV5TXk0d056a3NOekl1TURReUlERXlNeTR3Tnprc056TXVOREF5SUVNeE1qTXVNRGM1TERjNUxqWTBOU0F4TVRndU5qVXpMRGczTGpJNE5TQXhNVE11TWpFMExEa3dMalF5TlNCRE1URXhMalkwTERreExqTXpOQ0F4TVRBdU1UTXNPVEV1TnpReUlERXdPQzQzTWpRc09URXVOelF5SUVNeE1EZ3VNRGd6TERreExqYzBNaUF4TURjdU5EZ3hMRGt4TGpVNU15QXhNRFl1T1RJMUxEa3hMalF3TVNCTU1UQTJMamt5TlN3NU1TNDBNREVnV2lJZ2FXUTlJa1pwYkd3dE1Ua2lJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVEV6TGpBNU55dzVNQzR5TXlCRE1URTRMalE0TVN3NE55NHhNaklnTVRJeUxqZzBOU3czT1M0MU9UUWdNVEl5TGpnME5TdzNNeTQwTVRZZ1F6RXlNaTQ0TkRVc056RXVNelkxSURFeU1pNHpOaklzTmprdU56STBJREV5TVM0MU1qSXNOamd1TlRVMklFTXhNVGt1TnpNNExEWTNMak13TkNBeE1UY3VNVFE0TERZM0xqTTJNaUF4TVRRdU1qWTFMRFk1TGpBeU5pQkRNVEE0TGpnNE1TdzNNaTR4TXpRZ01UQTBMalV4Tnl3M09TNDJOaklnTVRBMExqVXhOeXc0TlM0NE5DQkRNVEEwTGpVeE55dzROeTQ0T1RFZ01UQTFMRGc1TGpVek1pQXhNRFV1T0RRc09UQXVOeUJETVRBM0xqWXlOQ3c1TVM0NU5USWdNVEV3TGpJeE5DdzVNUzQ0T1RRZ01URXpMakE1Tnl3NU1DNHlNeUlnYVdROUlrWnBiR3d0TWpBaUlHWnBiR3c5SWlOR1FVWkJSa0VpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1UQTRMamN5TkN3NU1TNDJNVFFnVERFd09DNDNNalFzT1RFdU5qRTBJRU14TURjdU5UZ3lMRGt4TGpZeE5DQXhNRFl1TlRZMkxEa3hMalF3TVNBeE1EVXVOekExTERrd0xqYzVOeUJETVRBMUxqWTROQ3c1TUM0M09ETWdNVEExTGpZMk5TdzVNQzQ0TVRFZ01UQTFMalkxTERrd0xqYzVJRU14TURRdU56VTJMRGc1TGpVME5pQXhNRFF1TWpnekxEZzNMamcwTWlBeE1EUXVNamd6TERnMUxqZ3hOeUJETVRBMExqSTRNeXczT1M0MU56VWdNVEE0TGpjd09TdzNNUzQ1TlRNZ01URTBMakUwT0N3Mk9DNDRNVElnUXpFeE5TNDNNaklzTmpjdU9UQTBJREV4Tnk0eU16SXNOamN1TkRRNUlERXhPQzQyTXpnc05qY3VORFE1SUVNeE1Ua3VOemdzTmpjdU5EUTVJREV5TUM0M09UWXNOamN1TnpVNElERXlNUzQyTlRZc05qZ3VNell5SUVNeE1qRXVOamM0TERZNExqTTNOeUF4TWpFdU5qazNMRFk0TGpNNU55QXhNakV1TnpFeUxEWTRMalF4T0NCRE1USXlMall3Tml3Mk9TNDJOaklnTVRJekxqQTNPU3czTVM0ek9TQXhNak11TURjNUxEY3pMalF4TlNCRE1USXpMakEzT1N3M09TNDJOVGdnTVRFNExqWTFNeXc0Tnk0eE9UZ2dNVEV6TGpJeE5DdzVNQzR6TXpnZ1F6RXhNUzQyTkN3NU1TNHlORGNnTVRFd0xqRXpMRGt4TGpZeE5DQXhNRGd1TnpJMExEa3hMall4TkNCTU1UQTRMamN5TkN3NU1TNDJNVFFnV2lCTk1UQTJMakF3Tml3NU1DNDFNRFVnUXpFd05pNDNPQ3c1TVM0d016Y2dNVEEzTGpZNU5DdzVNUzR5T0RFZ01UQTRMamN5TkN3NU1TNHlPREVnUXpFeE1DNHdORGNzT1RFdU1qZ3hJREV4TVM0ME56Z3NPVEF1T0RZNElERXhNaTQ1T0N3NU1DNHdNREVnUXpFeE9DNHlPVEVzT0RZdU9UTTFJREV5TWk0Mk1URXNOemt1TkRrMklERXlNaTQyTVRFc056TXVOREF6SUVNeE1qSXVOakV4TERjeExqUTVOQ0F4TWpJdU1UYzNMRFk1TGpnNElERXlNUzR6TlRZc05qZ3VOekU0SUVNeE1qQXVOVGd5TERZNExqRTROU0F4TVRrdU5qWTRMRFkzTGpreE9TQXhNVGd1TmpNNExEWTNMamt4T1NCRE1URTNMak14TlN3Mk55NDVNVGtnTVRFMUxqZzRNeXcyT0M0ek5pQXhNVFF1TXpneUxEWTVMakl5TnlCRE1UQTVMakEzTVN3M01pNHlPVE1nTVRBMExqYzFNU3czT1M0M016TWdNVEEwTGpjMU1TdzROUzQ0TWpZZ1F6RXdOQzQzTlRFc09EY3VOek0xSURFd05TNHhPRFVzT0RrdU16UXpJREV3Tmk0d01EWXNPVEF1TlRBMUlFd3hNRFl1TURBMkxEa3dMalV3TlNCYUlpQnBaRDBpUm1sc2JDMHlNU0lnWm1sc2JEMGlJell3TjBRNFFpSStQQzl3WVhSb1Bnb2dJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJRHh3WVhSb0lHUTlJazB4TkRrdU16RTRMRGN1TWpZeUlFd3hNemt1TXpNMExERTJMakUwSUV3eE5UVXVNakkzTERJM0xqRTNNU0JNTVRZd0xqZ3hOaXd5TVM0d05Ua2dUREUwT1M0ek1UZ3NOeTR5TmpJaUlHbGtQU0pHYVd4c0xUSXlJaUJtYVd4c1BTSWpSa0ZHUVVaQklqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEUyT1M0Mk56WXNNVE11T0RRZ1RERTFPUzQ1TWpnc01Ua3VORFkzSUVNeE5UWXVNamcyTERJeExqVTNJREUxTUM0MExESXhMalU0SURFME5pNDNPREVzTVRrdU5Ea3hJRU14TkRNdU1UWXhMREUzTGpRd01pQXhORE11TVRnc01UUXVNREF6SURFME5pNDRNaklzTVRFdU9TQk1NVFUyTGpNeE55dzJMakk1TWlCTU1UUTVMalU0T0N3eUxqUXdOeUJNTmpjdU56VXlMRFE1TGpRM09DQk1NVEV6TGpZM05TdzNOUzQ1T1RJZ1RERXhOaTQzTlRZc056UXVNakV6SUVNeE1UY3VNemczTERjekxqZzBPQ0F4TVRjdU5qSTFMRGN6TGpNeE5TQXhNVGN1TXpjMExEY3lMamd5TXlCRE1URTFMakF4Tnl3Mk9DNHhPVEVnTVRFMExqYzRNU3cyTXk0eU56Y2dNVEUyTGpZNU1TdzFPQzQxTmpFZ1F6RXlNaTR6TWprc05EUXVOalF4SURFME1TNHlMRE16TGpjME5pQXhOalV1TXpBNUxETXdMalE1TVNCRE1UY3pMalEzT0N3eU9TNHpPRGdnTVRneExqazRPU3d5T1M0MU1qUWdNVGt3TGpBeE15d3pNQzQ0T0RVZ1F6RTVNQzQ0TmpVc016RXVNRE1nTVRreExqYzRPU3d6TUM0NE9UTWdNVGt5TGpReUxETXdMalV5T0NCTU1UazFMalV3TVN3eU9DNDNOU0JNTVRZNUxqWTNOaXd4TXk0NE5DSWdhV1E5SWtacGJHd3RNak1pSUdacGJHdzlJaU5HUVVaQlJrRWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRFekxqWTNOU3czTmk0ME5Ua2dRekV4TXk0MU9UUXNOell1TkRVNUlERXhNeTQxTVRRc056WXVORE00SURFeE15NDBORElzTnpZdU16azNJRXcyTnk0MU1UZ3NORGt1T0RneUlFTTJOeTR6TnpRc05Ea3VOems1SURZM0xqSTROQ3cwT1M0Mk5EVWdOamN1TWpnMUxEUTVMalEzT0NCRE5qY3VNamcxTERRNUxqTXhNU0EyTnk0ek56UXNORGt1TVRVM0lEWTNMalV4T1N3ME9TNHdOek1nVERFME9TNHpOVFVzTWk0d01ESWdRekUwT1M0ME9Ua3NNUzQ1TVRrZ01UUTVMalkzTnl3eExqa3hPU0F4TkRrdU9ESXhMREl1TURBeUlFd3hOVFl1TlRVc05TNDRPRGNnUXpFMU5pNDNOelFzTmk0d01UY2dNVFUyTGpnMUxEWXVNekF5SURFMU5pNDNNaklzTmk0MU1qWWdRekUxTmk0MU9USXNOaTQzTkRrZ01UVTJMak13Tnl3MkxqZ3lOaUF4TlRZdU1EZ3pMRFl1TmprMklFd3hORGt1TlRnM0xESXVPVFEySUV3Mk9DNDJPRGNzTkRrdU5EYzVJRXd4TVRNdU5qYzFMRGMxTGpRMU1pQk1NVEUyTGpVeU15dzNNeTQ0TURnZ1F6RXhOaTQzTVRVc056TXVOamszSURFeE55NHhORE1zTnpNdU16azVJREV4Tmk0NU5UZ3NOek11TURNMUlFTXhNVFF1TlRReUxEWTRMakk0TnlBeE1UUXVNeXcyTXk0eU1qRWdNVEUyTGpJMU9DdzFPQzR6T0RVZ1F6RXhPUzR3TmpRc05URXVORFU0SURFeU5TNHhORE1zTkRVdU1UUXpJREV6TXk0NE5DdzBNQzR4TWpJZ1F6RTBNaTQwT1Rjc016VXVNVEkwSURFMU15NHpOVGdzTXpFdU5qTXpJREUyTlM0eU5EY3NNekF1TURJNElFTXhOek11TkRRMUxESTRMamt5TVNBeE9ESXVNRE0zTERJNUxqQTFPQ0F4T1RBdU1Ea3hMRE13TGpReU5TQkRNVGt3TGpnekxETXdMalUxSURFNU1TNDJOVElzTXpBdU5ETXlJREU1TWk0eE9EWXNNekF1TVRJMElFd3hPVFF1TlRZM0xESTRMamMxSUV3eE5qa3VORFF5TERFMExqSTBOQ0JETVRZNUxqSXhPU3d4TkM0eE1UVWdNVFk1TGpFME1pd3hNeTQ0TWprZ01UWTVMakkzTVN3eE15NDJNRFlnUXpFMk9TNDBMREV6TGpNNE1pQXhOamt1TmpnMUxERXpMak13TmlBeE5qa3VPVEE1TERFekxqUXpOU0JNTVRrMUxqY3pOQ3d5T0M0ek5EVWdRekU1TlM0NE56a3NNamd1TkRJNElERTVOUzQ1Tmpnc01qZ3VOVGd6SURFNU5TNDVOamdzTWpndU56VWdRekU1TlM0NU5qZ3NNamd1T1RFMklERTVOUzQ0Tnprc01qa3VNRGN4SURFNU5TNDNNelFzTWprdU1UVTBJRXd4T1RJdU5qVXpMRE13TGprek15QkRNVGt4TGprek1pd3pNUzR6TlNBeE9UQXVPRGtzTXpFdU5UQTRJREU0T1M0NU16VXNNekV1TXpRMklFTXhPREV1T1RjeUxESTVMams1TlNBeE56TXVORGM0TERJNUxqZzJJREUyTlM0ek56SXNNekF1T1RVMElFTXhOVE11TmpBeUxETXlMalUwTXlBeE5ESXVPRFlzTXpVdU9Ua3pJREV6TkM0ek1EY3NOREF1T1RNeElFTXhNalV1TnprekxEUTFMamcwTnlBeE1Ua3VPRFV4TERVeUxqQXdOQ0F4TVRjdU1USTBMRFU0TGpjek5pQkRNVEUxTGpJM0xEWXpMak14TkNBeE1UVXVOVEF4TERZNExqRXhNaUF4TVRjdU56a3NOekl1TmpFeElFTXhNVGd1TVRZc056TXVNek0ySURFeE55NDRORFVzTnpRdU1USTBJREV4Tmk0NU9TdzNOQzQyTVRjZ1RERXhNeTQ1TURrc056WXVNemszSUVNeE1UTXVPRE0yTERjMkxqUXpPQ0F4TVRNdU56VTJMRGMyTGpRMU9TQXhNVE11TmpjMUxEYzJMalExT1NJZ2FXUTlJa1pwYkd3dE1qUWlJR1pwYkd3OUlpTTBOVFZCTmpRaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVFV6TGpNeE5pd3lNUzR5TnprZ1F6RTFNQzQ1TURNc01qRXVNamM1SURFME9DNDBPVFVzTWpBdU56VXhJREUwTmk0Mk5qUXNNVGt1TmpreklFTXhORFF1T0RRMkxERTRMalkwTkNBeE5ETXVPRFEwTERFM0xqSXpNaUF4TkRNdU9EUTBMREUxTGpjeE9DQkRNVFF6TGpnME5Dd3hOQzR4T1RFZ01UUTBMamcyTERFeUxqYzJNeUF4TkRZdU56QTFMREV4TGpZNU9DQk1NVFUyTGpFNU9DdzJMakE1TVNCRE1UVTJMak13T1N3MkxqQXlOU0F4TlRZdU5EVXlMRFl1TURZeUlERTFOaTQxTVRnc05pNHhOek1nUXpFMU5pNDFPRE1zTmk0eU9EUWdNVFUyTGpVME55dzJMalF5TnlBeE5UWXVORE0yTERZdU5Ea3pJRXd4TkRZdU9UUXNNVEl1TVRBeUlFTXhORFV1TWpRMExERXpMakE0TVNBeE5EUXVNekV5TERFMExqTTJOU0F4TkRRdU16RXlMREUxTGpjeE9DQkRNVFEwTGpNeE1pd3hOeTR3TlRnZ01UUTFMakl6TERFNExqTXlOaUF4TkRZdU9EazNMREU1TGpJNE9TQkRNVFV3TGpRME5pd3lNUzR6TXpnZ01UVTJMakkwTERJeExqTXlOeUF4TlRrdU9ERXhMREU1TGpJMk5TQk1NVFk1TGpVMU9Td3hNeTQyTXpjZ1F6RTJPUzQyTnl3eE15NDFOek1nTVRZNUxqZ3hNeXd4TXk0Mk1URWdNVFk1TGpnM09Dd3hNeTQzTWpNZ1F6RTJPUzQ1TkRNc01UTXVPRE0wSURFMk9TNDVNRFFzTVRNdU9UYzNJREUyT1M0M09UTXNNVFF1TURReUlFd3hOakF1TURRMUxERTVMalkzSUVNeE5UZ3VNVGczTERJd0xqYzBNaUF4TlRVdU56UTVMREl4TGpJM09TQXhOVE11TXpFMkxESXhMakkzT1NJZ2FXUTlJa1pwYkd3dE1qVWlJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVEV6TGpZM05TdzNOUzQ1T1RJZ1REWTNMamMyTWl3ME9TNDBPRFFpSUdsa1BTSkdhV3hzTFRJMklpQm1hV3hzUFNJak5EVTFRVFkwSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURXhNeTQyTnpVc056WXVNelF5SUVNeE1UTXVOakUxTERjMkxqTTBNaUF4TVRNdU5UVTFMRGMyTGpNeU55QXhNVE11TlN3M05pNHlPVFVnVERZM0xqVTROeXcwT1M0M09EY2dRelkzTGpReE9TdzBPUzQyT1NBMk55NHpOaklzTkRrdU5EYzJJRFkzTGpRMU9TdzBPUzR6TURrZ1F6WTNMalUxTml3ME9TNHhOREVnTmpjdU56Y3NORGt1TURneklEWTNMamt6Tnl3ME9TNHhPQ0JNTVRFekxqZzFMRGMxTGpZNE9DQkRNVEUwTGpBeE9DdzNOUzQzT0RVZ01URTBMakEzTlN3M05pQXhNVE11T1RjNExEYzJMakUyTnlCRE1URXpMamt4TkN3M05pNHlOemtnTVRFekxqYzVOaXczTmk0ek5ESWdNVEV6TGpZM05TdzNOaTR6TkRJaUlHbGtQU0pHYVd4c0xUSTNJaUJtYVd4c1BTSWpORFUxUVRZMElqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVFkzTGpjMk1pdzBPUzQwT0RRZ1REWTNMamMyTWl3eE1ETXVORGcxSUVNMk55NDNOaklzTVRBMExqVTNOU0EyT0M0MU16SXNNVEExTGprd015QTJPUzQwT0RJc01UQTJMalExTWlCTU1URXhMamsxTlN3eE16QXVPVGN6SUVNeE1USXVPVEExTERFek1TNDFNaklnTVRFekxqWTNOU3d4TXpFdU1EZ3pJREV4TXk0Mk56VXNNVEk1TGprNU15Qk1NVEV6TGpZM05TdzNOUzQ1T1RJaUlHbGtQU0pHYVd4c0xUSTRJaUJtYVd4c1BTSWpSa0ZHUVVaQklqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEV4TWk0M01qY3NNVE14TGpVMk1TQkRNVEV5TGpRekxERXpNUzQxTmpFZ01URXlMakV3Tnl3eE16RXVORFkySURFeE1TNDNPQ3d4TXpFdU1qYzJJRXcyT1M0ek1EY3NNVEEyTGpjMU5TQkROamd1TWpRMExERXdOaTR4TkRJZ05qY3VOREV5TERFd05DNDNNRFVnTmpjdU5ERXlMREV3TXk0ME9EVWdURFkzTGpReE1pdzBPUzQwT0RRZ1F6WTNMalF4TWl3ME9TNHlPU0EyTnk0MU5qa3NORGt1TVRNMElEWTNMamMyTWl3ME9TNHhNelFnUXpZM0xqazFOaXcwT1M0eE16UWdOamd1TVRFekxEUTVMakk1SURZNExqRXhNeXcwT1M0ME9EUWdURFk0TGpFeE15d3hNRE11TkRnMUlFTTJPQzR4TVRNc01UQTBMalEwTlNBMk9DNDRNaXd4TURVdU5qWTFJRFk1TGpZMU55d3hNRFl1TVRRNElFd3hNVEl1TVRNc01UTXdMalkzSUVNeE1USXVORGMwTERFek1DNDROamdnTVRFeUxqYzVNU3d4TXpBdU9URXpJREV4TXl3eE16QXVOemt5SUVNeE1UTXVNakEyTERFek1DNDJOek1nTVRFekxqTXlOU3d4TXpBdU16Z3hJREV4TXk0ek1qVXNNVEk1TGprNU15Qk1NVEV6TGpNeU5TdzNOUzQ1T1RJZ1F6RXhNeTR6TWpVc056VXVOems0SURFeE15NDBPRElzTnpVdU5qUXhJREV4TXk0Mk56VXNOelV1TmpReElFTXhNVE11T0RZNUxEYzFMalkwTVNBeE1UUXVNREkxTERjMUxqYzVPQ0F4TVRRdU1ESTFMRGMxTGprNU1pQk1NVEUwTGpBeU5Td3hNamt1T1RreklFTXhNVFF1TURJMUxERXpNQzQyTkRnZ01URXpMamM0Tml3eE16RXVNVFEzSURFeE15NHpOU3d4TXpFdU16azVJRU14TVRNdU1UWXlMREV6TVM0MU1EY2dNVEV5TGprMU1pd3hNekV1TlRZeElERXhNaTQzTWpjc01UTXhMalUyTVNJZ2FXUTlJa1pwYkd3dE1qa2lJR1pwYkd3OUlpTTBOVFZCTmpRaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVEV5TGpnMkxEUXdMalV4TWlCRE1URXlMamcyTERRd0xqVXhNaUF4TVRJdU9EWXNOREF1TlRFeUlERXhNaTQ0TlRrc05EQXVOVEV5SUVNeE1UQXVOVFF4TERRd0xqVXhNaUF4TURndU16WXNNemt1T1RrZ01UQTJMamN4Tnl3ek9TNHdOREVnUXpFd05TNHdNVElzTXpndU1EVTNJREV3TkM0d056UXNNell1TnpJMklERXdOQzR3TnpRc016VXVNamt5SUVNeE1EUXVNRGMwTERNekxqZzBOeUF4TURVdU1ESTJMRE15TGpVd01TQXhNRFl1TnpVMExETXhMalV3TkNCTU1URTRMamM1TlN3eU5DNDFOVEVnUXpFeU1DNDBOak1zTWpNdU5UZzVJREV5TWk0Mk5qa3NNak11TURVNElERXlOUzR3TURjc01qTXVNRFU0SUVNeE1qY3VNekkxTERJekxqQTFPQ0F4TWprdU5UQTJMREl6TGpVNE1TQXhNekV1TVRVc01qUXVOVE1nUXpFek1pNDROVFFzTWpVdU5URTBJREV6TXk0M09UTXNNall1T0RRMUlERXpNeTQzT1RNc01qZ3VNamM0SUVNeE16TXVOemt6TERJNUxqY3lOQ0F4TXpJdU9EUXhMRE14TGpBMk9TQXhNekV1TVRFekxETXlMakEyTnlCTU1URTVMakEzTVN3ek9TNHdNVGtnUXpFeE55NDBNRE1zTXprdU9UZ3lJREV4TlM0eE9UY3NOREF1TlRFeUlERXhNaTQ0Tml3ME1DNDFNVElnVERFeE1pNDROaXcwTUM0MU1USWdXaUJOTVRJMUxqQXdOeXd5TXk0M05Ua2dRekV5TWk0M09Td3lNeTQzTlRrZ01USXdMamN3T1N3eU5DNHlOVFlnTVRFNUxqRTBOaXd5TlM0eE5UZ2dUREV3Tnk0eE1EUXNNekl1TVRFZ1F6RXdOUzQyTURJc016SXVPVGM0SURFd05DNDNOelFzTXpRdU1UQTRJREV3TkM0M056UXNNelV1TWpreUlFTXhNRFF1TnpjMExETTJMalEyTlNBeE1EVXVOVGc1TERNM0xqVTRNU0F4TURjdU1EWTNMRE00TGpRek5DQkRNVEE0TGpZd05Td3pPUzR6TWpNZ01URXdMalkyTXl3ek9TNDRNVElnTVRFeUxqZzFPU3d6T1M0NE1USWdUREV4TWk0NE5pd3pPUzQ0TVRJZ1F6RXhOUzR3TnpZc016a3VPREV5SURFeE55NHhOVGdzTXprdU16RTFJREV4T0M0M01qRXNNemd1TkRFeklFd3hNekF1TnpZeUxETXhMalEySUVNeE16SXVNalkwTERNd0xqVTVNeUF4TXpNdU1Ea3lMREk1TGpRMk15QXhNek11TURreUxESTRMakkzT0NCRE1UTXpMakE1TWl3eU55NHhNRFlnTVRNeUxqSTNPQ3d5TlM0NU9TQXhNekF1T0N3eU5TNHhNellnUXpFeU9TNHlOakVzTWpRdU1qUTRJREV5Tnk0eU1EUXNNak11TnpVNUlERXlOUzR3TURjc01qTXVOelU1SUV3eE1qVXVNREEzTERJekxqYzFPU0JhSWlCcFpEMGlSbWxzYkMwek1DSWdabWxzYkQwaUl6WXdOMFE0UWlJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMHhOalV1TmpNc01UWXVNakU1SUV3eE5Ua3VPRGsyTERFNUxqVXpJRU14TlRZdU56STVMREl4TGpNMU9DQXhOVEV1TmpFc01qRXVNelkzSURFME9DNDBOak1zTVRrdU5UVWdRekUwTlM0ek1UWXNNVGN1TnpNeklERTBOUzR6TXpJc01UUXVOemM0SURFME9DNDBPVGtzTVRJdU9UUTVJRXd4TlRRdU1qTXpMRGt1TmpNNUlFd3hOalV1TmpNc01UWXVNakU1SWlCcFpEMGlSbWxzYkMwek1TSWdabWxzYkQwaUkwWkJSa0ZHUVNJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMHhOVFF1TWpNekxERXdMalEwT0NCTU1UWTBMakl5T0N3eE5pNHlNVGtnVERFMU9TNDFORFlzTVRndU9USXpJRU14TlRndU1URXlMREU1TGpjMUlERTFOaTR4T1RRc01qQXVNakEySURFMU5DNHhORGNzTWpBdU1qQTJJRU14TlRJdU1URTRMREl3TGpJd05pQXhOVEF1TWpJMExERTVMamMxTnlBeE5EZ3VPREUwTERFNExqazBNeUJETVRRM0xqVXlOQ3d4T0M0eE9Ua2dNVFEyTGpneE5Dd3hOeTR5TkRrZ01UUTJMamd4TkN3eE5pNHlOamtnUXpFME5pNDRNVFFzTVRVdU1qYzRJREUwTnk0MU16Y3NNVFF1TXpFMElERTBPQzQ0TlN3eE15NDFOVFlnVERFMU5DNHlNek1zTVRBdU5EUTRJRTB4TlRRdU1qTXpMRGt1TmpNNUlFd3hORGd1TkRrNUxERXlMamswT1NCRE1UUTFMak16TWl3eE5DNDNOemdnTVRRMUxqTXhOaXd4Tnk0M016TWdNVFE0TGpRMk15d3hPUzQxTlNCRE1UVXdMakF6TVN3eU1DNDBOVFVnTVRVeUxqQTROaXd5TUM0NU1EY2dNVFUwTGpFME55d3lNQzQ1TURjZ1F6RTFOaTR5TWpRc01qQXVPVEEzSURFMU9DNHpNRFlzTWpBdU5EUTNJREUxT1M0NE9UWXNNVGt1TlRNZ1RERTJOUzQyTXl3eE5pNHlNVGtnVERFMU5DNHlNek1zT1M0Mk16a2lJR2xrUFNKR2FXeHNMVE15SWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFME5TNDBORFVzTnpJdU5qWTNJRXd4TkRVdU5EUTFMRGN5TGpZMk55QkRNVFF6TGpZM01pdzNNaTQyTmpjZ01UUXlMakl3TkN3M01TNDRNVGNnTVRReExqSXdNaXczTUM0ME1qSWdRekUwTVM0eE16VXNOekF1TXpNZ01UUXhMakUwTlN3M01DNHhORGNnTVRReExqSXlOU3czTUM0d05qWWdRekUwTVM0ek1EVXNOamt1T1RnMUlERTBNUzQwTXpJc05qa3VPVFEySURFME1TNDFNalVzTnpBdU1ERXhJRU14TkRJdU16QTJMRGN3TGpVMU9TQXhORE11TWpNeExEY3dMamd5TXlBeE5EUXVNamMyTERjd0xqZ3lNaUJETVRRMUxqVTVPQ3czTUM0NE1qSWdNVFEzTGpBekxEY3dMak0zTmlBeE5EZ3VOVE15TERZNUxqVXdPU0JETVRVekxqZzBNaXcyTmk0ME5ETWdNVFU0TGpFMk15dzFPQzQ1T0RjZ01UVTRMakUyTXl3MU1pNDRPVFFnUXpFMU9DNHhOak1zTlRBdU9UWTNJREUxTnk0M01qRXNORGt1TXpNeUlERTFOaTQ0T0RRc05EZ3VNVFk0SUVNeE5UWXVPREU0TERRNExqQTNOaUF4TlRZdU9ESTRMRFEzTGprME9DQXhOVFl1T1RBNExEUTNMamcyTnlCRE1UVTJMams0T0N3ME55NDNPRFlnTVRVM0xqRXhOQ3cwTnk0M056UWdNVFUzTGpJd09DdzBOeTQ0TkNCRE1UVTRMamczT0N3ME9TNHdNVElnTVRVNUxqYzVPQ3cxTVM0eU1pQXhOVGt1TnprNExEVTBMakExT1NCRE1UVTVMamM1T0N3Mk1DNHpNREVnTVRVMUxqTTNNeXcyT0M0d05EWWdNVFE1TGprek15dzNNUzR4T0RZZ1F6RTBPQzR6Tml3M01pNHdPVFFnTVRRMkxqZzFMRGN5TGpZMk55QXhORFV1TkRRMUxEY3lMalkyTnlCTU1UUTFMalEwTlN3M01pNDJOamNnV2lCTk1UUXlMalEzTml3M01TQkRNVFF6TGpJNUxEY3hMalkxTVNBeE5EUXVNamsyTERjeUxqQXdNaUF4TkRVdU5EUTFMRGN5TGpBd01pQkRNVFEyTGpjMk55dzNNaTR3TURJZ01UUTRMakU1T0N3M01TNDFOU0F4TkRrdU55dzNNQzQyT0RJZ1F6RTFOUzR3TVN3Mk55NDJNVGNnTVRVNUxqTXpNU3cyTUM0eE5Ua2dNVFU1TGpNek1TdzFOQzR3TmpVZ1F6RTFPUzR6TXpFc05USXVNRGcxSURFMU9DNDROamdzTlRBdU5ETTFJREUxT0M0d01EWXNORGt1TWpjeUlFTXhOVGd1TkRFM0xEVXdMak13TnlBeE5UZ3VOak1zTlRFdU5UTXlJREUxT0M0Mk15dzFNaTQ0T1RJZ1F6RTFPQzQyTXl3MU9TNHhNelFnTVRVMExqSXdOU3cyTmk0M05qY2dNVFE0TGpjMk5TdzJPUzQ1TURjZ1F6RTBOeTR4T1RJc056QXVPREUySURFME5TNDJPREVzTnpFdU1qZ3pJREUwTkM0eU56WXNOekV1TWpneklFTXhORE11TmpNMExEY3hMakk0TXlBeE5ETXVNRE16TERjeExqRTVNaUF4TkRJdU5EYzJMRGN4SUV3eE5ESXVORGMyTERjeElGb2lJR2xrUFNKR2FXeHNMVE16SWlCbWFXeHNQU0lqTmpBM1JEaENJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRFME9DNDJORGdzTmprdU56QTBJRU14TlRRdU1ETXlMRFkyTGpVNU5pQXhOVGd1TXprMkxEVTVMakEyT0NBeE5UZ3VNemsyTERVeUxqZzVNU0JETVRVNExqTTVOaXcxTUM0NE16a2dNVFUzTGpreE15dzBPUzR4T1RnZ01UVTNMakEzTkN3ME9DNHdNeUJETVRVMUxqSTRPU3cwTmk0M056Z2dNVFV5TGpZNU9TdzBOaTQ0TXpZZ01UUTVMamd4Tml3ME9DNDFNREVnUXpFME5DNDBNek1zTlRFdU5qQTVJREUwTUM0d05qZ3NOVGt1TVRNM0lERTBNQzR3Tmpnc05qVXVNekUwSUVNeE5EQXVNRFk0TERZM0xqTTJOU0F4TkRBdU5UVXlMRFk1TGpBd05pQXhOREV1TXpreExEY3dMakUzTkNCRE1UUXpMakUzTml3M01TNDBNamNnTVRRMUxqYzJOU3czTVM0ek5qa2dNVFE0TGpZME9DdzJPUzQzTURRaUlHbGtQU0pHYVd4c0xUTTBJaUJtYVd4c1BTSWpSa0ZHUVVaQklqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEUwTkM0eU56WXNOekV1TWpjMklFd3hORFF1TWpjMkxEY3hMakkzTmlCRE1UUXpMakV6TXl3M01TNHlOellnTVRReUxqRXhPQ3czTUM0NU5qa2dNVFF4TGpJMU55dzNNQzR6TmpVZ1F6RTBNUzR5TXpZc056QXVNelV4SURFME1TNHlNVGNzTnpBdU16TXlJREUwTVM0eU1ESXNOekF1TXpFeElFTXhOREF1TXpBM0xEWTVMakEyTnlBeE16a3VPRE0xTERZM0xqTXpPU0F4TXprdU9ETTFMRFkxTGpNeE5DQkRNVE01TGpnek5TdzFPUzR3TnpNZ01UUTBMakkyTERVeExqUXpPU0F4TkRrdU55dzBPQzR5T1RnZ1F6RTFNUzR5TnpNc05EY3VNemtnTVRVeUxqYzROQ3cwTmk0NU1qa2dNVFUwTGpFNE9TdzBOaTQ1TWprZ1F6RTFOUzR6TXpJc05EWXVPVEk1SURFMU5pNHpORGNzTkRjdU1qTTJJREUxTnk0eU1EZ3NORGN1T0RNNUlFTXhOVGN1TWpJNUxEUTNMamcxTkNBeE5UY3VNalE0TERRM0xqZzNNeUF4TlRjdU1qWXpMRFEzTGpnNU5DQkRNVFU0TGpFMU55dzBPUzR4TXpnZ01UVTRMall6TERVd0xqZzJOU0F4TlRndU5qTXNOVEl1T0RreElFTXhOVGd1TmpNc05Ua3VNVE15SURFMU5DNHlNRFVzTmpZdU56WTJJREUwT0M0M05qVXNOamt1T1RBM0lFTXhORGN1TVRreUxEY3dMamd4TlNBeE5EVXVOamd4TERjeExqSTNOaUF4TkRRdU1qYzJMRGN4TGpJM05pQk1NVFEwTGpJM05pdzNNUzR5TnpZZ1dpQk5NVFF4TGpVMU9DdzNNQzR4TURRZ1F6RTBNaTR6TXpFc056QXVOak0zSURFME15NHlORFVzTnpFdU1EQTFJREUwTkM0eU56WXNOekV1TURBMUlFTXhORFV1TlRrNExEY3hMakF3TlNBeE5EY3VNRE1zTnpBdU5EWTNJREUwT0M0MU16SXNOamt1TmlCRE1UVXpMamcwTWl3Mk5pNDFNelFnTVRVNExqRTJNeXcxT1M0d016TWdNVFU0TGpFMk15dzFNaTQ1TXprZ1F6RTFPQzR4TmpNc05URXVNRE14SURFMU55NDNNamtzTkRrdU16ZzFJREUxTmk0NU1EY3NORGd1TWpJeklFTXhOVFl1TVRNekxEUTNMalk1TVNBeE5UVXVNakU1TERRM0xqUXdPU0F4TlRRdU1UZzVMRFEzTGpRd09TQkRNVFV5TGpnMk55dzBOeTQwTURrZ01UVXhMalF6TlN3ME55NDRORElnTVRRNUxqa3pNeXcwT0M0M01Ea2dRekUwTkM0Mk1qTXNOVEV1TnpjMUlERTBNQzR6TURJc05Ua3VNamN6SURFME1DNHpNRElzTmpVdU16WTJJRU14TkRBdU16QXlMRFkzTGpJM05pQXhOREF1TnpNMkxEWTRMamswTWlBeE5ERXVOVFU0TERjd0xqRXdOQ0JNTVRReExqVTFPQ3czTUM0eE1EUWdXaUlnYVdROUlrWnBiR3d0TXpVaUlHWnBiR3c5SWlNMk1EZEVPRUlpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1UVXdMamN5TERZMUxqTTJNU0JNTVRVd0xqTTFOeXcyTlM0d05qWWdRekUxTVM0eE5EY3NOalF1TURreUlERTFNUzQ0Tmprc05qTXVNRFFnTVRVeUxqVXdOU3cyTVM0NU16Z2dRekUxTXk0ek1UTXNOakF1TlRNNUlERTFNeTQ1Tnpnc05Ua3VNRFkzSURFMU5DNDBPRElzTlRjdU5UWXpJRXd4TlRRdU9USTFMRFUzTGpjeE1pQkRNVFUwTGpReE1pdzFPUzR5TkRVZ01UVXpMamN6TXl3Mk1DNDNORFVnTVRVeUxqa3hMRFl5TGpFM01pQkRNVFV5TGpJMk1pdzJNeTR5T1RVZ01UVXhMalV5TlN3Mk5DNHpOamdnTVRVd0xqY3lMRFkxTGpNMk1TSWdhV1E5SWtacGJHd3RNellpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRFMUxqa3hOeXc0TkM0MU1UUWdUREV4TlM0MU5UUXNPRFF1TWpJZ1F6RXhOaTR6TkRRc09ETXVNalExSURFeE55NHdOallzT0RJdU1UazBJREV4Tnk0M01ESXNPREV1TURreUlFTXhNVGd1TlRFc056a3VOamt5SURFeE9TNHhOelVzTnpndU1qSWdNVEU1TGpZM09DdzNOaTQzTVRjZ1RERXlNQzR4TWpFc056WXVPRFkxSUVNeE1Ua3VOakE0TERjNExqTTVPQ0F4TVRndU9UTXNOemt1T0RrNUlERXhPQzR4TURZc09ERXVNekkySUVNeE1UY3VORFU0TERneUxqUTBPQ0F4TVRZdU56SXlMRGd6TGpVeU1TQXhNVFV1T1RFM0xEZzBMalV4TkNJZ2FXUTlJa1pwYkd3dE16Y2lJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVEUwTERFek1DNDBOellnVERFeE5Dd3hNekF1TURBNElFd3hNVFFzTnpZdU1EVXlJRXd4TVRRc056VXVOVGcwSUV3eE1UUXNOell1TURVeUlFd3hNVFFzTVRNd0xqQXdPQ0JNTVRFMExERXpNQzQwTnpZaUlHbGtQU0pHYVd4c0xUTTRJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOEwyYytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThaeUJwWkQwaVNXMXdiM0owWldRdFRHRjVaWEp6TFVOdmNIa2lJSFJ5WVc1elptOXliVDBpZEhKaGJuTnNZWFJsS0RZeUxqQXdNREF3TUN3Z01DNHdNREF3TURBcElpQnphMlYwWTJnNmRIbHdaVDBpVFZOVGFHRndaVWR5YjNWd0lqNEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRrdU9ESXlMRE0zTGpRM05DQkRNVGt1T0RNNUxETTNMak16T1NBeE9TNDNORGNzTXpjdU1UazBJREU1TGpVMU5Td3pOeTR3T0RJZ1F6RTVMakl5T0N3ek5pNDRPVFFnTVRndU56STVMRE0yTGpnM01pQXhPQzQwTkRZc016Y3VNRE0zSUV3eE1pNDBNelFzTkRBdU5UQTRJRU14TWk0ek1ETXNOREF1TlRnMElERXlMakkwTERRd0xqWTROaUF4TWk0eU5ETXNOREF1TnpreklFTXhNaTR5TkRVc05EQXVPVEkxSURFeUxqSTBOU3cwTVM0eU5UUWdNVEl1TWpRMUxEUXhMak0zTVNCTU1USXVNalExTERReExqUXhOQ0JNTVRJdU1qTTRMRFF4TGpVME1pQkRPQzR4TkRnc05ETXVPRGczSURVdU5qUTNMRFExTGpNeU1TQTFMalkwTnl3ME5TNHpNakVnUXpVdU5qUTJMRFExTGpNeU1TQXpMalUzTERRMkxqTTJOeUF5TGpnMkxEVXdMalV4TXlCRE1pNDROaXcxTUM0MU1UTWdNUzQ1TkRnc05UY3VORGMwSURFdU9UWXlMRGN3TGpJMU9DQkRNUzQ1Tnpjc09ESXVPREk0SURJdU5UWTRMRGczTGpNeU9DQXpMakV5T1N3NU1TNDJNRGtnUXpNdU16UTVMRGt6TGpJNU15QTJMakV6TERrekxqY3pOQ0EyTGpFekxEa3pMamN6TkNCRE5pNDBOakVzT1RNdU56YzBJRFl1T0RJNExEa3pMamN3TnlBM0xqSXhMRGt6TGpRNE5pQk1PREl1TkRnekxEUTVMamt6TlNCRE9EUXVNamt4TERRNExqZzJOaUE0TlM0eE5TdzBOaTR5TVRZZ09EVXVOVE01TERRekxqWTFNU0JET0RZdU56VXlMRE0xTGpZMk1TQTROeTR5TVRRc01UQXVOamN6SURnMUxqSTJOQ3d6TGpjM015QkRPRFV1TURZNExETXVNRGdnT0RRdU56VTBMREl1TmprZ09EUXVNemsyTERJdU5Ea3hJRXc0TWk0ek1Td3hMamN3TVNCRE9ERXVOVGd6TERFdU56STVJRGd3TGpnNU5Dd3lMakUyT0NBNE1DNDNOellzTWk0eU16WWdRemd3TGpZek5pd3lMak14TnlBME1TNDRNRGNzTWpRdU5UZzFJREl3TGpBek1pd3pOeTR3TnpJZ1RERTVMamd5TWl3ek55NDBOelFpSUdsa1BTSkdhV3hzTFRFaUlHWnBiR3c5SWlOR1JrWkdSa1lpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk9ESXVNekV4TERFdU56QXhJRXc0TkM0ek9UWXNNaTQwT1RFZ1F6ZzBMamMxTkN3eUxqWTVJRGcxTGpBMk9Dd3pMakE0SURnMUxqSTJOQ3d6TGpjM015QkRPRGN1TWpFekxERXdMalkzTXlBNE5pNDNOVEVzTXpVdU5qWWdPRFV1TlRNNUxEUXpMalkxTVNCRE9EVXVNVFE1TERRMkxqSXhOaUE0TkM0eU9TdzBPQzQ0TmpZZ09ESXVORGd6TERRNUxqa3pOU0JNTnk0eU1TdzVNeTQwT0RZZ1F6WXVPRGszTERrekxqWTJOeUEyTGpVNU5TdzVNeTQzTkRRZ05pNHpNVFFzT1RNdU56UTBJRXcyTGpFek1TdzVNeTQzTXpNZ1F6WXVNVE14TERrekxqY3pOQ0F6TGpNME9TdzVNeTR5T1RNZ015NHhNamdzT1RFdU5qQTVJRU15TGpVMk9DdzROeTR6TWpjZ01TNDVOemNzT0RJdU9ESTRJREV1T1RZekxEY3dMakkxT0NCRE1TNDVORGdzTlRjdU5EYzBJREl1T0RZc05UQXVOVEV6SURJdU9EWXNOVEF1TlRFeklFTXpMalUzTERRMkxqTTJOeUExTGpZME55dzBOUzR6TWpFZ05TNDJORGNzTkRVdU16SXhJRU0xTGpZME55dzBOUzR6TWpFZ09DNHhORGdzTkRNdU9EZzNJREV5TGpJek9DdzBNUzQxTkRJZ1RERXlMakkwTlN3ME1TNDBNVFFnVERFeUxqSTBOU3cwTVM0ek56RWdRekV5TGpJME5TdzBNUzR5TlRRZ01USXVNalExTERRd0xqa3lOU0F4TWk0eU5ETXNOREF1TnpreklFTXhNaTR5TkN3ME1DNDJPRFlnTVRJdU16QXlMRFF3TGpVNE15QXhNaTQwTXpRc05EQXVOVEE0SUV3eE9DNDBORFlzTXpjdU1ETTJJRU14T0M0MU56UXNNell1T1RZeUlERTRMamMwTml3ek5pNDVNallnTVRndU9USTNMRE0yTGpreU5pQkRNVGt1TVRRMUxETTJMamt5TmlBeE9TNHpOellzTXpZdU9UYzVJREU1TGpVMU5Dd3pOeTR3T0RJZ1F6RTVMamMwTnl3ek55NHhPVFFnTVRrdU9ETTVMRE0zTGpNMElERTVMamd5TWl3ek55NDBOelFnVERJd0xqQXpNeXd6Tnk0d056SWdRelF4TGpnd05pd3lOQzQxT0RVZ09EQXVOak0yTERJdU16RTRJRGd3TGpjM055d3lMakl6TmlCRE9EQXVPRGswTERJdU1UWTRJRGd4TGpVNE15d3hMamN5T1NBNE1pNHpNVEVzTVM0M01ERWdUVGd5TGpNeE1Td3dMamN3TkNCTU9ESXVNamN5TERBdU56QTFJRU00TVM0Mk5UUXNNQzQzTWpnZ09EQXVPVGc1TERBdU9UUTVJRGd3TGpJNU9Dd3hMak0yTVNCTU9EQXVNamMzTERFdU16Y3pJRU00TUM0eE1qa3NNUzQwTlRnZ05Ua3VOelk0TERFekxqRXpOU0F4T1M0M05UZ3NNell1TURjNUlFTXhPUzQxTERNMUxqazRNU0F4T1M0eU1UUXNNelV1T1RJNUlERTRMamt5Tnl3ek5TNDVNamtnUXpFNExqVTJNaXd6TlM0NU1qa2dNVGd1TWpJekxETTJMakF4TXlBeE55NDVORGNzTXpZdU1UY3pJRXd4TVM0NU16VXNNemt1TmpRMElFTXhNUzQwT1RNc016a3VPRGs1SURFeExqSXpOaXcwTUM0ek16UWdNVEV1TWpRMkxEUXdMamd4SUV3eE1TNHlORGNzTkRBdU9UWWdURFV1TVRZM0xEUTBMalEwTnlCRE5DNDNPVFFzTkRRdU5qUTJJREl1TmpJMUxEUTFMamszT0NBeExqZzNOeXcxTUM0ek5EVWdUREV1T0RjeExEVXdMak00TkNCRE1TNDROaklzTlRBdU5EVTBJREF1T1RVeExEVTNMalUxTnlBd0xqazJOU3czTUM0eU5Ua2dRekF1T1RjNUxEZ3lMamczT1NBeExqVTJPQ3c0Tnk0ek56VWdNaTR4TXpjc09URXVOekkwSUV3eUxqRXpPU3c1TVM0M016a2dRekl1TkRRM0xEazBMakE1TkNBMUxqWXhOQ3c1TkM0Mk5qSWdOUzQ1TnpVc09UUXVOekU1SUV3MkxqQXdPU3c1TkM0M01qTWdRell1TVRFc09UUXVOek0ySURZdU1qRXpMRGswTGpjME1pQTJMak14TkN3NU5DNDNORElnUXpZdU56a3NPVFF1TnpReUlEY3VNallzT1RRdU5qRWdOeTQzTVN3NU5DNHpOU0JNT0RJdU9UZ3pMRFV3TGpjNU9DQkRPRFF1TnprMExEUTVMamN5TnlBNE5TNDVPRElzTkRjdU16YzFJRGcyTGpVeU5TdzBNeTQ0TURFZ1F6ZzNMamN4TVN3ek5TNDVPRGNnT0RndU1qVTVMREV3TGpjd05TQTROaTR5TWpRc015NDFNRElnUXpnMUxqazNNU3d5TGpZd09TQTROUzQxTWl3eExqazNOU0E0TkM0NE9ERXNNUzQyTWlCTU9EUXVOelE1TERFdU5UVTRJRXc0TWk0Mk5qUXNNQzQzTmprZ1F6Z3lMalUxTVN3d0xqY3lOU0E0TWk0ME16RXNNQzQzTURRZ09ESXVNekV4TERBdU56QTBJaUJwWkQwaVJtbHNiQzB5SWlCbWFXeHNQU0lqTkRVMVFUWTBJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRZMkxqSTJOeXd4TVM0MU5qVWdURFkzTGpjMk1pd3hNUzQ1T1RrZ1RERXhMalF5TXl3ME5DNHpNalVpSUdsa1BTSkdhV3hzTFRNaUlHWnBiR3c5SWlOR1JrWkdSa1lpUGp3dmNHRjBhRDRLSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1USXVNakF5TERrd0xqVTBOU0JETVRJdU1ESTVMRGt3TGpVME5TQXhNUzQ0TmpJc09UQXVORFUxSURFeExqYzJPU3c1TUM0eU9UVWdRekV4TGpZek1pdzVNQzR3TlRjZ01URXVOekV6TERnNUxqYzFNaUF4TVM0NU5USXNPRGt1TmpFMElFd3pNQzR6T0Rrc056Z3VPVFk1SUVNek1DNDJNamdzTnpndU9ETXhJRE13TGprek15dzNPQzQ1TVRNZ016RXVNRGN4TERjNUxqRTFNaUJETXpFdU1qQTRMRGM1TGpNNUlETXhMakV5Tnl3M09TNDJPVFlnTXpBdU9EZzRMRGM1TGpnek15Qk1NVEl1TkRVeExEa3dMalEzT0NCTU1USXVNakF5TERrd0xqVTBOU0lnYVdROUlrWnBiR3d0TkNJZ1ptbHNiRDBpSXpZd04wUTRRaUkrUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWsweE15NDNOalFzTkRJdU5qVTBJRXd4TXk0Mk5UWXNOREl1TlRreUlFd3hNeTQzTURJc05ESXVOREl4SUV3eE9DNDRNemNzTXprdU5EVTNJRXd4T1M0d01EY3NNemt1TlRBeUlFd3hPQzQ1TmpJc016a3VOamN6SUV3eE15NDRNamNzTkRJdU5qTTNJRXd4TXk0M05qUXNOREl1TmpVMElpQnBaRDBpUm1sc2JDMDFJaUJtYVd4c1BTSWpOakEzUkRoQ0lqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVGd1TlRJc09UQXVNemMxSUV3NExqVXlMRFEyTGpReU1TQk1PQzQxT0RNc05EWXVNemcxSUV3M05TNDROQ3czTGpVMU5DQk1OelV1T0RRc05URXVOVEE0SUV3M05TNDNOemdzTlRFdU5UUTBJRXc0TGpVeUxEa3dMak0zTlNCTU9DNDFNaXc1TUM0ek56VWdXaUJOT0M0M055dzBOaTQxTmpRZ1REZ3VOemNzT0RrdU9UUTBJRXczTlM0MU9URXNOVEV1TXpZMUlFdzNOUzQxT1RFc055NDVPRFVnVERndU56Y3NORFl1TlRZMElFdzRMamMzTERRMkxqVTJOQ0JhSWlCcFpEMGlSbWxzYkMwMklpQm1hV3hzUFNJak5qQTNSRGhDSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUSTBMams0Tml3NE15NHhPRElnUXpJMExqYzFOaXc0TXk0ek16RWdNalF1TXpjMExEZ3pMalUyTmlBeU5DNHhNemNzT0RNdU56QTFJRXd4TWk0Mk16SXNPVEF1TkRBMklFTXhNaTR6T1RVc09UQXVOVFExSURFeUxqUXlOaXc1TUM0Mk5UZ2dNVEl1Tnl3NU1DNDJOVGdnVERFekxqSTJOU3c1TUM0Mk5UZ2dRekV6TGpVMExEa3dMalkxT0NBeE15NDVOVGdzT1RBdU5UUTFJREUwTGpFNU5TdzVNQzQwTURZZ1RESTFMamNzT0RNdU56QTFJRU15TlM0NU16Y3NPRE11TlRZMklESTJMakV5T0N3NE15NDBOVElnTWpZdU1USTFMRGd6TGpRME9TQkRNall1TVRJeUxEZ3pMalEwTnlBeU5pNHhNVGtzT0RNdU1qSWdNall1TVRFNUxEZ3lMamswTmlCRE1qWXVNVEU1TERneUxqWTNNaUF5TlM0NU16RXNPREl1TlRZNUlESTFMamN3TVN3NE1pNDNNVGtnVERJMExqazROaXc0TXk0eE9ESWlJR2xrUFNKR2FXeHNMVGNpSUdacGJHdzlJaU0yTURkRU9FSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTVRNdU1qWTJMRGt3TGpjNE1pQk1NVEl1Tnl3NU1DNDNPRElnUXpFeUxqVXNPVEF1TnpneUlERXlMak00TkN3NU1DNDNNallnTVRJdU16VTBMRGt3TGpZeE5pQkRNVEl1TXpJMExEa3dMalV3TmlBeE1pNHpPVGNzT1RBdU16azVJREV5TGpVMk9TdzVNQzR5T1RrZ1RESTBMakEzTkN3NE15NDFPVGNnUXpJMExqTXhMRGd6TGpRMU9TQXlOQzQyT0Rrc09ETXVNakkySURJMExqa3hPQ3c0TXk0d056Z2dUREkxTGpZek15dzRNaTQyTVRRZ1F6STFMamN5TXl3NE1pNDFOVFVnTWpVdU9ERXpMRGd5TGpVeU5TQXlOUzQ0T1Rrc09ESXVOVEkxSUVNeU5pNHdOekVzT0RJdU5USTFJREkyTGpJME5DdzRNaTQyTlRVZ01qWXVNalEwTERneUxqazBOaUJETWpZdU1qUTBMRGd6TGpFMklESTJMakkwTlN3NE15NHpNRGtnTWpZdU1qUTNMRGd6TGpNNE15Qk1Nall1TWpVekxEZ3pMak00TnlCTU1qWXVNalE1TERnekxqUTFOaUJETWpZdU1qUTJMRGd6TGpVek1TQXlOaTR5TkRZc09ETXVOVE14SURJMUxqYzJNeXc0TXk0NE1USWdUREUwTGpJMU9DdzVNQzQxTVRRZ1F6RTBMRGt3TGpZMk5TQXhNeTQxTmpRc09UQXVOemd5SURFekxqSTJOaXc1TUM0M09ESWdUREV6TGpJMk5pdzVNQzQzT0RJZ1dpQk5NVEl1TmpZMkxEa3dMalV6TWlCTU1USXVOeXc1TUM0MU16TWdUREV6TGpJMk5pdzVNQzQxTXpNZ1F6RXpMalV4T0N3NU1DNDFNek1nTVRNdU9URTFMRGt3TGpReU5TQXhOQzR4TXpJc09UQXVNams1SUV3eU5TNDJNemNzT0RNdU5UazNJRU15TlM0NE1EVXNPRE11TkRrNUlESTFMamt6TVN3NE15NDBNalFnTWpVdU9UazRMRGd6TGpNNE15QkRNalV1T1RrMExEZ3pMakk1T1NBeU5TNDVPVFFzT0RNdU1UWTFJREkxTGprNU5DdzRNaTQ1TkRZZ1RESTFMamc1T1N3NE1pNDNOelVnVERJMUxqYzJPQ3c0TWk0NE1qUWdUREkxTGpBMU5DdzRNeTR5T0RjZ1F6STBMamd5TWl3NE15NDBNemNnTWpRdU5ETTRMRGd6TGpZM015QXlOQzR5TERnekxqZ3hNaUJNTVRJdU5qazFMRGt3TGpVeE5DQk1NVEl1TmpZMkxEa3dMalV6TWlCTU1USXVOalkyTERrd0xqVXpNaUJhSWlCcFpEMGlSbWxzYkMwNElpQm1hV3hzUFNJak5qQTNSRGhDSWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRURXpMakkyTml3NE9TNDROekVnVERFeUxqY3NPRGt1T0RjeElFTXhNaTQxTERnNUxqZzNNU0F4TWk0ek9EUXNPRGt1T0RFMUlERXlMak0xTkN3NE9TNDNNRFVnUXpFeUxqTXlOQ3c0T1M0MU9UVWdNVEl1TXprM0xEZzVMalE0T0NBeE1pNDFOamtzT0RrdU16ZzRJRXd5TkM0d056UXNPREl1TmpnMklFTXlOQzR6TXpJc09ESXVOVE0xSURJMExqYzJPQ3c0TWk0ME1UZ2dNalV1TURZM0xEZ3lMalF4T0NCTU1qVXVOak15TERneUxqUXhPQ0JETWpVdU9ETXlMRGd5TGpReE9DQXlOUzQ1TkRnc09ESXVORGMwSURJMUxqazNPQ3c0TWk0MU9EUWdRekkyTGpBd09DdzRNaTQyT1RRZ01qVXVPVE0xTERneUxqZ3dNU0F5TlM0M05qTXNPREl1T1RBeElFd3hOQzR5TlRnc09Ea3VOakF6SUVNeE5DdzRPUzQzTlRRZ01UTXVOVFkwTERnNUxqZzNNU0F4TXk0eU5qWXNPRGt1T0RjeElFd3hNeTR5TmpZc09Ea3VPRGN4SUZvZ1RURXlMalkyTml3NE9TNDJNakVnVERFeUxqY3NPRGt1TmpJeUlFd3hNeTR5TmpZc09Ea3VOakl5SUVNeE15NDFNVGdzT0RrdU5qSXlJREV6TGpreE5TdzRPUzQxTVRVZ01UUXVNVE15TERnNUxqTTRPQ0JNTWpVdU5qTTNMRGd5TGpZNE5pQk1NalV1TmpZM0xEZ3lMalkyT0NCTU1qVXVOak15TERneUxqWTJOeUJNTWpVdU1EWTNMRGd5TGpZMk55QkRNalF1T0RFMUxEZ3lMalkyTnlBeU5DNDBNVGdzT0RJdU56YzFJREkwTGpJc09ESXVPVEF4SUV3eE1pNDJPVFVzT0RrdU5qQXpJRXd4TWk0Mk5qWXNPRGt1TmpJeElFd3hNaTQyTmpZc09Ea3VOakl4SUZvaUlHbGtQU0pHYVd4c0xUa2lJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5NVEl1TXpjc09UQXVPREF4SUV3eE1pNHpOeXc0T1M0MU5UUWdUREV5TGpNM0xEa3dMamd3TVNJZ2FXUTlJa1pwYkd3dE1UQWlJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQThjR0YwYUNCa1BTSk5OaTR4TXl3NU15NDVNREVnUXpVdU16YzVMRGt6TGpnd09DQTBMamd4Tml3NU15NHhOalFnTkM0Mk9URXNPVEl1TlRJMUlFTXpMamcyTERnNExqSTROeUF6TGpVMExEZ3pMamMwTXlBekxqVXlOaXczTVM0eE56TWdRek11TlRFeExEVTRMak00T1NBMExqUXlNeXcxTVM0ME1qZ2dOQzQwTWpNc05URXVOREk0SUVNMUxqRXpOQ3cwTnk0eU9ESWdOeTR5TVN3ME5pNHlNellnTnk0eU1TdzBOaTR5TXpZZ1F6Y3VNakVzTkRZdU1qTTJJRGd4TGpZMk55d3pMakkxSURneUxqQTJPU3d6TGpBeE55QkRPREl1TWpreUxESXVPRGc0SURnMExqVTFOaXd4TGpRek15QTROUzR5TmpRc015NDVOQ0JET0RjdU1qRTBMREV3TGpnMElEZzJMamMxTWl3ek5TNDRNamNnT0RVdU5UTTVMRFF6TGpneE9DQkRPRFV1TVRVc05EWXVNemd6SURnMExqSTVNU3cwT1M0d016TWdPREl1TkRnekxEVXdMakV3TVNCTU55NHlNU3c1TXk0Mk5UTWdRell1T0RJNExEa3pMamczTkNBMkxqUTJNU3c1TXk0NU5ERWdOaTR4TXl3NU15NDVNREVnUXpZdU1UTXNPVE11T1RBeElETXVNelE1TERrekxqUTJJRE11TVRJNUxEa3hMamMzTmlCRE1pNDFOamdzT0RjdU5EazFJREV1T1RjM0xEZ3lMams1TlNBeExqazJNaXczTUM0ME1qVWdRekV1T1RRNExEVTNMalkwTVNBeUxqZzJMRFV3TGpZNElESXVPRFlzTlRBdU5qZ2dRek11TlRjc05EWXVOVE0wSURVdU5qUTNMRFExTGpRNE9TQTFMalkwTnl3ME5TNDBPRGtnUXpVdU5qUTJMRFExTGpRNE9TQTRMakEyTlN3ME5DNHdPVElnTVRJdU1qUTFMRFF4TGpZM09TQk1NVE11TVRFMkxEUXhMalUySUV3eE9TNDNNVFVzTXpjdU56TWdUREU1TGpjMk1Td3pOeTR5TmprZ1REWXVNVE1zT1RNdU9UQXhJaUJwWkQwaVJtbHNiQzB4TVNJZ1ptbHNiRDBpSTBaQlJrRkdRU0krUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWswMkxqTXhOeXc1TkM0eE5qRWdURFl1TVRBeUxEazBMakUwT0NCTU5pNHhNREVzT1RRdU1UUTRJRXcxTGpnMU55dzVOQzR4TURFZ1F6VXVNVE00TERrekxqazBOU0F6TGpBNE5TdzVNeTR6TmpVZ01pNDRPREVzT1RFdU9EQTVJRU15TGpNeE15dzROeTQwTmprZ01TNDNNamNzT0RJdU9UazJJREV1TnpFekxEY3dMalF5TlNCRE1TNDJPVGtzTlRjdU56Y3hJREl1TmpBMExEVXdMamN4T0NBeUxqWXhNeXcxTUM0Mk5EZ2dRek11TXpNNExEUTJMalF4TnlBMUxqUTBOU3cwTlM0ek1TQTFMalV6TlN3ME5TNHlOallnVERFeUxqRTJNeXcwTVM0ME16a2dUREV6TGpBek15dzBNUzR6TWlCTU1Ua3VORGM1TERNM0xqVTNPQ0JNTVRrdU5URXpMRE0zTGpJME5DQkRNVGt1TlRJMkxETTNMakV3TnlBeE9TNDJORGNzTXpjdU1EQTRJREU1TGpjNE5pd3pOeTR3TWpFZ1F6RTVMamt5TWl3ek55NHdNelFnTWpBdU1ESXpMRE0zTGpFMU5pQXlNQzR3TURrc016Y3VNamt6SUV3eE9TNDVOU3d6Tnk0NE9ESWdUREV6TGpFNU9DdzBNUzQ0TURFZ1RERXlMak15T0N3ME1TNDVNVGtnVERVdU56Y3lMRFExTGpjd05DQkROUzQzTkRFc05EVXVOeklnTXk0M09ESXNORFl1TnpjeUlETXVNVEEyTERVd0xqY3lNaUJETXk0d09Ua3NOVEF1TnpneUlESXVNVGs0TERVM0xqZ3dPQ0F5TGpJeE1pdzNNQzQwTWpRZ1F6SXVNakkyTERneUxqazJNeUF5TGpnd09TdzROeTQwTWlBekxqTTNNeXc1TVM0M01qa2dRek11TkRZMExEa3lMalF5SURRdU1EWXlMRGt5TGpnNE15QTBMalk0TWl3NU15NHhPREVnUXpRdU5UWTJMRGt5TGprNE5DQTBMalE0Tml3NU1pNDNOellnTkM0ME5EWXNPVEl1TlRjeUlFTXpMalkyTlN3NE9DNDFPRGdnTXk0eU9URXNPRFF1TXpjZ015NHlOellzTnpFdU1UY3pJRU16TGpJMk1pdzFPQzQxTWlBMExqRTJOeXcxTVM0ME5qWWdOQzR4TnpZc05URXVNemsySUVNMExqa3dNU3cwTnk0eE5qVWdOeTR3TURnc05EWXVNRFU1SURjdU1EazRMRFEyTGpBeE5DQkROeTR3T1RRc05EWXVNREUxSURneExqVTBNaXd6TGpBek5DQTRNUzQ1TkRRc01pNDRNRElnVERneExqazNNaXd5TGpjNE5TQkRPREl1T0RjMkxESXVNalEzSURnekxqWTVNaXd5TGpBNU55QTROQzR6TXpJc01pNHpOVElnUXpnMExqZzROeXd5TGpVM015QTROUzR5T0RFc015NHdPRFVnT0RVdU5UQTBMRE11T0RjeUlFTTROeTQxTVRnc01URWdPRFl1T1RZMExETTJMakE1TVNBNE5TNDNPRFVzTkRNdU9EVTFJRU00TlM0eU56Z3NORGN1TVRrMklEZzBMakl4TERRNUxqTTNJRGd5TGpZeExEVXdMak14TnlCTU55NHpNelVzT1RNdU9EWTVJRU0yTGprNU9TdzVOQzR3TmpNZ05pNDJOVGdzT1RRdU1UWXhJRFl1TXpFM0xEazBMakUyTVNCTU5pNHpNVGNzT1RRdU1UWXhJRm9nVFRZdU1UY3NPVE11TmpVMElFTTJMalEyTXl3NU15NDJPU0EyTGpjM05DdzVNeTQyTVRjZ055NHdPRFVzT1RNdU5ETTNJRXc0TWk0ek5UZ3NORGt1T0RnMklFTTROQzR4T0RFc05EZ3VPREE0SURnMExqazJMRFExTGprM01TQTROUzR5T1RJc05ETXVOemdnUXpnMkxqUTJOaXd6Tmk0d05Ea2dPRGN1TURJekxERXhMakE0TlNBNE5TNHdNalFzTkM0d01EZ2dRemcwTGpnME5pd3pMak0zTnlBNE5DNDFOVEVzTWk0NU56WWdPRFF1TVRRNExESXVPREUySUVNNE15NDJOalFzTWk0Mk1qTWdPREl1T1RneUxESXVOelkwSURneUxqSXlOeXd6TGpJeE15Qk1PREl1TVRrekxETXVNak0wSUVNNE1TNDNPVEVzTXk0ME5qWWdOeTR6TXpVc05EWXVORFV5SURjdU16TTFMRFEyTGpRMU1pQkROeTR6TURRc05EWXVORFk1SURVdU16UTJMRFEzTGpVeU1TQTBMalkyT1N3MU1TNDBOekVnUXpRdU5qWXlMRFV4TGpVeklETXVOell4TERVNExqVTFOaUF6TGpjM05TdzNNUzR4TnpNZ1F6TXVOemtzT0RRdU16STRJRFF1TVRZeExEZzRMalV5TkNBMExqa3pOaXc1TWk0ME56WWdRelV1TURJMkxEa3lMamt6TnlBMUxqUXhNaXc1TXk0ME5Ua2dOUzQ1TnpNc09UTXVOakUxSUVNMkxqQTROeXc1TXk0Mk5DQTJMakUxT0N3NU15NDJOVElnTmk0eE5qa3NPVE11TmpVMElFdzJMakUzTERrekxqWTFOQ0JNTmk0eE55dzVNeTQyTlRRZ1dpSWdhV1E5SWtacGJHd3RNVElpSUdacGJHdzlJaU0wTlRWQk5qUWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTnk0ek1UY3NOamd1T1RneUlFTTNMamd3Tml3Mk9DNDNNREVnT0M0eU1ESXNOamd1T1RJMklEZ3VNakF5TERZNUxqUTROeUJET0M0eU1ESXNOekF1TURRM0lEY3VPREEyTERjd0xqY3pJRGN1TXpFM0xEY3hMakF4TWlCRE5pNDRNamtzTnpFdU1qazBJRFl1TkRNekxEY3hMakEyT1NBMkxqUXpNeXczTUM0MU1EZ2dRell1TkRNekxEWTVMamswT0NBMkxqZ3lPU3cyT1M0eU5qVWdOeTR6TVRjc05qZ3VPVGd5SWlCcFpEMGlSbWxzYkMweE15SWdabWxzYkQwaUkwWkdSa1pHUmlJK1BDOXdZWFJvUGdvZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMDJMamt5TERjeExqRXpNeUJETmk0Mk16RXNOekV1TVRNeklEWXVORE16TERjd0xqa3dOU0EyTGpRek15dzNNQzQxTURnZ1F6WXVORE16TERZNUxqazBPQ0EyTGpneU9TdzJPUzR5TmpVZ055NHpNVGNzTmpndU9UZ3lJRU0zTGpRMkxEWTRMamtnTnk0MU9UVXNOamd1T0RZeElEY3VOekUwTERZNExqZzJNU0JET0M0d01ETXNOamd1T0RZeElEZ3VNakF5TERZNUxqQTVJRGd1TWpBeUxEWTVMalE0TnlCRE9DNHlNRElzTnpBdU1EUTNJRGN1T0RBMkxEY3dMamN6SURjdU16RTNMRGN4TGpBeE1pQkROeTR4TnpRc056RXVNRGswSURjdU1ETTVMRGN4TGpFek15QTJMamt5TERjeExqRXpNeUJOTnk0M01UUXNOamd1TmpjMElFTTNMalUxTnl3Mk9DNDJOelFnTnk0ek9USXNOamd1TnpJeklEY3VNakkwTERZNExqZ3lNU0JETmk0Mk56WXNOamt1TVRNNElEWXVNalEyTERZNUxqZzNPU0EyTGpJME5pdzNNQzQxTURnZ1F6WXVNalEyTERjd0xqazVOQ0EyTGpVeE55dzNNUzR6TWlBMkxqa3lMRGN4TGpNeUlFTTNMakEzT0N3M01TNHpNaUEzTGpJME15dzNNUzR5TnpFZ055NDBNVEVzTnpFdU1UYzBJRU0zTGprMU9TdzNNQzQ0TlRjZ09DNHpPRGtzTnpBdU1URTNJRGd1TXpnNUxEWTVMalE0TnlCRE9DNHpPRGtzTmprdU1EQXhJRGd1TVRFM0xEWTRMalkzTkNBM0xqY3hOQ3cyT0M0Mk56UWlJR2xrUFNKR2FXeHNMVEUwSWlCbWFXeHNQU0lqT0RBNU4wRXlJajQ4TDNCaGRHZytDaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnUEhCaGRHZ2daRDBpVFRZdU9USXNOekF1T1RRM0lFTTJMalkwT1N3M01DNDVORGNnTmk0Mk1qRXNOekF1TmpRZ05pNDJNakVzTnpBdU5UQTRJRU0yTGpZeU1TdzNNQzR3TVRjZ05pNDVPRElzTmprdU16a3lJRGN1TkRFeExEWTVMakUwTlNCRE55NDFNakVzTmprdU1EZ3lJRGN1TmpJMUxEWTVMakEwT1NBM0xqY3hOQ3cyT1M0d05Ea2dRemN1T1RnMkxEWTVMakEwT1NBNExqQXhOU3cyT1M0ek5UVWdPQzR3TVRVc05qa3VORGczSUVNNExqQXhOU3cyT1M0NU56Z2dOeTQyTlRJc056QXVOakF6SURjdU1qSTBMRGN3TGpnMU1TQkROeTR4TVRVc056QXVPVEUwSURjdU1ERXNOekF1T1RRM0lEWXVPVElzTnpBdU9UUTNJRTAzTGpjeE5DdzJPQzQ0TmpFZ1F6Y3VOVGsxTERZNExqZzJNU0EzTGpRMkxEWTRMamtnTnk0ek1UY3NOamd1T1RneUlFTTJMamd5T1N3Mk9TNHlOalVnTmk0ME16TXNOamt1T1RRNElEWXVORE16TERjd0xqVXdPQ0JETmk0ME16TXNOekF1T1RBMUlEWXVOak14TERjeExqRXpNeUEyTGpreUxEY3hMakV6TXlCRE55NHdNemtzTnpFdU1UTXpJRGN1TVRjMExEY3hMakE1TkNBM0xqTXhOeXczTVM0d01USWdRemN1T0RBMkxEY3dMamN6SURndU1qQXlMRGN3TGpBME55QTRMakl3TWl3Mk9TNDBPRGNnUXpndU1qQXlMRFk1TGpBNUlEZ3VNREF6TERZNExqZzJNU0EzTGpjeE5DdzJPQzQ0TmpFaUlHbGtQU0pHYVd4c0xURTFJaUJtYVd4c1BTSWpPREE1TjBFeUlqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVGN1TkRRMExEZzFMak0xSUVNM0xqY3dPQ3c0TlM0eE9UZ2dOeTQ1TWpFc09EVXVNekU1SURjdU9USXhMRGcxTGpZeU1pQkROeTQ1TWpFc09EVXVPVEkxSURjdU56QTRMRGcyTGpJNU1pQTNMalEwTkN3NE5pNDBORFFnUXpjdU1UZ3hMRGcyTGpVNU55QTJMamsyTnl3NE5pNDBOelVnTmk0NU5qY3NPRFl1TVRjeklFTTJMamsyTnl3NE5TNDROekVnTnk0eE9ERXNPRFV1TlRBeUlEY3VORFEwTERnMUxqTTFJaUJwWkQwaVJtbHNiQzB4TmlJZ1ptbHNiRDBpSTBaR1JrWkdSaUkrUEM5d1lYUm9QZ29nSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR4d1lYUm9JR1E5SWswM0xqSXpMRGcyTGpVeElFTTNMakEzTkN3NE5pNDFNU0EyTGprMk55dzROaTR6T0RjZ05pNDVOamNzT0RZdU1UY3pJRU0yTGprMk55dzROUzQ0TnpFZ055NHhPREVzT0RVdU5UQXlJRGN1TkRRMExEZzFMak0xSUVNM0xqVXlNU3c0TlM0ek1EVWdOeTQxT1RRc09EVXVNamcwSURjdU5qVTRMRGcxTGpJNE5DQkROeTQ0TVRRc09EVXVNamcwSURjdU9USXhMRGcxTGpRd09DQTNMamt5TVN3NE5TNDJNaklnUXpjdU9USXhMRGcxTGpreU5TQTNMamN3T0N3NE5pNHlPVElnTnk0ME5EUXNPRFl1TkRRMElFTTNMak0yTnl3NE5pNDBPRGtnTnk0eU9UUXNPRFl1TlRFZ055NHlNeXc0Tmk0MU1TQk5OeTQyTlRnc09EVXVNRGs0SUVNM0xqVTFPQ3c0TlM0d09UZ2dOeTQwTlRVc09EVXVNVEkzSURjdU16VXhMRGcxTGpFNE9DQkROeTR3TXpFc09EVXVNemN6SURZdU56Z3hMRGcxTGpnd05pQTJMamM0TVN3NE5pNHhOek1nUXpZdU56Z3hMRGcyTGpRNE1pQTJMamsyTml3NE5pNDJPVGNnTnk0eU15dzROaTQyT1RjZ1F6Y3VNek1zT0RZdU5qazNJRGN1TkRNekxEZzJMalkyTmlBM0xqVXpPQ3c0Tmk0Mk1EY2dRemN1T0RVNExEZzJMalF5TWlBNExqRXdPQ3c0TlM0NU9Ea2dPQzR4TURnc09EVXVOakl5SUVNNExqRXdPQ3c0TlM0ek1UTWdOeTQ1TWpNc09EVXVNRGs0SURjdU5qVTRMRGcxTGpBNU9DSWdhV1E5SWtacGJHd3RNVGNpSUdacGJHdzlJaU00TURrM1FUSWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0E4Y0dGMGFDQmtQU0pOTnk0eU15dzROaTR6TWpJZ1REY3VNVFUwTERnMkxqRTNNeUJETnk0eE5UUXNPRFV1T1RNNElEY3VNek16TERnMUxqWXlPU0EzTGpVek9DdzROUzQxTVRJZ1REY3VOalU0TERnMUxqUTNNU0JNTnk0M016UXNPRFV1TmpJeUlFTTNMamN6TkN3NE5TNDROVFlnTnk0MU5UVXNPRFl1TVRZMElEY3VNelV4TERnMkxqSTRNaUJNTnk0eU15dzROaTR6TWpJZ1RUY3VOalU0TERnMUxqSTROQ0JETnk0MU9UUXNPRFV1TWpnMElEY3VOVEl4TERnMUxqTXdOU0EzTGpRME5DdzROUzR6TlNCRE55NHhPREVzT0RVdU5UQXlJRFl1T1RZM0xEZzFMamczTVNBMkxqazJOeXc0Tmk0eE56TWdRell1T1RZM0xEZzJMak00TnlBM0xqQTNOQ3c0Tmk0MU1TQTNMakl6TERnMkxqVXhJRU0zTGpJNU5DdzROaTQxTVNBM0xqTTJOeXc0Tmk0ME9Ea2dOeTQwTkRRc09EWXVORFEwSUVNM0xqY3dPQ3c0Tmk0eU9USWdOeTQ1TWpFc09EVXVPVEkxSURjdU9USXhMRGcxTGpZeU1pQkROeTQ1TWpFc09EVXVOREE0SURjdU9ERTBMRGcxTGpJNE5DQTNMalkxT0N3NE5TNHlPRFFpSUdsa1BTSkdhV3hzTFRFNElpQm1hV3hzUFNJak9EQTVOMEV5SWo0OEwzQmhkR2crQ2lBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ1BIQmhkR2dnWkQwaVRUYzNMakkzT0N3M0xqYzJPU0JNTnpjdU1qYzRMRFV4TGpRek5pQk1NVEF1TWpBNExEa3dMakUySUV3eE1DNHlNRGdzTkRZdU5Ea3pJRXczTnk0eU56Z3NOeTQzTmpraUlHbGtQU0pHYVd4c0xURTVJaUJtYVd4c1BTSWpORFUxUVRZMElqNDhMM0JoZEdnK0NpQWdJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEV3TGpBNE15dzVNQzR6TnpVZ1RERXdMakE0TXl3ME5pNDBNakVnVERFd0xqRTBOaXcwTmk0ek9EVWdURGMzTGpRd015dzNMalUxTkNCTU56Y3VOREF6TERVeExqVXdPQ0JNTnpjdU16UXhMRFV4TGpVME5DQk1NVEF1TURnekxEa3dMak0zTlNCTU1UQXVNRGd6TERrd0xqTTNOU0JhSUUweE1DNHpNek1zTkRZdU5UWTBJRXd4TUM0ek16TXNPRGt1T1RRMElFdzNOeTR4TlRRc05URXVNelkxSUV3M055NHhOVFFzTnk0NU9EVWdUREV3TGpNek15dzBOaTQxTmpRZ1RERXdMak16TXl3ME5pNDFOalFnV2lJZ2FXUTlJa1pwYkd3dE1qQWlJR1pwYkd3OUlpTTJNRGRFT0VJaVBqd3ZjR0YwYUQ0S0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUR3dlp6NEtJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lEeHdZWFJvSUdROUlrMHhNalV1TnpNM0xEZzRMalkwTnlCTU1URTRMakE1T0N3NU1TNDVPREVnVERFeE9DNHdPVGdzT0RRZ1RERXdOaTQyTXprc09EZ3VOekV6SUV3eE1EWXVOak01TERrMkxqazRNaUJNT1Rrc01UQXdMak14TlNCTU1URXlMak0yT1N3eE1ETXVPVFl4SUV3eE1qVXVOek0zTERnNExqWTBOeUlnYVdROUlrbHRjRzl5ZEdWa0xVeGhlV1Z5Y3kxRGIzQjVMVElpSUdacGJHdzlJaU0wTlRWQk5qUWlJSE5yWlhSamFEcDBlWEJsUFNKTlUxTm9ZWEJsUjNKdmRYQWlQand2Y0dGMGFENEtJQ0FnSUNBZ0lDQWdJQ0FnUEM5blBnb2dJQ0FnSUNBZ0lEd3ZaejRLSUNBZ0lEd3ZaejRLUEM5emRtYysnKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUm90YXRlSW5zdHJ1Y3Rpb25zO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuLyoqXG4gKiBUT0RPOiBGaXggdXAgYWxsIFwibmV3IFRIUkVFXCIgaW5zdGFudGlhdGlvbnMgdG8gaW1wcm92ZSBwZXJmb3JtYW5jZS5cbiAqL1xudmFyIFNlbnNvclNhbXBsZSA9IHJlcXVpcmUoJy4vc2Vuc29yLXNhbXBsZS5qcycpO1xudmFyIFRIUkVFID0gcmVxdWlyZSgnLi4vdGhyZWUtbWF0aC5qcycpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuLi91dGlsLmpzJyk7XG5cbnZhciBERUJVRyA9IGZhbHNlO1xuXG4vKipcbiAqIEFuIGltcGxlbWVudGF0aW9uIG9mIGEgc2ltcGxlIGNvbXBsZW1lbnRhcnkgZmlsdGVyLCB3aGljaCBmdXNlcyBneXJvc2NvcGUgYW5kXG4gKiBhY2NlbGVyb21ldGVyIGRhdGEgZnJvbSB0aGUgJ2RldmljZW1vdGlvbicgZXZlbnQuXG4gKlxuICogQWNjZWxlcm9tZXRlciBkYXRhIGlzIHZlcnkgbm9pc3ksIGJ1dCBzdGFibGUgb3ZlciB0aGUgbG9uZyB0ZXJtLlxuICogR3lyb3Njb3BlIGRhdGEgaXMgc21vb3RoLCBidXQgdGVuZHMgdG8gZHJpZnQgb3ZlciB0aGUgbG9uZyB0ZXJtLlxuICpcbiAqIFRoaXMgZnVzaW9uIGlzIHJlbGF0aXZlbHkgc2ltcGxlOlxuICogMS4gR2V0IG9yaWVudGF0aW9uIGVzdGltYXRlcyBmcm9tIGFjY2VsZXJvbWV0ZXIgYnkgYXBwbHlpbmcgYSBsb3ctcGFzcyBmaWx0ZXJcbiAqICAgIG9uIHRoYXQgZGF0YS5cbiAqIDIuIEdldCBvcmllbnRhdGlvbiBlc3RpbWF0ZXMgZnJvbSBneXJvc2NvcGUgYnkgaW50ZWdyYXRpbmcgb3ZlciB0aW1lLlxuICogMy4gQ29tYmluZSB0aGUgdHdvIGVzdGltYXRlcywgd2VpZ2hpbmcgKDEpIGluIHRoZSBsb25nIHRlcm0sIGJ1dCAoMikgZm9yIHRoZVxuICogICAgc2hvcnQgdGVybS5cbiAqL1xuZnVuY3Rpb24gQ29tcGxlbWVudGFyeUZpbHRlcihrRmlsdGVyKSB7XG4gIHRoaXMua0ZpbHRlciA9IGtGaWx0ZXI7XG5cbiAgLy8gUmF3IHNlbnNvciBtZWFzdXJlbWVudHMuXG4gIHRoaXMuY3VycmVudEFjY2VsTWVhc3VyZW1lbnQgPSBuZXcgU2Vuc29yU2FtcGxlKCk7XG4gIHRoaXMuY3VycmVudEd5cm9NZWFzdXJlbWVudCA9IG5ldyBTZW5zb3JTYW1wbGUoKTtcbiAgdGhpcy5wcmV2aW91c0d5cm9NZWFzdXJlbWVudCA9IG5ldyBTZW5zb3JTYW1wbGUoKTtcblxuICAvLyBDdXJyZW50IGZpbHRlciBvcmllbnRhdGlvblxuICB0aGlzLmZpbHRlclEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICB0aGlzLnByZXZpb3VzRmlsdGVyUSA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cbiAgLy8gT3JpZW50YXRpb24gYmFzZWQgb24gdGhlIGFjY2VsZXJvbWV0ZXIuXG4gIHRoaXMuYWNjZWxRID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcbiAgLy8gV2hldGhlciBvciBub3QgdGhlIG9yaWVudGF0aW9uIGhhcyBiZWVuIGluaXRpYWxpemVkLlxuICB0aGlzLmlzT3JpZW50YXRpb25Jbml0aWFsaXplZCA9IGZhbHNlO1xuICAvLyBSdW5uaW5nIGVzdGltYXRlIG9mIGdyYXZpdHkgYmFzZWQgb24gdGhlIGN1cnJlbnQgb3JpZW50YXRpb24uXG4gIHRoaXMuZXN0aW1hdGVkR3Jhdml0eSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gIC8vIE1lYXN1cmVkIGdyYXZpdHkgYmFzZWQgb24gYWNjZWxlcm9tZXRlci5cbiAgdGhpcy5tZWFzdXJlZEdyYXZpdHkgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gIC8vIERlYnVnIG9ubHkgcXVhdGVybmlvbiBvZiBneXJvLWJhc2VkIG9yaWVudGF0aW9uLlxuICB0aGlzLmd5cm9JbnRlZ3JhbFEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xufVxuXG5Db21wbGVtZW50YXJ5RmlsdGVyLnByb3RvdHlwZS5hZGRBY2NlbE1lYXN1cmVtZW50ID0gZnVuY3Rpb24odmVjdG9yLCB0aW1lc3RhbXBTKSB7XG4gIHRoaXMuY3VycmVudEFjY2VsTWVhc3VyZW1lbnQuc2V0KHZlY3RvciwgdGltZXN0YW1wUyk7XG59O1xuXG5Db21wbGVtZW50YXJ5RmlsdGVyLnByb3RvdHlwZS5hZGRHeXJvTWVhc3VyZW1lbnQgPSBmdW5jdGlvbih2ZWN0b3IsIHRpbWVzdGFtcFMpIHtcbiAgdGhpcy5jdXJyZW50R3lyb01lYXN1cmVtZW50LnNldCh2ZWN0b3IsIHRpbWVzdGFtcFMpO1xuXG4gIHZhciBkZWx0YVQgPSB0aW1lc3RhbXBTIC0gdGhpcy5wcmV2aW91c0d5cm9NZWFzdXJlbWVudC50aW1lc3RhbXBTO1xuICBpZiAoVXRpbC5pc1RpbWVzdGFtcERlbHRhVmFsaWQoZGVsdGFUKSkge1xuICAgIHRoaXMucnVuXygpO1xuICB9XG4gIFxuICB0aGlzLnByZXZpb3VzR3lyb01lYXN1cmVtZW50LmNvcHkodGhpcy5jdXJyZW50R3lyb01lYXN1cmVtZW50KTtcbn07XG5cbkNvbXBsZW1lbnRhcnlGaWx0ZXIucHJvdG90eXBlLnJ1bl8gPSBmdW5jdGlvbigpIHtcblxuICBpZiAoIXRoaXMuaXNPcmllbnRhdGlvbkluaXRpYWxpemVkKSB7XG4gICAgdGhpcy5hY2NlbFEgPSB0aGlzLmFjY2VsVG9RdWF0ZXJuaW9uXyh0aGlzLmN1cnJlbnRBY2NlbE1lYXN1cmVtZW50LnNhbXBsZSk7XG4gICAgdGhpcy5wcmV2aW91c0ZpbHRlclEuY29weSh0aGlzLmFjY2VsUSk7XG4gICAgdGhpcy5pc09yaWVudGF0aW9uSW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBkZWx0YVQgPSB0aGlzLmN1cnJlbnRHeXJvTWVhc3VyZW1lbnQudGltZXN0YW1wUyAtXG4gICAgICB0aGlzLnByZXZpb3VzR3lyb01lYXN1cmVtZW50LnRpbWVzdGFtcFM7XG5cbiAgLy8gQ29udmVydCBneXJvIHJvdGF0aW9uIHZlY3RvciB0byBhIHF1YXRlcm5pb24gZGVsdGEuXG4gIHZhciBneXJvRGVsdGFRID0gdGhpcy5neXJvVG9RdWF0ZXJuaW9uRGVsdGFfKHRoaXMuY3VycmVudEd5cm9NZWFzdXJlbWVudC5zYW1wbGUsIGRlbHRhVCk7XG4gIHRoaXMuZ3lyb0ludGVncmFsUS5tdWx0aXBseShneXJvRGVsdGFRKTtcblxuICAvLyBmaWx0ZXJfMSA9IEsgKiAoZmlsdGVyXzAgKyBneXJvICogZFQpICsgKDEgLSBLKSAqIGFjY2VsLlxuICB0aGlzLmZpbHRlclEuY29weSh0aGlzLnByZXZpb3VzRmlsdGVyUSk7XG4gIHRoaXMuZmlsdGVyUS5tdWx0aXBseShneXJvRGVsdGFRKTtcblxuICAvLyBDYWxjdWxhdGUgdGhlIGRlbHRhIGJldHdlZW4gdGhlIGN1cnJlbnQgZXN0aW1hdGVkIGdyYXZpdHkgYW5kIHRoZSByZWFsXG4gIC8vIGdyYXZpdHkgdmVjdG9yIGZyb20gYWNjZWxlcm9tZXRlci5cbiAgdmFyIGludkZpbHRlclEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICBpbnZGaWx0ZXJRLmNvcHkodGhpcy5maWx0ZXJRKTtcbiAgaW52RmlsdGVyUS5pbnZlcnNlKCk7XG5cbiAgdGhpcy5lc3RpbWF0ZWRHcmF2aXR5LnNldCgwLCAwLCAtMSk7XG4gIHRoaXMuZXN0aW1hdGVkR3Jhdml0eS5hcHBseVF1YXRlcm5pb24oaW52RmlsdGVyUSk7XG4gIHRoaXMuZXN0aW1hdGVkR3Jhdml0eS5ub3JtYWxpemUoKTtcblxuICB0aGlzLm1lYXN1cmVkR3Jhdml0eS5jb3B5KHRoaXMuY3VycmVudEFjY2VsTWVhc3VyZW1lbnQuc2FtcGxlKTtcbiAgdGhpcy5tZWFzdXJlZEdyYXZpdHkubm9ybWFsaXplKCk7XG5cbiAgLy8gQ29tcGFyZSBlc3RpbWF0ZWQgZ3Jhdml0eSB3aXRoIG1lYXN1cmVkIGdyYXZpdHksIGdldCB0aGUgZGVsdGEgcXVhdGVybmlvblxuICAvLyBiZXR3ZWVuIHRoZSB0d28uXG4gIHZhciBkZWx0YVEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICBkZWx0YVEuc2V0RnJvbVVuaXRWZWN0b3JzKHRoaXMuZXN0aW1hdGVkR3Jhdml0eSwgdGhpcy5tZWFzdXJlZEdyYXZpdHkpO1xuICBkZWx0YVEuaW52ZXJzZSgpO1xuXG4gIGlmIChERUJVRykge1xuICAgIGNvbnNvbGUubG9nKCdEZWx0YTogJWQgZGVnLCBHX2VzdDogKCVzLCAlcywgJXMpLCBHX21lYXM6ICglcywgJXMsICVzKScsXG4gICAgICAgICAgICAgICAgVEhSRUUuTWF0aC5yYWRUb0RlZyhVdGlsLmdldFF1YXRlcm5pb25BbmdsZShkZWx0YVEpKSxcbiAgICAgICAgICAgICAgICAodGhpcy5lc3RpbWF0ZWRHcmF2aXR5LngpLnRvRml4ZWQoMSksXG4gICAgICAgICAgICAgICAgKHRoaXMuZXN0aW1hdGVkR3Jhdml0eS55KS50b0ZpeGVkKDEpLFxuICAgICAgICAgICAgICAgICh0aGlzLmVzdGltYXRlZEdyYXZpdHkueikudG9GaXhlZCgxKSxcbiAgICAgICAgICAgICAgICAodGhpcy5tZWFzdXJlZEdyYXZpdHkueCkudG9GaXhlZCgxKSxcbiAgICAgICAgICAgICAgICAodGhpcy5tZWFzdXJlZEdyYXZpdHkueSkudG9GaXhlZCgxKSxcbiAgICAgICAgICAgICAgICAodGhpcy5tZWFzdXJlZEdyYXZpdHkueikudG9GaXhlZCgxKSk7XG4gIH1cblxuICAvLyBDYWxjdWxhdGUgdGhlIFNMRVJQIHRhcmdldDogY3VycmVudCBvcmllbnRhdGlvbiBwbHVzIHRoZSBtZWFzdXJlZC1lc3RpbWF0ZWRcbiAgLy8gcXVhdGVybmlvbiBkZWx0YS5cbiAgdmFyIHRhcmdldFEgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICB0YXJnZXRRLmNvcHkodGhpcy5maWx0ZXJRKTtcbiAgdGFyZ2V0US5tdWx0aXBseShkZWx0YVEpO1xuXG4gIC8vIFNMRVJQIGZhY3RvcjogMCBpcyBwdXJlIGd5cm8sIDEgaXMgcHVyZSBhY2NlbC5cbiAgdGhpcy5maWx0ZXJRLnNsZXJwKHRhcmdldFEsIDEgLSB0aGlzLmtGaWx0ZXIpO1xuXG4gIHRoaXMucHJldmlvdXNGaWx0ZXJRLmNvcHkodGhpcy5maWx0ZXJRKTtcbn07XG5cbkNvbXBsZW1lbnRhcnlGaWx0ZXIucHJvdG90eXBlLmdldE9yaWVudGF0aW9uID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmZpbHRlclE7XG59O1xuXG5Db21wbGVtZW50YXJ5RmlsdGVyLnByb3RvdHlwZS5hY2NlbFRvUXVhdGVybmlvbl8gPSBmdW5jdGlvbihhY2NlbCkge1xuICB2YXIgbm9ybUFjY2VsID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgbm9ybUFjY2VsLmNvcHkoYWNjZWwpO1xuICBub3JtQWNjZWwubm9ybWFsaXplKCk7XG4gIHZhciBxdWF0ID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcbiAgcXVhdC5zZXRGcm9tVW5pdFZlY3RvcnMobmV3IFRIUkVFLlZlY3RvcjMoMCwgMCwgLTEpLCBub3JtQWNjZWwpO1xuICBxdWF0LmludmVyc2UoKTtcbiAgcmV0dXJuIHF1YXQ7XG59O1xuXG5Db21wbGVtZW50YXJ5RmlsdGVyLnByb3RvdHlwZS5neXJvVG9RdWF0ZXJuaW9uRGVsdGFfID0gZnVuY3Rpb24oZ3lybywgZHQpIHtcbiAgLy8gRXh0cmFjdCBheGlzIGFuZCBhbmdsZSBmcm9tIHRoZSBneXJvc2NvcGUgZGF0YS5cbiAgdmFyIHF1YXQgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICB2YXIgYXhpcyA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gIGF4aXMuY29weShneXJvKTtcbiAgYXhpcy5ub3JtYWxpemUoKTtcbiAgcXVhdC5zZXRGcm9tQXhpc0FuZ2xlKGF4aXMsIGd5cm8ubGVuZ3RoKCkgKiBkdCk7XG4gIHJldHVybiBxdWF0O1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbXBsZW1lbnRhcnlGaWx0ZXI7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xudmFyIENvbXBsZW1lbnRhcnlGaWx0ZXIgPSByZXF1aXJlKCcuL2NvbXBsZW1lbnRhcnktZmlsdGVyLmpzJyk7XG52YXIgUG9zZVByZWRpY3RvciA9IHJlcXVpcmUoJy4vcG9zZS1wcmVkaWN0b3IuanMnKTtcbnZhciBUb3VjaFBhbm5lciA9IHJlcXVpcmUoJy4uL3RvdWNoLXBhbm5lci5qcycpO1xudmFyIFRIUkVFID0gcmVxdWlyZSgnLi4vdGhyZWUtbWF0aC5qcycpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuLi91dGlsLmpzJyk7XG5cbi8qKlxuICogVGhlIHBvc2Ugc2Vuc29yLCBpbXBsZW1lbnRlZCB1c2luZyBEZXZpY2VNb3Rpb24gQVBJcy5cbiAqL1xuZnVuY3Rpb24gRnVzaW9uUG9zZVNlbnNvcigpIHtcbiAgdGhpcy5kZXZpY2VJZCA9ICd3ZWJ2ci1wb2x5ZmlsbDpmdXNlZCc7XG4gIHRoaXMuZGV2aWNlTmFtZSA9ICdWUiBQb3NpdGlvbiBEZXZpY2UgKHdlYnZyLXBvbHlmaWxsOmZ1c2VkKSc7XG5cbiAgdGhpcy5hY2NlbGVyb21ldGVyID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgdGhpcy5neXJvc2NvcGUgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdkZXZpY2Vtb3Rpb24nLCB0aGlzLm9uRGV2aWNlTW90aW9uQ2hhbmdlXy5iaW5kKHRoaXMpKTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ29yaWVudGF0aW9uY2hhbmdlJywgdGhpcy5vblNjcmVlbk9yaWVudGF0aW9uQ2hhbmdlXy5iaW5kKHRoaXMpKTtcblxuICB0aGlzLmZpbHRlciA9IG5ldyBDb21wbGVtZW50YXJ5RmlsdGVyKFdlYlZSQ29uZmlnLktfRklMVEVSIHx8IDAuOTgpO1xuICB0aGlzLnBvc2VQcmVkaWN0b3IgPSBuZXcgUG9zZVByZWRpY3RvcihXZWJWUkNvbmZpZy5QUkVESUNUSU9OX1RJTUVfUyB8fCAwLjA0MCk7XG4gIHRoaXMudG91Y2hQYW5uZXIgPSBuZXcgVG91Y2hQYW5uZXIoKTtcblxuICB0aGlzLmZpbHRlclRvV29ybGRRID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcblxuICAvLyBTZXQgdGhlIGZpbHRlciB0byB3b3JsZCB0cmFuc2Zvcm0sIGRlcGVuZGluZyBvbiBPUy5cbiAgaWYgKFV0aWwuaXNJT1MoKSkge1xuICAgIHRoaXMuZmlsdGVyVG9Xb3JsZFEuc2V0RnJvbUF4aXNBbmdsZShuZXcgVEhSRUUuVmVjdG9yMygxLCAwLCAwKSwgTWF0aC5QSS8yKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmZpbHRlclRvV29ybGRRLnNldEZyb21BeGlzQW5nbGUobmV3IFRIUkVFLlZlY3RvcjMoMSwgMCwgMCksIC1NYXRoLlBJLzIpO1xuICB9XG5cbiAgdGhpcy53b3JsZFRvU2NyZWVuUSA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG4gIHRoaXMuc2V0U2NyZWVuVHJhbnNmb3JtXygpO1xuXG4gIC8vIEtlZXAgdHJhY2sgb2YgYSByZXNldCB0cmFuc2Zvcm0gZm9yIHJlc2V0U2Vuc29yLlxuICB0aGlzLnJlc2V0USA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cbiAgdGhpcy5pc0ZpcmVmb3hBbmRyb2lkID0gVXRpbC5pc0ZpcmVmb3hBbmRyb2lkKCk7XG4gIHRoaXMuaXNJT1MgPSBVdGlsLmlzSU9TKCk7XG5cbiAgdGhpcy5vcmllbnRhdGlvbk91dF8gPSBuZXcgRmxvYXQzMkFycmF5KDQpO1xufVxuXG5GdXNpb25Qb3NlU2Vuc29yLnByb3RvdHlwZS5nZXRQb3NpdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAvLyBUaGlzIFBvc2VTZW5zb3IgZG9lc24ndCBzdXBwb3J0IHBvc2l0aW9uXG4gIHJldHVybiBudWxsO1xufTtcblxuRnVzaW9uUG9zZVNlbnNvci5wcm90b3R5cGUuZ2V0T3JpZW50YXRpb24gPSBmdW5jdGlvbigpIHtcbiAgLy8gQ29udmVydCBmcm9tIGZpbHRlciBzcGFjZSB0byB0aGUgdGhlIHNhbWUgc3lzdGVtIHVzZWQgYnkgdGhlXG4gIC8vIGRldmljZW9yaWVudGF0aW9uIGV2ZW50LlxuICB2YXIgb3JpZW50YXRpb24gPSB0aGlzLmZpbHRlci5nZXRPcmllbnRhdGlvbigpO1xuXG4gIC8vIFByZWRpY3Qgb3JpZW50YXRpb24uXG4gIHRoaXMucHJlZGljdGVkUSA9IHRoaXMucG9zZVByZWRpY3Rvci5nZXRQcmVkaWN0aW9uKG9yaWVudGF0aW9uLCB0aGlzLmd5cm9zY29wZSwgdGhpcy5wcmV2aW91c1RpbWVzdGFtcFMpO1xuXG4gIC8vIENvbnZlcnQgdG8gVEhSRUUgY29vcmRpbmF0ZSBzeXN0ZW06IC1aIGZvcndhcmQsIFkgdXAsIFggcmlnaHQuXG4gIHZhciBvdXQgPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuICBvdXQuY29weSh0aGlzLmZpbHRlclRvV29ybGRRKTtcbiAgb3V0Lm11bHRpcGx5KHRoaXMucmVzZXRRKTtcbiAgaWYgKCFXZWJWUkNvbmZpZy5UT1VDSF9QQU5ORVJfRElTQUJMRUQpIHtcbiAgICBvdXQubXVsdGlwbHkodGhpcy50b3VjaFBhbm5lci5nZXRPcmllbnRhdGlvbigpKTtcbiAgfVxuICBvdXQubXVsdGlwbHkodGhpcy5wcmVkaWN0ZWRRKTtcbiAgb3V0Lm11bHRpcGx5KHRoaXMud29ybGRUb1NjcmVlblEpO1xuXG4gIC8vIEhhbmRsZSB0aGUgeWF3LW9ubHkgY2FzZS5cbiAgaWYgKFdlYlZSQ29uZmlnLllBV19PTkxZKSB7XG4gICAgLy8gTWFrZSBhIHF1YXRlcm5pb24gdGhhdCBvbmx5IHR1cm5zIGFyb3VuZCB0aGUgWS1heGlzLlxuICAgIG91dC54ID0gMDtcbiAgICBvdXQueiA9IDA7XG4gICAgb3V0Lm5vcm1hbGl6ZSgpO1xuICB9XG5cbiAgdGhpcy5vcmllbnRhdGlvbk91dF9bMF0gPSBvdXQueDtcbiAgdGhpcy5vcmllbnRhdGlvbk91dF9bMV0gPSBvdXQueTtcbiAgdGhpcy5vcmllbnRhdGlvbk91dF9bMl0gPSBvdXQuejtcbiAgdGhpcy5vcmllbnRhdGlvbk91dF9bM10gPSBvdXQudztcbiAgcmV0dXJuIHRoaXMub3JpZW50YXRpb25PdXRfO1xufTtcblxuRnVzaW9uUG9zZVNlbnNvci5wcm90b3R5cGUucmVzZXRQb3NlID0gZnVuY3Rpb24oKSB7XG4gIC8vIFJlZHVjZSB0byBpbnZlcnRlZCB5YXctb25seVxuICB0aGlzLnJlc2V0US5jb3B5KHRoaXMuZmlsdGVyLmdldE9yaWVudGF0aW9uKCkpO1xuICB0aGlzLnJlc2V0US54ID0gMDtcbiAgdGhpcy5yZXNldFEueSA9IDA7XG4gIHRoaXMucmVzZXRRLnogKj0gLTE7XG4gIHRoaXMucmVzZXRRLm5vcm1hbGl6ZSgpO1xuXG4gIGlmICghV2ViVlJDb25maWcuVE9VQ0hfUEFOTkVSX0RJU0FCTEVEKSB7XG4gICAgdGhpcy50b3VjaFBhbm5lci5yZXNldFNlbnNvcigpO1xuICB9XG59O1xuXG5GdXNpb25Qb3NlU2Vuc29yLnByb3RvdHlwZS5vbkRldmljZU1vdGlvbkNoYW5nZV8gPSBmdW5jdGlvbihkZXZpY2VNb3Rpb24pIHtcbiAgdmFyIGFjY0dyYXZpdHkgPSBkZXZpY2VNb3Rpb24uYWNjZWxlcmF0aW9uSW5jbHVkaW5nR3Jhdml0eTtcbiAgdmFyIHJvdFJhdGUgPSBkZXZpY2VNb3Rpb24ucm90YXRpb25SYXRlO1xuICB2YXIgdGltZXN0YW1wUyA9IGRldmljZU1vdGlvbi50aW1lU3RhbXAgLyAxMDAwO1xuXG4gIC8vIEZpcmVmb3ggQW5kcm9pZCB0aW1lU3RhbXAgcmV0dXJucyBvbmUgdGhvdXNhbmR0aCBvZiBhIG1pbGxpc2Vjb25kLlxuICBpZiAodGhpcy5pc0ZpcmVmb3hBbmRyb2lkKSB7XG4gICAgdGltZXN0YW1wUyAvPSAxMDAwO1xuICB9XG5cbiAgdmFyIGRlbHRhUyA9IHRpbWVzdGFtcFMgLSB0aGlzLnByZXZpb3VzVGltZXN0YW1wUztcbiAgaWYgKGRlbHRhUyA8PSBVdGlsLk1JTl9USU1FU1RFUCB8fCBkZWx0YVMgPiBVdGlsLk1BWF9USU1FU1RFUCkge1xuICAgIGNvbnNvbGUud2FybignSW52YWxpZCB0aW1lc3RhbXBzIGRldGVjdGVkLiBUaW1lIHN0ZXAgYmV0d2VlbiBzdWNjZXNzaXZlICcgK1xuICAgICAgICAgICAgICAgICAnZ3lyb3Njb3BlIHNlbnNvciBzYW1wbGVzIGlzIHZlcnkgc21hbGwgb3Igbm90IG1vbm90b25pYycpO1xuICAgIHRoaXMucHJldmlvdXNUaW1lc3RhbXBTID0gdGltZXN0YW1wUztcbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5hY2NlbGVyb21ldGVyLnNldCgtYWNjR3Jhdml0eS54LCAtYWNjR3Jhdml0eS55LCAtYWNjR3Jhdml0eS56KTtcbiAgdGhpcy5neXJvc2NvcGUuc2V0KHJvdFJhdGUuYWxwaGEsIHJvdFJhdGUuYmV0YSwgcm90UmF0ZS5nYW1tYSk7XG5cbiAgLy8gV2l0aCBpT1MgYW5kIEZpcmVmb3ggQW5kcm9pZCwgcm90YXRpb25SYXRlIGlzIHJlcG9ydGVkIGluIGRlZ3JlZXMsXG4gIC8vIHNvIHdlIGZpcnN0IGNvbnZlcnQgdG8gcmFkaWFucy5cbiAgaWYgKHRoaXMuaXNJT1MgfHwgdGhpcy5pc0ZpcmVmb3hBbmRyb2lkKSB7XG4gICAgdGhpcy5neXJvc2NvcGUubXVsdGlwbHlTY2FsYXIoTWF0aC5QSSAvIDE4MCk7XG4gIH1cblxuICB0aGlzLmZpbHRlci5hZGRBY2NlbE1lYXN1cmVtZW50KHRoaXMuYWNjZWxlcm9tZXRlciwgdGltZXN0YW1wUyk7XG4gIHRoaXMuZmlsdGVyLmFkZEd5cm9NZWFzdXJlbWVudCh0aGlzLmd5cm9zY29wZSwgdGltZXN0YW1wUyk7XG5cbiAgdGhpcy5wcmV2aW91c1RpbWVzdGFtcFMgPSB0aW1lc3RhbXBTO1xufTtcblxuRnVzaW9uUG9zZVNlbnNvci5wcm90b3R5cGUub25TY3JlZW5PcmllbnRhdGlvbkNoYW5nZV8gPVxuICAgIGZ1bmN0aW9uKHNjcmVlbk9yaWVudGF0aW9uKSB7XG4gIHRoaXMuc2V0U2NyZWVuVHJhbnNmb3JtXygpO1xufTtcblxuRnVzaW9uUG9zZVNlbnNvci5wcm90b3R5cGUuc2V0U2NyZWVuVHJhbnNmb3JtXyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLndvcmxkVG9TY3JlZW5RLnNldCgwLCAwLCAwLCAxKTtcbiAgc3dpdGNoICh3aW5kb3cub3JpZW50YXRpb24pIHtcbiAgICBjYXNlIDA6XG4gICAgICBicmVhaztcbiAgICBjYXNlIDkwOlxuICAgICAgdGhpcy53b3JsZFRvU2NyZWVuUS5zZXRGcm9tQXhpc0FuZ2xlKG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDEpLCAtTWF0aC5QSS8yKTtcbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgLTkwOlxuICAgICAgdGhpcy53b3JsZFRvU2NyZWVuUS5zZXRGcm9tQXhpc0FuZ2xlKG5ldyBUSFJFRS5WZWN0b3IzKDAsIDAsIDEpLCBNYXRoLlBJLzIpO1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAxODA6XG4gICAgICAvLyBUT0RPLlxuICAgICAgYnJlYWs7XG4gIH1cbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBGdXNpb25Qb3NlU2Vuc29yO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbnZhciBNYXRoVXRpbCA9IHJlcXVpcmUoJy4uL21hdGgtdXRpbC5qcycpO1xudmFyIERFQlVHID0gZmFsc2U7XG5cbi8qKlxuICogR2l2ZW4gYW4gb3JpZW50YXRpb24gYW5kIHRoZSBneXJvc2NvcGUgZGF0YSwgcHJlZGljdHMgdGhlIGZ1dHVyZSBvcmllbnRhdGlvblxuICogb2YgdGhlIGhlYWQuIFRoaXMgbWFrZXMgcmVuZGVyaW5nIGFwcGVhciBmYXN0ZXIuXG4gKlxuICogQWxzbyBzZWU6IGh0dHA6Ly9tc2wuY3MudWl1Yy5lZHUvfmxhdmFsbGUvcGFwZXJzL0xhdlllckthdEFudDE0LnBkZlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBwcmVkaWN0aW9uVGltZVMgdGltZSBmcm9tIGhlYWQgbW92ZW1lbnQgdG8gdGhlIGFwcGVhcmFuY2Ugb2ZcbiAqIHRoZSBjb3JyZXNwb25kaW5nIGltYWdlLlxuICovXG5mdW5jdGlvbiBQb3NlUHJlZGljdG9yKHByZWRpY3Rpb25UaW1lUykge1xuICB0aGlzLnByZWRpY3Rpb25UaW1lUyA9IHByZWRpY3Rpb25UaW1lUztcblxuICAvLyBUaGUgcXVhdGVybmlvbiBjb3JyZXNwb25kaW5nIHRvIHRoZSBwcmV2aW91cyBzdGF0ZS5cbiAgdGhpcy5wcmV2aW91c1EgPSBuZXcgTWF0aFV0aWwuUXVhdGVybmlvbigpO1xuICAvLyBQcmV2aW91cyB0aW1lIGEgcHJlZGljdGlvbiBvY2N1cnJlZC5cbiAgdGhpcy5wcmV2aW91c1RpbWVzdGFtcFMgPSBudWxsO1xuXG4gIC8vIFRoZSBkZWx0YSBxdWF0ZXJuaW9uIHRoYXQgYWRqdXN0cyB0aGUgY3VycmVudCBwb3NlLlxuICB0aGlzLmRlbHRhUSA9IG5ldyBNYXRoVXRpbC5RdWF0ZXJuaW9uKCk7XG4gIC8vIFRoZSBvdXRwdXQgcXVhdGVybmlvbi5cbiAgdGhpcy5vdXRRID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbn1cblxuUG9zZVByZWRpY3Rvci5wcm90b3R5cGUuZ2V0UHJlZGljdGlvbiA9IGZ1bmN0aW9uKGN1cnJlbnRRLCBneXJvLCB0aW1lc3RhbXBTKSB7XG4gIGlmICghdGhpcy5wcmV2aW91c1RpbWVzdGFtcFMpIHtcbiAgICB0aGlzLnByZXZpb3VzUS5jb3B5KGN1cnJlbnRRKTtcbiAgICB0aGlzLnByZXZpb3VzVGltZXN0YW1wUyA9IHRpbWVzdGFtcFM7XG4gICAgcmV0dXJuIGN1cnJlbnRRO1xuICB9XG5cbiAgLy8gQ2FsY3VsYXRlIGF4aXMgYW5kIGFuZ2xlIGJhc2VkIG9uIGd5cm9zY29wZSByb3RhdGlvbiByYXRlIGRhdGEuXG4gIHZhciBheGlzID0gbmV3IE1hdGhVdGlsLlZlY3RvcjMoKTtcbiAgYXhpcy5jb3B5KGd5cm8pO1xuICBheGlzLm5vcm1hbGl6ZSgpO1xuXG4gIHZhciBhbmd1bGFyU3BlZWQgPSBneXJvLmxlbmd0aCgpO1xuXG4gIC8vIElmIHdlJ3JlIHJvdGF0aW5nIHNsb3dseSwgZG9uJ3QgZG8gcHJlZGljdGlvbi5cbiAgaWYgKGFuZ3VsYXJTcGVlZCA8IE1hdGhVdGlsLmRlZ1RvUmFkICogMjApIHtcbiAgICBpZiAoREVCVUcpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdNb3Zpbmcgc2xvd2x5LCBhdCAlcyBkZWcvczogbm8gcHJlZGljdGlvbicsXG4gICAgICAgICAgICAgICAgICAoTWF0aFV0aWwucmFkVG9EZWcgKiBhbmd1bGFyU3BlZWQpLnRvRml4ZWQoMSkpO1xuICAgIH1cbiAgICB0aGlzLm91dFEuY29weShjdXJyZW50USk7XG4gICAgdGhpcy5wcmV2aW91c1EuY29weShjdXJyZW50USk7XG4gICAgcmV0dXJuIHRoaXMub3V0UTtcbiAgfVxuXG4gIC8vIEdldCB0aGUgcHJlZGljdGVkIGFuZ2xlIGJhc2VkIG9uIHRoZSB0aW1lIGRlbHRhIGFuZCBsYXRlbmN5LlxuICB2YXIgZGVsdGFUID0gdGltZXN0YW1wUyAtIHRoaXMucHJldmlvdXNUaW1lc3RhbXBTO1xuICB2YXIgcHJlZGljdEFuZ2xlID0gYW5ndWxhclNwZWVkICogdGhpcy5wcmVkaWN0aW9uVGltZVM7XG5cbiAgdGhpcy5kZWx0YVEuc2V0RnJvbUF4aXNBbmdsZShheGlzLCBwcmVkaWN0QW5nbGUpO1xuICB0aGlzLm91dFEuY29weSh0aGlzLnByZXZpb3VzUSk7XG4gIHRoaXMub3V0US5tdWx0aXBseSh0aGlzLmRlbHRhUSk7XG5cbiAgdGhpcy5wcmV2aW91c1EuY29weShjdXJyZW50USk7XG5cbiAgcmV0dXJuIHRoaXMub3V0UTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBQb3NlUHJlZGljdG9yO1xuIiwiZnVuY3Rpb24gU2Vuc29yU2FtcGxlKHNhbXBsZSwgdGltZXN0YW1wUykge1xuICB0aGlzLnNldChzYW1wbGUsIHRpbWVzdGFtcFMpO1xufTtcblxuU2Vuc29yU2FtcGxlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihzYW1wbGUsIHRpbWVzdGFtcFMpIHtcbiAgdGhpcy5zYW1wbGUgPSBzYW1wbGU7XG4gIHRoaXMudGltZXN0YW1wUyA9IHRpbWVzdGFtcFM7XG59O1xuXG5TZW5zb3JTYW1wbGUucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbihzZW5zb3JTYW1wbGUpIHtcbiAgdGhpcy5zZXQoc2Vuc29yU2FtcGxlLnNhbXBsZSwgc2Vuc29yU2FtcGxlLnRpbWVzdGFtcFMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTZW5zb3JTYW1wbGU7XG4iLCIvKlxuICogQSBzdWJzZXQgb2YgVEhSRUUuanMsIHByb3ZpZGluZyBtb3N0bHkgcXVhdGVybmlvbiBhbmQgZXVsZXItcmVsYXRlZFxuICogb3BlcmF0aW9ucywgbWFudWFsbHkgbGlmdGVkIGZyb21cbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9tcmRvb2IvdGhyZWUuanMvdHJlZS9tYXN0ZXIvc3JjL21hdGgsIGFzIG9mIDljMzAyODZiMzhkZjAzOWZjYTM4OTk4OWZmMDZlYTFjMTVkNmJhZDFcbiAqL1xuXG4vLyBPbmx5IHVzZSBpZiB0aGUgcmVhbCBUSFJFRSBpcyBub3QgcHJvdmlkZWQuXG52YXIgVEhSRUUgPSB3aW5kb3cuVEhSRUUgfHwge307XG5cbi8vIElmIHNvbWUgcGllY2Ugb2YgVEhSRUUgaXMgbWlzc2luZywgZmlsbCBpdCBpbiBoZXJlLlxuaWYgKCFUSFJFRS5RdWF0ZXJuaW9uIHx8ICFUSFJFRS5WZWN0b3IzIHx8ICFUSFJFRS5WZWN0b3IyIHx8ICFUSFJFRS5FdWxlciB8fCAhVEhSRUUuTWF0aCkge1xuY29uc29sZS5sb2coJ05vIFRIUkVFLmpzIGZvdW5kLicpO1xuXG5cbi8qKiogU1RBUlQgUXVhdGVybmlvbiAqKiovXG5cbi8qKlxuICogQGF1dGhvciBtaWthZWwgZW10aW5nZXIgLyBodHRwOi8vZ29tby5zZS9cbiAqIEBhdXRob3IgYWx0ZXJlZHEgLyBodHRwOi8vYWx0ZXJlZHF1YWxpYS5jb20vXG4gKiBAYXV0aG9yIFdlc3RMYW5nbGV5IC8gaHR0cDovL2dpdGh1Yi5jb20vV2VzdExhbmdsZXlcbiAqIEBhdXRob3IgYmhvdXN0b24gLyBodHRwOi8vZXhvY29ydGV4LmNvbVxuICovXG5cblRIUkVFLlF1YXRlcm5pb24gPSBmdW5jdGlvbiAoIHgsIHksIHosIHcgKSB7XG5cblx0dGhpcy5feCA9IHggfHwgMDtcblx0dGhpcy5feSA9IHkgfHwgMDtcblx0dGhpcy5feiA9IHogfHwgMDtcblx0dGhpcy5fdyA9ICggdyAhPT0gdW5kZWZpbmVkICkgPyB3IDogMTtcblxufTtcblxuVEhSRUUuUXVhdGVybmlvbi5wcm90b3R5cGUgPSB7XG5cblx0Y29uc3RydWN0b3I6IFRIUkVFLlF1YXRlcm5pb24sXG5cblx0X3g6IDAsX3k6IDAsIF96OiAwLCBfdzogMCxcblxuXHRnZXQgeCAoKSB7XG5cblx0XHRyZXR1cm4gdGhpcy5feDtcblxuXHR9LFxuXG5cdHNldCB4ICggdmFsdWUgKSB7XG5cblx0XHR0aGlzLl94ID0gdmFsdWU7XG5cdFx0dGhpcy5vbkNoYW5nZUNhbGxiYWNrKCk7XG5cblx0fSxcblxuXHRnZXQgeSAoKSB7XG5cblx0XHRyZXR1cm4gdGhpcy5feTtcblxuXHR9LFxuXG5cdHNldCB5ICggdmFsdWUgKSB7XG5cblx0XHR0aGlzLl95ID0gdmFsdWU7XG5cdFx0dGhpcy5vbkNoYW5nZUNhbGxiYWNrKCk7XG5cblx0fSxcblxuXHRnZXQgeiAoKSB7XG5cblx0XHRyZXR1cm4gdGhpcy5fejtcblxuXHR9LFxuXG5cdHNldCB6ICggdmFsdWUgKSB7XG5cblx0XHR0aGlzLl96ID0gdmFsdWU7XG5cdFx0dGhpcy5vbkNoYW5nZUNhbGxiYWNrKCk7XG5cblx0fSxcblxuXHRnZXQgdyAoKSB7XG5cblx0XHRyZXR1cm4gdGhpcy5fdztcblxuXHR9LFxuXG5cdHNldCB3ICggdmFsdWUgKSB7XG5cblx0XHR0aGlzLl93ID0gdmFsdWU7XG5cdFx0dGhpcy5vbkNoYW5nZUNhbGxiYWNrKCk7XG5cblx0fSxcblxuXHRzZXQ6IGZ1bmN0aW9uICggeCwgeSwgeiwgdyApIHtcblxuXHRcdHRoaXMuX3ggPSB4O1xuXHRcdHRoaXMuX3kgPSB5O1xuXHRcdHRoaXMuX3ogPSB6O1xuXHRcdHRoaXMuX3cgPSB3O1xuXG5cdFx0dGhpcy5vbkNoYW5nZUNhbGxiYWNrKCk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdGNvcHk6IGZ1bmN0aW9uICggcXVhdGVybmlvbiApIHtcblxuXHRcdHRoaXMuX3ggPSBxdWF0ZXJuaW9uLng7XG5cdFx0dGhpcy5feSA9IHF1YXRlcm5pb24ueTtcblx0XHR0aGlzLl96ID0gcXVhdGVybmlvbi56O1xuXHRcdHRoaXMuX3cgPSBxdWF0ZXJuaW9uLnc7XG5cblx0XHR0aGlzLm9uQ2hhbmdlQ2FsbGJhY2soKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH0sXG5cblx0c2V0RnJvbUV1bGVyOiBmdW5jdGlvbiAoIGV1bGVyLCB1cGRhdGUgKSB7XG5cblx0XHRpZiAoIGV1bGVyIGluc3RhbmNlb2YgVEhSRUUuRXVsZXIgPT09IGZhbHNlICkge1xuXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoICdUSFJFRS5RdWF0ZXJuaW9uOiAuc2V0RnJvbUV1bGVyKCkgbm93IGV4cGVjdHMgYSBFdWxlciByb3RhdGlvbiByYXRoZXIgdGhhbiBhIFZlY3RvcjMgYW5kIG9yZGVyLicgKTtcblx0XHR9XG5cblx0XHQvLyBodHRwOi8vd3d3Lm1hdGh3b3Jrcy5jb20vbWF0bGFiY2VudHJhbC9maWxlZXhjaGFuZ2UvXG5cdFx0Ly8gXHQyMDY5Ni1mdW5jdGlvbi10by1jb252ZXJ0LWJldHdlZW4tZGNtLWV1bGVyLWFuZ2xlcy1xdWF0ZXJuaW9ucy1hbmQtZXVsZXItdmVjdG9ycy9cblx0XHQvL1x0Y29udGVudC9TcGluQ2FsYy5tXG5cblx0XHR2YXIgYzEgPSBNYXRoLmNvcyggZXVsZXIuX3ggLyAyICk7XG5cdFx0dmFyIGMyID0gTWF0aC5jb3MoIGV1bGVyLl95IC8gMiApO1xuXHRcdHZhciBjMyA9IE1hdGguY29zKCBldWxlci5feiAvIDIgKTtcblx0XHR2YXIgczEgPSBNYXRoLnNpbiggZXVsZXIuX3ggLyAyICk7XG5cdFx0dmFyIHMyID0gTWF0aC5zaW4oIGV1bGVyLl95IC8gMiApO1xuXHRcdHZhciBzMyA9IE1hdGguc2luKCBldWxlci5feiAvIDIgKTtcblxuXHRcdGlmICggZXVsZXIub3JkZXIgPT09ICdYWVonICkge1xuXG5cdFx0XHR0aGlzLl94ID0gczEgKiBjMiAqIGMzICsgYzEgKiBzMiAqIHMzO1xuXHRcdFx0dGhpcy5feSA9IGMxICogczIgKiBjMyAtIHMxICogYzIgKiBzMztcblx0XHRcdHRoaXMuX3ogPSBjMSAqIGMyICogczMgKyBzMSAqIHMyICogYzM7XG5cdFx0XHR0aGlzLl93ID0gYzEgKiBjMiAqIGMzIC0gczEgKiBzMiAqIHMzO1xuXG5cdFx0fSBlbHNlIGlmICggZXVsZXIub3JkZXIgPT09ICdZWFonICkge1xuXG5cdFx0XHR0aGlzLl94ID0gczEgKiBjMiAqIGMzICsgYzEgKiBzMiAqIHMzO1xuXHRcdFx0dGhpcy5feSA9IGMxICogczIgKiBjMyAtIHMxICogYzIgKiBzMztcblx0XHRcdHRoaXMuX3ogPSBjMSAqIGMyICogczMgLSBzMSAqIHMyICogYzM7XG5cdFx0XHR0aGlzLl93ID0gYzEgKiBjMiAqIGMzICsgczEgKiBzMiAqIHMzO1xuXG5cdFx0fSBlbHNlIGlmICggZXVsZXIub3JkZXIgPT09ICdaWFknICkge1xuXG5cdFx0XHR0aGlzLl94ID0gczEgKiBjMiAqIGMzIC0gYzEgKiBzMiAqIHMzO1xuXHRcdFx0dGhpcy5feSA9IGMxICogczIgKiBjMyArIHMxICogYzIgKiBzMztcblx0XHRcdHRoaXMuX3ogPSBjMSAqIGMyICogczMgKyBzMSAqIHMyICogYzM7XG5cdFx0XHR0aGlzLl93ID0gYzEgKiBjMiAqIGMzIC0gczEgKiBzMiAqIHMzO1xuXG5cdFx0fSBlbHNlIGlmICggZXVsZXIub3JkZXIgPT09ICdaWVgnICkge1xuXG5cdFx0XHR0aGlzLl94ID0gczEgKiBjMiAqIGMzIC0gYzEgKiBzMiAqIHMzO1xuXHRcdFx0dGhpcy5feSA9IGMxICogczIgKiBjMyArIHMxICogYzIgKiBzMztcblx0XHRcdHRoaXMuX3ogPSBjMSAqIGMyICogczMgLSBzMSAqIHMyICogYzM7XG5cdFx0XHR0aGlzLl93ID0gYzEgKiBjMiAqIGMzICsgczEgKiBzMiAqIHMzO1xuXG5cdFx0fSBlbHNlIGlmICggZXVsZXIub3JkZXIgPT09ICdZWlgnICkge1xuXG5cdFx0XHR0aGlzLl94ID0gczEgKiBjMiAqIGMzICsgYzEgKiBzMiAqIHMzO1xuXHRcdFx0dGhpcy5feSA9IGMxICogczIgKiBjMyArIHMxICogYzIgKiBzMztcblx0XHRcdHRoaXMuX3ogPSBjMSAqIGMyICogczMgLSBzMSAqIHMyICogYzM7XG5cdFx0XHR0aGlzLl93ID0gYzEgKiBjMiAqIGMzIC0gczEgKiBzMiAqIHMzO1xuXG5cdFx0fSBlbHNlIGlmICggZXVsZXIub3JkZXIgPT09ICdYWlknICkge1xuXG5cdFx0XHR0aGlzLl94ID0gczEgKiBjMiAqIGMzIC0gYzEgKiBzMiAqIHMzO1xuXHRcdFx0dGhpcy5feSA9IGMxICogczIgKiBjMyAtIHMxICogYzIgKiBzMztcblx0XHRcdHRoaXMuX3ogPSBjMSAqIGMyICogczMgKyBzMSAqIHMyICogYzM7XG5cdFx0XHR0aGlzLl93ID0gYzEgKiBjMiAqIGMzICsgczEgKiBzMiAqIHMzO1xuXG5cdFx0fVxuXG5cdFx0aWYgKCB1cGRhdGUgIT09IGZhbHNlICkgdGhpcy5vbkNoYW5nZUNhbGxiYWNrKCk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdHNldEZyb21BeGlzQW5nbGU6IGZ1bmN0aW9uICggYXhpcywgYW5nbGUgKSB7XG5cblx0XHQvLyBodHRwOi8vd3d3LmV1Y2xpZGVhbnNwYWNlLmNvbS9tYXRocy9nZW9tZXRyeS9yb3RhdGlvbnMvY29udmVyc2lvbnMvYW5nbGVUb1F1YXRlcm5pb24vaW5kZXguaHRtXG5cblx0XHQvLyBhc3N1bWVzIGF4aXMgaXMgbm9ybWFsaXplZFxuXG5cdFx0dmFyIGhhbGZBbmdsZSA9IGFuZ2xlIC8gMiwgcyA9IE1hdGguc2luKCBoYWxmQW5nbGUgKTtcblxuXHRcdHRoaXMuX3ggPSBheGlzLnggKiBzO1xuXHRcdHRoaXMuX3kgPSBheGlzLnkgKiBzO1xuXHRcdHRoaXMuX3ogPSBheGlzLnogKiBzO1xuXHRcdHRoaXMuX3cgPSBNYXRoLmNvcyggaGFsZkFuZ2xlICk7XG5cblx0XHR0aGlzLm9uQ2hhbmdlQ2FsbGJhY2soKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH0sXG5cblx0c2V0RnJvbVJvdGF0aW9uTWF0cml4OiBmdW5jdGlvbiAoIG0gKSB7XG5cblx0XHQvLyBodHRwOi8vd3d3LmV1Y2xpZGVhbnNwYWNlLmNvbS9tYXRocy9nZW9tZXRyeS9yb3RhdGlvbnMvY29udmVyc2lvbnMvbWF0cml4VG9RdWF0ZXJuaW9uL2luZGV4Lmh0bVxuXG5cdFx0Ly8gYXNzdW1lcyB0aGUgdXBwZXIgM3gzIG9mIG0gaXMgYSBwdXJlIHJvdGF0aW9uIG1hdHJpeCAoaS5lLCB1bnNjYWxlZClcblxuXHRcdHZhciB0ZSA9IG0uZWxlbWVudHMsXG5cblx0XHRcdG0xMSA9IHRlWyAwIF0sIG0xMiA9IHRlWyA0IF0sIG0xMyA9IHRlWyA4IF0sXG5cdFx0XHRtMjEgPSB0ZVsgMSBdLCBtMjIgPSB0ZVsgNSBdLCBtMjMgPSB0ZVsgOSBdLFxuXHRcdFx0bTMxID0gdGVbIDIgXSwgbTMyID0gdGVbIDYgXSwgbTMzID0gdGVbIDEwIF0sXG5cblx0XHRcdHRyYWNlID0gbTExICsgbTIyICsgbTMzLFxuXHRcdFx0cztcblxuXHRcdGlmICggdHJhY2UgPiAwICkge1xuXG5cdFx0XHRzID0gMC41IC8gTWF0aC5zcXJ0KCB0cmFjZSArIDEuMCApO1xuXG5cdFx0XHR0aGlzLl93ID0gMC4yNSAvIHM7XG5cdFx0XHR0aGlzLl94ID0gKCBtMzIgLSBtMjMgKSAqIHM7XG5cdFx0XHR0aGlzLl95ID0gKCBtMTMgLSBtMzEgKSAqIHM7XG5cdFx0XHR0aGlzLl96ID0gKCBtMjEgLSBtMTIgKSAqIHM7XG5cblx0XHR9IGVsc2UgaWYgKCBtMTEgPiBtMjIgJiYgbTExID4gbTMzICkge1xuXG5cdFx0XHRzID0gMi4wICogTWF0aC5zcXJ0KCAxLjAgKyBtMTEgLSBtMjIgLSBtMzMgKTtcblxuXHRcdFx0dGhpcy5fdyA9ICggbTMyIC0gbTIzICkgLyBzO1xuXHRcdFx0dGhpcy5feCA9IDAuMjUgKiBzO1xuXHRcdFx0dGhpcy5feSA9ICggbTEyICsgbTIxICkgLyBzO1xuXHRcdFx0dGhpcy5feiA9ICggbTEzICsgbTMxICkgLyBzO1xuXG5cdFx0fSBlbHNlIGlmICggbTIyID4gbTMzICkge1xuXG5cdFx0XHRzID0gMi4wICogTWF0aC5zcXJ0KCAxLjAgKyBtMjIgLSBtMTEgLSBtMzMgKTtcblxuXHRcdFx0dGhpcy5fdyA9ICggbTEzIC0gbTMxICkgLyBzO1xuXHRcdFx0dGhpcy5feCA9ICggbTEyICsgbTIxICkgLyBzO1xuXHRcdFx0dGhpcy5feSA9IDAuMjUgKiBzO1xuXHRcdFx0dGhpcy5feiA9ICggbTIzICsgbTMyICkgLyBzO1xuXG5cdFx0fSBlbHNlIHtcblxuXHRcdFx0cyA9IDIuMCAqIE1hdGguc3FydCggMS4wICsgbTMzIC0gbTExIC0gbTIyICk7XG5cblx0XHRcdHRoaXMuX3cgPSAoIG0yMSAtIG0xMiApIC8gcztcblx0XHRcdHRoaXMuX3ggPSAoIG0xMyArIG0zMSApIC8gcztcblx0XHRcdHRoaXMuX3kgPSAoIG0yMyArIG0zMiApIC8gcztcblx0XHRcdHRoaXMuX3ogPSAwLjI1ICogcztcblxuXHRcdH1cblxuXHRcdHRoaXMub25DaGFuZ2VDYWxsYmFjaygpO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRzZXRGcm9tVW5pdFZlY3RvcnM6IGZ1bmN0aW9uICgpIHtcblxuXHRcdC8vIGh0dHA6Ly9sb2xlbmdpbmUubmV0L2Jsb2cvMjAxNC8wMi8yNC9xdWF0ZXJuaW9uLWZyb20tdHdvLXZlY3RvcnMtZmluYWxcblxuXHRcdC8vIGFzc3VtZXMgZGlyZWN0aW9uIHZlY3RvcnMgdkZyb20gYW5kIHZUbyBhcmUgbm9ybWFsaXplZFxuXG5cdFx0dmFyIHYxLCByO1xuXG5cdFx0dmFyIEVQUyA9IDAuMDAwMDAxO1xuXG5cdFx0cmV0dXJuIGZ1bmN0aW9uICggdkZyb20sIHZUbyApIHtcblxuXHRcdFx0aWYgKCB2MSA9PT0gdW5kZWZpbmVkICkgdjEgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG5cdFx0XHRyID0gdkZyb20uZG90KCB2VG8gKSArIDE7XG5cblx0XHRcdGlmICggciA8IEVQUyApIHtcblxuXHRcdFx0XHRyID0gMDtcblxuXHRcdFx0XHRpZiAoIE1hdGguYWJzKCB2RnJvbS54ICkgPiBNYXRoLmFicyggdkZyb20ueiApICkge1xuXG5cdFx0XHRcdFx0djEuc2V0KCAtIHZGcm9tLnksIHZGcm9tLngsIDAgKTtcblxuXHRcdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdFx0djEuc2V0KCAwLCAtIHZGcm9tLnosIHZGcm9tLnkgKTtcblxuXHRcdFx0XHR9XG5cblx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0djEuY3Jvc3NWZWN0b3JzKCB2RnJvbSwgdlRvICk7XG5cblx0XHRcdH1cblxuXHRcdFx0dGhpcy5feCA9IHYxLng7XG5cdFx0XHR0aGlzLl95ID0gdjEueTtcblx0XHRcdHRoaXMuX3ogPSB2MS56O1xuXHRcdFx0dGhpcy5fdyA9IHI7XG5cblx0XHRcdHRoaXMubm9ybWFsaXplKCk7XG5cblx0XHRcdHJldHVybiB0aGlzO1xuXG5cdFx0fVxuXG5cdH0oKSxcblxuXHRpbnZlcnNlOiBmdW5jdGlvbiAoKSB7XG5cblx0XHR0aGlzLmNvbmp1Z2F0ZSgpLm5vcm1hbGl6ZSgpO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRjb25qdWdhdGU6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHRoaXMuX3ggKj0gLSAxO1xuXHRcdHRoaXMuX3kgKj0gLSAxO1xuXHRcdHRoaXMuX3ogKj0gLSAxO1xuXG5cdFx0dGhpcy5vbkNoYW5nZUNhbGxiYWNrKCk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdGRvdDogZnVuY3Rpb24gKCB2ICkge1xuXG5cdFx0cmV0dXJuIHRoaXMuX3ggKiB2Ll94ICsgdGhpcy5feSAqIHYuX3kgKyB0aGlzLl96ICogdi5feiArIHRoaXMuX3cgKiB2Ll93O1xuXG5cdH0sXG5cblx0bGVuZ3RoU3E6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHJldHVybiB0aGlzLl94ICogdGhpcy5feCArIHRoaXMuX3kgKiB0aGlzLl95ICsgdGhpcy5feiAqIHRoaXMuX3ogKyB0aGlzLl93ICogdGhpcy5fdztcblxuXHR9LFxuXG5cdGxlbmd0aDogZnVuY3Rpb24gKCkge1xuXG5cdFx0cmV0dXJuIE1hdGguc3FydCggdGhpcy5feCAqIHRoaXMuX3ggKyB0aGlzLl95ICogdGhpcy5feSArIHRoaXMuX3ogKiB0aGlzLl96ICsgdGhpcy5fdyAqIHRoaXMuX3cgKTtcblxuXHR9LFxuXG5cdG5vcm1hbGl6ZTogZnVuY3Rpb24gKCkge1xuXG5cdFx0dmFyIGwgPSB0aGlzLmxlbmd0aCgpO1xuXG5cdFx0aWYgKCBsID09PSAwICkge1xuXG5cdFx0XHR0aGlzLl94ID0gMDtcblx0XHRcdHRoaXMuX3kgPSAwO1xuXHRcdFx0dGhpcy5feiA9IDA7XG5cdFx0XHR0aGlzLl93ID0gMTtcblxuXHRcdH0gZWxzZSB7XG5cblx0XHRcdGwgPSAxIC8gbDtcblxuXHRcdFx0dGhpcy5feCA9IHRoaXMuX3ggKiBsO1xuXHRcdFx0dGhpcy5feSA9IHRoaXMuX3kgKiBsO1xuXHRcdFx0dGhpcy5feiA9IHRoaXMuX3ogKiBsO1xuXHRcdFx0dGhpcy5fdyA9IHRoaXMuX3cgKiBsO1xuXG5cdFx0fVxuXG5cdFx0dGhpcy5vbkNoYW5nZUNhbGxiYWNrKCk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdG11bHRpcGx5OiBmdW5jdGlvbiAoIHEsIHAgKSB7XG5cblx0XHRpZiAoIHAgIT09IHVuZGVmaW5lZCApIHtcblxuXHRcdFx0Y29uc29sZS53YXJuKCAnVEhSRUUuUXVhdGVybmlvbjogLm11bHRpcGx5KCkgbm93IG9ubHkgYWNjZXB0cyBvbmUgYXJndW1lbnQuIFVzZSAubXVsdGlwbHlRdWF0ZXJuaW9ucyggYSwgYiApIGluc3RlYWQuJyApO1xuXHRcdFx0cmV0dXJuIHRoaXMubXVsdGlwbHlRdWF0ZXJuaW9ucyggcSwgcCApO1xuXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXMubXVsdGlwbHlRdWF0ZXJuaW9ucyggdGhpcywgcSApO1xuXG5cdH0sXG5cblx0bXVsdGlwbHlRdWF0ZXJuaW9uczogZnVuY3Rpb24gKCBhLCBiICkge1xuXG5cdFx0Ly8gZnJvbSBodHRwOi8vd3d3LmV1Y2xpZGVhbnNwYWNlLmNvbS9tYXRocy9hbGdlYnJhL3JlYWxOb3JtZWRBbGdlYnJhL3F1YXRlcm5pb25zL2NvZGUvaW5kZXguaHRtXG5cblx0XHR2YXIgcWF4ID0gYS5feCwgcWF5ID0gYS5feSwgcWF6ID0gYS5feiwgcWF3ID0gYS5fdztcblx0XHR2YXIgcWJ4ID0gYi5feCwgcWJ5ID0gYi5feSwgcWJ6ID0gYi5feiwgcWJ3ID0gYi5fdztcblxuXHRcdHRoaXMuX3ggPSBxYXggKiBxYncgKyBxYXcgKiBxYnggKyBxYXkgKiBxYnogLSBxYXogKiBxYnk7XG5cdFx0dGhpcy5feSA9IHFheSAqIHFidyArIHFhdyAqIHFieSArIHFheiAqIHFieCAtIHFheCAqIHFiejtcblx0XHR0aGlzLl96ID0gcWF6ICogcWJ3ICsgcWF3ICogcWJ6ICsgcWF4ICogcWJ5IC0gcWF5ICogcWJ4O1xuXHRcdHRoaXMuX3cgPSBxYXcgKiBxYncgLSBxYXggKiBxYnggLSBxYXkgKiBxYnkgLSBxYXogKiBxYno7XG5cblx0XHR0aGlzLm9uQ2hhbmdlQ2FsbGJhY2soKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH0sXG5cblx0bXVsdGlwbHlWZWN0b3IzOiBmdW5jdGlvbiAoIHZlY3RvciApIHtcblxuXHRcdGNvbnNvbGUud2FybiggJ1RIUkVFLlF1YXRlcm5pb246IC5tdWx0aXBseVZlY3RvcjMoKSBoYXMgYmVlbiByZW1vdmVkLiBVc2UgaXMgbm93IHZlY3Rvci5hcHBseVF1YXRlcm5pb24oIHF1YXRlcm5pb24gKSBpbnN0ZWFkLicgKTtcblx0XHRyZXR1cm4gdmVjdG9yLmFwcGx5UXVhdGVybmlvbiggdGhpcyApO1xuXG5cdH0sXG5cblx0c2xlcnA6IGZ1bmN0aW9uICggcWIsIHQgKSB7XG5cblx0XHRpZiAoIHQgPT09IDAgKSByZXR1cm4gdGhpcztcblx0XHRpZiAoIHQgPT09IDEgKSByZXR1cm4gdGhpcy5jb3B5KCBxYiApO1xuXG5cdFx0dmFyIHggPSB0aGlzLl94LCB5ID0gdGhpcy5feSwgeiA9IHRoaXMuX3osIHcgPSB0aGlzLl93O1xuXG5cdFx0Ly8gaHR0cDovL3d3dy5ldWNsaWRlYW5zcGFjZS5jb20vbWF0aHMvYWxnZWJyYS9yZWFsTm9ybWVkQWxnZWJyYS9xdWF0ZXJuaW9ucy9zbGVycC9cblxuXHRcdHZhciBjb3NIYWxmVGhldGEgPSB3ICogcWIuX3cgKyB4ICogcWIuX3ggKyB5ICogcWIuX3kgKyB6ICogcWIuX3o7XG5cblx0XHRpZiAoIGNvc0hhbGZUaGV0YSA8IDAgKSB7XG5cblx0XHRcdHRoaXMuX3cgPSAtIHFiLl93O1xuXHRcdFx0dGhpcy5feCA9IC0gcWIuX3g7XG5cdFx0XHR0aGlzLl95ID0gLSBxYi5feTtcblx0XHRcdHRoaXMuX3ogPSAtIHFiLl96O1xuXG5cdFx0XHRjb3NIYWxmVGhldGEgPSAtIGNvc0hhbGZUaGV0YTtcblxuXHRcdH0gZWxzZSB7XG5cblx0XHRcdHRoaXMuY29weSggcWIgKTtcblxuXHRcdH1cblxuXHRcdGlmICggY29zSGFsZlRoZXRhID49IDEuMCApIHtcblxuXHRcdFx0dGhpcy5fdyA9IHc7XG5cdFx0XHR0aGlzLl94ID0geDtcblx0XHRcdHRoaXMuX3kgPSB5O1xuXHRcdFx0dGhpcy5feiA9IHo7XG5cblx0XHRcdHJldHVybiB0aGlzO1xuXG5cdFx0fVxuXG5cdFx0dmFyIGhhbGZUaGV0YSA9IE1hdGguYWNvcyggY29zSGFsZlRoZXRhICk7XG5cdFx0dmFyIHNpbkhhbGZUaGV0YSA9IE1hdGguc3FydCggMS4wIC0gY29zSGFsZlRoZXRhICogY29zSGFsZlRoZXRhICk7XG5cblx0XHRpZiAoIE1hdGguYWJzKCBzaW5IYWxmVGhldGEgKSA8IDAuMDAxICkge1xuXG5cdFx0XHR0aGlzLl93ID0gMC41ICogKCB3ICsgdGhpcy5fdyApO1xuXHRcdFx0dGhpcy5feCA9IDAuNSAqICggeCArIHRoaXMuX3ggKTtcblx0XHRcdHRoaXMuX3kgPSAwLjUgKiAoIHkgKyB0aGlzLl95ICk7XG5cdFx0XHR0aGlzLl96ID0gMC41ICogKCB6ICsgdGhpcy5feiApO1xuXG5cdFx0XHRyZXR1cm4gdGhpcztcblxuXHRcdH1cblxuXHRcdHZhciByYXRpb0EgPSBNYXRoLnNpbiggKCAxIC0gdCApICogaGFsZlRoZXRhICkgLyBzaW5IYWxmVGhldGEsXG5cdFx0cmF0aW9CID0gTWF0aC5zaW4oIHQgKiBoYWxmVGhldGEgKSAvIHNpbkhhbGZUaGV0YTtcblxuXHRcdHRoaXMuX3cgPSAoIHcgKiByYXRpb0EgKyB0aGlzLl93ICogcmF0aW9CICk7XG5cdFx0dGhpcy5feCA9ICggeCAqIHJhdGlvQSArIHRoaXMuX3ggKiByYXRpb0IgKTtcblx0XHR0aGlzLl95ID0gKCB5ICogcmF0aW9BICsgdGhpcy5feSAqIHJhdGlvQiApO1xuXHRcdHRoaXMuX3ogPSAoIHogKiByYXRpb0EgKyB0aGlzLl96ICogcmF0aW9CICk7XG5cblx0XHR0aGlzLm9uQ2hhbmdlQ2FsbGJhY2soKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH0sXG5cblx0ZXF1YWxzOiBmdW5jdGlvbiAoIHF1YXRlcm5pb24gKSB7XG5cblx0XHRyZXR1cm4gKCBxdWF0ZXJuaW9uLl94ID09PSB0aGlzLl94ICkgJiYgKCBxdWF0ZXJuaW9uLl95ID09PSB0aGlzLl95ICkgJiYgKCBxdWF0ZXJuaW9uLl96ID09PSB0aGlzLl96ICkgJiYgKCBxdWF0ZXJuaW9uLl93ID09PSB0aGlzLl93ICk7XG5cblx0fSxcblxuXHRmcm9tQXJyYXk6IGZ1bmN0aW9uICggYXJyYXksIG9mZnNldCApIHtcblxuXHRcdGlmICggb2Zmc2V0ID09PSB1bmRlZmluZWQgKSBvZmZzZXQgPSAwO1xuXG5cdFx0dGhpcy5feCA9IGFycmF5WyBvZmZzZXQgXTtcblx0XHR0aGlzLl95ID0gYXJyYXlbIG9mZnNldCArIDEgXTtcblx0XHR0aGlzLl96ID0gYXJyYXlbIG9mZnNldCArIDIgXTtcblx0XHR0aGlzLl93ID0gYXJyYXlbIG9mZnNldCArIDMgXTtcblxuXHRcdHRoaXMub25DaGFuZ2VDYWxsYmFjaygpO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHR0b0FycmF5OiBmdW5jdGlvbiAoIGFycmF5LCBvZmZzZXQgKSB7XG5cblx0XHRpZiAoIGFycmF5ID09PSB1bmRlZmluZWQgKSBhcnJheSA9IFtdO1xuXHRcdGlmICggb2Zmc2V0ID09PSB1bmRlZmluZWQgKSBvZmZzZXQgPSAwO1xuXG5cdFx0YXJyYXlbIG9mZnNldCBdID0gdGhpcy5feDtcblx0XHRhcnJheVsgb2Zmc2V0ICsgMSBdID0gdGhpcy5feTtcblx0XHRhcnJheVsgb2Zmc2V0ICsgMiBdID0gdGhpcy5fejtcblx0XHRhcnJheVsgb2Zmc2V0ICsgMyBdID0gdGhpcy5fdztcblxuXHRcdHJldHVybiBhcnJheTtcblxuXHR9LFxuXG5cdG9uQ2hhbmdlOiBmdW5jdGlvbiAoIGNhbGxiYWNrICkge1xuXG5cdFx0dGhpcy5vbkNoYW5nZUNhbGxiYWNrID0gY2FsbGJhY2s7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdG9uQ2hhbmdlQ2FsbGJhY2s6IGZ1bmN0aW9uICgpIHt9LFxuXG5cdGNsb25lOiBmdW5jdGlvbiAoKSB7XG5cblx0XHRyZXR1cm4gbmV3IFRIUkVFLlF1YXRlcm5pb24oIHRoaXMuX3gsIHRoaXMuX3ksIHRoaXMuX3osIHRoaXMuX3cgKTtcblxuXHR9XG5cbn07XG5cblRIUkVFLlF1YXRlcm5pb24uc2xlcnAgPSBmdW5jdGlvbiAoIHFhLCBxYiwgcW0sIHQgKSB7XG5cblx0cmV0dXJuIHFtLmNvcHkoIHFhICkuc2xlcnAoIHFiLCB0ICk7XG5cbn1cblxuLyoqKiBFTkQgUXVhdGVybmlvbiAqKiovXG4vKioqIFNUQVJUIFZlY3RvcjIgKioqL1xuLyoqXG4gKiBAYXV0aG9yIG1yZG9vYiAvIGh0dHA6Ly9tcmRvb2IuY29tL1xuICogQGF1dGhvciBwaGlsb2diIC8gaHR0cDovL2Jsb2cudGhlaml0Lm9yZy9cbiAqIEBhdXRob3IgZWdyYWV0aGVyIC8gaHR0cDovL2VncmFldGhlci5jb20vXG4gKiBAYXV0aG9yIHp6ODUgLyBodHRwOi8vd3d3LmxhYjRnYW1lcy5uZXQveno4NS9ibG9nXG4gKi9cblxuVEhSRUUuVmVjdG9yMiA9IGZ1bmN0aW9uICggeCwgeSApIHtcblxuXHR0aGlzLnggPSB4IHx8IDA7XG5cdHRoaXMueSA9IHkgfHwgMDtcblxufTtcblxuVEhSRUUuVmVjdG9yMi5wcm90b3R5cGUgPSB7XG5cblx0Y29uc3RydWN0b3I6IFRIUkVFLlZlY3RvcjIsXG5cblx0c2V0OiBmdW5jdGlvbiAoIHgsIHkgKSB7XG5cblx0XHR0aGlzLnggPSB4O1xuXHRcdHRoaXMueSA9IHk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdHNldFg6IGZ1bmN0aW9uICggeCApIHtcblxuXHRcdHRoaXMueCA9IHg7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdHNldFk6IGZ1bmN0aW9uICggeSApIHtcblxuXHRcdHRoaXMueSA9IHk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdHNldENvbXBvbmVudDogZnVuY3Rpb24gKCBpbmRleCwgdmFsdWUgKSB7XG5cblx0XHRzd2l0Y2ggKCBpbmRleCApIHtcblxuXHRcdFx0Y2FzZSAwOiB0aGlzLnggPSB2YWx1ZTsgYnJlYWs7XG5cdFx0XHRjYXNlIDE6IHRoaXMueSA9IHZhbHVlOyBicmVhaztcblx0XHRcdGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvciggJ2luZGV4IGlzIG91dCBvZiByYW5nZTogJyArIGluZGV4ICk7XG5cblx0XHR9XG5cblx0fSxcblxuXHRnZXRDb21wb25lbnQ6IGZ1bmN0aW9uICggaW5kZXggKSB7XG5cblx0XHRzd2l0Y2ggKCBpbmRleCApIHtcblxuXHRcdFx0Y2FzZSAwOiByZXR1cm4gdGhpcy54O1xuXHRcdFx0Y2FzZSAxOiByZXR1cm4gdGhpcy55O1xuXHRcdFx0ZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKCAnaW5kZXggaXMgb3V0IG9mIHJhbmdlOiAnICsgaW5kZXggKTtcblxuXHRcdH1cblxuXHR9LFxuXG5cdGNvcHk6IGZ1bmN0aW9uICggdiApIHtcblxuXHRcdHRoaXMueCA9IHYueDtcblx0XHR0aGlzLnkgPSB2Lnk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdGFkZDogZnVuY3Rpb24gKCB2LCB3ICkge1xuXG5cdFx0aWYgKCB3ICE9PSB1bmRlZmluZWQgKSB7XG5cblx0XHRcdGNvbnNvbGUud2FybiggJ1RIUkVFLlZlY3RvcjI6IC5hZGQoKSBub3cgb25seSBhY2NlcHRzIG9uZSBhcmd1bWVudC4gVXNlIC5hZGRWZWN0b3JzKCBhLCBiICkgaW5zdGVhZC4nICk7XG5cdFx0XHRyZXR1cm4gdGhpcy5hZGRWZWN0b3JzKCB2LCB3ICk7XG5cblx0XHR9XG5cblx0XHR0aGlzLnggKz0gdi54O1xuXHRcdHRoaXMueSArPSB2Lnk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdGFkZFZlY3RvcnM6IGZ1bmN0aW9uICggYSwgYiApIHtcblxuXHRcdHRoaXMueCA9IGEueCArIGIueDtcblx0XHR0aGlzLnkgPSBhLnkgKyBiLnk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdGFkZFNjYWxhcjogZnVuY3Rpb24gKCBzICkge1xuXG5cdFx0dGhpcy54ICs9IHM7XG5cdFx0dGhpcy55ICs9IHM7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdHN1YjogZnVuY3Rpb24gKCB2LCB3ICkge1xuXG5cdFx0aWYgKCB3ICE9PSB1bmRlZmluZWQgKSB7XG5cblx0XHRcdGNvbnNvbGUud2FybiggJ1RIUkVFLlZlY3RvcjI6IC5zdWIoKSBub3cgb25seSBhY2NlcHRzIG9uZSBhcmd1bWVudC4gVXNlIC5zdWJWZWN0b3JzKCBhLCBiICkgaW5zdGVhZC4nICk7XG5cdFx0XHRyZXR1cm4gdGhpcy5zdWJWZWN0b3JzKCB2LCB3ICk7XG5cblx0XHR9XG5cblx0XHR0aGlzLnggLT0gdi54O1xuXHRcdHRoaXMueSAtPSB2Lnk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdHN1YlZlY3RvcnM6IGZ1bmN0aW9uICggYSwgYiApIHtcblxuXHRcdHRoaXMueCA9IGEueCAtIGIueDtcblx0XHR0aGlzLnkgPSBhLnkgLSBiLnk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdG11bHRpcGx5OiBmdW5jdGlvbiAoIHYgKSB7XG5cblx0XHR0aGlzLnggKj0gdi54O1xuXHRcdHRoaXMueSAqPSB2Lnk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdG11bHRpcGx5U2NhbGFyOiBmdW5jdGlvbiAoIHMgKSB7XG5cblx0XHR0aGlzLnggKj0gcztcblx0XHR0aGlzLnkgKj0gcztcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH0sXG5cblx0ZGl2aWRlOiBmdW5jdGlvbiAoIHYgKSB7XG5cblx0XHR0aGlzLnggLz0gdi54O1xuXHRcdHRoaXMueSAvPSB2Lnk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdGRpdmlkZVNjYWxhcjogZnVuY3Rpb24gKCBzY2FsYXIgKSB7XG5cblx0XHRpZiAoIHNjYWxhciAhPT0gMCApIHtcblxuXHRcdFx0dmFyIGludlNjYWxhciA9IDEgLyBzY2FsYXI7XG5cblx0XHRcdHRoaXMueCAqPSBpbnZTY2FsYXI7XG5cdFx0XHR0aGlzLnkgKj0gaW52U2NhbGFyO1xuXG5cdFx0fSBlbHNlIHtcblxuXHRcdFx0dGhpcy54ID0gMDtcblx0XHRcdHRoaXMueSA9IDA7XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdG1pbjogZnVuY3Rpb24gKCB2ICkge1xuXG5cdFx0aWYgKCB0aGlzLnggPiB2LnggKSB7XG5cblx0XHRcdHRoaXMueCA9IHYueDtcblxuXHRcdH1cblxuXHRcdGlmICggdGhpcy55ID4gdi55ICkge1xuXG5cdFx0XHR0aGlzLnkgPSB2Lnk7XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdG1heDogZnVuY3Rpb24gKCB2ICkge1xuXG5cdFx0aWYgKCB0aGlzLnggPCB2LnggKSB7XG5cblx0XHRcdHRoaXMueCA9IHYueDtcblxuXHRcdH1cblxuXHRcdGlmICggdGhpcy55IDwgdi55ICkge1xuXG5cdFx0XHR0aGlzLnkgPSB2Lnk7XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdGNsYW1wOiBmdW5jdGlvbiAoIG1pbiwgbWF4ICkge1xuXG5cdFx0Ly8gVGhpcyBmdW5jdGlvbiBhc3N1bWVzIG1pbiA8IG1heCwgaWYgdGhpcyBhc3N1bXB0aW9uIGlzbid0IHRydWUgaXQgd2lsbCBub3Qgb3BlcmF0ZSBjb3JyZWN0bHlcblxuXHRcdGlmICggdGhpcy54IDwgbWluLnggKSB7XG5cblx0XHRcdHRoaXMueCA9IG1pbi54O1xuXG5cdFx0fSBlbHNlIGlmICggdGhpcy54ID4gbWF4LnggKSB7XG5cblx0XHRcdHRoaXMueCA9IG1heC54O1xuXG5cdFx0fVxuXG5cdFx0aWYgKCB0aGlzLnkgPCBtaW4ueSApIHtcblxuXHRcdFx0dGhpcy55ID0gbWluLnk7XG5cblx0XHR9IGVsc2UgaWYgKCB0aGlzLnkgPiBtYXgueSApIHtcblxuXHRcdFx0dGhpcy55ID0gbWF4Lnk7XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXHRjbGFtcFNjYWxhcjogKCBmdW5jdGlvbiAoKSB7XG5cblx0XHR2YXIgbWluLCBtYXg7XG5cblx0XHRyZXR1cm4gZnVuY3Rpb24gKCBtaW5WYWwsIG1heFZhbCApIHtcblxuXHRcdFx0aWYgKCBtaW4gPT09IHVuZGVmaW5lZCApIHtcblxuXHRcdFx0XHRtaW4gPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuXHRcdFx0XHRtYXggPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuXG5cdFx0XHR9XG5cblx0XHRcdG1pbi5zZXQoIG1pblZhbCwgbWluVmFsICk7XG5cdFx0XHRtYXguc2V0KCBtYXhWYWwsIG1heFZhbCApO1xuXG5cdFx0XHRyZXR1cm4gdGhpcy5jbGFtcCggbWluLCBtYXggKTtcblxuXHRcdH07XG5cblx0fSApKCksXG5cblx0Zmxvb3I6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHRoaXMueCA9IE1hdGguZmxvb3IoIHRoaXMueCApO1xuXHRcdHRoaXMueSA9IE1hdGguZmxvb3IoIHRoaXMueSApO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRjZWlsOiBmdW5jdGlvbiAoKSB7XG5cblx0XHR0aGlzLnggPSBNYXRoLmNlaWwoIHRoaXMueCApO1xuXHRcdHRoaXMueSA9IE1hdGguY2VpbCggdGhpcy55ICk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdHJvdW5kOiBmdW5jdGlvbiAoKSB7XG5cblx0XHR0aGlzLnggPSBNYXRoLnJvdW5kKCB0aGlzLnggKTtcblx0XHR0aGlzLnkgPSBNYXRoLnJvdW5kKCB0aGlzLnkgKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH0sXG5cblx0cm91bmRUb1plcm86IGZ1bmN0aW9uICgpIHtcblxuXHRcdHRoaXMueCA9ICggdGhpcy54IDwgMCApID8gTWF0aC5jZWlsKCB0aGlzLnggKSA6IE1hdGguZmxvb3IoIHRoaXMueCApO1xuXHRcdHRoaXMueSA9ICggdGhpcy55IDwgMCApID8gTWF0aC5jZWlsKCB0aGlzLnkgKSA6IE1hdGguZmxvb3IoIHRoaXMueSApO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRuZWdhdGU6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHRoaXMueCA9IC0gdGhpcy54O1xuXHRcdHRoaXMueSA9IC0gdGhpcy55O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRkb3Q6IGZ1bmN0aW9uICggdiApIHtcblxuXHRcdHJldHVybiB0aGlzLnggKiB2LnggKyB0aGlzLnkgKiB2Lnk7XG5cblx0fSxcblxuXHRsZW5ndGhTcTogZnVuY3Rpb24gKCkge1xuXG5cdFx0cmV0dXJuIHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueTtcblxuXHR9LFxuXG5cdGxlbmd0aDogZnVuY3Rpb24gKCkge1xuXG5cdFx0cmV0dXJuIE1hdGguc3FydCggdGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55ICk7XG5cblx0fSxcblxuXHRub3JtYWxpemU6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHJldHVybiB0aGlzLmRpdmlkZVNjYWxhciggdGhpcy5sZW5ndGgoKSApO1xuXG5cdH0sXG5cblx0ZGlzdGFuY2VUbzogZnVuY3Rpb24gKCB2ICkge1xuXG5cdFx0cmV0dXJuIE1hdGguc3FydCggdGhpcy5kaXN0YW5jZVRvU3F1YXJlZCggdiApICk7XG5cblx0fSxcblxuXHRkaXN0YW5jZVRvU3F1YXJlZDogZnVuY3Rpb24gKCB2ICkge1xuXG5cdFx0dmFyIGR4ID0gdGhpcy54IC0gdi54LCBkeSA9IHRoaXMueSAtIHYueTtcblx0XHRyZXR1cm4gZHggKiBkeCArIGR5ICogZHk7XG5cblx0fSxcblxuXHRzZXRMZW5ndGg6IGZ1bmN0aW9uICggbCApIHtcblxuXHRcdHZhciBvbGRMZW5ndGggPSB0aGlzLmxlbmd0aCgpO1xuXG5cdFx0aWYgKCBvbGRMZW5ndGggIT09IDAgJiYgbCAhPT0gb2xkTGVuZ3RoICkge1xuXG5cdFx0XHR0aGlzLm11bHRpcGx5U2NhbGFyKCBsIC8gb2xkTGVuZ3RoICk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRsZXJwOiBmdW5jdGlvbiAoIHYsIGFscGhhICkge1xuXG5cdFx0dGhpcy54ICs9ICggdi54IC0gdGhpcy54ICkgKiBhbHBoYTtcblx0XHR0aGlzLnkgKz0gKCB2LnkgLSB0aGlzLnkgKSAqIGFscGhhO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRlcXVhbHM6IGZ1bmN0aW9uICggdiApIHtcblxuXHRcdHJldHVybiAoICggdi54ID09PSB0aGlzLnggKSAmJiAoIHYueSA9PT0gdGhpcy55ICkgKTtcblxuXHR9LFxuXG5cdGZyb21BcnJheTogZnVuY3Rpb24gKCBhcnJheSwgb2Zmc2V0ICkge1xuXG5cdFx0aWYgKCBvZmZzZXQgPT09IHVuZGVmaW5lZCApIG9mZnNldCA9IDA7XG5cblx0XHR0aGlzLnggPSBhcnJheVsgb2Zmc2V0IF07XG5cdFx0dGhpcy55ID0gYXJyYXlbIG9mZnNldCArIDEgXTtcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH0sXG5cblx0dG9BcnJheTogZnVuY3Rpb24gKCBhcnJheSwgb2Zmc2V0ICkge1xuXG5cdFx0aWYgKCBhcnJheSA9PT0gdW5kZWZpbmVkICkgYXJyYXkgPSBbXTtcblx0XHRpZiAoIG9mZnNldCA9PT0gdW5kZWZpbmVkICkgb2Zmc2V0ID0gMDtcblxuXHRcdGFycmF5WyBvZmZzZXQgXSA9IHRoaXMueDtcblx0XHRhcnJheVsgb2Zmc2V0ICsgMSBdID0gdGhpcy55O1xuXG5cdFx0cmV0dXJuIGFycmF5O1xuXG5cdH0sXG5cblx0ZnJvbUF0dHJpYnV0ZTogZnVuY3Rpb24gKCBhdHRyaWJ1dGUsIGluZGV4LCBvZmZzZXQgKSB7XG5cblx0ICAgIGlmICggb2Zmc2V0ID09PSB1bmRlZmluZWQgKSBvZmZzZXQgPSAwO1xuXG5cdCAgICBpbmRleCA9IGluZGV4ICogYXR0cmlidXRlLml0ZW1TaXplICsgb2Zmc2V0O1xuXG5cdCAgICB0aGlzLnggPSBhdHRyaWJ1dGUuYXJyYXlbIGluZGV4IF07XG5cdCAgICB0aGlzLnkgPSBhdHRyaWJ1dGUuYXJyYXlbIGluZGV4ICsgMSBdO1xuXG5cdCAgICByZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdGNsb25lOiBmdW5jdGlvbiAoKSB7XG5cblx0XHRyZXR1cm4gbmV3IFRIUkVFLlZlY3RvcjIoIHRoaXMueCwgdGhpcy55ICk7XG5cblx0fVxuXG59O1xuLyoqKiBFTkQgVmVjdG9yMiAqKiovXG4vKioqIFNUQVJUIFZlY3RvcjMgKioqL1xuXG4vKipcbiAqIEBhdXRob3IgbXJkb29iIC8gaHR0cDovL21yZG9vYi5jb20vXG4gKiBAYXV0aG9yICpraWxlIC8gaHR0cDovL2tpbGUuc3RyYXZhZ2FuemEub3JnL1xuICogQGF1dGhvciBwaGlsb2diIC8gaHR0cDovL2Jsb2cudGhlaml0Lm9yZy9cbiAqIEBhdXRob3IgbWlrYWVsIGVtdGluZ2VyIC8gaHR0cDovL2dvbW8uc2UvXG4gKiBAYXV0aG9yIGVncmFldGhlciAvIGh0dHA6Ly9lZ3JhZXRoZXIuY29tL1xuICogQGF1dGhvciBXZXN0TGFuZ2xleSAvIGh0dHA6Ly9naXRodWIuY29tL1dlc3RMYW5nbGV5XG4gKi9cblxuVEhSRUUuVmVjdG9yMyA9IGZ1bmN0aW9uICggeCwgeSwgeiApIHtcblxuXHR0aGlzLnggPSB4IHx8IDA7XG5cdHRoaXMueSA9IHkgfHwgMDtcblx0dGhpcy56ID0geiB8fCAwO1xuXG59O1xuXG5USFJFRS5WZWN0b3IzLnByb3RvdHlwZSA9IHtcblxuXHRjb25zdHJ1Y3RvcjogVEhSRUUuVmVjdG9yMyxcblxuXHRzZXQ6IGZ1bmN0aW9uICggeCwgeSwgeiApIHtcblxuXHRcdHRoaXMueCA9IHg7XG5cdFx0dGhpcy55ID0geTtcblx0XHR0aGlzLnogPSB6O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRzZXRYOiBmdW5jdGlvbiAoIHggKSB7XG5cblx0XHR0aGlzLnggPSB4O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRzZXRZOiBmdW5jdGlvbiAoIHkgKSB7XG5cblx0XHR0aGlzLnkgPSB5O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRzZXRaOiBmdW5jdGlvbiAoIHogKSB7XG5cblx0XHR0aGlzLnogPSB6O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRzZXRDb21wb25lbnQ6IGZ1bmN0aW9uICggaW5kZXgsIHZhbHVlICkge1xuXG5cdFx0c3dpdGNoICggaW5kZXggKSB7XG5cblx0XHRcdGNhc2UgMDogdGhpcy54ID0gdmFsdWU7IGJyZWFrO1xuXHRcdFx0Y2FzZSAxOiB0aGlzLnkgPSB2YWx1ZTsgYnJlYWs7XG5cdFx0XHRjYXNlIDI6IHRoaXMueiA9IHZhbHVlOyBicmVhaztcblx0XHRcdGRlZmF1bHQ6IHRocm93IG5ldyBFcnJvciggJ2luZGV4IGlzIG91dCBvZiByYW5nZTogJyArIGluZGV4ICk7XG5cblx0XHR9XG5cblx0fSxcblxuXHRnZXRDb21wb25lbnQ6IGZ1bmN0aW9uICggaW5kZXggKSB7XG5cblx0XHRzd2l0Y2ggKCBpbmRleCApIHtcblxuXHRcdFx0Y2FzZSAwOiByZXR1cm4gdGhpcy54O1xuXHRcdFx0Y2FzZSAxOiByZXR1cm4gdGhpcy55O1xuXHRcdFx0Y2FzZSAyOiByZXR1cm4gdGhpcy56O1xuXHRcdFx0ZGVmYXVsdDogdGhyb3cgbmV3IEVycm9yKCAnaW5kZXggaXMgb3V0IG9mIHJhbmdlOiAnICsgaW5kZXggKTtcblxuXHRcdH1cblxuXHR9LFxuXG5cdGNvcHk6IGZ1bmN0aW9uICggdiApIHtcblxuXHRcdHRoaXMueCA9IHYueDtcblx0XHR0aGlzLnkgPSB2Lnk7XG5cdFx0dGhpcy56ID0gdi56O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRhZGQ6IGZ1bmN0aW9uICggdiwgdyApIHtcblxuXHRcdGlmICggdyAhPT0gdW5kZWZpbmVkICkge1xuXG5cdFx0XHRjb25zb2xlLndhcm4oICdUSFJFRS5WZWN0b3IzOiAuYWRkKCkgbm93IG9ubHkgYWNjZXB0cyBvbmUgYXJndW1lbnQuIFVzZSAuYWRkVmVjdG9ycyggYSwgYiApIGluc3RlYWQuJyApO1xuXHRcdFx0cmV0dXJuIHRoaXMuYWRkVmVjdG9ycyggdiwgdyApO1xuXG5cdFx0fVxuXG5cdFx0dGhpcy54ICs9IHYueDtcblx0XHR0aGlzLnkgKz0gdi55O1xuXHRcdHRoaXMueiArPSB2Lno7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdGFkZFNjYWxhcjogZnVuY3Rpb24gKCBzICkge1xuXG5cdFx0dGhpcy54ICs9IHM7XG5cdFx0dGhpcy55ICs9IHM7XG5cdFx0dGhpcy56ICs9IHM7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdGFkZFZlY3RvcnM6IGZ1bmN0aW9uICggYSwgYiApIHtcblxuXHRcdHRoaXMueCA9IGEueCArIGIueDtcblx0XHR0aGlzLnkgPSBhLnkgKyBiLnk7XG5cdFx0dGhpcy56ID0gYS56ICsgYi56O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRzdWI6IGZ1bmN0aW9uICggdiwgdyApIHtcblxuXHRcdGlmICggdyAhPT0gdW5kZWZpbmVkICkge1xuXG5cdFx0XHRjb25zb2xlLndhcm4oICdUSFJFRS5WZWN0b3IzOiAuc3ViKCkgbm93IG9ubHkgYWNjZXB0cyBvbmUgYXJndW1lbnQuIFVzZSAuc3ViVmVjdG9ycyggYSwgYiApIGluc3RlYWQuJyApO1xuXHRcdFx0cmV0dXJuIHRoaXMuc3ViVmVjdG9ycyggdiwgdyApO1xuXG5cdFx0fVxuXG5cdFx0dGhpcy54IC09IHYueDtcblx0XHR0aGlzLnkgLT0gdi55O1xuXHRcdHRoaXMueiAtPSB2Lno7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdHN1YlZlY3RvcnM6IGZ1bmN0aW9uICggYSwgYiApIHtcblxuXHRcdHRoaXMueCA9IGEueCAtIGIueDtcblx0XHR0aGlzLnkgPSBhLnkgLSBiLnk7XG5cdFx0dGhpcy56ID0gYS56IC0gYi56O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRtdWx0aXBseTogZnVuY3Rpb24gKCB2LCB3ICkge1xuXG5cdFx0aWYgKCB3ICE9PSB1bmRlZmluZWQgKSB7XG5cblx0XHRcdGNvbnNvbGUud2FybiggJ1RIUkVFLlZlY3RvcjM6IC5tdWx0aXBseSgpIG5vdyBvbmx5IGFjY2VwdHMgb25lIGFyZ3VtZW50LiBVc2UgLm11bHRpcGx5VmVjdG9ycyggYSwgYiApIGluc3RlYWQuJyApO1xuXHRcdFx0cmV0dXJuIHRoaXMubXVsdGlwbHlWZWN0b3JzKCB2LCB3ICk7XG5cblx0XHR9XG5cblx0XHR0aGlzLnggKj0gdi54O1xuXHRcdHRoaXMueSAqPSB2Lnk7XG5cdFx0dGhpcy56ICo9IHYuejtcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH0sXG5cblx0bXVsdGlwbHlTY2FsYXI6IGZ1bmN0aW9uICggc2NhbGFyICkge1xuXG5cdFx0dGhpcy54ICo9IHNjYWxhcjtcblx0XHR0aGlzLnkgKj0gc2NhbGFyO1xuXHRcdHRoaXMueiAqPSBzY2FsYXI7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdG11bHRpcGx5VmVjdG9yczogZnVuY3Rpb24gKCBhLCBiICkge1xuXG5cdFx0dGhpcy54ID0gYS54ICogYi54O1xuXHRcdHRoaXMueSA9IGEueSAqIGIueTtcblx0XHR0aGlzLnogPSBhLnogKiBiLno7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdGFwcGx5RXVsZXI6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHZhciBxdWF0ZXJuaW9uO1xuXG5cdFx0cmV0dXJuIGZ1bmN0aW9uICggZXVsZXIgKSB7XG5cblx0XHRcdGlmICggZXVsZXIgaW5zdGFuY2VvZiBUSFJFRS5FdWxlciA9PT0gZmFsc2UgKSB7XG5cblx0XHRcdFx0Y29uc29sZS5lcnJvciggJ1RIUkVFLlZlY3RvcjM6IC5hcHBseUV1bGVyKCkgbm93IGV4cGVjdHMgYSBFdWxlciByb3RhdGlvbiByYXRoZXIgdGhhbiBhIFZlY3RvcjMgYW5kIG9yZGVyLicgKTtcblxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIHF1YXRlcm5pb24gPT09IHVuZGVmaW5lZCApIHF1YXRlcm5pb24gPSBuZXcgVEhSRUUuUXVhdGVybmlvbigpO1xuXG5cdFx0XHR0aGlzLmFwcGx5UXVhdGVybmlvbiggcXVhdGVybmlvbi5zZXRGcm9tRXVsZXIoIGV1bGVyICkgKTtcblxuXHRcdFx0cmV0dXJuIHRoaXM7XG5cblx0XHR9O1xuXG5cdH0oKSxcblxuXHRhcHBseUF4aXNBbmdsZTogZnVuY3Rpb24gKCkge1xuXG5cdFx0dmFyIHF1YXRlcm5pb247XG5cblx0XHRyZXR1cm4gZnVuY3Rpb24gKCBheGlzLCBhbmdsZSApIHtcblxuXHRcdFx0aWYgKCBxdWF0ZXJuaW9uID09PSB1bmRlZmluZWQgKSBxdWF0ZXJuaW9uID0gbmV3IFRIUkVFLlF1YXRlcm5pb24oKTtcblxuXHRcdFx0dGhpcy5hcHBseVF1YXRlcm5pb24oIHF1YXRlcm5pb24uc2V0RnJvbUF4aXNBbmdsZSggYXhpcywgYW5nbGUgKSApO1xuXG5cdFx0XHRyZXR1cm4gdGhpcztcblxuXHRcdH07XG5cblx0fSgpLFxuXG5cdGFwcGx5TWF0cml4MzogZnVuY3Rpb24gKCBtICkge1xuXG5cdFx0dmFyIHggPSB0aGlzLng7XG5cdFx0dmFyIHkgPSB0aGlzLnk7XG5cdFx0dmFyIHogPSB0aGlzLno7XG5cblx0XHR2YXIgZSA9IG0uZWxlbWVudHM7XG5cblx0XHR0aGlzLnggPSBlWyAwIF0gKiB4ICsgZVsgMyBdICogeSArIGVbIDYgXSAqIHo7XG5cdFx0dGhpcy55ID0gZVsgMSBdICogeCArIGVbIDQgXSAqIHkgKyBlWyA3IF0gKiB6O1xuXHRcdHRoaXMueiA9IGVbIDIgXSAqIHggKyBlWyA1IF0gKiB5ICsgZVsgOCBdICogejtcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH0sXG5cblx0YXBwbHlNYXRyaXg0OiBmdW5jdGlvbiAoIG0gKSB7XG5cblx0XHQvLyBpbnB1dDogVEhSRUUuTWF0cml4NCBhZmZpbmUgbWF0cml4XG5cblx0XHR2YXIgeCA9IHRoaXMueCwgeSA9IHRoaXMueSwgeiA9IHRoaXMuejtcblxuXHRcdHZhciBlID0gbS5lbGVtZW50cztcblxuXHRcdHRoaXMueCA9IGVbIDAgXSAqIHggKyBlWyA0IF0gKiB5ICsgZVsgOCBdICAqIHogKyBlWyAxMiBdO1xuXHRcdHRoaXMueSA9IGVbIDEgXSAqIHggKyBlWyA1IF0gKiB5ICsgZVsgOSBdICAqIHogKyBlWyAxMyBdO1xuXHRcdHRoaXMueiA9IGVbIDIgXSAqIHggKyBlWyA2IF0gKiB5ICsgZVsgMTAgXSAqIHogKyBlWyAxNCBdO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRhcHBseVByb2plY3Rpb246IGZ1bmN0aW9uICggbSApIHtcblxuXHRcdC8vIGlucHV0OiBUSFJFRS5NYXRyaXg0IHByb2plY3Rpb24gbWF0cml4XG5cblx0XHR2YXIgeCA9IHRoaXMueCwgeSA9IHRoaXMueSwgeiA9IHRoaXMuejtcblxuXHRcdHZhciBlID0gbS5lbGVtZW50cztcblx0XHR2YXIgZCA9IDEgLyAoIGVbIDMgXSAqIHggKyBlWyA3IF0gKiB5ICsgZVsgMTEgXSAqIHogKyBlWyAxNSBdICk7IC8vIHBlcnNwZWN0aXZlIGRpdmlkZVxuXG5cdFx0dGhpcy54ID0gKCBlWyAwIF0gKiB4ICsgZVsgNCBdICogeSArIGVbIDggXSAgKiB6ICsgZVsgMTIgXSApICogZDtcblx0XHR0aGlzLnkgPSAoIGVbIDEgXSAqIHggKyBlWyA1IF0gKiB5ICsgZVsgOSBdICAqIHogKyBlWyAxMyBdICkgKiBkO1xuXHRcdHRoaXMueiA9ICggZVsgMiBdICogeCArIGVbIDYgXSAqIHkgKyBlWyAxMCBdICogeiArIGVbIDE0IF0gKSAqIGQ7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdGFwcGx5UXVhdGVybmlvbjogZnVuY3Rpb24gKCBxICkge1xuXG5cdFx0dmFyIHggPSB0aGlzLng7XG5cdFx0dmFyIHkgPSB0aGlzLnk7XG5cdFx0dmFyIHogPSB0aGlzLno7XG5cblx0XHR2YXIgcXggPSBxLng7XG5cdFx0dmFyIHF5ID0gcS55O1xuXHRcdHZhciBxeiA9IHEuejtcblx0XHR2YXIgcXcgPSBxLnc7XG5cblx0XHQvLyBjYWxjdWxhdGUgcXVhdCAqIHZlY3RvclxuXG5cdFx0dmFyIGl4ID0gIHF3ICogeCArIHF5ICogeiAtIHF6ICogeTtcblx0XHR2YXIgaXkgPSAgcXcgKiB5ICsgcXogKiB4IC0gcXggKiB6O1xuXHRcdHZhciBpeiA9ICBxdyAqIHogKyBxeCAqIHkgLSBxeSAqIHg7XG5cdFx0dmFyIGl3ID0gLSBxeCAqIHggLSBxeSAqIHkgLSBxeiAqIHo7XG5cblx0XHQvLyBjYWxjdWxhdGUgcmVzdWx0ICogaW52ZXJzZSBxdWF0XG5cblx0XHR0aGlzLnggPSBpeCAqIHF3ICsgaXcgKiAtIHF4ICsgaXkgKiAtIHF6IC0gaXogKiAtIHF5O1xuXHRcdHRoaXMueSA9IGl5ICogcXcgKyBpdyAqIC0gcXkgKyBpeiAqIC0gcXggLSBpeCAqIC0gcXo7XG5cdFx0dGhpcy56ID0gaXogKiBxdyArIGl3ICogLSBxeiArIGl4ICogLSBxeSAtIGl5ICogLSBxeDtcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH0sXG5cblx0cHJvamVjdDogZnVuY3Rpb24gKCkge1xuXG5cdFx0dmFyIG1hdHJpeDtcblxuXHRcdHJldHVybiBmdW5jdGlvbiAoIGNhbWVyYSApIHtcblxuXHRcdFx0aWYgKCBtYXRyaXggPT09IHVuZGVmaW5lZCApIG1hdHJpeCA9IG5ldyBUSFJFRS5NYXRyaXg0KCk7XG5cblx0XHRcdG1hdHJpeC5tdWx0aXBseU1hdHJpY2VzKCBjYW1lcmEucHJvamVjdGlvbk1hdHJpeCwgbWF0cml4LmdldEludmVyc2UoIGNhbWVyYS5tYXRyaXhXb3JsZCApICk7XG5cdFx0XHRyZXR1cm4gdGhpcy5hcHBseVByb2plY3Rpb24oIG1hdHJpeCApO1xuXG5cdFx0fTtcblxuXHR9KCksXG5cblx0dW5wcm9qZWN0OiBmdW5jdGlvbiAoKSB7XG5cblx0XHR2YXIgbWF0cml4O1xuXG5cdFx0cmV0dXJuIGZ1bmN0aW9uICggY2FtZXJhICkge1xuXG5cdFx0XHRpZiAoIG1hdHJpeCA9PT0gdW5kZWZpbmVkICkgbWF0cml4ID0gbmV3IFRIUkVFLk1hdHJpeDQoKTtcblxuXHRcdFx0bWF0cml4Lm11bHRpcGx5TWF0cmljZXMoIGNhbWVyYS5tYXRyaXhXb3JsZCwgbWF0cml4LmdldEludmVyc2UoIGNhbWVyYS5wcm9qZWN0aW9uTWF0cml4ICkgKTtcblx0XHRcdHJldHVybiB0aGlzLmFwcGx5UHJvamVjdGlvbiggbWF0cml4ICk7XG5cblx0XHR9O1xuXG5cdH0oKSxcblxuXHR0cmFuc2Zvcm1EaXJlY3Rpb246IGZ1bmN0aW9uICggbSApIHtcblxuXHRcdC8vIGlucHV0OiBUSFJFRS5NYXRyaXg0IGFmZmluZSBtYXRyaXhcblx0XHQvLyB2ZWN0b3IgaW50ZXJwcmV0ZWQgYXMgYSBkaXJlY3Rpb25cblxuXHRcdHZhciB4ID0gdGhpcy54LCB5ID0gdGhpcy55LCB6ID0gdGhpcy56O1xuXG5cdFx0dmFyIGUgPSBtLmVsZW1lbnRzO1xuXG5cdFx0dGhpcy54ID0gZVsgMCBdICogeCArIGVbIDQgXSAqIHkgKyBlWyA4IF0gICogejtcblx0XHR0aGlzLnkgPSBlWyAxIF0gKiB4ICsgZVsgNSBdICogeSArIGVbIDkgXSAgKiB6O1xuXHRcdHRoaXMueiA9IGVbIDIgXSAqIHggKyBlWyA2IF0gKiB5ICsgZVsgMTAgXSAqIHo7XG5cblx0XHR0aGlzLm5vcm1hbGl6ZSgpO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRkaXZpZGU6IGZ1bmN0aW9uICggdiApIHtcblxuXHRcdHRoaXMueCAvPSB2Lng7XG5cdFx0dGhpcy55IC89IHYueTtcblx0XHR0aGlzLnogLz0gdi56O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRkaXZpZGVTY2FsYXI6IGZ1bmN0aW9uICggc2NhbGFyICkge1xuXG5cdFx0aWYgKCBzY2FsYXIgIT09IDAgKSB7XG5cblx0XHRcdHZhciBpbnZTY2FsYXIgPSAxIC8gc2NhbGFyO1xuXG5cdFx0XHR0aGlzLnggKj0gaW52U2NhbGFyO1xuXHRcdFx0dGhpcy55ICo9IGludlNjYWxhcjtcblx0XHRcdHRoaXMueiAqPSBpbnZTY2FsYXI7XG5cblx0XHR9IGVsc2Uge1xuXG5cdFx0XHR0aGlzLnggPSAwO1xuXHRcdFx0dGhpcy55ID0gMDtcblx0XHRcdHRoaXMueiA9IDA7XG5cblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdG1pbjogZnVuY3Rpb24gKCB2ICkge1xuXG5cdFx0aWYgKCB0aGlzLnggPiB2LnggKSB7XG5cblx0XHRcdHRoaXMueCA9IHYueDtcblxuXHRcdH1cblxuXHRcdGlmICggdGhpcy55ID4gdi55ICkge1xuXG5cdFx0XHR0aGlzLnkgPSB2Lnk7XG5cblx0XHR9XG5cblx0XHRpZiAoIHRoaXMueiA+IHYueiApIHtcblxuXHRcdFx0dGhpcy56ID0gdi56O1xuXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRtYXg6IGZ1bmN0aW9uICggdiApIHtcblxuXHRcdGlmICggdGhpcy54IDwgdi54ICkge1xuXG5cdFx0XHR0aGlzLnggPSB2Lng7XG5cblx0XHR9XG5cblx0XHRpZiAoIHRoaXMueSA8IHYueSApIHtcblxuXHRcdFx0dGhpcy55ID0gdi55O1xuXG5cdFx0fVxuXG5cdFx0aWYgKCB0aGlzLnogPCB2LnogKSB7XG5cblx0XHRcdHRoaXMueiA9IHYuejtcblxuXHRcdH1cblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH0sXG5cblx0Y2xhbXA6IGZ1bmN0aW9uICggbWluLCBtYXggKSB7XG5cblx0XHQvLyBUaGlzIGZ1bmN0aW9uIGFzc3VtZXMgbWluIDwgbWF4LCBpZiB0aGlzIGFzc3VtcHRpb24gaXNuJ3QgdHJ1ZSBpdCB3aWxsIG5vdCBvcGVyYXRlIGNvcnJlY3RseVxuXG5cdFx0aWYgKCB0aGlzLnggPCBtaW4ueCApIHtcblxuXHRcdFx0dGhpcy54ID0gbWluLng7XG5cblx0XHR9IGVsc2UgaWYgKCB0aGlzLnggPiBtYXgueCApIHtcblxuXHRcdFx0dGhpcy54ID0gbWF4Lng7XG5cblx0XHR9XG5cblx0XHRpZiAoIHRoaXMueSA8IG1pbi55ICkge1xuXG5cdFx0XHR0aGlzLnkgPSBtaW4ueTtcblxuXHRcdH0gZWxzZSBpZiAoIHRoaXMueSA+IG1heC55ICkge1xuXG5cdFx0XHR0aGlzLnkgPSBtYXgueTtcblxuXHRcdH1cblxuXHRcdGlmICggdGhpcy56IDwgbWluLnogKSB7XG5cblx0XHRcdHRoaXMueiA9IG1pbi56O1xuXG5cdFx0fSBlbHNlIGlmICggdGhpcy56ID4gbWF4LnogKSB7XG5cblx0XHRcdHRoaXMueiA9IG1heC56O1xuXG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRjbGFtcFNjYWxhcjogKCBmdW5jdGlvbiAoKSB7XG5cblx0XHR2YXIgbWluLCBtYXg7XG5cblx0XHRyZXR1cm4gZnVuY3Rpb24gKCBtaW5WYWwsIG1heFZhbCApIHtcblxuXHRcdFx0aWYgKCBtaW4gPT09IHVuZGVmaW5lZCApIHtcblxuXHRcdFx0XHRtaW4gPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXHRcdFx0XHRtYXggPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXG5cdFx0XHR9XG5cblx0XHRcdG1pbi5zZXQoIG1pblZhbCwgbWluVmFsLCBtaW5WYWwgKTtcblx0XHRcdG1heC5zZXQoIG1heFZhbCwgbWF4VmFsLCBtYXhWYWwgKTtcblxuXHRcdFx0cmV0dXJuIHRoaXMuY2xhbXAoIG1pbiwgbWF4ICk7XG5cblx0XHR9O1xuXG5cdH0gKSgpLFxuXG5cdGZsb29yOiBmdW5jdGlvbiAoKSB7XG5cblx0XHR0aGlzLnggPSBNYXRoLmZsb29yKCB0aGlzLnggKTtcblx0XHR0aGlzLnkgPSBNYXRoLmZsb29yKCB0aGlzLnkgKTtcblx0XHR0aGlzLnogPSBNYXRoLmZsb29yKCB0aGlzLnogKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH0sXG5cblx0Y2VpbDogZnVuY3Rpb24gKCkge1xuXG5cdFx0dGhpcy54ID0gTWF0aC5jZWlsKCB0aGlzLnggKTtcblx0XHR0aGlzLnkgPSBNYXRoLmNlaWwoIHRoaXMueSApO1xuXHRcdHRoaXMueiA9IE1hdGguY2VpbCggdGhpcy56ICk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdHJvdW5kOiBmdW5jdGlvbiAoKSB7XG5cblx0XHR0aGlzLnggPSBNYXRoLnJvdW5kKCB0aGlzLnggKTtcblx0XHR0aGlzLnkgPSBNYXRoLnJvdW5kKCB0aGlzLnkgKTtcblx0XHR0aGlzLnogPSBNYXRoLnJvdW5kKCB0aGlzLnogKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH0sXG5cblx0cm91bmRUb1plcm86IGZ1bmN0aW9uICgpIHtcblxuXHRcdHRoaXMueCA9ICggdGhpcy54IDwgMCApID8gTWF0aC5jZWlsKCB0aGlzLnggKSA6IE1hdGguZmxvb3IoIHRoaXMueCApO1xuXHRcdHRoaXMueSA9ICggdGhpcy55IDwgMCApID8gTWF0aC5jZWlsKCB0aGlzLnkgKSA6IE1hdGguZmxvb3IoIHRoaXMueSApO1xuXHRcdHRoaXMueiA9ICggdGhpcy56IDwgMCApID8gTWF0aC5jZWlsKCB0aGlzLnogKSA6IE1hdGguZmxvb3IoIHRoaXMueiApO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRuZWdhdGU6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHRoaXMueCA9IC0gdGhpcy54O1xuXHRcdHRoaXMueSA9IC0gdGhpcy55O1xuXHRcdHRoaXMueiA9IC0gdGhpcy56O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRkb3Q6IGZ1bmN0aW9uICggdiApIHtcblxuXHRcdHJldHVybiB0aGlzLnggKiB2LnggKyB0aGlzLnkgKiB2LnkgKyB0aGlzLnogKiB2Lno7XG5cblx0fSxcblxuXHRsZW5ndGhTcTogZnVuY3Rpb24gKCkge1xuXG5cdFx0cmV0dXJuIHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueSArIHRoaXMueiAqIHRoaXMuejtcblxuXHR9LFxuXG5cdGxlbmd0aDogZnVuY3Rpb24gKCkge1xuXG5cdFx0cmV0dXJuIE1hdGguc3FydCggdGhpcy54ICogdGhpcy54ICsgdGhpcy55ICogdGhpcy55ICsgdGhpcy56ICogdGhpcy56ICk7XG5cblx0fSxcblxuXHRsZW5ndGhNYW5oYXR0YW46IGZ1bmN0aW9uICgpIHtcblxuXHRcdHJldHVybiBNYXRoLmFicyggdGhpcy54ICkgKyBNYXRoLmFicyggdGhpcy55ICkgKyBNYXRoLmFicyggdGhpcy56ICk7XG5cblx0fSxcblxuXHRub3JtYWxpemU6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHJldHVybiB0aGlzLmRpdmlkZVNjYWxhciggdGhpcy5sZW5ndGgoKSApO1xuXG5cdH0sXG5cblx0c2V0TGVuZ3RoOiBmdW5jdGlvbiAoIGwgKSB7XG5cblx0XHR2YXIgb2xkTGVuZ3RoID0gdGhpcy5sZW5ndGgoKTtcblxuXHRcdGlmICggb2xkTGVuZ3RoICE9PSAwICYmIGwgIT09IG9sZExlbmd0aCAgKSB7XG5cblx0XHRcdHRoaXMubXVsdGlwbHlTY2FsYXIoIGwgLyBvbGRMZW5ndGggKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdGxlcnA6IGZ1bmN0aW9uICggdiwgYWxwaGEgKSB7XG5cblx0XHR0aGlzLnggKz0gKCB2LnggLSB0aGlzLnggKSAqIGFscGhhO1xuXHRcdHRoaXMueSArPSAoIHYueSAtIHRoaXMueSApICogYWxwaGE7XG5cdFx0dGhpcy56ICs9ICggdi56IC0gdGhpcy56ICkgKiBhbHBoYTtcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH0sXG5cblx0Y3Jvc3M6IGZ1bmN0aW9uICggdiwgdyApIHtcblxuXHRcdGlmICggdyAhPT0gdW5kZWZpbmVkICkge1xuXG5cdFx0XHRjb25zb2xlLndhcm4oICdUSFJFRS5WZWN0b3IzOiAuY3Jvc3MoKSBub3cgb25seSBhY2NlcHRzIG9uZSBhcmd1bWVudC4gVXNlIC5jcm9zc1ZlY3RvcnMoIGEsIGIgKSBpbnN0ZWFkLicgKTtcblx0XHRcdHJldHVybiB0aGlzLmNyb3NzVmVjdG9ycyggdiwgdyApO1xuXG5cdFx0fVxuXG5cdFx0dmFyIHggPSB0aGlzLngsIHkgPSB0aGlzLnksIHogPSB0aGlzLno7XG5cblx0XHR0aGlzLnggPSB5ICogdi56IC0geiAqIHYueTtcblx0XHR0aGlzLnkgPSB6ICogdi54IC0geCAqIHYuejtcblx0XHR0aGlzLnogPSB4ICogdi55IC0geSAqIHYueDtcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH0sXG5cblx0Y3Jvc3NWZWN0b3JzOiBmdW5jdGlvbiAoIGEsIGIgKSB7XG5cblx0XHR2YXIgYXggPSBhLngsIGF5ID0gYS55LCBheiA9IGEuejtcblx0XHR2YXIgYnggPSBiLngsIGJ5ID0gYi55LCBieiA9IGIuejtcblxuXHRcdHRoaXMueCA9IGF5ICogYnogLSBheiAqIGJ5O1xuXHRcdHRoaXMueSA9IGF6ICogYnggLSBheCAqIGJ6O1xuXHRcdHRoaXMueiA9IGF4ICogYnkgLSBheSAqIGJ4O1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRwcm9qZWN0T25WZWN0b3I6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHZhciB2MSwgZG90O1xuXG5cdFx0cmV0dXJuIGZ1bmN0aW9uICggdmVjdG9yICkge1xuXG5cdFx0XHRpZiAoIHYxID09PSB1bmRlZmluZWQgKSB2MSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5cblx0XHRcdHYxLmNvcHkoIHZlY3RvciApLm5vcm1hbGl6ZSgpO1xuXG5cdFx0XHRkb3QgPSB0aGlzLmRvdCggdjEgKTtcblxuXHRcdFx0cmV0dXJuIHRoaXMuY29weSggdjEgKS5tdWx0aXBseVNjYWxhciggZG90ICk7XG5cblx0XHR9O1xuXG5cdH0oKSxcblxuXHRwcm9qZWN0T25QbGFuZTogZnVuY3Rpb24gKCkge1xuXG5cdFx0dmFyIHYxO1xuXG5cdFx0cmV0dXJuIGZ1bmN0aW9uICggcGxhbmVOb3JtYWwgKSB7XG5cblx0XHRcdGlmICggdjEgPT09IHVuZGVmaW5lZCApIHYxID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuXHRcdFx0djEuY29weSggdGhpcyApLnByb2plY3RPblZlY3RvciggcGxhbmVOb3JtYWwgKTtcblxuXHRcdFx0cmV0dXJuIHRoaXMuc3ViKCB2MSApO1xuXG5cdFx0fVxuXG5cdH0oKSxcblxuXHRyZWZsZWN0OiBmdW5jdGlvbiAoKSB7XG5cblx0XHQvLyByZWZsZWN0IGluY2lkZW50IHZlY3RvciBvZmYgcGxhbmUgb3J0aG9nb25hbCB0byBub3JtYWxcblx0XHQvLyBub3JtYWwgaXMgYXNzdW1lZCB0byBoYXZlIHVuaXQgbGVuZ3RoXG5cblx0XHR2YXIgdjE7XG5cblx0XHRyZXR1cm4gZnVuY3Rpb24gKCBub3JtYWwgKSB7XG5cblx0XHRcdGlmICggdjEgPT09IHVuZGVmaW5lZCApIHYxID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcblxuXHRcdFx0cmV0dXJuIHRoaXMuc3ViKCB2MS5jb3B5KCBub3JtYWwgKS5tdWx0aXBseVNjYWxhciggMiAqIHRoaXMuZG90KCBub3JtYWwgKSApICk7XG5cblx0XHR9XG5cblx0fSgpLFxuXG5cdGFuZ2xlVG86IGZ1bmN0aW9uICggdiApIHtcblxuXHRcdHZhciB0aGV0YSA9IHRoaXMuZG90KCB2ICkgLyAoIHRoaXMubGVuZ3RoKCkgKiB2Lmxlbmd0aCgpICk7XG5cblx0XHQvLyBjbGFtcCwgdG8gaGFuZGxlIG51bWVyaWNhbCBwcm9ibGVtc1xuXG5cdFx0cmV0dXJuIE1hdGguYWNvcyggVEhSRUUuTWF0aC5jbGFtcCggdGhldGEsIC0gMSwgMSApICk7XG5cblx0fSxcblxuXHRkaXN0YW5jZVRvOiBmdW5jdGlvbiAoIHYgKSB7XG5cblx0XHRyZXR1cm4gTWF0aC5zcXJ0KCB0aGlzLmRpc3RhbmNlVG9TcXVhcmVkKCB2ICkgKTtcblxuXHR9LFxuXG5cdGRpc3RhbmNlVG9TcXVhcmVkOiBmdW5jdGlvbiAoIHYgKSB7XG5cblx0XHR2YXIgZHggPSB0aGlzLnggLSB2Lng7XG5cdFx0dmFyIGR5ID0gdGhpcy55IC0gdi55O1xuXHRcdHZhciBkeiA9IHRoaXMueiAtIHYuejtcblxuXHRcdHJldHVybiBkeCAqIGR4ICsgZHkgKiBkeSArIGR6ICogZHo7XG5cblx0fSxcblxuXHRzZXRFdWxlckZyb21Sb3RhdGlvbk1hdHJpeDogZnVuY3Rpb24gKCBtLCBvcmRlciApIHtcblxuXHRcdGNvbnNvbGUuZXJyb3IoICdUSFJFRS5WZWN0b3IzOiAuc2V0RXVsZXJGcm9tUm90YXRpb25NYXRyaXgoKSBoYXMgYmVlbiByZW1vdmVkLiBVc2UgRXVsZXIuc2V0RnJvbVJvdGF0aW9uTWF0cml4KCkgaW5zdGVhZC4nICk7XG5cblx0fSxcblxuXHRzZXRFdWxlckZyb21RdWF0ZXJuaW9uOiBmdW5jdGlvbiAoIHEsIG9yZGVyICkge1xuXG5cdFx0Y29uc29sZS5lcnJvciggJ1RIUkVFLlZlY3RvcjM6IC5zZXRFdWxlckZyb21RdWF0ZXJuaW9uKCkgaGFzIGJlZW4gcmVtb3ZlZC4gVXNlIEV1bGVyLnNldEZyb21RdWF0ZXJuaW9uKCkgaW5zdGVhZC4nICk7XG5cblx0fSxcblxuXHRnZXRQb3NpdGlvbkZyb21NYXRyaXg6IGZ1bmN0aW9uICggbSApIHtcblxuXHRcdGNvbnNvbGUud2FybiggJ1RIUkVFLlZlY3RvcjM6IC5nZXRQb3NpdGlvbkZyb21NYXRyaXgoKSBoYXMgYmVlbiByZW5hbWVkIHRvIC5zZXRGcm9tTWF0cml4UG9zaXRpb24oKS4nICk7XG5cblx0XHRyZXR1cm4gdGhpcy5zZXRGcm9tTWF0cml4UG9zaXRpb24oIG0gKTtcblxuXHR9LFxuXG5cdGdldFNjYWxlRnJvbU1hdHJpeDogZnVuY3Rpb24gKCBtICkge1xuXG5cdFx0Y29uc29sZS53YXJuKCAnVEhSRUUuVmVjdG9yMzogLmdldFNjYWxlRnJvbU1hdHJpeCgpIGhhcyBiZWVuIHJlbmFtZWQgdG8gLnNldEZyb21NYXRyaXhTY2FsZSgpLicgKTtcblxuXHRcdHJldHVybiB0aGlzLnNldEZyb21NYXRyaXhTY2FsZSggbSApO1xuXHR9LFxuXG5cdGdldENvbHVtbkZyb21NYXRyaXg6IGZ1bmN0aW9uICggaW5kZXgsIG1hdHJpeCApIHtcblxuXHRcdGNvbnNvbGUud2FybiggJ1RIUkVFLlZlY3RvcjM6IC5nZXRDb2x1bW5Gcm9tTWF0cml4KCkgaGFzIGJlZW4gcmVuYW1lZCB0byAuc2V0RnJvbU1hdHJpeENvbHVtbigpLicgKTtcblxuXHRcdHJldHVybiB0aGlzLnNldEZyb21NYXRyaXhDb2x1bW4oIGluZGV4LCBtYXRyaXggKTtcblxuXHR9LFxuXG5cdHNldEZyb21NYXRyaXhQb3NpdGlvbjogZnVuY3Rpb24gKCBtICkge1xuXG5cdFx0dGhpcy54ID0gbS5lbGVtZW50c1sgMTIgXTtcblx0XHR0aGlzLnkgPSBtLmVsZW1lbnRzWyAxMyBdO1xuXHRcdHRoaXMueiA9IG0uZWxlbWVudHNbIDE0IF07XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdHNldEZyb21NYXRyaXhTY2FsZTogZnVuY3Rpb24gKCBtICkge1xuXG5cdFx0dmFyIHN4ID0gdGhpcy5zZXQoIG0uZWxlbWVudHNbIDAgXSwgbS5lbGVtZW50c1sgMSBdLCBtLmVsZW1lbnRzWyAgMiBdICkubGVuZ3RoKCk7XG5cdFx0dmFyIHN5ID0gdGhpcy5zZXQoIG0uZWxlbWVudHNbIDQgXSwgbS5lbGVtZW50c1sgNSBdLCBtLmVsZW1lbnRzWyAgNiBdICkubGVuZ3RoKCk7XG5cdFx0dmFyIHN6ID0gdGhpcy5zZXQoIG0uZWxlbWVudHNbIDggXSwgbS5lbGVtZW50c1sgOSBdLCBtLmVsZW1lbnRzWyAxMCBdICkubGVuZ3RoKCk7XG5cblx0XHR0aGlzLnggPSBzeDtcblx0XHR0aGlzLnkgPSBzeTtcblx0XHR0aGlzLnogPSBzejtcblxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cdHNldEZyb21NYXRyaXhDb2x1bW46IGZ1bmN0aW9uICggaW5kZXgsIG1hdHJpeCApIHtcblxuXHRcdHZhciBvZmZzZXQgPSBpbmRleCAqIDQ7XG5cblx0XHR2YXIgbWUgPSBtYXRyaXguZWxlbWVudHM7XG5cblx0XHR0aGlzLnggPSBtZVsgb2Zmc2V0IF07XG5cdFx0dGhpcy55ID0gbWVbIG9mZnNldCArIDEgXTtcblx0XHR0aGlzLnogPSBtZVsgb2Zmc2V0ICsgMiBdO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRlcXVhbHM6IGZ1bmN0aW9uICggdiApIHtcblxuXHRcdHJldHVybiAoICggdi54ID09PSB0aGlzLnggKSAmJiAoIHYueSA9PT0gdGhpcy55ICkgJiYgKCB2LnogPT09IHRoaXMueiApICk7XG5cblx0fSxcblxuXHRmcm9tQXJyYXk6IGZ1bmN0aW9uICggYXJyYXksIG9mZnNldCApIHtcblxuXHRcdGlmICggb2Zmc2V0ID09PSB1bmRlZmluZWQgKSBvZmZzZXQgPSAwO1xuXG5cdFx0dGhpcy54ID0gYXJyYXlbIG9mZnNldCBdO1xuXHRcdHRoaXMueSA9IGFycmF5WyBvZmZzZXQgKyAxIF07XG5cdFx0dGhpcy56ID0gYXJyYXlbIG9mZnNldCArIDIgXTtcblxuXHRcdHJldHVybiB0aGlzO1xuXG5cdH0sXG5cblx0dG9BcnJheTogZnVuY3Rpb24gKCBhcnJheSwgb2Zmc2V0ICkge1xuXG5cdFx0aWYgKCBhcnJheSA9PT0gdW5kZWZpbmVkICkgYXJyYXkgPSBbXTtcblx0XHRpZiAoIG9mZnNldCA9PT0gdW5kZWZpbmVkICkgb2Zmc2V0ID0gMDtcblxuXHRcdGFycmF5WyBvZmZzZXQgXSA9IHRoaXMueDtcblx0XHRhcnJheVsgb2Zmc2V0ICsgMSBdID0gdGhpcy55O1xuXHRcdGFycmF5WyBvZmZzZXQgKyAyIF0gPSB0aGlzLno7XG5cblx0XHRyZXR1cm4gYXJyYXk7XG5cblx0fSxcblxuXHRmcm9tQXR0cmlidXRlOiBmdW5jdGlvbiAoIGF0dHJpYnV0ZSwgaW5kZXgsIG9mZnNldCApIHtcblxuXHQgICAgaWYgKCBvZmZzZXQgPT09IHVuZGVmaW5lZCApIG9mZnNldCA9IDA7XG5cblx0ICAgIGluZGV4ID0gaW5kZXggKiBhdHRyaWJ1dGUuaXRlbVNpemUgKyBvZmZzZXQ7XG5cblx0ICAgIHRoaXMueCA9IGF0dHJpYnV0ZS5hcnJheVsgaW5kZXggXTtcblx0ICAgIHRoaXMueSA9IGF0dHJpYnV0ZS5hcnJheVsgaW5kZXggKyAxIF07XG5cdCAgICB0aGlzLnogPSBhdHRyaWJ1dGUuYXJyYXlbIGluZGV4ICsgMiBdO1xuXG5cdCAgICByZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdGNsb25lOiBmdW5jdGlvbiAoKSB7XG5cblx0XHRyZXR1cm4gbmV3IFRIUkVFLlZlY3RvcjMoIHRoaXMueCwgdGhpcy55LCB0aGlzLnogKTtcblxuXHR9XG5cbn07XG4vKioqIEVORCBWZWN0b3IzICoqKi9cbi8qKiogU1RBUlQgRXVsZXIgKioqL1xuLyoqXG4gKiBAYXV0aG9yIG1yZG9vYiAvIGh0dHA6Ly9tcmRvb2IuY29tL1xuICogQGF1dGhvciBXZXN0TGFuZ2xleSAvIGh0dHA6Ly9naXRodWIuY29tL1dlc3RMYW5nbGV5XG4gKiBAYXV0aG9yIGJob3VzdG9uIC8gaHR0cDovL2V4b2NvcnRleC5jb21cbiAqL1xuXG5USFJFRS5FdWxlciA9IGZ1bmN0aW9uICggeCwgeSwgeiwgb3JkZXIgKSB7XG5cblx0dGhpcy5feCA9IHggfHwgMDtcblx0dGhpcy5feSA9IHkgfHwgMDtcblx0dGhpcy5feiA9IHogfHwgMDtcblx0dGhpcy5fb3JkZXIgPSBvcmRlciB8fCBUSFJFRS5FdWxlci5EZWZhdWx0T3JkZXI7XG5cbn07XG5cblRIUkVFLkV1bGVyLlJvdGF0aW9uT3JkZXJzID0gWyAnWFlaJywgJ1laWCcsICdaWFknLCAnWFpZJywgJ1lYWicsICdaWVgnIF07XG5cblRIUkVFLkV1bGVyLkRlZmF1bHRPcmRlciA9ICdYWVonO1xuXG5USFJFRS5FdWxlci5wcm90b3R5cGUgPSB7XG5cblx0Y29uc3RydWN0b3I6IFRIUkVFLkV1bGVyLFxuXG5cdF94OiAwLCBfeTogMCwgX3o6IDAsIF9vcmRlcjogVEhSRUUuRXVsZXIuRGVmYXVsdE9yZGVyLFxuXG5cdGdldCB4ICgpIHtcblxuXHRcdHJldHVybiB0aGlzLl94O1xuXG5cdH0sXG5cblx0c2V0IHggKCB2YWx1ZSApIHtcblxuXHRcdHRoaXMuX3ggPSB2YWx1ZTtcblx0XHR0aGlzLm9uQ2hhbmdlQ2FsbGJhY2soKTtcblxuXHR9LFxuXG5cdGdldCB5ICgpIHtcblxuXHRcdHJldHVybiB0aGlzLl95O1xuXG5cdH0sXG5cblx0c2V0IHkgKCB2YWx1ZSApIHtcblxuXHRcdHRoaXMuX3kgPSB2YWx1ZTtcblx0XHR0aGlzLm9uQ2hhbmdlQ2FsbGJhY2soKTtcblxuXHR9LFxuXG5cdGdldCB6ICgpIHtcblxuXHRcdHJldHVybiB0aGlzLl96O1xuXG5cdH0sXG5cblx0c2V0IHogKCB2YWx1ZSApIHtcblxuXHRcdHRoaXMuX3ogPSB2YWx1ZTtcblx0XHR0aGlzLm9uQ2hhbmdlQ2FsbGJhY2soKTtcblxuXHR9LFxuXG5cdGdldCBvcmRlciAoKSB7XG5cblx0XHRyZXR1cm4gdGhpcy5fb3JkZXI7XG5cblx0fSxcblxuXHRzZXQgb3JkZXIgKCB2YWx1ZSApIHtcblxuXHRcdHRoaXMuX29yZGVyID0gdmFsdWU7XG5cdFx0dGhpcy5vbkNoYW5nZUNhbGxiYWNrKCk7XG5cblx0fSxcblxuXHRzZXQ6IGZ1bmN0aW9uICggeCwgeSwgeiwgb3JkZXIgKSB7XG5cblx0XHR0aGlzLl94ID0geDtcblx0XHR0aGlzLl95ID0geTtcblx0XHR0aGlzLl96ID0gejtcblx0XHR0aGlzLl9vcmRlciA9IG9yZGVyIHx8IHRoaXMuX29yZGVyO1xuXG5cdFx0dGhpcy5vbkNoYW5nZUNhbGxiYWNrKCk7XG5cblx0XHRyZXR1cm4gdGhpcztcblxuXHR9LFxuXG5cdGNvcHk6IGZ1bmN0aW9uICggZXVsZXIgKSB7XG5cblx0XHR0aGlzLl94ID0gZXVsZXIuX3g7XG5cdFx0dGhpcy5feSA9IGV1bGVyLl95O1xuXHRcdHRoaXMuX3ogPSBldWxlci5fejtcblx0XHR0aGlzLl9vcmRlciA9IGV1bGVyLl9vcmRlcjtcblxuXHRcdHRoaXMub25DaGFuZ2VDYWxsYmFjaygpO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRzZXRGcm9tUm90YXRpb25NYXRyaXg6IGZ1bmN0aW9uICggbSwgb3JkZXIsIHVwZGF0ZSApIHtcblxuXHRcdHZhciBjbGFtcCA9IFRIUkVFLk1hdGguY2xhbXA7XG5cblx0XHQvLyBhc3N1bWVzIHRoZSB1cHBlciAzeDMgb2YgbSBpcyBhIHB1cmUgcm90YXRpb24gbWF0cml4IChpLmUsIHVuc2NhbGVkKVxuXG5cdFx0dmFyIHRlID0gbS5lbGVtZW50cztcblx0XHR2YXIgbTExID0gdGVbIDAgXSwgbTEyID0gdGVbIDQgXSwgbTEzID0gdGVbIDggXTtcblx0XHR2YXIgbTIxID0gdGVbIDEgXSwgbTIyID0gdGVbIDUgXSwgbTIzID0gdGVbIDkgXTtcblx0XHR2YXIgbTMxID0gdGVbIDIgXSwgbTMyID0gdGVbIDYgXSwgbTMzID0gdGVbIDEwIF07XG5cblx0XHRvcmRlciA9IG9yZGVyIHx8IHRoaXMuX29yZGVyO1xuXG5cdFx0aWYgKCBvcmRlciA9PT0gJ1hZWicgKSB7XG5cblx0XHRcdHRoaXMuX3kgPSBNYXRoLmFzaW4oIGNsYW1wKCBtMTMsIC0gMSwgMSApICk7XG5cblx0XHRcdGlmICggTWF0aC5hYnMoIG0xMyApIDwgMC45OTk5OSApIHtcblxuXHRcdFx0XHR0aGlzLl94ID0gTWF0aC5hdGFuMiggLSBtMjMsIG0zMyApO1xuXHRcdFx0XHR0aGlzLl96ID0gTWF0aC5hdGFuMiggLSBtMTIsIG0xMSApO1xuXG5cdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdHRoaXMuX3ggPSBNYXRoLmF0YW4yKCBtMzIsIG0yMiApO1xuXHRcdFx0XHR0aGlzLl96ID0gMDtcblxuXHRcdFx0fVxuXG5cdFx0fSBlbHNlIGlmICggb3JkZXIgPT09ICdZWFonICkge1xuXG5cdFx0XHR0aGlzLl94ID0gTWF0aC5hc2luKCAtIGNsYW1wKCBtMjMsIC0gMSwgMSApICk7XG5cblx0XHRcdGlmICggTWF0aC5hYnMoIG0yMyApIDwgMC45OTk5OSApIHtcblxuXHRcdFx0XHR0aGlzLl95ID0gTWF0aC5hdGFuMiggbTEzLCBtMzMgKTtcblx0XHRcdFx0dGhpcy5feiA9IE1hdGguYXRhbjIoIG0yMSwgbTIyICk7XG5cblx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0dGhpcy5feSA9IE1hdGguYXRhbjIoIC0gbTMxLCBtMTEgKTtcblx0XHRcdFx0dGhpcy5feiA9IDA7XG5cblx0XHRcdH1cblxuXHRcdH0gZWxzZSBpZiAoIG9yZGVyID09PSAnWlhZJyApIHtcblxuXHRcdFx0dGhpcy5feCA9IE1hdGguYXNpbiggY2xhbXAoIG0zMiwgLSAxLCAxICkgKTtcblxuXHRcdFx0aWYgKCBNYXRoLmFicyggbTMyICkgPCAwLjk5OTk5ICkge1xuXG5cdFx0XHRcdHRoaXMuX3kgPSBNYXRoLmF0YW4yKCAtIG0zMSwgbTMzICk7XG5cdFx0XHRcdHRoaXMuX3ogPSBNYXRoLmF0YW4yKCAtIG0xMiwgbTIyICk7XG5cblx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0dGhpcy5feSA9IDA7XG5cdFx0XHRcdHRoaXMuX3ogPSBNYXRoLmF0YW4yKCBtMjEsIG0xMSApO1xuXG5cdFx0XHR9XG5cblx0XHR9IGVsc2UgaWYgKCBvcmRlciA9PT0gJ1pZWCcgKSB7XG5cblx0XHRcdHRoaXMuX3kgPSBNYXRoLmFzaW4oIC0gY2xhbXAoIG0zMSwgLSAxLCAxICkgKTtcblxuXHRcdFx0aWYgKCBNYXRoLmFicyggbTMxICkgPCAwLjk5OTk5ICkge1xuXG5cdFx0XHRcdHRoaXMuX3ggPSBNYXRoLmF0YW4yKCBtMzIsIG0zMyApO1xuXHRcdFx0XHR0aGlzLl96ID0gTWF0aC5hdGFuMiggbTIxLCBtMTEgKTtcblxuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHR0aGlzLl94ID0gMDtcblx0XHRcdFx0dGhpcy5feiA9IE1hdGguYXRhbjIoIC0gbTEyLCBtMjIgKTtcblxuXHRcdFx0fVxuXG5cdFx0fSBlbHNlIGlmICggb3JkZXIgPT09ICdZWlgnICkge1xuXG5cdFx0XHR0aGlzLl96ID0gTWF0aC5hc2luKCBjbGFtcCggbTIxLCAtIDEsIDEgKSApO1xuXG5cdFx0XHRpZiAoIE1hdGguYWJzKCBtMjEgKSA8IDAuOTk5OTkgKSB7XG5cblx0XHRcdFx0dGhpcy5feCA9IE1hdGguYXRhbjIoIC0gbTIzLCBtMjIgKTtcblx0XHRcdFx0dGhpcy5feSA9IE1hdGguYXRhbjIoIC0gbTMxLCBtMTEgKTtcblxuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHR0aGlzLl94ID0gMDtcblx0XHRcdFx0dGhpcy5feSA9IE1hdGguYXRhbjIoIG0xMywgbTMzICk7XG5cblx0XHRcdH1cblxuXHRcdH0gZWxzZSBpZiAoIG9yZGVyID09PSAnWFpZJyApIHtcblxuXHRcdFx0dGhpcy5feiA9IE1hdGguYXNpbiggLSBjbGFtcCggbTEyLCAtIDEsIDEgKSApO1xuXG5cdFx0XHRpZiAoIE1hdGguYWJzKCBtMTIgKSA8IDAuOTk5OTkgKSB7XG5cblx0XHRcdFx0dGhpcy5feCA9IE1hdGguYXRhbjIoIG0zMiwgbTIyICk7XG5cdFx0XHRcdHRoaXMuX3kgPSBNYXRoLmF0YW4yKCBtMTMsIG0xMSApO1xuXG5cdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdHRoaXMuX3ggPSBNYXRoLmF0YW4yKCAtIG0yMywgbTMzICk7XG5cdFx0XHRcdHRoaXMuX3kgPSAwO1xuXG5cdFx0XHR9XG5cblx0XHR9IGVsc2Uge1xuXG5cdFx0XHRjb25zb2xlLndhcm4oICdUSFJFRS5FdWxlcjogLnNldEZyb21Sb3RhdGlvbk1hdHJpeCgpIGdpdmVuIHVuc3VwcG9ydGVkIG9yZGVyOiAnICsgb3JkZXIgKVxuXG5cdFx0fVxuXG5cdFx0dGhpcy5fb3JkZXIgPSBvcmRlcjtcblxuXHRcdGlmICggdXBkYXRlICE9PSBmYWxzZSApIHRoaXMub25DaGFuZ2VDYWxsYmFjaygpO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRzZXRGcm9tUXVhdGVybmlvbjogZnVuY3Rpb24gKCkge1xuXG5cdFx0dmFyIG1hdHJpeDtcblxuXHRcdHJldHVybiBmdW5jdGlvbiAoIHEsIG9yZGVyLCB1cGRhdGUgKSB7XG5cblx0XHRcdGlmICggbWF0cml4ID09PSB1bmRlZmluZWQgKSBtYXRyaXggPSBuZXcgVEhSRUUuTWF0cml4NCgpO1xuXHRcdFx0bWF0cml4Lm1ha2VSb3RhdGlvbkZyb21RdWF0ZXJuaW9uKCBxICk7XG5cdFx0XHR0aGlzLnNldEZyb21Sb3RhdGlvbk1hdHJpeCggbWF0cml4LCBvcmRlciwgdXBkYXRlICk7XG5cblx0XHRcdHJldHVybiB0aGlzO1xuXG5cdFx0fTtcblxuXHR9KCksXG5cblx0c2V0RnJvbVZlY3RvcjM6IGZ1bmN0aW9uICggdiwgb3JkZXIgKSB7XG5cblx0XHRyZXR1cm4gdGhpcy5zZXQoIHYueCwgdi55LCB2LnosIG9yZGVyIHx8IHRoaXMuX29yZGVyICk7XG5cblx0fSxcblxuXHRyZW9yZGVyOiBmdW5jdGlvbiAoKSB7XG5cblx0XHQvLyBXQVJOSU5HOiB0aGlzIGRpc2NhcmRzIHJldm9sdXRpb24gaW5mb3JtYXRpb24gLWJob3VzdG9uXG5cblx0XHR2YXIgcSA9IG5ldyBUSFJFRS5RdWF0ZXJuaW9uKCk7XG5cblx0XHRyZXR1cm4gZnVuY3Rpb24gKCBuZXdPcmRlciApIHtcblxuXHRcdFx0cS5zZXRGcm9tRXVsZXIoIHRoaXMgKTtcblx0XHRcdHRoaXMuc2V0RnJvbVF1YXRlcm5pb24oIHEsIG5ld09yZGVyICk7XG5cblx0XHR9O1xuXG5cdH0oKSxcblxuXHRlcXVhbHM6IGZ1bmN0aW9uICggZXVsZXIgKSB7XG5cblx0XHRyZXR1cm4gKCBldWxlci5feCA9PT0gdGhpcy5feCApICYmICggZXVsZXIuX3kgPT09IHRoaXMuX3kgKSAmJiAoIGV1bGVyLl96ID09PSB0aGlzLl96ICkgJiYgKCBldWxlci5fb3JkZXIgPT09IHRoaXMuX29yZGVyICk7XG5cblx0fSxcblxuXHRmcm9tQXJyYXk6IGZ1bmN0aW9uICggYXJyYXkgKSB7XG5cblx0XHR0aGlzLl94ID0gYXJyYXlbIDAgXTtcblx0XHR0aGlzLl95ID0gYXJyYXlbIDEgXTtcblx0XHR0aGlzLl96ID0gYXJyYXlbIDIgXTtcblx0XHRpZiAoIGFycmF5WyAzIF0gIT09IHVuZGVmaW5lZCApIHRoaXMuX29yZGVyID0gYXJyYXlbIDMgXTtcblxuXHRcdHRoaXMub25DaGFuZ2VDYWxsYmFjaygpO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHR0b0FycmF5OiBmdW5jdGlvbiAoKSB7XG5cblx0XHRyZXR1cm4gWyB0aGlzLl94LCB0aGlzLl95LCB0aGlzLl96LCB0aGlzLl9vcmRlciBdO1xuXG5cdH0sXG5cblx0dG9WZWN0b3IzOiBmdW5jdGlvbiAoIG9wdGlvbmFsUmVzdWx0ICkge1xuXG5cdFx0aWYgKCBvcHRpb25hbFJlc3VsdCApIHtcblxuXHRcdFx0cmV0dXJuIG9wdGlvbmFsUmVzdWx0LnNldCggdGhpcy5feCwgdGhpcy5feSwgdGhpcy5feiApO1xuXG5cdFx0fSBlbHNlIHtcblxuXHRcdFx0cmV0dXJuIG5ldyBUSFJFRS5WZWN0b3IzKCB0aGlzLl94LCB0aGlzLl95LCB0aGlzLl96ICk7XG5cblx0XHR9XG5cblx0fSxcblxuXHRvbkNoYW5nZTogZnVuY3Rpb24gKCBjYWxsYmFjayApIHtcblxuXHRcdHRoaXMub25DaGFuZ2VDYWxsYmFjayA9IGNhbGxiYWNrO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cblx0fSxcblxuXHRvbkNoYW5nZUNhbGxiYWNrOiBmdW5jdGlvbiAoKSB7fSxcblxuXHRjbG9uZTogZnVuY3Rpb24gKCkge1xuXG5cdFx0cmV0dXJuIG5ldyBUSFJFRS5FdWxlciggdGhpcy5feCwgdGhpcy5feSwgdGhpcy5feiwgdGhpcy5fb3JkZXIgKTtcblxuXHR9XG5cbn07XG4vKioqIEVORCBFdWxlciAqKiovXG4vKioqIFNUQVJUIE1hdGggKioqL1xuLyoqXG4gKiBAYXV0aG9yIGFsdGVyZWRxIC8gaHR0cDovL2FsdGVyZWRxdWFsaWEuY29tL1xuICogQGF1dGhvciBtcmRvb2IgLyBodHRwOi8vbXJkb29iLmNvbS9cbiAqL1xuXG5USFJFRS5NYXRoID0ge1xuXG5cdGdlbmVyYXRlVVVJRDogZnVuY3Rpb24gKCkge1xuXG5cdFx0Ly8gaHR0cDovL3d3dy5icm9vZmEuY29tL1Rvb2xzL01hdGgudXVpZC5odG1cblxuXHRcdHZhciBjaGFycyA9ICcwMTIzNDU2Nzg5QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5eicuc3BsaXQoICcnICk7XG5cdFx0dmFyIHV1aWQgPSBuZXcgQXJyYXkoIDM2ICk7XG5cdFx0dmFyIHJuZCA9IDAsIHI7XG5cblx0XHRyZXR1cm4gZnVuY3Rpb24gKCkge1xuXG5cdFx0XHRmb3IgKCB2YXIgaSA9IDA7IGkgPCAzNjsgaSArKyApIHtcblxuXHRcdFx0XHRpZiAoIGkgPT0gOCB8fCBpID09IDEzIHx8IGkgPT0gMTggfHwgaSA9PSAyMyApIHtcblxuXHRcdFx0XHRcdHV1aWRbIGkgXSA9ICctJztcblxuXHRcdFx0XHR9IGVsc2UgaWYgKCBpID09IDE0ICkge1xuXG5cdFx0XHRcdFx0dXVpZFsgaSBdID0gJzQnO1xuXG5cdFx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0XHRpZiAoIHJuZCA8PSAweDAyICkgcm5kID0gMHgyMDAwMDAwICsgKCBNYXRoLnJhbmRvbSgpICogMHgxMDAwMDAwICkgfCAwO1xuXHRcdFx0XHRcdHIgPSBybmQgJiAweGY7XG5cdFx0XHRcdFx0cm5kID0gcm5kID4+IDQ7XG5cdFx0XHRcdFx0dXVpZFsgaSBdID0gY2hhcnNbICggaSA9PSAxOSApID8gKCByICYgMHgzICkgfCAweDggOiByIF07XG5cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdXVpZC5qb2luKCAnJyApO1xuXG5cdFx0fTtcblxuXHR9KCksXG5cblx0Ly8gQ2xhbXAgdmFsdWUgdG8gcmFuZ2UgPGEsIGI+XG5cblx0Y2xhbXA6IGZ1bmN0aW9uICggeCwgYSwgYiApIHtcblxuXHRcdHJldHVybiAoIHggPCBhICkgPyBhIDogKCAoIHggPiBiICkgPyBiIDogeCApO1xuXG5cdH0sXG5cblx0Ly8gQ2xhbXAgdmFsdWUgdG8gcmFuZ2UgPGEsIGluZilcblxuXHRjbGFtcEJvdHRvbTogZnVuY3Rpb24gKCB4LCBhICkge1xuXG5cdFx0cmV0dXJuIHggPCBhID8gYSA6IHg7XG5cblx0fSxcblxuXHQvLyBMaW5lYXIgbWFwcGluZyBmcm9tIHJhbmdlIDxhMSwgYTI+IHRvIHJhbmdlIDxiMSwgYjI+XG5cblx0bWFwTGluZWFyOiBmdW5jdGlvbiAoIHgsIGExLCBhMiwgYjEsIGIyICkge1xuXG5cdFx0cmV0dXJuIGIxICsgKCB4IC0gYTEgKSAqICggYjIgLSBiMSApIC8gKCBhMiAtIGExICk7XG5cblx0fSxcblxuXHQvLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL1Ntb290aHN0ZXBcblxuXHRzbW9vdGhzdGVwOiBmdW5jdGlvbiAoIHgsIG1pbiwgbWF4ICkge1xuXG5cdFx0aWYgKCB4IDw9IG1pbiApIHJldHVybiAwO1xuXHRcdGlmICggeCA+PSBtYXggKSByZXR1cm4gMTtcblxuXHRcdHggPSAoIHggLSBtaW4gKSAvICggbWF4IC0gbWluICk7XG5cblx0XHRyZXR1cm4geCAqIHggKiAoIDMgLSAyICogeCApO1xuXG5cdH0sXG5cblx0c21vb3RoZXJzdGVwOiBmdW5jdGlvbiAoIHgsIG1pbiwgbWF4ICkge1xuXG5cdFx0aWYgKCB4IDw9IG1pbiApIHJldHVybiAwO1xuXHRcdGlmICggeCA+PSBtYXggKSByZXR1cm4gMTtcblxuXHRcdHggPSAoIHggLSBtaW4gKSAvICggbWF4IC0gbWluICk7XG5cblx0XHRyZXR1cm4geCAqIHggKiB4ICogKCB4ICogKCB4ICogNiAtIDE1ICkgKyAxMCApO1xuXG5cdH0sXG5cblx0Ly8gUmFuZG9tIGZsb2F0IGZyb20gPDAsIDE+IHdpdGggMTYgYml0cyBvZiByYW5kb21uZXNzXG5cdC8vIChzdGFuZGFyZCBNYXRoLnJhbmRvbSgpIGNyZWF0ZXMgcmVwZXRpdGl2ZSBwYXR0ZXJucyB3aGVuIGFwcGxpZWQgb3ZlciBsYXJnZXIgc3BhY2UpXG5cblx0cmFuZG9tMTY6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHJldHVybiAoIDY1MjgwICogTWF0aC5yYW5kb20oKSArIDI1NSAqIE1hdGgucmFuZG9tKCkgKSAvIDY1NTM1O1xuXG5cdH0sXG5cblx0Ly8gUmFuZG9tIGludGVnZXIgZnJvbSA8bG93LCBoaWdoPiBpbnRlcnZhbFxuXG5cdHJhbmRJbnQ6IGZ1bmN0aW9uICggbG93LCBoaWdoICkge1xuXG5cdFx0cmV0dXJuIE1hdGguZmxvb3IoIHRoaXMucmFuZEZsb2F0KCBsb3csIGhpZ2ggKSApO1xuXG5cdH0sXG5cblx0Ly8gUmFuZG9tIGZsb2F0IGZyb20gPGxvdywgaGlnaD4gaW50ZXJ2YWxcblxuXHRyYW5kRmxvYXQ6IGZ1bmN0aW9uICggbG93LCBoaWdoICkge1xuXG5cdFx0cmV0dXJuIGxvdyArIE1hdGgucmFuZG9tKCkgKiAoIGhpZ2ggLSBsb3cgKTtcblxuXHR9LFxuXG5cdC8vIFJhbmRvbSBmbG9hdCBmcm9tIDwtcmFuZ2UvMiwgcmFuZ2UvMj4gaW50ZXJ2YWxcblxuXHRyYW5kRmxvYXRTcHJlYWQ6IGZ1bmN0aW9uICggcmFuZ2UgKSB7XG5cblx0XHRyZXR1cm4gcmFuZ2UgKiAoIDAuNSAtIE1hdGgucmFuZG9tKCkgKTtcblxuXHR9LFxuXG5cdGRlZ1RvUmFkOiBmdW5jdGlvbiAoKSB7XG5cblx0XHR2YXIgZGVncmVlVG9SYWRpYW5zRmFjdG9yID0gTWF0aC5QSSAvIDE4MDtcblxuXHRcdHJldHVybiBmdW5jdGlvbiAoIGRlZ3JlZXMgKSB7XG5cblx0XHRcdHJldHVybiBkZWdyZWVzICogZGVncmVlVG9SYWRpYW5zRmFjdG9yO1xuXG5cdFx0fTtcblxuXHR9KCksXG5cblx0cmFkVG9EZWc6IGZ1bmN0aW9uICgpIHtcblxuXHRcdHZhciByYWRpYW5Ub0RlZ3JlZXNGYWN0b3IgPSAxODAgLyBNYXRoLlBJO1xuXG5cdFx0cmV0dXJuIGZ1bmN0aW9uICggcmFkaWFucyApIHtcblxuXHRcdFx0cmV0dXJuIHJhZGlhbnMgKiByYWRpYW5Ub0RlZ3JlZXNGYWN0b3I7XG5cblx0XHR9O1xuXG5cdH0oKSxcblxuXHRpc1Bvd2VyT2ZUd286IGZ1bmN0aW9uICggdmFsdWUgKSB7XG5cblx0XHRyZXR1cm4gKCB2YWx1ZSAmICggdmFsdWUgLSAxICkgKSA9PT0gMCAmJiB2YWx1ZSAhPT0gMDtcblxuXHR9LFxuXG5cdG5leHRQb3dlck9mVHdvOiBmdW5jdGlvbiAoIHZhbHVlICkge1xuXG5cdFx0dmFsdWUgLS07XG5cdFx0dmFsdWUgfD0gdmFsdWUgPj4gMTtcblx0XHR2YWx1ZSB8PSB2YWx1ZSA+PiAyO1xuXHRcdHZhbHVlIHw9IHZhbHVlID4+IDQ7XG5cdFx0dmFsdWUgfD0gdmFsdWUgPj4gODtcblx0XHR2YWx1ZSB8PSB2YWx1ZSA+PiAxNjtcblx0XHR2YWx1ZSArKztcblxuXHRcdHJldHVybiB2YWx1ZTtcblx0fVxuXG59O1xuXG4vKioqIEVORCBNYXRoICoqKi9cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRIUkVFO1xuIiwiLypcbiAqIENvcHlyaWdodCAyMDE1IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cbnZhciBNYXRoVXRpbCA9IHJlcXVpcmUoJy4vbWF0aC11dGlsLmpzJyk7XG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG52YXIgUk9UQVRFX1NQRUVEID0gMC41O1xuLyoqXG4gKiBQcm92aWRlcyBhIHF1YXRlcm5pb24gcmVzcG9uc2libGUgZm9yIHByZS1wYW5uaW5nIHRoZSBzY2VuZSBiZWZvcmUgZnVydGhlclxuICogdHJhbnNmb3JtYXRpb25zIGR1ZSB0byBkZXZpY2Ugc2Vuc29ycy5cbiAqL1xuZnVuY3Rpb24gVG91Y2hQYW5uZXIoKSB7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5vblRvdWNoU3RhcnRfLmJpbmQodGhpcykpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5vblRvdWNoTW92ZV8uYmluZCh0aGlzKSk7XG4gIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMub25Ub3VjaEVuZF8uYmluZCh0aGlzKSk7XG5cbiAgdGhpcy5pc1RvdWNoaW5nID0gZmFsc2U7XG4gIHRoaXMucm90YXRlU3RhcnQgPSBuZXcgTWF0aFV0aWwuVmVjdG9yMigpO1xuICB0aGlzLnJvdGF0ZUVuZCA9IG5ldyBNYXRoVXRpbC5WZWN0b3IyKCk7XG4gIHRoaXMucm90YXRlRGVsdGEgPSBuZXcgTWF0aFV0aWwuVmVjdG9yMigpO1xuXG4gIHRoaXMudGhldGEgPSAwO1xuICB0aGlzLm9yaWVudGF0aW9uID0gbmV3IE1hdGhVdGlsLlF1YXRlcm5pb24oKTtcbn1cblxuVG91Y2hQYW5uZXIucHJvdG90eXBlLmdldE9yaWVudGF0aW9uID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMub3JpZW50YXRpb24uc2V0RnJvbUV1bGVyWFlaKDAsIDAsIHRoaXMudGhldGEpO1xuICByZXR1cm4gdGhpcy5vcmllbnRhdGlvbjtcbn07XG5cblRvdWNoUGFubmVyLnByb3RvdHlwZS5yZXNldFNlbnNvciA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnRoZXRhID0gMDtcbn07XG5cblRvdWNoUGFubmVyLnByb3RvdHlwZS5vblRvdWNoU3RhcnRfID0gZnVuY3Rpb24oZSkge1xuICAvLyBPbmx5IHJlc3BvbmQgaWYgdGhlcmUgaXMgZXhhY3RseSBvbmUgdG91Y2guXG4gIGlmIChlLnRvdWNoZXMubGVuZ3RoICE9IDEpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5yb3RhdGVTdGFydC5zZXQoZS50b3VjaGVzWzBdLnBhZ2VYLCBlLnRvdWNoZXNbMF0ucGFnZVkpO1xuICB0aGlzLmlzVG91Y2hpbmcgPSB0cnVlO1xufTtcblxuVG91Y2hQYW5uZXIucHJvdG90eXBlLm9uVG91Y2hNb3ZlXyA9IGZ1bmN0aW9uKGUpIHtcbiAgaWYgKCF0aGlzLmlzVG91Y2hpbmcpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5yb3RhdGVFbmQuc2V0KGUudG91Y2hlc1swXS5wYWdlWCwgZS50b3VjaGVzWzBdLnBhZ2VZKTtcbiAgdGhpcy5yb3RhdGVEZWx0YS5zdWJWZWN0b3JzKHRoaXMucm90YXRlRW5kLCB0aGlzLnJvdGF0ZVN0YXJ0KTtcbiAgdGhpcy5yb3RhdGVTdGFydC5jb3B5KHRoaXMucm90YXRlRW5kKTtcblxuICAvLyBPbiBpT1MsIGRpcmVjdGlvbiBpcyBpbnZlcnRlZC5cbiAgaWYgKFV0aWwuaXNJT1MoKSkge1xuICAgIHRoaXMucm90YXRlRGVsdGEueCAqPSAtMTtcbiAgfVxuXG4gIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuYm9keTtcbiAgdGhpcy50aGV0YSArPSAyICogTWF0aC5QSSAqIHRoaXMucm90YXRlRGVsdGEueCAvIGVsZW1lbnQuY2xpZW50V2lkdGggKiBST1RBVEVfU1BFRUQ7XG59O1xuXG5Ub3VjaFBhbm5lci5wcm90b3R5cGUub25Ub3VjaEVuZF8gPSBmdW5jdGlvbihlKSB7XG4gIHRoaXMuaXNUb3VjaGluZyA9IGZhbHNlO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUb3VjaFBhbm5lcjtcbiIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbnZhciBvYmplY3RBc3NpZ24gPSByZXF1aXJlKCdvYmplY3QtYXNzaWduJyk7XG5cbnZhciBVdGlsID0gd2luZG93LlV0aWwgfHwge307XG5cblV0aWwuTUlOX1RJTUVTVEVQID0gMC4wMDE7XG5VdGlsLk1BWF9USU1FU1RFUCA9IDE7XG5cblV0aWwuYmFzZTY0ID0gZnVuY3Rpb24obWltZVR5cGUsIGJhc2U2NCkge1xuICByZXR1cm4gJ2RhdGE6JyArIG1pbWVUeXBlICsgJztiYXNlNjQsJyArIGJhc2U2NDtcbn07XG5cblV0aWwuY2xhbXAgPSBmdW5jdGlvbih2YWx1ZSwgbWluLCBtYXgpIHtcbiAgcmV0dXJuIE1hdGgubWluKE1hdGgubWF4KG1pbiwgdmFsdWUpLCBtYXgpO1xufTtcblxuVXRpbC5sZXJwID0gZnVuY3Rpb24oYSwgYiwgdCkge1xuICByZXR1cm4gYSArICgoYiAtIGEpICogdCk7XG59O1xuXG5VdGlsLmlzSU9TID0gKGZ1bmN0aW9uKCkge1xuICB2YXIgaXNJT1MgPSAvaVBhZHxpUGhvbmV8aVBvZC8udGVzdChuYXZpZ2F0b3IucGxhdGZvcm0pO1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGlzSU9TO1xuICB9O1xufSkoKTtcblxuVXRpbC5pc1NhZmFyaSA9IChmdW5jdGlvbigpIHtcbiAgdmFyIGlzU2FmYXJpID0gL14oKD8hY2hyb21lfGFuZHJvaWQpLikqc2FmYXJpL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBpc1NhZmFyaTtcbiAgfTtcbn0pKCk7XG5cblV0aWwuaXNGaXJlZm94QW5kcm9pZCA9IChmdW5jdGlvbigpIHtcbiAgdmFyIGlzRmlyZWZveEFuZHJvaWQgPSBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0ZpcmVmb3gnKSAhPT0gLTEgJiZcbiAgICAgIG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignQW5kcm9pZCcpICE9PSAtMTtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBpc0ZpcmVmb3hBbmRyb2lkO1xuICB9O1xufSkoKTtcblxuVXRpbC5pc0xhbmRzY2FwZU1vZGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICh3aW5kb3cub3JpZW50YXRpb24gPT0gOTAgfHwgd2luZG93Lm9yaWVudGF0aW9uID09IC05MCk7XG59O1xuXG4vLyBIZWxwZXIgbWV0aG9kIHRvIHZhbGlkYXRlIHRoZSB0aW1lIHN0ZXBzIG9mIHNlbnNvciB0aW1lc3RhbXBzLlxuVXRpbC5pc1RpbWVzdGFtcERlbHRhVmFsaWQgPSBmdW5jdGlvbih0aW1lc3RhbXBEZWx0YVMpIHtcbiAgaWYgKGlzTmFOKHRpbWVzdGFtcERlbHRhUykpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHRpbWVzdGFtcERlbHRhUyA8PSBVdGlsLk1JTl9USU1FU1RFUCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBpZiAodGltZXN0YW1wRGVsdGFTID4gVXRpbC5NQVhfVElNRVNURVApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5VdGlsLmdldFNjcmVlbldpZHRoID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBNYXRoLm1heCh3aW5kb3cuc2NyZWVuLndpZHRoLCB3aW5kb3cuc2NyZWVuLmhlaWdodCkgKlxuICAgICAgd2luZG93LmRldmljZVBpeGVsUmF0aW87XG59O1xuXG5VdGlsLmdldFNjcmVlbkhlaWdodCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gTWF0aC5taW4od2luZG93LnNjcmVlbi53aWR0aCwgd2luZG93LnNjcmVlbi5oZWlnaHQpICpcbiAgICAgIHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvO1xufTtcblxuVXRpbC5yZXF1ZXN0RnVsbHNjcmVlbiA9IGZ1bmN0aW9uKGVsZW1lbnQpIHtcbiAgaWYgKGVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW4pIHtcbiAgICBlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuKCk7XG4gIH0gZWxzZSBpZiAoZWxlbWVudC53ZWJraXRSZXF1ZXN0RnVsbHNjcmVlbikge1xuICAgIGVsZW1lbnQud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChlbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuKSB7XG4gICAgZWxlbWVudC5tb3pSZXF1ZXN0RnVsbFNjcmVlbigpO1xuICB9IGVsc2UgaWYgKGVsZW1lbnQubXNSZXF1ZXN0RnVsbHNjcmVlbikge1xuICAgIGVsZW1lbnQubXNSZXF1ZXN0RnVsbHNjcmVlbigpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuVXRpbC5leGl0RnVsbHNjcmVlbiA9IGZ1bmN0aW9uKCkge1xuICBpZiAoZG9jdW1lbnQuZXhpdEZ1bGxzY3JlZW4pIHtcbiAgICBkb2N1bWVudC5leGl0RnVsbHNjcmVlbigpO1xuICB9IGVsc2UgaWYgKGRvY3VtZW50LndlYmtpdEV4aXRGdWxsc2NyZWVuKSB7XG4gICAgZG9jdW1lbnQud2Via2l0RXhpdEZ1bGxzY3JlZW4oKTtcbiAgfSBlbHNlIGlmIChkb2N1bWVudC5tb3pDYW5jZWxGdWxsU2NyZWVuKSB7XG4gICAgZG9jdW1lbnQubW96Q2FuY2VsRnVsbFNjcmVlbigpO1xuICB9IGVsc2UgaWYgKGRvY3VtZW50Lm1zRXhpdEZ1bGxzY3JlZW4pIHtcbiAgICBkb2N1bWVudC5tc0V4aXRGdWxsc2NyZWVuKCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5VdGlsLmdldEZ1bGxzY3JlZW5FbGVtZW50ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBkb2N1bWVudC5mdWxsc2NyZWVuRWxlbWVudCB8fFxuICAgICAgZG9jdW1lbnQud2Via2l0RnVsbHNjcmVlbkVsZW1lbnQgfHxcbiAgICAgIGRvY3VtZW50Lm1vekZ1bGxTY3JlZW5FbGVtZW50IHx8XG4gICAgICBkb2N1bWVudC5tc0Z1bGxzY3JlZW5FbGVtZW50O1xufTtcblxuVXRpbC5saW5rUHJvZ3JhbSA9IGZ1bmN0aW9uKGdsLCB2ZXJ0ZXhTb3VyY2UsIGZyYWdtZW50U291cmNlLCBhdHRyaWJMb2NhdGlvbk1hcCkge1xuICAvLyBObyBlcnJvciBjaGVja2luZyBmb3IgYnJldml0eS5cbiAgdmFyIHZlcnRleFNoYWRlciA9IGdsLmNyZWF0ZVNoYWRlcihnbC5WRVJURVhfU0hBREVSKTtcbiAgZ2wuc2hhZGVyU291cmNlKHZlcnRleFNoYWRlciwgdmVydGV4U291cmNlKTtcbiAgZ2wuY29tcGlsZVNoYWRlcih2ZXJ0ZXhTaGFkZXIpO1xuXG4gIHZhciBmcmFnbWVudFNoYWRlciA9IGdsLmNyZWF0ZVNoYWRlcihnbC5GUkFHTUVOVF9TSEFERVIpO1xuICBnbC5zaGFkZXJTb3VyY2UoZnJhZ21lbnRTaGFkZXIsIGZyYWdtZW50U291cmNlKTtcbiAgZ2wuY29tcGlsZVNoYWRlcihmcmFnbWVudFNoYWRlcik7XG5cbiAgdmFyIHByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKCk7XG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCB2ZXJ0ZXhTaGFkZXIpO1xuICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgZnJhZ21lbnRTaGFkZXIpO1xuXG4gIGZvciAodmFyIGF0dHJpYk5hbWUgaW4gYXR0cmliTG9jYXRpb25NYXApXG4gICAgZ2wuYmluZEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIGF0dHJpYkxvY2F0aW9uTWFwW2F0dHJpYk5hbWVdLCBhdHRyaWJOYW1lKTtcblxuICBnbC5saW5rUHJvZ3JhbShwcm9ncmFtKTtcblxuICBnbC5kZWxldGVTaGFkZXIodmVydGV4U2hhZGVyKTtcbiAgZ2wuZGVsZXRlU2hhZGVyKGZyYWdtZW50U2hhZGVyKTtcblxuICByZXR1cm4gcHJvZ3JhbTtcbn07XG5cblV0aWwuZ2V0UHJvZ3JhbVVuaWZvcm1zID0gZnVuY3Rpb24oZ2wsIHByb2dyYW0pIHtcbiAgdmFyIHVuaWZvcm1zID0ge307XG4gIHZhciB1bmlmb3JtQ291bnQgPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHByb2dyYW0sIGdsLkFDVElWRV9VTklGT1JNUyk7XG4gIHZhciB1bmlmb3JtTmFtZSA9ICcnO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHVuaWZvcm1Db3VudDsgaSsrKSB7XG4gICAgdmFyIHVuaWZvcm1JbmZvID0gZ2wuZ2V0QWN0aXZlVW5pZm9ybShwcm9ncmFtLCBpKTtcbiAgICB1bmlmb3JtTmFtZSA9IHVuaWZvcm1JbmZvLm5hbWUucmVwbGFjZSgnWzBdJywgJycpO1xuICAgIHVuaWZvcm1zW3VuaWZvcm1OYW1lXSA9IGdsLmdldFVuaWZvcm1Mb2NhdGlvbihwcm9ncmFtLCB1bmlmb3JtTmFtZSk7XG4gIH1cbiAgcmV0dXJuIHVuaWZvcm1zO1xufTtcblxuVXRpbC5vcnRob01hdHJpeCA9IGZ1bmN0aW9uIChvdXQsIGxlZnQsIHJpZ2h0LCBib3R0b20sIHRvcCwgbmVhciwgZmFyKSB7XG4gIHZhciBsciA9IDEgLyAobGVmdCAtIHJpZ2h0KSxcbiAgICAgIGJ0ID0gMSAvIChib3R0b20gLSB0b3ApLFxuICAgICAgbmYgPSAxIC8gKG5lYXIgLSBmYXIpO1xuICBvdXRbMF0gPSAtMiAqIGxyO1xuICBvdXRbMV0gPSAwO1xuICBvdXRbMl0gPSAwO1xuICBvdXRbM10gPSAwO1xuICBvdXRbNF0gPSAwO1xuICBvdXRbNV0gPSAtMiAqIGJ0O1xuICBvdXRbNl0gPSAwO1xuICBvdXRbN10gPSAwO1xuICBvdXRbOF0gPSAwO1xuICBvdXRbOV0gPSAwO1xuICBvdXRbMTBdID0gMiAqIG5mO1xuICBvdXRbMTFdID0gMDtcbiAgb3V0WzEyXSA9IChsZWZ0ICsgcmlnaHQpICogbHI7XG4gIG91dFsxM10gPSAodG9wICsgYm90dG9tKSAqIGJ0O1xuICBvdXRbMTRdID0gKGZhciArIG5lYXIpICogbmY7XG4gIG91dFsxNV0gPSAxO1xuICByZXR1cm4gb3V0O1xufTtcblxuVXRpbC5pc01vYmlsZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY2hlY2sgPSBmYWxzZTtcbiAgKGZ1bmN0aW9uKGEpe2lmKC8oYW5kcm9pZHxiYlxcZCt8bWVlZ28pLittb2JpbGV8YXZhbnRnb3xiYWRhXFwvfGJsYWNrYmVycnl8YmxhemVyfGNvbXBhbHxlbGFpbmV8ZmVubmVjfGhpcHRvcHxpZW1vYmlsZXxpcChob25lfG9kKXxpcmlzfGtpbmRsZXxsZ2UgfG1hZW1vfG1pZHB8bW1wfG1vYmlsZS4rZmlyZWZveHxuZXRmcm9udHxvcGVyYSBtKG9ifGluKWl8cGFsbSggb3MpP3xwaG9uZXxwKGl4aXxyZSlcXC98cGx1Y2tlcnxwb2NrZXR8cHNwfHNlcmllcyg0fDYpMHxzeW1iaWFufHRyZW98dXBcXC4oYnJvd3NlcnxsaW5rKXx2b2RhZm9uZXx3YXB8d2luZG93cyBjZXx4ZGF8eGlpbm8vaS50ZXN0KGEpfHwvMTIwN3w2MzEwfDY1OTB8M2dzb3w0dGhwfDUwWzEtNl1pfDc3MHN8ODAyc3xhIHdhfGFiYWN8YWMoZXJ8b298c1xcLSl8YWkoa298cm4pfGFsKGF2fGNhfGNvKXxhbW9pfGFuKGV4fG55fHl3KXxhcHR1fGFyKGNofGdvKXxhcyh0ZXx1cyl8YXR0d3xhdShkaXxcXC1tfHIgfHMgKXxhdmFufGJlKGNrfGxsfG5xKXxiaShsYnxyZCl8YmwoYWN8YXopfGJyKGV8dil3fGJ1bWJ8YndcXC0obnx1KXxjNTVcXC98Y2FwaXxjY3dhfGNkbVxcLXxjZWxsfGNodG18Y2xkY3xjbWRcXC18Y28obXB8bmQpfGNyYXd8ZGEoaXR8bGx8bmcpfGRidGV8ZGNcXC1zfGRldml8ZGljYXxkbW9ifGRvKGN8cClvfGRzKDEyfFxcLWQpfGVsKDQ5fGFpKXxlbShsMnx1bCl8ZXIoaWN8azApfGVzbDh8ZXooWzQtN10wfG9zfHdhfHplKXxmZXRjfGZseShcXC18Xyl8ZzEgdXxnNTYwfGdlbmV8Z2ZcXC01fGdcXC1tb3xnbyhcXC53fG9kKXxncihhZHx1bil8aGFpZXxoY2l0fGhkXFwtKG18cHx0KXxoZWlcXC18aGkocHR8dGEpfGhwKCBpfGlwKXxoc1xcLWN8aHQoYyhcXC18IHxffGF8Z3xwfHN8dCl8dHApfGh1KGF3fHRjKXxpXFwtKDIwfGdvfG1hKXxpMjMwfGlhYyggfFxcLXxcXC8pfGlicm98aWRlYXxpZzAxfGlrb218aW0xa3xpbm5vfGlwYXF8aXJpc3xqYSh0fHYpYXxqYnJvfGplbXV8amlnc3xrZGRpfGtlaml8a2d0KCB8XFwvKXxrbG9ufGtwdCB8a3djXFwtfGt5byhjfGspfGxlKG5vfHhpKXxsZyggZ3xcXC8oa3xsfHUpfDUwfDU0fFxcLVthLXddKXxsaWJ3fGx5bnh8bTFcXC13fG0zZ2F8bTUwXFwvfG1hKHRlfHVpfHhvKXxtYygwMXwyMXxjYSl8bVxcLWNyfG1lKHJjfHJpKXxtaShvOHxvYXx0cyl8bW1lZnxtbygwMXwwMnxiaXxkZXxkb3x0KFxcLXwgfG98dil8enopfG10KDUwfHAxfHYgKXxtd2JwfG15d2F8bjEwWzAtMl18bjIwWzItM118bjMwKDB8Mil8bjUwKDB8Mnw1KXxuNygwKDB8MSl8MTApfG5lKChjfG0pXFwtfG9ufHRmfHdmfHdnfHd0KXxub2soNnxpKXxuenBofG8yaW18b3AodGl8d3YpfG9yYW58b3dnMXxwODAwfHBhbihhfGR8dCl8cGR4Z3xwZygxM3xcXC0oWzEtOF18YykpfHBoaWx8cGlyZXxwbChheXx1Yyl8cG5cXC0yfHBvKGNrfHJ0fHNlKXxwcm94fHBzaW98cHRcXC1nfHFhXFwtYXxxYygwN3wxMnwyMXwzMnw2MHxcXC1bMi03XXxpXFwtKXxxdGVrfHIzODB8cjYwMHxyYWtzfHJpbTl8cm8odmV8em8pfHM1NVxcL3xzYShnZXxtYXxtbXxtc3xueXx2YSl8c2MoMDF8aFxcLXxvb3xwXFwtKXxzZGtcXC98c2UoYyhcXC18MHwxKXw0N3xtY3xuZHxyaSl8c2doXFwtfHNoYXJ8c2llKFxcLXxtKXxza1xcLTB8c2woNDV8aWQpfHNtKGFsfGFyfGIzfGl0fHQ1KXxzbyhmdHxueSl8c3AoMDF8aFxcLXx2XFwtfHYgKXxzeSgwMXxtYil8dDIoMTh8NTApfHQ2KDAwfDEwfDE4KXx0YShndHxsayl8dGNsXFwtfHRkZ1xcLXx0ZWwoaXxtKXx0aW1cXC18dFxcLW1vfHRvKHBsfHNoKXx0cyg3MHxtXFwtfG0zfG01KXx0eFxcLTl8dXAoXFwuYnxnMXxzaSl8dXRzdHx2NDAwfHY3NTB8dmVyaXx2aShyZ3x0ZSl8dmsoNDB8NVswLTNdfFxcLXYpfHZtNDB8dm9kYXx2dWxjfHZ4KDUyfDUzfDYwfDYxfDcwfDgwfDgxfDgzfDg1fDk4KXx3M2MoXFwtfCApfHdlYmN8d2hpdHx3aShnIHxuY3xudyl8d21sYnx3b251fHg3MDB8eWFzXFwtfHlvdXJ8emV0b3x6dGVcXC0vaS50ZXN0KGEuc3Vic3RyKDAsNCkpKWNoZWNrID0gdHJ1ZX0pKG5hdmlnYXRvci51c2VyQWdlbnR8fG5hdmlnYXRvci52ZW5kb3J8fHdpbmRvdy5vcGVyYSk7XG4gIHJldHVybiBjaGVjaztcbn07XG5cblV0aWwuZXh0ZW5kID0gb2JqZWN0QXNzaWduO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFV0aWw7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgRW1pdHRlciA9IHJlcXVpcmUoJy4vZW1pdHRlci5qcycpO1xudmFyIFV0aWwgPSByZXF1aXJlKCcuL3V0aWwuanMnKTtcbnZhciBEZXZpY2VJbmZvID0gcmVxdWlyZSgnLi9kZXZpY2UtaW5mby5qcycpO1xuXG52YXIgREVGQVVMVF9WSUVXRVIgPSAnQ2FyZGJvYXJkVjEnO1xudmFyIFZJRVdFUl9LRVkgPSAnV0VCVlJfQ0FSREJPQVJEX1ZJRVdFUic7XG52YXIgQ0xBU1NfTkFNRSA9ICd3ZWJ2ci1wb2x5ZmlsbC12aWV3ZXItc2VsZWN0b3InO1xuXG4vKipcbiAqIENyZWF0ZXMgYSB2aWV3ZXIgc2VsZWN0b3Igd2l0aCB0aGUgb3B0aW9ucyBzcGVjaWZpZWQuIFN1cHBvcnRzIGJlaW5nIHNob3duXG4gKiBhbmQgaGlkZGVuLiBHZW5lcmF0ZXMgZXZlbnRzIHdoZW4gdmlld2VyIHBhcmFtZXRlcnMgY2hhbmdlLiBBbHNvIHN1cHBvcnRzXG4gKiBzYXZpbmcgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBpbmRleCBpbiBsb2NhbFN0b3JhZ2UuXG4gKi9cbmZ1bmN0aW9uIFZpZXdlclNlbGVjdG9yKCkge1xuICAvLyBUcnkgdG8gbG9hZCB0aGUgc2VsZWN0ZWQga2V5IGZyb20gbG9jYWwgc3RvcmFnZS4gSWYgbm9uZSBleGlzdHMsIHVzZSB0aGVcbiAgLy8gZGVmYXVsdCBrZXkuXG4gIHRyeSB7XG4gICAgdGhpcy5zZWxlY3RlZEtleSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFZJRVdFUl9LRVkpIHx8IERFRkFVTFRfVklFV0VSO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBsb2FkIHZpZXdlciBwcm9maWxlOiAlcycsIGVycm9yKTtcbiAgfVxuICB0aGlzLmRpYWxvZyA9IHRoaXMuY3JlYXRlRGlhbG9nXyhEZXZpY2VJbmZvLlZpZXdlcnMpO1xuICB0aGlzLnJvb3QgPSBudWxsO1xufVxuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlID0gbmV3IEVtaXR0ZXIoKTtcblxuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbihyb290KSB7XG4gIHRoaXMucm9vdCA9IHJvb3Q7XG5cbiAgcm9vdC5hcHBlbmRDaGlsZCh0aGlzLmRpYWxvZyk7XG4gIC8vY29uc29sZS5sb2coJ1ZpZXdlclNlbGVjdG9yLnNob3cnKTtcblxuICAvLyBFbnN1cmUgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBpdGVtIGlzIGNoZWNrZWQuXG4gIHZhciBzZWxlY3RlZCA9IHRoaXMuZGlhbG9nLnF1ZXJ5U2VsZWN0b3IoJyMnICsgdGhpcy5zZWxlY3RlZEtleSk7XG4gIHNlbGVjdGVkLmNoZWNrZWQgPSB0cnVlO1xuXG4gIC8vIFNob3cgdGhlIFVJLlxuICB0aGlzLmRpYWxvZy5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbn07XG5cblZpZXdlclNlbGVjdG9yLnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLnJvb3QgJiYgdGhpcy5yb290LmNvbnRhaW5zKHRoaXMuZGlhbG9nKSkge1xuICAgIHRoaXMucm9vdC5yZW1vdmVDaGlsZCh0aGlzLmRpYWxvZyk7XG4gIH1cbiAgLy9jb25zb2xlLmxvZygnVmlld2VyU2VsZWN0b3IuaGlkZScpO1xuICB0aGlzLmRpYWxvZy5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xufTtcblxuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlLmdldEN1cnJlbnRWaWV3ZXIgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIERldmljZUluZm8uVmlld2Vyc1t0aGlzLnNlbGVjdGVkS2V5XTtcbn07XG5cblZpZXdlclNlbGVjdG9yLnByb3RvdHlwZS5nZXRTZWxlY3RlZEtleV8gPSBmdW5jdGlvbigpIHtcbiAgdmFyIGlucHV0ID0gdGhpcy5kaWFsb2cucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1maWVsZF06Y2hlY2tlZCcpO1xuICBpZiAoaW5wdXQpIHtcbiAgICByZXR1cm4gaW5wdXQuaWQ7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5WaWV3ZXJTZWxlY3Rvci5wcm90b3R5cGUub25TYXZlXyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnNlbGVjdGVkS2V5ID0gdGhpcy5nZXRTZWxlY3RlZEtleV8oKTtcbiAgaWYgKCF0aGlzLnNlbGVjdGVkS2V5IHx8ICFEZXZpY2VJbmZvLlZpZXdlcnNbdGhpcy5zZWxlY3RlZEtleV0pIHtcbiAgICBjb25zb2xlLmVycm9yKCdWaWV3ZXJTZWxlY3Rvci5vblNhdmVfOiB0aGlzIHNob3VsZCBuZXZlciBoYXBwZW4hJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGhpcy5lbWl0KCdjaGFuZ2UnLCBEZXZpY2VJbmZvLlZpZXdlcnNbdGhpcy5zZWxlY3RlZEtleV0pO1xuXG4gIC8vIEF0dGVtcHQgdG8gc2F2ZSB0aGUgdmlld2VyIHByb2ZpbGUsIGJ1dCBmYWlscyBpbiBwcml2YXRlIG1vZGUuXG4gIHRyeSB7XG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oVklFV0VSX0tFWSwgdGhpcy5zZWxlY3RlZEtleSk7XG4gIH0gY2F0Y2goZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gc2F2ZSB2aWV3ZXIgcHJvZmlsZTogJXMnLCBlcnJvcik7XG4gIH1cbiAgdGhpcy5oaWRlKCk7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgdGhlIGRpYWxvZy5cbiAqL1xuVmlld2VyU2VsZWN0b3IucHJvdG90eXBlLmNyZWF0ZURpYWxvZ18gPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHZhciBjb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgY29udGFpbmVyLmNsYXNzTGlzdC5hZGQoQ0xBU1NfTkFNRSk7XG4gIGNvbnRhaW5lci5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAvLyBDcmVhdGUgYW4gb3ZlcmxheSB0aGF0IGRpbXMgdGhlIGJhY2tncm91bmQsIGFuZCB3aGljaCBnb2VzIGF3YXkgd2hlbiB5b3VcbiAgLy8gdGFwIGl0LlxuICB2YXIgb3ZlcmxheSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICB2YXIgcyA9IG92ZXJsYXkuc3R5bGU7XG4gIHMucG9zaXRpb24gPSAnZml4ZWQnO1xuICBzLmxlZnQgPSAwO1xuICBzLnRvcCA9IDA7XG4gIHMud2lkdGggPSAnMTAwJSc7XG4gIHMuaGVpZ2h0ID0gJzEwMCUnO1xuICBzLmJhY2tncm91bmQgPSAncmdiYSgwLCAwLCAwLCAwLjMpJztcbiAgb3ZlcmxheS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuaGlkZS5iaW5kKHRoaXMpKTtcblxuICB2YXIgd2lkdGggPSAyODA7XG4gIHZhciBkaWFsb2cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgdmFyIHMgPSBkaWFsb2cuc3R5bGU7XG4gIHMuYm94U2l6aW5nID0gJ2JvcmRlci1ib3gnO1xuICBzLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgcy50b3AgPSAnMjRweCc7XG4gIHMubGVmdCA9ICc1MCUnO1xuICBzLm1hcmdpbkxlZnQgPSAoLXdpZHRoLzIpICsgJ3B4JztcbiAgcy53aWR0aCA9IHdpZHRoICsgJ3B4JztcbiAgcy5wYWRkaW5nID0gJzI0cHgnO1xuICBzLm92ZXJmbG93ID0gJ2hpZGRlbic7XG4gIHMuYmFja2dyb3VuZCA9ICcjZmFmYWZhJztcbiAgcy5mb250RmFtaWx5ID0gXCInUm9ib3RvJywgc2Fucy1zZXJpZlwiO1xuICBzLmJveFNoYWRvdyA9ICcwcHggNXB4IDIwcHggIzY2Nic7XG5cbiAgZGlhbG9nLmFwcGVuZENoaWxkKHRoaXMuY3JlYXRlSDFfKCdTZWxlY3QgeW91ciB2aWV3ZXInKSk7XG4gIGZvciAodmFyIGlkIGluIG9wdGlvbnMpIHtcbiAgICBkaWFsb2cuYXBwZW5kQ2hpbGQodGhpcy5jcmVhdGVDaG9pY2VfKGlkLCBvcHRpb25zW2lkXS5sYWJlbCkpO1xuICB9XG4gIGRpYWxvZy5hcHBlbmRDaGlsZCh0aGlzLmNyZWF0ZUJ1dHRvbl8oJ1NhdmUnLCB0aGlzLm9uU2F2ZV8uYmluZCh0aGlzKSkpO1xuXG4gIGNvbnRhaW5lci5hcHBlbmRDaGlsZChvdmVybGF5KTtcbiAgY29udGFpbmVyLmFwcGVuZENoaWxkKGRpYWxvZyk7XG5cbiAgcmV0dXJuIGNvbnRhaW5lcjtcbn07XG5cblZpZXdlclNlbGVjdG9yLnByb3RvdHlwZS5jcmVhdGVIMV8gPSBmdW5jdGlvbihuYW1lKSB7XG4gIHZhciBoMSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2gxJyk7XG4gIHZhciBzID0gaDEuc3R5bGU7XG4gIHMuY29sb3IgPSAnYmxhY2snO1xuICBzLmZvbnRTaXplID0gJzIwcHgnO1xuICBzLmZvbnRXZWlnaHQgPSAnYm9sZCc7XG4gIHMubWFyZ2luVG9wID0gMDtcbiAgcy5tYXJnaW5Cb3R0b20gPSAnMjRweCc7XG4gIGgxLmlubmVySFRNTCA9IG5hbWU7XG4gIHJldHVybiBoMTtcbn07XG5cblZpZXdlclNlbGVjdG9yLnByb3RvdHlwZS5jcmVhdGVDaG9pY2VfID0gZnVuY3Rpb24oaWQsIG5hbWUpIHtcbiAgLypcbiAgPGRpdiBjbGFzcz1cImNob2ljZVwiPlxuICA8aW5wdXQgaWQ9XCJ2MVwiIHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJmaWVsZFwiIHZhbHVlPVwidjFcIj5cbiAgPGxhYmVsIGZvcj1cInYxXCI+Q2FyZGJvYXJkIFYxPC9sYWJlbD5cbiAgPC9kaXY+XG4gICovXG4gIHZhciBkaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgZGl2LnN0eWxlLm1hcmdpblRvcCA9ICc4cHgnO1xuICBkaXYuc3R5bGUuY29sb3IgPSAnYmxhY2snO1xuXG4gIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gIGlucHV0LnN0eWxlLmZvbnRTaXplID0gJzMwcHgnO1xuICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ2lkJywgaWQpO1xuICBpbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAncmFkaW8nKTtcbiAgaW5wdXQuc2V0QXR0cmlidXRlKCd2YWx1ZScsIGlkKTtcbiAgaW5wdXQuc2V0QXR0cmlidXRlKCduYW1lJywgJ2ZpZWxkJyk7XG5cbiAgdmFyIGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGFiZWwnKTtcbiAgbGFiZWwuc3R5bGUubWFyZ2luTGVmdCA9ICc0cHgnO1xuICBsYWJlbC5zZXRBdHRyaWJ1dGUoJ2ZvcicsIGlkKTtcbiAgbGFiZWwuaW5uZXJIVE1MID0gbmFtZTtcblxuICBkaXYuYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICBkaXYuYXBwZW5kQ2hpbGQobGFiZWwpO1xuXG4gIHJldHVybiBkaXY7XG59O1xuXG5WaWV3ZXJTZWxlY3Rvci5wcm90b3R5cGUuY3JlYXRlQnV0dG9uXyA9IGZ1bmN0aW9uKGxhYmVsLCBvbmNsaWNrKSB7XG4gIHZhciBidXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcbiAgYnV0dG9uLmlubmVySFRNTCA9IGxhYmVsO1xuICB2YXIgcyA9IGJ1dHRvbi5zdHlsZTtcbiAgcy5mbG9hdCA9ICdyaWdodCc7XG4gIHMudGV4dFRyYW5zZm9ybSA9ICd1cHBlcmNhc2UnO1xuICBzLmNvbG9yID0gJyMxMDk0ZjcnO1xuICBzLmZvbnRTaXplID0gJzE0cHgnO1xuICBzLmxldHRlclNwYWNpbmcgPSAwO1xuICBzLmJvcmRlciA9IDA7XG4gIHMuYmFja2dyb3VuZCA9ICdub25lJztcbiAgcy5tYXJnaW5Ub3AgPSAnMTZweCc7XG5cbiAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgb25jbGljayk7XG5cbiAgcmV0dXJuIGJ1dHRvbjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVmlld2VyU2VsZWN0b3I7XG4iLCIvKlxuICogQ29weXJpZ2h0IDIwMTUgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG52YXIgVXRpbCA9IHJlcXVpcmUoJy4vdXRpbC5qcycpO1xuXG4vKipcbiAqIEFuZHJvaWQgYW5kIGlPUyBjb21wYXRpYmxlIHdha2Vsb2NrIGltcGxlbWVudGF0aW9uLlxuICpcbiAqIFJlZmFjdG9yZWQgdGhhbmtzIHRvIGRrb3ZhbGV2QC5cbiAqL1xuZnVuY3Rpb24gQW5kcm9pZFdha2VMb2NrKCkge1xuICB2YXIgdmlkZW8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd2aWRlbycpO1xuXG4gIHZpZGVvLmFkZEV2ZW50TGlzdGVuZXIoJ2VuZGVkJywgZnVuY3Rpb24oKSB7XG4gICAgdmlkZW8ucGxheSgpO1xuICB9KTtcblxuICB0aGlzLnJlcXVlc3QgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAodmlkZW8ucGF1c2VkKSB7XG4gICAgICAvLyBCYXNlNjQgdmVyc2lvbiBvZiB2aWRlb3Nfc3JjL25vLXNsZWVwLTEyMHMubXA0LlxuICAgICAgdmlkZW8uc3JjID0gVXRpbC5iYXNlNjQoJ3ZpZGVvL21wNCcsICdBQUFBR0daMGVYQnBjMjl0QUFBQUFHMXdOREZoZG1NeEFBQUlBMjF2YjNZQUFBQnNiWFpvWkFBQUFBRFNhOXY2MG12YitnQUJYNUFBbHcvZ0FBRUFBQUVBQUFBQUFBQUFBQUFBQUFBQkFBQUFBQUFBQUFBQUFBQUFBQUFBQVFBQUFBQUFBQUFBQUFBQUFBQUFRQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFJQUFBZGtkSEpoYXdBQUFGeDBhMmhrQUFBQUFkSnIyL3JTYTl2NkFBQUFBUUFBQUFBQWx3L2dBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUJBQUFBQUFBQUFBQUFBQUFBQUFBQUFRQUFBQUFBQUFBQUFBQUFBQUFBUUFBQUFBQVFBQUFBSEFBQUFBQUFKR1ZrZEhNQUFBQWNaV3h6ZEFBQUFBQUFBQUFCQUpjUDRBQUFBQUFBQVFBQUFBQUczRzFrYVdFQUFBQWdiV1JvWkFBQUFBRFNhOXY2MG12YitnQVBRa0FHam5lQUZjY0FBQUFBQUMxb1pHeHlBQUFBQUFBQUFBQjJhV1JsQUFBQUFBQUFBQUFBQUFBQVZtbGtaVzlJWVc1a2JHVnlBQUFBQm9kdGFXNW1BQUFBRkhadGFHUUFBQUFCQUFBQUFBQUFBQUFBQUFBa1pHbHVaZ0FBQUJ4a2NtVm1BQUFBQUFBQUFBRUFBQUFNZFhKc0lBQUFBQUVBQUFaSGMzUmliQUFBQUpkemRITmtBQUFBQUFBQUFBRUFBQUNIWVhaak1RQUFBQUFBQUFBQkFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBTUFCd0FTQUFBQUVnQUFBQUFBQUFBQVFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQmovL3dBQUFERmhkbU5EQVdRQUMvL2hBQmxuWkFBTHJObGZsbHc0UUFBQUF3QkFBQUFEQUtQRkNtV0FBUUFGYU92c3Npd0FBQUFZYzNSMGN3QUFBQUFBQUFBQkFBQUFiZ0FQUWtBQUFBQVVjM1J6Y3dBQUFBQUFBQUFCQUFBQUFRQUFBNEJqZEhSekFBQUFBQUFBQUc0QUFBQUJBRDBKQUFBQUFBRUFlaElBQUFBQUFRQTlDUUFBQUFBQkFBQUFBQUFBQUFFQUQwSkFBQUFBQVFCTVMwQUFBQUFCQUI2RWdBQUFBQUVBQUFBQUFBQUFBUUFQUWtBQUFBQUJBRXhMUUFBQUFBRUFIb1NBQUFBQUFRQUFBQUFBQUFBQkFBOUNRQUFBQUFFQVRFdEFBQUFBQVFBZWhJQUFBQUFCQUFBQUFBQUFBQUVBRDBKQUFBQUFBUUJNUzBBQUFBQUJBQjZFZ0FBQUFBRUFBQUFBQUFBQUFRQVBRa0FBQUFBQkFFeExRQUFBQUFFQUhvU0FBQUFBQVFBQUFBQUFBQUFCQUE5Q1FBQUFBQUVBVEV0QUFBQUFBUUFlaElBQUFBQUJBQUFBQUFBQUFBRUFEMEpBQUFBQUFRQk1TMEFBQUFBQkFCNkVnQUFBQUFFQUFBQUFBQUFBQVFBUFFrQUFBQUFCQUV4TFFBQUFBQUVBSG9TQUFBQUFBUUFBQUFBQUFBQUJBQTlDUUFBQUFBRUFURXRBQUFBQUFRQWVoSUFBQUFBQkFBQUFBQUFBQUFFQUQwSkFBQUFBQVFCTVMwQUFBQUFCQUI2RWdBQUFBQUVBQUFBQUFBQUFBUUFQUWtBQUFBQUJBRXhMUUFBQUFBRUFIb1NBQUFBQUFRQUFBQUFBQUFBQkFBOUNRQUFBQUFFQVRFdEFBQUFBQVFBZWhJQUFBQUFCQUFBQUFBQUFBQUVBRDBKQUFBQUFBUUJNUzBBQUFBQUJBQjZFZ0FBQUFBRUFBQUFBQUFBQUFRQVBRa0FBQUFBQkFFeExRQUFBQUFFQUhvU0FBQUFBQVFBQUFBQUFBQUFCQUE5Q1FBQUFBQUVBVEV0QUFBQUFBUUFlaElBQUFBQUJBQUFBQUFBQUFBRUFEMEpBQUFBQUFRQk1TMEFBQUFBQkFCNkVnQUFBQUFFQUFBQUFBQUFBQVFBUFFrQUFBQUFCQUV4TFFBQUFBQUVBSG9TQUFBQUFBUUFBQUFBQUFBQUJBQTlDUUFBQUFBRUFURXRBQUFBQUFRQWVoSUFBQUFBQkFBQUFBQUFBQUFFQUQwSkFBQUFBQVFCTVMwQUFBQUFCQUI2RWdBQUFBQUVBQUFBQUFBQUFBUUFQUWtBQUFBQUJBRXhMUUFBQUFBRUFIb1NBQUFBQUFRQUFBQUFBQUFBQkFBOUNRQUFBQUFFQVRFdEFBQUFBQVFBZWhJQUFBQUFCQUFBQUFBQUFBQUVBRDBKQUFBQUFBUUJNUzBBQUFBQUJBQjZFZ0FBQUFBRUFBQUFBQUFBQUFRQVBRa0FBQUFBQkFFeExRQUFBQUFFQUhvU0FBQUFBQVFBQUFBQUFBQUFCQUE5Q1FBQUFBQUVBVEV0QUFBQUFBUUFlaElBQUFBQUJBQUFBQUFBQUFBRUFEMEpBQUFBQUFRQk1TMEFBQUFBQkFCNkVnQUFBQUFFQUFBQUFBQUFBQVFBUFFrQUFBQUFCQUV4TFFBQUFBQUVBSG9TQUFBQUFBUUFBQUFBQUFBQUJBQTlDUUFBQUFBRUFMY2JBQUFBQUhITjBjMk1BQUFBQUFBQUFBUUFBQUFFQUFBQnVBQUFBQVFBQUFjeHpkSE42QUFBQUFBQUFBQUFBQUFCdUFBQURDUUFBQUJnQUFBQU9BQUFBRGdBQUFBd0FBQUFTQUFBQURnQUFBQXdBQUFBTUFBQUFFZ0FBQUE0QUFBQU1BQUFBREFBQUFCSUFBQUFPQUFBQURBQUFBQXdBQUFBU0FBQUFEZ0FBQUF3QUFBQU1BQUFBRWdBQUFBNEFBQUFNQUFBQURBQUFBQklBQUFBT0FBQUFEQUFBQUF3QUFBQVNBQUFBRGdBQUFBd0FBQUFNQUFBQUVnQUFBQTRBQUFBTUFBQUFEQUFBQUJJQUFBQU9BQUFBREFBQUFBd0FBQUFTQUFBQURnQUFBQXdBQUFBTUFBQUFFZ0FBQUE0QUFBQU1BQUFBREFBQUFCSUFBQUFPQUFBQURBQUFBQXdBQUFBU0FBQUFEZ0FBQUF3QUFBQU1BQUFBRWdBQUFBNEFBQUFNQUFBQURBQUFBQklBQUFBT0FBQUFEQUFBQUF3QUFBQVNBQUFBRGdBQUFBd0FBQUFNQUFBQUVnQUFBQTRBQUFBTUFBQUFEQUFBQUJJQUFBQU9BQUFBREFBQUFBd0FBQUFTQUFBQURnQUFBQXdBQUFBTUFBQUFFZ0FBQUE0QUFBQU1BQUFBREFBQUFCSUFBQUFPQUFBQURBQUFBQXdBQUFBU0FBQUFEZ0FBQUF3QUFBQU1BQUFBRWdBQUFBNEFBQUFNQUFBQURBQUFBQklBQUFBT0FBQUFEQUFBQUF3QUFBQVNBQUFBRGdBQUFBd0FBQUFNQUFBQUVnQUFBQTRBQUFBTUFBQUFEQUFBQUJNQUFBQVVjM1JqYndBQUFBQUFBQUFCQUFBSUt3QUFBQ3QxWkhSaEFBQUFJNmxsYm1NQUZ3QUFkbXhqSURJdU1pNHhJSE4wY21WaGJTQnZkWFJ3ZFhRQUFBQUlkMmxrWlFBQUNSUnRaR0YwQUFBQ3JnWC8vNnZjUmVtOTV0bEl0NVlzMkNEWkkrN3ZlREkyTkNBdElHTnZjbVVnTVRReUlDMGdTQzR5TmpRdlRWQkZSeTAwSUVGV1F5QmpiMlJsWXlBdElFTnZjSGxzWldaMElESXdNRE10TWpBeE5DQXRJR2gwZEhBNkx5OTNkM2N1ZG1sa1pXOXNZVzR1YjNKbkwzZ3lOalF1YUhSdGJDQXRJRzl3ZEdsdmJuTTZJR05oWW1GalBURWdjbVZtUFRNZ1pHVmliRzlqYXoweE9qQTZNQ0JoYm1Gc2VYTmxQVEI0TXpvd2VERXpJRzFsUFdobGVDQnpkV0p0WlQwM0lIQnplVDB4SUhCemVWOXlaRDB4TGpBd09qQXVNREFnYldsNFpXUmZjbVZtUFRFZ2JXVmZjbUZ1WjJVOU1UWWdZMmh5YjIxaFgyMWxQVEVnZEhKbGJHeHBjejB4SURoNE9HUmpkRDB4SUdOeGJUMHdJR1JsWVdSNmIyNWxQVEl4TERFeElHWmhjM1JmY0hOcmFYQTlNU0JqYUhKdmJXRmZjWEJmYjJabWMyVjBQUzB5SUhSb2NtVmhaSE05TVRJZ2JHOXZhMkZvWldGa1gzUm9jbVZoWkhNOU1TQnpiR2xqWldSZmRHaHlaV0ZrY3owd0lHNXlQVEFnWkdWamFXMWhkR1U5TVNCcGJuUmxjbXhoWTJWa1BUQWdZbXgxY21GNVgyTnZiWEJoZEQwd0lHTnZibk4wY21GcGJtVmtYMmx1ZEhKaFBUQWdZbVp5WVcxbGN6MHpJR0pmY0hseVlXMXBaRDB5SUdKZllXUmhjSFE5TVNCaVgySnBZWE05TUNCa2FYSmxZM1E5TVNCM1pXbG5hSFJpUFRFZ2IzQmxibDluYjNBOU1DQjNaV2xuYUhSd1BUSWdhMlY1YVc1MFBUSTFNQ0JyWlhscGJuUmZiV2x1UFRFZ2MyTmxibVZqZFhROU5EQWdhVzUwY21GZmNtVm1jbVZ6YUQwd0lISmpYMnh2YjJ0aGFHVmhaRDAwTUNCeVl6MWhZbklnYldKMGNtVmxQVEVnWW1sMGNtRjBaVDB4TURBZ2NtRjBaWFJ2YkQweExqQWdjV052YlhBOU1DNDJNQ0J4Y0cxcGJqMHhNQ0J4Y0cxaGVEMDFNU0J4Y0hOMFpYQTlOQ0JwY0Y5eVlYUnBiejB4TGpRd0lHRnhQVEU2TVM0d01BQ0FBQUFBVTJXSWhBQVEvOGx0bE9lK2NUWnVHa0tnK2FSdHVpdmNEWjBwQnNmc0VpOXAvaTF5VTlEeFMybHE0ZFhUaW5WaUYxVVJCS1hnbnpLQmQvVWgxYmtoSHRNcndyUmNPSnNsRDAxVUIrZnlhTDZlZitEQkFBQUFGRUdhSkd4QkQ1Qit2K2ErNFFxRjNNZ0JYejlNQUFBQUNrR2VRbmlILys5NHI2RUFBQUFLQVo1aGRFTi84UXl0d0FBQUFBZ0JubU5xUTMvRWdRQUFBQTVCbW1oSnFFRm9tVXdJSWYvKzRRQUFBQXBCbm9aRkVTdy8vNzZCQUFBQUNBR2VwWFJEZjhTQkFBQUFDQUdlcDJwRGY4U0FBQUFBRGtHYXJFbW9RV3laVEFnaC8vN2dBQUFBQ2tHZXlrVVZMRC8vdm9FQUFBQUlBWjdwZEVOL3hJQUFBQUFJQVo3cmFrTi94SUFBQUFBT1FacndTYWhCYkpsTUNDSC8vdUVBQUFBS1FaOE9SUlVzUC8rK2dRQUFBQWdCbnkxMFEzL0VnUUFBQUFnQm55OXFRMy9FZ0FBQUFBNUJtelJKcUVGc21Vd0lJZi8rNEFBQUFBcEJuMUpGRlN3Ly83NkJBQUFBQ0FHZmNYUkRmOFNBQUFBQUNBR2ZjMnBEZjhTQUFBQUFEa0diZUVtb1FXeVpUQWdoLy83aEFBQUFDa0dmbGtVVkxELy92b0FBQUFBSUFaKzFkRU4veElFQUFBQUlBWiszYWtOL3hJRUFBQUFPUVp1OFNhaEJiSmxNQ0NILy91QUFBQUFLUVovYVJSVXNQLysrZ1FBQUFBZ0JuL2wwUTMvRWdBQUFBQWdCbi90cVEzL0VnUUFBQUE1Qm0rQkpxRUZzbVV3SUlmLys0UUFBQUFwQm5oNUZGU3cvLzc2QUFBQUFDQUdlUFhSRGY4U0FBQUFBQ0FHZVAycERmOFNCQUFBQURrR2FKRW1vUVd5WlRBZ2gvLzdnQUFBQUNrR2VRa1VWTEQvL3ZvRUFBQUFJQVo1aGRFTi94SUFBQUFBSUFaNWpha04veElFQUFBQU9RWnBvU2FoQmJKbE1DQ0gvL3VFQUFBQUtRWjZHUlJVc1AvKytnUUFBQUFnQm5xVjBRMy9FZ1FBQUFBZ0JucWRxUTMvRWdBQUFBQTVCbXF4SnFFRnNtVXdJSWYvKzRBQUFBQXBCbnNwRkZTdy8vNzZCQUFBQUNBR2U2WFJEZjhTQUFBQUFDQUdlNjJwRGY4U0FBQUFBRGtHYThFbW9RV3laVEFnaC8vN2hBQUFBQ2tHZkRrVVZMRC8vdm9FQUFBQUlBWjh0ZEVOL3hJRUFBQUFJQVo4dmFrTi94SUFBQUFBT1FaczBTYWhCYkpsTUNDSC8vdUFBQUFBS1FaOVNSUlVzUC8rK2dRQUFBQWdCbjNGMFEzL0VnQUFBQUFnQm4zTnFRMy9FZ0FBQUFBNUJtM2hKcUVGc21Vd0lJZi8rNFFBQUFBcEJuNVpGRlN3Ly83NkFBQUFBQ0FHZnRYUkRmOFNCQUFBQUNBR2Z0MnBEZjhTQkFBQUFEa0didkVtb1FXeVpUQWdoLy83Z0FBQUFDa0dmMmtVVkxELy92b0VBQUFBSUFaLzVkRU4veElBQUFBQUlBWi83YWtOL3hJRUFBQUFPUVp2Z1NhaEJiSmxNQ0NILy91RUFBQUFLUVo0ZVJSVXNQLysrZ0FBQUFBZ0JuajEwUTMvRWdBQUFBQWdCbmo5cVEzL0VnUUFBQUE1Qm1pUkpxRUZzbVV3SUlmLys0QUFBQUFwQm5rSkZGU3cvLzc2QkFBQUFDQUdlWVhSRGY4U0FBQUFBQ0FHZVkycERmOFNCQUFBQURrR2FhRW1vUVd5WlRBZ2gvLzdoQUFBQUNrR2Voa1VWTEQvL3ZvRUFBQUFJQVo2bGRFTi94SUVBQUFBSUFaNm5ha04veElBQUFBQU9RWnFzU2FoQmJKbE1DQ0gvL3VBQUFBQUtRWjdLUlJVc1AvKytnUUFBQUFnQm51bDBRMy9FZ0FBQUFBZ0JudXRxUTMvRWdBQUFBQTVCbXZCSnFFRnNtVXdJSWYvKzRRQUFBQXBCbnc1RkZTdy8vNzZCQUFBQUNBR2ZMWFJEZjhTQkFBQUFDQUdmTDJwRGY4U0FBQUFBRGtHYk5FbW9RV3laVEFnaC8vN2dBQUFBQ2tHZlVrVVZMRC8vdm9FQUFBQUlBWjl4ZEVOL3hJQUFBQUFJQVo5emFrTi94SUFBQUFBT1FadDRTYWhCYkpsTUNDSC8vdUVBQUFBS1FaK1dSUlVzUC8rK2dBQUFBQWdCbjdWMFEzL0VnUUFBQUFnQm43ZHFRMy9FZ1FBQUFBNUJtN3hKcUVGc21Vd0lJZi8rNEFBQUFBcEJuOXBGRlN3Ly83NkJBQUFBQ0FHZitYUkRmOFNBQUFBQUNBR2YrMnBEZjhTQkFBQUFEa0diNEVtb1FXeVpUQWdoLy83aEFBQUFDa0dlSGtVVkxELy92b0FBQUFBSUFaNDlkRU4veElBQUFBQUlBWjQvYWtOL3hJRUFBQUFPUVpva1NhaEJiSmxNQ0NILy91QUFBQUFLUVo1Q1JSVXNQLysrZ1FBQUFBZ0JubUYwUTMvRWdBQUFBQWdCbm1OcVEzL0VnUUFBQUE1Qm1taEpxRUZzbVV3SUlmLys0UUFBQUFwQm5vWkZGU3cvLzc2QkFBQUFDQUdlcFhSRGY4U0JBQUFBQ0FHZXAycERmOFNBQUFBQURrR2FyRW1vUVd5WlRBZ2gvLzdnQUFBQUNrR2V5a1VWTEQvL3ZvRUFBQUFJQVo3cGRFTi94SUFBQUFBSUFaN3Jha04veElBQUFBQVBRWnJ1U2FoQmJKbE1GRXczLy83QicpO1xuICAgICAgdmlkZW8ucGxheSgpO1xuICAgIH1cbiAgfTtcblxuICB0aGlzLnJlbGVhc2UgPSBmdW5jdGlvbigpIHtcbiAgICB2aWRlby5wYXVzZSgpO1xuICAgIHZpZGVvLnNyYyA9ICcnO1xuICB9O1xufVxuXG5mdW5jdGlvbiBpT1NXYWtlTG9jaygpIHtcbiAgdmFyIHRpbWVyID0gbnVsbDtcblxuICB0aGlzLnJlcXVlc3QgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXRpbWVyKSB7XG4gICAgICB0aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24gPSB3aW5kb3cubG9jYXRpb247XG4gICAgICAgIHNldFRpbWVvdXQod2luZG93LnN0b3AsIDApO1xuICAgICAgfSwgMzAwMDApO1xuICAgIH1cbiAgfVxuXG4gIHRoaXMucmVsZWFzZSA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aW1lcikge1xuICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XG4gICAgICB0aW1lciA9IG51bGw7XG4gICAgfVxuICB9XG59XG5cblxuZnVuY3Rpb24gZ2V0V2FrZUxvY2soKSB7XG4gIHZhciB1c2VyQWdlbnQgPSBuYXZpZ2F0b3IudXNlckFnZW50IHx8IG5hdmlnYXRvci52ZW5kb3IgfHwgd2luZG93Lm9wZXJhO1xuICBpZiAodXNlckFnZW50Lm1hdGNoKC9pUGhvbmUvaSkgfHwgdXNlckFnZW50Lm1hdGNoKC9pUG9kL2kpKSB7XG4gICAgcmV0dXJuIGlPU1dha2VMb2NrO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBBbmRyb2lkV2FrZUxvY2s7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRXYWtlTG9jaygpOyIsIi8qXG4gKiBDb3B5cmlnaHQgMjAxNSBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbi8vIFBvbHlmaWxsIEVTNiBQcm9taXNlcyAobW9zdGx5IGZvciBJRSAxMSkuXG5yZXF1aXJlKCdlczYtcHJvbWlzZScpLnBvbHlmaWxsKCk7XG5cbnZhciBDYXJkYm9hcmRWUkRpc3BsYXkgPSByZXF1aXJlKCcuL2NhcmRib2FyZC12ci1kaXNwbGF5LmpzJyk7XG52YXIgTW91c2VLZXlib2FyZFZSRGlzcGxheSA9IHJlcXVpcmUoJy4vbW91c2Uta2V5Ym9hcmQtdnItZGlzcGxheS5qcycpO1xuLy8gVW5jb21tZW50IHRvIGFkZCBwb3NpdGlvbmFsIHRyYWNraW5nIHZpYSB3ZWJjYW0uXG4vL3ZhciBXZWJjYW1Qb3NpdGlvblNlbnNvclZSRGV2aWNlID0gcmVxdWlyZSgnLi93ZWJjYW0tcG9zaXRpb24tc2Vuc29yLXZyLWRldmljZS5qcycpO1xudmFyIFZSRGlzcGxheSA9IHJlcXVpcmUoJy4vYmFzZS5qcycpLlZSRGlzcGxheTtcbnZhciBITURWUkRldmljZSA9IHJlcXVpcmUoJy4vYmFzZS5qcycpLkhNRFZSRGV2aWNlO1xudmFyIFBvc2l0aW9uU2Vuc29yVlJEZXZpY2UgPSByZXF1aXJlKCcuL2Jhc2UuanMnKS5Qb3NpdGlvblNlbnNvclZSRGV2aWNlO1xudmFyIFZSRGlzcGxheUhNRERldmljZSA9IHJlcXVpcmUoJy4vZGlzcGxheS13cmFwcGVycy5qcycpLlZSRGlzcGxheUhNRERldmljZTtcbnZhciBWUkRpc3BsYXlQb3NpdGlvblNlbnNvckRldmljZSA9IHJlcXVpcmUoJy4vZGlzcGxheS13cmFwcGVycy5qcycpLlZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlO1xuXG5mdW5jdGlvbiBXZWJWUlBvbHlmaWxsKCkge1xuICB0aGlzLmRpc3BsYXlzID0gW107XG4gIHRoaXMuZGV2aWNlcyA9IFtdOyAvLyBGb3IgZGVwcmVjYXRlZCBvYmplY3RzXG4gIHRoaXMuZGV2aWNlc1BvcHVsYXRlZCA9IGZhbHNlO1xuICB0aGlzLm5hdGl2ZVdlYlZSQXZhaWxhYmxlID0gdGhpcy5pc1dlYlZSQXZhaWxhYmxlKCk7XG4gIHRoaXMubmF0aXZlTGVnYWN5V2ViVlJBdmFpbGFibGUgPSB0aGlzLmlzRGVwcmVjYXRlZFdlYlZSQXZhaWxhYmxlKCk7XG5cbiAgaWYgKCF0aGlzLm5hdGl2ZUxlZ2FjeVdlYlZSQXZhaWxhYmxlKSB7XG4gICAgaWYgKCF0aGlzLm5hdGl2ZVdlYlZSQXZhaWxhYmxlKSB7XG4gICAgICB0aGlzLmVuYWJsZVBvbHlmaWxsKCk7XG4gICAgfVxuICAgIGlmIChXZWJWUkNvbmZpZy5FTkFCTEVfREVQUkVDQVRFRF9BUEkpIHtcbiAgICAgIHRoaXMuZW5hYmxlRGVwcmVjYXRlZFBvbHlmaWxsKCk7XG4gICAgfVxuICB9XG59XG5cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLmlzV2ViVlJBdmFpbGFibGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICgnZ2V0VlJEaXNwbGF5cycgaW4gbmF2aWdhdG9yKTtcbn07XG5cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLmlzRGVwcmVjYXRlZFdlYlZSQXZhaWxhYmxlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAoJ2dldFZSRGV2aWNlcycgaW4gbmF2aWdhdG9yKSB8fCAoJ21vekdldFZSRGV2aWNlcycgaW4gbmF2aWdhdG9yKTtcbn07XG5cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLnBvcHVsYXRlRGV2aWNlcyA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5kZXZpY2VzUG9wdWxhdGVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gSW5pdGlhbGl6ZSBvdXIgdmlydHVhbCBWUiBkZXZpY2VzLlxuICB2YXIgdnJEaXNwbGF5ID0gbnVsbDtcblxuICAvLyBBZGQgYSBDYXJkYm9hcmQgVlJEaXNwbGF5IG9uIGNvbXBhdGlibGUgbW9iaWxlIGRldmljZXNcbiAgaWYgKHRoaXMuaXNDYXJkYm9hcmRDb21wYXRpYmxlKCkpIHtcbiAgICB2ckRpc3BsYXkgPSBuZXcgQ2FyZGJvYXJkVlJEaXNwbGF5KCk7XG4gICAgdGhpcy5kaXNwbGF5cy5wdXNoKHZyRGlzcGxheSk7XG5cbiAgICAvLyBGb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcbiAgICBpZiAoV2ViVlJDb25maWcuRU5BQkxFX0RFUFJFQ0FURURfQVBJKSB7XG4gICAgICB0aGlzLmRldmljZXMucHVzaChuZXcgVlJEaXNwbGF5SE1ERGV2aWNlKHZyRGlzcGxheSkpO1xuICAgICAgdGhpcy5kZXZpY2VzLnB1c2gobmV3IFZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlKHZyRGlzcGxheSkpO1xuICAgIH1cbiAgfVxuXG4gIC8vIEFkZCBhIE1vdXNlIGFuZCBLZXlib2FyZCBkcml2ZW4gVlJEaXNwbGF5IGZvciBkZXNrdG9wcy9sYXB0b3BzXG4gIGlmICghdGhpcy5pc01vYmlsZSgpICYmICFXZWJWUkNvbmZpZy5NT1VTRV9LRVlCT0FSRF9DT05UUk9MU19ESVNBQkxFRCkge1xuICAgIHZyRGlzcGxheSA9IG5ldyBNb3VzZUtleWJvYXJkVlJEaXNwbGF5KCk7XG4gICAgdGhpcy5kaXNwbGF5cy5wdXNoKHZyRGlzcGxheSk7XG5cbiAgICAvLyBGb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcbiAgICBpZiAoV2ViVlJDb25maWcuRU5BQkxFX0RFUFJFQ0FURURfQVBJKSB7XG4gICAgICB0aGlzLmRldmljZXMucHVzaChuZXcgVlJEaXNwbGF5SE1ERGV2aWNlKHZyRGlzcGxheSkpO1xuICAgICAgdGhpcy5kZXZpY2VzLnB1c2gobmV3IFZSRGlzcGxheVBvc2l0aW9uU2Vuc29yRGV2aWNlKHZyRGlzcGxheSkpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFVuY29tbWVudCB0byBhZGQgcG9zaXRpb25hbCB0cmFja2luZyB2aWEgd2ViY2FtLlxuICAvL2lmICghdGhpcy5pc01vYmlsZSgpICYmIFdlYlZSQ29uZmlnLkVOQUJMRV9ERVBSRUNBVEVEX0FQSSkge1xuICAvLyAgcG9zaXRpb25EZXZpY2UgPSBuZXcgV2ViY2FtUG9zaXRpb25TZW5zb3JWUkRldmljZSgpO1xuICAvLyAgdGhpcy5kZXZpY2VzLnB1c2gocG9zaXRpb25EZXZpY2UpO1xuICAvL31cblxuICB0aGlzLmRldmljZXNQb3B1bGF0ZWQgPSB0cnVlO1xufTtcblxuV2ViVlJQb2x5ZmlsbC5wcm90b3R5cGUuZW5hYmxlUG9seWZpbGwgPSBmdW5jdGlvbigpIHtcbiAgLy8gUHJvdmlkZSBuYXZpZ2F0b3IuZ2V0VlJEaXNwbGF5cy5cbiAgbmF2aWdhdG9yLmdldFZSRGlzcGxheXMgPSB0aGlzLmdldFZSRGlzcGxheXMuYmluZCh0aGlzKTtcblxuICAvLyBQcm92aWRlIHRoZSBWUkRpc3BsYXkgb2JqZWN0LlxuICB3aW5kb3cuVlJEaXNwbGF5ID0gVlJEaXNwbGF5O1xufTtcblxuV2ViVlJQb2x5ZmlsbC5wcm90b3R5cGUuZW5hYmxlRGVwcmVjYXRlZFBvbHlmaWxsID0gZnVuY3Rpb24oKSB7XG4gIC8vIFByb3ZpZGUgbmF2aWdhdG9yLmdldFZSRGV2aWNlcy5cbiAgbmF2aWdhdG9yLmdldFZSRGV2aWNlcyA9IHRoaXMuZ2V0VlJEZXZpY2VzLmJpbmQodGhpcyk7XG5cbiAgLy8gUHJvdmlkZSB0aGUgQ2FyZGJvYXJkSE1EVlJEZXZpY2UgYW5kIFBvc2l0aW9uU2Vuc29yVlJEZXZpY2Ugb2JqZWN0cy5cbiAgd2luZG93LkhNRFZSRGV2aWNlID0gSE1EVlJEZXZpY2U7XG4gIHdpbmRvdy5Qb3NpdGlvblNlbnNvclZSRGV2aWNlID0gUG9zaXRpb25TZW5zb3JWUkRldmljZTtcbn07XG5cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLmdldFZSRGlzcGxheXMgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5wb3B1bGF0ZURldmljZXMoKTtcbiAgdmFyIGRpc3BsYXlzID0gdGhpcy5kaXNwbGF5cztcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgIHRyeSB7XG4gICAgICByZXNvbHZlKGRpc3BsYXlzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZWplY3QoZSk7XG4gICAgfVxuICB9KTtcbn07XG5cbldlYlZSUG9seWZpbGwucHJvdG90eXBlLmdldFZSRGV2aWNlcyA9IGZ1bmN0aW9uKCkge1xuICBjb25zb2xlLndhcm4oJ2dldFZSRGV2aWNlcyBpcyBkZXByZWNhdGVkLiBQbGVhc2UgdXBkYXRlIHlvdXIgY29kZSB0byB1c2UgZ2V0VlJEaXNwbGF5cyBpbnN0ZWFkLicpO1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICB0cnkge1xuICAgICAgaWYgKCFzZWxmLmRldmljZXNQb3B1bGF0ZWQpIHtcbiAgICAgICAgaWYgKHNlbGYubmF0aXZlV2ViVlJBdmFpbGFibGUpIHtcbiAgICAgICAgICByZXR1cm4gbmF2aWdhdG9yLmdldFZSRGlzcGxheXMoZnVuY3Rpb24oZGlzcGxheXMpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGlzcGxheXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgc2VsZi5kZXZpY2VzLnB1c2gobmV3IFZSRGlzcGxheUhNRERldmljZShkaXNwbGF5c1tpXSkpO1xuICAgICAgICAgICAgICBzZWxmLmRldmljZXMucHVzaChuZXcgVlJEaXNwbGF5UG9zaXRpb25TZW5zb3JEZXZpY2UoZGlzcGxheXNbaV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGYuZGV2aWNlc1BvcHVsYXRlZCA9IHRydWU7XG4gICAgICAgICAgICByZXNvbHZlKHNlbGYuZGV2aWNlcyk7XG4gICAgICAgICAgfSwgcmVqZWN0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZWxmLm5hdGl2ZUxlZ2FjeVdlYlZSQXZhaWxhYmxlKSB7XG4gICAgICAgICAgcmV0dXJuIChuYXZpZ2F0b3IuZ2V0VlJERGV2aWNlcyB8fCBuYXZpZ2F0b3IubW96R2V0VlJEZXZpY2VzKShmdW5jdGlvbihkZXZpY2VzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRldmljZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgaWYgKGRldmljZXNbaV0gaW5zdGFuY2VvZiBITURWUkRldmljZSkge1xuICAgICAgICAgICAgICAgIHNlbGYuZGV2aWNlcy5wdXNoKGRldmljZXNbaV0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChkZXZpY2VzW2ldIGluc3RhbmNlb2YgUG9zaXRpb25TZW5zb3JWUkRldmljZSkge1xuICAgICAgICAgICAgICAgIHNlbGYuZGV2aWNlcy5wdXNoKGRldmljZXNbaV0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWxmLmRldmljZXNQb3B1bGF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmVzb2x2ZShzZWxmLmRldmljZXMpO1xuICAgICAgICAgIH0sIHJlamVjdCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc2VsZi5wb3B1bGF0ZURldmljZXMoKTtcbiAgICAgIHJlc29sdmUoc2VsZi5kZXZpY2VzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZWplY3QoZSk7XG4gICAgfVxuICB9KTtcbn07XG5cbi8qKlxuICogRGV0ZXJtaW5lIGlmIGEgZGV2aWNlIGlzIG1vYmlsZS5cbiAqL1xuV2ViVlJQb2x5ZmlsbC5wcm90b3R5cGUuaXNNb2JpbGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIC9BbmRyb2lkL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSB8fFxuICAgICAgL2lQaG9uZXxpUGFkfGlQb2QvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xufTtcblxuV2ViVlJQb2x5ZmlsbC5wcm90b3R5cGUuaXNDYXJkYm9hcmRDb21wYXRpYmxlID0gZnVuY3Rpb24oKSB7XG4gIC8vIEZvciBub3csIHN1cHBvcnQgYWxsIGlPUyBhbmQgQW5kcm9pZCBkZXZpY2VzLlxuICAvLyBBbHNvIGVuYWJsZSB0aGUgV2ViVlJDb25maWcuRk9SQ0VfVlIgZmxhZyBmb3IgZGVidWdnaW5nLlxuICByZXR1cm4gdGhpcy5pc01vYmlsZSgpIHx8IFdlYlZSQ29uZmlnLkZPUkNFX0VOQUJMRV9WUjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gV2ViVlJQb2x5ZmlsbDtcbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxuXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBzZXRUaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBzZXRUaW1lb3V0KGRyYWluUXVldWUsIDApO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIl19
