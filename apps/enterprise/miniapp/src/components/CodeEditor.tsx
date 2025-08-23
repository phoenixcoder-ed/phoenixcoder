import React, { useState, useEffect } from 'react';
import './CodeEditor.scss';

interface CodeEditorProps {
    _value?: string;
    onChange?: (_value: string) => void;
    language?: string;
    placeholder?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
    _value,
    onChange,
    language = 'javascript',
    placeholder = '请输入代码...',
}) => {
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        // 模拟代码高亮逻辑
        const highlightCode = () => {
            // 实际项目中可以使用如Prism、highlight.js等库
            console.log('代码高亮逻辑处理');
        };

        highlightCode();
    }, [_value, language]);

    return (
        <div className={`code-editor ${isFocused ? 'focused' : ''}`}>
            <div className="code-editor-header">
                <span className="language-tag">{language}</span>
            </div>
            <textarea
                className="code-editor-content"
                value={_value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                spellCheck="false"
                wrap="off"
            />
        </div>
    );
};

export default CodeEditor;
