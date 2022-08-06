import { ChangeEvent, Component, FormEvent, FormEventHandler, ReactNode } from 'react';
import { debounceTime, Observable, Subject } from 'rxjs';

import styles from './labeled-string-input.module.scss'

type Props = {
  initialValue: string,
  labelText?: string,
  debounceTime?: number,
  outputCallback: (output: string) => void
}

type State = {
  currentValue: string
}

/**
 * Uncontrolable React component for string editing.
 * 
 * props attributes:
 * 
 *  `initialValue` - string to initialize input, all other props changes are ignored.
 * 
 *  `labelText` - optional input label.
 * 
 *  `debounceTime` - optional time delay for output callback.
 * 
 *  `outputCallback` - function to be called on debounced input.
 */
export class LabeledStringInput extends Component{
  props: Props
  state: State

  inputSubject: Subject<string> = new Subject()

  onInputHandler: FormEventHandler<HTMLInputElement>
  
  constructor(props: Props){
    super(props)

    this.state = {
      currentValue: props.initialValue
    }

    let outputObservable: Observable<string> = this.inputSubject
    if(this.props.debounceTime > 0){
      outputObservable = this.inputSubject.pipe(
        debounceTime(this.props.debounceTime)
      )
    }
    outputObservable.subscribe(str => this.props.outputCallback(str))

    this.onInputHandler = (evt: ChangeEvent<HTMLInputElement>) => {
      this.textInput(evt.currentTarget.value)
    }
  }
  
  render(): ReactNode {
    const clear = () => this.textInput("")

    return (
      <div className={styles["container"]}>

        {
          Boolean(this.props.labelText) &&
          <p className={styles["label"]}>{this.props.labelText}</p>
        }
        
        <div className={styles["input-container"]}>
          <input value={this.state.currentValue} onInput={this.onInputHandler} />
          <button onClick={clear}>Clear</button>
        </div>
        
      </div>
    )
  }

  textInput(str: string): void{
    this.inputSubject.next(str)
    this.setState({currentValue: str})
  }

  componentWillUnmount(): void {
    this.inputSubject.complete()
  }

}