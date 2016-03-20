// Type definitions for object-assign 4.0.1
// Project: https://github.com/sindresorhus/object-assign
// Definitions by: Christopher Brown <https://github.com/chbrown>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare module "object-assign" {
  /**
    * Copy the values of all of the enumerable own properties from one or more source objects to a
    * target object. Returns the target object.
    * @param target The target object to copy to.
    * @param source The source object from which to copy properties.
    */
  function objectAssign<T, U>(target: T, source: U): T & U;

  /**
    * Copy the values of all of the enumerable own properties from one or more source objects to a
    * target object. Returns the target object.
    * @param target The target object to copy to.
    * @param source1 The first source object from which to copy properties.
    * @param source2 The second source object from which to copy properties.
    */
  function objectAssign<T, U, V>(target: T, source1: U, source2: V): T & U & V;

  /**
    * Copy the values of all of the enumerable own properties from one or more source objects to a
    * target object. Returns the target object.
    * @param target The target object to copy to.
    * @param source1 The first source object from which to copy properties.
    * @param source2 The second source object from which to copy properties.
    * @param source3 The third source object from which to copy properties.
    */
  function objectAssign<T, U, V, W>(target: T, source1: U, source2: V, source3: W): T & U & V & W;

  export = objectAssign;
}
