import {render} from "./lib/vendor/sass";
import {Artifact} from "./lib/vendor/Artifact";
import {SourceMapConsumer} from "source-map";
import {resolve, join, dirname, relative} from "path";
import {write} from "./lib/output";
import {
    ARTIFACT_TYPE_ASSET,
    ARTIFACT_TYPE_CSS,
    ARTIFACT_TYPE_ERROR,
    STATE_NAME_SASS,
    STATE_NAME_INITIAL, ARTIFACT_TYPE_SASS
} from "./lib/Symbols";
import {Transform} from "./lib/vendor/Transform";
import {extract, rebase} from "./lib/vendor/stylesheet-assets";
import {State} from "./lib/vendor/State";
import * as colors from "colors";
import {processDirectory} from "./lib/component-resolver";
import {registerPrompt, prompt} from "inquirer";
import {AutocompletePrompt} from "./lib/inquirer-autocomplete-prompt";
import {Component} from "./lib/component";
import {NamedState} from "./lib/named-state";
import {Gaze} from "gaze";

const fuzzy = require('fuzzy');

processDirectory('test', 'manifest.js').then((components) => {
    let componentTitles = components.map((component) => {
        return component.title || component.name;
    });

    registerPrompt('autocomplete', AutocompletePrompt);

    let componentSource = (answers: string[], input: string): Promise<string[]> => {
        input = input || '';

        return new Promise((resolve) => {
            let results = fuzzy.filter(input, componentTitles);

            resolve(results.map((result: { string: string, index: number, original: string }) => {
                let component = components[result.index];

                return {
                    name: result.original,
                    value: component
                };
            }));
        });
    };

    prompt<{ component: Component }>({
        type: 'autocomplete',
        name: 'component',
        message: 'Which component do you want to test?',
        pageSize: 10,
        source: componentSource,
        validate: function (val) {
            return val ? true : 'Type something!';
        }
    }).then((answer: { component: Component }) => {
        return handleComponent(answer.component);
    });
});

const move: Transform = (state) => {
    return Promise.resolve(state).then((state) => {
        let artifacts: Array<Artifact> = [];

        for (let artifact of state.artifacts) {
            artifacts.push({
                type: artifact.type,
                name: join('www', relative('test', artifact.name)),
                data: artifact.data,
                map: artifact.map
            });
        }

        return new State(artifacts);
    });
};

const handleComponent = (component: Component) => {
    let watchers: Map<string, Gaze> = new Map();

    // index.scss
    {
        let entry: string = join(dirname(component.path), 'index.scss');

        let w = (): Promise<void> => {
            console.warn('W CALLED', new Date().getTime());

            return write2(
                move(
                    rebaseAssets(
                        extractAssets(
                            renderSass(
                                new NamedState(STATE_NAME_INITIAL, [
                                    {
                                        type: ARTIFACT_TYPE_SASS,
                                        name: resolve(entry),
                                        data: null,
                                        map: null
                                    }
                                ])
                            )
                        )
                    )
                )
            ).then((state) => {
                // let's grab dependencies
                let dependencies: Array<string> = [];
                let sourceMaps: Array<Buffer> = [];

                for (let artifact of state.artifacts) {
                    let sourceMap = artifact.map;

                    if (sourceMap) {
                        sourceMaps.push(sourceMap);
                    }
                }

                return Promise.all(sourceMaps.map((sourceMap) => {
                    return new SourceMapConsumer(sourceMap.toString()).then((consumer) => {
                        dependencies = dependencies.concat(consumer.sources);
                    });
                })).then(() => {
                    if (watchers.has(entry)) {
                        watchers.get(entry).close();
                    }

                    const watcher = new Gaze(dependencies) as Gaze & {
                        on: (event: "changed", listener: (filePath: string) => void) => void
                    };

                    watchers.set(entry, watcher);

                    watcher.on("changed", () => {
                        return w();
                    });

                    return;
                });
            });
        };

        return w();
    }
};

const write2: Transform = state => write({
    error: ARTIFACT_TYPE_ERROR
})()(state).then(state => {
    return new NamedState(Symbol('Write state'), state.artifacts);
});

const renderSass: Transform = state => render({
    sass: ARTIFACT_TYPE_SASS,
    error: ARTIFACT_TYPE_ERROR,
    asset: ARTIFACT_TYPE_ASSET,
    stylesheet: ARTIFACT_TYPE_CSS
})({
    outputStyle: "expanded"
})(state).then(state => {
    return new NamedState(STATE_NAME_SASS, state.artifacts);
});

const rebaseAssets: Transform = state => rebase({
    asset: ARTIFACT_TYPE_ASSET,
    stylesheet: ARTIFACT_TYPE_CSS
})()(state).then(state => {
    return new NamedState(STATE_NAME_SASS, state.artifacts);
});

const extractAssets: Transform = state => extract({
    asset: ARTIFACT_TYPE_ASSET,
    stylesheet: ARTIFACT_TYPE_CSS,
    error: ARTIFACT_TYPE_ERROR
})()(state).then(state => {
    return new NamedState(STATE_NAME_SASS, state.artifacts);
});
