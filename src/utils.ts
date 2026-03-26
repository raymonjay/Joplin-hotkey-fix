import joplin from 'api';

export default class Utils {

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
