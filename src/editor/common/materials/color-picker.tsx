import { Component, FormEvent } from "react";
import { ColorPickerPopup } from "./color-picker-popup";
import styles from "./color-picker.module.scss";
import { convertNumberColorToHex, isValidHexColor } from "./tools";

type Props = {
    initialHexColor: string | number,
    outputCallback: (hex: string) => void;
}

type State = {
    hexColor: string,
    inputCursorPos: number,
    colorPopup: boolean
}

/**
 * React Component that provides color input UI.
 * 
 * props attributes:
 * 
 *  `initialHexColor` is used once (subsequent props updates is ignored). You can provide it 
 *  as string in css hex color format or as a single number (best way is to use hexadecimal
 *  number furmat starting with 0x so red will be writen as 0xFF0000).
 * 
 *  `outputCallback` will be called on color changes with resulting css style hexcolor string.
 */
export class MColorPicker extends Component{

    props: Props;
    state: State;

    colorInputHandler: (evt: FormEvent) => void;
    popupToggleHandler: () => void;

    colorIndicatorRef: HTMLElement;
    inputRef: HTMLInputElement;
    inputCarretPosition = 1;

    constructor(props: Props){
        super(props);

        let hexColor:string = "#ffffff";
        if(typeof props.initialHexColor === "string"){
            if(props.initialHexColor.length === 6){
                const hexstr = "#" + props.initialHexColor
                if(isValidHexColor(hexstr)) {
                    hexColor = hexstr
                }
            }
            if(props.initialHexColor.length === 7){
                if(isValidHexColor(props.initialHexColor)){
                    hexColor = props.initialHexColor
                }
            }
        }else{
            if(props.initialHexColor > -1){
                hexColor = convertNumberColorToHex(props.initialHexColor)
            }
        }

        this.state = {
            hexColor,
            inputCursorPos: 1,
            colorPopup: false
        }

        this.colorInputHandler = this.handleColorInput.bind(this);
        this.popupToggleHandler = this.popupToggle.bind(this);
    }


    render(){
        const colorFrameStyle = {
            backgroundColor: this.state.hexColor
        }

        const setInputRef = (ref: HTMLInputElement | null) => {
            if(ref){
                this.inputRef = ref;
            }
        }
        const setColorIndicatorRef = (ref: HTMLElement | null) => {
            if(ref){
                this.colorIndicatorRef = ref;
            }
        }

        return (
            <div className={styles["color-picker"]}>
                <div 
                    ref={setColorIndicatorRef} 
                    className={styles["color-indicator"]}
                    onClick={this.popupToggleHandler}
                >
                    <div style={colorFrameStyle} className={styles["color"]}></div>
                </div>

                <div className={styles["color-input"]}>
                    <input 
                        ref={setInputRef}
                        type="text" 
                        value={this.state.hexColor} 
                        onInput={this.colorInputHandler}
                    />
                </div>

                { this.getPopupPicker() }
            </div>
        )
    }

    getPopupPicker(): JSX.Element{
        if(!this.state.colorPopup || !this.colorIndicatorRef){
            return null
        }

        const update = (color: string) => {
            this.setState({hexColor: color});
            this.props.outputCallback(color);
        }

        const {top, left} = this.getColorPickerPopupPosition();

        return (
            <ColorPickerPopup 
                positionX={left} 
                positionY={top}
                hexColor={this.state.hexColor}
                updateCallback={update}
            />
        )
    }


    getColorPickerPopupPosition(){
        if(!this.colorIndicatorRef){
            return {top: 32, right: 0}
        }

        const popupWidth = 300;
        const popupHeight = 200;

        const {left: iLeft, top: iTop, bottom: iBottom} = this.colorIndicatorRef.getBoundingClientRect();
        const wWidth =  globalThis.window.innerWidth;
        const wHeight = globalThis.window.innerHeight; 

        let y = iBottom - iTop;
        // If can't fit under indicator then place above it.
        if(wHeight - iBottom < popupHeight){
            y = -popupHeight;
        }

        let x = 0;
        // If to the right there is not enough space then move it to the left so
        // right side of popup element will alight with screen right. 
        if(wWidth - iLeft < popupWidth){
            x = (wWidth - iLeft) - popupWidth;
        }

        return {top: y, left: x}
    }

    componentDidUpdate(): void{
        // Prevents carret jumping whem controlled input value updates.
        if(this.inputRef){
            this.inputRef.selectionStart = this.inputCarretPosition;
            this.inputRef.selectionEnd = this.inputCarretPosition;
        }
    }

    popupToggle(){
        this.setState((state: State) => {
            return {colorPopup: !state.colorPopup}
        })
    }

    // Keeps input element in valid hexColor format when editing.
    handleColorInput(evt: FormEvent): void{
        const target = evt.target as HTMLInputElement;
        const {value} = target;
        const insertPoint = target.selectionStart;

        this.inputCarretPosition = insertPoint;

        // Need to call componentDidUpdate() anyway.
        this.setState({});

        if(value.length < 7){
            return;
        }

        if(value.length === 7){
            if(isValidHexColor(value)){
                this.props.outputCallback(value)
                this.setState({ hexColor: value});
            }

            return;
        }

        const exceeding = value.length - 7;
        
        const replaced = value.slice(0, insertPoint) + value.slice(insertPoint+exceeding);
        if(isValidHexColor(replaced)){
            this.props.outputCallback(replaced)
            this.setState({ hexColor: replaced });
        }
    }

}