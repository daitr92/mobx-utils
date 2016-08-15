import {NOOP, IDENTITY} from "./utils";
import {Atom, observable, action} from "mobx";

/**
 * creates an observable around a fetch method that will not be invoked
 * util the observable is needed the first time.
 * The fetch method receives a sink callback which can be used to replace the
 * current value of the lazyObservable. It is allowed to call sink multiple times
 * to keep the lazyObservable up to date with some external resource.
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
 * @param {(sink: (newValue: T) => void) => void} fetch method that will be called the first time the value of this observable is accessed. The provided sink can be used to produce a new value, synchronously or asynchronously
 * @param {T} [initialValue=undefined] optional initialValue that will be returned from `current` as long as the `sink` has not been called at least once
 * @param {any} [modifier=IDENTITY] optional mobx modifier that determines the the comparison and recursion strategy of the observable, for example `asFlat` or `asStructure`
 * @returns {{
 *     current(): T
 * }}
 */
export function lazyObservable<T>(
    fetch: (sink: (newValue: T) => void) => void,
    initialValue: T = undefined,
    modifier = IDENTITY
): {
    current(): T
} {
    let started = false;
    const value = observable(modifier(initialValue));

    return {
        current: () => {
            if (!started) {
                started = true;
                fetch(action("lazyObservable-fetch", (newValue: T) => {
                    value.set(newValue);
                }));
            }
            return value.get();
        }
    };
}
