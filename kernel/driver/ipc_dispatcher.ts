import {
  CoreDisposable,
  Mutex,
  Semaphore,
  Disposable,
  UniqueValue,
} from "../../x/nasi.ts";
import { Action, action as A } from "../actions/types.ts";
import { Dispatcher } from "../reducer/dispatcher.ts";

const MIN_SLEEP_TIME_IN_MS = 400;

export class IPCDispatcher<T extends Action<any, any>> extends CoreDisposable
  implements Dispatcher<T> {
  #messageQueue: T[] = [];
  #sem = new Mutex();

  #threadId: UniqueValue;
  #kernelId: UniqueValue;
  #destId: UniqueValue;

  #worker?: Worker;

  constructor(threadId: UniqueValue, kernelId: UniqueValue, worker?: Worker) {
    super();
    this.#kernelId = kernelId;
    if (worker) {
      this.#threadId = kernelId;
      this.#destId = threadId;
    } else {
      this.#threadId = threadId;
      this.#destId = kernelId;
    }
    this.#worker = worker;
  }

  public dispatch(action: T) {
    this.#messageQueue.push(this.#injectMeta(action));
    this.#tryDispatch();
  }

  public async [Disposable.Dispose]() {
    await this.#tryDispatch();
    if (!this.#worker) {
      self.close();
    }
  }

  #injectMeta = (action: T) =>
    A.injectMeta(action, {
      __afk__: this.#kernelId,
      __aftid__: this.#threadId,
      __afdst__: this.#destId,
      __afIPCSentAt__: Date.now(),
    });

  #tryDispatch = () => this.#sem.lock(this.#__tryDispatch);

  #__tryDispatch = async () => {
    const dispatcher: any = this.#worker ?? self;

    if (this.#messageQueue.length) {
      dispatcher.postMessage(this.#messageQueue);
      this.#messageQueue = [];
      await Semaphore.sleep(MIN_SLEEP_TIME_IN_MS);
    }
  };
}
