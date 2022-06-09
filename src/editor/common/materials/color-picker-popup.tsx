import * as React from "react";
import { Component } from "react";
import styles from "./color-picker-popup.module.scss"
import { MSlider } from "./slider";
import { convertFromHexToMColor, fromMColorParamsToHex } from "./tools";

type Props = {
    positionX: number,
    positionY: number,
    hexColor: string
    updateCallback: (hexColor: string) => void
}
type State = {
    lastHexColor: string,
    color: number,
    saturation: number,
    brightness: number
}

/**
 * React Component that provides popup color input UI.
 * 
 * props attributes:
 * 
 *  `positionX` is x coordinate of absoutely placed popup container element.
 * 
 *  `positionY` is y coordinate of absoutely placed popup container element.
 * 
 *  `hexColor` is css style hex color. Provides an initial color for this picker 
 *  component but also will reset color picker inner color with each hexColor update. 
 * 
 *  `outputCallback` will be called on color changes with resulting css style hexcolor string.
 */
export class ColorPickerPopup extends Component{

    props: Props;
    state: State;

    lastPropHexColor: string;
    currentHexColor: string;

    tmpNeedUpdate = false;

    changeColorParamCallback: (param: string, val: number) => void;

    constructor(props: Props){
        super(props);

        this.changeColorParamCallback = this.changeColorParameter.bind(this);

        this.lastPropHexColor = props.hexColor;
        this.currentHexColor = props.hexColor;
        this.state = {
            lastHexColor: props.hexColor,
            ...convertFromHexToMColor(props.hexColor)
        }
    }

    getSnapshotBeforeUpdate(){
        if(this.props.hexColor !== this.lastPropHexColor){
            this.lastPropHexColor = this.props.hexColor;

            if(this.props.hexColor !== this.currentHexColor){
                this.currentHexColor = this.props.hexColor;

                this.setState({
                    ...convertFromHexToMColor(this.props.hexColor)
                })
            }
        }
    }
    
    render(){
        const popupBodyStyles = {
            top: this.props.positionY.toFixed(0) + "px",
            left: this.props.positionX.toFixed(0) + "px"
        }
        const colorIndicatorStyle = {
            backgroundColor: this.currentHexColor
        }

        const colorParams = ["color","saturation", "brightness"];

        return (
            <div 
                className={styles["popup-picker-body"]}
                style={popupBodyStyles}
            >
                <div 
                    className={styles["popup-picker-color-indicator"]}
                    style={colorIndicatorStyle}
                ></div>
                
                {
                    colorParams.map(param => {
                        return (
                            <React.Fragment key={param}>
                                <label className={styles["label"]}>
                                    {param}:
                                </label>
                                <MSlider 
                                    value={this.state[param]} 
                                    outputCallback={((val: number) => this.changeColorParamCallback(param,val))} 
                                />
                            </React.Fragment>
                            )
                    })
                }

            </div>
        )
    }


    changeColorParameter(param: 'color' | 'saturation' | 'brightness' ,val: number){
        const hexColor = fromMColorParamsToHex({...this.state, [param]: val});
        this.currentHexColor = hexColor;

        this.setState({
            [param]: val
        })

        this.props.updateCallback(this.currentHexColor);
    }

}