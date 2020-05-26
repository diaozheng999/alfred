import { Driver } from "../kernel/driver/driver.ts";
import { Action, action as createAction } from "../kernel/actions/types.ts";
import { Store } from "../kernel/store/store.ts";
import { Intent, combine } from "../kernel/reducer/intent.ts";
import { Option } from "../x/nasi.ts";
import { IPCWorker } from "../kernel/driver/ipc_worker.ts";

export const DEFAULT_TIMER_DURATION_MS = 1000;

export interface TimerState {
  frequency: number;
  currentTimerId?: number;
  lastTick: number;
}

export interface TimerTickPayload {
  currentTime: number;
  timeSinceLastTick: number;
}

export type TimerAction = Action<"timer/TICK", TimerTickPayload>;

type InternalAction = Action<"timer/TICK">;

export class Timer extends Driver<InternalAction, TimerAction, TimerState> {
  constructor(store: Store<TimerState>) {
    super(store, "Timer");
  }

  public async register() {
    const currentTimerId = setInterval(this.#tick, this.state.frequency);
    this.UNSAFE_setState({ currentTimerId, lastTick: NaN });
  }

  public async shutdown() {
    const timerId = this.state.currentTimerId;

    if (Option.isSome(timerId)) {
      clearInterval(timerId);
    }
  }

  public reducer(
    state: TimerState,
    action: InternalAction,
  ): Intent<TimerState, TimerAction> {
    switch (action.type) {
      case "timer/TICK":
        const currentTime = Date.now();

        return combine(
          this.intent.send(createAction.payload("timer/TICK", {
            currentTime,
            timeSinceLastTick: currentTime - state.lastTick,
          })),
          this.intent.update({ lastTick: currentTime }),
        );

      default:
        return [];
    }
  }

  #tick = () => {
    this.send(createAction.only("timer/TICK"));
  };
}

IPCWorker(Timer, {
  frequency: DEFAULT_TIMER_DURATION_MS,
  currentTimerId: undefined,
  lastTick: NaN,
});
