//old test api URL from Github: https://raw.githubusercontent.com/Woodward-Library/Mirador_Multi_Manifests/main/src/items_2.json

startingItemSetID="534"; //set starting Item Set ID to display on load if none given

/* get url params */
urlparams = new URL(window.location.toLocaleString());
itemSetID = urlparams.searchParams.get('itemSetID');
console.log(itemSetID);
if (itemSetID==null) {itemSetID = startingItemSetID}; //if no itemSet is given in URL, display starting Item SetID


api_url="https://omeka-dev.library.ubc.ca/api/items?item_set_id="+itemSetID;
search_url="https://omeka-dev.library.ubc.ca/api/items?search="
itemPlayerURL="https://ask-library-dev.sites.olt.ubc.ca/omeka-embed-tests/?itemID=";


itemsPerPage = 10;  //set number of Items per page inital load
itemsPerPageURL = "&per_page="+ itemsPerPage;

//testing page numbers
page = 1;
pageURL = "&page="+page;
  
//set default image if no item image found
defaultImage = "https://ask-library-dev.sites.olt.ubc.ca/files/2021/06/49827168481_719b1656a3_o.jpg";


/* get url params */
urlparams = new URL(window.location.toLocaleString());
itemSetID = urlparams.searchParams.get('itemSetID');
console.log(itemSetID);

//testing button pressed for searching    
searchButton = document.getElementById('submitSearch');
searchButton.addEventListener("click", searchResults);

//gets the data from Omeka and send it to printResults
async function getData(){
    response = await fetch(api_url+itemsPerPageURL+pageURL);
    dataBack = await response.json();  
    console.log(dataBack); //just to check the data 
    itemCount=dataBack.length;
    console.log(itemCount);
    printResults(dataBack);  
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

function printResults(dataBack){
  
  numberOfResults = dataBack.length;
  
  for (var results=0; results<numberOfResults; results++){
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
     

     itemID = dataBack[results]?.['o:id'];

     itemPartOf = dataBack[results]?.['dcterms:isPartOf']?.[0]?.['@value'];

     itemDate = dataBack[results]?.['dcterms:date']?.[0]?.['@value'];
     itemSet = dataBack[results]?.['o:item_set']?.[0]?.['o:id'];
     
     document.getElementById("results").innerHTML+=`

      <div class="singleResult">
        <div class="resultImage">
          <img width="200px" height="200px" src="${itemImage}">
        </div>
        <div class="resultInfo">
           <h2>${itemTitle}</h2>
             <p class="itemType">Type: ${itemType} <br>
             Part of: ${itemPartOf} <br>
             Date: ${itemDate} <br>
             Related Item Set: ${itemSet}
             </p>
           <p>${itemDescription}</p>
           <p><a href="${itemPlayerURL}${itemID}">View this item in mirador viewer</a><br>
           View larger image</p>
        </div>
      </div>

      `//end of html block
  }
  //insert pagination function here ?
  printPagination(numberOfResults);
  
}


function printPagination(numberOfResults){
     document.getElementById("pagination").innerHTML+=`
       <p>There are this many Results found: ${numberOfResults}</p>
       
       `//end of pagination html block
  
}


async function searchResults(){
  //clear existing info
  document.getElementById("results").innerHTML=`<p>Search Results</p>`
  
  input = document.getElementById("searchInput").value;
   
  
  //get data again
    searchResponse = await fetch(search_url+input);
    dataBack = await searchResponse.json();  //i want my data back

    console.log(dataBack);
    printResults(dataBack);

}



getData();
