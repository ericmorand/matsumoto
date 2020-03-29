export type Transform<I, O = I> = (input: I | Promise<I>) => Promise<O>;
export type TransformFactory<T, I, O = I> = (options?: T) => Transform<I, O>;