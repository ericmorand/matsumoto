import {TransformFactory} from "./Transform";
import {Rebaser} from "css-source-map-rebase";
import {Artifact} from "./Artifact";
import {readFileSync} from "fs";
import {join, dirname} from "path";
import {State} from "./State";

type RebaseSymbolism = {
    asset: symbol,
    stylesheet: symbol
}

export const rebase: TransformFactory<RebaseSymbolism> = (symbolism) => () => (input) => {
    return Promise.resolve<State>(input).then((input) => {
        let artifacts = input.get(symbolism.stylesheet);
        let promises: Array<Promise<[Artifact, Artifact]>> = [];

        for (let artifact of artifacts) {
            let rebaser = new Rebaser({
                map: artifact.map
            });

            promises.push(rebaser.rebase(artifact.data).then(result => {
                return [artifact, {
                    type: symbolism.stylesheet,
                    name: artifact.name,
                    data: result.css,
                    map: result.map
                }];
            }))
        }

        return Promise.all(promises).then((tuples) => {
            return input.clone(tuples)
        });
    });
};

type ExtractSymbolism = {
    asset: symbol,
    stylesheet: symbol,
    error: symbol
}

export const extract: TransformFactory<ExtractSymbolism> = (symbolism) => () => (input) => {
    return Promise.resolve<State>(input).then((input) => {
        let artifacts = input.get(symbolism.stylesheet);

        return Promise.all(artifacts.map((artifact) => {
            let assets: Array<string> = [];

            let rebaser = new Rebaser({
                map: artifact.map,
                rebase: (source, resolvedPath, done) => {
                    assets.push(resolvedPath);

                    done();
                }
            });

            return rebaser.rebase(artifact.data).then((result) => {
                let artifacts: Array<Artifact> = assets.map(asset => {
                    let data: Buffer;

                    try {
                        data = readFileSync(asset);
                    } catch (err) {
                        return {
                            type: symbolism.error,
                            name: artifact.name,
                            data: Buffer.from(err.message),
                            map: null
                        }
                    }

                    return {
                        type: symbolism.asset,
                        name: join(dirname(artifact.name), asset),
                        data: data,
                        map: null
                    };
                });

                return artifacts;
            });
        })).then((arraysOfArtifacts) => {
            let artifacts: Array<Artifact> = [];

            for (let arrayOfArtifacts of arraysOfArtifacts) {
                artifacts = artifacts.concat(arrayOfArtifacts);
            }

            return new State(input.artifacts.concat(artifacts));
        });
    });
};