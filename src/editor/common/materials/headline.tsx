import { ReactNode } from 'react'

import styles from './headline.module.scss'

type Props = {
  children: ReactNode,
  title?: string
}

/**
 * React Component for sylized headline.
 * 
 * props attributes:
 * 
 *  `children` - take text node or other react elements.
 * 
 *  `title` - description popup on mouse hover.
 */
export function Headline(props: Props){
  return (
    <p className={styles['headline']} {...props} />
  )
}