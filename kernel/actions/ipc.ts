import { ActionWithMeta, Action } from "./types.ts";
import { UniqueValue } from "../../x/nasi.ts";

export interface IPCSchedulerMeta {
  __afk__: UniqueValue;
}

export interface IPCWorkerMeta {
  __afk__: UniqueValue;
  __afipc_src__: UniqueValue;
  __afipc_dst__: UniqueValue;
}

export type IPCSchedulerAction =
  | ActionWithMeta<Action<"AFIPCInit">, IPCSchedulerMeta>
  | ActionWithMeta<Action<"AFIPCShutdown">, IPCSchedulerMeta>;

export type IPCWorkerAction =
  | ActionWithMeta<Action<"AFIPCInitialised", UniqueValue>, IPCWorkerMeta>
  | ActionWithMeta<Action<"AFIPCShutdownComplete">, IPCWorkerMeta>;
