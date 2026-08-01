import { useEffect, useState } from 'react'
import styles from './FitScreen.module.css'

/**
 * بوم ثابت با مقیاس خودکار.
 *
 * مشکلی که حل می‌کند: طرح فیگما برای فریم ۱۴۴۰×۱۰۲۴ است، ولی مانیتورها
 * ابعاد مختلف دارند. اگر هر عدد را جدا با calc مقیاس بدهیم، شکننده می‌شود
 * و روی هر نمایشگر نتیجه‌ی متفاوتی می‌دهد.
 *
 * راه‌حل: بچه‌ها با اعداد خام فیگما نوشته می‌شوند (بدون calc)، و کل بوم
 * با یک transform: scale به اندازه‌ی پنجره درمی‌آید. نتیجه روی هر
 * نمایشگری از نظر نسبت‌ها دقیقاً عین فیگماست و هرگز اسکرول نمی‌خورد.
 *
 * بوم همیشه دقیقاً اندازه‌ی پنجره است؛ در واحدهای طراحی حداقل
 * ۱۴۴۰×۱۰۲۴ و در نمایشگرهای با نسبت متفاوت، بزرگ‌تر. یعنی محتوای
 * تمام‌عرض (هدر، نوار مراحل) کشیده می‌شود و محتوای وسط‌چین وسط می‌ماند.
 */

const DESIGN_WIDTH = 1440
const DESIGN_HEIGHT = 1024

/* زیر این عرض، مقیاس‌دهی معنا ندارد و چیدمان موبایل جایگزین می‌شود */
const MOBILE_BREAKPOINT = 1024

function readViewport() {
    if (typeof window === 'undefined') {
        return { scale: 1, width: DESIGN_WIDTH, height: DESIGN_HEIGHT, mobile: false }
    }

    const vw = window.innerWidth
    const vh = window.innerHeight

    if (vw < MOBILE_BREAKPOINT) {
        return { scale: 1, width: vw, height: vh, mobile: true }
    }

    const scale = Math.min(vw / DESIGN_WIDTH, vh / DESIGN_HEIGHT)

    return {
        scale,
        /* ابعاد بوم در واحد طراحی — همیشه دقیقاً پنجره را پر می‌کند */
        width: vw / scale,
        height: vh / scale,
        mobile: false,
    }
}

export default function FitScreen({ children, className = '' }) {
    /* مقدار اولیه با lazy initializer تا setState داخل افکت لازم نشود */
    const [view, setView] = useState(readViewport)

    useEffect(() => {
        const onResize = () => setView(readViewport())
        window.addEventListener('resize', onResize)
        window.addEventListener('orientationchange', onResize)
        return () => {
            window.removeEventListener('resize', onResize)
            window.removeEventListener('orientationchange', onResize)
        }
    }, [])

    if (view.mobile) {
        return <div className={`${styles.mobile} ${className}`}>{children}</div>
    }

    return (
        <div className={styles.viewport}>
            <div
                className={`${styles.canvas} ${className}`}
                style={{
                    width: `${view.width}px`,
                    height: `${view.height}px`,
                    transform: `scale(${view.scale})`,
                }}
            >
                {children}
            </div>
        </div>
    )
}