/*********************************************************************************************************************
 * Omeka API - Test: Connect to Omeka API, grab key/values of ItemSet, display on page, and run Search API query
 * Omeka version tested: 4.0.1
 * 
 * 
 * Requires: HTML divs to be created...more info here..reduce to one div...
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
itemPlayerURL="https://gallery.library.ubc.ca/viewer/?itemID=";  //URL to where an instance of Mirador/Universal viewer is located, pass Item/ItemSet ID with URL params


globalItemsPerPage = 25;  //set number of Items per page inital load
perPageURL = "&per_page="+globalItemsPerPage;
pageURL = "&page=" //specific page number to be added in pagination function

//set default image if no item image found
defaultImage = "https://brand.ubc.ca/files/2018/09/Logos_1_2CrestDownload_768px.jpg";
//previous default image https://ask-library-dev.sites.olt.ubc.ca/files/2021/06/49827168481_719b1656a3_o.jpg

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
    console.log(itemSetID);
    if (itemSetID==null) {
      itemSetID = startingItemSetID; //if no itemSet is given in URL, display starting Item SetID
      console.log(itemSetID);
    }
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
    console.log(builtApiURL+"this is the built api url in getData");
    console.log(apiURL+"this is the apiUrl in getData");
    printPagination(itemCount,apiURL);
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
  //clearSearch(); //clear any existing search word 

  //toggle for collections
  klondike = buildApiURL(31);
  chung = buildApiURL(11);
  slides= 534;
  document.getElementById("tabs").innerHTML=`
    <div id="collectionToggle">
      <div class="toggleItem" onclick="getData('${chung}'); displayItemSetBanner('Chung Collection'); ">Chung Collection</div>        
      <div class="toggleItem" onclick="getData('${klondike}'); displayItemSetBanner('Lind Collection'); ">Lind Collection</div>
      <div class="toggleItem" onclick="clearSearch(${slides}); displayItemSetBanner('Stereographs and Glass Lantern slides'); ">Stereographs and Glass Lantern slides</div>
    </div>
  `;
   //testing button pressed for searching    
   tabListener = document.getElementById('collectionToggle');
   //tabListener.addEventListener("click", clearSearch);
 
  //displayItemSetBanner(); //print the related Item Set Banner
}

//clear the search when user clicks tabs
function clearSearch(theItemSetID){
    
    console.log("tab was clicked");
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

  //clear out any existing page numbers
  document.getElementById("pagination").innerHTML=``;
  
  console.log(builtURL+"this is the build url?");
  document.getElementById("pagination").innerHTML=`
    <p><strong>Pages</strong></p>
    `//end of pagination html block

    //print page numbers v2
    for (pageCount=1; pageCount< (numberOfPages+1); pageCount++){
      apiURL = builtURL+pageCount;
      console.log(apiURL);
      document.getElementById("pagination").innerHTML+=`
        <div class="pageNumber" onclick="getData('${apiURL}')"> ${pageCount} </div>
        
      `
    }

}


async function searchResults(){
  //clear existing info and display Search Results
  document.getElementById("results").innerHTML=`<p>Search Results</p>`
  goSearch = buildApiURL(); //build the API url to retrieve search results
  getData(goSearch);
}


function displayItemSetBanner(collectionName){
    if (itemSetID==11){
        document.getElementById("whatIdentification").innerHTML = 'Chung Collection';
      }
      else if (itemSetID==534){
        document.getElementById("whatIdentification").innerHTML = 'Stereographs and Glass Lantern slides';
      }
      else if (itemSetID==31){
        document.getElementById("whatIdentification").innerHTML = 'Lind Collection';
      }
    if (collectionName){  
    document.getElementById("whatIdentification").innerHTML = collectionName;
    }

}


//the start of everything
kickOff();  


