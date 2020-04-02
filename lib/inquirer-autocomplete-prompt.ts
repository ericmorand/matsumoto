import {Answers, InputQuestionOptions} from "inquirer";

export interface AutocompleteQuestionOptions<T extends Answers = Answers> extends InputQuestionOptions<T> {
    pageSize: number;
    source: (answers: string[], input: string) => Promise<string[]>
}

export interface AutocompleteQuestion<T extends Answers = Answers> extends AutocompleteQuestionOptions<T> {
    type: "autocomplete";
}

declare module "inquirer" {
    interface QuestionMap<T> {
        autocomplete: AutocompleteQuestion<T>;
    }
}

export const AutocompletePrompt = require('inquirer-autocomplete-prompt');