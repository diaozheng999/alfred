import { Unit, UniqueValue, Option } from "../../x/nasi.ts";

export type Action<T, U = Unit> = U extends Unit ? { type: T }
  : { type: T; payload: U };

export type ActionWithMeta<A extends Action<any, any>, M> = A & { meta: M };

const inputSymbol = Symbol("AFInput");
const outputSymbol = Symbol("AFOutput");

function only<T>(type: T): Action<T, Unit> {
  return { type };
}

function payload<T, U>(type: T, payload: U) {
  return { type, payload };
}

function injectMeta<M, A extends Action<any, any>, EM>(
  action: ActionWithMeta<A, EM>,
  meta: M,
): ActionWithMeta<A, M & EM>;
function injectMeta<M, A extends Action<any, any>>(
  action: A,
  meta: M,
): ActionWithMeta<A, M>;
function injectMeta<M, T, U = Unit>(
  action: Action<T, U>,
  meta: M,
): ActionWithMeta<Action<T, U>, M>;
function injectMeta<M, A extends Action<any, any>, ExistingMeta>(
  action: ActionWithMeta<A, ExistingMeta>,
  meta: M,
): ActionWithMeta<A, ExistingMeta & M> {
  const existingMeta = action.meta;
  if (existingMeta) {
    return { ...action, meta: { ...existingMeta, ...meta } };
  }
  return { ...action, meta } as any;
}

export const action = {
  only,
  payload,
  injectMeta,
  input: inputSymbol,
  output: outputSymbol,
} as const;
