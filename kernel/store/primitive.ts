import { BaseStore } from "./base.ts";

export const AFStore = Symbol("AFStore");

export class PrimitiveStore<T> extends BaseStore<T> {
  #state: T;

  public readonly [AFStore]: "AFPrimitive";

  constructor(initialState: T) {
    super();
    this.#state = initialState;
  }

  UNSAFE_update(...updates: T[]) {
    if (!updates.length) {
      return;
    }
    const last = updates[updates.length - 1];
    this.#state = last;
  }

  getState() {
    return this.#state;
  }
}
