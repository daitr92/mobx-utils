"use strict";
var mobx_1 = require("mobx");
var utils_1 = require("./utils");
/**
 * `fromResource` creates an observable which current state can be inspected using `.current()`,
 * and which can be kept in sync with some external datasource that can be subscribed to.
 *
 * The created observable will only subscribe to the datasource if it is in use somewhere,
 * (un)subscribing when needed. To enable `fromResource` to do that two callbacks need to be provided,
 * one to subscribe, and one to unsubscribe. The subscribe callback itself will receive a `sink` callback, which can be used
 * to update the current state of the observable, allowing observes to react.
 *
 * Whatever is passed to `sink` will be returned by `current()`. The values passed to the sink will not be converted to
 * observables automatically, but feel free to do so.
 * It is the `current()` call itself which is being tracked,
 * so make sure that you don't dereference to early.
 *
 * For inspiration, an example integration with the apollo-client on [github](https://github.com/apollostack/apollo-client/issues/503#issuecomment-241101379)
 *
 * The following example code creates an observable that connects to a `dbUserRecord`,
 * which comes from an imaginary database and notifies when it has changed.
 *
 * @example
 * function createObservableUser(dbUserRecord) {
 *   let currentSubscription;
 *   return fromResource(
 *     (sink) => {
 *       // sink the current state
 *       sink(dbUserRecord.fields)
 *       // subscribe to the record, invoke the sink callback whenever new data arrives
 *       currentSubscription = dbUserRecord.onUpdated(() => {
 *         sink(dbUserRecord.fields)
 *       })
 *     },
 *     () => {
 *       // the user observable is not in use at the moment, unsubscribe (for now)
 *       dbUserRecord.unsubscribe(currentSubscription)
 *     }
 *   )
 * }
 *
 * // usage:
 * const myUserObservable = createObservableUser(myDatabaseConnector.query("name = 'Michel'"))
 *
 * // use the observable in autorun
 * autorun(() => {
 *   // printed everytime the database updates its records
 *   console.log(myUserObservable.current().displayName)
 * })
 *
 * // ... or a component
 * const userComponent = observer(({ user }) =>
 *   <div>{user.current().displayName}</div>
 * )
 *
 * @export
 * @template T
 * @param {(sink: (newValue: T) => void) => void} subscriber
 * @param {IDisposer} [unsubscriber=NOOP]
 * @param {T} [initialValue=undefined] the data that will be returned by `get()` until the `sink` has emitted its first data
 * @returns {{
 *     current(): T;
 *     dispose(): void;
 *     isAlive(): boolean;
 * }}
 */
function fromResource(subscriber, unsubscriber, initialValue) {
    if (unsubscriber === void 0) { unsubscriber = utils_1.NOOP; }
    if (initialValue === void 0) { initialValue = undefined; }
    var isActive = false;
    var isDisposed = false;
    var value = initialValue;
    var suspender = function () {
        if (isActive) {
            isActive = false;
            unsubscriber();
        }
    };
    var atom = new mobx_1.Atom("ResourceBasedObservable", function () {
        utils_1.invariant(!isActive && !isDisposed);
        isActive = true;
        subscriber(mobx_1.action("ResourceBasedObservable-sink", function (newValue) {
            value = newValue;
            atom.reportChanged();
        }));
    }, suspender);
    return {
        current: function () {
            utils_1.invariant(!isDisposed, "subscribingObservable has already been disposed");
            var isBeingTracked = atom.reportObserved();
            if (!isBeingTracked && !isActive)
                console.warn("Called `get` of an subscribingObservable outside a reaction. Current value will be returned but no new subscription has started");
            return value;
        },
        dispose: function () {
            isDisposed = true;
            suspender();
        },
        isAlive: function () { return isActive; }
    };
}
exports.fromResource = fromResource;