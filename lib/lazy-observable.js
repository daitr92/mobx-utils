"use strict";
var utils_1 = require("./utils");
var mobx_1 = require("mobx");
/**
 * `lazyObservable` creates an observable around a `fetch` method that will not be invoked
 * util the observable is needed the first time.
 * The fetch method receives a `sink` callback which can be used to replace the
 * current value of the lazyObservable. It is allowed to call `sink` multiple times
 * to keep the lazyObservable up to date with some external resource.
 *
 * Note that it is the `current()` call itself which is being tracked by MobX,
 * so make sure that you don't dereference to early.
 *
 * @example
 * const userProfile = lazyObservable(
 *   sink => fetch("/myprofile").then(profile => sink(profile))
 * )
 *
 * // use the userProfile in a React component:
 * const Profile = observer(({ userProfile }) =>
 *   userProfile.current() === undefined
 *   ? <div>Loading user profile...</div>
 *   : <div>{userProfile.current().displayName}</div>
 * )
 *
 * // triggers refresh the userProfile
 * userProfile.refresh()
 *
 * @param {(sink: (newValue: T) => void) => void} fetch method that will be called the first time the value of this observable is accessed. The provided sink can be used to produce a new value, synchronously or asynchronously
 * @param {T} [initialValue=undefined] optional initialValue that will be returned from `current` as long as the `sink` has not been called at least once
 * @param {any} [modifier=IDENTITY] optional mobx modifier that determines the the comparison and recursion strategy of the observable, for example `asFlat` or `asStructure`
 * @returns {{
 *     current(): T,
 *     refresh(): T,
 *     reset(): T
 * }}
 */
function lazyObservable(fetch, initialValue, modifier) {
    if (initialValue === void 0) { initialValue = undefined; }
    if (modifier === void 0) { modifier = utils_1.IDENTITY; }
    var started = false;
    var value = mobx_1.observable(modifier(initialValue));
    var currentFnc = function () {
        if (!started) {
            started = true;
            fetch(mobx_1.action("lazyObservable-fetch", function (newValue) {
                value.set(newValue);
            }));
        }
        return value.get();
    };
    var resetFnc = mobx_1.action("lazyObservable-reset", function () {
        value.set(initialValue);
        return value.get();
    });
    return {
        current: currentFnc,
        refresh: function () {
            started = false;
            return currentFnc();
        },
        reset: function () {
            return resetFnc();
        }
    };
}
exports.lazyObservable = lazyObservable;