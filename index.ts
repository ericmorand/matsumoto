import { render, ARTIFACT_TYPE_SASS_FILE, ARTIFACT_TYPE_SASS_DATA } from "./lib/sass";
import { ArtifactCollection, ARTIFACT_TYPE_ERROR } from "./lib/State";
import { SourceMapConsumer } from "source-map";
import { readFileSync } from "fs";
import { resolve } from "path";

let entry = 'test/Product/Thumbnail/index.scss';
let data = readFileSync(entry);

render({
    artifacts: new ArtifactCollection([
        {
            type: ARTIFACT_TYPE_SASS_FILE,
            name: resolve(entry),
            data: data,
            map: null
        }
    ])
}).then((state) => {
    for (let a of state.artifacts.artifacts) {
        if (a.map) {
            let consumer = new SourceMapConsumer(a.map.toString()).then((c) => {
                c.eachMapping((m) => {
                    console.warn(m);
                });
            });
        }

        console.warn(a.data.toString());
    }
});