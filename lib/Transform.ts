import { ArtifactCollection } from "./Artifact";

export type Transform = (input: ArtifactCollection | Promise<ArtifactCollection>) => Promise<ArtifactCollection>;
export type TransformFactory<O> = (options?: O) => Transform;