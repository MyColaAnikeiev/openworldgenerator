import styles from './labeled-button.module.scss'

type Props = {
  labelText: string,
  buttonText: string,
  action: () => void
}

/**
 * React Component for sylized pair of text and button.
 * 
 * props attributes:
 * 
 *  `labelText` - Label text.
 *  
 *  `buttonText` - Text on button element.
 * 
 *  `action` - function to call when button is clicked.
 */
export function LabeledButton(props: Props){
  
  return (
    <div className={styles['container']}>
      <p className={styles['labelText']}>{props.labelText}</p>
      <button onClick={props.action}>{props.buttonText}</button>
    </div>
  )
}