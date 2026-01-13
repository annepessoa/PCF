import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { Comparator, Labeler, getComparatorAndLabeler } from "./comparers";
import { parseDate, parseNumber } from "./utils";

export class FieldComparer implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _container: HTMLDivElement | null = null;
    private _icon: HTMLSpanElement | null = null;
    private _label: HTMLSpanElement | null = null;
    private _notifyOutputChanged: (() => void) | null = null;
    private _comparisonResult: string | undefined;
    
    constructor() {
        // Empty
    }

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
     */
    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        this._notifyOutputChanged = notifyOutputChanged;

        // Create UI elements
        this._container = document.createElement("div");
        this._container.className = "container neutral";

        this._icon = document.createElement("span");
        this._icon.setAttribute("role", "img");
        this._icon.className = "icon";

        this._label = document.createElement("span");
        this._label.className = "label";

        this._container.appendChild(this._icon);
        this._container.appendChild(this._label);

        container.appendChild(this._container);
    }

    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        const firstRaw = context.parameters.firstDate && context.parameters.firstDate.raw;
        const secondRaw = context.parameters.secondDate && context.parameters.secondDate.raw;

        const firstLabel = context.parameters.firstLabel && context.parameters.firstLabel.raw;
        const secondLabel = context.parameters.secondLabel && context.parameters.secondLabel.raw;
        const comparisonModeRaw = context.parameters.comparisonMode && context.parameters.comparisonMode.raw;

        const showIcons = !!(context.parameters.showIcons && context.parameters.showIcons.raw);
        const saveEnabled = !!(context.parameters.saveResult && context.parameters.saveResult.raw);

        const firstNumRaw = context.parameters.firstNumber && context.parameters.firstNumber.raw;
        const secondNumRaw = context.parameters.secondNumber && context.parameters.secondNumber.raw;

    const firstDate = parseDate(firstRaw);
    const secondDate = parseDate(secondRaw);
    const firstNumber = parseNumber(firstNumRaw);
    const secondNumber = parseNumber(secondNumRaw);


        // Choose data type: first dates, then numbers
        if (firstDate || secondDate) {
            const { comparator: dateComparator, labeler: dateLabeler } = getComparatorAndLabeler("date");
            this.processComparison<Date>(comparisonModeRaw, dateComparator, dateLabeler, firstDate, secondDate, firstLabel, secondLabel, showIcons, "Missing date(s)", saveEnabled);
            return;
        }

        if (firstNumber !== null || secondNumber !== null) {
            const { comparator: numComparator, labeler: numLabeler } = getComparatorAndLabeler("number");
            this.processComparison<number>(comparisonModeRaw, numComparator, numLabeler, firstNumber, secondNumber, firstLabel, secondLabel, showIcons, "Missing number(s)", saveEnabled);
            return;
        }

        // nothing found
        const missingLabel = "Missing inputs";
        const emoji = "—";
        this.setUIState(emoji, missingLabel, showIcons);
        this.saveResultIfRequested(saveEnabled, missingLabel);
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as "bound" or "output"
     */
    public getOutputs(): IOutputs {
        return {
            result: this._comparisonResult
        };
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void {
        if (this._container && this._container.parentElement) {
            this._container.parentElement.removeChild(this._container);
        }
    }

    //Set UI state 
    private setUIState(emoji: string, labelText: string, showIcons: boolean): void {
        if (!this._icon || !this._label || !this._container) return;
        if (showIcons) {
            this._icon.textContent = emoji;
        } else {
            // clear icon when icons are disabled
            this._icon.textContent = "";
        }
        this._label.textContent = labelText;

        // reset any state classes and apply the one we want (global classes)
        this._container.classList.remove("pass", "fail", "neutral");
        if (emoji === "✅") {
            this._container.classList.add("pass");
        } else if (emoji === "❌") {
            this._container.classList.add("fail");
        } else {
            this._container.classList.add("neutral");
        }
    }

    /**
     * Optionally save the result string into the bound result output.
     */
    private saveResultIfRequested(saveEnabled: boolean, labelText: string | null): void {
        if (!saveEnabled) {
            return; // user chose not to persist result
        }

        const newVal = labelText ?? "";
        if (newVal !== this._comparisonResult) {
            this._comparisonResult = newVal;
            if (this._notifyOutputChanged) {
                this._notifyOutputChanged();
            }
        }
    }

    /**
     * Generic helper to run a comparator/labeler and update UI + outputs.
     */
    private processComparison<T>(
        modeRaw: string | null,
        comparator: Comparator<T>,
        labeler: Labeler<T>,
        firstValue: T | null,
        secondValue: T | null,
        firstLabel: string | null | undefined,
        secondLabel: string | null | undefined,
        showIcons: boolean,
        missingLabelBase: string,
        saveEnabled: boolean
    ): void {
        const compResult = comparator(modeRaw, firstValue, secondValue);
        if (compResult.passed === null) {
            const missingLabel = missingLabelBase;
            const emoji = "—";
            this.setUIState(emoji, missingLabel, showIcons);
            this.saveResultIfRequested(saveEnabled, missingLabel);
            return;
        }

        const labelText = labeler(modeRaw, firstLabel, secondLabel, compResult.passed!, compResult.usedSecondField);
        const emoji = compResult.passed ? "✅" : "❌";
        this.setUIState(emoji, labelText, showIcons);
        this.saveResultIfRequested(saveEnabled, labelText);
    }
}