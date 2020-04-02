import {State} from "./State";

type Symbolism = {
    [key: string]: symbol
};

export type Transform = (input: State | Promise<State>) => Promise<State>;
export type TransformFactory<S extends Symbolism, O = any> = (symbolism: S) => (options?: O) => Transform;