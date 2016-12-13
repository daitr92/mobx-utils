"use strict";
var mobx_1 = require("mobx");
var utils_1 = require("./utils");
exports.PENDING = "pending";
exports.FULFILLED = "fulfilled";
exports.REJECTED = "rejected";
var PromiseBasedObservable = (function () {
    function PromiseBasedObservable(promise, initialValue, modifier) {
        if (initialValue === void 0) { initialValue = undefined; }
        if (modifier === void 0) { modifier = utils_1.IDENTITY; }
        var _this = this;
        this.promise = promise;
        this.modifier = modifier;
        this._state = mobx_1.observable("pending");
        this._reason = mobx_1.observable(undefined);
        this._observable = mobx_1.observable(modifier(initialValue));
        promise.then(mobx_1.action("observableFromPromise-resolve", function (value) {
            _this._observable.set(value);
            _this._state.set("fulfilled");
        }), mobx_1.action("observableFromPromise-reject", function (reason) {
            _this._reason.set(reason);
            _this._observable.set(reason);
            _this._state.set("rejected");
        }));
    }
    Object.defineProperty(PromiseBasedObservable.prototype, "value", {
        get: function () {
            return this._observable.get();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PromiseBasedObservable.prototype, "state", {
        get: function () {
            return this._state.get();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PromiseBasedObservable.prototype, "reason", {
        get: function () {
            utils_1.deprecated("In `fromPromise`: `.reason` is deprecated, use `.value` instead");
            return this._reason.get();
        },
        enumerable: true,
        configurable: true
    });
    PromiseBasedObservable.prototype.case = function (handlers) {
        switch (this.state) {
            case "pending": return handlers.pending && handlers.pending();
            case "rejected": return handlers.rejected && handlers.rejected(this.value);
            case "fulfilled": return handlers.fulfilled && handlers.fulfilled(this.value);
        }
    };
    return PromiseBasedObservable;
}());
/**
 * `fromPromise` takes a Promise and returns an object with 3 observable properties that track
 * the status of the promise. The returned object has the following observable properties:
 *  - `value`: either the initial value, the value the Promise resolved to, or the value the Promise was rejected with. use `.state` if you need to be able to tell the difference
 *  - `state`: one of `"pending"`, `"fulfilled"` or `"rejected"`
 *  - `promise`: (not observable) the original promise object
 * and the following method:
 * - `case({fulfilled, rejected, pending})`: maps over the result using the provided handlers, or returns `undefined` if a handler isn't available for the current promise state.
 *
 * @example
 * const fetchResult = fromPromise(fetch("http://someurl"))
 *
 * // combine with when..
 * when(
 *   () => fetchResult.state !== "pending"
 *   () => {
 *     console.log("Got ", fetchResult.value)
 *   }
 * )
 *
 * // or a mobx-react component..
 * const myComponent = observer(({ fetchResult }) => {
 *   switch(fetchResult.state) {
 *      case "pending": return <div>Loading...</div>
 *      case "rejected": return <div>Ooops... {fetchResult.value}</div>
 *      case "fulfilled": return <div>Gotcha: {fetchResult.value}</div>
 *   }
 * })
 *
 * // or using the case method instead of switch:
 *
 * const myComponent = observer(({ fetchResult }) =>
 *   fetchResult.case({
 *     pending:   () => <div>Loading...</div>
 *     rejected:  error => <div>Ooops.. {error}</div>
 *     fulfilled: value => <div>Gotcha: {value}</div>
 *   }))
 *
 * Note that the status strings are available as constants:
 * `mobxUtils.PENDING`, `mobxUtils.REJECTED`, `mobxUtil.FULFILLED`
 *
 * @param {IThenable<T>} promise The promise which will be observed
 * @param {T} [initialValue=undefined] Optional predefined initial value
 * @param {any} [modifier=IDENTITY] MobX modifier, e.g. `asFlat`, to be applied to the resolved value
 * @returns {IPromiseBasedObservable<T>}
 */
function fromPromise(promise, initialValue, modifier) {
    if (initialValue === void 0) { initialValue = undefined; }
    if (modifier === void 0) { modifier = utils_1.IDENTITY; }
    return new PromiseBasedObservable(promise, initialValue, modifier);
}
exports.fromPromise = fromPromise;
