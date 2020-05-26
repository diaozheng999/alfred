import { UniqueValue, Unique } from "../../x/nasi.ts";
import { v4, NIL_UUID } from "../../x/uuid.ts";
import { encodeToString } from "../../x/hex.ts";

export const nil = NIL_UUID as UniqueValue;

export function generate(generator?: Unique): UniqueValue {
  if (generator) {
    return generator.opaque;
  }
  return v4.generate() as UniqueValue;
}

export function generate_(prefix: string): UniqueValue {
  const p = crypto.getRandomValues(new Uint8Array(4));
  return `${prefix}${encodeToString(p)}` as UniqueValue;
}
