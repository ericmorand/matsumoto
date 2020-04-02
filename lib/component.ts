export class Component {
    private readonly _name: string;
    private readonly _path: string;
    private readonly _title: string;

    constructor(name: string, path: string, title: string) {
        this._name = name;
        this._path = path;
        this._title = title;
    }

    get name(): string {
        return this._name;
    }

    get path(): string {
        return this._path;
    }

    get title(): string {
        return this._title;
    }
}