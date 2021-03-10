;
(function () {

    jsPlumbToolkit.ready(function () {


// jsPlumbToolkit code.

        // 1. declare some JSON data for the graph. This syntax is a JSON equivalent of GraphML.
        var data = {
            "groups":[
                {"id":"one", "title":"Group 1", "left":100, top:50 },
                {"id":"two", "title":"Group 2", "left":450, top:250, type:"constrained"  }
            ],
            "nodes": [
                { "id": "window1", "name": "1", "left": 10, "top": 20, group:"one" },
                { "id": "window2", "name": "2", "left": 140, "top": 50, group:"one" },
                { "id": "window3", "name": "3", "left": 450, "top": 50 },
                { "id": "window4", "name": "4", "left": 110, "top": 370 },
                { "id": "window5", "name": "5", "left": 140, "top": 150, group:"one" },
                { "id": "window6", "name": "6", "left": 50, "top": 50, group:"two" },
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

        var view = {
            nodes: {
                "default": {
                    template: "tmplNode",
                    events: {
                        tap: function (params) {
                            toolkit.toggleSelection(params.node);
                        }
                    }
                }
            },
            groups:{
                "default":{
                    template:"tmplGroup",
                    endpoint:"Blank",
                    anchor:"Continuous",
                    revert:false,
                    orphan:true,
                    constrain:false,
                    layout:{
                        type:"Circular"
                    },
                    events:{
                        click:function(){
                            console.log(arguments)
                        }
                    }
                },
                constrained:{
                    parent:"default",
                    constrain:true
                }
            }
        };

        // 2. get a jsPlumbToolkit instance. provide a groupFactory; when you drag a Group on to the Surface we
        // set an appropriate title for the new Group.
        var toolkit = window.toolkit = jsPlumbToolkit.newInstance({
            groupFactory:function(type, data, callback) {
                data.title = "Group " + (toolkit.getGroupCount() + 1);
                callback(data);
            },
            nodeFactory:function(type, data, callback) {
                data.name = (toolkit.getNodeCount() + 1);
                callback(data);
            }
        });

        // get the various dom elements
        var mainElement = document.querySelector("#jtk-demo-absolute"),
            canvasElement = mainElement.querySelector(".jtk-demo-canvas"),
            miniviewElement = mainElement.querySelector(".miniview");

        // 3. load the data, and then render it to "main" with a Spring layout
        var renderer = window.renderer = toolkit.render({
            container: canvasElement,
            view: view,
            layout: {
                type: "Spring",
                absoluteBacked:false
            },
            jsPlumb: {
                Anchor:"Continuous",
                Endpoint: "Blank",
                Connector: [ "StateMachine", { cssClass: "connectorClass", hoverClass: "connectorHoverClass" } ],
                PaintStyle: { strokeWidth: 1, stroke: '#89bcde' },
                HoverPaintStyle: { stroke: "orange" },
                Overlays: [
                    [ "Arrow", { fill: "#09098e", width: 10, length: 10, location: 1 } ]
                ]
            },
            moiniview: {
                container:miniviewElement
            },
            lassoFilter: ".controls, .controls *, .miniview, .miniview *",
            dragOptions: {
                filter: ".delete *, .group-connect *, .delete",
                magnetize:true
            },
            events: {
                canvasClick: function (e) {
                    toolkit.clearSelection();
                },
                modeChanged: function (mode) {
                    jsPlumb.removeClass(jsPlumb.getSelector("[mode]"), "selected-mode");
                    jsPlumb.addClass(jsPlumb.getSelector("[mode='" + mode + "']"), "selected-mode");
                },
                groupAdded:function(group) {
                    console.log(arguments)
                }
            },
            consumeRightClick:false,
            zoomToFit:true
        });

        toolkit.load({type: "json", data: data});

        // pan mode/select mode
        jsPlumb.on(".controls", "tap", "[mode]", function () {
            renderer.setMode(this.getAttribute("mode"));
        });

        // on home button tap, zoom content to fit.
        jsPlumb.on(".controls", "tap", "[reset]", function () {
            toolkit.clearSelection();
            renderer.zoomToFit();
        });

        //
        // use event delegation to attach event handlers to
        // remove buttons. This callback finds the related Node and
        // then tells the toolkit to delete it.
        //
        jsPlumb.on(canvasElement, "tap", ".delete", function (e) {
            var info = toolkit.getObjectInfo(this);
            toolkit.removeNode(info.obj);
        });

        jsPlumb.on(canvasElement, "tap", ".group-title .expand", function(e) {
            var info = toolkit.getObjectInfo(this);
            if (info.obj) {
                renderer.toggleGroup(info.obj);
            }
        });

        jsPlumb.on(canvasElement, "tap", ".group-delete", function (e) {
            var info = toolkit.getObjectInfo(this);
            toolkit.removeGroup(info.obj, true);
        });

        //
        // Here, we are registering elements that we will want to drop onto the workspace and have
        // the toolkit recognise them as new nodes.
        //
        // SurfaceDropManager is a new component from version 1.14.7 onwards, which has an underlying drop manager.

        new SurfaceDropManager({
            surface:renderer,
            source:document.querySelector(".node-palette"),
            selector:"[data-node-type]",
            dataGenerator:function(e) {
                return {
                    type:"default"
                };
            }
        });

        var datasetView = jsPlumbToolkitSyntaxHighlighter.newInstance(toolkit, ".jtk-demo-dataset", "json", 2);
    });

})();
