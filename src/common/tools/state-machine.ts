/**
 * Describes single {@link SimpleStateMachine} transition.
 * 
 * `T` - is generic type parameter that takes in a string literal unions, where
 * each string literal is posible machine state.
 */
export interface  SimpleStateMachineTransition<T>{
  /** When using special symbol '\*', it means from all states. */
  fromState: string & T | '*',
  /** When using special symbol '\*', it means to all states. */
  toState: string & T | '*',
  /** To be called when this transition occurs. */
  callback?: () => void
}

/**
 * 
 * `T` - is generic type parameter that takes in a string literal unions, where
 * each string literal is posible machine state.
 */
export class SimpleStateMachine<T>{

  private _state: T & string

  /**
   * 
   * @param transitions - array of posible state transitions.
   * @param initialState - Initial state (is mandatory).
   */
  constructor(private transitions: SimpleStateMachineTransition<T>[], initialState: T & string){
    this._state = initialState
  }


  /**
   * Provided `state` will be set as new stateMachine state if such transition
   * from previous state is alowed, or error with be thrown if not. 
   */
  public setState(state: T & string): void{
    let transitionIndex: number;
    const transitionAlowed = this.transitions.some(trans => {
      const left = trans.fromState === '*' || trans.fromState === this._state
      if (!left) return
      const right = trans.toState === '*' || trans.toState === state

      if(trans.callback && left && right){
        trans.callback()
      }

      return left && right
    })

    if(!transitionAlowed){
      throw new Error(`Transition from "${this._state}" to "${state}" is not alowed.`)
    }

    this._state = state
    
  }

  /**
   * Indicate current state. When assigning a value, effect is the same as
   * calling {@link setState} with that value.
   */
  public get state (): T & string{
    return this._state
  }

  public set state (state: T & string) {
    this.setState(state)
  }
}