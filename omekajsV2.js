/*********************************************************************************************************************
 * Omeka API - Connection Details: Connect to Omeka API, grab key/values of ItemSets, display results on page, and run Search API query
 * Omeka version tested: 4.0.1
 * 
 * 
 * Requires: 
 *   HTML div to be created: div id:"omekaContainer"
 *   Item Viewer (Universal viewer or Mirador to be loaded into separate page for Item Viewer functionality - see itemPlayerURL)
 *   DOMPurify - used to sanitize Search input and URL parameters (https://cdn.jsdelivr.net/gh/cure53/DOMPurify/dist/purify.js)
 * 
 * Issues:
 *   tabs are manually coded (tabs are now removed - nov 23 2023) - to improve, code requires new api request to dynamically create menu from item-sets that exist in Omeka
 *   see 'future functions' section
 *********************************************************************************************************************/


/********************************************************************
 * Set your preferences and properties in this section
 * Plugin your preferred properties and API URL
 * 
 ********************************************************************/

const startingItemSetID="11"; //set starting Item Set ID to display on load if none given

/* get url params to load specific Item set into the results - ex: ?itemSetID=[item set ID in Omeka]*/
let urlparams = new URL(window.location.toLocaleString());
let itemSetID = urlparams.searchParams.get('itemSetID'); //santized in kickOff

const base_url="https://omeka-dev.library.ubc.ca/api/"; //the Omeka Base API URL + item set id holder
const search_url="https://omeka-dev.library.ubc.ca/api/items?fulltext_search=" //the Omeka Search API URL string - needed for any Search requests
const itemPlayerURL="https://gallery.library.ubc.ca/viewer/?itemID=";  //URL to where an instance of Mirador/Universal viewer is located, pass the itemID with URL params; build manifest URL within that location
const item_url= base_url + "items?item_set_id=";
const item_set_url = base_url + "item_sets";

const globalItemsPerPage = 25;  //set number of Items per page inital load
const perPageURL = "&per_page="+globalItemsPerPage; //creating the url segment to set items per page
const pageURL = "&page="; //specific page number to be added in pagination function

const errorText = 'Sorry, unable to get data.  Please try again later'; //set error text shown when unable to retrieve data from Omeka

//set default item image if no item image is found
const defaultImage = "https://brand.ubc.ca/files/2018/09/Logos_1_2CrestDownload_768px.jpg";

//set Collection Banner images - in future - grab default collection image from Omeka so banners can be set from there
let collectionBannerImage = ""; //default image
const chungBanner = "https://gallery-library-20230501.sites.olt.ubc.ca/files/2023/11/taylors_Croppedv2.jpg";
const stereographsBanner = "https://gallery-library-20230501.sites.olt.ubc.ca/files/2023/11/lanternSlideCropped.jpg";
const lindBanner = "https://gallery-library-20230501.sites.olt.ubc.ca/files/2023/11/lind_Cropped.jpg";

//variables for rate limiting
let requestCounter = 0;
let lastRequested = 0;
const maxRequestPerMinute = 2;//how many times data from Omeka can be requested per minute


/********************************************************************
 * End of setting Properties ^
 * ******************************************************************
 * 
 * Start the grabby printy code >
 * 
 ********************************************************************/


//checks if an itemSetID was given in URL params - if none given, use the preferred default itemSet by sending the itemsetID to getData
async function kickOff() {
    cleanItemSetID = await sanitize(itemSetID); //sanitize the itemSetID since it could be defined in URL params
    console.log(cleanItemSetID);
    if (cleanItemSetID==="") {
      cleanItemSetID = startingItemSetID; //if no itemSet is given in URL, display starting Item SetID
      console.log(cleanItemSetID);
    }

    buildHTML(); //build the HTML containers for Omeka items and results
    displayItemSetBanner(); //temporary - will be removed when future function printCurrentCollectionBanner is completed
    let apiURL = await buildApiURL(cleanItemSetID); //create the API url for the starting item set
    console.log(apiURL);
    getData(apiURL);  
    getItemSetData(item_set_url); //for getting the collection item-set information
    return cleanItemSetID;
}

//sanitize inputs with DOMPurify, await the result and return the clean value
async function sanitize(dirtyValue){
  try {
    let cleanValue = await DOMPurify.sanitize(dirtyValue);
    return cleanValue;
  }
  catch (error){
    console.log("Error sanitizing data with DOMPurify",error);
    return Promise.reject(error); 
  } 
}


//gets the item data from Omeka and send it to printResults
async function getData(apiURL){
  //rate limiting chunk of code
  const currentTime = Date.now();
    // Check if the number of requests exceeds the limit in a minute
    if (requestCounter >= maxRequestPerMinute && currentTime - lastRequested < 60000) {
      console.log('Rate limit exceeded. Please wait before making more requests.');
      //showErrorMessage(errorText);
      return;
    }
  
    // Reset the counter and update the timestamp if a minute has passed
    if (currentTime - lastRequested >= 60000) {
      requestCounter = 0;
      lastRequested = currentTime;
    }
  
    // Increment the request counter
    requestCounter++;

  //get the Omeka data
  try {
    let cleanApiUrl = await sanitize(apiURL); // Sanitize the apiUrl just in case...
      
      // There are specific headers we need to grab for total results in the response... this is just a note
    let response = await fetch(cleanApiUrl);
    console.log(...response.headers);  //the Omeka custom response headers (such as total results) are blocked by CORS - need to add special allowances in .htaccess...
    const itemCount = response.headers.get('omeka-s-total-results'); //get the total results - we need this for pagination later
    console.log(itemCount);
  
    let responseData = await response.json();
    console.log(responseData); //just to check the data
    printResults(responseData);
    printPagination(itemCount, cleanApiUrl);
  } 
  catch (error) {
    console.error('Error during getData:', error);
    showErrorMessage(errorText);
  }
  
  //move focus to top of page 
  window.scroll(0,0);

}

// build the API URL string
async function buildApiURL (givenItemSetID){
      //check to see if there was a search value inputted, adjust the api url if exists
      let enteredSearchWord = document.getElementById("searchInput").value;
      
      //sanitize the entered Search words
      cleanedSearchWord =  await sanitize(enteredSearchWord); 
      
      //determine if there is a search word, if not load the item set
      if (enteredSearchWord) {
        var builtApiURL = search_url+cleanedSearchWord+perPageURL+pageURL; //build the api url with the clean search words
        console.log("hello there is a search word");
        console.log(builtApiURL);
      }
      else {
        var builtApiURL = item_url+givenItemSetID+perPageURL+pageURL;
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
  <div class="searchOmeka">
    <div id="searchField"><input id="searchInput" aria-label="Search Collections"></input><button id="submitSearch">Search</button></div>
    <div id="collectionNav">
    </div>
  </div>
  <div id="errorContainer"></div>
  <div id="results">
  </div>
  <div id="pagination">
  </div>  
  <div id="tabs">
  </div>
  
  `
  //add listener for Search button click
  let searchButton = document.getElementById('submitSearch');
  searchButton.addEventListener("click", searchResults);
}


//some results returned via the api are contained in arrays - this is a helper to create objects from the arrays so we can reference them in printResults
//not sure if necessary, possible remove in future
function arrayToObjectHelper(itemArray){
  const newObj = {};
  itemArray.forEach(item => {
     const [key, value] = item.split(':');
     newObj[key] = value;
    });
  return newObj;
}

//this grabs the key/values of each Item and Prints them to the Results div...maybe this function does too much
function printResults(dataBack){

  //clear any existing items in the results area
  document.getElementById("results").innerHTML=``;
  
  //printTabs();//print the tabs to toggle between item sets (temporary disabled - kyle)

  //start defining each item and print to page
  for (var results=0; results<globalItemsPerPage; results++){
    console.log(results); 
    let itemTitle = dataBack[results]?.['o:title'];
     console.log(itemTitle);
      
     //if the item has a title - continue grabbing and printing the item details 
     //grab item details if the details exist using Optional Chaining - writing this here to remind myself
     if (itemTitle){ 
           
        let itemDescription = (dataBack[results]?.['dcterms:description']?.[0]?.['@value']);
        //check if no item description
        if (itemDescription==null){
          itemDescription = "";
        }

        let itemImage = dataBack[results]?.thumbnail_display_urls.square;
            //check if no Image, and sub default image if there is none
            if (itemImage==null){
                itemImage = defaultImage;
            }

        let itemTypeArray = dataBack[results]?.['@type'];
          //check if itemTypeArray exists before running function
          if (itemTypeArray){
            itemTypeObj = arrayToObjectHelper(itemTypeArray);
          }

        let itemType = itemTypeObj?.dctype;
        console.log(itemType); 


        
        let bigImage = dataBack[results]?.thumbnail_display_urls.large;
        let itemID = dataBack[results]?.['o:id'];
        
        let itemIdentifier = dataBack[results]?.['dcterms:identifier']?.[0]?.['@value'];

        let itemPartOf = dataBack[results]?.['dcterms:isPartOf']?.[0]?.['@value'];

        let itemDate = dataBack[results]?.['dcterms:date']?.[0]?.['@value'];
        let itemSet = dataBack[results]?.['o:item_set']?.[0]?.['o:id'];
        
        let itemMedia = dataBack[results]?.['o:media'];
        
        //print the Item to the page
        document.getElementById("results").innerHTML+=`

          <div class="singleResult">
            <div class="resultImage">
              <a href="${bigImage}"><img src="${itemImage}" alt="${itemTitle}"></a>
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
  let itemsPerPage = globalItemsPerPage; //reset to global value every time this function is run
    
  let numberOfPages = Math.ceil(numberOfResults / itemsPerPage); //round up number of pages to create
  
  //set itemsPerPage to numberOfResults if less than 1 page can be created
  if (numberOfPages<=1){itemsPerPage=numberOfResults}
  
  //fix to 'sanitize' builtapi url to remove any page numbers passed when this loops more than once
  let findURLEnd = "&page=";
  let cleanBuiltURL = builtURL.slice(0,builtURL.lastIndexOf(findURLEnd))+"&page="; 
  console.log(builtURL);
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
  goSearch = await buildApiURL(); //build the API url to retrieve search results
  
  //set itemSetId to Search (for unique search banner)
  itemSetID = "search";
  printCurrentCollectionBanner (itemSetData); //print the Search Banner using the Item-set data
  getData(goSearch); //get the Search response
}

//possibly remove this function after finalizing printCurrentCollectionBanner
function displayItemSetBanner(collectionName,theItemSetID){
  //check if itemsetID passed in tab
  if (theItemSetID){
    itemSetID = theItemSetID;
  }

    if (cleanItemSetID==11){
        //document.getElementById("collectionHeading").innerHTML = 'Chung Collection';
        collectionBannerImage = chungBanner;
      }
      else if (cleanItemSetID==534){
        //document.getElementById("collectionHeading").innerHTML = 'Stereographs and Glass Lantern slides';
        collectionBannerImage = stereographsBanner;
      }
      else if (cleanItemSetID==31){
        //document.getElementById("collectionHeading").innerHTML = 'Lind Collection';
        collectionBannerImage = lindBanner;
      }
      
    if (collectionName){  
      document.getElementById("collectionHeading").innerHTML = collectionName;
      
    }
    
    document.getElementById("collectionBackground").innerHTML = `<img src="${collectionBannerImage}"></img>`;
    
}

//displays an error message to user if data is unable to be retrieved from Omeka-S
function showErrorMessage(text){
    document.getElementById("errorContainer").style.display = "block";
    document.getElementById("errorContainer").innerHTML = `${text}`;
}

/***********************************************
* 
* Future functions: Goal is to remove any 'hardcoded' itemSet code to allow for future item set additions
*
*************************************************


getItemSetData: get the Item-sets information
-needed to grab the Item-set title, and image for item header
-banner image can be set as thumbnail in Omeka installation
-new api call needed

printItemSet Header: prints the item-set header (banner)
-will replace displayItemsetBanner

printNav: prints the Item-set navigation for Chung, Lind and Stereographs using info grabbed from getItemSet
-will replace current printTabs
-perhaps will use dropdown

*******************************************************/

//gets the item-set data from Omeka - needed to get collection (item-set) titles and IDS to print the navigation and banner
async function getItemSetData(apiURL){
  cleanApiUrl = DOMPurify.sanitize(apiURL);//sanitize apiUrl just in case...

    let response = await fetch(cleanApiUrl)
      .then(response => {
        return response.json();
      })
      .catch(error => {
        console.error('Error:', error);
        document.getElementById("errorContainer").innerHTML = `Sorry, unable to get Item-Set data.  Please try again later`
      });  
    itemSetData = response;
    console.log(itemSetData); //just to check the data 
    printNav(response);
    printCurrentCollectionBanner(response);
    return(itemSetData);
}

//prints the dropdown collection selector
function printNav (theItemSetData){

  //add the collection dropdown 
  document.getElementById("collectionNav").innerHTML +=`
  <select name="collection" id="collectionSelect" aria-label="Select a Collection">
  <option value="${startingItemSetID}" disabled selected >Select Collection</option>
  </select>
  <button onclick="collectionPicked()" id="collectionButton">Go</button>
  `
  
  //add the items to the dropdown
  for (var results=0; results<theItemSetData.length; results++){
    
    let itemSetTitle = theItemSetData[results]?.['o:title'];
    let itemSetImageURL = theItemSetData[results]?.thumbnail_display_urls?.large;
    let itemSetCollectionID = theItemSetData[results]?.['o:id'];

    console.log(itemSetImageURL);
    document.getElementById("collectionSelect").innerHTML +=`   
      <option value=${itemSetCollectionID}>
      ${itemSetTitle}
      </option>
    
    `
  }

}

//adds the collection switching function to the dropdown within the navigation
function collectionPicked(){
  let collectionChosen = document.getElementById("collectionSelect");
  window.location = window.location.origin + window.location.pathname + "?itemSetID=" +collectionChosen.value;
}

//use the URL param itemSetID to determine which Banner should be shown
function printCurrentCollectionBanner(itemSetData){
    //check if Search was performed - if so display search banner
    console.log(itemSetID);
    console.log(cleanItemSetID);
    if (itemSetID==="search"){
        document.getElementById("collectionHeading").innerHTML = `Search Results`;
    }
    //else check for blank (no item set ID)
    else if (cleanItemSetID===""){
      console.log("Item set id is blank");
    }
    else{
      //retrieve array of currently chosen collection
      let convertedItemSetID = parseInt(cleanItemSetID);
      let result = itemSetData.find(item => item['o:id'] === convertedItemSetID);   
      let foundTitle = result['o:title'];
      
      //print the current banner to the banner div
      document.getElementById("collectionHeading").innerHTML = `${foundTitle}`;
    }
}








//the start of everything
kickOff();  





