import { Transform } from "./Transform";
import { render as renderSass, Options } from "node-sass";
import { State, ArtifactCollection, Artifact, ARTIFACT_TYPE_ERROR } from "./State";
import { dirname, basename } from "path";
import { SourceMapGenerator } from "source-map";

export const ARTIFACT_TYPE_SASS_FILE = Symbol('SASS source file');
export const ARTIFACT_TYPE_SASS_DATA = Symbol('SASS source data');
export const ARTIFACT_TYPE_CSS = Symbol('CSS StyleSheet');

export const render: Transform<State> = (input) => {
    return Promise.resolve(input).then(input => {
        let artifacts = input.artifacts.artifacts;

        let promises: Array<Promise<Artifact>> = artifacts.map((artifact) => {
            let sassOptions: Options = {
                sourceMap: true,
                sourceMapContents: true,
                outFile: basename(artifact.name)
            };

            switch (artifact.type) {
                case ARTIFACT_TYPE_SASS_FILE:
                    sassOptions.file = artifact.name;
                    break;
                case ARTIFACT_TYPE_SASS_DATA:
                    sassOptions.data = artifact.data.toString();
                    sassOptions.includePaths = [dirname(artifact.name)];
                    break;
            };

            return new Promise<Artifact>((resolve) => {
                renderSass(sassOptions, ((err, result) => {
                    if (err) {
                        let sourceMapGenerator = new SourceMapGenerator();

                        sourceMapGenerator.addMapping({
                            generated: {
                                line: 1,
                                column: 0
                            },
                            original: {
                                line: err.line,
                                column: err.column - 1
                            },
                            source: err.file
                        });

                        resolve({
                            type: ARTIFACT_TYPE_ERROR,
                            name: artifact.name,
                            data: Buffer.from(err.message),
                            map: Buffer.from(sourceMapGenerator.toString())
                        });
                    }
                    else {
                        resolve({
                            type: ARTIFACT_TYPE_CSS,
                            name: artifact.name,
                            data: result.css,
                            map: result.map
                        });
                    }
                }))
            });
        });

        return Promise.all(promises).then<State>((artifacts) => {
            return {
                artifacts: new ArtifactCollection(artifacts)
            }
        });
    });
};