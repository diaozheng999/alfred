import { Action } from "./types.ts";
import { Dispatcher } from "../reducer/dispatcher.ts";
import { UniqueValue } from "../../x/nasi.ts";

export type ReducerType = "DRIVER";

export interface AddReducerPayload {
  reducerPath: string;
  type: ReducerType;
  ipc: boolean;
}

export interface RegisterWorkerPayload {
  tid: UniqueValue;
  dispatcher: Dispatcher<Action<any, any>>;
}

export type KernelAction =
  | Action<"AFKAddDriverInternal", UniqueValue>
  | Action<"AFKAddReducer", AddReducerPayload>
  | Action<"AFKRegisterDispatcher", RegisterWorkerPayload>;
