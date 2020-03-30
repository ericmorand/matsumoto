import { render, ARTIFACT_TYPE_SASS_FILE, ARTIFACT_TYPE_SASS_DATA } from "./lib/sass";
import { ARTIFACT_TYPE_ERROR, ArtifactCollection } from "./lib/Artifact";
import { SourceMapConsumer } from "source-map";
import { readFileSync } from "fs";
import { resolve } from "path";
import { write } from "./lib/output";

let entry = 'test/Product/Thumbnail/index.scss';
let data = readFileSync(entry);

write(
    render(new ArtifactCollection([
        {
            type: ARTIFACT_TYPE_SASS_FILE,
            name: resolve(entry),
            data: data,
            map: null
        }
    ]))
).then((state) => {
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

        //console.warn(a.data.toString());
    }
});