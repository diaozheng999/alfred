import { Action, action as A } from "../actions/types.ts";
import { LifecycleAction } from "../actions/lifecycle.ts";
import {
  Intent,
  send,
  combine,
  execute,
  update,
} from "../reducer/intent.ts";
import { Store } from "../store/store.ts";
import { Reducer } from "../reducer/reducer.ts";

export abstract class Driver<
  InputAction extends Action<any, any>,
  OutputAction extends Action<any, any>,
  State extends {},
> extends Reducer<
  InputAction | LifecycleAction,
  OutputAction | LifecycleAction,
  State,
> {
  #store: Store<State>;

  constructor(store: Store<State>, identifier?: string) {
    super(store, identifier);
    this.#store = store;
    this.injectReducer(this.#reducer);
  }

  public abstract register(): Promise<void>;

  public abstract shutdown(): Promise<void>;

  protected send(action: InputAction | LifecycleAction) {
    super.send(this.#injectId(action));
  }

  protected intent = {
    send: (action: OutputAction) =>
      send<State, OutputAction>(this.#injectId(action)),
    execute: (
      exe: (newState: State) => Promise<void | OutputAction>,
      sync?: boolean,
    ) => execute<State, OutputAction>(exe, sync),
    update: <K extends keyof State>(toUpdate: Pick<State, K>) =>
      update<State, K, OutputAction>(toUpdate),
  };

  #reducer = (
    _state: State,
    action: LifecycleAction | InputAction,
  ): Intent<State, OutputAction | LifecycleAction> => {
    switch (action.type) {
      case "AFKDriverRegister":
        return combine(
          send(this.#injectId({ type: "AFKDriverRegistrationBegin" })),
          execute(this.#__register),
        );

      case "AFKDriverShutdown":
        return execute<State, LifecycleAction>(this.#__shutdown);

      case "AFKDriverRehydrate":
        return [];

      case "AFKDriverRegistrationBegin":
      case "AFKDriverRegistrationComplete":
        return [];

      default:
        return [];
    }
  };

  #injectId = <A extends Action<any, any>>(action: A) => {
    return A.injectMeta(action, { __afDriver__: this.instanceId });
  };

  #__register = async (): Promise<LifecycleAction> => {
    this.#store.unlock();
    await this.register();
    this.#store.lock();
    return this.#injectId({ type: "AFKDriverRegistrationComplete" } as const);
  };

  #__shutdown = async (): Promise<void> => {
    await this.shutdown();
    self.close();
  };
}
