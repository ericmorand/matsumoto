import {TransformFactory} from "./vendor/Transform";
import { outputFile } from "fs-extra";
import { join, relative } from "path";

type Options = {
    error: symbol
};

export const write: TransformFactory<Options> = (o) => () => (input) => {
    return Promise.resolve(input).then(input => {
        let promises = [];

        for (let artifact of input.artifacts) {
            if (artifact.type !== o.error) {
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