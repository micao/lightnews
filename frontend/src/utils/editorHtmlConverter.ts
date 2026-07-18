export interface EditorBlock {
  id?: string;
  type: string;
  data: {
    text?: string;
    level?: number;
    style?: 'ordered' | 'unordered';
    items?: string[];
    caption?: string;
    content?: string[][];
  };
}

/**
 * 将 Editor.js JSON Blocks 数组序列化为标准的 HTML 字符串存入 Django 数据库
 */
export function blocksToHtml(blocks: EditorBlock[]): string {
  if (!blocks || !Array.isArray(blocks)) return '';

  return blocks
    .map((block) => {
      switch (block.type) {
        case 'paragraph':
          return `<p>${block.data.text || ''}</p>`;
        case 'header':
          const level = block.data.level || 2;
          return `<h${level}>${block.data.text || ''}</h${level}>`;
        case 'list':
          const tag = block.data.style === 'ordered' ? 'ol' : 'ul';
          const items = (block.data.items || [])
            .map((item) => `<li>${item}</li>`)
            .join('');
          return `<${tag}>${items}</${tag}>`;
        case 'quote':
          const captionStr = block.data.caption ? `<cite>${block.data.caption}</cite>` : '';
          return `<blockquote><p>${block.data.text || ''}</p>${captionStr}</blockquote>`;
        case 'table':
          const rows = (block.data.content || [])
            .map((row: string[]) => {
              const cols = row.map((cell: string) => `<td>${cell}</td>`).join('');
              return `<tr>${cols}</tr>`;
            })
            .join('');
          return `<table><tbody>${rows}</tbody></table>`;
        default:
          // 其他类型的块降级转换为段落
          if (block.data.text) {
            return `<p>${block.data.text}</p>`;
          }
          return '';
      }
    })
    .join('');
}

/**
 * 将数据库中取出的标准 HTML 字符串解析并还原为 Editor.js 兼容的 JSON Blocks 结构
 */
export function htmlToBlocks(html: string): EditorBlock[] {
  if (!html) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const blocks: EditorBlock[] = [];

  const children = Array.from(doc.body.children);

  // 如果没有子元素但有内容，将整个内容当作单段落载入
  if (children.length === 0 && doc.body.textContent?.trim()) {
    blocks.push({
      id: `block_init_${Date.now()}`,
      type: 'paragraph',
      data: {
        text: doc.body.innerHTML.trim()
      }
    });
    return blocks;
  }

  children.forEach((child, index) => {
    const tagName = child.tagName.toLowerCase();
    const uniqueId = `block_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`;

    if (tagName === 'p') {
      blocks.push({
        id: uniqueId,
        type: 'paragraph',
        data: {
          text: child.innerHTML
        }
      });
    } else if (/^h[1-6]$/.test(tagName)) {
      const level = parseInt(tagName.charAt(1), 10);
      blocks.push({
        id: uniqueId,
        type: 'header',
        data: {
          text: child.innerHTML,
          level: level
        }
      });
    } else if (tagName === 'blockquote') {
      const p = child.querySelector('p');
      const cite = child.querySelector('cite');
      blocks.push({
        id: uniqueId,
        type: 'quote',
        data: {
          text: p ? p.innerHTML : child.innerHTML,
          caption: cite ? cite.innerHTML : ''
        }
      });
    } else if (tagName === 'table') {
      const trs = Array.from(child.querySelectorAll('tr'));
      const content = trs.map((tr) => {
        const tds = Array.from(tr.querySelectorAll('td, th'));
        return tds.map((td) => td.innerHTML);
      });
      blocks.push({
        id: uniqueId,
        type: 'table',
        data: {
          content: content
        }
      });
    } else if (tagName === 'ul' || tagName === 'ol') {
      const style = tagName === 'ol' ? 'ordered' : 'unordered';
      const items = Array.from(child.children)
        .filter((li) => li.tagName.toLowerCase() === 'li')
        .map((li) => li.innerHTML);

      blocks.push({
        id: uniqueId,
        type: 'list',
        data: {
          style: style,
          items: items
        }
      });
    } else {
      // 降级兼容：如是其它类型标签（如 div / blockquote / figure 等），直接保留其原始 HTML 包装入段落
      blocks.push({
        id: uniqueId,
        type: 'paragraph',
        data: {
          text: child.outerHTML
        }
      });
    }
  });

  return blocks;
}
