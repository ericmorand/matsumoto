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

        this.addArtifacts(artifacts);
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

    addArtifacts(artifacts: Array<Artifact>) {
        for (let artifact of artifacts) {
            this.addArtifact(artifact);
        }

        return this;
    }

    addArtifact(artifact: Artifact) {
        this._container.add(artifact);

        return this;
    }
};

export type State = {
    artifacts: ArtifactCollection,
    error?: {
        state: State,
        artifact: Artifact,
        message: string,
        location: {
            name: string,
            line?: number,
            column?: number
        }
    }
};