import { Action, action as createAction } from "../actions/types.ts";
import { Driver } from "./driver.ts";
import { Store } from "../store/store.ts";
import { Unique, UniqueValue } from "../../x/nasi.ts";
import { deferred } from "../../x/async.ts";
import { IPCSchedulerAction } from "../actions/ipc.ts";
import { IPCDispatcher } from "./ipc_dispatcher.ts";

const workerIds = [
  "bruce",
  "dick",
  "selina",
  "kathy",
  "bette",
  "barbara",
  "jason",
  "helena",
  "tim",
  "stephanie",
  "cassandra",
  "kate",
  "damian",
  "harper",
  "duke",
  "luke",
  "michael",
  "jean-paul",
  "bane",
  "black_mask",
  "clayface",
  "deadshot",
  "deathstroke",
  "firefly",
  "harley",
  "hugo",
  "hush",
  "joker",
  "croc",
  "moth",
  "man-bat",
  "mr-freeze",
  "nora",
  "penguin",
  "poison-ivy",
  "ra's-al-ghul",
  "riddler",
  "scarecrow",
  "two-face",
  "ventriloquist",
  "victor-zsasz",
];

export async function IPCWorker<
  InputAction extends Action<any, any>,
  OutputAction extends Action<any, any>,
  State,
>(
  ctor: new (
    store: Store<State>,
    identifier?: string,
  ) => Driver<InputAction, OutputAction, State>,
  initialState: State,
  identifier?: string,
) {
  const threadId = new Unique(
    workerIds[Math.floor(Math.random() * workerIds.length * 0.999999)],
  ).opaque;

  const init = deferred<UniqueValue>();

  const store = new Store(initialState);
  const dest = new ctor(store, identifier);

  self.onmessage = (e) => {
    const actions: Array<IPCSchedulerAction> = e.data;
    const __afIPCReceivedAt__ = Date.now();

    for (const action of actions) {
      switch (action.type) {
        case "AFIPCInit":
          init.resolve(action.meta.__afk__);

        default:
          dest.dispatch(
            createAction.injectMeta(
              action as any,
              { __afIPCReceivedAt__ },
            ),
          );
      }
    }
  };

  const kernelId = await init;
  const dispatcher = new IPCDispatcher(threadId, kernelId);
  dest.subscribe(dispatcher);
  dispatcher.dispatch({
    type: "AFIPCInitialised",
    payload: threadId,
  });

  return threadId;
}
