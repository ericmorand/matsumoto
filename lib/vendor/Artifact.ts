export type ArtifactType = symbol;

export type Artifact = {
    type: ArtifactType,
    data: Buffer,
    name: string,
    map: Buffer
};