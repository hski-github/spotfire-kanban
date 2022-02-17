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
		mod.visualization.axis("Card"),
		mod.visualization.axis("Icon")
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
     * Render content of the data view and axis 
     */
    async function render(dataView, windowSize, columnAxis, cardAxis, iconAxis) {
	
	
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
         * Set card border and outline style dependent on mod theme styles
         */
		var fontColor = mod.getRenderContext().styling.general.font.color;
		var backgroundColor = mod.getRenderContext().styling.general.backgroundColor;
		var style = document.querySelector("#mod-kanban-style");
		style.innerHTML = '.card {border: 1px solid ' + backgroundColor + ';} ' + 
			'.card:hover {outline: 1px solid ' + fontColor + ';}';


        /**
         * Render Kanban
         */
		var trhead = document.createElement("tr");
		var trbody = document.createElement("tr");
		document.querySelector("#mod-kanban-head").appendChild(trhead);
		document.querySelector("#mod-kanban-body").appendChild(trbody);

	    	
		// Render Columns
		colRoot.children.forEach(function(child){
			
			// Render Column Header
			var th = document.createElement("th");
			th.innerHTML = child.formattedValue();
			th.setAttribute("key", child.key);
			trhead.appendChild(th);
			
			// Marking of all Cards of a Column onclick of Column Header
			trhead.onclick = function ( event ) {
	            
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
				
				// Card
				var div = document.createElement("div");
				div.className = "card";
				div.setAttribute("row", row.elementId());
				div.innerHTML = "";
				tdbody.appendChild(div);

				// Text
				if ( cardAxis.parts.length > 0 ){
					var cardValue = row.categorical("Card").value();
					for(var i = 0; i < cardValue.length; i++){
						div.innerHTML += cardValue[i].formattedValue();
						if (i < cardValue.length - 1){
							div.innerHTML += "<br/>";	
						}
					}
				}
				
				// Icon 
				if ( iconAxis.parts.length > 0 ){
					var icon = row.categorical("Icon");
					var img = document.createElement("img");
					img.setAttribute("src", "fontawesome/" + icon.formattedValue() + ".svg");
					img.setAttribute("width", "18");
					img.setAttribute("height", "18");
					img.setAttribute("style", "float: right; margin-left: 3px; margin-bottom: 3px;");
					div.appendChild(img);
				}
				
				// Color
				div.setAttribute("style", 
					"background-color: " + row.color().hexCode + "; " + 
					"color: " + getContrastYIQ(row.color().hexCode) + "; ");
				
				
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
				

        /**
         * Clear marking
         */
		trbody.onclick = function ( event ) {
			if (!event.shiftKey) dataView.clearMarking();
        };		


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
