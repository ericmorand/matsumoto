import {readdir, stat} from "fs";
import {join, resolve as resolvePath} from "path";
import {Component} from "./component";

export type ComponentManifest = { name: string, title: string };
export type ComponentManifestProvider = () => ComponentManifest;

export const processDirectory = (directory: string, manifest: string): Promise<Array<Component>> => {
    const readDirectory = (directory: string): Promise<Array<string>> => {
        return new Promise((resolve) => {
            readdir(directory, (err, files) => {
                if (err) {
                    resolve([]);
                } else {
                    resolve(files);
                }
            });
        });
    };

    const isDirectory = (candidate: string): Promise<boolean> => {
        return new Promise((resolve) => {
            stat(candidate, (err, stats) => {
                if (err) {
                    resolve(false);
                } else {
                    resolve(stats.isDirectory());
                }
            });
        });
    };

    const resolveComponentPaths = (directory: string): Promise<Array<string>> => {
        let componentPaths: Array<string> = [];

        return readDirectory(directory)
            .then((files) => {
                return Promise.all(files.map((file) => {
                    let filePath = resolvePath(join(directory, file));

                    return isDirectory(filePath)
                        .then((isDirectory) => {
                            if (isDirectory) {
                                return resolveComponentPaths(filePath).then((paths) => {
                                    componentPaths = componentPaths.concat(paths);
                                });
                            } else if (file === manifest) {
                                componentPaths.push(filePath);
                            }
                        });
                })).then(() => {
                    return componentPaths;
                });
            });
    };

    return resolveComponentPaths(directory)
        .then((componentPaths) => {
            return Promise.all(componentPaths.map((componentPath) => {
                return new Promise<Component>((resolve) => {
                    try {
                        let module = require.resolve(componentPath);
                        let componentManifestProvider: ComponentManifestProvider = require(module);

                        return Promise.resolve(componentManifestProvider())
                            .then((manifest) => {
                                resolve(new Component(manifest.name, componentPath, manifest.title));
                            });
                    } catch (e) {
                        // noop
                    }
                });
            }));
        });
};
