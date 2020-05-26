import { invariant } from "../../x/nasi.ts";

export const AFStore = Symbol("AFStore");

export abstract class BaseStore<T> {
  #locked: boolean = true;
  public readonly [AFStore]: "AFStore";

  lock() {
    this.#locked = true;
  }

  unlock() {
    this.#locked = false;
  }

  update(...updates: T[]) {
    if (this.#locked) {
      invariant(() => false, "Updates to store cannot be called externally.");
      return;
    }
    this.UNSAFE_update(...updates);
  }

  abstract UNSAFE_update(...updates: T[]): void;

  abstract getState(): T;
}
