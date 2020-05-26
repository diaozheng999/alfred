import {
  Unique,
  UniqueValue,
  Mutex,
  CoreDisposable,
  Disposable,
  invariant,
} from "../../x/nasi.ts";
import { generate } from "../utils/unique.ts";
import { Action, action as A } from "../actions/types.ts";
import { Intent, combineAll } from "./intent.ts";
import { Store } from "../store/store.ts";
import { Dispatcher } from "./dispatcher.ts";

export type ReducerFunction<
  S,
  I extends Action<any, any>,
  O extends Action<any, any>,
> = (s: S, a: I) => Intent<S, O>;

/**
 * The building block of Alfred.
 * A Reducer is in essence a pure function mapping (state, action) to state.
 */
export abstract class Reducer<
  InputAction extends Action<any, any>,
  OutputAction extends Action<any, any>,
  State extends {},
> extends CoreDisposable implements Dispatcher<InputAction> {
  #generator?: Unique;
  #instanceId: UniqueValue;

  #store: Store<State>;

  #execLock = new Mutex();

  #subscribers = new Map<UniqueValue, Dispatcher<OutputAction>>();

  #reducers: Array<ReducerFunction<State, InputAction, OutputAction>> = [];

  constructor(store: Store<State>, identifier?: string) {
    super();
    if (identifier) {
      this.#instanceId = new Unique(identifier).opaque;
      this.#generator = new Unique(this.#instanceId);
    } else {
      this.#instanceId = generate();
    }

    this.#store = store;

    console.log(`Created reducer ${this.#instanceId}`);
  }

  public get instanceId() {
    return this.#instanceId;
  }

  public dispatch(action: InputAction) {
    this.#executeReducer(action);
  }

  public subscribe = (subscriber: Dispatcher<OutputAction>): UniqueValue => {
    const id = this.generateId();
    this.#subscribers.set(id, subscriber);
    return id;
  };

  public unsubscribe = (id: UniqueValue) => {
    const subscriber = this.#subscribers.get(id);
    if (subscriber) {
      Disposable.tryDispose(subscriber);
    }
    this.#subscribers.delete(id);
  };

  public abstract reducer(
    state: State,
    action: InputAction,
  ): Intent<State, OutputAction>;

  public [Disposable.Dispose]() {
    for (const [, subscriber] of this.#subscribers) {
      Disposable.tryDispose(subscriber);
    }
  }

  protected injectReducer = (
    reducer: ReducerFunction<State, InputAction, OutputAction>,
  ) => {
    this.#reducers.push(reducer);
  };

  protected get state() {
    return this.#store.getState();
  }

  protected UNSAFE_setState<K extends keyof State>(
    partialState: Pick<State, K>,
  ) {
    this.#store.update(partialState as any);
  }

  protected send(action: InputAction) {
    this.#executeReducer(action);
  }

  protected generateId = () => generate(this.#generator);

  #injectId = <A extends Action<any, any>>(action: A) => {
    return A.injectMeta(action, { __afReducer__: this.#instanceId });
  };

  #executeReducer = async (action: InputAction) => {
    const lock = await this.#execLock.acquire();

    invariant(
      () => !this[Disposable.IsDisposed],
      `${this.#instanceId}: Action ${action.type} received when reducer has already been cleaned up.`,
    );

    console.log(`${this.#instanceId}: executing action `, action);
    const state = this.#store.getState();

    const output = [
      this.#reducers.map((reducer) => reducer(state, action)),
      this.reducer(state, action),
    ];

    const combined = combineAll(output);

    this.#store.UNSAFE_update(...combined.updates);
    this.#sendAllMessages(combined.actions);

    const newState = this.#store.getState();
    await this.#executeSideEffects(newState, combined.sync);

    lock.dispose();

    this.#executeSideEffects(newState, combined.async);
  };

  #sendAllMessages = async (messages: Iterable<OutputAction | void>) => {
    for (const action of messages) {
      if (action) {
        for (const [, subscriber] of this.#subscribers) {
          subscriber.dispatch(action);
        }
      }
    }
  };

  #executeSideEffects = async (
    state: State,
    effects: Iterable<(state: State) => Promise<OutputAction | void>>,
  ) => {
    const promises: Array<Promise<void | OutputAction>> = [];
    for (const exe of effects) {
      promises.push(exe(state).then((v) => v ? this.#injectId(v) : v));
    }
    const results = await Promise.all(promises);
    this.#sendAllMessages(results);
  };
}
