/**
 * Get access to the Spotfire Mod API by providing a callback to the initialize method.
 * @param {Spotfire.Mod} mod - mod api
 */
Spotfire.initialize(async (mod) => {
    /**
     * Create the read function.
     */
    const reader = mod.createReader(
		mod.visualization.data(), 
		mod.windowSize(),
		mod.visualization.axis("Column"),
		mod.visualization.axis("Card")
	);

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
    async function render(dataView, windowSize, columnAxis, cardAxis) {
	
	
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
         * Get rows from dataView
         */
        const rows = await dataView.allRows();
        if (rows == null) {
            // User interaction caused the data view to expire.
            // Don't clear the mod content here to avoid flickering.
            return;
        }


        /**
         * Clear content
         */
		document.querySelector("#mod-kanban-head").innerHTML = '';
		document.querySelector("#mod-kanban-body").innerHTML = '';
		

        /**
         * Setup configure pop up
         */
		const configureContent = document.getElementById('mod-configure-content');
		tippy('#mod-configure', {
			trigger: 'click', theme: 'light-border', 
			allowHTML: true, interactive: true,
			content: configureContent
		});
	
	
        /**
         * Render Kanban
         */
		var tr = document.createElement("tr");
		var trbody = document.createElement("tr");
		
		colRoot.children.forEach(function(child){
			
			// Render Column Header
			var th = document.createElement("th");
			th.innerHTML = child.formattedValue();
			th.setAttribute("key", child.key);
			tr.appendChild(th);
			
			// Marking of all Cards of a Column onclick of Column Header
			tr.onclick = function ( event ) {
	            
				if (!event.shiftKey) dataView.clearMarking();
				
				var columnKey = event.target.getAttribute("key");
				var divs = document.querySelectorAll("#mod-kanban-body td[key="+columnKey+"] div");
				
				// For each card set marking
				divs.forEach(function(div, j){
					var elementId = div.getAttribute("row");	
					var row = rows.find( obj => { return obj.elementId() === elementId });
	
					if (event.shiftKey) {
						dataView.mark(new Array(row),"Add");
					}
					else {
						dataView.mark(new Array(row),"Replace");
					}
				});
				event.stopPropagation();
			
	        };

			// Render Column
			var tdbody = document.createElement("td");
			tdbody.setAttribute("key", child.key);
			trbody.appendChild(tdbody);
			
			// Render Cards of the Column
			child.rows().forEach(function(row, j){
				
				var div = document.createElement("div");
				var cardValue = row.categorical("Card").value();
				div.innerHTML = "";
				for(var i = 0; i < cardValue.length; i++){
					div.innerHTML += cardValue[i].formattedValue();
					if (i < cardValue.length - 1){
						div.innerHTML += "<br/>";	
					}
				}				
				div.setAttribute("row", row.elementId());
				div.className = "card";
				div.setAttribute("style", 
					"background-color: " + row.color().hexCode + "; " + 
					"color: " + getContrastYIQ(row.color().hexCode) + "; ");
				tdbody.appendChild(div);
				
				// Marking
				div.onclick = function ( event ){

					var elementId = event.target.getAttribute("row");
					var row = rows.find( obj => { return obj.elementId() === elementId });

					if (event.shiftKey) {
						dataView.mark(new Array(row),"Add");
					}
					else {
						dataView.mark(new Array(row),"Replace");
					}
					event.stopPropagation();
				};

				// Tool Tip
				div.onmouseover = function (event){

					var elementId = event.target.getAttribute("row");
					var row = rows.find( obj => { return obj.elementId() === elementId });
					
					var tooltip = "";
					var columnValue = row.categorical("Column").value();
					for(var i = 0; i < columnValue.length; i++){
						tooltip += columnAxis.parts[i].displayName + ": " + columnValue[i].formattedValue() + "\r\n";
					}
					var cardValue = row.categorical("Card").value();
					for(var i = 0; i < cardValue.length; i++){
						tooltip += cardAxis.parts[i].displayName + ": " + cardValue[i].formattedValue() + "\r\n";
					}
					
                    mod.controls.tooltip.show(tooltip);
				};
				div.onmouseout = function (event){
                    mod.controls.tooltip.hide();
				}					
				
			});
		});
		
		// Clear marking
		trbody.onclick = function ( event ) {
             if (!event.shiftKey) dataView.clearMarking();
        };

		document.querySelector("#mod-kanban-head").appendChild(tr);
		document.querySelector("#mod-kanban-body").appendChild(trbody);
		
		
        /**
         * Signal that the mod is ready for export.
         */
        context.signalRenderComplete();
    }
});


/**
 * Define text color black or white based on background color
 */
function getContrastYIQ(hexcolor){
	
	// See https://stackoverflow.com/questions/11867545
    hexcolor = hexcolor.replace("#", "");
    var r = parseInt(hexcolor.substr(0,2),16);
    var g = parseInt(hexcolor.substr(2,2),16);
    var b = parseInt(hexcolor.substr(4,2),16);
    var yiq = ((r*299)+(g*587)+(b*114))/1000;
    return (yiq >= 180) ? 'black' : 'white';
}
