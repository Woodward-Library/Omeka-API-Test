const data = {
  manifest: "https://omeka.library.ubc.ca/iiif-presentation/2/item/589/manifest",
  embedded: true // needed for codesandbox frame
};

uv = UV.init("uv", data);

// override config using an inline json object
uv.on("configure", function ({ config, cb }) {
  cb({
    options: { 
      footerPanelEnabled: true,
      rightPanelEnabled: true,
      useArrowKeysToNavigate: true,
      pagingEnabled: false,
      pagingOptionEnabled: false
    },
    modules:
    {
      
      openSeadragonCenterPanel:{
        options:{
          animationTime: 0.15,
          autoHideControls: false,
          requiredStatementEnabled: true,
          blendTime: 15,
          constrainDuringPan: false,
          controlsFadeAfterInactive: 1500,
          controlsFadeDelay: 2500,
          controlsFadeLength: 2500,
          defaultZoomLevel: 0,
          immediateRender: false,
          maxZoomPixelRatio: 1.25,
          navigatorPosition: "TOP_RIGHT",
          pageGap: 50,
          showHomeControl: true,
          trimAttributionCount: 150,
          visibilityRatio: 0.5
        }
      },
      contentLeftPanel:{
        options:{
           panelOpen: true,
           pageModeEnabled: true,
           thumbsEnabled: true,
           branchNodesSelectable: true,
           panelExpandedWidth: 175
        }
      },
      settingsDialogue:{
        content:{
          pagingEnabled: "Two Page View"
        }
      },
      pagingHeaderPanel: {
        options: {
          galleryButtonEnabled: true,
          imageSelectionBoxEnabled: true,
          pageModeEnabled: false,
          pagingToggleEnabled: true
      
        }
      }
  
      
      
    }
  });
});