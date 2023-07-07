/* get url params */

urlparams = new URL(window.location.toLocaleString());
console.log(urlparams);
baseURL = "https://omeka-dev.library.ubc.ca/iiif-presentation/3/"
itemID = urlparams.searchParams.get('itemID');
itemSetID = urlparams.searchParams.get('itemSetID');


if (itemSetID){
   manifesturl = baseURL + "item-set/" + itemSetID + "/collection";
}
else if (itemID) {
    manifesturl = baseURL + "item/" + itemID + "/manifest";
}
//no params set then set default view
else {
    manifesturl="http://localhost:8888/omeka-s/iiif-presentation/3/item-set/1/collection"
}


/* mirador stuff */
$(function() {

console.log(manifesturl);
mirador = Mirador.viewer({
  "id": "viewer",
  "selectedTheme": 'light',
  "windows": [
    {
      "loadedManifest": manifesturl,
      "canvasIndex": 0,
       "view":'gallery',

    }
  ],

    "thumbnailNavigation": {
      "defaultPosition": "far-bottom",
      "height": 130,
      "width": 100
    },

    "window": {
      "allowClose": false,
      "allowFullscreen": false,
      "allowMaximize": false,
      "allowTopMenuButton": true,
      "allowWindowSideBar": true,
      "authNewWindowCenter": "parent",
      "sideBarPanel": "info",
      "defaultSidebarPanelHeight": 201,
      "defaultSidebarPanelWidth": 235,
      "defaultView": "gallery",
      "forceDrawAnnotations": false,
      "hideWindowTitle": false,
      "highlightAllAnnotations": false,
      "showLocalePicker": false,
      "sideBarOpen": true,
      "panels": {
        "info": true,
        "attribution": true,
        "canvas": true,
        "annotations": true,
        "search": true
      },
      "views": [
        {
          "key": "single",
          "behaviors": [
            "individuals"
          ]
        },
        {
          "key": "book",
          "behaviors": [
            "paged"
          ]
        },
        {
          "key": "scroll",
          "behaviors": [
            "continuous"
          ]
        },
        {
          "key": "gallery"
        }
      ]
    },

    workspaceControlPanel: {
    enabled: false, // Configure if the control panel should be rendered.  Useful if you want to lock the viewer down to only the configured manifests
  },
});

});   

//to show the Collection dialog when the button is pressed
$(document).on('click', '.MuiButton-containedPrimary', function() {
  $('.MuiDialog-root.mirador74').addClass('showModal');
  //console.log("TEST");
});