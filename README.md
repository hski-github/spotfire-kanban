# Kanban Board Mod for TIBCO Spotfire

Visualize tasks or items in different stages or categories.

Kanban boards visually depict work at various stages of a process using cards to represent work items and columns to represent each stage of a process. Color of the card is typically used for categorization like type of task, priority, or component.

As a basic example you can have three columns "to do", "doing" and "done" and the list of tasks in respective column according to their current status. 
You could also use a Kanban-like board to plan activities and have columns for upcoming sprints or quarters with activities planned for that columns.

<img src="https://github.com/hski-github/spotfire-kanban/blob/main/examples/kanban-taskboard.png?raw=true" width="70%">

But the Kanban Board visualisation can also be used to simply group items in columns.

<img src="https://github.com/hski-github/spotfire-kanban/blob/main/examples/item-board.png?raw=true" width="70%">

You can also add an icon to the cards to indicate certain situations of a task or item like existing impediment, complexity or priority.
A ceratin list of icons is available.


## To Do's

- Render hierarchy with tree for headers using SVG like in prototype 
- Catch error if no column or card is defined by user
- Ellipsis or line break as an option to configure
- Swimlanes
- Font color
- Hide or show empty columns


## Limitations  

The following features of a Kanban Board are currently not supported by Kanban Board Mod for TIBCO Spotfire, but might be implemented in a future release 

- Ability to define max number of cards per column as column capacity. In a more advanced Kanban board you could have limits for "Work in Progress", that means get a visual warning if a certain column contains more items that a defined maximum. 
- Support for swimlanes in Kanban board. An advance Kanban board could have swimlanes for different topics, teams or categories of items.



## How to get started (with development server)
All source code for the mod example can be found in the `src` folder. 
These instructions assume that you have [Node.js](https://nodejs.org/en/) (which includes npm) installed.

- Open a terminal at the location of this example.
- Run `npm install`. This will install necessary tools. Run this command only the first time you are building the mod and skip this step for any subsequent builds.
- Run `npm run server`. This will start a development server.
- Start editing, for example `src/main.js`.
- In Spotfire, follow the steps of creating a new mod and connecting to the development server.
