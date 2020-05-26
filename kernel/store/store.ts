import { PrimitiveStore } from "./primitive.ts";
import { BaseStore } from "./base.ts";

const AFLastUpdatedTime = Symbol("AFLastUpdatedTime");

export class Store<T> extends BaseStore<T> {
  #state: { [k in keyof T]: BaseStore<T[k]> };

  #cached?: T;

  constructor(initialState: T) {
    super();
    this.#cached = undefined;
    this.#state = this.#constructStore(initialState);
  }

  update(...updates: Partial<T>[]) {
    console.warn("here~~~", updates);
    super.update.apply(this, updates as T[]);
  }

  UNSAFE_update(...updates: Partial<T>[]) {
    this.#cached = undefined;

    for (const update of updates) {
      for (const [key, value] of Object.entries(update)) {
        if (!(key in this.#state)) {
          console.warn(
            `Key ${key} does not exist in store. Treating as Primitive...`,
          );
          this.#state[key as keyof T] = new PrimitiveStore(undefined as any);
        }
        this.#state[key as keyof T].UNSAFE_update(value as T[keyof T]);
      }
    }
  }

  getState() {
    if (this.#cached) {
      return this.#cached;
    }

    const state: any = {};

    for (
      const [key, value] of Object.entries<BaseStore<T[keyof T]>>(this.#state)
    ) {
      state[key] = value.getState();
      state[AFLastUpdatedTime] = Date.now();
    }

    this.#cached = state;
    return state;
  }

  #constructStore = (t: T): { [k in keyof T]: PrimitiveStore<T[k]> } => {
    const obj: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(t)) {
      if (value instanceof BaseStore) {
        obj[key] = value;
      } else {
        obj[key] = new PrimitiveStore(value);
      }
    }

    return obj as { [k in keyof T]: PrimitiveStore<T[k]> };
  };
}
