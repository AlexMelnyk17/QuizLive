// Model validation reports keys like "Options[1].Text", the services like "options[1].text".
// Both become react-hook-form paths: "options.1.text".
export function toFieldPath(key: string): string {
	return key
		.replace(/\[(\d+)\]/g, '.$1')
		.split('.')
		.map(part => part.charAt(0).toLowerCase() + part.slice(1))
		.join('.')
}