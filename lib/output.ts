import { Transform } from "./Transform";
import { outputFile } from "fs-extra";
import { join, relative } from "path";
import { ARTIFACT_TYPE_ERROR } from "./Artifact";

export const write: Transform = (input) => {
    return Promise.resolve(input).then(input => {
        let promises = [];

        for (let artifact of input.artifacts) {
            if (artifact.type !== ARTIFACT_TYPE_ERROR) {
                promises.push(new Promise((resolve) => {
                    outputFile(join('www', relative('test', artifact.name)), artifact.data, (err) => {
                        resolve(artifact);
                    });
                }));
            }
        }

        return Promise.all(promises).then(() => input);
    });
};