import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Label } from './label';

interface RichTextEditorProps {
    value: string;
    onChange: (content: string) => void;
    label?: string;
    id?: string;
}

const RichTextEditor = ({ value, onChange, label, id }: RichTextEditorProps) => {
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'script': 'sub' }, { 'script': 'super' }],
            ['blockquote', 'code-block'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'indent': '-1' }, { 'indent': '+1' }, { 'direction': 'rtl' }],
            [{ 'align': [] }],
            ['link', 'image', 'video'],
            ['clean']
        ],
    };

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'color', 'background',
        'script',
        'blockquote', 'code-block',
        'list', 'bullet', 'indent',
        'direction', 'align',
        'link', 'image', 'video'
    ];

    return (
        <div className="space-y-2">
            {label && <Label htmlFor={id}>{label}</Label>}
            <div className="bg-background rounded-md border border-input min-h-[300px]">
                <ReactQuill
                    theme="snow"
                    value={value}
                    onChange={onChange}
                    modules={modules}
                    formats={formats}
                    className="h-full"
                />
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
                .ql-editor {
                    min-height: 250px;
                    font-size: 16px;
                }
                .ql-toolbar.ql-snow {
                    border: none;
                    border-bottom: 1px solid hsl(var(--input));
                    background: hsl(var(--muted) / 0.5);
                    border-top-left-radius: calc(var(--radius) - 2px);
                    border-top-right-radius: calc(var(--radius) - 2px);
                }
                .ql-container.ql-snow {
                    border: none;
                }
                .dark .ql-snow .ql-stroke {
                    stroke: hsl(var(--foreground));
                }
                .dark .ql-snow .ql-fill {
                    fill: hsl(var(--foreground));
                }
                .dark .ql-snow .ql-picker {
                    color: hsl(var(--foreground));
                }
                .dark .ql-snow .ql-picker-options {
                    background-color: hsl(var(--card));
                    border-color: hsl(var(--border));
                }
            `}} />
        </div>
    );
};

export default RichTextEditor;
