/*********************************************************************************************************************
 * Omeka API - Test: Connect to Omeka API, grab key/values of ItemSet, display on page, and run Search API query
 * Omeka version tested: 4.0.1
 * 
 * Requires: HTML divs to be created...more info here
 * 
 * Issues:
 * Multi-word searching hasn't been implemented 
 * 
 *********************************************************************************************************************/


/********************************************************************
 * Set your preferences and properties in this section
 * Plugin your preferred properties and API URL
 * 
 ********************************************************************/

startingItemSetID="534"; //set starting Item Set ID to display on load if none given

/* get url params - maybe this should be a function */
urlparams = new URL(window.location.toLocaleString());
itemSetID = urlparams.searchParams.get('itemSetID');


base_url="https://omeka-dev.library.ubc.ca/api/items?item_set_id="; //the Omeka Base API URL + item set id holder
search_url="https://omeka-dev.library.ubc.ca/api/items?fulltext_search=" //the Omeka Search API URL string - needed for any Search requests
itemPlayerURL="https://gallery.library.ubc.ca/viewer/?itemID=";  //URL to where an instance of Mirador player is located, pass Item/ItemSet ID with URL params


globalItemsPerPage = 15;  //set number of Items per page inital load
perPageURL = "&per_page="+globalItemsPerPage;
pageURL = "&page=" //specific page number to be added in pagination function

//set default image if no item image found
defaultImage = "https://ask-library-dev.sites.olt.ubc.ca/files/2021/06/49827168481_719b1656a3_o.jpg";


//testing button pressed for searching    
searchButton = document.getElementById('submitSearch');
searchButton.addEventListener("click", searchResults);


/********************************************************************
 * End of setting Properties ^
 * ******************************************************************
 * 
 * Start the grabby printy code >
 * 
 ********************************************************************/


//checks if an itemSetID was given in URL params - if not display the preferred default itemSet by shooting the ID to getData
function kickOff() {
    if (itemSetID==null) {
      itemSetID = startingItemSetID; //if no itemSet is given in URL, display starting Item SetID
    }
    apiURL = buildApiURL(itemSetID); //create the API url for the starting item set
    console.log(apiURL);
    getData(apiURL);  
    printTabs(); //print the tabs to toggle between item sets
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
    printPagination(itemCount,builtApiURL);
}

// build the API URL string
function buildApiURL (givenItemSetID, pageNumber){
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
        builtApiURL = base_url+givenItemSetID+perPageURL+pageURL;
        console.log(builtApiURL);
      }
  return (builtApiURL);
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
  //clear Search bar here - so clicking toggles does not get confused if Search was performed previously
  document.getElementById("searchInput").value = "";
  
  //toggle for collections
  klondike = buildApiURL(31);
  chung = buildApiURL(11);
  slides= buildApiURL(534);
  document.getElementById("tabs").innerHTML+=`
    <div id="collectionToggle">
      <div id="toggleItem" onclick="getData('${klondike}')">Phil Lind Klondike Goldrush</div>
      <div id="toggleItem" onclick="getData('${chung}')">Chung Collection</div>
      <div id="toggleItem" onclick="getData('${slides}')">Stereographs and Glass Lantern slides</div>
    </div>
  `;
}

//idea - insert function to run TAB getData separately - so we can add a clear the Search input area each time


//this grabs the key/values of each Item and Prints them to the Results div...maybe this function does too much
function printResults(dataBack){

  //clear any existing items in the results area
  document.getElementById("results").innerHTML=``;
 
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
          itemDescription = "No description available";
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

        itemPartOf = dataBack[results]?.['dcterms:isPartOf']?.[0]?.['@value'];

        itemDate = dataBack[results]?.['dcterms:date']?.[0]?.['@value'];
        itemSet = dataBack[results]?.['o:item_set']?.[0]?.['o:id'];
        
        itemMedia = dataBack[results]?.['o:media'];
        
        //print the Item to the page
        document.getElementById("results").innerHTML+=`

          <div class="singleResult">
            <div class="resultImage">
              <a href="${bigImage}"><img src="${itemImage}"></a>
            </div>
            <div id="resultInfo" class="resultInfo">
              <h2>${itemTitle}</h2>
                <p class="itemType">Type: ${itemType} <br>
                Part of: ${itemPartOf} <br>
                Date: ${itemDate} <br>
                Related Item Set: ${itemSet}
      
                </p>
              <p>${itemDescription}</p>
              <p><a href="${itemPlayerURL}${itemID}">View this item in mirador viewer</a><br>
              <a href="${bigImage}">View larger image</a></p>
            </div>
          </div>

          `//end of html block
          
          //check if the particular item has attached media
          checkHasMedia(itemMedia);
    }//end of if has title
  }//end of for loop
}//end of function


//check if an item has attached media files..by default items with an image appear to have at least one media item, so look for more than 1
function checkHasMedia (itemMediaArray){ 
  if (itemMedia.length > 1) {
    console.log(itemMedia.length);
    
    document.getElementById("results").innerHTML+=`
    <p class="itemType">This item has attached media: (Insert load collection in Mirador here?) </p>
    `
    for (loop=0; loop<itemMedia.length; loop++){
      itemMediaURL = itemMedia[loop]?.["@id"];
      document.getElementById("results").innerHTML+=`
      <a href="${itemMediaURL}">${loop}</a>, 
      `
    }
  }

}

function printPagination(numberOfResults, builtURL){

  //these variables are for determining pagination - how many pages should be created and how many items should be printed on each page
  itemsPerPage = globalItemsPerPage; //reset to global value every time this function is run
  
  
  numberOfPages = Math.ceil(numberOfResults / itemsPerPage); //round up number of pages to create
  
  //set itemsPerPage to numberOfResults if less than 1 page can be created
  if (numberOfPages<=1){itemsPerPage=numberOfResults}

  //clear out any existing page numbers
  document.getElementById("pagination").innerHTML=``;

  document.getElementById("pagination").innerHTML=`
    <p>There are this many Results found: ${numberOfResults}</p>
    <p>You should make this many pages: ${numberOfPages}</p>
    `//end of pagination html block

    //print page numbers v2
    for (pageCount=1; pageCount< (numberOfPages+1); pageCount++){
      apiURL = builtURL+pageCount;
      console.log(apiURL);
      document.getElementById("pagination").innerHTML+=`
        <div id="pageNumber" onclick="getData('${apiURL}')"> ${pageCount} </div>
        
      `
    }

}


async function searchResults(){
  //clear existing info and display Search Results
  document.getElementById("results").innerHTML=`<p>Search Results</p>`
  goSearch = buildApiURL(); //build the API url to retrieve search results
  getData(goSearch);
}

//the start of everything
kickOff(); 