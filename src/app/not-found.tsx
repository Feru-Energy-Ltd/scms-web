import Link from 'next/link'
import styles from './not-found.module.css'
export default function NotFound () {
    return (
        <div className={styles.container}>
            <h1>404</h1>
            <p className={styles.message}>Yep, I tried hard but I can&apos;t find this page</p>
            <p>
                <Link href="/">Perhaps a fresh start?</Link>
            </p>
        </div>
    )
}