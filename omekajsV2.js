/*********************************************************************************************************************
 * Omeka API - Connection Details: Connect to Omeka API, grab key/values of ItemSets, display results on page, and run Search API query
 * Omeka version tested: 4.0.1
 * 
 * 
 * Requires: 
 *   HTML div to be created: div id:"omekaContainer"
 *   Item Viewer (Universal viewer or Mirador to be loaded into separate page for Item Viewer functionality - see itemPlayerURL)
 *   DOMPurify - used to sanitize Search input and URL parameters (https://cdn.jsdelivr.net/gh/cure53/DOMPurify/dist/purify.js) - loaded within HTML 
 * 
 * Issues:
 *   banner images are manually defined in displayItemSetBanner - in future, banner images can be pulled from Omeka and displayed via the function printCurrentCollectionBanner
 *   see 'future functions' section
 *********************************************************************************************************************/


/********************************************************************
 * Set your preferences and properties in this section
 * Plugin your preferred properties and API URL
 * 
 ********************************************************************/

const startingItemSetID = "11"; //set starting Item Set ID to display on load if none given
let cleanedItemSetID; //to hold the itemSetID after sanitization

const base_url="https://omeka-dev.library.ubc.ca/api/"; //the Omeka Base API URL + item set id holder
const search_url= base_url + "items?fulltext_search=" //build the Omeka Search API URL string - needed for any Search requests
const itemPlayerURL="https://gallery.library.ubc.ca/viewer/?itemID=";  //URL to where an instance of Mirador/Universal viewer is located, pass the itemID with URL params; build manifest URL within that location
const item_url= base_url + "items?item_set_id="; //build the Omeka API URL for items within a given item set ID
const item_set_url = base_url + "item_sets"; //build the Omeka API URL to return information on the Item Sets

const globalItemsPerPage = 25;  //set number of Items per page inital load
const perPageURL = "&per_page="+globalItemsPerPage; //creating the url segment to set items per page
const pageURL = "&page="; //specific page number to be added in pagination function

const errorText = 'Sorry, unable to get data.  Please try again later'; //set error text shown when unable to retrieve data from Omeka

//set default item image if no item image is found
const defaultImage = "https://brand.ubc.ca/files/2018/09/Logos_1_2CrestDownload_768px.jpg";

//set Collection Banner images - in future - grab default collection image from Omeka so banners can be set from there
const collectionBannerDefaultImage = "https://gallery-library-20230501.sites.olt.ubc.ca/files/2023/11/empressOfAsiaBannerResults.jpg"; //default image
const chungBanner = "https://gallery-library-20230501.sites.olt.ubc.ca/files/2023/11/taylors_Croppedv2.jpg";
const stereographsBanner = "https://gallery-library-20230501.sites.olt.ubc.ca/files/2023/11/lanternSlideCropped.jpg";
const lindBanner = "https://gallery-library-20230501.sites.olt.ubc.ca/files/2023/11/lind_Cropped.jpg";

//Set Max Requests per Minute for rate limiting
const maxRequestPerMinute = 5;//how many times data from Omeka can be requested per minute


/********************************************************************
 * End of setting Properties ^
 * ******************************************************************
 * 
 * Start the grabby printy code >
 * 
 ********************************************************************/


//starts everything off - checks if an itemSetID was given in URL params - if none given, use the preferred default itemSet by sending the itemsetID to getData
async function kickOff() {
    let cleanItemSetID = await getItemSetID(); //get (or set) the item set id and sanitize it
    buildHTML(); //build the HTML containers for Omeka items and results
    displayItemSetBanner(cleanItemSetID); //temporary - will be removed when future function printCurrentCollectionBanner is completed
    let apiURL = await buildApiURL(cleanItemSetID); //create the API url for the starting item set
    console.log(apiURL);
    getData(apiURL);  
    getItemSetData(item_set_url); //for getting the collection item-set information
}

//gets and returns the starting item set ID to load in kickoff
async function getItemSetID(){
  let urlparams = new URL(window.location.toLocaleString());  /* get url params to load specific Item set into the results - ex: ?itemSetID=[item set ID in Omeka]*/
  let itemSetID = urlparams.searchParams.get('itemSetID'); 
  cleanedItemSetID = await sanitize(itemSetID); //sets a global variable - sanitize the itemSetID since it could be defined in URL params
  //check for no Item Set ID given in Url params
  if (cleanedItemSetID==="") {
    cleanedItemSetID = startingItemSetID; //if no itemSet is given in URL, display starting Item SetID
    console.log(cleanedItemSetID);
  }

  return cleanedItemSetID;
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
  //before getting the data, run the rate limiting function - returns false if limit exceeded
  var rateLimitCheck = checkLimit(); 
  if (rateLimitCheck==false){    
    return; //stop getData if the rate has been exceeded
  }

  //get the Omeka data and catch any errors
  try {
    let cleanApiUrl = await sanitize(apiURL); // first Sanitize the apiUrl just in case...   
    let response = await fetch(cleanApiUrl); //fetch the response from Omeka
    let responseData = await response.json(); //turn response into json

    console.log(...response.headers);  //the Omeka custom response headers (such as total results) are blocked by CORS - need to add special allowances in .htaccess...need headers for total results returned
    const itemCount = response.headers.get('omeka-s-total-results'); //get the total results - we need this for pagination later
    console.log(itemCount);
  
    console.log(responseData); //just to check the data
    printResults(responseData); //print the results to the page
    printPagination(itemCount, cleanApiUrl); //determine and print the pagination
  } 
  catch (error) {
    console.error('Error during getData:', error);
    showErrorMessage(errorText); //
  }
  window.scroll(0,0);   //move focus to top of page 
}

// build the API URL string
async function buildApiURL (givenItemSetID){
      //check to see if there was a search value inputted, adjust the api url if exists
      let enteredSearchWords = document.getElementById("searchInput").value;
      
      //sanitize the entered Search words
      cleanedSearchWords =  await sanitize(enteredSearchWords); 
      
      //determine if there is a search word, if not load the item set
      if (enteredSearchWords) {
        var builtApiURL = search_url+cleanedSearchWords+perPageURL+pageURL; //build the api url with the clean search words
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
//not sure if absolutely necessary, possible remove in future...could remove and reference the array value since this is only used for @type to determine type of item
function arrayToObjectHelper(itemArray){
  const newObj = {};
  itemArray.forEach(function(item){
     const keyValueArray = item.split(':');
     const key = keyValueArray[0];
     const value = keyValueArray[1];
     newObj[key] = value;
    });
  return newObj;
}

//this grabs the key/values of each Item and Prints them to the Results div...maybe this function does too much
function printResults(dataBack){

  //clear any existing items in the results area
  document.getElementById("results").innerHTML=``;

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
        let bigImage = dataBack[results]?.thumbnail_display_urls.large;
        let itemID = dataBack[results]?.['o:id'];      
        let itemIdentifier = dataBack[results]?.['dcterms:identifier']?.[0]?.['@value'];
        let itemPartOf = dataBack[results]?.['dcterms:isPartOf']?.[0]?.['@value'];
        let itemDate = dataBack[results]?.['dcterms:date']?.[0]?.['@value'];
        let itemSet = dataBack[results]?.['o:item_set']?.[0]?.['o:id'];
        
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
  cleanedItemSetID = "search";
  printCurrentCollectionBanner (itemSetData); //print the Search Banner using the Item-set data
  getData(goSearch); //get the Search response
}

//possibly remove this function after finalizing printCurrentCollectionBanner
function displayItemSetBanner(cleanItemSetID){
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
      else {
        collectionBannerImage = collectionBannerDefaultImage; //set default banner if item ID not found above
      }
    document.getElementById("collectionBackground").innerHTML = `<img src="${collectionBannerImage}"></img>`; 
}

//displays an error message to user if data is unable to be retrieved from Omeka-S
function showErrorMessage(text){
    document.getElementById("errorContainer").style.display = "block";
    document.getElementById("errorContainer").innerHTML = `${text}`;
}

//hides the error message to user 
function hideErrorMessage(text){
  document.getElementById("errorContainer").style.display = "none";  
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
  cleanApiUrl = await sanitize(apiURL);//sanitize apiUrl just in case...
  console.log("clean api url from getItemSetData",cleanApiUrl)
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
    
    console.log("printcurrentcollban itemsetID",cleanedItemSetID);
    if (cleanedItemSetID==="search"){
        document.getElementById("collectionHeading").innerHTML = `Search Results`;
    }
    else{
      //retrieve array of currently chosen collection
      let convertedItemSetID = parseInt(cleanedItemSetID);
      let result = itemSetData.find(item => item['o:id'] === convertedItemSetID);   
      let foundTitle = result['o:title'];
      
      //print the current banner to the banner div
      document.getElementById("collectionHeading").innerHTML = `${foundTitle}`;
    }
}

//function for rate limiting
function checkLimit(){
  const currentTime = Date.now();
  const a_Minute = 60000; //one minute is 60000 in this world
  const storedLastTime = parseInt(sessionStorage.getItem("lastRequestedTime")) || 0; //get the stored last recorded time or set it to 0 initially
  let currentIteration = parseInt(sessionStorage.getItem("storedCounter")) || 0; //get the current iteration or set it to 0 initially

  console.log(currentTime - storedLastTime);
  console.log(storedLastTime);

  // Reset the counter, Session Storage and update the timestamp IF elapsed time has been over a minute - OR this if first run currentTIme will always be greater than a minute in value
  if (currentTime - storedLastTime >= a_Minute) {
    
    console.log("hey it's been a minute")
    
    sessionStorage.setItem("storedCounter","1"); //set sessionStorage
    console.log("session storage value of the stored counter has been reset to:",sessionStorage.getItem("storedCounter"));
    console.log("current time is", currentTime);
    
    sessionStorage.setItem("lastRequestedTime",currentTime);
    console.log("last requested time is now:",sessionStorage.getItem('lastRequestedTime'));

    hideErrorMessage(); //removes the error rate limit message to user

  }

  //update iteration and store the value
  if (currentTime - storedLastTime < a_Minute){
    //theCurrentIteration = parseInt(currentIteration);
    currentIteration++;
    sessionStorage.setItem("storedCounter",currentIteration);
    console.log(currentIteration);
  }

  // Check if the number of requests exceeds the limit in a minute
  if (currentIteration >= maxRequestPerMinute && currentTime - storedLastTime < a_Minute) {
    console.log('Rate limit exceeded...time out for 1 minute');
    showErrorMessage("Rate limit exceeded. Please wait before making more requests.");
    return false;
  }


}


//the start of everything
kickOff();  





