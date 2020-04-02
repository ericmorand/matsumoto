import {State} from "./vendor/State";
import {Artifact} from "./vendor/Artifact";

export class NamedState extends State {
    private readonly _name: symbol;

    constructor(name: symbol, artifacts: Array<Artifact>) {
        super(artifacts);

        this._name = name;
    }

    get name(): symbol {
        return this._name;
    }
}