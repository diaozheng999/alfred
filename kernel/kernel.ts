import { action as createAction, Action, action } from "./actions/types.ts";
import { deferred, Deferred } from "../x/async.ts";
import { UniqueValue, Semaphore } from "../x/nasi.ts";
import { Map } from "../x/immutable.ts";
import { KernelAction, ReducerType } from "./actions/kernel.ts";
import {
  IPCSchedulerAction,
  IPCWorkerMeta,
  IPCWorkerAction,
} from "./actions/ipc.ts";
import { Reducer } from "./reducer/reducer.ts";
import { Store } from "./store/store.ts";
import { Intent, execute, update, send } from "./reducer/intent.ts";
import { Dispatcher } from "./reducer/dispatcher.ts";
import { IPCDispatcher } from "./driver/ipc_dispatcher.ts";

export interface KernelState {
  dispatchers: Map<UniqueValue, Dispatcher<Action<any, any>>>;
}

export class Kernel extends Reducer<
  KernelAction,
  KernelAction | IPCSchedulerAction,
  KernelState,
> {
  constructor() {
    super(new Store({ dispatchers: Map() }), "__AFKERNEL__");
  }

  reducer(
    state: KernelState,
    action: KernelAction,
  ): Intent<KernelState, KernelAction | IPCSchedulerAction> {
    switch (action.type) {
      case "AFKAddReducer":
        return execute<KernelState, KernelAction | IPCSchedulerAction>(
          this.#__registerIPCReducer(
            action.payload.reducerPath,
            action.payload.type,
          ),
        );

      case "AFKRegisterDispatcher":
        return update(
          {
            dispatchers: state.dispatchers.set(
              action.payload.tid,
              action.payload.dispatcher,
            ),
          },
        );

      case "AFKAddDriverInternal":
        return execute<KernelState, KernelAction | IPCSchedulerAction>(
          async () => {
            this.#send(
              action.payload,
              this.#injectId({ type: "AFKDriverRegister" }),
            );
          },
        );

      default:
        return [];
    }
  }

  #send = (dest: UniqueValue, action: Action<any, any>) => {
    if (dest === this.instanceId) {
      this.send(action as any);
    }
    console.warn(this.state.dispatchers);
    const destination = this.state.dispatchers.get(dest);
    if (destination) {
      destination.dispatch(action);
    } else {
      console.error(
        `${this.instanceId}: Dispatcher for ${dest} does not exist.`,
      );
    }
  };

  #__registerIPCReducer = (path: string, type: ReducerType) =>
    async () => {
      const worker = new Worker(path, { type: "module", deno: true });
      const init = deferred<UniqueValue>();

      worker.onmessage = this.#onWorkerMessage(init);

      worker.postMessage([this.#injectId({ type: "AFIPCInit" })]);

      const tid = await init;
      const dispatcher = new IPCDispatcher(tid, this.instanceId, worker);

      this.send(action.payload("AFKRegisterDispatcher", {
        tid,
        dispatcher,
      }));

      switch (type) {
        case "DRIVER":
          this.send(
            this.#injectId(createAction.payload("AFKAddDriverInternal", tid)),
          );
      }
    };

  public async addDriver(key: string, driver: string) {
    this.send({
      type: "AFKAddReducer",
      payload: {
        reducerPath: driver,
        type: "DRIVER",
        ipc: true,
      },
    });
  }

  #injectId = <A extends Action<any, any>>(action: A) => {
    return createAction.injectMeta(action, { __afk__: this.instanceId });
  };

  #onWorkerMessage = (init: Deferred<UniqueValue>) =>
    (message: MessageEvent) => {
      const actions: Array<IPCWorkerAction | KernelAction> = message.data;
      const __afIPCReceivedAt__ = Date.now();
      for (const action of actions) {
        switch (action.type) {
          case "AFIPCInitialised":
            init.resolve(action.payload);

          case "AFIPCShutdownComplete":
            break;

          default:
            this.send(
              createAction.injectMeta(action, { __afIPCReceivedAt__ }),
            );
        }
      }
    };
}
