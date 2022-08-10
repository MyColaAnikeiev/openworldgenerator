import styles from './error-text.module.scss'

type Props = {
  text: string
}

export function ErrorText(props: Props){
  return (
    <div className={styles["container"]}>
      <p>{props.text}</p>
    </div>
  )
}