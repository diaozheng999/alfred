import { Kernel } from "./kernel/kernel.ts";

const kernel = new Kernel();

kernel.addDriver("timer", "./driver/timer.ts");
