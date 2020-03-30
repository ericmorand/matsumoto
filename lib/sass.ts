import { Transform } from "./Transform";
import { render as renderSass, Options } from "node-sass";
import { ArtifactCollection, Artifact, ARTIFACT_TYPE_ERROR } from "./Artifact";
import { dirname, basename, join } from "path";
import { readFileSync } from "fs";
import { SourceMapGenerator } from "source-map";
import { Transform as TransformStream, Readable } from "stream";

const { Rebaser } = require('css-source-map-rebase');

export const ARTIFACT_TYPE_SASS_FILE = Symbol('SASS source file');
export const ARTIFACT_TYPE_SASS_DATA = Symbol('SASS source data');
export const ARTIFACT_TYPE_CSS = Symbol('CSS StyleSheet');
export const ARTIFACT_TYPE_ASSET = Symbol('Asset');

export const render: Transform = (input) => {
    return Promise.resolve(input).then(input => {
        let artifacts = input.artifacts;

        let promises: Array<Promise<ArtifactCollection>> = artifacts.map((artifact) => {
            let sassOptions: Options = {
                sourceMap: true,
                sourceMapContents: true,
                omitSourceMapUrl: true,
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

            return new Promise<ArtifactCollection>((resolve) => {
                let artifacts = new ArtifactCollection();

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

                        artifacts.add({
                            type: ARTIFACT_TYPE_ERROR,
                            name: artifact.name,
                            data: Buffer.from(err.message),
                            map: Buffer.from(sourceMapGenerator.toString())
                        });
                    }
                    else {
                        let data: Buffer = Buffer.from('');

                        let rebaser = new Rebaser({
                            map: result.map.toString(),
                            rebase: (object, done) => {
                                try {
                                    let data = readFileSync(object.resolved.pathname);

                                    artifacts.add({
                                        type: ARTIFACT_TYPE_ASSET,
                                        name: join(dirname(artifact.name), object.resolved.pathname),
                                        data: data,
                                        map: null
                                    });
                                }
                                catch (err) {
                                    artifacts.add({
                                        type: ARTIFACT_TYPE_ERROR,
                                        name: artifact.name,
                                        data: Buffer.from(err.message),
                                        map: null
                                    });
                                }

                                done();
                            }
                        });

                        let stream = new Readable();

                        stream.pipe(rebaser);

                        rebaser.on('data', (chunk: Buffer) => {
                            data = Buffer.concat([data, chunk]);
                        });

                        stream.on('end', () => {
                            artifacts.add({
                                type: ARTIFACT_TYPE_CSS,
                                name: artifact.name,
                                data: data,
                                map: result.map
                            });

                            resolve(artifacts);
                        });

                        stream.push(result.css);
                        stream.push(null);
                    }
                }))
            });
        });

        return Promise.all(promises).then((artifactCollections) => {
            let collection = new ArtifactCollection();

            for (let artifactCollection of artifactCollections) {
                collection.addMultiple(artifactCollection.artifacts);
            }

            return collection;
        });
    });
};