import { ActionWithMeta, Action } from "./types.ts";
import { UniqueValue } from "../../x/nasi.ts";

export interface DriverMeta {
  __afDriver__: UniqueValue;
}

export interface KernelMeta {
  __afk__: UniqueValue;
}

export type LifecycleAction =
  | ActionWithMeta<Action<"AFKDriverRegistrationBegin">, DriverMeta>
  | ActionWithMeta<Action<"AFKDriverRegistrationComplete">, DriverMeta>
  | ActionWithMeta<Action<"AFKDriverRegister">, KernelMeta>
  | ActionWithMeta<Action<"AFKDriverRehydrate", any>, KernelMeta>
  | ActionWithMeta<Action<"AFKDriverShutdown">, KernelMeta>;
