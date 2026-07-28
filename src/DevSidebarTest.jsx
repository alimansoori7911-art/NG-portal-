// ⚠️⚠️⚠️ فایل موقت تست — بعد از اتمام تست کل این فایل را حذف کنید ⚠️⚠️⚠️
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import Sidebar from './modules/dashboard/components/Sidebar/Sidebar'
import { ORG_MENU_ITEMS } from './modules/dashboard/organization/constants/menuItems'

export default function DevSidebarTest() {
    // کاربر قلابی برای دیدن حالت لاگین‌شده بدون نیاز به بک‌اند
    useEffect(() => {
        useAuthStore.setState({
            status: 'authenticated',
            user: {
                roles: ['org_admin'],
                created_at: new Date().toISOString(),
                identifiers: [
                    { type: 'username', value: 'سینا بی مثل' },
                    { type: 'email', value: 'sina@example.com' },
                    { type: 'phone_number', value: '09937791943' },
                ],
            },
        })
    }, [])

    return (
        <div
            style={{
                display: 'flex',
                gap: 24,
                height: '100vh',
                padding: 12,
                background: '#000814',
            }}
        >
            {/* در RTL اولین فرزند سمت راست می‌نشیند */}
            <Sidebar items={ORG_MENU_ITEMS} defaultActive="tickets" />

            <main
                style={{
                    flex: 1,
                    border: '1px dashed #203A60',
                    borderRadius: 20,
                    display: 'grid',
                    placeItems: 'center',
                    color: '#335C99',
                }}
            >
                محل محتوای داشبورد
            </main>
        </div>
    )
}