/**
 * Get access to the Spotfire Mod API by providing a callback to the initialize method.
 * @param {Spotfire.Mod} mod - mod api
 */
Spotfire.initialize(async (mod) => {
    /**
     * Create the read function.
     */
    const reader = mod.createReader(mod.visualization.data(), mod.windowSize());

    /**
     * Store the context.
     */
    const context = mod.getRenderContext();

    /**
     * Initiate the read loop
     */
    reader.subscribe(render);

    /**
     * @param {Spotfire.DataView} dataView
     * @param {Spotfire.Size} windowSize
     * @param {Spotfire.ModProperty<string>} prop
     */
    async function render(dataView, windowSize) {
        /**
         * Check the data view for errors
         */
        let errors = await dataView.getErrors();
        if (errors.length > 0) {
            // Showing an error overlay will hide the mod iframe.
            // Clear the mod content here to avoid flickering effect of
            // an old configuration when next valid data view is received.
            mod.controls.errorOverlay.show(errors);
            return;
        }
        mod.controls.errorOverlay.hide();

        /**
         * Get the hierarchy of the categorical X-axis.
         */
        const colHierarchy = await dataView.hierarchy("Column");
        const colRoot = await colHierarchy.root();

        if (colRoot == null) {
            // User interaction caused the data view to expire.
            // Don't clear the mod content here to avoid flickering.
            return;
        }

        /**
         * Print out to document
         */
        const container = document.querySelector("#mod-container");
        container.textContent = `windowSize: ${windowSize.width}x${windowSize.height}\r\n`;
        container.textContent += `number of column levels: ${colHierarchy.levels.length} level(s)\r\n`;
        container.textContent += `number of children of root: ${colRoot.children.length} child(ren)\r\n`;
        container.textContent += `number of leaves of root: ${colRoot.leaves().length} leave(s)\r\n`;
        container.textContent += `should render: ${colRoot.rows().length} rows\r\n`;

		colRoot.children.forEach(function(childnode, i){
	        container.textContent += childnode.formattedValue() + ' with ' + childnode.leafCount() + ` leaves and ` + childnode.rowCount() + ` rows\r\n`;
			childnode.rows().forEach(function(row, j){
				container.textContent += row.categorical("Tile").formattedValue() + `\r\n`;
			});
		});
		
        /**
         * Signal that the mod is ready for export.
         */
        context.signalRenderComplete();
    }
});
