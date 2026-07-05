import styles from './Clients.module.css'
import clientsImage from '../../../../assets/images/logo/sec6.png'

function Clients() {
    return (
        <section className={styles.section}>

            <div className={styles.logosWrapper}>
                <img src={clientsImage} alt="مشتریان ما" className={styles.clientsImg} />
            </div>
        </section>
    )
}

export default Clients