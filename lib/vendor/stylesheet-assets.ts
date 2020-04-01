import {TransformFactory} from "./Transform";
import {Rebaser} from "css-source-map-rebase";
import {Artifact, State} from "./Artifact";
import {readFileSync} from "fs";
import {join, dirname} from "path";

type Configuration = {
    asset: symbol,
    stylesheet: symbol
}

export const rebase: TransformFactory<Configuration> = (configuration) => () => (input) => {
    return Promise.resolve(input).then(input => {
        let artifacts = input.get(configuration.stylesheet);
        let promises: Array<Promise<[Artifact, Artifact]>> = [];

        for (let artifact of artifacts) {
            let rebaser = new Rebaser({
                map: artifact.map
            });

            promises.push(rebaser.rebase(artifact.data).then(result => {
                return [artifact, {
                    type: configuration.stylesheet,
                    name: artifact.name,
                    data: result.css,
                    map: result.map
                }];
            }))
        }

        return Promise.all(promises).then(tuples => input.clone(tuples));
    });
};

type ExtractConfiguration = {
    asset: symbol,
    stylesheet: symbol,
    error: symbol
}

export const extract: TransformFactory<ExtractConfiguration> = (configuration) => () => (input) => {
    return Promise.resolve(input).then(input => {
        let artifacts = input.get(configuration.stylesheet);

        return Promise.all(artifacts.map(artifact => {
            let assets: Array<string> = [];

            let rebaser = new Rebaser({
                map: artifact.map,
                rebase: (source, resolvedPath, done) => {
                    assets.push(resolvedPath);

                    done();
                }
            });

            return rebaser.rebase(artifact.data).then(result => {
                let artifacts: Array<Artifact> = assets.map(asset => {
                    let data: Buffer;

                    try {
                        data = readFileSync(asset);
                    }
                    catch (err) {
                        return {
                            type: configuration.error,
                            name: artifact.name,
                            data: Buffer.from(err.message),
                            map: null
                        }
                    }

                    return {
                        type: configuration.asset,
                        name: join(dirname(artifact.name), asset),
                        data: data,
                        map: null
                    };
                });

                return artifacts;
            });
        })).then(artifactss => {
            let stateArtifacts: Array<Artifact> = [];

            for (let artifacts of artifactss) {
                stateArtifacts = stateArtifacts.concat(artifacts);
            }

            return new State(input.artifacts.concat(stateArtifacts));
        });
    });
};