// No PostCSS plugins needed for standalone CSS in this workspace.
// Kept to avoid Vite attempting to load missing plugins during dev.
module.exports = {
	plugins: {
		tailwindcss: {},
		autoprefixer: {},
	},
};