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
		mod.property("myProperty")
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
    async function render(dataView, windowSize, columnAxis, cardAxis, myProperty) {
	
	
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
         * Render Kanban
         */
		var tr = document.createElement("tr");
		var trbody = document.createElement("tr");
		document.querySelector("#mod-kanban-head").appendChild(tr);
		document.querySelector("#mod-kanban-body").appendChild(trbody);
		

		/**
		 * Add Default Columns
		 */
		var defaultCols = myProperty.value().split(/\r?\n/g);
		defaultCols.forEach( function(defaultCol ){
			defaultCol = defaultCol .trim(); 
			if ( defaultCol ){
				var th = document.createElement("th");
				th.setAttribute("formattedvalue", defaultCol);
				var span = document.createElement("span");
				span.innerHTML = defaultCol;
				th.appendChild(span);
				tr.appendChild(th);
				
				var tdbody = document.createElement("td");
				tdbody.setAttribute("formattedvalue", defaultCol);
				trbody.appendChild(tdbody);

			}
		})
	
	
		
		colRoot.children.forEach(function(child){
			
			// Render Column Header
			var th = document.querySelector("th[formattedvalue='"+child.formattedValue()+"']");
			if (!th){
				var th = document.createElement("th");
				th.setAttribute("formattedvalue", child.formattedValue());
				var span = document.createElement("span");
				span.innerHTML = child.formattedValue();
				th.appendChild(span);
				tr.appendChild(th);

			};
			th.setAttribute("key", child.key);
			
			
			// Marking of all Cards of a Column onclick of Column Header
			var span = document.querySelector("th[formattedvalue='"+child.formattedValue()+"'] span");
			span.setAttribute("key", child.key);
			span.onclick = function ( event ) {
	            
				tippy.hideAll();
				
				if (!event.shiftKey) dataView.clearMarking();
				
				var columnKey = event.target.getAttribute("key");
				var divs = document.querySelectorAll("#mod-kanban-body td[key='"+columnKey+"'] div");
				
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

			
/** 
*/

			// Render Column
			var tdbody = document.querySelector("#mod-kanban-body td[formattedvalue='"+child.formattedValue()+"']");
			if (!tdbody){
				var tdbody = document.createElement("td");
				trbody.appendChild(tdbody);
			};
			tdbody.setAttribute("key", child.key);
			
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


		
		
        /**
         * Setup configure pop up
         */
		var configTextarea = document.createElement("textarea");
		configTextarea.setAttribute("id", "mod-config-textarea");
		configTextarea.append(myProperty.value());
		configTextarea.addEventListener("change", e => {	
			myProperty.set(configTextarea.value); 
		});
		
		var configLabel = document.createElement("label");
		configLabel.setAttribute("for","mod-config-textarea");
		configLabel.innerHTML = "Default Values and Sort Order";
		var configDiv = document.createElement("div");
		configDiv.setAttribute("id", "mod-kanban-config");
		configDiv.appendChild(configLabel);
		configDiv.appendChild(configTextarea);
		
		tippy('#mod-kanban-head', {
			trigger: 'click', theme: 'light-border', 
			hideOnClick: true,
			allowHTML: true, interactive: true,
			followCursor: 'initial',
			maxWidth: 250,
			offset: [10,10],
			content: configDiv
		});
			
		
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
