"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var mobx_1 = require("mobx");
var utils_1 = require("./utils");
var RESERVED_NAMES = ["model", "reset", "submit", "isDirty", "isPropertyDirty"];
var ViewModel = (function () {
    function ViewModel(model) {
        var _this = this;
        this.model = model;
        this.localValues = mobx_1.asMap({});
        utils_1.invariant(mobx_1.isObservableObject(model), "createViewModel expects an observable object");
        Object.keys(model).forEach(function (key) {
            utils_1.invariant(RESERVED_NAMES.indexOf(key) === -1, "The propertyname " + key + " is reserved and cannot be used with viewModels");
            Object.defineProperty(_this, key, {
                enumerable: true,
                configurable: true,
                get: function () {
                    if (_this.isPropertyDirty(key))
                        return _this.localValues.get(key);
                    else
                        return _this.model[key];
                },
                set: mobx_1.action(function (value) {
                    if (_this.isPropertyDirty(key) || value !== _this.model[key]) {
                        _this.localValues.set(key, value);
                    }
                })
            });
        });
    }
    Object.defineProperty(ViewModel.prototype, "isDirty", {
        get: function () {
            return this.localValues.size > 0;
        },
        enumerable: true,
        configurable: true
    });
    ViewModel.prototype.isPropertyDirty = function (key) {
        return this.localValues.has(key);
    };
    ViewModel.prototype.submit = function () {
        var _this = this;
        this.localValues.keys().forEach(function (key) {
            var source = _this.localValues.get(key);
            var destination = _this.model[key];
            if (mobx_1.isObservableArray(destination)) {
                destination.replace(source);
            }
            else if (mobx_1.isObservableMap(destination)) {
                destination.clear();
                destination.merge(source);
            }
            else {
                _this.model[key] = source;
            }
        });
        this.localValues.clear();
    };
    ViewModel.prototype.reset = function () {
        this.localValues.clear();
    };
    ViewModel.prototype.resetProperty = function (key) {
        this.localValues.delete(key);
    };
    return ViewModel;
}());
__decorate([
    mobx_1.computed
], ViewModel.prototype, "isDirty", null);
__decorate([
    mobx_1.action
], ViewModel.prototype, "submit", null);
__decorate([
    mobx_1.action
], ViewModel.prototype, "reset", null);
__decorate([
    mobx_1.action
], ViewModel.prototype, "resetProperty", null);
/**
 * `createViewModel` takes an object with observable properties (model)
 * and wraps a viewmodel around it. The viewmodel proxies all enumerable property of the original model with the following behavior:
 *  - as long as no new value has been assigned to the viewmodel property, the original property will be returned.
 *  - any future change in the model will be visible in the viewmodel as well unless the viewmodel property was dirty at the time of the attempted change.
 *  - once a new value has been assigned to a property of the viewmodel, that value will be returned during a read of that property in the future. However, the original model remain untouched until `submit()` is called.
 *
 * The viewmodel exposes the following additional methods, besides all the enumerable properties of the model:
 * - `submit()`: copies all the values of the viewmodel to the model and resets the state
 * - `reset()`: resets the state of the viewmodel, abandoning all local modifications
 * - `resetProperty(propName)`: resets the specified property of the viewmodel
 * - `isDirty`: observable property indicating if the viewModel contains any modifications
 * - `isPropertyDirty(propName)`: returns true if the specified property is dirty
 * - `model`: The original model object for which this viewModel was created
 *
 * You may use observable arrays, maps and objects with `createViewModel` but keep in mind to assign fresh instances of those to the viewmodel's properties, otherwise you would end up modifying the properties of the original model.
 * Note that if you read a non-dirty property, viewmodel only proxies the read to the model. You therefore need to assign a fresh instance not only the first time you make the assignment but also after calling `reset()` or `submit()`.
 *
 * @example
 * class Todo {
 *   \@observable title = "Test"
 * }
 *
 * const model = new Todo()
 * const viewModel = createViewModel(model);
 *
 * autorun(() => console.log(viewModel.model.title, ",", viewModel.title))
 * // prints "Test, Test"
 * model.title = "Get coffee"
 * // prints "Get coffee, Get coffee", viewModel just proxies to model
 * viewModel.title = "Get tea"
 * // prints "Get coffee, Get tea", viewModel's title is now dirty, and the local value will be printed
 * viewModel.submit()
 * // prints "Get tea, Get tea", changes submitted from the viewModel to the model, viewModel is proxying again
 * viewModel.title = "Get cookie"
 * // prints "Get tea, Get cookie" // viewModel has diverged again
 * viewModel.reset()
 * // prints "Get tea, Get tea", changes of the viewModel have been abandoned
 *
 * @param {T} model
 * @returns {(T & IViewModel<T>)}
 * ```
 */
function createViewModel(model) {
    return new ViewModel(model);
}
exports.createViewModel = createViewModel;