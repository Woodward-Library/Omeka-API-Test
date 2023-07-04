/*********************************************************************************************************************
 * Omeka API - Test: Connect to Omeka API, grab key/values of ItemSet, display on page, and run Search API query
 * Omeka version tested: 3.2.1
 * 
 * Requires: HTML divs to be created...more info here
 * 
 * 
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
search_url="https://omeka-dev.library.ubc.ca/api/items?search=" //the Omeka Search API URL string - needed for any Search requests
itemPlayerURL="https://ask-library-dev.sites.olt.ubc.ca/omeka-embed-tests/?itemID=";  //URL to where an instance of Mirador player is located, pass Item/ItemSet ID with URL params - open collection items there?


globalItemsPerPage = 5;  //set number of Items per page inital load
perPageURL = "&per_page="+globalItemsPerPage;
pageURL = "&page="

//set default image if no item image found
defaultImage = "https://ask-library-dev.sites.olt.ubc.ca/files/2021/06/49827168481_719b1656a3_o.jpg";


//testing button pressed for searching    
searchButton = document.getElementById('submitSearch');
searchButton.addEventListener("click", searchResults);

//wasSearch - used in getData to determine if we are getting a Search result or a specific item Set
/* removed july 4
var wasSearch = Boolean;
wasSearch = false;
*/

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
    getData(itemSetID);  
}


//gets the data from Omeka and send it to printResults
//this function needs an Error check!
async function getData(givenItemSetID, pageNumber){

    //checking to see if getData was run by Search to use appropriate API url, if not get item set results from base_url
    //idea - separate this if into another function - buildAPIURL - need to build urls
    
    //check to see if there was a search value inputted, adjust the api url if so
    checkSearch = document.getElementById("searchInput").value;
    if (checkSearch) {
      builtApiURL = search_url+checkSearch;
      console.log("hello");
    }
    else {
      builtApiURL = base_url+givenItemSetID+perPageURL+pageURL;
      console.log(builtApiURL);
    }

    //thre are specific headers we need to grab for total results in the response...this is just a note
    response = await fetch(builtApiURL)
      .then(response => {
        console.log(...response.headers);  //arg the custom response headers are blocked by CORS - need to add special allowances in .htaccess...
        
        getHeaderTotalResults = response.headers.get('omeka-s-total-results'); //just a test to see if we can grab a header value
        console.log (getHeaderTotalResults);  

        return response.json();
      })
      .catch(error => {
        console.error('Error:', error);
      });  
  
    dataBack = response;
    console.log(dataBack); //just to check the data 
    itemCount = getHeaderTotalResults; //set this to total results found in header
    printResults(dataBack);  
    printPagination(itemCount,builtApiURL);
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

//this grabs the key/values and prints them to the Results div...maybe this function does too much
function printResults(dataBack){



  //clear any existing results
  document.getElementById("results").innerHTML=``;

  //toggle for collections
  document.getElementById("results").innerHTML+=`
    <div id="collectionToggle">
      <div id="toggleItem" onclick="getData(31)">Phil Lind Klondike Goldrush</div>
      <div id="toggleItem" onclick="getData(11)">Chung Collection</div>
      <div id="toggleItem" onclick="getData(534)">Stereographs and Glass Lantern slides</div>
    </div>
  `;
   
  //needs catch for search results that are LESS than the global ITEMs per page! - results in error
  for (var results=0; results<globalItemsPerPage; results++){
    console.log(results); 
    itemTitle = dataBack[results]?.['o:title'];
     console.log(itemTitle);
      
     //check if description exists - using Optional Chaining - writing this here because I'll forget what it is called
    
     itemDescription = (dataBack[results]?.['dcterms:description']?.[0]?.['@value']);
     //check if no item description
     if (itemDescription==null){
       itemDescription = "No description available";
     }

    


     itemImage = dataBack[results]?.thumbnail_display_urls.square;
     
     itemTypeArray = dataBack[results]?.['@type'];
     itemTypeObj = arrayToObjectHelper(itemTypeArray);
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
     

     document.getElementById("results").innerHTML+=`

      <div class="singleResult">
        <div class="resultImage">
          <a href="${bigImage}"><img width="200px" height="200px" src="${itemImage}"></a>
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
  }
}

//need a function to get the Next Page data and attach it as link to page number pagination 
function getNextPageData(){
  //to be written - need to use per_page and page api calls

}

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
  
  numberOfPages = Math.ceil(numberOfResults / itemsPerPage);
    
  console.log(builtURL);

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
      document.getElementById("pagination").innerHTML+=`
        <a id="pageNumber" href="${builtURL}${pageCount}"> ${pageCount} </a>
      `
    }

  /*  v1 removed July 4th
  pageUrlMaker(numberOfPages);  //makes an array of unique onclick events to attach to each pageNumber

  //print page numbers
    for (pageCount=1; pageCount< (numberOfPages+1); pageCount++){
      document.getElementById("pagination").innerHTML+=`
        <a id="pageNumber" ${pageURLArray[pageCount]}> ${pageCount} </a>
      `
    }
  */
}

function pageUrlMaker(numberOfPages, apiCallType){
  pageURLArray = [];
  

  if (apiCallType==true){
    getDataCallPart = "null, true,";
  }
  else {
    getDataCallPart = apiCallType + ", null,";
  }
  for (page=0; page<=numberOfPages; page++) {
     getDataString = "getData("+getDataCallPart+page+ ")";
     getDataCall = "onclick=" +getDataString;
     setHREF = "alt='" +getDataString+ " ' ";
     pageURLArray[page]= getDataCall ;
  }
  return pageURLArray;
}

async function searchResults(){
  //clear existing info
  document.getElementById("results").innerHTML=`<p>Search Results</p>`
  
  
   
  
  //get data again old method
  /*  searchResponse = await fetch(search_url+input);
    dataBack = await searchResponse.json();  //i want my data back

    console.log(dataBack);
    printResults(dataBack);
    */

  //getData(null,true); //send true to getData and search for user-entered text
  getData();
}



kickOff();