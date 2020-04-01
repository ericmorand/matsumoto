import {render} from "./lib/vendor/sass";
import {Artifact, State} from "./lib/vendor/Artifact";
import {SourceMapConsumer} from "source-map";
import {resolve} from "path";
import {write} from "./lib/output";
import {
    ARTIFACT_TYPE_ASSET,
    ARTIFACT_TYPE_CSS,
    ARTIFACT_TYPE_ERROR,
    STATE_NAME_SASS,
    STATE_NAME_INITIAL, ARTIFACT_TYPE_SASS
} from "./lib/vendor/Symbols";
import {Transform} from "./lib/vendor/Transform";
import {extract, rebase} from "./lib/vendor/stylesheet-assets";

let entry = 'test/Product/Thumbnail/index.scss';

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
})()(state).then(state => {
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

class NamedState extends State {
    private readonly _name: symbol;

    constructor(name: symbol, artifacts: Array<Artifact>) {
        super(artifacts);

        this._name = name;
    }
}

let initialState = new NamedState(STATE_NAME_INITIAL, [
    {
        type: ARTIFACT_TYPE_SASS,
        name: resolve(entry),
        data: null,
        map: null
    }
]);

write2(
    rebaseAssets(
        extractAssets(
            renderSass(
                initialState
            )
        )
    )
).then((state) => {
    // console.warn(state);

    for (let a of state.artifacts) {
        if (a.map) {
            let consumer = new SourceMapConsumer(a.map.toString()).then((c) => {
                c.eachMapping((m) => {
                    //console.warn(m);
                });
            });
        }

        if (a.type === ARTIFACT_TYPE_ERROR) {
            console.error(a.data.toString());
        }
    }

    console.warn(state);

});