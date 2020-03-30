export type ArtifactType = Symbol;

export const ARTIFACT_TYPE_ERROR = Symbol('Error');

export type Artifact = {
    type: ArtifactType,
    data: Buffer,
    name: string,
    map: Buffer
};

export class ArtifactCollection {
    private readonly _container: Set<Artifact>;

    constructor(artifacts: Array<Artifact> = []) {
        this._container = new Set();

        this.addMultiple(artifacts);
    }

    get artifacts(): Array<Artifact> {
        return [...this._container.values()];
    }

    get types(): Array<ArtifactType> {
        let results: Set<ArtifactType> = new Set();

        for (let artifact of this._container) {
            results.add(artifact.type);
        }

        return [...results.values()];
    }

    get(type: ArtifactType): Array<Artifact> {
        let results: Array<Artifact> = [];

        for (let artifact of this._container) {
            if (artifact.type === type) {
                results.push(artifact);
            }
        }

        return results;
    }

    addMultiple(artifacts: Array<Artifact>) {
        for (let artifact of artifacts) {
            this.add(artifact);
        }

        return this;
    }

    add(artifact: Artifact) {
        this._container.add(artifact);

        return this;
    }
};