import { Unit, Integer, UniqueValue } from "../../x/nasi.ts";
import { Action, action, ActionWithMeta } from "./types.ts";

const AFBoolean = Symbol("AFInputBoolean");
const AFTrigger = Symbol("AFInputTrigger");
const AFNumeric = Symbol("AFInputNumeric");
const AFInteger = Symbol("AFInputInteger");
const AFString = Symbol("AFInputString");

interface InputEventPayload<T, Type> {
  value: T;
  type: Type;
}

interface InputEventMeta {
  source: UniqueValue;
}

type Annotation<T> = { [n: string]: T };

export type TriggerType = { [k in typeof AFTrigger]: Unit };
export type BooleanType = { [k in typeof AFBoolean]: boolean };
export type NumericType = { [k in typeof AFNumeric]: number };
export type IntegerType = { [k in typeof AFInteger]: Integer.Type };
export type StringType = { [k in typeof AFString]: string };

export type InputEvent<T extends Annotation<any>> = ActionWithMeta<
  Action<
    typeof action.input,
    InputEventPayload<T[keyof T], keyof T>
  >,
  InputEventMeta
>;

export function input<T extends Annotation<any>>(
  type: keyof T,
  value: T[keyof T],
  source: UniqueValue,
): InputEvent<T>;
export function input<Type extends string | number | symbol, Value>(
  type: Type,
  value: Value,
  source: UniqueValue,
): InputEvent<{ [k in Type]: Value }>;
export function input<T extends Annotation<any>>(
  type: keyof T,
  value: T[keyof T],
  source: UniqueValue,
): InputEvent<T> {
  return action.injectMeta(
    action.payload(action.input, { value, type }),
    { source },
  );
}

function boolean(value: boolean, source: UniqueValue): InputEvent<BooleanType> {
  return input(AFBoolean, value, source);
}
function trigger(source: UniqueValue): InputEvent<TriggerType> {
  return input(AFTrigger, Unit, source);
}
function numeric(value: number, source: UniqueValue): InputEvent<NumericType> {
  return input(AFNumeric, value, source);
}
function integer(
  value: Integer.Type,
  source: UniqueValue,
): InputEvent<IntegerType> {
  return input(AFInteger, value, source);
}
function string(value: string, source: UniqueValue): InputEvent<StringType> {
  return input(AFString, value, source);
}

export const primitive = { boolean, trigger, numeric, integer, string };
