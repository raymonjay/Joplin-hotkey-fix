import joplin from 'api';

export default class Utils {

	/**
	 * 格式化 Markdown 文档
	 * 使表格对齐、标题规范、列表整齐等
	 */
	public static async formatMarkdown() {
		try {
			// 保存当前光标位置
			const cursor = await joplin.commands.execute('editor.execCommand', {name: "getCursor"});
			
			// 获取整个文档内容
			const entireContent = await joplin.commands.execute('editor.execCommand', {name: "getValue"});
			
			// 格式化内容
			const formatted = this.prettifyMarkdown(entireContent);
			
			// 获取文档行数
			const lines = entireContent.split('\n');
			const lineCount = lines.length;
			const endLine = lines[lineCount - 1];
			
			// 替换整个文档
			await joplin.commands.execute('editor.execCommand', {
				name: 'replaceRange',
				args: [
					formatted,
					{ line: 0, ch: 0 },
					{ line: lineCount, ch: endLine.length }
				]
			});
			
			// 恢复光标位置（需要确保光标位置在新文档范围内）
			const newLines = formatted.split('\n');
			const safeLine = Math.min(cursor.line, newLines.length - 1);
			const safeCh = Math.min(cursor.ch, newLines[safeLine]?.length || 0);
			
			await joplin.commands.execute('editor.execCommand', {
				name: 'setCursor',
				args: [{ line: safeLine, ch: safeCh }]
			});
			
			console.info('Markdown formatted successfully');
		} catch (error) {
			console.error('Format error:', error);
		}
	}

	/**
	 * Markdown 格式化核心函数
	 */
	private static prettifyMarkdown(content: string): string {
		const lines = content.split('\n');
		const result: string[] = [];
		let inCodeBlock = false;
		let codeBlockLang = '';
		let tableLines: string[] = [];
		let inTable = false;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const trimmedLine = line.trim();

			// 检测代码块开始
			if (trimmedLine.startsWith('```')) {
				if (inCodeBlock) {
					// 代码块结束
					result.push(line);
					inCodeBlock = false;
					codeBlockLang = '';
				} else {
					// 处理之前的表格
					if (inTable && tableLines.length > 0) {
						result.push(...this.formatTable(tableLines));
						tableLines = [];
						inTable = false;
					}
					// 代码块开始
					inCodeBlock = true;
					codeBlockLang = trimmedLine.slice(3).trim();
					result.push(line);
				}
				continue;
			}

			// 在代码块内，不做任何格式化
			if (inCodeBlock) {
				result.push(line);
				continue;
			}

			// 检测表格行
			if (this.isTableRow(trimmedLine)) {
				if (!inTable) {
					inTable = true;
					tableLines = [];
				}
				tableLines.push(line);
				continue;
			} else if (inTable) {
				// 表格结束，格式化并输出
				result.push(...this.formatTable(tableLines));
				tableLines = [];
				inTable = false;
			}

			// 格式化标题
			if (trimmedLine.startsWith('#')) {
				result.push(this.formatHeading(line));
				continue;
			}

			// 格式化列表
			if (this.isListItem(trimmedLine)) {
				result.push(this.formatListItem(line));
				continue;
			}

			// 格式化空行
			if (trimmedLine === '') {
				// 避免连续多个空行
				if (result.length > 0 && result[result.length - 1].trim() !== '') {
					result.push('');
				}
				continue;
			}

			// 普通行，去除尾部空格
			result.push(line.trimEnd());
		}

		// 处理最后的表格
		if (inTable && tableLines.length > 0) {
			result.push(...this.formatTable(tableLines));
		}

		// 确保文件以换行符结尾
		let output = result.join('\n');
		if (!output.endsWith('\n')) {
			output += '\n';
		}

		return output;
	}

	/**
	 * 检测是否为表格行
	 */
	private static isTableRow(line: string): boolean {
		// 表格行包含 | 字符
		if (!line.includes('|')) return false;
		
		// 分割并检查是否有多个列
		const cells = line.split('|').filter(cell => cell.trim() !== '');
		return cells.length >= 2;
	}

	/**
	 * 格式化表格
	 */
	private static formatTable(lines: string[]): string[] {
		if (lines.length === 0) return [];

		// 解析表格
		const parsedTable: string[][] = [];
		let maxCols = 0;

		for (const line of lines) {
			// 分割单元格，去除首尾的 |
			const cells = line.split('|').map(cell => cell.trim());
			// 移除首尾的空字符串（如果存在）
			if (cells[0] === '') cells.shift();
			if (cells[cells.length - 1] === '') cells.pop();
			
			parsedTable.push(cells);
			maxCols = Math.max(maxCols, cells.length);
		}

		// 计算每列的最大宽度
		const colWidths: number[] = new Array(maxCols).fill(0);
		for (const row of parsedTable) {
			for (let i = 0; i < row.length; i++) {
				colWidths[i] = Math.max(colWidths[i], row[i].length);
			}
		}

		// 格式化每一行
		const formattedLines: string[] = [];
		for (let rowIndex = 0; rowIndex < parsedTable.length; rowIndex++) {
			const row = parsedTable[rowIndex];
			
			// 检查是否是分隔行（包含 ---）
			const isSeparator = row.some(cell => /^[-:]+$/.test(cell.trim()));
			
			if (isSeparator) {
				// 格式化分隔行
				const separators = row.map((cell, colIndex) => {
					const width = colWidths[colIndex];
					// 保持原有的对齐方式
					if (cell.includes(':')) {
						if (cell.startsWith(':') && cell.endsWith(':')) {
							return ':' + '-'.repeat(Math.max(width - 2, 1)) + ':';
						} else if (cell.startsWith(':')) {
							return ':' + '-'.repeat(Math.max(width - 1, 1));
						} else if (cell.endsWith(':')) {
							return '-'.repeat(Math.max(width - 1, 1)) + ':';
						}
					}
					return '-'.repeat(Math.max(width, 3));
				});
				formattedLines.push('| ' + separators.join(' | ') + ' |');
			} else {
				// 格式化数据行
				const paddedCells = row.map((cell, colIndex) => {
					const width = colWidths[colIndex];
					return cell.padEnd(width);
				});
				formattedLines.push('| ' + paddedCells.join(' | ') + ' |');
			}
		}

		return formattedLines;
	}

	/**
	 * 格式化标题
	 */
	private static formatHeading(line: string): string {
		const trimmed = line.trim();
		
		// 只处理标准的 Markdown 标题格式：# 后面跟空格再跟文字
		// 例如：# Title, ## Title 等
		// 不处理：#: 123, #abc 等非标准格式
		const match = trimmed.match(/^(#+)\s+([^\s].*)$/);
		
		if (match) {
			const hashes = match[1];
			const title = match[2].trim();
			// 确保 # 后面有一个空格，且标题前后没有多余空格
			return `${hashes} ${title}`;
		}
		
		// 如果不是标准标题格式，保持原样，只去除尾部空格
		return line.trimEnd();
	}

	/**
	 * 检测是否为列表项
	 */
	private static isListItem(line: string): boolean {
		// 无序列表：- * +
		// 有序列表：数字.
		return /^\s*[-*+]\s/.test(line) || /^\s*\d+\.\s/.test(line);
	}

	/**
	 * 格式化列表项
	 */
	private static formatListItem(line: string): string {
		const match = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
		
		if (match) {
			const indent = match[1];
			const marker = match[2];
			const content = match[3].trim();
			// 统一缩进为 2 个空格，标记后一个空格
			const indentLevel = Math.floor(indent.length / 4);
			const newIndent = '  '.repeat(indentLevel);
			return `${newIndent}${marker} ${content}`;
		}
		
		return line.trimEnd();
	}

	public static removeHeadTag(text) {
		return text.replace(/^([#]+ )(.*?)$/,  "$2")
	}

	public static async supplyHeadText(headTag) {
		// Get the entire document content
		const entireContent = await joplin.commands.execute('editor.execCommand', {name: "getValue"});
		const lines = entireContent.split('\n');
		
		// Get current selections
		const selections = await joplin.commands.execute('editor.execCommand', {name: "listSelections"});
		
		if (selections.length > 0) {
			// Process all selections and collect changes
			const changes: Array<{line: number, newText: string}> = [];
			
			for (const selection of selections) {
				const startLine = Math.min(selection.head.line, selection.anchor.line);
				const endLine = Math.max(selection.head.line, selection.anchor.line);
				
				for (let line = startLine; line <= endLine; line++) {
					if (line < lines.length) {
						const text = lines[line];
						const newText = headTag + " " + this.removeHeadTag(text);
						changes.push({ line, newText });
					}
				}
			}
			
			// Apply all changes at once using replaceRange with proper document length
			// Sort changes by line number in descending order to avoid line number shifts
			changes.sort((a, b) => b.line - a.line);
			
			for (const change of changes) {
				const lineContent = lines[change.line];
				const lineLength = lineContent.length;
				
				// Use the actual line length from the document
				await joplin.commands.execute('editor.execCommand', {
					name: 'replaceRange',
					args: [
						change.newText,
						{ line: change.line, ch: 0 },
						{ line: change.line, ch: lineLength }
					]
				});
			}
		} else {
			// No selection, modify current line
			const cursor = await joplin.commands.execute('editor.execCommand', {name: "getCursor"});
			const currentLine = cursor.line;
			
			if (currentLine < lines.length) {
				const text = lines[currentLine];
				const newText = headTag + " " + this.removeHeadTag(text);
				const lineLength = text.length;
				
				await joplin.commands.execute('editor.execCommand', {
					name: 'replaceRange',
					args: [
						newText,
						{ line: currentLine, ch: 0 },
						{ line: currentLine, ch: lineLength }
					]
				});
			}
		}
	}
}
