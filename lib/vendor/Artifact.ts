export type ArtifactType = Symbol;

export type Artifact = {
    type: ArtifactType,
    data: Buffer,
    name: string,
    map: Buffer
};

export class State {
    private readonly _artifacts: Array<Artifact>;

    constructor(artifacts: Array<Artifact>) {
        this._artifacts = artifacts;
    }

    get artifacts(): Array<Artifact> {
        return this._artifacts;
    }

    get(type: ArtifactType): Array<Artifact> {
        let results: Array<Artifact> = [];

        for (let artifact of this._artifacts) {
            if (artifact.type === type) {
                results.push(artifact);
            }
        }

        return results;
    }

    clone(replacementMap?: Array<[Artifact, Artifact]>) {
        let map = new Map<Artifact, Artifact>(this._artifacts.map(artifact => [artifact, artifact]));

        for (let tuple of replacementMap) {
            map.set(tuple[0], tuple[1]);
        }

        return new State([...map.values()]);
    }
}
