import { useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Code,
    Heading1,
    Heading2,
    List,
    ListOrdered,
    Quote,
    Link2,
    Unlink,
    ImagePlus,
    Palette,
    Undo2,
    Redo2,
    RemoveFormatting,
} from 'lucide-react'
import styles from './RichTextEditor.module.css'

/* دکمه‌ی نوار ابزار.

   بیرون از کامپوننت تعریف شده: تعریف داخل render هر بار یک نوع
   کامپوننت تازه می‌سازد و React درخت را دور می‌ریزد. */
function Btn({ onClick, active, title, disabled, children }) {
    return (
        <button
            type="button"
            className={`${styles.btn} ${active ? styles.btnActive : ''}`}
            onClick={onClick}
            title={title}
            aria-label={title}
            aria-pressed={active || undefined}
            disabled={disabled}
        >
            {children}
        </button>
    )
}

/**
 * ویرایشگر متن غنی — روی TipTap.
 *
 * خروجی HTML است چون `CmsPageCreate.content_format` مقدار `HTML` را
 * می‌پذیرد و برخلاف Markdown، رنگ متن و تصویرِ نام‌دار را می‌شود در آن
 * نگه داشت (خواسته‌ی بندهای ۱.۳ و ۱.۴).
 *
 * ⚠️ این ویرایشگر فقط ساختار و قالب می‌دهد؛ **پاک‌سازی HTML کار
 * بک‌اند است**. هر چیزی که اینجا تولید می‌شود قبل از نمایش عمومی
 * باید سمت سرور sanitize شود.
 */
export default function RichTextEditor({
    value = '',
    onChange,
    placeholder = 'متن را اینجا بنویسید…',
    error = false,
    disabled = false,
}) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                /* لینک جدا پیکربندی می‌شود تا `openOnClick` خاموش باشد */
                link: false,
            }),
            Underline,
            TextStyle,
            Color,
            Image.configure({ inline: false, allowBase64: false }),
            Link.configure({
                openOnClick: false,
                autolink: true,
                HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
            }),
        ],
        content: value,
        editable: !disabled,
        editorProps: {
            attributes: {
                /* جهت راست‌به‌چپ پیش‌فرض است چون محتوا فارسی است */
                dir: 'rtl',
                'data-placeholder': placeholder,
            },
        },
        onUpdate: ({ editor }) => {
            /* ویرایشگر خالی `<p></p>` می‌دهد نه رشته‌ی خالی؛ آن را
               به '' تبدیل می‌کنیم تا اعتبارسنجیِ «خالی نباشد» کار کند. */
            const html = editor.getHTML()
            onChange?.(html === '<p></p>' ? '' : html)
        },
    })

    const addImage = useCallback(() => {
        const url = window.prompt('نشانی تصویر:')
        if (!url) return
        const alt = window.prompt('توضیح تصویر (برای دسترس‌پذیری):') ?? ''
        editor?.chain().focus().setImage({ src: url, alt }).run()
    }, [editor])

    const toggleLink = useCallback(() => {
        if (editor?.isActive('link')) {
            editor.chain().focus().unsetLink().run()
            return
        }
        const url = window.prompt('نشانی لینک:')
        if (!url) return
        editor?.chain().focus().setLink({ href: url }).run()
    }, [editor])

    if (!editor) return null

    const currentColor = editor.getAttributes('textStyle').color || '#E0EDFF'

    return (
        <div className={`${styles.wrapper} ${error ? styles.error : ''}`}>
            {/* کل نوار با یک fieldset غیرفعال می‌شود تا هر دکمه‌ی
                تازه‌ای هم خودبه‌خود حالت غیرفعال را بگیرد. */}
            <fieldset
                className={styles.toolbar}
                disabled={disabled}
                role="toolbar"
                aria-label="ابزار قالب‌بندی"
            >
                <div className={styles.group}>
                    <Btn
                        title="درشت"
                        active={editor.isActive('bold')}
                        onClick={() => editor.chain().focus().toggleBold().run()}
                    >
                        <Bold size={15} />
                    </Btn>
                    <Btn
                        title="کج"
                        active={editor.isActive('italic')}
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                    >
                        <Italic size={15} />
                    </Btn>
                    <Btn
                        title="زیرخط"
                        active={editor.isActive('underline')}
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                    >
                        <UnderlineIcon size={15} />
                    </Btn>
                    <Btn
                        title="خط‌خورده"
                        active={editor.isActive('strike')}
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                    >
                        <Strikethrough size={15} />
                    </Btn>
                    <Btn
                        title="کد درون‌خطی"
                        active={editor.isActive('code')}
                        onClick={() => editor.chain().focus().toggleCode().run()}
                    >
                        <Code size={15} />
                    </Btn>
                </div>

                <span className={styles.sep} />

                {/* رنگ متن انتخاب‌شده — خواسته‌ی بند ۱.۳ */}
                <div className={styles.colorWrap} title="رنگ متن">
                    <Palette size={15} className={styles.colorIcon} />
                    <span
                        className={styles.colorBar}
                        style={{ background: currentColor }}
                    />
                    <input
                        type="color"
                        className={styles.colorInput}
                        value={currentColor}
                        onChange={(e) =>
                            editor.chain().focus().setColor(e.target.value).run()
                        }
                        disabled={disabled}
                        aria-label="رنگ متن"
                    />
                </div>

                <Btn
                    title="حذف قالب‌بندی"
                    onClick={() =>
                        editor.chain().focus().unsetAllMarks().unsetColor().run()
                    }
                >
                    <RemoveFormatting size={15} />
                </Btn>

                <span className={styles.sep} />

                <div className={styles.group}>
                    <Btn
                        title="عنوان ۱"
                        active={editor.isActive('heading', { level: 1 })}
                        onClick={() =>
                            editor.chain().focus().toggleHeading({ level: 1 }).run()
                        }
                    >
                        <Heading1 size={15} />
                    </Btn>
                    <Btn
                        title="عنوان ۲"
                        active={editor.isActive('heading', { level: 2 })}
                        onClick={() =>
                            editor.chain().focus().toggleHeading({ level: 2 }).run()
                        }
                    >
                        <Heading2 size={15} />
                    </Btn>
                    <Btn
                        title="فهرست نقطه‌ای"
                        active={editor.isActive('bulletList')}
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                    >
                        <List size={15} />
                    </Btn>
                    <Btn
                        title="فهرست شماره‌دار"
                        active={editor.isActive('orderedList')}
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    >
                        <ListOrdered size={15} />
                    </Btn>
                    <Btn
                        title="نقل‌قول"
                        active={editor.isActive('blockquote')}
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    >
                        <Quote size={15} />
                    </Btn>
                </div>

                <span className={styles.sep} />

                <div className={styles.group}>
                    <Btn
                        title={editor.isActive('link') ? 'حذف لینک' : 'افزودن لینک'}
                        active={editor.isActive('link')}
                        onClick={toggleLink}
                    >
                        {editor.isActive('link') ? (
                            <Unlink size={15} />
                        ) : (
                            <Link2 size={15} />
                        )}
                    </Btn>
                    <Btn title="افزودن تصویر" onClick={addImage}>
                        <ImagePlus size={15} />
                    </Btn>
                </div>

                <span className={styles.sep} />

                <div className={styles.group}>
                    <Btn
                        title="واگرد"
                        onClick={() => editor.chain().focus().undo().run()}
                        disabled={!editor.can().undo()}
                    >
                        <Undo2 size={15} />
                    </Btn>
                    <Btn
                        title="ازنو"
                        onClick={() => editor.chain().focus().redo().run()}
                        disabled={!editor.can().redo()}
                    >
                        <Redo2 size={15} />
                    </Btn>
                </div>
            </fieldset>

            <EditorContent editor={editor} className={styles.editor} />
        </div>
    )
}
