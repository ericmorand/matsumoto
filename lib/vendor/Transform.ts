import {State} from "./Artifact";

type Configuration = {
    [key: string]: symbol
};

export type Transform = (input: State | Promise<State>) => Promise<State>;
export type TransformFactory<C extends Configuration, O = any> = (configuration?: C) => (options?: O) => Transform;