import {TransformFactory} from "./Transform";
import {render as renderSass, Options as SassOptions} from "node-sass";
import {Artifact, State} from "./Artifact";
import {dirname, basename} from "path";
import {SourceMapGenerator} from "source-map";

type Configuration = {
    sass: symbol
    error: symbol,
    asset: symbol,
    stylesheet: symbol
};

export const render: TransformFactory<Configuration> = (configuration) => () => (input) => {
    return Promise.resolve(input).then(input => {
        let artifacts = input.get(configuration.sass);

        let promises: Array<Promise<Artifact>> = artifacts.map((artifact) => {
            let sassOptions: SassOptions = {
                sourceMap: true,
                sourceMapContents: true,
                omitSourceMapUrl: true,
                outFile: basename(artifact.name)
            };

            if (artifact.data) {
                sassOptions.data = artifact.data.toString();
                sassOptions.includePaths = [dirname(artifact.name)];
            } else {
                sassOptions.file = artifact.name;
            }

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
                            type: configuration.error,
                            name: artifact.name,
                            data: Buffer.from(err.message),
                            map: Buffer.from(sourceMapGenerator.toString())
                        });
                    } else {
                        resolve({
                            type: configuration.stylesheet,
                            name: artifact.name,
                            data: result.css,
                            map: result.map
                        });
                    }
                }))
            });
        });

        return Promise.all(promises).then((artifacts) => {
            return new State(artifacts);
        });
    });
};