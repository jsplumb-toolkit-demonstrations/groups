
import {
    SurfaceViewOptions,
    EVENT_TAP,
    EVENT_CLICK,
    EVENT_SURFACE_MODE_CHANGED, EVENT_CANVAS_CLICK
} from "@jsplumbtoolkit/browser-ui"

import {
    ready,
    newInstance
} from "@jsplumbtoolkit/browser-ui-vanilla"

import { BlankEndpoint, AnchorLocations, DEFAULT, ArrowOverlay } from "@jsplumb/core"
import {Group, Node, ObjectInfo, EVENT_GROUP_ADDED, AbsoluteLayout} from "@jsplumbtoolkit/core"
import {createSurfaceManager} from "@jsplumbtoolkit/drop"
import { newInstance as newSyntaxHighlighter } from "@jsplumb/json-syntax-highlighter"
import {SpringLayout} from "@jsplumbtoolkit/layout-spring"
import {MiniviewPlugin} from "@jsplumbtoolkit/browser-ui-plugin-miniview"
import {StateMachineConnector} from "@jsplumb/connector-bezier"
import {LassoPlugin} from "@jsplumbtoolkit/browser-ui-plugin-lasso"

ready(() => {


// jsPlumbToolkit code.

    // 1. declare some JSON data for the graph. This syntax is a JSON equivalent of GraphML.
    const data = {
        "groups":[
            {"id":"one", "title":"Group 1", "left":100, top:50 },
            {"id":"two", "title":"Group 2", "left":750, top:250, type:"constrained"  },
            {"id":"three", "title":"Nested Group", "left":50, "top":50, "group":"two"  }
        ],
        "nodes": [
           { "id": "window1", "name": "1", "left": 10, "top": 20, group:"one" },
            { "id": "window2", "name": "2", "left": 140, "top": 50, group:"one" },
            { "id": "window3", "name": "3", "left": 450, "top": 50 },
            { "id": "window4", "name": "4", "left": 110, "top": 370 },
            { "id": "window5", "name": "5", "left": 140, "top": 150, group:"one" },
            { "id": "window6", "name": "6", "left": 450, "top": 50, group:"two" },
            { "id": "window7", "name": "7", "left": 50, "top": 450 }
        ],
        "edges": [
            { source:"window3", target:"one"},
            { source:"window3", target:"window4"},
            { source:"one", target:"two"},
            { source:"window5", target:"window6"},
            { source:"window1", target:"window2"},
            { source:"window1", target:"window5"}
        ]
    };

    const view:SurfaceViewOptions = {
        nodes: {
            [DEFAULT]: {
                templateId: "tmplNode",
                events: {
                    [EVENT_TAP]: (params:{node:Node}) => {
                        toolkit.toggleSelection(params.node);
                    }
                }
            }
        },
        groups:{
            [DEFAULT]:{
                templateId:"tmplGroup",
                endpoint:BlankEndpoint.type,
                anchor:AnchorLocations.Continuous,
                revert:false,
                orphan:true,
                constrain:false,
                autoSize:true,
                layout:{
                    type:AbsoluteLayout.type
                },
                events:{
                    [EVENT_CLICK]:function(){
                        console.log(arguments)
                    }
                }
            },
            constrained:{
                parent:DEFAULT,
                constrain:true
            }
        },
        edges:{
            [DEFAULT]:{
                events:{
                    [EVENT_CLICK]:function() {
                        console.log(arguments)
                    }
                }
            }
        }
    };

    // Get an instance of the BrowserUIVanilla Toolkit. provide a groupFactory; when you drag a Group on to the Surface we
    // set an appropriate title for the new Group. Provide a nodeFactory.
    const toolkit = newInstance({
        groupFactory:(type:string, data:Record<string, any>, callback:Function) => {
            data.title = "Group " + (toolkit.getGroupCount() + 1)
            callback(data)
            return true
        },
        nodeFactory:(type:string, data:Record<string, any>, callback:Function) => {
            data.name = (toolkit.getNodeCount() + 1)
            callback(data)
            return true
        }
    })

    // get the various dom elements
    const mainElement = document.querySelector(".jtk-demo-main"),
        canvasElement = mainElement.querySelector(".jtk-demo-canvas"),
        miniviewElement = mainElement.querySelector(".miniview");

    //
    // Render the toolkit to `canvasElement`. For 2.x users upgrading to 5.x, not that `container` is now passed as a separate
    // argument, outside of the rest of the render options, whereas in 2.x it used to be one of the render options.
    //
    const renderer = toolkit.render(canvasElement, {
        view: view,
        layout: {
            type: SpringLayout.type,
            options: {
                absoluteBacked: true
            }
        },
        // FOR people coming from 2.x versions of the Toolkit, this key used to be `jsPlumb`.
        defaults: {
            anchor:AnchorLocations.Continuous,
            endpoint: BlankEndpoint.type,
            connector: { type:StateMachineConnector.type, options:{ cssClass: "connectorClass", hoverClass: "connectorHoverClass" } },
            paintStyle: { strokeWidth: 1, stroke: '#89bcde' },
            hoverPaintStyle: { stroke: "orange" },
            connectionOverlays: [
                { type:ArrowOverlay.type, options:{ fill: "#09098e", width: 10, length: 10, location: 1 } }
            ]
        },
        plugins:[
            {
                type:MiniviewPlugin.type,
                options:{
                    container:miniviewElement
                }
            },
            LassoPlugin.type
        ],
        dragOptions: {
            filter: ".delete *, .group-connect *, .delete"
        },
        magnetize:{
            afterDrag:true,
            afterGroupExpand:true
        },
        events: {
            [EVENT_CANVAS_CLICK]: (e:MouseEvent) => {
                toolkit.clearSelection()
            },
            [EVENT_SURFACE_MODE_CHANGED]: (mode:string) => {
                renderer.removeClass(document.querySelector("[mode]"), "selected-mode");
                renderer.addClass(document.querySelector("[mode='" + mode + "']"), "selected-mode");
            },
            [EVENT_GROUP_ADDED]:(group:Group) => {
                console.log("New group " + group.id + " added")
            }
        },
        consumeRightClick:false,
        zoomToFit:true
    });

    // load the data.
    toolkit.load({type: "json", data: data});

    // pan mode/select mode
    const controls = document.querySelector(".controls")
    renderer.on(controls, "tap", "[mode]", function () {
        renderer.setMode(this.getAttribute("mode"));
    });

    //
    // on home button tap, zoom content to fit. Note here we use `on` to bind an event, as we're just binding to a DOM
    // element that is not part of our dataset. Compare this with `bindModelEvent` below.
    //
    renderer.on(controls, "tap", "[reset]", function () {
        toolkit.clearSelection();
        renderer.zoomToFit();
    })

    //
    // Attach event handlers to 'delete' buttons. Note here the method `bindModelEvent`, which binds an event handler to some
    // named event on each of the vertices in the dataset. The callback is given the original event, the specific DOM element on
    // which the event occurred, and details about the model object on which the event occurred.
    //
    renderer.bindModelEvent(EVENT_TAP, ".delete", (event: Event, eventTarget: HTMLElement, info: ObjectInfo<Node>) =>{
        toolkit.removeNode(info.obj)
    })

    //
    // listen for group expand/collapse
    //
    renderer.bindModelEvent(EVENT_TAP, ".group-title .expand", (event: Event, eventTarget: HTMLElement, info: ObjectInfo<Group>) => {
        if (info.obj) {
            renderer.toggleGroup(info.obj)
        }
    })

    //
    // listen for clicks on group delete buttons
    //
    renderer.bindModelEvent(EVENT_TAP, ".group-delete", (event: Event, eventTarget: HTMLElement, info: ObjectInfo<Group>) => {
        toolkit.removeGroup(info.obj, true)
    })

    //
    // Here, we are registering elements that we will want to drop onto the workspace and have
    // the toolkit recognise them as new nodes
    //
    createSurfaceManager({
        surface:renderer,
        source:document.querySelector(".node-palette"),
        selector:"[data-node-type]",
        dataGenerator:(e:Element) => {
            return {
                type:"default"
            };
        }
    })

    // create a JSON dump, this is just so you can see the dataset changing.
    newSyntaxHighlighter(toolkit, ".jtk-demo-dataset", 2)
})

