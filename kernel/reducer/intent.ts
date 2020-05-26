import { LinkedList, Option } from "../../x/nasi.ts";
import type { Action } from "../actions/types.ts";

const intent = Symbol("AFIntent");

interface SingleIntent<TState, TAction extends Action<any>> {
  update?: Partial<TState>;
  action?: TAction;
  async?: (newState: TState) => Promise<TAction | void>;
  sync?: (newState: TState) => Promise<TAction | void>;
  [intent]: typeof intent;
}

interface CombinedIntentInternal<TState, TAction extends Action<any>> {
  updates: LinkedList<Partial<TState>>;
  actions: LinkedList<TAction>;
  async: LinkedList<(newState: TState) => Promise<TAction | void>>;
  sync: LinkedList<(newState: TState) => Promise<TAction | void>>;
}

export interface CombinedIntent<TState, TAction extends Action<any>> {
  updates: Iterable<Partial<TState>>;
  actions: Iterable<TAction>;
  async: Iterable<(newState: TState) => Promise<TAction | void>>;
  sync: Iterable<(newState: TState) => Promise<TAction | void>>;
}

export type Intent<S, A extends Action<any>> =
  | SingleIntent<S, A>
  | Array<Intent<S, A>>;

export function update<
  S,
  K extends keyof S,
  A extends Action<any>,
>(update: Pick<S, K>): Intent<S, A> {
  return { update, [intent]: intent } as any;
}

export function execute<S, A extends Action<any>>(
  exe: (newState: S) => Promise<void | A>,
  sync?: boolean,
): Intent<S, A> {
  if (sync !== false) {
    return { async: exe, [intent]: intent };
  }
  return { sync: exe, [intent]: intent };
}

export function send<S, A extends Action<any>>(
  action: A,
  __inject?: (action: A) => A,
): Intent<S, A> {
  if (__inject) {
    return { action: __inject(action), [intent]: intent };
  }
  return { action, [intent]: intent };
}

export function updateAndExec<
  S,
  K extends keyof S,
  A extends Action<any>,
>(update: Pick<S, K>, exe: (newState: S) => Promise<void | A>): Intent<S, A> {
  return { update, exec: exe, [intent]: intent } as any;
}

export function combine<S, A extends Action<any>>(
  ...intents: Intent<S, A>[]
): Intent<S, A> {
  return intents;
}

function isSingleIntent<S, A extends Action<any>>(
  i: Intent<S, A>,
): i is SingleIntent<S, A> {
  return i.hasOwnProperty(intent);
}

function walk<S, A extends Action<any>>(
  combined: CombinedIntentInternal<S, A>,
  intents: Intent<S, A>,
) {
  if (isSingleIntent(intents)) {
    Option.map(intents.update, combined.updates.push);
    Option.map(intents.action, combined.actions.push);
    Option.map(intents.async, combined.async.push);
    Option.map(intents.sync, combined.sync.push);
  } else {
    for (const it of intents) {
      walk(combined, it);
    }
  }
}

export function combineAll<S, A extends Action<any>>(
  intent: Intent<S, A>,
): CombinedIntent<S, A> {
  const combined: CombinedIntentInternal<S, A> = {
    updates: new LinkedList(),
    actions: new LinkedList(),
    async: new LinkedList(),
    sync: new LinkedList(),
  };

  walk(combined, intent);

  return combined;
}
