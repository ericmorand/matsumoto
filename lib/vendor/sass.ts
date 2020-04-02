import {TransformFactory} from "./Transform";
import {render as renderSass, Options as SassOptions} from "node-sass";
import {Artifact} from "./Artifact";
import {dirname, basename} from "path";
import {SourceMapGenerator} from "source-map";
import {State} from "./State";

type Symbolism = {
    sass: symbol
    error: symbol,
    asset: symbol,
    stylesheet: symbol
};

export const render: TransformFactory<Symbolism, SassOptions> = (symbolism) => (options?) => (input) => {
    return Promise.resolve<State>(input)
        .then((input) => {
            return Promise.all<Artifact>(input.get(symbolism.sass).map((artifact) => {
                let sassOptions: SassOptions = Object.assign({}, options, {
                    sourceMap: true,
                    sourceMapContents: true,
                    omitSourceMapUrl: true,
                    outFile: basename(artifact.name)
                });

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
                                type: symbolism.error,
                                name: artifact.name,
                                data: Buffer.from(err.message),
                                map: Buffer.from(sourceMapGenerator.toString())
                            });
                        } else {
                            resolve({
                                type: symbolism.stylesheet,
                                name: artifact.name,
                                data: result.css,
                                map: result.map
                            });
                        }
                    }))
                });
            }))
        })
        .then((artifacts) => {
            return new State(artifacts)
        });
};