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
         * Render Kanban
         */
		document.querySelector("#mod-kanban-head").innerHTML = '';
		document.querySelector("#mod-kanban-body").innerHTML = '';
		
		var tr = document.createElement("tr");
		var trbody = document.createElement("tr");
		colRoot.children.forEach(function(child, i){
			var th = document.createElement("th");
			th.innerHTML = child.formattedValue();
			th.setAttribute("key", child.key);
			tr.appendChild(th);
			
			var tdbody = document.createElement("td");
			tdbody.setAttribute("key", child.key);
			trbody.appendChild(tdbody);
			
			child.rows().forEach(function(row, j){
				var div = document.createElement("div");
				div.innerHTML = row.categorical("Tile").formattedValue();
				tdbody.appendChild(div);
			});
		});
		document.querySelector("#mod-kanban-head").appendChild(tr);
		document.querySelector("#mod-kanban-head").appendChild(trbody);
		
		
		
		
		
        /**
         * Signal that the mod is ready for export.
         */
        context.signalRenderComplete();
    }
});
