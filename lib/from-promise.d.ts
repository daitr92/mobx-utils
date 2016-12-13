export declare type PromiseState = "pending" | "fulfilled" | "rejected";
export declare const PENDING = "pending";
export declare const FULFILLED = "fulfilled";
export declare const REJECTED = "rejected";
export interface IPromiseBasedObservable<T> {
    value: T;
    state: PromiseState;
    reason: any;
    promise: PromiseLike<T>;
    case<U>(handlers: {
        pending?: () => U;
        fulfilled?: (t: T) => U;
        rejected?: (e: any) => U;
    }): U;
}
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
export declare function fromPromise<T>(promise: PromiseLike<T>, initialValue?: T, modifier?: (_: any) => any): IPromiseBasedObservable<T>;