import {TransformFactory} from "./vendor/Transform";
import {outputFile} from "fs-extra";
import {Artifact} from "./vendor/Artifact";
import {State} from "./vendor/State";

type Symbolism = {
    error: symbol
};

export const write: TransformFactory<Symbolism> = (symbolism) => () => (input) => {
    return Promise.resolve<State>(input)
        .then((input) => {
            return Promise.all<Artifact>(input.artifacts.map((artifact) => {
                return new Promise((resolve) => {
                    if (artifact.type !== symbolism.error) {
                        outputFile(artifact.name, artifact.data, () => {
                            resolve(artifact);
                        });
                    } else {
                        resolve(artifact);
                    }
                })
            }))
        })
        .then((artifacts) => {
            return new State(artifacts)
        });
};