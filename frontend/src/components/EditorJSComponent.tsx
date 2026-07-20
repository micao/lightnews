import React, { useEffect, useRef } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Table from '@editorjs/table';
import Quote from '@editorjs/quote';
import Underline from '@editorjs/underline';
import Marker from '@editorjs/marker';
import InlineCode from '@editorjs/inline-code';
import { type EditorBlock } from '../utils/editorHtmlConverter';

// 修复 @editorjs/list v2 在粘贴单条 <li> 时产生空列表的 Bug。
// 插件原生 pasteHandler 期望传入 UL/OL 容器并查询 ":scope > li"，
// 如果粘贴的是单个 <li>，查询就会返回空数组。这里我们动态将其包裹在虚拟的 <ul> 中处理。
if (List && List.prototype && typeof List.prototype.pasteHandler === 'function') {
  const originalPasteHandler = List.prototype.pasteHandler;
  List.prototype.pasteHandler = function (element: any) {
    if (element && element.tagName === 'LI') {
      const dummyUl = document.createElement('ul');
      const clonedLi = element.cloneNode(true);
      dummyUl.appendChild(clonedLi);
      return originalPasteHandler.call(this, dummyUl);
    }
    return originalPasteHandler.call(this, element);
  };
}

interface EditorJSComponentProps {
  holder: string;
  data: EditorBlock[];
  onChange: (blocks: EditorBlock[]) => void;
  placeholder?: string;
}

export const EditorJSComponent: React.FC<EditorJSComponentProps> = ({
  holder,
  data,
  onChange,
  placeholder = '开始输入精彩的科技创投分析...'
}) => {
  const editorRef = useRef<EditorJS | null>(null);
  const isInitialized = useRef<boolean>(false);
  const lastRenderedData = useRef<string>('');

  useEffect(() => {
    if (isInitialized.current) return;

    let destroyed = false;
    let checkInterval: any = null;

    const initEditor = () => {
      const container = document.getElementById(holder);
      if (!container) {
        // 如果 DOM 节点因 MUI Dialog 动画等原因暂未挂载，100ms 后重试
        checkInterval = setTimeout(initEditor, 100);
        return;
      }

      if (destroyed) return;

      try {
        // 清空容器，防止 React 重复挂载或 StrictMode 导致实例化多个编辑器出现内容重复
        container.innerHTML = '';
        const editor = new EditorJS({
          holder: holder,
          placeholder: placeholder,
          tools: {
            header: {
              class: Header as any,
              inlineToolbar: ['link', 'bold', 'italic', 'underline', 'marker'],
              config: {
                placeholder: '输入标题...',
                levels: [2, 3, 4],
                defaultLevel: 2
              }
            },
            list: {
              class: List as any,
              inlineToolbar: true,
              config: {
                defaultStyle: 'unordered'
              }
            },
            table: {
              class: Table as any,
              inlineToolbar: true
            },
            quote: {
              class: Quote as any,
              inlineToolbar: true,
              config: {
                quotePlaceholder: '输入引用内容...',
                captionPlaceholder: '作者/来源...'
              }
            },
            underline: Underline as any,
            marker: Marker as any,
            inlineCode: InlineCode as any
          },
          data: {
            blocks: data
          },
          async onChange(api) {
            try {
              const savedData = await api.saver.save();
              lastRenderedData.current = JSON.stringify(savedData.blocks);
              onChange(savedData.blocks as EditorBlock[]);
            } catch (err) {
              console.error('EditorJS save error:', err);
            }
          }
        });

        editorRef.current = editor;
        isInitialized.current = true;
        lastRenderedData.current = JSON.stringify(data);
      } catch (err) {
        console.error('Failed to instantiate EditorJS:', err);
      }
    };

    initEditor();

    return () => {
      destroyed = true;
      if (checkInterval) {
        clearTimeout(checkInterval);
      }
      if (editorRef.current) {
        const editor = editorRef.current;
        editorRef.current = null;
        isInitialized.current = false;

        // 只有在编辑器就绪后才执行销毁，防止初始化未完成时销毁失败导致 DOM 残留
        if (typeof editor.destroy === 'function') {
          editor.isReady
            .then(() => {
              try {
                editor.destroy();
              } catch (e) {
                console.warn('Error during editor.destroy:', e);
              }
            })
            .catch((e) => {
              console.warn('Editor isReady failed during destroy:', e);
              // 如果就绪失败，也强制尝试一次销毁
              try {
                editor.destroy();
              } catch (err) {
                console.warn('Second attempt editor.destroy failed:', err);
              }
            });
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holder]);

  // 监听外部传入的数据变化（例如：打开了不同的文章进行编辑）
  useEffect(() => {
    const updateEditorData = async () => {
      const editor = editorRef.current;
      if (!editor || !isInitialized.current) return;

      try {
        await editor.isReady;
        const currentDataStr = JSON.stringify(data);
        // 如果新传入的块结构不同于上一次渲染的数据，执行重绘
        if (currentDataStr !== lastRenderedData.current) {
          await editor.render({
            blocks: data
          });
          lastRenderedData.current = currentDataStr;
        }
      } catch (err) {
        console.warn('EditorJS render update skipped/failed:', err);
      }
    };

    updateEditorData();
  }, [data]);

  return (
    <div
      id={holder}
      style={{
        width: '100%',
        minHeight: '320px',
        border: '1px solid #334155',
        borderRadius: '6px',
        padding: '16px 24px',
        backgroundColor: '#080c14',
        color: '#f8fafc',
        outline: 'none',
        overflowY: 'auto'
      }}
    />
  );
};

