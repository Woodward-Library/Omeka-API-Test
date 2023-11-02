/*********************************************************************************************************************
 * Omeka API - Connection Details: Connect to Omeka API, grab key/values of ItemSets, display results on page, and run Search API query
 * Omeka version tested: 4.0.1
 * 
 * 
 * Requires: 
 *   HTML divs to be created: div id:"omekaContainer"
 *   Item Viewer (Universal viewer or Mirador to be loaded into separate page for Item Viewer functionality)
 * 
 * Issues:
 *   tabs are manually coded - requires new api request to dynamically create tabs from item-sets that exist in Omeka
 *   see 'future functions' section
 *********************************************************************************************************************/


/********************************************************************
 * Set your preferences and properties in this section
 * Plugin your preferred properties and API URL
 * 
 ********************************************************************/

startingItemSetID="534"; //set starting Item Set ID to display on load if none given

/* get url params to load specific Item set into the results - ex: ?itemSetID=[item set ID in Omeka]*/
urlparams = new URL(window.location.toLocaleString());
itemSetID = urlparams.searchParams.get('itemSetID');

const base_url="https://omeka-dev.library.ubc.ca/api/"; //the Omeka Base API URL + item set id holder
const search_url="https://omeka-dev.library.ubc.ca/api/items?fulltext_search=" //the Omeka Search API URL string - needed for any Search requests
const itemPlayerURL="https://gallery.library.ubc.ca/viewer/?itemID=";  //URL to where an instance of Mirador/Universal viewer is located, pass the itemID with URL params; build manifest URL within that location
const item_url=base_url + "items?item_set_id=";

globalItemsPerPage = 25;  //set number of Items per page inital load
perPageURL = "&per_page="+globalItemsPerPage; //creating the url segment to set items per page
pageURL = "&page=" //specific page number to be added in pagination function

//set default item image if no item image is found
defaultImage = "https://brand.ubc.ca/files/2018/09/Logos_1_2CrestDownload_768px.jpg";

//set Collection Banner images
collectionBannerImage = ""; //default image
chungBanner = "https://gallery-library-20230501.sites.olt.ubc.ca/files/2023/08/taylors_Cropped.jpg";
stereographsBanner = "https://gallery-library-20230501.sites.olt.ubc.ca/files/2023/10/vancouver_LanternSlides.gif";
lindBanner = "https://gallery.library.ubc.ca/files/2023/08/arc1820_cropped2-2048x1409.jpg";

/********************************************************************
 * End of setting Properties ^
 * ******************************************************************
 * 
 * Start the grabby printy code >
 * 
 ********************************************************************/


//checks if an itemSetID was given in URL params - if none given, use the preferred default itemSet by sending the itemsetID to getData
function kickOff() {
    
    if (itemSetID==null) {
      itemSetID = startingItemSetID; //if no itemSet is given in URL, display starting Item SetID
      console.log(itemSetID);
    }
    buildHTML(); //build the HTML containers for Omeka items and results
    displayItemSetBanner();
    apiURL = buildApiURL(itemSetID); //create the API url for the starting item set
    console.log(apiURL);
    getData(apiURL);  
      
}


//gets the data from Omeka and send it to printResults
//this function may need a better Error check!
async function getData(apiURL){

  //there are specific headers we need to grab for total results in the response...this is just a note
    response = await fetch(apiURL)
      .then(response => {
        console.log(...response.headers);  //the Omeka custom response headers (such as total results) are blocked by CORS - need to add special allowances in .htaccess...
        
        itemCount = response.headers.get('omeka-s-total-results'); //get the total results - we need this for pagination later
        console.log (itemCount);  

        return response.json();
      })
      .catch(error => {
        console.error('Error:', error);
      });  
  
    dataBack = response;
    console.log(dataBack); //just to check the data 
    printResults(dataBack);  
    printPagination(itemCount,apiURL);
}

// build the API URL string
function buildApiURL (givenItemSetID){
      //check to see if there was a search value inputted, adjust the api url if exists
      searchWord = document.getElementById("searchInput").value;
      console.log(searchWord);
      //determine if there is a search word, if not load the item set
      if (searchWord) {
        builtApiURL = search_url+searchWord+perPageURL+pageURL;
        console.log("hello there is a search word");
        console.log(builtApiURL);
      }
      else {
        builtApiURL = item_url+givenItemSetID+perPageURL+pageURL;
        console.log(builtApiURL);
      }
  return (builtApiURL);
}

//build the HTML container divs to load our Omeka content into
function buildHTML(){
  document.getElementById("omekaContainer").innerHTML=`
  <div id="collectionBannerContainer">
    <h1 id="collectionHeading"></h1>
    <div id="collectionClearCover"></div>
    <div id="collectionBackground"></div>
  </div>
  <div class="searchOmeka"><p>Search: <input id="searchInput"></input><button id="submitSearch">Submit</button></p></div>
  <div id="tabs">
  </div>
  <div id="results">
  </div>
  <div id="pagination">
  </div>  
  `
  //add listener for Search button click
  searchButton = document.getElementById('submitSearch');
  searchButton.addEventListener("click", searchResults);
}


//some results returned via the api are contained in arrays - this is a helper to create objects from the arrays so we can reference them in printResults
function arrayToObjectHelper(itemArray){
  const newObj = {};
  itemArray.forEach(item => {
     const [key, value] = item.split(':');
     newObj[key] = value;
    });
  return newObj;
}

//this function prints out the tabs to toggle between item sets - this is hardcoded to specific api urls...look into dynamically identifying item-sets in future?
function printTabs(){
  //toggle for collections
  klondike = 31;
  chung = 11;
  slides= 534;
  document.getElementById("tabs").innerHTML=`
    <div id="collectionToggle">
      <div class="toggleItem" onclick="clearSearchAndGet('${chung}'); displayItemSetBanner('Chung Collection', 11); ">Chung Collection</div>        
      <div class="toggleItem" onclick="clearSearchAndGet('${klondike}'); displayItemSetBanner('Lind Collection', 31); ">Lind Collection</div>
      <div class="toggleItem" onclick="clearSearchAndGet(${slides}); displayItemSetBanner('Stereographs and Glass Lantern slides', 534); ">Stereographs and Glass Lantern slides</div>
    </div>
  `;
}

//clear the search when user clicks tabs
function clearSearchAndGet(theItemSetID){  
    //if a tab is clicked we want to clear out any existing search value
    document.getElementById('searchInput').value = null;
    searchWord = null;
    console.log(builtApiURL);
    theApiURL = buildApiURL(theItemSetID);
    console.log(theApiURL);
    getData(theApiURL);
}

//this grabs the key/values of each Item and Prints them to the Results div...maybe this function does too much
function printResults(dataBack){

  //clear any existing items in the results area
  document.getElementById("results").innerHTML=``;
  
  printTabs();//print the tabs to toggle between item sets

  //start defining each item and print to page
  for (var results=0; results<globalItemsPerPage; results++){
    console.log(results); 
    itemTitle = dataBack[results]?.['o:title'];
     console.log(itemTitle);
      
     //if the item has a title - continue grabbing and printing the item details 
     //grab item details if the details exist using Optional Chaining - writing this here to remind myself
     if (itemTitle){ 
           
        itemDescription = (dataBack[results]?.['dcterms:description']?.[0]?.['@value']);
        //check if no item description
        if (itemDescription==null){
          itemDescription = "";
        }

        itemImage = dataBack[results]?.thumbnail_display_urls.square;
        
        itemTypeArray = dataBack[results]?.['@type'];
        //check if itemTypeArray exists before running function
        if (itemTypeArray){
          itemTypeObj = arrayToObjectHelper(itemTypeArray);
        }

        itemType = itemTypeObj?.dctype;
        console.log(itemType); 

        //check if no Image, and sub default image if there is none
        if (itemImage==null){
          itemImage = defaultImage;
        }
        
        console.log(itemImage);
        
        bigImage = dataBack[results]?.thumbnail_display_urls.large;
        itemID = dataBack[results]?.['o:id'];
        
        let itemIdentifier = dataBack[results]?.['dcterms:identifier']?.[0]?.['@value'];

        itemPartOf = dataBack[results]?.['dcterms:isPartOf']?.[0]?.['@value'];

        itemDate = dataBack[results]?.['dcterms:date']?.[0]?.['@value'];
        itemSet = dataBack[results]?.['o:item_set']?.[0]?.['o:id'];
        
        itemMedia = dataBack[results]?.['o:media'];
        
        //print the Item to the page
        document.getElementById("results").innerHTML+=`

          <div class="singleResult">
            <div class="resultImage">
              <a href="${bigImage}"><img width="200px" height="200px" src="${itemImage}" alt="${itemTitle}"></a>
            </div>
            <div class="resultInfo">
              <h2>${itemTitle}</h2>
                <p class="itemType">Identifier: ${itemIdentifier} <br>Type: ${itemType} <br>
                <!--Part of: ${itemPartOf} <br>-->
                Date: ${itemDate} <br>
                <!--Related Item Set: ${itemSet}-->
      
                </p>
              <p>${itemDescription}</p>
              <p><a href="${itemPlayerURL}${itemID}&title=${itemTitle}">Open in item viewer</a><br>
              <a href="${bigImage}">View larger image</a></p>
            </div>
          </div>

          `//end of html block
          
    
    }//end of if has title
  }//end of for loop
}//end of function


function printPagination(numberOfResults, builtURL){

  //these variables are for determining pagination - how many pages should be created and how many items should be printed on each page
  itemsPerPage = globalItemsPerPage; //reset to global value every time this function is run
    
  numberOfPages = Math.ceil(numberOfResults / itemsPerPage); //round up number of pages to create
  
  //set itemsPerPage to numberOfResults if less than 1 page can be created
  if (numberOfPages<=1){itemsPerPage=numberOfResults}
  
  //fix to 'sanitize' builtapi url to remove any page numbers passed when this loops more than once
  findURLEnd = "&page=";
  const cleanBuiltURL = builtURL.slice(0,builtURL.lastIndexOf(findURLEnd))+"&page="; 
  console.log(cleanBuiltURL);

  //clear out any existing page numbers
  document.getElementById("pagination").innerHTML=``;

  document.getElementById("pagination").innerHTML=`
    <p><strong>Pages</strong></p>
    `//end of pagination html block
    
    //print page numbers v2
    for (pageCount=1; pageCount< (numberOfPages+1); pageCount++){
      console.log(builtURL);
      document.getElementById("pagination").innerHTML+=`
        <div class="pageNumber" onclick="getData('${cleanBuiltURL}${pageCount}')"> ${pageCount} </div>
        
      `
    }

}

//clear any existing Search info and display the Search Results
async function searchResults(){
  document.getElementById("results").innerHTML=`<p>Search Results</p>`
  goSearch = buildApiURL(); //build the API url to retrieve search results
  getData(goSearch);
}


function displayItemSetBanner(collectionName,theItemSetID){
  //check if itemsetID passed in tab
  if (theItemSetID){
    itemSetID = theItemSetID;
  }

    if (itemSetID==11){
        document.getElementById("collectionHeading").innerHTML = 'Chung Collection';
        collectionBannerImage = chungBanner;
      }
      else if (itemSetID==534){
        document.getElementById("collectionHeading").innerHTML = 'Stereographs and Glass Lantern slides';
        collectionBannerImage = stereographsBanner;
      }
      else if (itemSetID==31){
        document.getElementById("collectionHeading").innerHTML = 'Lind Collection';
        collectionBannerImage = lindBanner;
      }
      
    if (collectionName){  
      document.getElementById("collectionHeading").innerHTML = collectionName;
      
    }
    
    document.getElementById("collectionBackground").innerHTML = `<img src="${collectionBannerImage}"></img>`;
    
}

/***********************************************
* 
* Future functions: Goal is to remove any 'hardcoded' itemSet code to allow for future item set additions
*
*************************************************


getItemSet: get the Item-sets information
-needed to grab the Item-set title, and image for item header
-banner image can be set as thumbnail in Omeka installation
-new api call needed

printItemSet Header: prints the item-set header (banner)
-will replace displayItemsetBanner

printItemTabs: prints the Item-set tabs for Chung, Lind and Stereographs using info grabbed from getItemSet
-will replace current printTabs
-perhaps will use dropdown

*******************************************************/



//the start of everything
kickOff();  


